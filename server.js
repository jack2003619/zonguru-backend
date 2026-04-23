const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ MongoDB connect
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// =======================
// MODELS
// =======================

// User model
const User = mongoose.model("User", {
  username: String,
  password: String,
  balance: { type: Number, default: 0 },
  vipLevel: { type: Number, default: 1 }
});

// Product model
const Product = mongoose.model("Product", {
  name: String,
  image: String,
  price: Number,
  vipLevel: Number
});

// =======================
// AUTH ROUTES
// =======================

// Register
app.post("/register", async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.json({ message: "Registered Successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
app.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({
      username: req.body.username,
      password: req.body.password
    });

    if (!user) {
      return res.json({ error: "Invalid Username or Password" });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =======================
// PRODUCTS ROUTES
// =======================

// 🔥 All products (VIP မစစ်)
app.get("/products", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔥 VIP filter products
app.get("/products/:vip", async (req, res) => {
  try {
    const vip = Number(req.params.vip);

    const products = await Product.find({
      vipLevel: { $lte: vip }
    });

    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =======================
// SERVER START
// =======================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
