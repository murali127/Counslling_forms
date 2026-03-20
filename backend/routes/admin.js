const express = require('express');

const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middlewares/authMiddleware');
const User = require('../models/User');
const Profile = require('../models/Profile');
const MentorGrading = require('../models/MentorGradingSchema');
const Marks = require('../models/Semester');
const { getEnabledProfileFields, calculateProfileCompletion } = require('../utils/profileFieldUtils');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const SystemSettings = require('../models/SystemSettings');

const ROLL_NUMBER_REGEX = /^\d{12}$/;

const normalizeRollNumber = (value) => String(value || '').trim();

const normalizeYearOfStudy = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 4) {
    return NaN;
  }
  return parsed;
};

const getAdmissionPrefix = (rollNumber) => normalizeRollNumber(rollNumber).slice(0, 3);

const getOrCreateGlobalSettings = async () => {
  let settings = await SystemSettings.findOne({ key: 'global' });
  if (!settings) {
    settings = await SystemSettings.create({ key: 'global' });
  }
  return settings;
};

const restoreDeletedStudentRecord = async ({
  existingUser,
  username,
  email,
  password,
  assignedMentorId,
  yearOfStudy,
  departmentId
}) => {
  existingUser.username = username;
  existingUser.email = email;
  existingUser.password = password;
  existingUser.role = 'user';
  existingUser.departmentId = departmentId;
  existingUser.assignedMentor = assignedMentorId;
  existingUser.isDeleted = false;
  existingUser.hasLoggedIn = false;
  existingUser.resetPasswordToken = undefined;
  existingUser.resetPasswordExpiry = undefined;
  existingUser.yearOfStudy = yearOfStudy;
  existingUser.yearAssignmentMode = yearOfStudy ? 'manual' : 'auto';
  await existingUser.save();

  const existingProfile = await Profile.findOne({
    $or: [
      { userId: existingUser._id },
      { regdNo: username },
      { email }
    ]
  });

  if (existingProfile) {
    existingProfile.userId = existingUser._id;
    existingProfile.regdNo = username;
    existingProfile.email = email;
    existingProfile.isDeleted = false;
    await existingProfile.save();
  }

  return existingUser;
};

const permanentlyDeleteStudents = async (students) => {
  if (!Array.isArray(students) || students.length === 0) {
    return 0;
  }

  const userIds = students.map((student) => student._id);
  const emails = students
    .map((student) => String(student.email || '').trim().toLowerCase())
    .filter(Boolean);

  await Promise.all([
    User.deleteMany({ _id: { $in: userIds } }),
    Profile.deleteMany({
      $or: [
        { userId: { $in: userIds } },
        { email: { $in: emails } }
      ]
    }),
    MentorGrading.deleteMany({ email: { $in: emails } }),
    Marks.deleteMany({ email: { $in: emails } })
  ]);

  await syncYearOfStudyForAllStudents();
  return userIds.length;
};

const syncYearOfStudyForAllStudents = async () => {
  const students = await User.find({ role: 'user', isDeleted: { $ne: true } })
    .select('_id username yearOfStudy yearAssignmentMode')
    .lean();

  const prefixes = [...new Set(
    students
      .map((s) => getAdmissionPrefix(s.username))
      .filter((p) => /^\d{3}$/.test(p))
  )].sort((a, b) => Number(b) - Number(a));

  if (prefixes.length === 0) return;

  const rankByPrefix = {};
  prefixes.forEach((prefix, index) => {
    rankByPrefix[prefix] = index + 1;
  });

  const bulkOps = students
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

  if (bulkOps.length > 0) {
    await User.bulkWrite(bulkOps);
  }
};

/**
 * @route GET /api/admin/users
 * @desc Get all users (Admin only) - optionally filter by role
 * @access Admin
 */
