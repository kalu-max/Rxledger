const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  wholesalerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: String,
  description: String,
  price: Number,
  mrp: Number,
  offer: String,     // e.g. "10% Off"
  stock: Number,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', ProductSchema);