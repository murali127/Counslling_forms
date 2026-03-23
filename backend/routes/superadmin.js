const express = require("express");
const router = express.Router();
const { authMiddleware, superAdminMiddleware } = require("../middlewares/authMiddleware");
const User = require("../models/User");
const Department = require("../models/Department");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const Admin = require("../models/admin"); 

const transporter = nodemailer.createTransport({
  service: "gmail", 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Verify transporter on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('[MAIL] ❌ Transporter verification failed:', error.message);
    console.error('[MAIL] Error code:', error.code);
  } else {
    console.log('[MAIL] ✅ Transporter ready. Emails will be sent from:', process.env.EMAIL_USER);
  }
});

console.log('[MAIL] Transporter initialized with user:', process.env.EMAIL_USER);

const getAdmissionPrefix = (rollNumber) => String(rollNumber || '').trim().slice(0, 3);

const getRegistrationYear = (rollNumber) => {
  const str = String(rollNumber || '').trim();
  if (str.length < 3 || str[0] !== '3') return null;
  const yearDigits = str.substring(1, 3);
  if (!/^\d{2}$/.test(yearDigits)) return null;
  return '20' + yearDigits;
};

const recalculateStudentYears = async () => {
  const students = await User.find({ role: 'user', isDeleted: { $ne: true } })
    .select('_id username yearOfStudy yearAssignmentMode')
    .lean();

  const prefixes = [...new Set(
    students.map((s) => getAdmissionPrefix(s.username)).filter((p) => /^\d{3}$/.test(p))
  )].sort((a, b) => Number(b) - Number(a));

  const rankByPrefix = {};
  prefixes.forEach((prefix, index) => {
    rankByPrefix[prefix] = index + 1;
  });

  const ops = students
    .map((student) => {
      if (student.yearAssignmentMode === 'manual') return null;
      const prefix = getAdmissionPrefix(student.username);
      const nextYear = rankByPrefix[prefix] || null;
      if (!nextYear || student.yearOfStudy === nextYear) return null;
      return {
        updateOne: {
          filter: { _id: student._id },
          update: { $set: { yearOfStudy: nextYear } }
        }
      };
    })
    .filter(Boolean);

  if (ops.length > 0) await User.bulkWrite(ops);

  return {
    updatedCount: ops.length,
    activePrefixes: prefixes,
    firstYearPrefix: prefixes[0] || null,
    manualLockedCount: students.filter((s) => s.yearAssignmentMode === 'manual').length
  };
};

const softDeleteRoleUser = async (roleUserId, actingUserId) => {
  const roleUser = await User.findOne({
    _id: roleUserId,
    role: { $in: ['admin', 'superadmin'] },
    isDeleted: { $ne: true }
  });

  if (!roleUser) return { status: 404, body: { error: 'User not found' } };

  if (String(roleUser._id) === String(actingUserId)) {
    return { status: 400, body: { error: 'You cannot delete your own account' } };
  }

  if (roleUser.role === 'superadmin') {
    const remaining = await User.countDocuments({
      role: 'superadmin',
      isDeleted: { $ne: true },
      _id: { $ne: roleUser._id }
    });
    if (remaining === 0) {
      return { status: 400, body: { error: 'At least one active superadmin must remain' } };
    }
  }

  if (roleUser.role === 'admin') {
    await User.updateMany(
      { assignedMentor: roleUser._id, role: 'user', isDeleted: { $ne: true } },
      { $unset: { assignedMentor: '' } }
    );
    await Admin.deleteOne({ email: roleUser.email });
  }

  roleUser.isDeleted = true;
  await roleUser.save();

  return { status: 200, body: { deletedId: roleUser._id, deletedRole: roleUser.role } };
};

// ============== GET SUPERADMIN FOR DEPARTMENT ENDPOINT ==============

