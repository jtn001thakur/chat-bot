import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import { sanitizeInput } from '../middleware/sanitize.middleware.js';
import Application from '../models/application.model.js';

const router = express.Router();

// Basic health check
router.get('/', (req, res) => {
  res.send('Hello World!');
});

// Apply sanitization middleware to all auth routes
router.use(sanitizeInput);

// Authentication routes
router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/check-phone', authController.checkPhoneExists);
router.post('/send-registration-otp', authController.sendRegistrationOTP);
router.post('/send-reset-password-otp', authController.sendResetPasswordOTP);
router.post('/verify-otp', authController.verifyOTP);
router.post('/reset-password', authController.resetPassword);
router.post('/refresh-token', authController.refreshToken);

// Admin Login Route
router.post('/admin-login', async (req, res) => {
  try {
    const { applicationName, phoneNumber, password } = req.body;

    // Validate input
    if (!applicationName || !phoneNumber || !password) {
      return res.status(400).json({ 
        message: 'Application name, phone number, and password are required' 
      });
    }

    // Attempt admin login
    const loginResult = await Application.adminLogin(
      applicationName, 
      phoneNumber, 
      password
    );

    // Successful login
    res.status(200).json({
      message: 'Admin login successful',
      ...loginResult
    });
  } catch (error) {
    console.error('Admin Login Error:', error);
    res.status(401).json({ 
      message: error.message || 'Admin login failed' 
    });
  }
});

// Logout route with optional authentication middleware
router.post('/logout', 
            (req, res, next) => {
              // Try to verify token if present, but don't block if verification fails
              verifyToken(req, res, (err) => {
                if (err) {
                // If token verification fails, continue to logout
                  req.user = null;
                }
                next();
              });
            }, 
            authController.logout
);

// Profile route with authentication middleware
router.get('/profile', verifyToken, authController.getProfile);

export default router;
