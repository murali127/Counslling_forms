const express = require("express");
const router = express.Router();
const { authMiddleware, masterMiddleware } = require("../middlewares/authMiddleware");
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

// GET /dashboard - Master dashboard data
router.get('/dashboard', authMiddleware, masterMiddleware, async (req, res) => {
  try {
    // Get all departments with their superadmins
    const departments = await Department.find({})
      .populate('assignedSuperadmins', 'username email')
      .sort({ name: 1 });

    // Get the principal (there should be only one)
    const principal = await User.findOne({ role: 'principal' })
      .select('username email')
      .sort({ username: 1 });

    // Get counts
    const totalDepartments = await Department.countDocuments();
    const totalSuperAdmins = await User.countDocuments({ role: 'superadmin' });

    res.json({
      departments,
      principal: principal ? [principal] : [], // Return as array for consistency
      stats: {
        totalDepartments,
        totalSuperAdmins,
        totalPrincipals: principal ? 1 : 0
      }
    });
  } catch (error) {
    console.error('Error fetching master dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// GET /overview - Expanded master overview
router.get('/overview', authMiddleware, masterMiddleware, async (req, res) => {
  try {
    const [departments, users, principal] = await Promise.all([
      Department.find({}).populate('assignedSuperadmins', 'username email role').sort({ name: 1 }),
      User.find({ isDeleted: { $ne: true } })
        .select('username email role departmentId yearOfStudy assignedMentor createdAt')
        .populate('departmentId', 'name code')
        .populate('assignedMentor', 'username email')
        .sort({ createdAt: -1 }),
      User.findOne({ role: 'principal', isDeleted: { $ne: true } }).select('username email')
    ]);

    const stats = {
      totalUsers: users.length,
      totalStudents: users.filter((u) => u.role === 'user').length,
      totalAdmins: users.filter((u) => u.role === 'admin').length,
      totalSuperadmins: users.filter((u) => u.role === 'superadmin').length,
      totalDepartments: departments.length,
      hasPrincipal: !!principal
    };

    res.json({ departments, users, principal, stats });
  } catch (error) {
    console.error('Error fetching master overview:', error);
    res.status(500).json({ error: 'Failed to fetch master overview' });
  }
});

// POST /departments - Create branch/department
router.post('/departments', authMiddleware, masterMiddleware, async (req, res) => {
  try {
    const { name, code } = req.body;
    if (!name || !code) {
      return res.status(400).json({ error: 'Department name and code are required' });
    }

    const existingCode = await Department.findOne({ code: String(code).trim().toUpperCase() });
    if (existingCode) {
      return res.status(400).json({ error: 'Department code already exists' });
    }

    const department = await Department.create({
      name: String(name).trim(),
      code: String(code).trim().toUpperCase()
    });

    res.status(201).json({ message: 'Department created successfully', department });
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({ error: 'Failed to create department' });
  }
});

// PUT /departments/:id - Update branch/department
router.put('/departments/:id', authMiddleware, masterMiddleware, async (req, res) => {
  try {
    const { name, code } = req.body;
    if (!name || !code) {
      return res.status(400).json({ error: 'Department name and code are required' });
    }

    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    const normalizedCode = String(code).trim().toUpperCase();
    const existingCode = await Department.findOne({
      code: normalizedCode,
      _id: { $ne: department._id }
    });
    if (existingCode) {
      return res.status(400).json({ error: 'Department code already exists' });
    }

    const previousName = department.name;
    department.name = String(name).trim();
    department.code = normalizedCode;
    await department.save();

    // Keep admin metadata department name in sync when department name changes.
    await Admin.updateMany(
      { department: previousName },
      { $set: { department: department.name } }
    );

    res.json({ message: 'Department updated successfully', department });
  } catch (error) {
    console.error('Error updating department:', error);
    res.status(500).json({ error: 'Failed to update department' });
  }
});

// DELETE /departments/:id - Delete branch/department if safe
router.delete('/departments/:id', authMiddleware, masterMiddleware, async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    const linkedUsers = await User.countDocuments({
      departmentId: department._id,
      isDeleted: { $ne: true }
    });
    if (linkedUsers > 0) {
      return res.status(400).json({
        error: 'Cannot delete department with active users. Reassign users first.'
      });
    }

    await Department.findByIdAndDelete(department._id);
    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({ error: 'Failed to delete department' });
  }
});

// POST /users - Create role user from master panel
router.post('/users', authMiddleware, masterMiddleware, async (req, res) => {
  try {
    const { username, email, role, departmentId, yearOfStudy } = req.body;

    if (!username || !email || !role) {
      return res.status(400).json({ error: 'username, email and role are required' });
    }

    if (!['principal', 'superadmin', 'admin', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    if (role === 'principal') {
      const existingPrincipal = await User.findOne({ role: 'principal', isDeleted: { $ne: true } });
      if (existingPrincipal) {
        return res.status(400).json({ error: 'A principal already exists. Remove/replace current principal first.' });
      }
    }

    const department = departmentId ? await Department.findById(departmentId) : null;
    if (departmentId && !department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    const existingUser = await User.findOne({ email: String(email).trim().toLowerCase(), isDeleted: { $ne: true } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const newUser = await User.create({
      username: String(username).trim(),
      email: String(email).trim().toLowerCase(),
      password: hashedPassword,
      role,
      departmentId: department ? department._id : null,
      yearOfStudy: role === 'user' ? Number(yearOfStudy || 1) : null,
      yearAssignmentMode: role === 'user' && yearOfStudy ? 'manual' : 'auto'
    });

    if (role === 'superadmin') {
      if (!department.assignedSuperadmins.some((id) => String(id) === String(newUser._id))) {
        department.assignedSuperadmins.push(newUser._id);
        await department.save();
      }
    }

    if (role === 'admin') {
      const existingAdminMeta = await Admin.findOne({ email: newUser.email });
      if (!existingAdminMeta) {
        await Admin.create({
          employee_name: newUser.username,
          employee_id: `EMP-${String(newUser._id).slice(-6).toUpperCase()}`,
          department: department?.name || 'Unassigned',
          email: newUser.email
        });
      }
    }

    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: newUser.email,
        subject: `${role.toUpperCase()} Account Created - Counseling Platform`,
        text:
          `Hello ${newUser.username},\n\n` +
          `Your account has been created with role: ${role}.\n` +
          `Email: ${newUser.email}\n` +
          `Temporary Password: ${tempPassword}\n\n` +
          `Please log in and change your password immediately.\n`
      };
      await transporter.sendMail(mailOptions);
    } catch (emailErr) {
      console.error('[MASTER-CREATE-USER] Email sending failed:', emailErr.message);
    }

    res.status(201).json({
      message: `${role} account created successfully`,
      user: {
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        departmentId: newUser.departmentId
      }
    });
  } catch (error) {
    console.error('Error creating user from master:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// PATCH /departments/:id/superadmins - assign or deassign superadmin
router.patch('/departments/:id/superadmins', authMiddleware, masterMiddleware, async (req, res) => {
  try {
    const { superadminId, action } = req.body;
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    const superadmin = await User.findOne({
      _id: superadminId,
      role: 'superadmin',
      isDeleted: { $ne: true }
    });
    if (!superadmin) {
      return res.status(404).json({ error: 'Super admin not found' });
    }

    if (action === 'assign') {
      superadmin.departmentId = department._id;
      await superadmin.save();
      if (!department.assignedSuperadmins.some((id) => String(id) === String(superadmin._id))) {
        department.assignedSuperadmins.push(superadmin._id);
        await department.save();
      }
      return res.json({ message: 'Super admin assigned to department successfully' });
    }

    if (action === 'deassign') {
      department.assignedSuperadmins = department.assignedSuperadmins.filter(
        (id) => String(id) !== String(superadmin._id)
      );
      await department.save();
      superadmin.departmentId = null;
      await superadmin.save();
      return res.json({ message: 'Super admin deassigned from department successfully' });
    }

    return res.status(400).json({ error: 'action must be assign or deassign' });
  } catch (error) {
    console.error('Error updating department superadmin assignment:', error);
    res.status(500).json({ error: 'Failed to update assignment' });
  }
});

// GET /assignments - Central assignment data for master panel
router.get('/assignments', authMiddleware, masterMiddleware, async (req, res) => {
  try {
    const [departments, principals, superadmins, admins, students] = await Promise.all([
      Department.find({}).sort({ name: 1 }).select('name code assignedSuperadmins'),
      User.find({ role: 'principal', isDeleted: { $ne: true } })
        .select('username email role createdAt')
        .sort({ username: 1 }),
      User.find({ role: 'superadmin', isDeleted: { $ne: true } })
        .select('username email role departmentId createdAt')
        .populate('departmentId', 'name code')
        .sort({ username: 1 }),
      User.find({ role: 'admin', isDeleted: { $ne: true } })
        .select('username email role departmentId createdAt')
        .populate('departmentId', 'name code')
        .sort({ username: 1 }),
      User.find({ role: 'user', isDeleted: { $ne: true } })
        .select('username email role departmentId assignedMentor yearOfStudy createdAt')
        .populate('departmentId', 'name code')
        .populate('assignedMentor', 'username email')
        .sort({ username: 1 })
    ]);

    res.json({ departments, principals, superadmins, admins, students });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignment data' });
  }
});

// PATCH /assignments/users/:id - Update user assignment details
router.patch('/assignments/users/:id', authMiddleware, masterMiddleware, async (req, res) => {
  try {
    const { departmentId, assignedMentorId, yearOfStudy } = req.body;

    const user = await User.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (departmentId !== undefined) {
      if (departmentId) {
        const department = await Department.findById(departmentId);
        if (!department) {
          return res.status(404).json({ error: 'Department not found' });
        }
        user.departmentId = department._id;

        if (user.role === 'superadmin') {
          const alreadyAssigned = department.assignedSuperadmins.some(
            (id) => String(id) === String(user._id)
          );
          if (!alreadyAssigned) {
            department.assignedSuperadmins.push(user._id);
            await department.save();
          }
        }
      } else {
        user.departmentId = null;
      }
    }

    if (assignedMentorId !== undefined) {
      if (!assignedMentorId) {
        user.assignedMentor = null;
      } else {
        const mentor = await User.findOne({ _id: assignedMentorId, role: 'admin', isDeleted: { $ne: true } });
        if (!mentor) {
          return res.status(404).json({ error: 'Admin mentor not found' });
        }
        user.assignedMentor = mentor._id;
      }
    }

    if (yearOfStudy !== undefined && user.role === 'user') {
      const parsedYear = Number(yearOfStudy);
      if (![1, 2, 3, 4].includes(parsedYear)) {
        return res.status(400).json({ error: 'yearOfStudy must be 1, 2, 3, or 4' });
      }
      user.yearOfStudy = parsedYear;
      user.yearAssignmentMode = 'manual';
    }

    await user.save();

    const updated = await User.findById(user._id)
      .select('username email role departmentId assignedMentor yearOfStudy')
      .populate('departmentId', 'name code')
      .populate('assignedMentor', 'username email');

    res.json({ message: 'Assignment updated successfully', user: updated });
  } catch (error) {
    console.error('Error updating assignment:', error);
    res.status(500).json({ error: 'Failed to update assignment' });
  }
});

// DELETE /assignments/users/:id - Delete any managed role user
router.delete('/assignments/users/:id', authMiddleware, masterMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'master') {
      return res.status(400).json({ error: 'Master account cannot be deleted from panel' });
    }

    if (user.role === 'principal') {
      await User.findByIdAndDelete(user._id);
      return res.json({ message: 'Principal deleted successfully' });
    }

    if (user.role === 'superadmin') {
      await Department.updateMany(
        { assignedSuperadmins: user._id },
        { $pull: { assignedSuperadmins: user._id } }
      );
    }

    if (user.role === 'admin') {
      await User.updateMany(
        { assignedMentor: user._id, role: 'user' },
        { $unset: { assignedMentor: '' } }
      );
      await Admin.deleteOne({ email: user.email });
    }

    await Profile.deleteOne({ userId: user._id });
    await User.findByIdAndDelete(user._id);

    res.json({ message: `${user.role} deleted successfully` });
  } catch (error) {
    console.error('Error deleting assignment user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// GET /analytics/profiles - Role-wise profile completion analytics
router.get('/analytics/profiles', authMiddleware, masterMiddleware, async (req, res) => {
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
    console.error('Error fetching profile analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// POST /analytics/notify-role - Notify all/selected role users
router.post('/analytics/notify-role', authMiddleware, masterMiddleware, async (req, res) => {
  try {
    const { role, userIds, onlyIncomplete, subject, message } = req.body;

    if (!['user', 'admin', 'superadmin', 'principal'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    let query = { role, isDeleted: { $ne: true } };
    if (Array.isArray(userIds) && userIds.length > 0) {
      query._id = { $in: userIds };
    }

    let users = await User.find(query).select('_id username email role').lean();
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
          console.error(`[MASTER-NOTIFY] Failed for ${u.email}:`, emailErr.message);
        }
      })
    );

    res.json({
      message: 'Notification process completed',
      totalTargets: users.length,
      sentCount
    });
  } catch (error) {
    console.error('Error notifying role users:', error);
    res.status(500).json({ error: 'Failed to send notifications' });
  }
});

// GET /batches - Show latest four active batch groups and students
router.get('/batches', authMiddleware, masterMiddleware, async (req, res) => {
  try {
    const students = await User.find({ role: 'user', isDeleted: { $ne: true } })
      .select('_id username email yearOfStudy departmentId')
      .populate('departmentId', 'name code')
      .lean();

    const profiles = await Profile.find({ userId: { $in: students.map((s) => s._id) }, isDeleted: { $ne: true } })
      .select('userId regdNo name')
      .lean();
    const profileMap = new Map(profiles.map((p) => [String(p.userId), p]));

    const withBatch = students
      .map((s) => {
        const rollPrefix = String(s.username || '').slice(0, 3);
        if (!/^\d{3}$/.test(rollPrefix)) {
          return null;
        }

        const admissionYear = Number(`20${rollPrefix.slice(0, 2)}`);
        return {
          _id: s._id,
          regdNo: s.username,
          email: s.email,
          yearOfStudy: s.yearOfStudy,
          department: s.departmentId?.name || '',
          batchYear: admissionYear,
          profileCompleted: profileMap.has(String(s._id)),
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
    console.error('Error fetching batches:', error);
    res.status(500).json({ error: 'Failed to fetch batches' });
  }
});

// POST /create-principal - Create a new principal
router.post('/create-principal', authMiddleware, masterMiddleware, async (req, res) => {
  try {
    const { username, email } = req.body;

    // Validate required fields
    if (!username || !email) {
      return res.status(400).json({ error: 'Username and email are required' });
    }

    // Check if a principal already exists
    const existingPrincipal = await User.findOne({ role: 'principal' });
    if (existingPrincipal) {
      return res.status(400).json({ error: 'A principal already exists. Please remove the current principal first.' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Create new principal user
    const newPrincipal = new User({
      username,
      email,
      password: hashedPassword,
      role: 'principal'
    });

    await newPrincipal.save();

    // Send email with credentials
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Principal Account Created - GVPCE Counseling System',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Welcome to GVPCE Counseling System</h2>
            <p>Dear ${username},</p>
            <p>You have been assigned as the Principal for all departments.</p>
            <p>Your account has been created with the following credentials:</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Temporary Password:</strong> ${tempPassword}</p>
            </div>
            <p><strong>Important:</strong> Please change your password after first login.</p>
            <p>You can log in at: <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}">${process.env.FRONTEND_URL || 'http://localhost:3000'}</a></p>
            <p>If you have any questions, please contact the system administrator.</p>
            <br>
            <p>Best regards,<br>GVPCE Counseling System Team</p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log(`[CREATE-PRINCIPAL] Email sent to ${email}`);
    } catch (emailErr) {
      console.error('[CREATE-PRINCIPAL] Error sending email:', emailErr);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      message: 'Principal assigned successfully',
      principal: {
        id: newPrincipal._id,
        username: newPrincipal.username,
        email: newPrincipal.email
      }
    });

  } catch (error) {
    console.error('Error creating principal:', error);
    res.status(500).json({ error: 'Failed to create principal' });
  }
});

// GET /principals - Get the current principal
router.get('/principals', authMiddleware, masterMiddleware, async (req, res) => {
  try {
    const principal = await User.findOne({ role: 'principal' })
      .select('username email')
      .sort({ username: 1 });

    res.json(principal ? [principal] : []);
  } catch (error) {
    console.error('Error fetching principal:', error);
    res.status(500).json({ error: 'Failed to fetch principal' });
  }
});

// DELETE /principals/:id - Delete the principal
router.delete('/principals/:id', authMiddleware, masterMiddleware, async (req, res) => {
  try {
    const principal = await User.findOne({ _id: req.params.id, role: 'principal' });
    if (!principal) {
      return res.status(404).json({ error: 'Principal not found' });
    }

    // Remove principal user
    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'Principal removed successfully' });
  } catch (error) {
    console.error('Error deleting principal:', error);
    res.status(500).json({ error: 'Failed to delete principal' });
  }
});

module.exports = router;