
const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  retailerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  wholesalerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: Number
  }],
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered'],
    default: 'pending'
  },
  totalPrice: Number,
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Generate invoice after order creation
OrderSchema.post('save', async function(doc) {
  if (!doc.invoiceId) {
    const Invoice = mongoose.model('Invoice');
    const Product = mongoose.model('Product');
    
    // Populate items with product details
    const populatedItems = await Promise.all(doc.items.map(async (item) => {
      const product = await Product.findById(item.productId);
      return {
        productId: product._id,
        name: product.name,
        quantity: item.quantity,
        price: product.price,
        subtotal: product.price * item.quantity
      };
    }));

    const subtotal = populatedItems.reduce((sum, item) => sum + item.subtotal, 0);
    const tax = subtotal * 0.1; // 10% tax
    
    const invoice = await Invoice.create({
      orderId: doc._id,
      invoiceNumber: `INV-${Date.now()}`,
      retailerId: doc.retailerId,
      wholesalerId: doc.wholesalerId,
      items: populatedItems,
      subtotal: subtotal,
      tax: tax,
      total: subtotal + tax,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    });

    doc.invoiceId = invoice._id;
    await doc.save();
  }
});

module.exports = mongoose.model('Order', OrderSchema);
