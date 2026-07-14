/**
 * Authentication & Authorization Middleware
 * 
 * - protect: Verifies JWT access token and attaches user to req.user
 * - authorize: Enforces Role-Based Access Control (RBAC)
 */

const jwt = require('jsonwebtoken');
const asyncHandler = require('./asyncHandler');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');

/**
 * Protect routes - ensures user is logged in with a valid access token
 */
const protect = asyncHandler(async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        throw ApiError.unauthorized('Not authorized to access this route. Please provide a token.');
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if user still exists (in case they were deleted after token was issued)
        const currentUser = await User.findById(decoded.id).select('-password');
        
        if (!currentUser) {
            throw ApiError.unauthorized('The user belonging to this token no longer exists.');
        }

        // Attach user to request
        req.user = currentUser;
        next();
    } catch (error) {
        // Let the global error handler deal with specific JWT errors (expired, invalid)
        throw error;
    }
});

/**
 * Authorize roles - ensures user has required role
 * @param {...string} roles - Allowed roles (e.g., 'admin', 'user')
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(ApiError.unauthorized('User not authenticated'));
        }

        if (!roles.includes(req.user.role)) {
            return next(ApiError.forbidden(`User role ${req.user.role} is not authorized to access this route`));
        }

        next();
    };
};

module.exports = { protect, authorize };
