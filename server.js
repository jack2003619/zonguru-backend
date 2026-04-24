require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// 🔥 MongoDB connect
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// 🔥 Models
const User = mongoose.model("User", {
  username: String,
  password: String,
  balance: { type: Number, default: 0 },
  vipLevel: { type: Number, default: 1 }
});

const Product = mongoose.model("Product", {
  name: String,
  image: String,
  price: Number,
  vipLevel: Number
});

// 🔥 TEST
app.get("/", (req, res) => {
  res.send("API WORKING");
});

// 🔥 REGISTER
app.post("/register", async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.json({ message: "Registered" });
  } catch (err) {
    res.json({ error: err.message });
  }
});

// 🔥 LOGIN
app.post("/login", async (req, res) => {
  try {
    const user = await User.findOne(req.body);
    if (!user) return res.json({ error: "Invalid login" });
    res.json(user);
  } catch (err) {
    res.json({ error: err.message });
  }
});

// 🔥 ALL PRODUCTS
app.get("/products", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.json({ error: err.message });
  }
});

// 🔥 VIP PRODUCTS
app.get("/products/:vip", async (req, res) => {
  try {
    const vip = Number(req.params.vip);
    const products = await Product.find({
      vipLevel: { $lte: vip }
    });
    res.json(products);
  } catch (err) {
    res.json({ error: err.message });
  }
});

// 🔥 💰 ADD BALANCE
app.post("/add-balance", async (req, res) => {
  try {
    const { userId, amount } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.json({ error: "User not found" });

    user.balance += amount;
    await user.save();

    res.json({
      message: "Balance added",
      balance: user.balance
    });
  } catch (err) {
    res.json({ error: err.message });
  }
});

// 🔥 🛒 BUY PRODUCT
app.post("/buy", async (req, res) => {
  try {
    const { userId, productId } = req.body;

    const user = await User.findById(userId);
    const product = await Product.findById(productId);

    if (!user || !product) {
      return res.json({ error: "User or product not found" });
    }

    // VIP check
    if (user.vipLevel < product.vipLevel) {
      return res.json({ error: "VIP level too low" });
    }

    // Balance check
    if (user.balance < product.price) {
      return res.json({ error: "Not enough balance" });
    }

    // Deduct balance
    user.balance -= product.price;
    await user.save();

    res.json({
      message: "Purchase success",
      balance: user.balance
    });

  } catch (err) {
    res.json({ error: err.message });
  }
});

// 🔥 RUN SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running"));
