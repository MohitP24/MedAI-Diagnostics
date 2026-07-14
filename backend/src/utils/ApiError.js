/**
 * ApiError — Custom operational error class
 * 
 * Extends native Error with HTTP status codes, operational flags,
 * and field-level validation errors. Used across all controllers
 * and services for consistent error propagation.
 * 
 * Usage:
 *   throw new ApiError(400, 'Invalid email format');
 *   throw ApiError.badRequest('Missing required field: name');
 *   throw ApiError.unauthorized('Token expired');
 */

class ApiError extends Error {
    /**
     * @param {number} statusCode - HTTP status code
     * @param {string} message - Human-readable error message
     * @param {Array} errors - Optional field-level validation errors
     * @param {boolean} isOperational - Distinguishes programmer errors from operational errors
     */
    constructor(statusCode, message, errors = [], isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
        this.isOperational = isOperational;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

        // Capture stack trace, excluding constructor call from it
        Error.captureStackTrace(this, this.constructor);
    }

    // --- Factory Methods for Common HTTP Errors ---

    static badRequest(message = 'Bad Request', errors = []) {
        return new ApiError(400, message, errors);
    }

    static unauthorized(message = 'Not authorized') {
        return new ApiError(401, message);
    }

    static forbidden(message = 'Forbidden — insufficient permissions') {
        return new ApiError(403, message);
    }

    static notFound(message = 'Resource not found') {
        return new ApiError(404, message);
    }

    static conflict(message = 'Resource already exists') {
        return new ApiError(409, message);
    }

    static tooManyRequests(message = 'Too many requests — please try again later') {
        return new ApiError(429, message);
    }

    static internal(message = 'Internal server error') {
        return new ApiError(500, message, [], false);
    }
}

module.exports = ApiError;
