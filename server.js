const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const crypto = require("crypto");

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "CHANGE_THIS_JWT_SECRET";
const MONGO_URL = process.env.MONGO_URL;

if (!MONGO_URL) {
  console.error("ERROR: MONGO_URL is not set.");
  process.exit(1);
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  try {
    const [salt, storedHash] = stored.split(":");
    const hash = crypto.scryptSync(password, salt, 64).toString("hex");
    const a = Buffer.from(hash, "hex");
    const b = Buffer.from(storedHash, "hex");
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, minlength: 3 },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  balance: { type: Number, default: 0 },
  currency: { type: String, default: "USDT" },
  totalProfit: { type: Number, default: 0 },
  referralCode: { type: String, unique: true, sparse: true },
  referredBy: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, default: "General" },
  price: { type: Number, required: true },
  profitRate: { type: Number, required: true },
  active: { type: Boolean, default: true }
});

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  type: { type: String, enum: ["deposit", "withdraw", "optimize_profit", "optimize_cost"], required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ["pending", "approved", "rejected", "completed"], default: "pending" },
  note: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});

const messageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  sender: { type: String, enum: ["system", "admin", "user"], default: "system" },
  text: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", userSchema);
const Product = mongoose.model("Product", productSchema);
const Transaction = mongoose.model("Transaction", transactionSchema);
const Message = mongoose.model("Message", messageSchema);

function tokenFor(user) {
  return jwt.sign(
    { id: user._id.toString(), username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function auth(req, res, next) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Login required" });
  }
  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
}

function adminOnly(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin access required" });
  }
  next();
}

function publicUser(user) {
  return {
    id: user._id,
    username: user.username,
    role: user.role,
    balance: Number(user.balance || 0),
    currency: user.currency,
    totalProfit: Number(user.totalProfit || 0),
    referralCode: user.referralCode || ""
  };
}

async function seed() {
  const count = await Product.countDocuments();
  if (!count) {
    await Product.insertMany([
      { name: "Starter Product", category: "Starter", price: 10, profitRate: 0.03 },
      { name: "Standard Product", category: "Standard", price: 25, profitRate: 0.05 },
      { name: "Premium Product", category: "Premium", price: 50, profitRate: 0.08 },
      { name: "Pro Product", category: "Pro", price: 100, profitRate: 0.12 }
    ]);
  }

  const adminUsername = String(process.env.ADMIN_USERNAME || "admin").trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "ChangeMe123!";
  let admin = await User.findOne({ username: adminUsername });

  if (!admin) {
    admin = await User.create({
      username: adminUsername,
      passwordHash: hashPassword(adminPassword),
      role: "admin",
      balance: 0,
      currency: "USDT",
      referralCode: "ADMIN"
    });
    console.log(`Admin created: ${adminUsername}`);
  }
}

app.get("/", (req, res) => {
  res.json({ success: true, service: "Zonguru Backend", status: "online" });
});

app.post("/api/auth/register", async (req, res) => {
  try {
    const username = String(req.body.username || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const referredBy = String(req.body.referralCode || "").trim().toUpperCase();

    if (username.length < 3) return res.status(400).json({ success: false, message: "Username must contain at least 3 characters" });
    if (password.length < 6) return res.status(400).json({ success: false, message: "Password must contain at least 6 characters" });

    if (await User.findOne({ username })) {
      return res.status(409).json({ success: false, message: "Username already registered" });
    }

    const referralCode = `${username.slice(0, 4).toUpperCase()}${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    const user = await User.create({
      username,
      passwordHash: hashPassword(password),
      referralCode,
      referredBy
    });

    await Message.create({
      userId: user._id,
      sender: "system",
      text: "Welcome to Zonguru. Your account is active."
    });

    res.status(201).json({
      success: true,
      message: "Registration successful",
      token: tokenFor(user),
      user: publicUser(user)
    });
  } catch (e) {
    console.error("register", e);
    res.status(500).json({ success: false, message: "Registration failed" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const username = String(req.body.username || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const user = await User.findOne({ username });

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ success: false, message: "Invalid username or password" });
    }

    res.json({ success: true, message: "Login successful", token: tokenFor(user), user: publicUser(user) });
  } catch (e) {
    console.error("login", e);
    res.status(500).json({ success: false, message: "Login failed" });
  }
});

app.get("/api/me", auth, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  res.json({ success: true, user: publicUser(user) });
});

app.post("/api/auth/change-password", auth, async (req, res) => {
  const oldPassword = String(req.body.oldPassword || "");
  const newPassword = String(req.body.newPassword || "");
  if (newPassword.length < 6) return res.status(400).json({ success: false, message: "New password must contain at least 6 characters" });

  const user = await User.findById(req.user.id);
  if (!user || !verifyPassword(oldPassword, user.passwordHash)) {
    return res.status(400).json({ success: false, message: "Current password is incorrect" });
  }

  user.passwordHash = hashPassword(newPassword);
  await user.save();
  res.json({ success: true, message: "Password changed successfully" });
});

app.get("/api/products", auth, async (req, res) => {
  const products = await Product.find({ active: true }).sort({ price: 1 });
  res.json({ success: true, products });
});

app.post("/api/products/:id/optimize", auth, async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, active: true });
    const user = await User.findById(req.user.id);

    if (!product || !user) return res.status(404).json({ success: false, message: "Product or user not found" });

    const cost = Number(product.price);
    const profit = Number((cost * product.profitRate).toFixed(2));

    if (user.balance < cost) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Required ${cost.toFixed(2)} ${user.currency}`
      });
    }

    user.balance = Number((user.balance - cost + cost + profit).toFixed(2));
    user.totalProfit = Number((user.totalProfit + profit).toFixed(2));
    await user.save();

    await Transaction.create({
      userId: user._id,
      type: "optimize_profit",
      amount: profit,
      status: "completed",
      note: `${product.name} optimization`
    });

    res.json({
      success: true,
      message: "Product optimization completed",
      product: product.name,
      cost,
      profit,
      user: publicUser(user)
    });
  } catch (e) {
    console.error("optimize", e);
    res.status(500).json({ success: false, message: "Optimization failed" });
  }
});

