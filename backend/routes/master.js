const express = require("express");
const router = express.Router();
const { authMiddleware, masterMiddleware } = require("../middlewares/authMiddleware");
const User = require("../models/User");
const Department = require("../models/Department");
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