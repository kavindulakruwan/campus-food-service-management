const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error('MONGO_URI is not configured in environment variables');
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('MongoDB connected successfully');
    return true;
  } catch (error) {
    throw new Error(`MongoDB connection failed: ${error.message}`);
  }
};

const getMongoStatus = () => ({
  // Mongoose readyState: 0 disconnected, 1 connected, 2 connecting, 3 disconnecting
  connected: mongoose.connection.readyState === 1,
  readyState: mongoose.connection.readyState,
});

module.exports = { connectDB, getMongoStatus };