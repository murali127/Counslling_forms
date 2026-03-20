const express = require("express");
const router = express.Router();
const { authMiddleware, principalMiddleware } = require("../middlewares/authMiddleware");
const User = require("../models/User");
const Department = require("../models/Department");
const Profile = require("../models/Profile");
const Admin = require('../models/admin');
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

const sendAccountMail = async ({ email, username, role, tempPassword, departmentName }) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `${role.toUpperCase()} Account Created - Counselling Forms`,
    text:
      `Hello ${username},\n\n` +
      `Your ${role} account has been created${departmentName ? ` for ${departmentName}` : ''}.\n` +
      `Email: ${email}\n` +
      `Temporary Password: ${tempPassword}\n\n` +
      `Please login and update your password.\n`
  };
  await transporter.sendMail(mailOptions);
};

const syncSuperadminDepartment = async ({ superadmin, nextDepartmentId }) => {
  if (!superadmin) return;

  const previousDepartmentId = superadmin.departmentId ? String(superadmin.departmentId) : null;
  const newDepartmentId = nextDepartmentId ? String(nextDepartmentId) : null;

  if (previousDepartmentId && previousDepartmentId !== newDepartmentId) {
    await Department.findByIdAndUpdate(previousDepartmentId, {
      $pull: { assignedSuperadmins: superadmin._id }
    });
  }

  if (newDepartmentId) {
    await Department.findByIdAndUpdate(newDepartmentId, {
      $addToSet: { assignedSuperadmins: superadmin._id }
    });
  }

  superadmin.departmentId = nextDepartmentId || null;
  await superadmin.save();
};

// GET /departments - List all departments with assigned superadmins
router.get('/departments', authMiddleware, principalMiddleware, async (req, res) => {
  try {
    const departments = await Department.find({})
      .populate('assignedSuperadmins', 'username email')
      .sort({ name: 1 });

    res.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// POST /departments - Create department
router.post('/departments', authMiddleware, principalMiddleware, async (req, res) => {
  try {
    const { name, code, superadminId } = req.body;
    if (!name || !code) {
      return res.status(400).json({ error: 'Department name and code are required' });
    }

    const normalizedCode = String(code).trim().toUpperCase();
    const existingCode = await Department.findOne({ code: normalizedCode });
    if (existingCode) {
      return res.status(400).json({ error: 'Department code already exists' });
    }

    const department = await Department.create({
      name: String(name).trim(),
      code: normalizedCode
    });

    if (superadminId) {
      const superadmin = await User.findOne({ _id: superadminId, role: 'superadmin', isDeleted: { $ne: true } });
      if (!superadmin) {
        return res.status(404).json({ error: 'Super admin not found' });
      }
      await syncSuperadminDepartment({ superadmin, nextDepartmentId: department._id });
    }

    const populatedDepartment = await Department.findById(department._id)
      .populate('assignedSuperadmins', 'username email')
      .lean();

    res.status(201).json({ message: 'Department created successfully', department: populatedDepartment });
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({ error: 'Failed to create department' });
  }
});

// PUT /departments/:id - Update department
router.put('/departments/:id', authMiddleware, principalMiddleware, async (req, res) => {
  try {
    const { name, code, superadminId } = req.body;
    if (!name || !code) {
      return res.status(400).json({ error: 'Department name and code are required' });
    }

    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    const normalizedCode = String(code).trim().toUpperCase();
    const duplicateCode = await Department.findOne({ code: normalizedCode, _id: { $ne: department._id } });
    if (duplicateCode) {
      return res.status(400).json({ error: 'Department code already exists' });
    }

    const oldDepartmentName = department.name;
    department.name = String(name).trim();
    department.code = normalizedCode;
    await department.save();

    if (oldDepartmentName !== department.name) {
      await Admin.updateMany(
        { department: oldDepartmentName },
        { $set: { department: department.name } }
      );
    }

    if (superadminId !== undefined) {
      if (superadminId) {
        const superadmin = await User.findOne({ _id: superadminId, role: 'superadmin', isDeleted: { $ne: true } });
        if (!superadmin) {
          return res.status(404).json({ error: 'Super admin not found' });
        }
        await syncSuperadminDepartment({ superadmin, nextDepartmentId: department._id });
      }
    }

    const populatedDepartment = await Department.findById(department._id)
      .populate('assignedSuperadmins', 'username email')
      .lean();

    res.json({ message: 'Department updated successfully', department: populatedDepartment });
  } catch (error) {
    console.error('Error updating department:', error);
    res.status(500).json({ error: 'Failed to update department' });
  }
});

// DELETE /departments/:id - Delete department if no active users are mapped
router.delete('/departments/:id', authMiddleware, principalMiddleware, async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    const mappedUsers = await User.countDocuments({ departmentId: department._id, isDeleted: { $ne: true } });
    if (mappedUsers > 0) {
      return res.status(400).json({ error: 'Cannot delete department with active users' });
    }

    await Department.findByIdAndDelete(department._id);
    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({ error: 'Failed to delete department' });
  }
});

// GET /departments/:id - Get department by ID (accessible to any authenticated user)
router.get('/departments/:id', authMiddleware, async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }
    res.json(department);
  } catch (error) {
    console.error('Error fetching department:', error);
    res.status(500).json({ error: 'Failed to fetch department' });
  }
});

