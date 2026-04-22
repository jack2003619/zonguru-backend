const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json());

// 🔗 MongoDB connect
mongoose.connect("mongodb+srv://zonguru:<Wsadwsad123>@cluster0.a7zf0vj.mongodb.net/?appName=Cluster0");

const UserSchema = new mongoose.Schema({
  username: String,
  balance: { type: Number, default: 0 }
});

const User = mongoose.model("User", UserSchema);

// Deposit
app.post("/deposit", async (req, res) => {
  const { user, amount } = req.body;

  let u = await User.findOne({ username: user });
  if (!u) u = new User({ username: user, balance: 0 });

  u.balance += Number(amount);
  await u.save();

  res.json({ success: true, balance: u.balance });
});

// Withdraw
app.post("/withdraw", async (req, res) => {
  const { user, amount } = req.body;

  let u = await User.findOne({ username: user });
  if (!u || u.balance < amount) {
    return res.json({ success: false, message: "Not enough balance" });
  }

  u.balance -= Number(amount);
  await u.save();

  res.json({ success: true, balance: u.balance });
});

// User list
app.get("/users", async (req, res) => {
  const users = await User.find();
  res.json(users);
});

app.listen(3000, () => console.log("Server running"));
