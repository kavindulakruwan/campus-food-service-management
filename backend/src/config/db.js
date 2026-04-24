const mongoose = require('mongoose');
const dns = require('dns');

// Atlas SRV lookups can fail on some ISP DNS resolvers; use stable public resolvers first.
dns.setServers(['8.8.8.8', '1.1.1.1']);

mongoose.set('bufferCommands', false);
mongoose.set('bufferTimeoutMS', 5000);

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error('MONGO_URI is not configured in environment variables');
  }

  // readyState: 0 disconnected, 1 connected, 2 connecting, 3 disconnecting
  if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
    return true;
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 12000,
      connectTimeoutMS: 12000,
      socketTimeoutMS: 45000,
      family: 4,
      maxPoolSize: 20,
      minPoolSize: 1,
      heartbeatFrequencyMS: 10000,
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