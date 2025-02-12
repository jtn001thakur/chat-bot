import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { generateOTP, getOTPExpiry } from '../utils/otpUtils.js';

// Request OTP for login/register
export const requestOTP = async (req, res) => {
    try {
        const { phone } = req.body;
        
        if (!phone) {
            return res.status(400).json({ message: 'Phone number is required' });
        }

        // Generate OTP
        const otp = generateOTP();
        const otpExpiry = getOTPExpiry();

        // Find or create user
        let user = await User.findOne({ phone });
        if (!user) {
            user = new User({ phone });
        }

        // Update user's OTP
        user.otp = {
            code: otp,
            expiresAt: otpExpiry
        };
        await user.save();

        // In production, you would send OTP via SMS here
        // For development, we'll send it in response
        res.json({ 
            message: 'OTP sent successfully',
            otp: process.env.NODE_ENV === 'development' ? otp : undefined
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Verify OTP and complete registration/login
export const verifyOTP = async (req, res) => {
    try {
        const { phone, otp, name, avatar } = req.body;

        const user = await User.findOne({ phone });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if OTP exists and is valid
        if (!user.otp?.code || !user.otp?.expiresAt || user.otp.code !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // Check if OTP is expired
        if (new Date() > new Date(user.otp.expiresAt)) {
            return res.status(400).json({ message: 'OTP expired' });
        }

        // If this is a new user (not verified), update profile
        if (!user.isVerified && name) {
            user.name = name;
            if (avatar) user.avatar = avatar;
        }

        // Mark user as verified and clear OTP
        user.isVerified = true;
        user.otp = undefined;
        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, phone: user.phone, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Authentication successful',
            user: {
                _id: user._id,
                name: user.name,
                phone: user.phone,
                avatar: user.avatar,
                role: user.role,
                isVerified: user.isVerified
            },
            token
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const user = new User({ username, email, password });
        await user.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !await user.comparePassword(password)) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({user, token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
