const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    imageFileName: {
        type: String,
        required: true
    },
    modelsUsed: {
        type: String,
        required: true,
        enum: ['all', 'resnet101', 'inceptionv3', 'efficientnetb0']
    },
    ensemblePrediction: {
        type: String,
        required: true,
        enum: ['benign', 'malignant', 'normal', 'unknown'],
        default: 'unknown'
    },
    confidence: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
        max: 1
    },
    heatmapPath: {
        type: String,
        required: false,
        default: ''
    },
    originalImagePath: {
        type: String,
        required: false,
        default: ''
    },
    modelDetails: {
        type: Object,
        required: false,
        default: {}
    }
}, {
    timestamps: true
});

// Compound Indexes for query optimization
predictionSchema.index({ user: 1, createdAt: -1 }); // Most common query: get user's history, newest first
predictionSchema.index({ ensemblePrediction: 1 }); // For stats/filtering by diagnosis
predictionSchema.index({ createdAt: -1 }); // Global sort for admin

const Prediction = mongoose.model('Prediction', predictionSchema);
module.exports = Prediction;
