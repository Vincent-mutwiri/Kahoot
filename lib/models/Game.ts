import mongoose from 'mongoose';

export type GameStatus = 'active' | 'finished' | 'lobby';
export type GameState = 'lobby' | 'question' | 'elimination' | 'survivors' | 'leaderboard' | 'redemption' | 'round_results';

const gameSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  hostName: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['active', 'finished', 'lobby'],
    default: 'lobby',
    required: true 
  },
  gameState: {
    type: String,
    enum: ['lobby', 'question', 'elimination', 'survivors', 'leaderboard', 'redemption', 'round_results'],
    default: 'lobby',
    required: true
  },
  currentPrizePot: { type: Number, default: 0 },
  initialPrizePot: { type: Number, default: 0 },
  prizePotIncrement: { type: Number, default: 0 },
  currentQuestionIndex: { type: Number, default: 0 },
  maxPlayers: { type: Number, default: 100 },
  gameDurationMinutes: { type: Number, default: 60 },
  roundDurationSeconds: { type: Number, default: 300 },
  mediaUrl: { type: String, default: null },
  soundId: { type: String, default: null },
  eliminationVideoUrl: { type: String, default: null },
  survivorVideoUrl: { type: String, default: null },
  redemptionVideoUrl: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field on save
gameSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const Game = mongoose.models.Game || mongoose.model('Game', gameSchema);
