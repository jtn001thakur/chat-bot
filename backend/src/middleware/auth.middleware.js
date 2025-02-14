import jwt from 'jsonwebtoken';
import Token from '../models/token.model.js';
import User from '../models/user.model.js';

// Middleware to verify access token
export const verifyToken = async (req, res, next) => {
    try {
        // Extract token from multiple sources
        let token;

        // 1. Check Authorization header
        const authHeader = req.headers.authorization;
        if (authHeader) {
            const parts = authHeader.split(' ');
            if (parts.length === 2 && parts[0] === 'Bearer') {
                token = parts[1];
            }
        }

        // 2. Check cookies
        if (!token && req.cookies?.accessToken) {
            token = req.cookies.accessToken;
        }

        // 3. Check request body
        if (!token && req.body?.accessToken) {
            token = req.body.accessToken;
        }

        // No token found
        if (!token) {
            return res.status(401).json({ 
                message: 'No access token provided',
                error: 'UNAUTHORIZED' 
            });
        }

        // Verify the token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (verifyError) {
            if (verifyError.name === 'TokenExpiredError') {
                return res.status(401).json({ 
                    message: 'Token expired',
                    error: 'TOKEN_EXPIRED' 
                });
            }
            return res.status(401).json({ 
                message: 'Invalid token',
                error: 'INVALID_TOKEN' 
            });
        }

        // Check if token contains required fields
        if (!decoded.userId || !decoded.role) {
            return res.status(401).json({ 
                message: 'Invalid token payload',
                error: 'INVALID_TOKEN_PAYLOAD' 
            });
        }

        // Find user
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({ 
                message: 'User not found',
                error: 'USER_NOT_FOUND' 
            });
        }

        // Attach user to request
        req.user = {
            id: user._id,
            role: user.role,
            phoneNumber: user.phoneNumber
        };

        next();
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(500).json({ 
            message: 'Internal server error during authentication',
            error: 'AUTHENTICATION_ERROR' 
        });
    }
};

// Create a middleware function that can be used directly
const auth = (req, res, next) => {
    return verifyToken(req, res, next);
};

export default auth;
