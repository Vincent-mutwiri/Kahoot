import mongoose from 'mongoose';

const globalSettingsSchema = new mongoose.Schema({
  settingType: { type: String, required: true, unique: true },
  eliminationVideoUrl: { type: String, default: '' },
  survivorVideoUrl: { type: String, default: '' },
  redemptionVideoUrl: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now }
});

globalSettingsSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const GlobalSettings = mongoose.models.GlobalSettings || mongoose.model('GlobalSettings', globalSettingsSchema);