const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const verifyToken = require('../middleware/auth');

// 🛍️ Place Order
router.post('/', verifyToken, async (req, res) => {
  if (req.user.role !== 'retailer') return res.status(403).send('Access denied');

  const { items } = req.body;
  let total = 0;
  let wholesalerId = null;

  const populatedItems = await Promise.all(
    items.map(async ({ productId, quantity }) => {
      const product = await Product.findById(productId);
      if (!product) throw new Error('Product not found');
      if (wholesalerId && product.wholesalerId.toString() !== wholesalerId)
        throw new Error('All products must be from the same wholesaler');

      wholesalerId = product.wholesalerId.toString();
      total += product.price * quantity;

      return { productId, quantity };
    })
  );

  const order = await Order.create({
    retailerId: req.user.id,
    wholesalerId,
    items: populatedItems,
    totalPrice: total
  });

  res.json(order);
});

// 📦 View Retailer Orders
router.get('/my', verifyToken, async (req, res) => {
  const orders = await Order.find({ retailerId: req.user.id }).populate('items.productId');
  res.json(orders);
});