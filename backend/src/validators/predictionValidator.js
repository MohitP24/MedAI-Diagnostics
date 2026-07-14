/**
 * Joi schemas for Prediction routes
 */
const Joi = require('joi');

const listPredictionsSchema = Joi.object({
    page: Joi.number()
        .integer()
        .min(1)
        .default(1),
    limit: Joi.number()
        .integer()
        .min(1)
        .max(100) // Prevent fetching too many records at once
        .default(20),
    sort: Joi.string()
        .valid('createdAt', '-createdAt', 'confidence', '-confidence')
        .default('-createdAt'),
    filter: Joi.string()
        .valid('benign', 'malignant', 'normal')
        .optional()
});

const predictSchema = Joi.object({
    models: Joi.string()
        .valid('all', 'resnet101', 'inceptionv3', 'efficientnetb0')
        .default('all')
});

module.exports = {
    listPredictionsSchema,
    predictSchema
};
