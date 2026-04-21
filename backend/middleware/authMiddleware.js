import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// 1. Protect routes from unauthenticated users
export const protect = async (req, res, next) => {
  let token;

  // Check if the request has an authorization header starting with "Bearer"
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header (Format: "Bearer <token>")
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token payload (excluding the password)
      req.user = await User.findById(decoded.id).select('-password');

      next(); // Passes control to the next function (e.g., createEvent)
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// 2. Protect routes from regular members (Admin Only)
export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};


// This middleware allows us to pass in specific roles that are allowed to hit a route
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // req.user should already be populated by 'protect/verifyToken' middleware
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Access Denied: Your role (${req.user?.role || 'Guest'}) cannot access this resource.` 
      });
    }
    next(); // Role is authorized, move to the controller!
  };
};