
const mongoose = require('mongoose');

const AdvertisementSchema = new mongoose.Schema({
  wholesalerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: String,
  imageUrl: String,
  targetCategory: {
    type: String,
    enum: ['Electronics', 'Clothing', 'Food', 'Home', 'Other']
  },
  budget: { type: Number, required: true },
  impressions: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['active', 'paused', 'completed'],
    default: 'active'
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Advertisement', AdvertisementSchema);
