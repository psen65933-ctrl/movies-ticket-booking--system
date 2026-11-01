const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

const router = express.Router();

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

const payload = (u) => ({ _id: u._id, name: u.name, email: u.email, role: u.role, token: signToken(u._id) });

router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }
    if (await User.findOne({ email })) {
      return res.status(400).json({ message: "Email already registered" });
    }
    // role is never read from the request body: everyone registers as a normal user
    const user = await User.create({ name, email, password });
    res.status(201).json(payload(user));
  } catch (err) {
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.matchPassword(password || ""))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    res.json(payload(user));
  } catch (err) {
    next(err);
  }
});

router.get("/me", protect, (req, res) => {
  const { _id, name, email, role } = req.user;
  res.json({ _id, name, email, role });
});

module.exports = router;
