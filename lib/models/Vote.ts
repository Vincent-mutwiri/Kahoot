import mongoose from 'mongoose';

const voteSchema = new mongoose.Schema({
  gameId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Game', 
    required: true 
  },
  questionIndex: { type: Number, required: true },
  voterPlayerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Player',
    required: true 
  },
  votedForPlayerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Player',
    required: true 
  },
  redemptionRoundId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'RedemptionRound',
    default: null 
  },
  createdAt: { type: Date, default: Date.now }
});

// Compound index to ensure a player can only vote once per question in a game
voteSchema.index(
  { gameId: 1, questionIndex: 1, voterPlayerId: 1 },
  { unique: true }
);

export const Vote = mongoose.models.Vote || mongoose.model('Vote', voteSchema);
