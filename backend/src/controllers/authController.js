const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');
const ApiError = require('../utils/ApiError');

// --- Helper Functions ---
const generateAccessToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '7d'
    });
};

const generateRefreshToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '7d'
    });
};

const sendTokenResponse = (user, statusCode, res) => {
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Don't send password in response
    user.password = undefined;
    user.refreshToken = undefined;

    res.status(statusCode).json({
        success: true,
        user,
        token: accessToken, // for backward compatibility with frontend
        accessToken,
        refreshToken
    });
};

// --- Controllers ---

/**
 * @desc    Register a new user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
        throw ApiError.conflict('User with that email already exists');
    }

    // Create user
    const user = await User.create({
        name,
        email,
        password
    });

    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken = refreshToken;
    await user.save();

    sendTokenResponse(user, 201, res);
});

/**
 * @desc    Login user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Check for user and include password and refreshToken fields
    const user = await User.findOne({ email }).select('+password +refreshToken');
    
    if (!user || !(await user.matchPassword(password))) {
        throw ApiError.unauthorized('Invalid email or password');
    }

    // Generate new refresh token
    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken = refreshToken;
    await user.save();

    sendTokenResponse(user, 200, res);
});

/**
 * @desc    Get current logged in user
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
    // req.user is already set by protect middleware
    res.status(200).json({
        success: true,
        user: req.user
    });
});

/**
 * @desc    Refresh access token
 * @route   POST /api/v1/auth/refresh
 * @access  Public
 */
const refresh = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        
        const user = await User.findById(decoded.id).select('+refreshToken');
        
        if (!user || user.refreshToken !== refreshToken) {
            throw new Error();
        }

        const newAccessToken = generateAccessToken(user._id);
        const newRefreshToken = generateRefreshToken(user._id);

        user.refreshToken = newRefreshToken;
        await user.save();

        res.status(200).json({
            success: true,
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            token: newAccessToken // backward compatibility
        });
    } catch (error) {
        throw ApiError.unauthorized('Invalid or expired refresh token');
    }
});

module.exports = {
    register,
    login,
    getMe,
    refresh
};
