/**
 * Tiered Rate Limiters — Different limits for different route types
 * 
 * Auth routes get aggressive limiting (brute-force protection).
 * Upload routes get moderate limiting (resource protection).
 * General API gets standard limiting (fair usage).
 */

const rateLimit = require('express-rate-limit');

// --- Auth endpoints: 5 attempts per 15 minutes ---
// Protects against credential stuffing and brute-force attacks
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        status: 'fail',
        message: 'Too many authentication attempts. Please try again after 15 minutes.',
    },
    standardHeaders: true,   // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false,    // Disable `X-RateLimit-*` headers
});

// --- Upload endpoints: 10 uploads per 15 minutes ---
// Prevents abuse of the compute-heavy inference pipeline
const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
        status: 'fail',
        message: 'Upload limit reached. Please try again after 15 minutes.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// --- General API: 100 requests per 15 minutes ---
// Standard fair-usage policy for all other endpoints
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        status: 'fail',
        message: 'Too many requests from this IP. Please try again after 15 minutes.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = { authLimiter, uploadLimiter, generalLimiter };
