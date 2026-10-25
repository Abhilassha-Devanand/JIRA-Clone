const mongoose = require('mongoose');
const env = require('./env');

const connectDB = async () => {
  if (!env.MONGODB_URI) {
    const error = new Error('MONGODB_URI is not configured.');
    console.error(`[MongoDB Connection Error] ${error.message}`);
    throw error;
  }

  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`[MongoDB Connected] Database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB Connection Error] ${error.name}: Unable to connect to MongoDB.`);
    throw error;
  }
};

mongoose.connection.on('disconnected', () => {
  console.log('[MongoDB Event] Disconnected from database.');
});

mongoose.connection.on('reconnected', () => {
  console.log('[MongoDB Event] Reconnected to database.');
});

module.exports = connectDB;
