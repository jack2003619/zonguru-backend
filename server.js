const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// 👇 MongoDB connect (ENV variable သုံး)
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// Models
const User = mongoose.model("User", {
  username: String,
  password: String,
  balance: Number,
  vipLevel: Number
});

const Product = mongoose.model("Product", {
  name: String,
  image: String,
  price: Number,
  vipLevel: Number
});

// Register
app.post("/register", async (req, res) => {
  const user = new User({
    ...req.body,
    balance: 0,
    vipLevel: 1
  });
  await user.save();
  res.json({ message: "Registered" });
});

// Login
app.post("/login", async (req, res) => {
  const user = await User.findOne(req.body);
  if (!user) return res.json({ error: "Invalid" });
  res.json(user);
});

// Products
app.get("/products/:vip", async (req, res) => {
  const products = await Product.find({
    vipLevel: { $lte: req.params.vip }
  });
  res.json(products);
});

app.listen(3000, () => console.log("Server running"));