router.get("/get-superadmin/:departmentId", authMiddleware, async (req, res, next) => {
  try {
    const { departmentId } = req.params;

    // Find the superadmin for this department
    const superadmin = await User.findOne({
      departmentId,
      role: 'superadmin',
      isDeleted: { $ne: true }
    }).select('_id username email role').lean();

    if (!superadmin) {
      return res.status(404).json({ error: 'No superadmin found for this department' });
    }

    res.json(superadmin);
  } catch (err) {
    console.error('[GET-SUPERADMIN] Error:', err);
    next(err);
  }
});

// ============== TEST EMAIL ENDPOINT ==============

router.post("/test-email", authMiddleware, superAdminMiddleware, async (req, res, next) => {
  try {
    const { testEmail } = req.body;
    
    if (!testEmail) {
      return res.status(400).json({ error: 'testEmail is required' });
    }

    console.log('[TEST-EMAIL] Attempting to send test email to:', testEmail);
    console.log('[TEST-EMAIL] Email config - USER:', process.env.EMAIL_USER);
    console.log('[TEST-EMAIL] Email config - PASSWORD exists:', !!process.env.EMAIL_PASSWORD);

    const testMailOptions = {
      from: process.env.EMAIL_USER,
      to: testEmail,
      subject: 'Test Email - Counselling Forms',
      html: `
        <h2>Test Email</h2>
        <p>This is a test email from the Counselling Forms system.</p>
        <p>If you received this, email is working correctly!</p>
        <p>Sent at: ${new Date().toLocaleString()}</p>
      `
    };

    const info = await transporter.sendMail(testMailOptions);
    console.log('[TEST-EMAIL] ✅ Test email sent! Message ID:', info.messageId);
    
    res.json({ 
      success: true,
      message: 'Test email sent successfully',
      messageId: info.messageId,
      sentTo: testEmail
    });
  } catch (err) {
    console.error('[TEST-EMAIL] ❌ Error:', err.message);
    console.error('[TEST-EMAIL] Full error:', err);
    res.status(500).json({ 
      error: 'Failed to send test email',
      details: err.message
    });
  }
});

// ============== CREATE ADMIN ENDPOINT ==============