router.get('/users', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const { role } = req.query;
    let query = { isDeleted: { $ne: true } };

    // If an admin is requesting, only show users assigned to them
    if (req.user.role === 'admin') {
        query.assignedMentor = req.user._id;
    }
    if (role) {
      query.role = role;
    }

    const users = await User.find(query).select('-password').lean();
    
    // Get enabled profile fields (use null for institution-wide config)
    const enabledFields = await getEnabledProfileFields(null);
    
    // Calculate profileCompletion for each user
    const usersWithProfiles = await Promise.all(users.map(async (u) => {
      const profile = await Profile.findOne({ userId: u._id });
      let pc = 0;
      if (profile) {
        pc = calculateProfileCompletion(profile, enabledFields);
      }
      return { ...u, profileCompletion: pc };
    }));

    res.status(200).json(usersWithProfiles);
  } catch (err) { next(err); }
});

/**
 * @route POST /api/admin/users
 * @desc Create a new user (Admin only)
 * @access Admin
 */
router.post('/users', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const { username, email, mentorId, yearOfStudy } = req.body;
    const normalizedUsername = normalizeRollNumber(username);
    const normalizedYearOfStudy = normalizeYearOfStudy(yearOfStudy);

    if (!ROLL_NUMBER_REGEX.test(normalizedUsername)) {
      return res.status(400).json({ error: 'Roll number must be a 12-digit value (example: 322103311001)' });
    }

    if (Number.isNaN(normalizedYearOfStudy)) {
      return res.status(400).json({ error: 'Year of study must be a value between 1 and 4' });
    }

    const normalizedEmail = (email && String(email).trim())
      ? String(email).trim().toLowerCase()
      : `${normalizedUsername.toLowerCase()}@gvpce.ac.in`;

    if (!normalizedUsername) {
      return res.status(400).json({ error: 'Username (roll number) is required' });
    }

    let assignedMentorId = null; // Students are created unassigned, mentors assigned via dedicated allocation page

    const existingActiveUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { username: normalizedUsername }],
      isDeleted: { $ne: true }
    });
    if (existingActiveUser) {
      return res.status(400).json({ error: 'User with this email or roll number already exists' });
    }

    const existingDeletedUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { username: normalizedUsername }],
      isDeleted: true
    });

    // Generate a random password
    const randomPassword = crypto.randomBytes(8).toString('hex');
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    if (existingDeletedUser) {
      const restoredUser = await restoreDeletedStudentRecord({
        existingUser: existingDeletedUser,
        username: normalizedUsername,
        email: normalizedEmail,
        password: hashedPassword,
        assignedMentorId,
        yearOfStudy: normalizedYearOfStudy,
        departmentId: req.user.departmentId
      });

      if (!normalizedYearOfStudy) {
        await syncYearOfStudyForAllStudents();
      }

      return res.status(200).json({
        message: 'Deleted student restored successfully. Use Send Details to email credentials manually.',
        user: {
          _id: restoredUser._id,
          username: restoredUser.username,
          email: restoredUser.email,
          role: restoredUser.role,
          yearOfStudy: restoredUser.yearOfStudy
        }
      });
    }

    // Create new user
    const newUser = new User({
        username: normalizedUsername,
        email: normalizedEmail,
        password: hashedPassword,
        role: 'user', // Default role for added students
        departmentId: req.user.departmentId,
        assignedMentor: assignedMentorId,
        yearOfStudy: normalizedYearOfStudy || 1, // Default to year 1 if not specified
        yearAssignmentMode: normalizedYearOfStudy ? 'manual' : 'auto'
      });
    await newUser.save();

    if (!normalizedYearOfStudy) {
      await syncYearOfStudyForAllStudents();
    }

    res.status(201).json({
      message: 'User created successfully. Use Send Details to email credentials manually.',
      user: {
        _id: newUser._id,
        username: normalizedUsername,
        email: normalizedEmail,
        role: newUser.role,
        yearOfStudy: newUser.yearOfStudy
      }
    });
  } catch (err) { next(err);
  }
});

