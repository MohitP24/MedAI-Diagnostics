const fs = require('fs');
const path = require('path');
const asyncHandler = require('../middleware/asyncHandler');
const ApiError = require('../utils/ApiError');
const Prediction = require('../models/Prediction');
const inferenceService = require('../services/inferenceService');
const { logger } = require('../utils/logger');

/**
 * @desc    Create new prediction
 * @route   POST /api/v1/predictions
 * @access  Private
 */
const createPrediction = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw ApiError.badRequest('Please upload an image file');
    }

    const { models } = req.body;
    const uploadedFilePath = req.file.path;

    logger.info(`Processing prediction for user ${req.user._id}`);

    try {
        // Run inference via the service
        const pythonResponse = await inferenceService.runInference(uploadedFilePath, models);
        
        const { models: modelResults, combined, originalImage } = pythonResponse;

        if (!combined || !combined.voting) {
            throw ApiError.internal('Invalid response from inference service');
        }

        // Save prediction to DB
        const prediction = await Prediction.create({
            user: req.user._id,
            imageFileName: req.file.filename,
            modelsUsed: models || 'all',
            ensemblePrediction: combined.voting.toLowerCase(),
            confidence: combined.avg_confidence || 0,
            originalImagePath: originalImage || '',
            heatmapPath: modelResults ? Object.values(modelResults)[0]?.gradcam_url || '' : '',
            modelDetails: pythonResponse
        });

        res.status(201).json({
            success: true,
            data: prediction
        });

    } catch (error) {
        // Clean up uploaded file if process failed
        if (fs.existsSync(uploadedFilePath)) {
            fs.unlinkSync(uploadedFilePath);
        }
        throw error;
    }
});

/**
 * @desc    Get all predictions for current user
 * @route   GET /api/v1/predictions
 * @access  Private
 */
const getPredictions = asyncHandler(async (req, res) => {
    const { page, limit, sort, filter } = req.query;
    
    // Build query
    const query = { user: req.user._id };
    if (filter) {
        query.ensemblePrediction = filter;
    }

    // Calculate pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const startIndex = (pageNum - 1) * limitNum;

    // Execute query with pagination and sorting
    const predictions = await Prediction.find(query)
        .sort(sort)
        .skip(startIndex)
        .limit(limitNum);

    const total = await Prediction.countDocuments(query);

    res.status(200).json({
        success: true,
        data: predictions,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
            hasNext: startIndex + limitNum < total,
            hasPrev: startIndex > 0
        }
    });
});

/**
 * @desc    Get single prediction by ID
 * @route   GET /api/v1/predictions/:id
 * @access  Private
 */
const getPredictionById = asyncHandler(async (req, res) => {
    const prediction = await Prediction.findById(req.params.id);

    if (!prediction) {
        throw ApiError.notFound('Prediction not found');
    }

    // Ensure user owns this prediction or is an admin
    if (prediction.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        throw ApiError.forbidden('Not authorized to access this prediction');
    }

    res.status(200).json({
        success: true,
        data: prediction
    });
});

/**
 * @desc    Delete a prediction
 * @route   DELETE /api/v1/predictions/:id
 * @access  Private
 */
const deletePrediction = asyncHandler(async (req, res) => {
    const prediction = await Prediction.findById(req.params.id);

    if (!prediction) {
        throw ApiError.notFound('Prediction not found');
    }

    // Ensure user owns this prediction or is an admin
    if (prediction.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        throw ApiError.forbidden('Not authorized to delete this prediction');
    }

    await prediction.deleteOne();

    res.status(200).json({
        success: true,
        data: {}
    });
});

/**
 * @desc    Get prediction statistics for current user
 * @route   GET /api/v1/predictions/stats
 * @access  Private
 */
const getStats = asyncHandler(async (req, res) => {
    const stats = await Prediction.aggregate([
        { $match: { user: req.user._id } },
        {
            $group: {
                _id: '$ensemblePrediction',
                count: { $sum: 1 },
                avgConfidence: { $avg: '$confidence' }
            }
        }
    ]);

    const totalPredictions = stats.reduce((acc, curr) => acc + curr.count, 0);

    const distribution = stats.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
    }, {});

    const sumConfidence = stats.reduce((acc, curr) => acc + (curr.avgConfidence * curr.count), 0);
    const averageConfidence = totalPredictions > 0 ? sumConfidence / totalPredictions : 0;

    const formattedStats = {
        totalPredictions,
        distribution,
        averageConfidence
    };

    res.status(200).json({
        success: true,
        data: formattedStats
    });
});

module.exports = {
    createPrediction,
    getPredictions,
    getPredictionById,
    deletePrediction,
    getStats
};
