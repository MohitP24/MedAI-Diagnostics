const mongoose = require('mongoose');
const { logger } = require('../utils/logger');

const connectDB = async (retries = 5, delay = 5000) => {
    while (retries > 0) {
        try {
            const conn = await mongoose.connect(process.env.MONGO_URI, {
                serverSelectionTimeoutMS: 5000,
            });
            logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);
            return;
        } catch (error) {
            retries -= 1;
            logger.error(`❌ MongoDB connection failed. Retries left: ${retries}`);
            logger.error(`Error: ${error.message}`);
            
            if (retries === 0) {
                logger.error('Could not connect to MongoDB after multiple attempts. Exiting...');
                process.exit(1);
            }
            
            // Wait before retrying
            await new Promise(res => setTimeout(res, delay));
        }
    }
};

module.exports = connectDB;
