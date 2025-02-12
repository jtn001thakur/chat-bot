import express from 'express';
import * as authController from '../controllers/authController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get("/", (req, res) => {
    res.send('Hello World!');
});

// OTP-based authentication routes
router.post('/request-otp', authController.requestOTP);
router.post('/verify-otp', authController.verifyOTP);

export default router;