router.post("/admins", authMiddleware, superAdminMiddleware, async (req, res, next) => {
  try {
    const { employee_name, employee_id, department, email } = req.body;

    // Get superadmin's department
    const superadminDept = await Department.findById(req.user.departmentId);
    if (!superadminDept) {
      return res.status(400).json({ error: 'Superadmin must be assigned to a department' });
    }

    // Verify department matches (case-insensitive)
    console.log(`[CREATE-ADMIN] Dept comparison - Sent: "${department}" | DB: "${superadminDept.name}"`);
    if (department.trim() !== superadminDept.name.trim()) {
      console.log(`[CREATE-ADMIN] Department mismatch! Sent length: ${department.length}, DB length: ${superadminDept.name.length}`);
      return res.status(403).json({ 
        error: 'You can only create admins for your department',
        debug: { sent: department, stored: superadminDept.name }
      });
    }

    // Check if Admin metadata already exists for this email in this department (case-insensitive)
    const existingAdminByEmail = await Admin.findOne({ 
      email: new RegExp(`^${email.trim()}$`, 'i'),
      department 
    });
    if (existingAdminByEmail) {
      return res.status(400).json({ error: "Admin with this email already exists in this department" });
    }

    // Also check by employee_id in the same department to prevent duplicate IDs
    if (employee_id) {
      const existingAdminById = await Admin.findOne({ 
        employee_id: employee_id.trim(),
        department 
      });
      if (existingAdminById) {
        return res.status(400).json({ error: "Admin with this employee ID already exists in this department" });
      }
    }

    // User can already exist (e.g., as superadmin or principal)
    let newUser = await User.findOne({ email });
    let isNewUser = false;
    let tempPassword = null;
    
    if (newUser) {
      // User exists, ensure they have admin role in their department
      if (newUser.departmentId && newUser.departmentId.toString() !== req.user.departmentId.toString()) {
        return res.status(400).json({ error: "This user belongs to a different department" });
      }
      // Update user's department if not set
      if (!newUser.departmentId) {
        newUser.departmentId = req.user.departmentId;
      }
      // Add admin role if not already present (can have multiple roles conceptually, but we use string)
      // For now, we just ensure the user record exists
      await newUser.save();
    } else {
      // Create new user with admin role
      isNewUser = true;
      tempPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      newUser = new User({
        username: employee_name,
        email,
        password: hashedPassword,
        role: "admin",
        departmentId: req.user.departmentId
      });
      await newUser.save();
    }

    // Create Admin metadata in admins collection
    const newAdmin = new Admin({
      employee_name,
      employee_id,
      department,
      email
    });
    await newAdmin.save();

    console.log(`[CREATE-ADMIN] Created admin: ${email}, ID: ${newAdmin._id}`);

    // Send email with credentials if new user was created
    if (isNewUser && tempPassword) {
      try {
        console.log(`[CREATE-ADMIN] Email check - USER: ${process.env.EMAIL_USER}, PWD exists: ${!!process.env.EMAIL_PASSWORD}`);
        
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
          console.warn('[CREATE-ADMIN] ⚠️ Email config missing - EMAIL_USER or EMAIL_PASSWORD not set');
        } else {
          const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Admin Account Created - Counselling Forms',
            html: `
              <h2>Welcome to Counselling Forms</h2>
              <p>Your admin account has been created for the <strong>${department}</strong> department.</p>
              
              <h3>Your Login Credentials:</h3>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Password:</strong> ${tempPassword}</p>
              
              <p style="color: red; font-weight: bold;">⚠️ Important: Please change your password immediately after first login.</p>
              
              <p style="margin-top: 20px;">You can now login to the Counselling Forms system.</p>
              <p style="margin-top: 20px; padding-top: 10px; border-top: 1px solid #ccc; color: #666; font-size: 12px;">
                If you did not request this account, please contact the administrator.
              </p>
            `
          };

          console.log(`[CREATE-ADMIN] 📧 Sending email to ${email} from ${process.env.EMAIL_USER}...`);
          const info = await transporter.sendMail(mailOptions);
          console.log(`[CREATE-ADMIN] ✅ Email sent successfully! Message ID: ${info.messageId}`);
        }
      } catch (emailErr) {
        console.error('[CREATE-ADMIN] ❌ Error sending email:', emailErr.message);
        console.error('[CREATE-ADMIN] Error details:', emailErr);
        // Don't block the response if email fails
      }
    }

    res.status(201).json({ 
      success: true,
      message: "Admin created successfully",
      admin: {
        _id: newAdmin._id,
        user_id: newUser._id,
        employee_name,
        employee_id,
        email,
        department,
        tempPassword: isNewUser ? tempPassword : undefined,
        emailSent: isNewUser
      }
    });

  } catch (err) { 
    console.error('[CREATE-ADMIN] Error:', err);
    next(err);
  }
});

// ============== GET ADMINS ENDPOINT ==============

router.get("/admins", authMiddleware, superAdminMiddleware, async (req, res, next) => {
  try {
    // Get superadmin's department
    const superadminDept = await Department.findById(req.user.departmentId);
    if (!superadminDept) {
      return res.status(400).json({ error: 'Superadmin must be assigned to a department' });
    }

    console.log(`[ADMINS] Fetching admins for department: ${superadminDept.name} (${superadminDept._id})`);

    // Find admins with matching department
    const admins = await Admin.find({ 
      department: superadminDept.name 
    }).lean();

    console.log(`[ADMINS] Found ${admins.length} admins in ${superadminDept.name} department`);

    const emails = admins.map(a => String(a.email || '').toLowerCase());
    const adminUsers = await User.find({ 
      email: { $in: emails }, 
      role: 'admin',
      departmentId: req.user.departmentId
    })
      .select('_id email hasLoggedIn isDeleted')
      .lean();

    const userMap = {};
    adminUsers.forEach(u => {
      userMap[String(u.email || '').toLowerCase()] = u;
    });

    const result = admins.map(a => {
      const user = userMap[String(a.email || '').toLowerCase()];
      return {
        ...a,
        userId: user?._id || null,
        hasLoggedIn: !!user?.hasLoggedIn,
        userDeleted: !!user?.isDeleted
      };
    });

    res.json(result);
  } catch (err) { 
    console.error('[ADMINS] Error:', err);
    next(err);
  }
});

