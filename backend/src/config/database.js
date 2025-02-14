import mongoose from 'mongoose';

const config = {
    development: {
         db: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/chat_bot'
    },
    production: {
        db: process.env.MONGODB_URI
    },
    test: {
        db: 'mongodb://127.0.0.1:27017/chat_bot'
    }
};

const dbConfig = config[process.env.NODE_ENV || 'development'];

export const connectDB = async () => {
    try {
        await mongoose.connect(dbConfig.db);
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
        process.exit(1);
    }
};

export default dbConfig;
