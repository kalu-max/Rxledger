
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/product');
const verifyToken = require('../auth');

// Get sales analytics for wholesaler
router.get('/sales', verifyToken, async (req, res) => {
  try {
    const orders = await Order.find({ wholesalerId: req.user.id });
    const totalSales = orders.reduce((sum, order) => sum + order.totalPrice, 0);
    const salesByStatus = await Order.aggregate([
      { $match: { wholesalerId: req.user.id } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    res.json({ totalSales, salesByStatus });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get popular products
router.get('/popular-products', verifyToken, async (req, res) => {
  try {
    const products = await Product.find()
      .sort({ avgRating: -1 })
      .limit(10);
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