// ============== DELETE ADMIN ENDPOINT ==============

router.delete("/admins/:id", authMiddleware, superAdminMiddleware, async (req, res, next) => {
  try {
    const adminMeta = await Admin.findById(req.params.id);
    if (!adminMeta) {
      return res.status(404).json({ error: "Admin metadata not found" });
    }

    // Verify admin is from the same department
    const superadminDept = await Department.findById(req.user.departmentId);
    if (!superadminDept || adminMeta.department !== superadminDept.name) {
      return res.status(403).json({ error: 'You can only manage admins from your department' });
    }

    const userAdmin = await User.findOne({ email: adminMeta.email, role: 'admin' });
    if (userAdmin) {
      // Unassign all students from this admin
      await User.updateMany(
        { assignedMentor: userAdmin._id, role: 'user' },
        { $unset: { assignedMentor: "" } }
      );

      // Hard delete the user from database
      await User.findByIdAndDelete(userAdmin._id);
    }

    await Admin.findByIdAndDelete(req.params.id);

    res.json({ message: "Admin deleted successfully" });
  } catch (err) { next(err); }
});

// ============== DELETE MANAGEMENT USER ENDPOINT (Alias for /admins/:id) ==============

router.delete("/management-users/:id", authMiddleware, superAdminMiddleware, async (req, res, next) => {
  try {
    const adminMeta = await Admin.findById(req.params.id);
    if (!adminMeta) {
      return res.status(404).json({ error: "Admin metadata not found" });
    }

    // Verify admin is from the same department
    const superadminDept = await Department.findById(req.user.departmentId);
    if (!superadminDept || adminMeta.department !== superadminDept.name) {
      return res.status(403).json({ error: 'You can only manage admins from your department' });
    }

    const userAdmin = await User.findOne({ email: adminMeta.email, role: 'admin' });
    if (userAdmin) {
      // Unassign all students from this admin
      await User.updateMany(
        { assignedMentor: userAdmin._id, role: 'user' },
        { $unset: { assignedMentor: "" } }
      );

      // Hard delete the user from database
      await User.findByIdAndDelete(userAdmin._id);
    }

    await Admin.findByIdAndDelete(req.params.id);

    console.log(`[DELETE-MANAGEMENT-USER] Deleted admin: ${req.params.id}`);
    res.json({ message: "Admin deleted successfully" });
  } catch (err) { 
    console.error('[DELETE-MANAGEMENT-USER] Error:', err);
    next(err); 
  }
});

// ============== BULK DELETE MANAGEMENT USERS ENDPOINT ==============

