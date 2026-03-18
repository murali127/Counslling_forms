const jwt = require('jsonwebtoken');
const User = require('../models/User');

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
  if (req.user && (req.user.role === 'admin' || req.user.role === 'superadmin')) {
    next();
  } else {
    return res.status(403).json({ error: 'Admin access required' });
  }
};

// Mentor middleware - checks if authenticated user is a mentor
const mentorMiddleware = (req, res, next) => {
  if (req.user && (req.user.role === 'mentor' || req.user.role === 'admin' || req.user.role === 'superadmin')) {
    next();
  } else {
    return res.status(403).json({ error: 'Mentor access required' });
  }
};

//super admin middleware


// Super Admin middleware
const superAdminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === "superadmin") {
    next();
  } else {
    return res.status(403).json({ error: "Super Admin access required" });
  }
};

// Principal middleware
const principalMiddleware = (req, res, next) => {
  if (req.user && req.user.role === "principal") {
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
