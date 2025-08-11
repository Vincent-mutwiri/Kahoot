import mongoose from 'mongoose';
import { Game, Player, Question, RedemptionRound, Vote } from '../lib/models';

// Export all models
export { Game, Player, Question, RedemptionRound, Vote };

// Export the mongoose connection
export const connectToDatabase = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    return mongoose.connection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

// Export mongoose for direct access if needed
export { mongoose };