const jwt = require('jsonwebtoken');
const User = require('../models/User');
const SystemSettings = require('../models/SystemSettings');

const hasAnyRole = (userRole, allowedRoles = []) => {
  const hierarchy = {
    user: 1,
    mentor: 2,
    admin: 3,
    superadmin: 4,
    principal: 5,
    master: 6
  };

  const userRank = hierarchy[userRole] || 0;
  return allowedRoles.some((role) => userRank >= (hierarchy[role] || 0));
};

// Authentication middleware
const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token, authorization denied' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user by id
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    if (user.role === 'user') {
      const settings = await SystemSettings.findOne({ key: 'global' }).lean();
      const windows = settings?.studentLoginWindowsByYear || {};
      const currentYear = Number(user.yearOfStudy);

      if (!Number.isInteger(currentYear) || currentYear < 1 || currentYear > 4) {
        return res.status(403).json({ error: 'Your year of study is not configured. Contact admin to enable your login window.' });
      }

      const yearWindow = windows?.[`year${currentYear}`];
      if (!yearWindow?.enabled || !yearWindow?.startAt || !yearWindow?.endAt) {
        return res.status(403).json({ error: `Login window is not configured for Year ${currentYear}. Contact admin.` });
      }

      const startAt = new Date(yearWindow.startAt);
      const endAt = new Date(yearWindow.endAt);
      const now = new Date();

      if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime()) || startAt >= endAt) {
        return res.status(403).json({ error: `Login window configuration is invalid for Year ${currentYear}. Contact admin.` });
      }

      if (now < startAt || now > endAt) {
        return res.status(403).json({
          error: `Login is currently closed for Year ${currentYear}. Allowed window: ${startAt.toISOString()} to ${endAt.toISOString()}`
        });
      }
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token has expired' });
    }
    return res.status(401).json({ error: 'Token is not valid' });
  }
};

// Admin middleware - checks if authenticated user is an admin
const adminMiddleware = (req, res, next) => {
  if (req.user && hasAnyRole(req.user.role, ['admin'])) {
    next();
  } else {
    return res.status(403).json({ error: 'Admin access required' });
  }
};

// Mentor middleware - checks if authenticated user is a mentor
const mentorMiddleware = (req, res, next) => {
  if (req.user && hasAnyRole(req.user.role, ['mentor'])) {
    next();
  } else {
    return res.status(403).json({ error: 'Mentor access required' });
  }
};

//super admin middleware


// Super Admin middleware
const superAdminMiddleware = (req, res, next) => {
  if (req.user && hasAnyRole(req.user.role, ['superadmin'])) {
    next();
  } else {
    return res.status(403).json({ error: "Super Admin access required" });
  }
};

// Principal middleware
const principalMiddleware = (req, res, next) => {
  if (req.user && hasAnyRole(req.user.role, ['principal'])) {
    next();
  } else {
    return res.status(403).json({ error: "Principal access required" });
  }
};

// Master middleware
const masterMiddleware = (req, res, next) => {
  if (req.user && req.user.role === "master") {
    next();
  } else {
    return res.status(403).json({ error: "Master access required" });
  }
};

module.exports = {
  authMiddleware,
  adminMiddleware,
  mentorMiddleware,
  superAdminMiddleware,
  principalMiddleware,
  masterMiddleware
};
