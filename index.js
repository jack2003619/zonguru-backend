const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// database (temporary)
let users = {};

// Home
app.get("/", (req, res) => {
  res.send("Zonguru API Running");
});

// Register
app.post("/register", (req, res) => {
  const { username, password } = req.body;

  if (users[username]) {
    return res.json({ success: false, message: "User already exists" });
  }

  users[username] = {
    password,
    balance: 0
  };

  res.json({ success: true, message: "Registered successfully" });
});

// Login
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!users[username] || users[username].password !== password) {
    return res.json({ success: false, message: "Invalid login" });
  }

  res.json({ success: true, message: "Login success", user: username });
});

app.listen(10000, () => {
  console.log("Server running");
});