/**
 * @route POST /api/admin/users/smart-create
 * @desc Bulk create users by roll number range (Admin/Superadmin)
 * @access Admin
 */
router.post('/users/smart-create', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const { startRollNumber, endRollNumber, emailDomain, mentorId, yearOfStudy } = req.body;
    const normalizedYearOfStudy = normalizeYearOfStudy(yearOfStudy);

    if (!startRollNumber || !endRollNumber) {
      return res.status(400).json({ error: 'Start roll number and end roll number are required' });
    }

    if (Number.isNaN(normalizedYearOfStudy)) {
      return res.status(400).json({ error: 'Year of study must be a value between 1 and 4' });
    }

    const start = normalizeRollNumber(startRollNumber);
    const end = normalizeRollNumber(endRollNumber);

    if (!ROLL_NUMBER_REGEX.test(start) || !ROLL_NUMBER_REGEX.test(end)) {
      return res.status(400).json({ error: 'Both roll numbers must be 12-digit values (example: 322103311001)' });
    }

    const startMatch = start.match(/^(.*?)(\d+)$/);
    const endMatch = end.match(/^(.*?)(\d+)$/);
    if (!startMatch || !endMatch || startMatch[1] !== endMatch[1]) {
      return res.status(400).json({ error: 'Invalid roll number range format' });
    }

    const prefix = startMatch[1];
    const startNum = parseInt(startMatch[2], 10);
    const endNum = parseInt(endMatch[2], 10);
    const width = startMatch[2].length;

    if (Number.isNaN(startNum) || Number.isNaN(endNum) || endNum < startNum) {
      return res.status(400).json({ error: 'Invalid numeric roll number range' });
    }

    // Get admin's department ID
    const adminDeptId = req.user.departmentId;
    if (!adminDeptId) {
      return res.status(400).json({ error: 'Admin must be assigned to a department' });
    }

    let assignedMentorId = null; // Students are created unassigned, mentors assigned via dedicated allocation page

    const domain = (emailDomain && String(emailDomain).trim()) || 'gvpce.ac.in';
    const created = [];
    const skipped = [];

    for (let n = startNum; n <= endNum; n++) {
      const username = `${prefix}${String(n).padStart(width, '0')}`;
      const email = `${username.toLowerCase()}@${domain}`;

      const exists = await User.findOne({
        $or: [{ email }, { username }],
        isDeleted: { $ne: true }
      });
      if (exists) {
        skipped.push({ username, email, reason: 'Already exists' });
        continue;
      }

      const deletedUser = await User.findOne({
        $or: [{ email }, { username }],
        isDeleted: true
      });

      const randomPassword = crypto.randomBytes(8).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      if (deletedUser) {
        const restoredUser = await restoreDeletedStudentRecord({
          existingUser: deletedUser,
          username,
          email,
          password: hashedPassword,
          assignedMentorId,
          yearOfStudy: normalizedYearOfStudy,
          departmentId: adminDeptId
        });

        created.push({ _id: restoredUser._id, username, email, restored: true });
        continue;
      }

      const newUser = new User({
        username,
        email,
        password: hashedPassword,
        role: 'user',
        departmentId: adminDeptId,
        assignedMentor: assignedMentorId,
        yearOfStudy: normalizedYearOfStudy || 1, // Default to year 1 if not specified
        yearAssignmentMode: normalizedYearOfStudy ? 'manual' : 'auto'
      });
      await newUser.save();

      created.push({ _id: newUser._id, username, email });
    }

    if (!normalizedYearOfStudy) {
      await syncYearOfStudyForAllStudents();
    }

    res.status(201).json({
      message: `Bulk create completed. Created ${created.length}, skipped ${skipped.length}. Use Send Details manually to email credentials.`,
      created,
      skipped
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route GET /api/admin/users/:id
 * @desc Get user by ID (Admin only)
 * @access Admin
 */
router.get('/users/:id', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json(user);
  } catch (err) { next(err);
  }
});

/**
 * @route GET /api/admin/student-profile-window
 * @desc Get configured student profile edit window
 * @access Admin
 */
router.get('/student-profile-window', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const settings = await getOrCreateGlobalSettings();
    const window = settings.studentProfileWindow || {};
    const now = new Date();
    const startAt = window.startAt ? new Date(window.startAt) : null;
    const endAt = window.endAt ? new Date(window.endAt) : null;
    const isOpen = !!(
      window.enabled &&
      startAt &&
      endAt &&
      now >= startAt &&
      now <= endAt
    );

    res.status(200).json({
      enabled: !!window.enabled,
      startAt: window.startAt || null,
      endAt: window.endAt || null,
      isOpen
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route PUT /api/admin/student-profile-window
 * @desc Configure student profile edit window
 * @access Admin
 */
router.put('/student-profile-window', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const { enabled, startAt, endAt } = req.body;

    const parsedEnabled = Boolean(enabled);
    const parsedStartAt = startAt ? new Date(startAt) : null;
    const parsedEndAt = endAt ? new Date(endAt) : null;

    if (parsedEnabled) {
      if (!parsedStartAt || !parsedEndAt || Number.isNaN(parsedStartAt.getTime()) || Number.isNaN(parsedEndAt.getTime())) {
        return res.status(400).json({ error: 'Valid startAt and endAt are required when enabling the profile window' });
      }
      if (parsedStartAt >= parsedEndAt) {
        return res.status(400).json({ error: 'startAt must be before endAt' });
      }
    }

    const settings = await getOrCreateGlobalSettings();
    settings.studentProfileWindow = {
      enabled: parsedEnabled,
      startAt: parsedEnabled ? parsedStartAt : null,
      endAt: parsedEnabled ? parsedEndAt : null,
      updatedBy: req.user._id
    };
    await settings.save();

    res.status(200).json({
      message: parsedEnabled ? 'Student profile window enabled' : 'Student profile window disabled',
      window: settings.studentProfileWindow
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route PATCH /api/admin/users/:id/role
 * @desc Update user role (Admin only)
 * @access Admin
 */
router.patch('/users/:id/role', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const { role } = req.body;
    
    if (!['user', 'admin', 'mentor'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.status(200).json(user);
  } catch (err) { next(err);
  }
});

/**
 * @route POST /api/admin/users/bulk-delete
 * @desc Bulk delete users (Admin only)
 * @access Admin
 */
router.post('/users/bulk-delete', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const userIds = Array.isArray(req.body.userIds) ? req.body.userIds : [];
    if (userIds.length === 0) {
      return res.status(400).json({ error: 'At least one user id is required' });
    }

    const usersToDeleteQuery = {
      _id: { $in: userIds },
      role: 'user',
      isDeleted: { $ne: true }
    };

    if (req.user.role === 'admin') {
      usersToDeleteQuery.assignedMentor = req.user._id;
    }

    const usersToDelete = await User.find(usersToDeleteQuery).select('_id email');
    const allowedUserIds = usersToDelete.map((u) => u._id);

    if (allowedUserIds.length === 0) {
      return res.status(404).json({ error: 'No matching active students found for deletion' });
    }

    await permanentlyDeleteStudents(usersToDelete);

    res.status(200).json({
      message: `Permanently deleted ${allowedUserIds.length} students successfully`,
      deletedCount: allowedUserIds.length
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route DELETE /api/admin/users/:id
 * @desc Delete user (Admin only)
 * @access Admin
 */
router.delete('/users/:id', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const query = {
      _id: req.params.id,
      role: 'user',
      isDeleted: { $ne: true }
    };

    if (req.user.role === 'admin') {
      query.assignedMentor = req.user._id;
    }

    const user = await User.findOne(query).select('_id email');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await permanentlyDeleteStudents([user]);

    res.status(200).json({ message: 'User and associated data permanently deleted successfully' });
  } catch (err) { next(err);
  }
});

/**
 * @route GET /api/admin/profiles
 * @desc Get all profiles (Admin only)
 * @access Admin
 */
router.get('/profiles', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    let profiles;
    if (req.user.role === 'superadmin') {
      profiles = await Profile.find();
    } else {
      const assignedUsers = await User.find({ assignedMentor: req.user._id }).select('_id');
      const assignedIds = assignedUsers.map(u => u._id);
      profiles = await Profile.find({ userId: { $in: assignedIds } });
    }
    res.status(200).json(profiles);
  } catch (err) { next(err);
  }
});

/**
 * @route GET /api/admin/mentorgradings
 * @desc Get all mentor gradings (Admin only)
 * @access Admin
 */
router.get('/mentorgradings', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    let mentorGradings;
    if (req.user.role === 'superadmin') {
      mentorGradings = await MentorGrading.find();
    } else {
      const assignedUsers = await User.find({ assignedMentor: req.user._id }).select('email');
      const assignedEmails = assignedUsers.map(u => u.email);
      mentorGradings = await MentorGrading.find({ email: { $in: assignedEmails } });
    }
    res.status(200).json(mentorGradings);
  } catch (err) { next(err);
  }
});

/**
 * @route GET /api/admin/marks
 * @desc Get all marks (Admin only)
 * @access Admin
 */
router.get('/marks', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    let marks;
    if (req.user.role === 'superadmin') {
      marks = await Marks.find();
    } else {
      const assignedUsers = await User.find({ assignedMentor: req.user._id }).select('email');
      const assignedEmails = assignedUsers.map(u => u.email);
      marks = await Marks.find({ email: { $in: assignedEmails } });
    }
    res.status(200).json(marks);
  } catch (err) { next(err);
  }
});


// Notify student to complete profile
router.post('/notify-profile/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
       return res.status(500).json({ error: 'Email configuration missing on server' });
    }

    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    const loginUrl = process.env.FRONTEND_URL || 'http://localhost:3000/signup';

    const mailOptions = {
        to: student.email,
        from: process.env.EMAIL_USER,
        subject: 'Action Required: Complete Your Counseling Profile',
        html: `
          <h3>Hello ${student.username.toUpperCase()},</h3>
          <p>You have been reminded by the Administration to complete your profile in the Counseling Dashboard.</p>
          <p>Please log in and update your details as soon as possible.</p>
          <p><a href="${loginUrl}">Click here to Login</a></p>
          <br/>
          <p>Thank you,</p>
          <p>Administration</p>
        `
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'Profile completion reminder sent successfully' });
  } catch (error) {
    console.error('Error sending profile notification:', error);
    res.status(500).json({ error: 'Failed to send notification email' });
  }
});

