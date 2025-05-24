const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ObjectId } = require("mongodb");

const PORT = 3000;
const JWT_SECRET = "rx-secret"; // For production, use process.env.JWT_SECRET

// Replace with your actual MongoDB URI from Replit secrets or MongoDB Atlas
require('dotenv').config();
const mongoose = require('mongoose');

app.use(cors());
app.use(express.json());

// Connect MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

// Middleware to verify JWT token
function authenticateUser(req, res, next) {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ error: "Missing token" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid token" });
  }
}

// 🔐 Signup
app.post("/api/signup", async (req, res) => {
  const { username, password, type } = req.body;
  const exists = await db.collection("users").findOne({ username });
  if (exists) return res.status(409).json({ error: "User already exists" });

  await db.collection("users").insertOne({ username, password, type });
  res.json({ success: true });
});

// 🔐 Login
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await db.collection("users").findOne({ username, password });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign({ id: user._id, type: user.type }, JWT_SECRET);
  res.json({ token });
});
function distance(lat1, lng1, lat2, lng2) {
  const toRad = x => x * Math.PI / 180;
  const R = 6371; // Radius of Earth in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng/2)**2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

app.get("/api/products-nearby", authenticateUser, async (req, res) => {
  const { lat, lng } = req.query;

  const wholesalers = await db.collection("users").find({
    type: "wholesaler",
    location: { $exists: true }
  }).toArray();

  const nearbyWholesalerIds = wholesalers
    .filter(w => distance(parseFloat(lat), parseFloat(lng), w.location.lat, w.location.lng) < 10)
    .map(w => w._id.toString());

  const products = await db.collection("products").find({
    ownerId: { $in: nearbyWholesalerIds }
  }).toArray();

  res.json(products);
});

// 📦 Add Product (wholesaler only)
app.post("/api/products", authenticateUser, async (req, res) => {
  if (req.user.type !== "wholesaler") {
    return res.status(403).json({ error: "Only wholesalers can add products" });
  }

  const product = {
    ...req.body,
    ownerId: req.user.id
  };

  await db.collection("products").insertOne(product);
  res.json({ success: true });
});

// 📦 Get Products (retailers see all nearby)
app.get("/api/products", authenticateUser, async (req, res) => {
  const products = await db.collection("products").find().toArray();
  res.json(products);
});

// 📢 Add Advertisement (wholesaler)
app.post("/api/ads", authenticateUser, async (req, res) => {
  if (req.user.type !== "wholesaler") {
    return res.status(403).json({ error: "Only wholesalers can upload ads" });
  }

  const ad = {
    ...req.body,
    ownerId: req.user.id
  };

  await db.collection("ads").insertOne(ad);
  res.json({ success: true });
});

// 📢 Get Advertisements
app.get("/api/ads", authenticateUser, async (req, res) => {
  const ads = await db.collection("ads").find().toArray();
  res.json(ads);
});

// 🧾 Save Order (retailer)
app.post("/api/orders", authenticateUser, async (req, res) => {
  if (req.user.type !== "retailer") {
    return res.status(403).json({ error: "Only retailers can place orders" });
  }

  const { items } = req.body;
  const total = items.reduce((sum, item) => sum + item.price, 0);
  const order = {
    retailerId: req.user.id,
    items,
    total,
    createdAt: new Date()
  };

  const result = await db.collection("orders").insertOne(order);
  res.json({ success: true, orderId: result.insertedId });
});

// 🔄 Get Orders (Retailer or Wholesaler view)
app.get("/api/orders", authenticateUser, async (req, res) => {
  const query =
    req.user.type === "retailer"
      ? { retailerId: req.user.id }
      : { "items.ownerId": req.user.id };

  const orders = await db.collection("orders").find(query).toArray();
  res.json(orders);
});

// 🌐 Root Route
app.get("/", (req, res) => {
  res.send("🟢 Rx Ledger Backend is running!");
});
app.post("/api/set-location", authenticateUser, async (req, res) => {
  const { lat, lng } = req.body;

  if (req.user.type !== "wholesaler") {
    return res.status(403).json({ error: "Only wholesalers can set location" });
  }

  await db.collection("users").updateOne(
    { _id: new ObjectId(req.user.id) },
    { $set: { location: { lat, lng } } }
  );

  res.json({ success: true });
});
// 🚀 Start Server
app.listen(PORT, () => {
  console.log(`⚙️ Server running on http://localhost:${PORT}`);
});
const path = require("path");

// Serve frontend files
app.use(express.static(path.join(__dirname, "public"))); // assuming frontend is in 'public'

// Optional: Respond to root route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Your existing API and database code here...


app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));