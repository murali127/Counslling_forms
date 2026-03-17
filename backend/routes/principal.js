const express = require("express");
const router = express.Router();
const { authMiddleware, principalMiddleware } = require("../middlewares/authMiddleware");
const User = require("../models/User");
const Department = require("../models/Department");
const Profile = require("../models/Profile");
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

module.exports = router;