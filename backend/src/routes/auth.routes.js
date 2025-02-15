import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import auth from '../middleware/auth.middleware.js';
import { sanitizeInput } from '../middleware/sanitize.middleware.js';

const router = express.Router();

// Basic health check
router.get("/", (req, res) => {
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

// Logout route with optional authentication middleware
router.post('/logout', 
    (req, res, next) => {
        // Try to verify token if present, but don't block if verification fails
        auth(req, res, (err) => {
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
router.get('/profile', auth, authController.getProfile);

export default router;