// POST /assign-superadmin - Assign superadmin to department
router.post('/assign-superadmin', authMiddleware, principalMiddleware, async (req, res) => {
  const { departmentId, email } = req.body;

  // Validate input
  if (!departmentId || !email) {
    return res.status(400).json({ error: 'Department ID and email are required' });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  try {
    // Check if department exists
    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    // Check if user already exists
    let user = await User.findOne({ email });
    let tempPassword = null;
    let isNewUser = false;

    if (user) {
      // If user exists but not superadmin, promote them
      if (user.role !== 'superadmin') {
        user.role = 'superadmin';
        user.departmentId = departmentId;
        await user.save();
      } else {
        // If already superadmin, check if assigned to another department
        if (user.departmentId && user.departmentId.toString() !== departmentId) {
          return res.status(400).json({ error: 'User is already assigned to another department' });
        }
        user.departmentId = departmentId;
        await user.save();
      }
    } else {
      // Create new superadmin user
      isNewUser = true;
      tempPassword = crypto.randomBytes(8).toString('hex');
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      user = new User({
        username: email.split('@')[0],
        email,
        password: hashedPassword,
        role: 'superadmin',
        departmentId
      });
      await user.save();
    }

    // Update department's assigned superadmins
    if (!department.assignedSuperadmins.includes(user._id)) {
      department.assignedSuperadmins.push(user._id);
      await department.save();
    }

    // Send email (both for new and existing users being promoted)
    // Do this asynchronously so it doesn't block the response
    (async () => {
      try {
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'Super Admin Account - Counselling Forms',
          html: `
            <h2>Welcome to Counselling Forms</h2>
            <p>You have been assigned as a Super Admin for the <strong>${department.name}</strong> department.</p>
            <p><strong>Department Code:</strong> ${department.code}</p>
            ${isNewUser ? `
              <p><strong>Your Login Credentials:</strong></p>
              <p>Email: <strong>${email}</strong></p>
              <p>Password: <strong>${tempPassword}</strong></p>
              <p style="color: red;"><strong>⚠️ Important:</strong> Please change your password immediately after first login.</p>
            ` : `
              <p>Your account has been promoted to Super Admin role. You can now login with your existing credentials.</p>
            `}
            <p style="margin-top: 20px; padding-top: 10px; border-top: 1px solid #ccc;">
              If you have any issues accessing your account, please contact the principal.
            </p>
          `
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent successfully to ${email}`);
      } catch (emailError) {
        console.error(`❌ Failed to send email to ${email}:`, emailError.message);
        // Email failure should not fail the whole assignment
      }
    })();

    res.json({
      message: 'Super Admin assigned successfully',
      success: true,
      emailNotification: 'Credentials will be sent to the registered email',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        departmentId: user.departmentId,
        hasLoggedIn: user.hasLoggedIn,
        isDeleted: user.isDeleted,
        yearAssignmentMode: user.yearAssignmentMode,
        createdAt: user.createdAt
      },
      department: {
        _id: department._id,
        name: department.name,
        code: department.code
      }
    });

  } catch (error) {
    console.error('Error assigning superadmin:', error);
    res.status(500).json({ error: 'Failed to assign superadmin' });
  }
});

// DELETE /unassign-superadmin/:userId - Delete superadmin and their profile from database
router.delete('/unassign-superadmin/:userId', authMiddleware, principalMiddleware, async (req, res) => {
  const { userId } = req.params;

  try {
    console.log(`[DEASSIGN] Starting deassign for userId: ${userId}`);

    const user = await User.findById(userId);
    console.log(`[DEASSIGN] User found:`, user ? `${user.email} (${user.role})` : 'NOT FOUND');
    
    if (!user || user.role !== 'superadmin') {
      console.log(`[DEASSIGN] User not found or not a superadmin`);
      return res.status(404).json({ error: 'Super Admin not found' });
    }

    // Remove from department's assignedSuperadmins
    const department = await Department.findById(user.departmentId);
    if (department) {
      console.log(`[DEASSIGN] Removing from department: ${department.name}`);
      department.assignedSuperadmins = department.assignedSuperadmins.filter(
        id => id.toString() !== userId
      );
      await department.save();
      console.log(`[DEASSIGN] Department updated`);
    }

    // Delete user's profile
    const profileDeleteResult = await Profile.deleteOne({ userId: userId });
    console.log(`[DEASSIGN] Profile deletion result:`, profileDeleteResult.deletedCount, 'deleted');

    // Delete the user record
    const userDeleteResult = await User.findByIdAndDelete(userId);
    console.log(`[DEASSIGN] User deleted:`, userDeleteResult ? userDeleteResult.email : 'NOT FOUND');

    console.log(`[DEASSIGN] ✅ Successfully deleted superadmin and profile`);
    res.json({ 
      success: true,
      message: 'Super Admin and profile deleted successfully',
      deletedUser: {
        email: userDeleteResult?.email,
        username: userDeleteResult?.username
      }
    });

  } catch (error) {
    console.error('[DEASSIGN] ❌ Error deleting superadmin:', error);
    res.status(500).json({ 
      error: 'Failed to delete superadmin',
      details: error.message
    });
  }
});

// GET /superadmins - Get all superadmins with department info
router.get('/superadmins', authMiddleware, principalMiddleware, async (req, res) => {
  try {
    const superadmins = await User.find({ role: 'superadmin', isDeleted: false })
      .populate('departmentId', 'name code')
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: superadmins
    });
  } catch (error) {
    console.error('Error fetching superadmins:', error);
    res.status(500).json({ error: 'Failed to fetch superadmins' });
  }
});

// POST /superadmins - Create superadmin with optional department assignment
router.post('/superadmins', authMiddleware, principalMiddleware, async (req, res) => {
  try {
    const { username, email, departmentId } = req.body;
    if (!username || !email) {
      return res.status(400).json({ error: 'username and email are required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail, isDeleted: { $ne: true } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    let department = null;
    if (departmentId) {
      department = await Department.findById(departmentId);
      if (!department) {
        return res.status(404).json({ error: 'Department not found' });
      }
    }

    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const superadmin = await User.create({
      username: String(username).trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: 'superadmin',
      departmentId: department?._id || null
    });

    if (department) {
      department.assignedSuperadmins.addToSet(superadmin._id);
      await department.save();
    }

    try {
      await sendAccountMail({
        email: superadmin.email,
        username: superadmin.username,
        role: 'superadmin',
        tempPassword,
        departmentName: department?.name
      });
    } catch (emailErr) {
      console.error('[PRINCIPAL-CREATE-SUPERADMIN] Email failed:', emailErr.message);
    }

    res.status(201).json({ message: 'Super admin created successfully', superadmin });
  } catch (error) {
    console.error('Error creating superadmin:', error);
    res.status(500).json({ error: 'Failed to create superadmin' });
  }
});

// PATCH /superadmins/:id - Update superadmin details and assignment
router.patch('/superadmins/:id', authMiddleware, principalMiddleware, async (req, res) => {
  try {
    const { username, email, departmentId } = req.body;
    const superadmin = await User.findOne({ _id: req.params.id, role: 'superadmin', isDeleted: { $ne: true } });
    if (!superadmin) {
      return res.status(404).json({ error: 'Super admin not found' });
    }

    if (email && String(email).trim().toLowerCase() !== String(superadmin.email).toLowerCase()) {
      const duplicateEmail = await User.findOne({
        email: String(email).trim().toLowerCase(),
        _id: { $ne: superadmin._id },
        isDeleted: { $ne: true }
      });
      if (duplicateEmail) {
        return res.status(400).json({ error: 'Another user already uses this email' });
      }
      superadmin.email = String(email).trim().toLowerCase();
    }

    if (username) {
      superadmin.username = String(username).trim();
    }

    if (departmentId !== undefined) {
      if (!departmentId) {
        await syncSuperadminDepartment({ superadmin, nextDepartmentId: null });
      } else {
        const department = await Department.findById(departmentId);
        if (!department) {
          return res.status(404).json({ error: 'Department not found' });
        }
        await syncSuperadminDepartment({ superadmin, nextDepartmentId: department._id });
      }
    } else {
      await superadmin.save();
    }

    const updated = await User.findById(superadmin._id)
      .populate('departmentId', 'name code')
      .select('-password');
    res.json({ message: 'Super admin updated successfully', superadmin: updated });
  } catch (error) {
    console.error('Error updating superadmin:', error);
    res.status(500).json({ error: 'Failed to update superadmin' });
  }
});

// DELETE /superadmins/:id - Delete superadmin
router.delete('/superadmins/:id', authMiddleware, principalMiddleware, async (req, res) => {
  try {
    const superadmin = await User.findOne({ _id: req.params.id, role: 'superadmin', isDeleted: { $ne: true } });
    if (!superadmin) {
      return res.status(404).json({ error: 'Super admin not found' });
    }

    await syncSuperadminDepartment({ superadmin, nextDepartmentId: null });
    await Profile.deleteOne({ userId: superadmin._id });
    await User.findByIdAndDelete(superadmin._id);

    res.json({ message: 'Super admin deleted successfully' });
  } catch (error) {
    console.error('Error deleting superadmin:', error);
    res.status(500).json({ error: 'Failed to delete superadmin' });
  }
});

// GET /admins - List admins
router.get('/admins', authMiddleware, principalMiddleware, async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin', isDeleted: { $ne: true } })
      .select('-password')
      .populate('departmentId', 'name code')
      .populate('assignedSuperadmin', 'username email')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: admins });
  } catch (error) {
    console.error('Error fetching admins:', error);
    res.status(500).json({ error: 'Failed to fetch admins' });
  }
});

// PATCH /admins/:id - Update admin details
router.patch('/admins/:id', authMiddleware, principalMiddleware, async (req, res) => {
  try {
    const { username, email, departmentId, assignedSuperadmin } = req.body;
    const adminUser = await User.findOne({ _id: req.params.id, role: 'admin', isDeleted: { $ne: true } });
    if (!adminUser) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    if (email && String(email).trim().toLowerCase() !== String(adminUser.email).toLowerCase()) {
      const duplicateEmail = await User.findOne({
        email: String(email).trim().toLowerCase(),
        _id: { $ne: adminUser._id },
        isDeleted: { $ne: true }
      });
      if (duplicateEmail) {
        return res.status(400).json({ error: 'Another user already uses this email' });
      }
      adminUser.email = String(email).trim().toLowerCase();
    }

    if (username) {
      adminUser.username = String(username).trim();
    }

    if (departmentId !== undefined) {
      if (departmentId) {
        const department = await Department.findById(departmentId);
        if (!department) {
          return res.status(404).json({ error: 'Department not found' });
        }
        adminUser.departmentId = department._id;
      } else {
        adminUser.departmentId = null;
      }
    }

    if (assignedSuperadmin !== undefined) {
      if (!assignedSuperadmin) {
        adminUser.assignedSuperadmin = null;
      } else {
        const superadminUser = await User.findOne({
          _id: assignedSuperadmin,
          role: 'superadmin',
          isDeleted: { $ne: true }
        });
        if (!superadminUser) {
          return res.status(404).json({ error: 'Super admin not found' });
        }
        adminUser.assignedSuperadmin = superadminUser._id;
      }
    }

    await adminUser.save();

    await Admin.updateOne(
      { email: adminUser.email },
      {
        $set: {
          employee_name: adminUser.username,
          email: adminUser.email,
          department: adminUser.departmentId ? (await Department.findById(adminUser.departmentId))?.name || 'Unassigned' : 'Unassigned'
        }
      }
    );

    const updated = await User.findById(adminUser._id)
      .select('-password')
      .populate('departmentId', 'name code')
      .populate('assignedSuperadmin', 'username email');

    res.json({ message: 'Admin updated successfully', admin: updated });
  } catch (error) {
    console.error('Error updating admin:', error);
    res.status(500).json({ error: 'Failed to update admin' });
  }
});

// DELETE /admins/:id - Delete admin and unassign linked students
router.delete('/admins/:id', authMiddleware, principalMiddleware, async (req, res) => {
  try {
    const adminUser = await User.findOne({ _id: req.params.id, role: 'admin', isDeleted: { $ne: true } });
    if (!adminUser) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    await User.updateMany(
      { assignedMentor: adminUser._id, role: 'user' },
      { $unset: { assignedMentor: '' } }
    );

    await Admin.deleteOne({ email: adminUser.email });
    await Profile.deleteOne({ userId: adminUser._id });
    await User.findByIdAndDelete(adminUser._id);

    res.json({ message: 'Admin deleted successfully' });
  } catch (error) {
    console.error('Error deleting admin:', error);
    res.status(500).json({ error: 'Failed to delete admin' });
  }
});

// PATCH /admins/assign-superadmin - Assign one superadmin to multiple admins
router.patch('/admins/assign-superadmin', authMiddleware, principalMiddleware, async (req, res) => {
  try {
    const { adminIds, superadminId } = req.body;
    if (!Array.isArray(adminIds) || adminIds.length === 0) {
      return res.status(400).json({ error: 'adminIds array is required' });
    }

    let superadminUser = null;
    if (superadminId) {
      superadminUser = await User.findOne({ _id: superadminId, role: 'superadmin', isDeleted: { $ne: true } });
      if (!superadminUser) {
        return res.status(404).json({ error: 'Super admin not found' });
      }
    }

    const result = await User.updateMany(
      { _id: { $in: adminIds }, role: 'admin', isDeleted: { $ne: true } },
      { $set: { assignedSuperadmin: superadminUser?._id || null } }
    );

    res.json({
      message: superadminUser ? 'Admins assigned to superadmin successfully' : 'Admin-superadmin assignments cleared successfully',
      updatedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error assigning admins to superadmin:', error);
    res.status(500).json({ error: 'Failed to update admin-superadmin assignments' });
  }
});

// GET /overview - Principal overview with departments, admins and students
router.get('/overview', authMiddleware, principalMiddleware, async (req, res) => {
  try {
    const [departments, admins, students, superadmins] = await Promise.all([
      Department.find({}).populate('assignedSuperadmins', 'username email').sort({ name: 1 }),
      User.find({ role: 'admin', isDeleted: { $ne: true } })
        .select('username email departmentId assignedSuperadmin')
        .populate('departmentId', 'name code')
        .populate('assignedSuperadmin', 'username email')
        .sort({ createdAt: -1 }),
      User.find({ role: 'user', isDeleted: { $ne: true } })
        .select('username email yearOfStudy departmentId assignedMentor')
        .populate('departmentId', 'name code')
        .populate('assignedMentor', 'username email')
        .sort({ createdAt: -1 }),
      User.find({ role: 'superadmin', isDeleted: { $ne: true } })
        .select('username email departmentId')
        .populate('departmentId', 'name code')
        .sort({ createdAt: -1 })
    ]);

    res.json({ departments, admins, students, superadmins });
  } catch (error) {
    console.error('Error fetching principal overview:', error);
    res.status(500).json({ error: 'Failed to fetch overview' });
  }
});

// GET /analytics/profiles - Role-wise profile completion analytics for principal
router.get('/analytics/profiles', authMiddleware, principalMiddleware, async (req, res) => {
  try {
    const roles = ['user', 'admin', 'superadmin', 'principal'];
    const analytics = {};

    await Promise.all(
      roles.map(async (role) => {
        const users = await User.find({ role, isDeleted: { $ne: true } })
          .select('_id username email role')
          .sort({ username: 1 })
          .lean();

        const userIds = users.map((u) => u._id);
        const profiles = await Profile.find({ userId: { $in: userIds }, isDeleted: { $ne: true } })
          .select('userId')
          .lean();

        const profileSet = new Set(profiles.map((p) => String(p.userId)));
        const records = users.map((u) => ({
          _id: u._id,
          username: u.username,
          email: u.email,
          role: u.role,
          profileCompleted: profileSet.has(String(u._id))
        }));

        analytics[role] = {
          total: records.length,
          completed: records.filter((r) => r.profileCompleted).length,
          pending: records.filter((r) => !r.profileCompleted).length,
          records
        };
      })
    );

    res.json({ analytics });
  } catch (error) {
    console.error('Error fetching principal analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// POST /analytics/notify-role - Notify all/selected/incomplete users for role
router.post('/analytics/notify-role', authMiddleware, principalMiddleware, async (req, res) => {
  try {
    const { role, userIds, onlyIncomplete, subject, message } = req.body;
    if (!['user', 'admin', 'superadmin', 'principal'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    let query = { role, isDeleted: { $ne: true } };
    if (Array.isArray(userIds) && userIds.length > 0) {
      query._id = { $in: userIds };
    }

    let users = await User.find(query).select('_id username email').lean();
    if (onlyIncomplete) {
      const profiles = await Profile.find({ userId: { $in: users.map((u) => u._id) }, isDeleted: { $ne: true } })
        .select('userId')
        .lean();
      const completedSet = new Set(profiles.map((p) => String(p.userId)));
      users = users.filter((u) => !completedSet.has(String(u._id)));
    }

    if (users.length === 0) {
      return res.status(404).json({ error: 'No users found for notification' });
    }

    const finalSubject = subject || `Profile Update Notification (${role})`;
    const finalMessage = message || 'Please log in and complete/update your profile details.';

    let sentCount = 0;
    await Promise.all(
      users.map(async (u) => {
        try {
          await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: u.email,
            subject: finalSubject,
            text: `Hello ${u.username},\n\n${finalMessage}\n\nRegards,\nCounseling Platform`
          });
          sentCount += 1;
        } catch (emailErr) {
          console.error(`[PRINCIPAL-NOTIFY] Failed for ${u.email}:`, emailErr.message);
        }
      })
    );

    res.json({ message: 'Notification process completed', totalTargets: users.length, sentCount });
  } catch (error) {
    console.error('Error sending principal notifications:', error);
    res.status(500).json({ error: 'Failed to send notifications' });
  }
});

// GET /batches - Show latest four active batch groups and students
router.get('/batches', authMiddleware, principalMiddleware, async (req, res) => {
  try {
    const students = await User.find({ role: 'user', isDeleted: { $ne: true } })
      .select('_id username email yearOfStudy departmentId')
      .populate('departmentId', 'name code')
      .lean();

    const profiles = await Profile.find({ userId: { $in: students.map((s) => s._id) }, isDeleted: { $ne: true } })
      .select('userId name')
      .lean();
    const profileMap = new Map(profiles.map((p) => [String(p.userId), p]));

    const withBatch = students
      .map((s) => {
        const rollPrefix = String(s.username || '').slice(0, 3);
        if (!/^\d{3}$/.test(rollPrefix)) return null;
        const admissionYear = Number(`20${rollPrefix.slice(0, 2)}`);
        return {
          _id: s._id,
          regdNo: s.username,
          email: s.email,
          yearOfStudy: s.yearOfStudy,
          department: s.departmentId?.name || '',
          batchYear: admissionYear,
          profileName: profileMap.get(String(s._id))?.name || s.username
        };
      })
      .filter(Boolean);

    const allBatchYears = [...new Set(withBatch.map((s) => s.batchYear))].sort((a, b) => b - a);
    const activeBatchYears = allBatchYears.slice(0, 4);
    const grouped = activeBatchYears.map((batchYear) => ({
      batchYear,
      students: withBatch.filter((s) => s.batchYear === batchYear)
    }));

    res.json({ activeBatchYears, batches: grouped });
  } catch (error) {
    console.error('Error fetching principal batches:', error);
    res.status(500).json({ error: 'Failed to fetch batches' });
  }
});

// POST /create-admin - Principal creates an admin under selected department
router.post('/create-admin', authMiddleware, principalMiddleware, async (req, res) => {
  try {
    const { username, email, departmentId, employeeId } = req.body;
    if (!username || !email || !departmentId) {
      return res.status(400).json({ error: 'username, email and departmentId are required' });
    }

    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    const existingUser = await User.findOne({ email: String(email).trim().toLowerCase(), isDeleted: { $ne: true } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const user = await User.create({
      username: String(username).trim(),
      email: String(email).trim().toLowerCase(),
      password: hashedPassword,
      role: 'admin',
      departmentId
    });

    await Admin.create({
      employee_name: user.username,
      employee_id: employeeId || `EMP-${String(user._id).slice(-6).toUpperCase()}`,
      department: department.name,
      email: user.email
    });

    try {
      await sendAccountMail({
        email: user.email,
        username: user.username,
        role: 'admin',
        tempPassword,
        departmentName: department.name
      });
    } catch (emailErr) {
      console.error('[PRINCIPAL-CREATE-ADMIN] Email failed:', emailErr.message);
    }

    res.status(201).json({ message: 'Admin created successfully', user });
  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(500).json({ error: 'Failed to create admin' });
  }
});

// POST /create-student - Principal creates student under selected department
router.post('/create-student', authMiddleware, principalMiddleware, async (req, res) => {
  try {
    const { rollNumber, email, departmentId, yearOfStudy, assignedMentorId } = req.body;
    if (!rollNumber || !departmentId) {
      return res.status(400).json({ error: 'rollNumber and departmentId are required' });
    }

    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    if (assignedMentorId) {
      const mentor = await User.findOne({ _id: assignedMentorId, role: 'admin', departmentId, isDeleted: { $ne: true } });
      if (!mentor) {
        return res.status(400).json({ error: 'Assigned mentor does not belong to selected department' });
      }
    }

    const normalizedEmail = (email && String(email).trim())
      ? String(email).trim().toLowerCase()
      : `${String(rollNumber).trim().toLowerCase()}@gvpce.ac.in`;

    const existingStudent = await User.findOne({
      $or: [
        { username: String(rollNumber).trim() },
        { email: normalizedEmail }
      ],
      isDeleted: { $ne: true }
    });
    if (existingStudent) {
      return res.status(400).json({ error: 'Student already exists with same roll number/email' });
    }

    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const user = await User.create({
      username: String(rollNumber).trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: 'user',
      departmentId,
      assignedMentor: assignedMentorId || null,
      yearOfStudy: Number(yearOfStudy || 1),
      yearAssignmentMode: yearOfStudy ? 'manual' : 'auto'
    });

    try {
      await sendAccountMail({
        email: user.email,
        username: user.username,
        role: 'student',
        tempPassword,
        departmentName: department.name
      });
    } catch (emailErr) {
      console.error('[PRINCIPAL-CREATE-STUDENT] Email failed:', emailErr.message);
    }

    res.status(201).json({ message: 'Student created successfully', user });
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ error: 'Failed to create student' });
  }
});

// POST /assign-students - Principal assigns students to admin in department
router.post('/assign-students', authMiddleware, principalMiddleware, async (req, res) => {
  try {
    const { studentIds, adminId, departmentId } = req.body;
    if (!Array.isArray(studentIds) || studentIds.length === 0 || !adminId || !departmentId) {
      return res.status(400).json({ error: 'studentIds, adminId and departmentId are required' });
    }

    const admin = await User.findOne({ _id: adminId, role: 'admin', departmentId, isDeleted: { $ne: true } });
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found for selected department' });
    }

    const students = await User.find({
      _id: { $in: studentIds },
      role: 'user',
      departmentId,
      isDeleted: { $ne: true }
    });

    if (students.length !== studentIds.length) {
      return res.status(400).json({ error: 'Some students do not belong to selected department' });
    }

    const result = await User.updateMany(
      { _id: { $in: studentIds } },
      { $set: { assignedMentor: adminId } }
    );

    res.json({ message: 'Students assigned successfully', assignedCount: result.modifiedCount });
  } catch (error) {
    console.error('Error assigning students from principal:', error);
    res.status(500).json({ error: 'Failed to assign students' });
  }
});

module.exports = router;