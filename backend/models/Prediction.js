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
        required: true
    },
    ensemblePrediction: {
        type: String,
        required: true,
        default: 'unknown'
    },
    confidence: {
        type: Number,
        required: true,
        default: 0
    },
    heatmapPath: {
        type: String,
        required: false,   // Grad-CAM can fail; this is optional
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

const Prediction = mongoose.model('Prediction', predictionSchema);
module.exports = Prediction;
