const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

let users = {};

app.get("/", (req, res) => {
  res.send("Zonguru API Running");
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
  }

  users[user] -= amount;

  res.json({
    success: true,
    user,
    balance: users[user]
  });
});

// Check balance
app.get("/balance/:user", (req, res) => {
  const user = req.params.user;
  res.json({
    user,
    balance: users[user] || 0
  });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server running on port " + PORT));  res.json({
    success: true,
    balance: users[user]
  });
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
  users[user] -= Number(amount);

  res.json({
    success: true,
    message: "Withdraw success",
    balance: users[user]
  });
});

// check balance
app.get("/balance/:user", (req, res) => {
  const user = req.params.user;
  res.json({ balance: users[user] || 0 });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});erssers[user] -= Number(amount);

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
