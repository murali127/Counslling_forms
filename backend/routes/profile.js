const express = require("express");
const dotenv = require("dotenv");
const User = require("../models/User");
const Profile = require("../models/Profile");
const { generateSimpleIdFromEmail } = require("../utils/idGenerator");
const cloudinary = require("cloudinary").v2;
const { authMiddleware, adminMiddleware } = require("../middlewares/authMiddleware");

dotenv.config();

const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper function for error responses
const errorResponse = (res, status, message) => {
  return res.status(status).json({ 
    success: false,
    error: message 
  });
};

const ensureStudentProfileWindowOpen = async () => true;

/**
 * @route GET /api/profile
 * @desc Get logged-in user's profile
 * @access Private
 */
router.get("/", authMiddleware, async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ userId: req.user.id })
      .populate('userId', 'username email'); // Populate basic user info

    if (!profile) {
      return res.status(200).json({ 
        success: true,
        hasProfile: false,
        message: "No profile found for this user" 
      });
    }
    
    return res.status(200).json({
      success: true,
      hasProfile: true,
      profile: profile.toObject()
    });
  } catch (err) { return next(err);
  }
});

/**
 * @route GET /api/profile/:regdNo
 * @desc Get profile by registration number
 * @access Private
 */
router.get("/:regdNo", authMiddleware, async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ regdNo: req.params.regdNo })
        .populate({ path: 'userId', select: 'username email assignedMentor', populate: { path: 'assignedMentor', select: 'username' } });
    if (!profile) {
      return errorResponse(res, 404, "Profile not found");
    }

    return res.status(200).json({
      success: true,
      profile
    });
  } catch (err) { return next(err);
  }
});

/**
 * @route POST /api/profile
 * @desc Create a new profile
 * @access Private
 */
router.post("/", authMiddleware, async (req, res, next) => {
  try {
    const canProceed = await ensureStudentProfileWindowOpen(req, res);
    if (!canProceed) return;

    // Check if profile already exists
    const orConditions = [{ userId: req.user.id }];
    
    // Only check regdNo if it's provided
    if (req.body.regdNo) {
      orConditions.push({ regdNo: req.body.regdNo });
    }
    
    const existingProfile = await Profile.findOne({ $or: orConditions });

    if (existingProfile) {
      return errorResponse(res, 400, "Profile already exists for this user or registration number");
    }

    // Get user info to ensure consistency
    const user = await User.findById(req.user.id);
    if (!user) {
      return errorResponse(res, 404, "User account not found");
    }

    // Create new profile with combined data
    const profileData = {
      userId: req.user.id,
      ...req.body,
      // Ensure email matches user account
      email: user.email
    };
    
    // Remove empty regdNo to avoid unique constraint violations
    if (!profileData.regdNo || profileData.regdNo.trim() === '') {
      delete profileData.regdNo;
      // Generate unique ID from email if no regdNo provided
      profileData.uniqueId = generateSimpleIdFromEmail(user.email);
    }

    const newProfile = await Profile.create(profileData);
    
    return res.status(201).json({
      success: true,
      message: "Profile created successfully",
      profile: newProfile
    });

  } catch (err) {
    console.error("Profile creation error:", err);
    
    if (err.name === 'ValidationError') {
      return errorResponse(res, 400, err.message);
    }
    
    return errorResponse(res, 500, "Server error while creating profile");
  }
});

/**
 * @route PUT /api/profile/:id
 * @desc Update profile by ID
 * @access Private
 */
router.put("/:id", authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Prevent changing certain fields
    const restrictedFields = ['userId', 'regdNo', 'uniqueId', 'email'];
    restrictedFields.forEach(field => {
      if (req.body[field]) {
        return errorResponse(res, 400, `Cannot update ${field} field`);
      }
    });

    const updatedProfile = await Profile.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!updatedProfile) {
      return errorResponse(res, 404, "Profile not found");
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      profile: updatedProfile
    });
  } catch (err) {
    console.error("Profile update error:", err);
    
    if (err.name === 'ValidationError') {
      return errorResponse(res, 400, err.message);
    }
    
    return errorResponse(res, 500, "Server error while updating profile");
  }
});

