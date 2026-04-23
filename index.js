const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json());

// 🔗 MongoDB connect
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// 🧠 Schema
const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
  balance: { type: Number, default: 0 }
});

const User = mongoose.model("User", UserSchema);

// Home
app.get("/", (req, res) => {
  res.send("Zonguru API Running with DB");
});

// Register
app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  const exist = await User.findOne({ username });
  if (exist) {
    return res.json({ success: false, message: "User exists" });
  }

  const newUser = new User({ username, password });
  await newUser.save();

  res.json({ success: true, message: "Registered" });
});

// Login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username, password });
  if (!user) {
    return res.json({ success: false });
  }

  res.json({ success: true, user: username, balance: user.balance });
});

// Deposit
app.post("/deposit", async (req, res) => {
  const { user, amount } = req.body;

  const u = await User.findOne({ username: user });
  u.balance += Number(amount);
  await u.save();

  res.json({ balance: u.balance });
});

// Withdraw
app.post("/withdraw", async (req, res) => {
  const { user, amount } = req.body;

  const u = await User.findOne({ username: user });

  if (u.balance < amount) {
    return res.json({ success: false });
  }

  u.balance -= amount;
  await u.save();

  res.json({ success: true, balance: u.balance });
});

app.listen(10000, () => console.log("Server running"));
