
const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const verifyToken = require('../auth');

// Get all invoices for a user
router.get('/', verifyToken, async (req, res) => {
  try {
    const invoices = await Invoice.find({
      $or: [
        { retailerId: req.user.id },
        { wholesalerId: req.user.id }
      ]
    }).populate('orderId');
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get specific invoice
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('orderId')
      .populate('retailerId')
      .populate('wholesalerId');
    
    if (!invoice) return res.status(404).send('Invoice not found');
    
    if (![invoice.retailerId._id.toString(), invoice.wholesalerId._id.toString()].includes(req.user.id)) {
      return res.status(403).send('Access denied');
    }
    
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update invoice status
router.patch('/:id/status', verifyToken, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).send('Invoice not found');
    
    if (invoice.wholesalerId.toString() !== req.user.id) {
      return res.status(403).send('Access denied');
    }
    
    invoice.status = req.body.status;
    await invoice.save();
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
