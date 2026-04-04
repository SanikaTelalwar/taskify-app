const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// ── POST /auth/register ──────────────────────
router.post('/register', async (req, res) => {
  try {
    console.log('📥 Register body received:', req.body); // DEBUG LOG

    const { name, email, password } = req.body;

    // ── Validation ──
    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'All fields are required — name, email and password.'
      });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({ message: 'Name must be at least 2 characters.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    // ── Check existing user ──
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ message: 'This email is already registered. Please sign in.' });
    }

    // ── Hash password ──
    const salt   = await bcrypt.genSalt(12);
    const hashed = await bcrypt.hash(password, salt);

    // ── Create user ──
    const user = await User.create({
      name:     name.trim(),
      email:    email.toLowerCase().trim(),
      password: hashed
    });

    console.log('✅ User created:', user._id); // DEBUG LOG

    // ── Respond with token ──
    res.status(201).json({
      _id:   user._id,
      name:  user.name,
      email: user.email,
      token: generateToken(user._id)
    });

  } catch (err) {
    console.error('❌ Register error:', err); // DEBUG LOG

    // Handle MongoDB duplicate key error
    if (err.code === 11000) {
      return res.status(400).json({ message: 'This email is already registered.' });
    }

    res.status(500).json({
      message: 'Server error during registration.',
      detail:  err.message
    });
  }
});

// ── POST /auth/login ─────────────────────────
router.post('/login', async (req, res) => {
  try {
    console.log('📥 Login body received:', req.body); // DEBUG LOG

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(400).json({ message: 'No account found with this email address.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect password. Please try again.' });
    }

    console.log('✅ User logged in:', user._id); // DEBUG LOG

    res.json({
      _id:   user._id,
      name:  user.name,
      email: user.email,
      token: generateToken(user._id)
    });

  } catch (err) {
    console.error('❌ Login error:', err);
    res.status(500).json({ message: 'Server error during login.', detail: err.message });
  }
});

module.exports = router;