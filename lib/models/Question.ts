import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  gameId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Game', 
    required: true 
  },
  questionText: { type: String, required: true },
  optionA: { type: String, required: true },
  optionB: { type: String, required: true },
  optionC: { type: String, required: true },
  optionD: { type: String, required: true },
  correctAnswer: { type: String, required: true },
  questionIndex: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Compound index to ensure questionIndex is unique per game
questionSchema.index({ gameId: 1, questionIndex: 1 }, { unique: true });

export const Question = mongoose.models.Question || mongoose.model('Question', questionSchema);
