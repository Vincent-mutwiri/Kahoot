import mongoose from 'mongoose';

export type RedemptionRoundStatus = 'active' | 'completed';

const redemptionRoundSchema = new mongoose.Schema({
  gameId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Game', 
    required: true 
  },
  questionIndex: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['active', 'completed'],
    default: 'active',
    required: true 
  },
  startedAt: { type: Date, default: Date.now },
  endsAt: { type: Date, required: true },
  redeemedPlayerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Player',
    default: null 
  },
  createdAt: { type: Date, default: Date.now }
});

// Index for faster querying
redemptionRoundSchema.index({ gameId: 1, questionIndex: 1 });

export const RedemptionRound = mongoose.models.RedemptionRound || 
  mongoose.model('RedemptionRound', redemptionRoundSchema);
