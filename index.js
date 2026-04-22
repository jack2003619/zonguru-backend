const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

let users = {};

app.get("/", (req, res) => {
  res.send("Zonguru API running 🚀");
});

app.post("/deposit", (req, res) => {
  const { user, amount } = req.body;
  users[user] = (users[user] || 0) + Number(amount);
  res.json({ success: true, balance: users[user] });
});

app.post("/withdraw", (req, res) => {
  const { user, amount } = req.body;
  if ((users[user] || 0) < amount) {
    return res.json({ success: false, message: "Not enough balance" });
  }
  users[user] -= amount;
  res.json({ success: true, balance: users[user] });
});

app.listen(10000, () => console.log("Server running"));
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
