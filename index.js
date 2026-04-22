const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

let users = {};

app.post("/deposit", (req, res) => {
  const { user, amount } = req.body;
  users[user] = (users[user] || 0) + Number(amount);
  res.json({
  success: true,
  message: "Deposit successful",
  balance: users[user]
});
app.post("/withdraw", (req, res) => {
  const { user, amount } = req.body;
  users[user] = (users[user] || 0) - Number(amount);
  res.json({
  success: true,
  message: "Withdraw successful",
  balance: users[user]
});

app.get("/", (req,res)=>{
  res.send("Zonguru Backend Live 🚀");
});

app.listen(process.env.PORT || 3000);