router.post("/management-users/bulk-delete", authMiddleware, superAdminMiddleware, async (req, res, next) => {
  try {
    const { userIds } = req.body;
    
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'userIds array required' });
    }

    const superadminDept = await Department.findById(req.user.departmentId);
    if (!superadminDept) {
      return res.status(400).json({ error: 'Superadmin must be assigned to a department' });
    }

    // Verify all admins are from the same department
    const adminMetas = await Admin.find({ _id: { $in: userIds } });
    
    const invalidAdmins = adminMetas.filter(a => a.department !== superadminDept.name);
    if (invalidAdmins.length > 0) {
      return res.status(403).json({ 
        error: 'You can only delete admins from your department',
        invalidCount: invalidAdmins.length
      });
    }

    // Delete each admin
    let deletedCount = 0;
    for (const adminId of userIds) {
      const adminMeta = await Admin.findById(adminId);
      if (!adminMeta) continue;

      // Find and hard-delete the user
      const userAdmin = await User.findOne({ email: adminMeta.email, role: 'admin' });
      if (userAdmin) {
        // Unassign students
        await User.updateMany(
          { assignedMentor: userAdmin._id, role: 'user' },
          { $unset: { assignedMentor: "" } }
        );

        // Hard delete the user from database
        await User.findByIdAndDelete(userAdmin._id);
      }

      // Delete admin metadata
      await Admin.findByIdAndDelete(adminId);
      deletedCount++;
    }

    console.log(`[BULK-DELETE-MANAGEMENT-USERS] Deleted ${deletedCount} admins`);
    res.json({ 
      message: `${deletedCount} admin(s) deleted successfully`,
      deleted: deletedCount
    });
  } catch (err) { 
    console.error('[BULK-DELETE-MANAGEMENT-USERS] Error:', err);
    next(err); 
  }
});

// ============== SEND MANAGEMENT USER DETAILS ENDPOINT (Alias for /admins/:id/send-details) ==============

