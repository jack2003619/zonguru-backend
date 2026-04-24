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

// TEST
app.get("/", (req, res) => {
  res.send("API WORKING");
});

// PRODUCTS
app.get("/products", async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

// VIP PRODUCTS
app.get("/products/:vip", async (req, res) => {
  const vip = Number(req.params.vip);
  const products = await Product.find({
    vipLevel: { $lte: vip }
  });
  res.json(products);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running"));
