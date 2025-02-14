import User from '../models/user.model.js';
import Otp from '../models/otp.model.js';
import Token from '../models/token.model.js';
import { sendOTPViaSMS } from '../utils/otpUtils.js';
import { generateTokens } from '../utils/tokenUtils.js';
import { v4 as uuidv4 } from "uuid";
import jwt from 'jsonwebtoken';

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

        // Set tokens as HTTP-only cookies
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', 
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000 // 15 minutes
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', 
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

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
       

        // Get refresh token from multiple sources
        const refreshToken = req.cookies?.refreshToken || req.header("Authorization")?.replace("Bearer ", "")
        console.log('Refresh Token:', refreshToken);
        // If no refresh token found, return unauthorized
        if (!refreshToken) {
            console.warn('No refresh token found in request');
            return res.status(401).json({ 
                message: 'No refresh token found',
                error: 'UNAUTHORIZED' 
            });
        }

        // Verify refresh token
        let decoded;
        try { 
            decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)
        } catch (verifyError) {
            console.error('Refresh token verification failed:', verifyError);
            // Clear the invalid cookie
            res.clearCookie('refreshToken');
            return res.status(401).json({ 
                message: 'Invalid or expired refresh token',
                error: 'TOKEN_EXPIRED' 
            });
        }
        
        // Find user
        const user = await User.findById(decoded.userId);
        if (!user) {
            // Clear the cookie if user not found
            res.clearCookie('refreshToken');
            return res.status(401).json({ 
                message: 'User not found',
                error: 'USER_NOT_FOUND' 
            });
        }

        // Generate new tokens
        const { accessToken, newRefreshToken } = generateTokens(user);

        // Update refresh token in database
        await Token.findOneAndUpdate({ 
            token: refreshToken,
            user: user._id 
        }, { 
            token: newRefreshToken,
            isActive: true 
        });

        // Set new refresh token as HTTP-only cookie
        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // use secure in production
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // Return new access token
        res.json({ 
            accessToken,
            user: {
                id: user._id,
                name: user.name,
                phoneNumber: user.phoneNumber,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.clearCookie('refreshToken');
        res.status(401).json({ 
            message: 'Token refresh failed',
            error: 'REFRESH_FAILED' 
        });
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
        // Try to get refresh token from request body or cookies
        const refreshToken = req.body.refreshToken || req.cookies.refreshToken;
        
        // If no user context (e.g., token expired), attempt logout based on refresh token
        if (!req.user) {
            if (!refreshToken) {
                return res.status(200).json({ 
                    message: 'No active session found. Already logged out.',
                    logoutType: 'FORCE_LOGOUT'
                });
            }

            // Try to find and invalidate the token even if user context is lost
            const existingToken = await Token.findOne({ token: refreshToken });
            if (existingToken) {
                await Token.findByIdAndUpdate(existingToken._id, { 
                    isActive: false, 
                    logoutTimestamp: new Date() 
                });
            }

            return res.status(200).json({ 
                message: 'Session invalidated successfully',
                logoutType: 'TOKEN_INVALIDATION'
            });
        }

        // Normal logout flow with user context
        if (refreshToken) {
            // Remove specific refresh token
            await Token.findOneAndDelete({ 
                token: refreshToken,
                user: req.user.id 
            });
        }

        // Check and limit active logins
        const activeTokens = await Token.find({ 
            user: req.user.id,
            isActive: true 
        });

        // If more than 5 active tokens, remove the oldest ones
        if (activeTokens.length > 5) {
            const tokensToRemove = activeTokens
                .sort((a, b) => a.createdAt - b.createdAt)
                .slice(0, activeTokens.length - 5);
            
            await Token.deleteMany({ 
                _id: { $in: tokensToRemove.map(token => token._id) } 
            });
        }

        // Invalidate all tokens for this user
        await Token.updateMany(
            { user: req.user.id },
            { 
                isActive: false, 
                logoutTimestamp: new Date() 
            }
        );

        // Clear cookies
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');

        res.status(200).json({ 
            message: 'Logged out successfully',
            logoutType: 'FULL_LOGOUT'
        });
    } catch (error) {
        console.error('Logout error:', error);
        
        // Handle specific error scenarios
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                message: 'Invalid token',
                error: 'INVALID_TOKEN' 
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(200).json({ 
                message: 'Session expired. Logged out.',
                logoutType: 'EXPIRED_SESSION'
            });
        }

        res.status(500).json({ 
            message: 'Logout failed', 
            error: error.message 
        });
    }
};
