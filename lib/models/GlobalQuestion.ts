import mongoose from 'mongoose';

const globalQuestionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  answers: [{ type: String, required: true }],
  correctAnswerIndex: { type: Number, required: true },
  mediaUrl: { type: String, default: null },
  category: { type: String, default: 'General' },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  createdBy: { type: String, required: true },
  isPublic: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

globalQuestionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const GlobalQuestion = mongoose.models.GlobalQuestion || mongoose.model('GlobalQuestion', globalQuestionSchema);