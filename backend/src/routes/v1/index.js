const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const predictionRoutes = require('./predictionRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/predictions', predictionRoutes);

module.exports = router;