router.post("/management-users/:id/send-details", authMiddleware, superAdminMiddleware, async (req, res, next) => {
  try {
    const adminMeta = await Admin.findById(req.params.id);
    if (!adminMeta) {
      return res.status(404).json({ error: "Admin metadata not found" });
    }

    // Verify admin is from the same department
    const superadminDept = await Department.findById(req.user.departmentId);
    if (!superadminDept || adminMeta.department !== superadminDept.name) {
      return res.status(403).json({ error: 'You can only manage admins from your department' });
    }

    const adminUser = await User.findOne({ email: adminMeta.email, role: 'admin', isDeleted: { $ne: true } });
    if (!adminUser) {
      return res.status(404).json({ error: "Admin user not found" });
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      return res.status(500).json({ error: 'Email configuration missing on server' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000;

    adminUser.resetPasswordToken = resetToken;
    adminUser.resetPasswordExpiry = resetTokenExpiry;
    await adminUser.save();

    const activateUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/activate-account/${resetToken}`;
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: adminUser.email,
      subject: 'Admin Account Activation',
      text:
        `Hello ${adminUser.username},\n\n` +
        `Your admin account is ready.\n\n` +
        `Email: ${adminUser.email}\n\n` +
        `Please activate your account and set your password:\n${activateUrl}\n\n` +
        `If you did not request this, please ignore this email.\n`
    };

    await transporter.sendMail(mailOptions);
    console.log(`[SEND-MANAGEMENT-USER-DETAILS] Sent details to admin: ${adminUser.email}`);
    res.json({ message: 'Admin activation details sent successfully.' });
  } catch (err) { 
    console.error('[SEND-MANAGEMENT-USER-DETAILS] Error:', err);
    next(err); 
  }
});

// ============== SEND ADMIN DETAILS ENDPOINT ==============

router.post("/admins/:id/send-details", authMiddleware, superAdminMiddleware, async (req, res, next) => {
  try {
    const adminMeta = await Admin.findById(req.params.id);
    if (!adminMeta) {
      return res.status(404).json({ error: "Admin metadata not found" });
    }

    // Verify admin is from the same department
    const superadminDept = await Department.findById(req.user.departmentId);
    if (!superadminDept || adminMeta.department !== superadminDept.name) {
      return res.status(403).json({ error: 'You can only manage admins from your department' });
    }

    const adminUser = await User.findOne({ email: adminMeta.email, role: 'admin', isDeleted: { $ne: true } });
    if (!adminUser) {
      return res.status(404).json({ error: "Admin user not found" });
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      return res.status(500).json({ error: 'Email configuration missing on server' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000;

    adminUser.resetPasswordToken = resetToken;
    adminUser.resetPasswordExpiry = resetTokenExpiry;
    await adminUser.save();

    const activateUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/activate-account/${resetToken}`;
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: adminUser.email,
      subject: 'Admin Account Activation',
      text:
        `Hello ${adminUser.username},\n\n` +
        `Your admin account is ready.\n\n` +
        `Email: ${adminUser.email}\n\n` +
        `Please activate your account and set your password:\n${activateUrl}\n\n` +
        `If you did not request this, please ignore this email.\n`
    };

    await transporter.sendMail(mailOptions);
    console.log(`[SEND-ADMIN-DETAILS] Sent details to admin: ${adminUser.email}`);
    res.json({ message: 'Admin activation details sent successfully.' });
  } catch (err) { 
    console.error('[SEND-ADMIN-DETAILS] Error:', err);
    next(err); 
  }
});

// ============== NOTIFY ADMIN ABOUT NEW STUDENTS ENDPOINT ==============

router.post("/admins/:id/notify", authMiddleware, superAdminMiddleware, async (req, res, next) => {
  try {
    const adminMeta = await Admin.findById(req.params.id);
    if (!adminMeta) {
      return res.status(404).json({ error: "Admin metadata not found" });
    }

    // Verify admin is from the same department
    const superadminDept = await Department.findById(req.user.departmentId);
    if (!superadminDept || adminMeta.department !== superadminDept.name) {
      return res.status(403).json({ error: 'You can only notify admins from your department' });
    }

    const adminUser = await User.findOne({ email: adminMeta.email });
    if (!adminUser) {
      return res.status(404).json({ error: "Admin user not found" });
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      return res.status(500).json({ error: 'Email configuration missing on server' });
    }

    // Get count of unassigned students in the department
    const unassignedCount = await User.countDocuments({
      role: 'user',
      departmentId: req.user.departmentId,
      $or: [
        { assignedMentor: { $exists: false } },
        { assignedMentor: null }
      ],
      isDeleted: { $ne: true }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: adminUser.email,
      subject: `New Student Batch Created - ${unassignedCount} Unassigned Students`,
      html: `
        <h2>New Student Batch Created</h2>
        <p>Hello ${adminUser.username},</p>
        <p>A new batch of students has been created in your department: <strong>${superadminDept.name}</strong></p>
        
        <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h3 style="margin-top: 0; color: #1976d2;">Summary:</h3>
          <p><strong>Total Unassigned Students:</strong> ${unassignedCount}</p>
          <p>These students are ready to be assigned to mentors.</p>
        </div>
        
        <p>Please log in to the Counselling Forms system to view and manage these students.</p>
        
        <p style="margin-top: 30px; color: #666; font-size: 12px;">
          This is an automated notification. Please do not reply to this email.
        </p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`[NOTIFY-ADMIN] Notification sent to admin: ${adminUser.email}`);
    res.json({ 
      message: 'Notification sent successfully',
      unassignedStudents: unassignedCount
    });
  } catch (err) { 
    console.error('[NOTIFY-ADMIN] Error:', err);
    next(err); 
  }
});

// ---------------- ROUTES ----------------

// ============== GET MANAGEMENT USERS (ADMINS) ENDPOINT ==============

router.get("/management-users", authMiddleware, superAdminMiddleware, async (req, res, next) => {
  try {
    const superadminDept = await Department.findById(req.user.departmentId);
    if (!superadminDept) {
      return res.status(400).json({ error: 'Superadmin must be assigned to a department' });
    }

    console.log(`[MANAGEMENT-USERS] Fetching admins for department: ${superadminDept.name}`);

    const admins = await Admin.find({ 
      department: superadminDept.name 
    }).lean();

    const emails = admins.map(a => String(a.email || '').toLowerCase());
    const adminUsers = await User.find({ 
      email: { $in: emails }, 
      role: 'admin',
      departmentId: req.user.departmentId,
      isDeleted: { $ne: true }
    })
      .select('_id email hasLoggedIn username role')
      .lean();

    const userMap = {};
    adminUsers.forEach(u => {
      userMap[String(u.email || '').toLowerCase()] = u;
    });

    const result = admins.map(a => {
      const user = userMap[String(a.email || '').toLowerCase()];
      return {
        _id: a._id,
        employee_name: user?.username || a.employee_name,
        username: user?.username || a.employee_name,
        employee_id: a.employee_id,
        email: a.email,
        department: a.department,
        role: user?.role || 'admin',
        userId: user?._id || null,
        hasLoggedIn: !!user?.hasLoggedIn
      };
    });

    res.json(result);
  } catch (err) { 
    console.error('[MANAGEMENT-USERS] Error:', err);
    next(err);
  }
});

// ============== GET STUDENTS ENDPOINT ==============

router.get("/students", authMiddleware, superAdminMiddleware, async (req, res, next) => {
  try {
    console.log(`[STUDENTS] Fetching students for department: ${req.user.departmentId}`);
    
    const students = await User.find({ 
      role: "user",
      departmentId: req.user.departmentId,
      isDeleted: { $ne: true }
    }).select('username email _id role assignedMentor yearOfStudy');
    
    console.log(`[STUDENTS] Found ${students.length} students`);
    
    res.json(students);
  } catch (err) {
    console.error('[STUDENTS] Error:', err);
    next(err);
  }
});

// ============== GET MENTORS WITH STUDENTS ENDPOINT ==============

router.get("/mentors-with-students", authMiddleware, superAdminMiddleware, async (req, res, next) => {
  try {
    console.log(`[MENTORS-WITH-STUDENTS] Fetching mentors for department: ${req.user.departmentId}`);

    const mentors = await User.find({
      role: "admin",
      departmentId: req.user.departmentId,
      isDeleted: { $ne: true }
    }).select('_id username email').lean();

    console.log(`[MENTORS-WITH-STUDENTS] Found ${mentors.length} mentors`);

    const mentorIds = mentors.map(m => m._id);
    const studentsByMentor = await User.find({
      role: "user",
      assignedMentor: { $in: mentorIds },
      departmentId: req.user.departmentId,
      isDeleted: { $ne: true }
    }).select('_id username email assignedMentor yearOfStudy').lean();

    const result = mentors.map(mentor => ({
      ...mentor,
      students: studentsByMentor.filter(s => String(s.assignedMentor) === String(mentor._id))
    }));

    res.json(result);
  } catch (err) {
    console.error('[MENTORS-WITH-STUDENTS] Error:', err);
    next(err);
  }
});

// ============== GET UNASSIGNED STUDENTS ENDPOINT ==============

router.get("/unassigned-students", authMiddleware, superAdminMiddleware, async (req, res, next) => {
  try {
    console.log(`[UNASSIGNED-STUDENTS] Fetching for department: ${req.user.departmentId}`);

    const students = await User.find({
      role: "user",
      departmentId: req.user.departmentId,
      $or: [
        { assignedMentor: { $exists: false } },
        { assignedMentor: null }
      ],
      isDeleted: { $ne: true }
    }).select('_id username email yearOfStudy').lean();

    console.log(`[UNASSIGNED-STUDENTS] Found ${students.length} unassigned students`);

    res.json(students);
  } catch (err) {
    console.error('[UNASSIGNED-STUDENTS] Error:', err);
    next(err);
  }
});

// ============== GET STUDENTS WITH PROFILES ENDPOINT ==============

router.get("/students-with-profiles", authMiddleware, superAdminMiddleware, async (req, res, next) => {
  try {
    console.log(`[STUDENTS-WITH-PROFILES] Fetching for department: ${req.user.departmentId}`);

    const students = await User.find({
      role: "user",
      departmentId: req.user.departmentId,
      isDeleted: { $ne: true }
    }).select('_id username email assignedMentor yearOfStudy').lean();

    const studentIds = students.map(s => s._id);
    const Profile = require("../models/Profile");
    const profiles = await Profile.find({
      userId: { $in: studentIds }
    }).lean();

    const profileMap = {};
    profiles.forEach(p => {
      profileMap[String(p.userId)] = p;
    });

    const result = students.map(student => ({
      ...student,
      profile: profileMap[String(student._id)] || null
    }));

    res.json(result);
  } catch (err) {
    console.error('[STUDENTS-WITH-PROFILES] Error:', err);
    next(err);
  }
});

// ============== ASSIGN STUDENTS ENDPOINT ==============

router.post("/assign-students", authMiddleware, superAdminMiddleware, async (req, res, next) => {
  try {
    const { studentIds, mentorId } = req.body;

    if (!Array.isArray(studentIds) || !mentorId) {
      return res.status(400).json({ error: 'studentIds array and mentorId required' });
    }

    // Verify mentor exists and is from same department
    const mentor = await User.findOne({
      _id: mentorId,
      role: "admin",
      departmentId: req.user.departmentId,
      isDeleted: { $ne: true }
    });

    if (!mentor) {
      return res.status(400).json({ error: 'Mentor not found or not from your department' });
    }

    // Verify all students are from same department
    const students = await User.find({
      _id: { $in: studentIds },
      role: "user",
      departmentId: req.user.departmentId,
      isDeleted: { $ne: true }
    });

    if (students.length !== studentIds.length) {
      return res.status(400).json({ error: 'Some students not found or not from your department' });
    }

    // Assign students to mentor
    const result = await User.updateMany(
      { _id: { $in: studentIds } },
      { $set: { assignedMentor: mentorId } }
    );

    console.log(`[ASSIGN-STUDENTS] Assigned ${result.modifiedCount} students to mentor ${mentorId}`);

    res.json({ 
      message: 'Students assigned successfully',
      assigned: result.modifiedCount
    });
  } catch (err) {
    console.error('[ASSIGN-STUDENTS] Error:', err);
    next(err);
  }
});

// ============== UNASSIGN STUDENTS ENDPOINT ==============

router.post("/unassign-students", authMiddleware, superAdminMiddleware, async (req, res, next) => {
  try {
    const { studentIds } = req.body;

    if (!Array.isArray(studentIds)) {
      return res.status(400).json({ error: 'studentIds array required' });
    }

    // Verify all students are from same department
    const students = await User.find({
      _id: { $in: studentIds },
      role: "user",
      departmentId: req.user.departmentId,
      isDeleted: { $ne: true }
    });

    if (students.length !== studentIds.length) {
      return res.status(400).json({ error: 'Some students not found or not from your department' });
    }

    // Unassign students
    const result = await User.updateMany(
      { _id: { $in: studentIds } },
      { $unset: { assignedMentor: "" } }
    );

    console.log(`[UNASSIGN-STUDENTS] Unassigned ${result.modifiedCount} students`);

    res.json({ 
      message: 'Students unassigned successfully',
      unassigned: result.modifiedCount
    });
  } catch (err) {
    console.error('[UNASSIGN-STUDENTS] Error:', err);
    next(err);
  }
});

// ============== RECALCULATE STUDENT YEARS ENDPOINT ==============

router.post('/students/recalculate-years', authMiddleware, superAdminMiddleware, async (req, res, next) => {
  try {
    const summary = await recalculateStudentYears();

    const activeStudents = await User.find({
      role: 'user',
      isDeleted: { $ne: true }
    })
      .select('username email yearOfStudy')
      .lean();

    const yearWiseCounts = activeStudents.reduce((acc, student) => {
      const yearKey = String(student.yearOfStudy || 'unknown');
      acc[yearKey] = (acc[yearKey] || 0) + 1;
      return acc;
    }, {});

    res.status(200).json({
      message: 'Year recalculation completed successfully',
      updatedCount: summary.updatedCount,
      activePrefixes: summary.activePrefixes,
      firstYearPrefix: summary.firstYearPrefix,
      manualLockedCount: summary.manualLockedCount,
      yearWiseCounts
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;