const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

let users = {};

// Deposit
app.post("/deposit", (req, res) => {
  const { user, amount } = req.body;

  if (!users[user]) {
    users[user] = 0;
  }

  users[user] += Number(amount);

  res.json({
    success: true,
    balance: users[user]
  });
});

// Withdraw
app.post("/withdraw", (req, res) => {
  const { user, amount } = req.body;

  if (!users[user] || users[user] < amount) {
    return res.json({
      success: false,
      message: "Not enough balance"
    });
  }

  users[user] -= Number(amount);

  res.json({
    success: true,
    balance: users[user]
  });
});

// Check balance
app.get("/balance/:user", (req, res) => {
  res.json({
    balance: users[req.params.user] || 0
  });
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
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
