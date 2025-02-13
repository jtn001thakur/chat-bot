import bcrypt from 'bcryptjs';
import User from '../models/user.model.js';
import Otp from '../models/otp.model.js';
import Token from '../models/token.model.js';
import { sendOTPViaSMS } from '../utils/otpUtils.js';
import { generateTokens, verifyRefreshToken } from '../utils/tokenUtils.js';
import { v4 as uuidv4 } from "uuid";

export const login = async (req, res) => {
    try {
        const { phoneNumber, password } = req.sanitizedBody; // Using sanitized input
        
        // Find user by phone number
        const user = await User.findOne({ phoneNumber }).select('+password +sessions');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            // Reset login attempts on successful login
            const clientIp = req.ip || req.connection.remoteAddress;
            if (global.loginAttempts) {
                global.loginAttempts.delete(clientIp);
            }
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check for maximum sessions (limit to 5 active sessions)
        const maxSessions = 5;
        if (user.sessions && user.sessions.length >= maxSessions) {
            // Remove oldest session
            user.sessions.sort((a, b) => a.lastActive - b.lastActive);
            await user.revokeSession(user.sessions[0].deviceId);
        }

        // Create new session
        const sessionId = uuidv4();
        
        // Safely extract device info with fallbacks
        const deviceInfo = req.deviceInfo || {};
        user.sessions.push({
            deviceId: sessionId,
            device: `${deviceInfo.browser || 'Unknown'} on ${deviceInfo.os || 'Unknown'}`,
            lastActive: new Date(),
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent'] || 'Unknown'
        });

        await user.save();

        // Generate tokens with session information
        const { accessToken, refreshToken } = generateTokens(user, sessionId);

        // Create and save refresh token
        await Token.create({
            user: user._id,
            token: refreshToken,
            deviceId: sessionId,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        });

        // Prepare user response (exclude sensitive fields)
        const userResponse = {
            _id: user._id,
            phoneNumber: user.phoneNumber,
            name: user.name,
            role: user.role
        };

        // Send response
        res.status(200).json({
            message: 'Login successful',
            accessToken,
            refreshToken,
            user: userResponse
        });
    } catch (error) {
        console.error('Login error:', error);
        
        // Handle Mongoose validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ 
                message: 'Invalid request data', 
                error: validationErrors.join(', ') 
            });
        }

        res.status(500).json({ 
            message: 'Invalid request data', 
            error: error.message || 'Unknown error occurred' 
        });
    }
};

export const checkPhoneExists = async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        const user = await User.findOne({ phoneNumber });
        
        res.json({ exists: !!user });
    } catch (error) {
        res.status(500).json({ message: 'Error checking phone number', error: error.message });
    }
};

export const sendRegistrationOTP = async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ phoneNumber });
        if (existingUser) {
            return res.status(400).json({ 
                message: 'Phone number already registered',
                error: 'PHONE_NUMBER_EXISTS' 
            });
        }

        // Generate OTP
        const otpRecord = await Otp.generateOTP(phoneNumber, 'registration');

        // Send OTP via SMS
        await sendOTPViaSMS(phoneNumber, otpRecord.otp);

        res.status(200).json({ message: 'OTP sent successfully', canRegister: true });
    } catch (error) {
        res.status(500).json({ message: 'Error sending OTP', error: error.message });
    }
};

export const sendResetPasswordOTP = async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        
        // Check if user exists
        const user = await User.findOne({ phoneNumber });
        if (!user) {
            return res.status(404).json({ 
                message: 'User not found',
                error: 'USER_NOT_FOUND' 
            });
        }

        // Generate OTP
        const otpRecord = await Otp.generateOTP(phoneNumber, 'reset_password');

        // Send OTP via SMS
        await sendOTPViaSMS(phoneNumber, otpRecord.otp);

        res.status(200).json({ message: 'OTP sent successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error sending OTP', error: error.message });
    }
};

export const verifyOTP = async (req, res) => {
    try {
        const { phoneNumber, otp, purpose } = req.body;
        
        try {
            // Verify OTP
            const otpRecord = await Otp.verifyOTP(phoneNumber, otp, purpose);
            
            if (!otpRecord) {
                return res.status(400).json({ message: 'Invalid or expired OTP' });
            }

            // Mark OTP as verified
            otpRecord.isVerified = true;
            await otpRecord.save();

            res.status(200).json({ 
                message: 'OTP verified successfully',
                verified: true 
            });
        } catch (verifyError) {
            return res.status(400).json({ 
                message: verifyError.message || 'OTP verification failed',
                verified: false 
            });
        }
    } catch (error) {
        res.status(500).json({ 
            message: 'Error verifying OTP', 
            error: error.message 
        });
    }
};

export const register = async (req, res) => {
    try {
        const { phoneNumber, password, name, role } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ phoneNumber });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Verify that OTP was verified
        const otpRecord = await Otp.findOne({ 
            phoneNumber, 
            purpose: 'registration', 
            isVerified: true 
        });

        if (!otpRecord) {
            return res.status(400).json({ 
                message: 'OTP not verified. Please verify OTP first.',
                error: 'OTP_NOT_VERIFIED' 
            });
        }

        // Create new user
        const newUser = new User({
            phoneNumber,
            password,
            name,
            role: role || 'user'
        });

        await newUser.save();

        // Delete used OTP records
        await Otp.deleteMany({ 
            phoneNumber, 
            purpose: 'registration' 
        });

        res.status(201).json({ 
            message: 'User registered successfully',
            user: { 
                _id: newUser._id, 
                phoneNumber: newUser.phoneNumber, 
                name: newUser.name, 
                role: newUser.role 
            }
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Registration failed', 
            error: error.message 
        });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { phoneNumber, newPassword } = req.body;
        
        // Find user
        const user = await User.findOne({ phoneNumber });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify that OTP was verified
        const otpRecord = await Otp.findOne({ 
            phoneNumber, 
            purpose: 'reset_password', 
            isVerified: true 
        });

        if (!otpRecord) {
            return res.status(400).json({ 
                message: 'OTP not verified. Please verify OTP first.',
                error: 'OTP_NOT_VERIFIED' 
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        // Delete used OTP records
        await Otp.deleteMany({ 
            phoneNumber, 
            purpose: 'reset_password' 
        });

        res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
        res.status(500).json({ 
            message: 'Password reset failed', 
            error: error.message 
        });
    }
};

export const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        
        // Verify refresh token
        const decoded = verifyRefreshToken(refreshToken);
        
        // Find user
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({ message: 'Invalid token' });
        }

        // Generate new access token
        const { accessToken, newRefreshToken } = generateTokens(user);

        // Update refresh token in database
        await Token.findOneAndUpdate({ 
          token: refreshToken,
          user: user._id 
        }, { 
          token: newRefreshToken,
          isActive: true 
        });

        res.json({ 
            accessToken, 
            refreshToken: newRefreshToken 
        });
    } catch (error) {
        res.status(401).json({ message: 'Invalid or expired token' });
    }
};

export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const logout = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        
        // Remove refresh token from database
        await Token.findOneAndDelete({ 
          token: refreshToken,
          user: req.user.id 
        });

        // Check and limit active logins
        const activeTokens = await Token.find({ 
          user: req.user.id,
          isActive: true 
        });

        // If more than 5 active tokens, remove the oldest ones
        if (activeTokens.length > 5) {
            const tokensToRemove = activeTokens.slice(0, activeTokens.length - 5);
            await Token.deleteMany({ 
              _id: { $in: tokensToRemove.map(token => token._id) } 
            });
        }

        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Logout failed', error: error.message });
    }
};
