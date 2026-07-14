require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const fs = require('fs');
const path = require('path');

const connectDB = require('./src/config/db');
const { validateEnv } = require('./src/config/env');
const { logger, morganMiddleware } = require('./src/utils/logger');
const errorHandler = require('./src/middleware/errorHandler');
const { generalLimiter } = require('./src/middleware/rateLimiter');
const queueService = require('./src/services/queueService');
const inferenceService = require('./src/services/inferenceService');
const v1Routes = require('./src/routes/v1');

// 1. Validate environment before starting
validateEnv();

// 2. Initialize Express app
const app = express();

// 3. Connect to Database
connectDB();

// 4. Ensure tmp_uploads directory exists for Multer
if (!fs.existsSync('tmp_uploads')) {
    fs.mkdirSync('tmp_uploads');
}

// 5. Security Middleware
app.use(helmet()); // Set security HTTP headers
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
})); // Enable CORS
app.use(mongoSanitize()); // Prevent NoSQL Injection
app.use(xss()); // Prevent XSS attacks
app.use(hpp()); // Prevent HTTP Parameter Pollution

// 6. Standard Middleware
app.use(express.json({ limit: '1mb' })); // Body parser
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(morganMiddleware); // HTTP request logging
app.use(generalLimiter); // Apply general rate limit to all requests
app.use('/heatmaps', express.static(path.join(__dirname, 'public/heatmaps'))); // Serve heatmaps statically

// 7. Health & Monitoring Endpoints (Unprotected)
app.get('/health', (req, res) => res.status(200).send('OK'));

app.get('/health/ready', async (req, res) => {
    const mongoose = require('mongoose');
    const dbState = mongoose.connection.readyState;
    const pythonUp = await inferenceService.checkHealth();
    
    if (dbState === 1 && pythonUp) {
        res.status(200).json({ status: 'ready', database: 'connected', pythonService: 'reachable' });
    } else {
        res.status(503).json({ 
            status: 'not_ready', 
            database: dbState === 1 ? 'connected' : 'disconnected',
            pythonService: pythonUp ? 'reachable' : 'unreachable'
        });
    }
});

app.get('/health/metrics', (req, res) => {
    res.status(200).json({
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        queue: queueService.getStatus()
    });
});

// 8. Mount API Routes
app.use('/api/v1', v1Routes);

// Catch-all for undefined routes
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
    });
});

// 9. Global Error Handler (must be last)
app.use(errorHandler);

// 10. Start Server
const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
    logger.info(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// 11. Graceful Shutdown
const gracefulShutdown = async (signal) => {
    logger.info(`\n${signal} received. Starting graceful shutdown...`);
    
    // Stop accepting new requests
    server.close(async () => {
        logger.info('HTTP server closed.');
        
        try {
            // Wait for queue to drain
            await queueService.drain();
            
            // Close DB connection
            const mongoose = require('mongoose');
            await mongoose.connection.close(false);
            logger.info('MongoDB connection closed.');
            
            process.exit(0);
        } catch (error) {
            logger.error(`Error during shutdown: ${error.message}`);
            process.exit(1);
        }
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions and rejections
process.on('uncaughtException', (err) => {
    logger.error(`Uncaught Exception: ${err.message}`, { stack: err.stack });
    process.exit(1);
});

process.on('unhandledRejection', (err) => {
    logger.error(`Unhandled Rejection: ${err.message}`, { stack: err.stack });
    server.close(() => process.exit(1));
});
