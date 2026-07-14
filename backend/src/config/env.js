/**
 * Environment Configuration — Fail-fast validation
 * 
 * Validates that ALL required environment variables are present
 * at startup. Prevents the server from running in a broken state
 * where it would silently fail on the first DB query or JWT sign.
 */

const { logger } = require('../utils/logger');

const requiredVars = [
    'MONGO_URI',
    'JWT_SECRET',
];

function validateEnv() {
    const missing = requiredVars.filter((key) => !process.env[key]);

    if (missing.length > 0) {
        logger.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
        logger.error('Create a .env file in the backend/ directory. See .env.example for reference.');
        process.exit(1);
    }

    // Warn on weak JWT secret in production
    if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET.length < 32) {
        logger.warn('⚠️  JWT_SECRET is shorter than 32 characters. Use a stronger secret in production.');
    }

    logger.info('✅ Environment variables validated');
}

module.exports = { validateEnv };
