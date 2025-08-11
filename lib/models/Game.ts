import mongoose from 'mongoose';

export type GameStatus = 'active' | 'finished' | 'lobby';

const gameSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  hostName: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['active', 'finished', 'lobby'],
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
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field on save
gameSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const Game = mongoose.models.Game || mongoose.model('Game', gameSchema);
