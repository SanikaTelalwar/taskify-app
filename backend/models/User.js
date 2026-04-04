const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type:     String,
    required: [true, 'Name is required'],
    trim:     true,
    minlength: [2, 'Name must be at least 2 characters']
  },
  email: {
    type:     String,
    required: [true, 'Email is required'],
    unique:   true,             // This creates the duplicate key index
    lowercase: true,
    trim:     true
  },
  password: {
    type:     String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  totalFocusMinutes: { type: Number, default: 0 },
  activeDates:       [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);