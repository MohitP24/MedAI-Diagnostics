/**
 * Validate Middleware — Joi schema enforcement at the route boundary
 * 
 * Accepts a Joi schema and validates req.body, req.query, or req.params.
 * Returns a clean 400 error with field-level messages on failure.
 * 
 * Usage:
 *   router.post('/register', validate(registerSchema), controller.register);
 *   router.get('/', validate(paginationSchema, 'query'), controller.list);
 */

const ApiError = require('../utils/ApiError');

/**
 * @param {import('joi').ObjectSchema} schema - Joi validation schema
 * @param {'body' | 'query' | 'params'} source - Which part of the request to validate
 */
const validate = (schema, source = 'body') => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req[source], {
            abortEarly: false,       // Report ALL errors, not just the first
            stripUnknown: true,      // Remove fields not in schema
            allowUnknown: false,     // Reject unknown fields
        });

        if (error) {
            const fieldErrors = error.details.map((detail) => ({
                field: detail.path.join('.'),
                message: detail.message.replace(/"/g, ''),
            }));

            return next(ApiError.badRequest('Validation failed', fieldErrors));
        }

        // Replace req[source] with the sanitized, validated values
        req[source] = value;
        next();
    };
};

module.exports = validate;
