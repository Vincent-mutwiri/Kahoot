import mongoose from 'mongoose';

export type PlayerStatus = 'active' | 'eliminated' | 'redeemed';

const playerSchema = new mongoose.Schema({
  username: { type: String, required: true },
  gameId: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true },
  status: { 
    type: String, 
    enum: ['active', 'eliminated', 'redeemed'],
    default: 'active',
    required: true 
  },
  balance: { type: Number, default: 0 },
  score: { type: Number, default: 0 },
  eliminatedRound: { type: Number, default: null },
  joinedAt: { type: Date, default: Date.now }
});

export const Player = mongoose.models.Player || mongoose.model('Player', playerSchema);
