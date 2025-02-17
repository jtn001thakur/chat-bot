import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

const checkRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      // Get the token from the authorization header
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ 
          message: 'Authentication token is missing' 
        });
      }

      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find the user by ID
      const user = await User.findById(decoded.userId).select('role');
      
      if (!user) {
        return res.status(401).json({ 
          message: 'User not found' 
        });
      }

      // Check if the user's role is in the allowed roles
      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ 
          message: 'Access denied. Insufficient permissions.' 
        });
      }

      // Attach user information to the request
      req.user = user;
      next();
    } catch (error) {
      console.error('Role middleware error:', error);
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          message: 'Invalid authentication token' 
        });
      }
      
      res.status(500).json({ 
        message: 'Internal server error during role verification',
        error: error.message 
      });
    }
  };
};

// Predefined role checkers
export const isSuperAdmin = checkRole(['superadmin']);
export const isAdmin = checkRole(['admin', 'superadmin']);
export const isUser = checkRole(['user', 'admin', 'superadmin']);

export default checkRole;
