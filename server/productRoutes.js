const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const verifyToken = require('../middleware/auth');

// ➕ Add Product (only wholesalers)
router.post('/', verifyToken, async (req, res) => {
  if (req.user.role !== 'wholesaler') return res.status(403).send('Access denied');

  const product = new Product({
    wholesalerId: req.user.id,
    ...req.body
  });

  await product.save();
  res.json(product);
});

// 📋 Get All Products of Logged-in Wholesaler
router.get('/my', verifyToken, async (req, res) => {
  const products = await Product.find({ wholesalerId: req.user.id });
  res.json(products);
});

// ✏️ Update Product
router.put('/:id', verifyToken, async (req, res) => {
  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, wholesalerId: req.user.id },
    req.body,
    { new: true }
  );
  res.json(product);
});

// ❌ Delete Product
router.delete('/:id', verifyToken, async (req, res) => {
  await Product.findOneAndDelete({ _id: req.params.id, wholesalerId: req.user.id });
  res.json({ message: 'Deleted' });
});