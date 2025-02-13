import jwt from 'jsonwebtoken';
import Token from '../models/token.model.js';
import User from '../models/user.model.js';

// Middleware to verify access token
export const verifyToken = async (req, res, next) => {
    try {
        // Extract token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ 
                message: 'No authorization header provided',
                error: 'UNAUTHORIZED' 
            });
        }

        // Split the header and extract token
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return res.status(401).json({ 
                message: 'Invalid authorization header format',
                error: 'INVALID_TOKEN_FORMAT' 
            });
        }

        const token = parts[1];

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

        // Optional: Check if session is still valid
        if (decoded.sessionId) {
            const tokenRecord = await Token.findOne({
                token: token,
                sessionId: decoded.sessionId,
                isActive: true
            });

            if (!tokenRecord) {
                return res.status(401).json({ 
                    message: 'Session is no longer valid',
                    error: 'SESSION_INVALIDATED' 
                });
            }
        }

        // Check if user still exists
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({ 
                message: 'User no longer exists',
                error: 'USER_NOT_FOUND' 
            });
        }

        // Attach user and decoded token info to request
        req.user = {
            id: user._id,
            role: user.role,
            phoneNumber: user.phoneNumber
        };
        req.tokenInfo = decoded;

        next();
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(500).json({ 
            message: 'Internal server error during authentication',
            error: 'AUTHENTICATION_ERROR' 
        });
    }
};

// Middleware to check user role
export const checkRole = (allowedRoles) => {
    return (req, res, next) => {
        // Ensure user and role exist
        if (!req.user || !req.user.role) {
            return res.status(403).json({ 
                message: 'Access denied',
                error: 'NO_USER_ROLE' 
            });
        }

        // Check if user's role is in the allowed roles
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: 'Insufficient permissions',
                error: 'INSUFFICIENT_PERMISSIONS' 
            });
        }

        next();
    };
};

export default verifyToken;