/**
 * @route PATCH /api/profile
 * @desc Update profile using userId
 * @access Private
 */
router.patch("/", authMiddleware, async (req, res, next) => {
  try {
    const canProceed = await ensureStudentProfileWindowOpen(req, res);
    if (!canProceed) return;

    // Check restricted fields first
    const restrictedFields = ['userId', 'regdNo', 'uniqueId', 'email'];
    for (const field of restrictedFields) {
      if (req.body[field]) {
        return errorResponse(res, 400, `Cannot update ${field} field`);
      }
    }

    const updatedProfile = await Profile.findOneAndUpdate(
      { userId: req.user.id },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!updatedProfile) {
      return errorResponse(res, 404, "Profile not found");
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      profile: updatedProfile
    });
  } catch (err) {
    console.error("Profile patch error:", err);
    
    if (err.name === 'ValidationError') {
      return errorResponse(res, 400, err.message);
    }
    
    return errorResponse(res, 500, "Server error while updating profile");
  }
});
/**
 * @route PATCH /api/profile/attendance/self
 * @desc Update own attendance (Student)
 * @access Authenticated user (self)
 */
router.patch("/attendance/self", authMiddleware, async (req, res, next) => {
  try {
    const { semester, month, percentage } = req.body;

    if (!semester || !month || percentage === undefined) {
      return errorResponse(res, 400, "Missing required fields");
    }
    if (percentage < 0 || percentage > 100) {
      return errorResponse(res, 400, "Percentage must be between 0 and 100");
    }

    const profile = await Profile.findOne({ userId: req.user.id });
    if (!profile) {
      return errorResponse(res, 404, "Profile not found");
    }

    const semExists = profile.attendance?.some(s => s.semester === semester);

    if (semExists) {
      // Update existing semester's month using positional operator — bypasses pre-save hook
      await Profile.updateOne(
        { userId: req.user.id, 'attendance.semester': semester },
        { $set: { [`attendance.$.months.${month}`]: { percentage } } }
      );
    } else {
      // Push a new semester entry
      await Profile.updateOne(
        { userId: req.user.id },
        { $push: { attendance: { semester, months: { [month]: { percentage } } } } }
      );
    }

    const updated = await Profile.findOne({ userId: req.user.id });
    return res.status(200).json({
      success: true,
      message: "Attendance updated successfully",
      attendance: updated.attendance
    });
  } catch (err) { return next(err); }
});

/**
 * @route PATCH /api/profile/attendance
 * @desc Update attendance (Admin Only)
 * @access Admin
 */
router.patch("/attendance", authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const { userId, semester, month, percentage } = req.body;
    
    if (!userId || !semester || !month || percentage === undefined) {
      return errorResponse(res, 400, "Missing required fields");
    }

    if (percentage < 0 || percentage > 100) {
      return errorResponse(res, 400, "Percentage must be between 0 and 100");
    }

    const profile = await Profile.findOne({ userId });
    if (!profile) {
      return errorResponse(res, 404, "Profile not found");
    }

    const semExists = profile.attendance?.some(s => s.semester === semester);

    if (semExists) {
      await Profile.updateOne(
        { userId, 'attendance.semester': semester },
        { $set: { [`attendance.$.months.${month}`]: { percentage } } }
      );
    } else {
      await Profile.updateOne(
        { userId },
        { $push: { attendance: { semester, months: { [month]: { percentage } } } } }
      );
    }

    const updated = await Profile.findOne({ userId });
    return res.status(200).json({
      success: true,
      message: "Attendance updated successfully",
      attendance: updated.attendance
    });
  } catch (err) { return next(err);
  }
});

/**
 * @route DELETE /api/profile/:id
 * @desc Delete user profile (Admin Only)
 * @access Admin
 */
router.delete("/:id", authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const deletedProfile = await Profile.findByIdAndDelete(req.params.id);
    
    if (!deletedProfile) {
      return errorResponse(res, 404, "Profile not found");
    }
    
    return res.status(200).json({
      success: true,
      message: "Profile deleted successfully"
    });
  } catch (err) { return next(err);
  }
});

module.exports = router;