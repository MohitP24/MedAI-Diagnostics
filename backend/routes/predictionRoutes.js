const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const http = require('http');
const { v4: uuidv4 } = require('uuid');
const FormData = require('form-data');
const InferenceQueue = require('../queue');
const Prediction = require('../models/Prediction');
const { protect } = require('../middleware/auth');

const router = express.Router();
const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:5001';
const inferenceQueue = new InferenceQueue(1);

const upload = multer({
    dest: path.join(__dirname, '../tmp_uploads'),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPG, JPEG, and PNG are allowed.'));
        }
    }
});

async function runInference(imagePath, models, requestId) {
    const imageBuffer = await fs.readFile(imagePath);

    const form = new FormData();
    form.append('image', imageBuffer, {
        filename: path.basename(imagePath),
        contentType: 'image/jpeg',
    });
    form.append('models', models);
    form.append('request_id', requestId);

    // Parse the Flask server URL
    const flaskUrl = new URL(`${PYTHON_API_URL}/predict`);

    return new Promise((resolve, reject) => {
        const options = {
            hostname: flaskUrl.hostname,
            port: flaskUrl.port || 5001,
            path: flaskUrl.pathname,
            method: 'POST',
            headers: form.getHeaders(), // includes correct multipart boundary
            timeout: 120000, // 2 minutes for slow inference
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode >= 400) {
                    reject(new Error(`Flask server returned ${res.statusCode}: ${data}`));
                } else {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        reject(new Error(`Invalid JSON from Flask: ${data}`));
                    }
                }
            });
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Inference timed out (120s). Is the Python Flask server running on port 5001?'));
        });

        req.on('error', (err) => {
            if (err.code === 'ECONNREFUSED') {
                reject(new Error('Cannot connect to Python inference server on port 5001. Is it running?'));
            } else {
                reject(err);
            }
        });

        // Pipe the form-data stream into the request — this is the correct approach
        form.pipe(req);
    });
}

// @desc    Process ultrasound image
// @route   POST /api/predictions
// @access  Private
router.post('/', protect, upload.single('image'), async (req, res) => {
    let uploadedFilePath = null;

    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file uploaded' });
        }
        uploadedFilePath = req.file.path;
        const modelSelection = req.body.model || 'all';

        const requestId = uuidv4().split('-')[0];
        
        // Enqueue inference task
        const result = await inferenceQueue.enqueue(async () => {
            return await runInference(uploadedFilePath, modelSelection, requestId);
        });

        // Ensure array of heatmaps exists
        // Flask returns: result.models[modelName].gradcam_url  (NOT result.heatmaps)
        const modelResults = result.models || {};
        const firstHeatmap = Object.values(modelResults)
            .map(m => m.gradcam_url)
            .find(url => url) || '';

        // Flask returns: result.combined.voting, result.combined.avg_confidence
        // NOT result.ensemble_prediction or result.confidence
        const ensemblePrediction = (result.combined && result.combined.voting) || 'unknown';
        const confidence = (result.combined && result.combined.avg_confidence) || 0;

        // Save prediction to database
        const prediction = await Prediction.create({
            user: req.user._id,
            imageFileName: req.file.originalname,
            modelsUsed: modelSelection,
            ensemblePrediction,
            confidence,
            heatmapPath: firstHeatmap,
            originalImagePath: `/api/uploads/${path.basename(uploadedFilePath)}`,
            modelDetails: modelResults
        });

        res.status(201).json({
            ...result,
            dbId: prediction._id
        });

    } catch (error) {
        console.error('Error in /predict:', error);
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({ error: 'File too large' });
        }
        res.status(500).json({ error: 'Inference failed', message: error.message });
    } finally {
        // Original image is retained for the Dashboard history audit log
    }
});

// @desc    Get user's past predictions
// @route   GET /api/predictions
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const predictions = await Prediction.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(predictions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get global statistics (Public or Protected depending on use case)
// @route   GET /api/predictions/stats
// @access  Public
router.get('/stats', async (req, res) => {
    try {
        const total = await Prediction.countDocuments();
        
        const distribution = await Prediction.aggregate([
            { $group: { _id: "$ensemblePrediction", count: { $sum: 1 } } }
        ]);

        const avgConfidence = await Prediction.aggregate([
            { $group: { _id: null, avgConf: { $avg: "$confidence" } } }
        ]);

        res.json({
            totalPredictions: total,
            distribution: distribution.reduce((acc, curr) => {
                acc[curr._id] = curr.count;
                return acc;
            }, {}),
            averageConfidence: avgConfidence.length > 0 ? avgConfidence[0].avgConf : 0
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get a single prediction by ID
// @route   GET /api/predictions/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const prediction = await Prediction.findOne({ _id: req.params.id, user: req.user._id });
        if (!prediction) {
            return res.status(404).json({ message: 'Prediction not found' });
        }
        res.json(prediction);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


module.exports = router;
