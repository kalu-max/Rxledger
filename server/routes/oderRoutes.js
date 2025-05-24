
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/product');
const verifyToken = require('../auth');

// Place Order (with bulk support and inventory update)
router.post('/', verifyToken, async (req, res) => {
  if (req.user.role !== 'retailer') return res.status(403).send('Access denied');

  const { items } = req.body;
  let total = 0;
  let wholesalerId = null;

  try {
    // Transaction to handle inventory updates
    const session = await mongoose.startSession();
    session.startTransaction();

    const populatedItems = await Promise.all(
      items.map(async ({ productId, quantity }) => {
        const product = await Product.findById(productId);
        if (!product) throw new Error('Product not found');
        if (wholesalerId && product.wholesalerId.toString() !== wholesalerId)
          throw new Error('All products must be from same wholesaler');
        
        if (product.stock < quantity)
          throw new Error(`Insufficient stock for ${product.name}`);

        // Update inventory
        await Product.findByIdAndUpdate(productId, {
          $inc: { stock: -quantity }
        });

        // Check if stock alert needed
        if ((product.stock - quantity) <= product.minStockAlert) {
          // Here you would trigger notification to wholesaler
          console.log(`Low stock alert for ${product.name}`);
        }

        wholesalerId = product.wholesalerId.toString();
        
        // Apply bulk discount
        let price = product.price;
        if (quantity >= 10) price *= 0.9; // 10% discount
        total += price * quantity;

        return { productId, quantity };
      })
    );

    const order = await Order.create({
      retailerId: req.user.id,
      wholesalerId,
      items: populatedItems,
      totalPrice: total,
      status: 'pending'
    });

    await session.commitTransaction();
    res.json(order);
  } catch (err) {
    await session.abortTransaction();
    res.status(400).json({ message: err.message });
  }
});

// Update order status
router.patch('/:orderId/status', verifyToken, async (req, res) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.orderId);
  
  if (!order) return res.status(404).send('Order not found');
  if (order.wholesalerId.toString() !== req.user.id)
    return res.status(403).send('Access denied');

  order.status = status;
  order.updatedAt = Date.now();
  await order.save();
  
  res.json(order);
});

module.exports = router;
