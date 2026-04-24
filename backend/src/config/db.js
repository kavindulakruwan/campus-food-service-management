const mongoose = require('mongoose');
const dns = require('dns');

// Atlas SRV lookups can fail on some ISP DNS resolvers; use stable public resolvers first.
dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4', '1.0.0.1']);

mongoose.set('bufferCommands', false);
mongoose.set('bufferTimeoutMS', 5000);

// Retry logic with exponential backoff for transient DNS/network failures
const connectDBWithRetry = async (maxRetries = 3, initialDelayMs = 1000) => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error('MONGO_URI is not configured in environment variables');
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // readyState: 0 disconnected, 1 connected, 2 connecting, 3 disconnecting
      if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
        return true;
      }

      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 20000,
        connectTimeoutMS: 20000,
        socketTimeoutMS: 60000,
        family: 4,
        maxPoolSize: 20,
        minPoolSize: 1,
        heartbeatFrequencyMS: 10000,
        retryWrites: true,
        retryReads: true,
      });
      console.log('[INFO] MongoDB connected successfully');
      return true;
    } catch (error) {
      const isLastAttempt = attempt === maxRetries;
      const isTransientError = error.message.includes('ENOTFOUND') || 
                               error.message.includes('ETIMEDOUT') || 
                               error.message.includes('ECONNREFUSED') ||
                               error.message.includes('getaddrinfo');

      if (!isTransientError || isLastAttempt) {
        throw error;
      }

      // Exponential backoff: 1s, 2s, 4s
      const delayMs = initialDelayMs * Math.pow(2, attempt - 1);
      console.warn(`[WARN] MongoDB connection attempt ${attempt}/${maxRetries} failed (${error.message}). Retrying in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
};

const connectDB = async () => {
  try {
    return await connectDBWithRetry(3, 1000);
  } catch (error) {
    throw new Error(`MongoDB connection failed after retries: ${error.message}`);
  }
};

const getMongoStatus = () => ({
  // Mongoose readyState: 0 disconnected, 1 connected, 2 connecting, 3 disconnecting
  connected: mongoose.connection.readyState === 1,
  readyState: mongoose.connection.readyState,
});

module.exports = { connectDB, getMongoStatus };