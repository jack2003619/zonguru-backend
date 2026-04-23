const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connect
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// Models
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

// TEST ROUTE (စမ်းဖို့)
app.get("/", (req, res) => {
  res.send("API WORKING");
});

// REGISTER
app.post("/register", async (req, res) => {
  const user = new User(req.body);
  await user.save();
  res.json({ message: "Registered" });
});

// LOGIN
app.post("/login", async (req, res) => {
  const user = await User.findOne(req.body);
  if (!user) return res.json({ error: "Invalid" });
  res.json(user);
});

// 🔥 ALL PRODUCTS (အရေးကြီး)
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running"));
