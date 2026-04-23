const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// test route
app.get("/", (req, res) => {
  res.send("Zonguru API Running with DB");
});

// register
app.post("/register", (req, res) => {
  const { username, password } = req.body;

  console.log("REGISTER:", username);

  res.json({
    success: true,
    message: "Register success",
    user: username
  });
});

// login
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  console.log("LOGIN:", username);

  res.json({
    success: true,
    message: "Login success",
    user: username,
    balance: 1000
  });
});

// deposit
app.post("/deposit", (req, res) => {
  const { amount } = req.body;

  res.json({
    success: true,
    balance: 1000 + Number(amount)
  });
});

// withdraw
app.post("/withdraw", (req, res) => {
  const { amount } = req.body;

  if (amount > 1000) {
    return res.json({ success: false });
  }

  res.json({
    success: true,
    balance: 1000 - Number(amount)
  });
});

app.listen(10000, () => console.log("Server running"));
