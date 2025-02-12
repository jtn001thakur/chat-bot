import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import Otp from '../models/otp.model.js';
import Token from '../models/token.model.js';
import { sendOTPViaSMS } from '../utils/otpUtils.js';
import { generateTokens, verifyRefreshToken } from '../utils/tokenUtils.js';

export const login = async (req, res) => {
    try {
        const { phoneNumber, password } = req.body;
        
        // Find user by phone number
        const user = await User.findOne({ phoneNumber });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user);

        // Save refresh token to database
        await Token.create({ 
          token: refreshToken,
          user: user._id,
          isActive: true 
        });

        res.json({ 
            accessToken, 
            refreshToken,
            user: { 
                id: user._id, 
                phoneNumber: user.phoneNumber, 
                role: user.role 
            } 
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const checkPhoneExists = async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        const user = await User.findOne({ phoneNumber });
        
        res.json({ exists: !!user });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
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
                canLogin: true 
            });
        }

        // Generate OTP
        const otpRecord = await Otp.generateOTP(phoneNumber, 'registration');

        // Send OTP via SMS
        await sendOTPViaSMS(phoneNumber, otpRecord.otp);

        res.json({ 
            message: 'OTP sent successfully',
            canRegister: true 
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
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
                canRegister: true 
            });
        }

        // Generate OTP
        const otpRecord = await Otp.generateOTP(phoneNumber, 'reset_password');

        // Send OTP via SMS
        await sendOTPViaSMS(phoneNumber, otpRecord.otp);

        res.json({ message: 'OTP sent successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
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

            res.json({ 
                message: 'OTP verified successfully',
                verified: true 
            });
        } catch (error) {
            if (error.message === 'Max OTP attempts exceeded') {
                return res.status(400).json({ message: 'Max OTP attempts exceeded' });
            }
            throw error;
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
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
            return res.status(403).json({ message: 'OTP not verified' });
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
                id: newUser._id, 
                phoneNumber: newUser.phoneNumber, 
                role: newUser.role 
            } 
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
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
            return res.status(403).json({ message: 'OTP not verified' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        user.password = hashedPassword;
        await user.save();

        // Delete used OTP records
        await Otp.deleteMany({ 
            phoneNumber, 
            purpose: 'reset_password' 
        });

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
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
