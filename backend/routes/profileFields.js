const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middlewares/authMiddleware');
const ProfileFieldConfig = require('../models/ProfileFieldConfig');
const { initializeDefaultFieldConfigs } = require('../utils/profileFieldUtils');

/**
 * @route GET /api/profile-fields
 * @desc Get all profile field configurations
 * @access Public
 */
router.get('/', async (req, res, next) => {
  try {
    const fields = await ProfileFieldConfig.find({ department: null }).sort({ createdAt: 1 });
    res.status(200).json(fields);
  } catch (err) {
    next(err);
  }
});

/**
 * @route GET /api/profile-fields/enabled
 * @desc Get only enabled profile fields
 * @access Public
 */
router.get('/enabled', async (req, res, next) => {
  try {
    const fields = await ProfileFieldConfig.find({ department: null, enabled: true }).sort({ createdAt: 1 });
    res.status(200).json(fields);
  } catch (err) {
    next(err);
  }
});

/**
 * @route PUT /api/profile-fields/:fieldName
 * @desc Update a profile field configuration
 * @access Admin
 */
router.put('/:fieldName', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const { fieldName } = req.params;
    const { enabled, required, fieldLabel, description } = req.body;

    const updateData = {};
    if (enabled !== undefined) updateData.enabled = enabled;
    if (required !== undefined) updateData.required = required;
    if (fieldLabel !== undefined) updateData.fieldLabel = fieldLabel;
    if (description !== undefined) updateData.description = description;

    const field = await ProfileFieldConfig.findOneAndUpdate(
      { fieldName, department: null },
      updateData,
      { new: true }
    );

    if (!field) {
      return res.status(404).json({ error: 'Field not found' });
    }

    res.status(200).json({ message: 'Field updated successfully', field });
  } catch (err) {
    next(err);
  }
});

/**
 * @route PUT /api/profile-fields/:fieldName/enable
 * @desc Enable a profile field
 * @access Admin
 */
router.put('/:fieldName/enable', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const { fieldName } = req.params;

    const field = await ProfileFieldConfig.findOneAndUpdate(
      { fieldName, department: null },
      { enabled: true },
      { new: true }
    );

    if (!field) {
      return res.status(404).json({ error: 'Field not found' });
    }

    res.status(200).json({ message: 'Field enabled successfully', field });
  } catch (err) {
    next(err);
  }
});

/**
 * @route PUT /api/profile-fields/:fieldName/disable
 * @desc Disable a profile field
 * @access Admin
 */
router.put('/:fieldName/disable', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const { fieldName } = req.params;

    const field = await ProfileFieldConfig.findOneAndUpdate(
      { fieldName, department: null },
      { enabled: false },
      { new: true }
    );

    if (!field) {
      return res.status(404).json({ error: 'Field not found' });
    }

    res.status(200).json({ message: 'Field disabled successfully', field });
  } catch (err) {
    next(err);
  }
});

/**
 * @route POST /api/profile-fields/initialize
 * @desc Initialize default field configurations
 * @access Superadmin
 */
router.post('/initialize', authMiddleware, SUPERADMIN, async (req, res, next) => {
  try {
    await initializeDefaultFieldConfigs();
    const fields = await ProfileFieldConfig.find({ department: null }).sort({ createdAt: 1 });
    res.status(200).json({ message: 'Field configurations initialized', fields });
  } catch (err) {
    next(err);
  }
});

// Middleware to check for superadmin
function SUPERADMIN(req, res, next) {
  if (req.user?.role !== 'superadmin') {
    return res.status(403).json({ error: 'Only superadmins can initialize field configurations' });
  }
  next();
}

module.exports = router;
