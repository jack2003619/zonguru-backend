const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// MongoDB connect
mongoose.connect("mongodb+srv://zonguru:Wsadwsad123@cluster0.jixn4t6.mongodb.net/zonguru")
.then(() => console.log("MongoDB connected"))
.catch(err => console.log(err));

// User schema
const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
  balance: { type: Number, default: 0 }
});

const User = mongoose.model("User", UserSchema);

// test route
app.get("/", (req, res) => {
  res.send("Zonguru API Running with DB");
});

// REGISTER
app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  const existing = await User.findOne({ username });
  if (existing) {
    return res.json({ success: false, message: "User already exists" });
  }

  const user = new User({ username, password, balance: 0 });
  await user.save();

  res.json({ success: true, message: "Registered" });
});

// LOGIN
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username, password });

  if (!user) {
    return res.json({ success: false, message: "Invalid login" });
  }

  res.json({
    success: true,
    user: user.username,
    balance: user.balance
  });
});

// DEPOSIT
app.post("/deposit", async (req, res) => {
  const { user, amount } = req.body;

  const u = await User.findOne({ username: user });

  u.balance += Number(amount);
  await u.save();

  res.json({ success: true, balance: u.balance });
});

// WITHDRAW
app.post("/withdraw", async (req, res) => {
  const { user, amount } = req.body;

  const u = await User.findOne({ username: user });

  if (u.balance < amount) {
    return res.json({ success: false });
  }

  u.balance -= Number(amount);
  await u.save();

  res.json({ success: true, balance: u.balance });
});

app.listen(10000, () => console.log("Server running"));
