const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// 🔥 MongoDB connect
mongoose.connect("mongodb+srv://zonguru:<Wsadwsad123>@cluster0.jixn4t6.mongodb.net/?appName=Cluster0")
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// User Schema
const UserSchema = new mongoose.Schema({
  username: String,
  balance: Number
});

const User = mongoose.model("User", UserSchema);

// Deposit
app.post("/deposit", async (req, res) => {
  const { user, amount } = req.body;

  let u = await User.findOne({ username: user });

  if (!u) {
    u = new User({ username: user, balance: 0 });
  }

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

  u.balance -= amount;
  await u.save();

  res.json({ success: true, balance: u.balance });
});

// Balance check
app.get("/balance/:user", async (req, res) => {
  const u = await User.findOne({ username: req.params.user });
  res.json({ balance: u ? u.balance : 0 });
});

app.listen(3000, () => console.log("Server running"));
  res.json({ success: true, balance: u.balance });
});

// User list
app.get("/users", async (req, res) => {
  const users = await User.find();
  res.json(users);
});

app.listen(3000, () => console.log("Server running"));
