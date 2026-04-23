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

// 🧠 User Schema
const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
  balance: { type: Number, default: 0 }
});

const User = mongoose.model("User", UserSchema);

// 🏠 Home
app.get("/", (req, res) => {
  res.send("Zonguru API Running with DB");
});

// 🧪 Test route
app.get("/test", (req, res) => {
  res.json({ message: "API OK" });
});

// 🔐 Register
app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    const exist = await User.findOne({ username });

    if (exist) {
      return res.json({ success: false, message: "User already exists" });
    }

    const newUser = new User({
      username,
      password,
      balance: 0
    });

    await newUser.save();

    res.json({ success: true, message: "Register success" });

  } catch (err) {
    res.json({ success: false, message: "Error: " + err.message });
  }
});

// 🔑 Login
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    if (user.password !== password) {
      return res.json({ success: false, message: "Wrong password" });
    }

    res.json({
      success: true,
      message: "Login success",
      balance: user.balance
    });

  } catch (err) {
    res.json({ success: false, message: "Error: " + err.message });
  }
});

// 💰 Deposit
app.post("/deposit", async (req, res) => {
  const { user, amount } = req.body;

  const u = await User.findOne({ username: user });

  u.balance += Number(amount);
  await u.save();

  res.json({ balance: u.balance });
});

// 💸 Withdraw
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

// 🚀 Server
app.listen(10000, () => {
  console.log("Server running on port 10000");
});
