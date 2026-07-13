const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Will fallback to localhost if MONGO_URI is not set
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/medai');
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ Error connecting to MongoDB: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
