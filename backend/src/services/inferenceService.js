const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const ApiError = require('../utils/ApiError');
const { logger } = require('../utils/logger');
const queueService = require('./queueService');

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:5001';

/**
 * Inference Service — Handles communication with the Python Flask server
 * Uses Axios with timeouts and retry logic.
 */
class InferenceService {
    /**
     * Run inference on an image
     * @param {string} filePath - Absolute path to the uploaded image
     * @param {string} models - Comma-separated list of models to use
     * @returns {Promise<Object>} - Inference result from Python server
     */
    static async runInference(filePath, models = 'all') {
        // We wrap the Axios call inside a queue task to prevent OOM on Render
        return queueService.enqueue(async () => {
            let fileStream;
            try {
                fileStream = fs.createReadStream(filePath);
                
                const formData = new FormData();
                formData.append('image', fileStream);
                formData.append('models', models);

                logger.info(`Sending inference request to Python server for ${filePath}`);
                
                const response = await axios.post(`${PYTHON_API_URL}/predict`, formData, {
                    headers: {
                        ...formData.getHeaders(),
                    },
                    timeout: 120000, // 2 minute timeout for cold starts
                    maxBodyLength: Infinity,
                });

                return response.data;
            } catch (error) {
                logger.error(`Python API Error: ${error.message}`);
                
                if (error.code === 'ECONNREFUSED') {
                    throw ApiError.internal('Python inference server is offline. Please try again later.');
                }
                
                if (error.code === 'ECONNABORTED') {
                    throw ApiError.internal('Inference timed out. The model is taking too long to load.');
                }
                
                if (error.response) {
                    throw new ApiError(
                        error.response.status, 
                        error.response.data.error || 'Python server returned an error', 
                        [], 
                        true
                    );
                }

                throw ApiError.internal('Failed to communicate with inference server');
            } finally {
                // Ensure file stream is closed if it was opened
                if (fileStream && typeof fileStream.close === 'function') {
                    fileStream.close();
                }
            }
        });
    }

    /**
     * Check if Python server is reachable
     */
    static async checkHealth() {
        try {
            const res = await axios.get(`${PYTHON_API_URL}/`, { timeout: 5000 });
            return res.status === 200;
        } catch (error) {
            return false;
        }
    }
}

module.exports = InferenceService;
