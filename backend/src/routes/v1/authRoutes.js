const express = require('express');
const router = express.Router();
const authController = require('../../controllers/authController');
const validate = require('../../middleware/validate');
const { authLimiter } = require('../../middleware/rateLimiter');
const { registerSchema, loginSchema, refreshTokenSchema } = require('../../validators/authValidator');
const { protect } = require('../../middleware/auth');

// Public routes with strict rate limiting
router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh', authLimiter, validate(refreshTokenSchema), authController.refresh);

// Protected routes
router.get('/me', protect, authController.getMe);

module.exports = router;
