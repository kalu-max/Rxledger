
const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  retailerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: String,
  createdAt: { type: Date, default: Date.now }
});

const ProductSchema = new mongoose.Schema({
  wholesalerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: String,
  description: String,
  category: {
    type: String,
    required: true,
    enum: ['Electronics', 'Clothing', 'Food', 'Home', 'Other']
  },
  price: Number,
  mrp: Number,
  offer: String,
  stock: Number,
  minStockAlert: { type: Number, default: 10 },
  reviews: [ReviewSchema],
  avgRating: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

ProductSchema.methods.updateAverageRating = function() {
  if (this.reviews.length === 0) {
    this.avgRating = 0;
  } else {
    const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
    this.avgRating = sum / this.reviews.length;
  }
};

module.exports = mongoose.model('Product', ProductSchema);