app.post("/api/deposits", auth, async (req, res) => {
  const amount = Number(req.body.amount);
  const note = String(req.body.note || "").trim();

  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ success: false, message: "Enter a valid deposit amount" });
  }

  const tx = await Transaction.create({
    userId: req.user.id,
    type: "deposit",
    amount,
    status: "pending",
    note
  });

  await Message.create({
    userId: req.user.id,
    sender: "system",
    text: `Deposit request ${amount.toFixed(2)} USDT was submitted for review.`
  });

  res.status(201).json({ success: true, message: "Deposit request submitted", transaction: tx });
});

app.post("/api/withdrawals", auth, async (req, res) => {
  const amount = Number(req.body.amount);
  const note = String(req.body.note || "").trim();

  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ success: false, message: "Enter a valid withdrawal amount" });
  }

  const user = await User.findById(req.user.id);
  if (!user || user.balance < amount) {
    return res.status(400).json({ success: false, message: "Insufficient balance" });
  }

  const tx = await Transaction.create({
    userId: user._id,
    type: "withdraw",
    amount,
    status: "pending",
    note
  });

  await Message.create({
    userId: user._id,
    sender: "system",
    text: `Withdrawal request ${amount.toFixed(2)} USDT was submitted for review.`
  });

  res.status(201).json({ success: true, message: "Withdrawal request submitted", transaction: tx });
});

app.get("/api/transactions", auth, async (req, res) => {
  const transactions = await Transaction.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(100);
  res.json({ success: true, transactions });
});

app.get("/api/messages", auth, async (req, res) => {
  const messages = await Message.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(100);
  res.json({ success: true, messages });
});

app.post("/api/messages/:id/read", auth, async (req, res) => {
  await Message.updateOne({ _id: req.params.id, userId: req.user.id }, { $set: { read: true } });
  res.json({ success: true });
});

app.get("/api/team", auth, async (req, res) => {
  const user = await User.findById(req.user.id);
  const members = await User.find({ referredBy: String(user.referralCode || "").toUpperCase() })
    .select("username createdAt balance totalProfit")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    referralCode: user.referralCode,
    members
  });
});

app.get("/api/admin/users", auth, adminOnly, async (req, res) => {
  const users = await User.find().select("-passwordHash").sort({ createdAt: -1 });
  res.json({ success: true, users });
});

app.get("/api/admin/transactions", auth, adminOnly, async (req, res) => {
  const transactions = await Transaction.find().sort({ createdAt: -1 }).limit(200);
  res.json({ success: true, transactions });
});

app.post("/api/admin/transactions/:id/approve", auth, adminOnly, async (req, res) => {
  const tx = await Transaction.findById(req.params.id);
  if (!tx || tx.status !== "pending") return res.status(400).json({ success: false, message: "Transaction is not pending" });

  const user = await User.findById(tx.userId);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  if (tx.type === "deposit") {
    user.balance = Number((user.balance + tx.amount).toFixed(2));
  } else if (tx.type === "withdraw") {
    if (user.balance < tx.amount) {
      tx.status = "rejected";
      tx.note = `${tx.note} | Rejected: insufficient balance at approval`;
      await tx.save();
      return res.status(400).json({ success: false, message: "User balance is insufficient" });
    }
    user.balance = Number((user.balance - tx.amount).toFixed(2));
  }

  tx.status = "approved";
  await user.save();
  await tx.save();

  await Message.create({
    userId: user._id,
    sender: "admin",
    text: `${tx.type === "deposit" ? "Deposit" : "Withdrawal"} request was approved.`
  });

  res.json({ success: true, message: "Transaction approved" });
});

app.post("/api/admin/transactions/:id/reject", auth, adminOnly, async (req, res) => {
  const tx = await Transaction.findById(req.params.id);
  if (!tx || tx.status !== "pending") return res.status(400).json({ success: false, message: "Transaction is not pending" });
  tx.status = "rejected";
  await tx.save();

  await Message.create({
    userId: tx.userId,
    sender: "admin",
    text: `${tx.type === "deposit" ? "Deposit" : "Withdrawal"} request was rejected.`
  });

  res.json({ success: true, message: "Transaction rejected" });
});

app.post("/api/admin/users/:id/balance", auth, adminOnly, async (req, res) => {
  const amount = Number(req.body.amount);
  if (!Number.isFinite(amount) || amount < 0) return res.status(400).json({ success: false, message: "Invalid balance" });

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  user.balance = amount;
  await user.save();
  res.json({ success: true, user: publicUser(user) });
});

mongoose.connect(MONGO_URL)
  .then(async () => {
    console.log("MongoDB connected successfully");
    await seed();
    app.listen(PORT, () => console.log(`Zonguru backend running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });
