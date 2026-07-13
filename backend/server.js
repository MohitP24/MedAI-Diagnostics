/**
 * MedAI Diagnostics - Secure Backend API
 * Node.js + Express (MERN Stack)
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const predictionRoutes = require('./routes/predictionRoutes');

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 3001;

// --- Cybersecurity Middleware ---
// 1. Set Security HTTP headers
app.use(helmet());

// 2. Strict CORS policy
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Only allow frontend URL
    methods: 'GET,POST,PUT,DELETE',
    credentials: true,
}));

// 3. Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. Rate Limiting to prevent DDoS
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes.'
});
app.use('/api/', limiter);

// --- Static Files (Heatmaps) ---
// Note: In production, heatmaps could be stored in S3/Cloudinary.
// Here we use Helmet configuration to allow serving images locally
app.use(
    '/heatmaps',
    helmet.crossOriginResourcePolicy({ policy: "cross-origin" }),
    express.static(path.join(__dirname, 'public', 'heatmaps'))
);

app.use(
    '/api/uploads',
    helmet.crossOriginResourcePolicy({ policy: "cross-origin" }),
    express.static(path.join(__dirname, 'uploads'))
);

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/predictions', predictionRoutes);

// --- Heatmap Cleanup Job ---
async function cleanupOldHeatmaps() {
    const heatmapDir = path.join(__dirname, 'public', 'heatmaps');
    const TTL = 24 * 60 * 60 * 1000; // 24 hours

    try {
        await fs.mkdir(heatmapDir, { recursive: true });
        const files = await fs.readdir(heatmapDir);
        const now = Date.now();

        for (const file of files) {
            const filePath = path.join(heatmapDir, file);
            const stats = await fs.stat(filePath);
            if (now - stats.mtimeMs > TTL) {
                await fs.unlink(filePath);
                console.log(`Cleaned up old heatmap: ${file}`);
            }
        }
    } catch (error) {
        console.error('Error cleaning up heatmaps:', error);
    }
}

// --- Error Handling Middleware ---
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(err.status || 500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
    });
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`🚀 Secure API Server running on port ${PORT}`);
    console.log(`📊 Auth API: http://localhost:${PORT}/api/auth`);
    console.log(`🧠 Prediction API: http://localhost:${PORT}/api/predictions`);
    
    // Run cleanup on startup and schedule periodic cleanup
    cleanupOldHeatmaps();
    setInterval(cleanupOldHeatmaps, 6 * 60 * 60 * 1000);
});

module.exports = app;
