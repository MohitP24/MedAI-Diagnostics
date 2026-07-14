/**
 * Global Error Handler — Centralized error response formatting
 * 
 * This is the LAST middleware in the Express chain. Every error
 * thrown or passed via next(err) ends up here. It distinguishes
 * between operational errors (ApiError) and programmer bugs,
 * and formats a clean, consistent JSON response.
 */

const ApiError = require('../utils/ApiError');
const { logger } = require('../utils/logger');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
    // Default to 500 if no status code is set
    let error = { ...err, message: err.message };

    // --- Mongoose Bad ObjectId ---
    if (err.name === 'CastError') {
        error = ApiError.badRequest(`Invalid resource ID: ${err.value}`);
    }

    // --- Mongoose Duplicate Key ---
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue).join(', ');
        error = ApiError.conflict(`Duplicate value for field: ${field}`);
    }

    // --- Mongoose Validation Error ---
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map((val) => val.message);
        error = ApiError.badRequest('Validation failed', messages);
    }

    // --- JWT Errors ---
    if (err.name === 'JsonWebTokenError') {
        error = ApiError.unauthorized('Invalid token — please log in again');
    }

    if (err.name === 'TokenExpiredError') {
        error = ApiError.unauthorized('Token expired — please log in again');
    }

    // --- Multer File Size Error ---
    if (err.code === 'LIMIT_FILE_SIZE') {
        error = ApiError.badRequest('File too large — maximum size is 10MB');
    }

    const statusCode = error.statusCode || 500;
    const isProduction = process.env.NODE_ENV === 'production';

    // Log the full error (stack trace included for 500s)
    if (statusCode >= 500) {
        logger.error(`${statusCode} — ${err.message}`, { 
            stack: err.stack,
            url: req.originalUrl,
            method: req.method,
            ip: req.ip
        });
    } else {
        logger.warn(`${statusCode} — ${err.message}`, {
            url: req.originalUrl,
            method: req.method
        });
    }

    res.status(statusCode).json({
        status: error.status || 'error',
        message: error.message || 'Internal server error',
        ...(error.errors && error.errors.length > 0 && { errors: error.errors }),
        ...(!isProduction && { stack: err.stack }),
    });
};

module.exports = errorHandler;