// Send Details (Email activation link to student)
router.post('/send-details/:id', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate a temporary password
    const tempPassword = crypto.randomBytes(8).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Update user with temp password and reset hasLoggedIn
    student.password = hashedPassword;
    student.hasLoggedIn = false;
    student.resetPasswordToken = undefined;
    student.resetPasswordExpiry = undefined;
    await student.save();

    // Create email transport
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    const mailOptions = {
        to: student.email,
        from: process.env.EMAIL_USER,
        subject: 'Your Counseling Dashboard Login Details',
        text: `Hello ${student.username.toUpperCase()},\n\n` +
              `You have been registered for the Counseling Dashboard.\n\n` +
              `Your login details are:\n` +
              `Email: ${student.email}\n` +
              `Username: ${student.username}\n` +
              `Temporary Password: ${tempPassword}\n\n` +
              `Please log in and change your password immediately.\n\n` +
              `If you did not request this, please ignore this email.\n`
    };

    transporter.sendMail(mailOptions, (err, response) => {
        if (err) {
            console.error('There was an error sending the email: ', err);
            return res.status(500).json({ error: 'Error sending email' });
        }
        res.status(200).json({ message: 'Login details sent successfully!' });
    });

  } catch (err) {
    next(err);
  }
});

module.exports = router;
