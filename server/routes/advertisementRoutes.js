
const express = require('express');
const router = express.Router();
const Advertisement = require('../models/Advertisement');
const verifyToken = require('../auth');

// Create new ad
router.post('/', verifyToken, async (req, res) => {
  try {
    const ad = new Advertisement({
      ...req.body,
      wholesalerId: req.user.id
    });
    await ad.save();
    res.status(201).json(ad);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all ads for wholesaler
router.get('/my-ads', verifyToken, async (req, res) => {
  try {
    const ads = await Advertisement.find({ wholesalerId: req.user.id });
    res.json(ads);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get relevant ads for retailer
router.get('/relevant', verifyToken, async (req, res) => {
  try {
    const { category } = req.query;
    const query = {
      status: 'active',
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    };
    if (category) query.targetCategory = category;
    
    const ads = await Advertisement.find(query)
      .populate('wholesalerId', 'name');
    res.json(ads);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Track ad impression
router.post('/:id/impression', verifyToken, async (req, res) => {
  try {
    const ad = await Advertisement.findById(req.params.id);
    ad.impressions += 1;
    await ad.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Track ad click
router.post('/:id/click', verifyToken, async (req, res) => {
  try {
    const ad = await Advertisement.findById(req.params.id);
    ad.clicks += 1;
    await ad.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
