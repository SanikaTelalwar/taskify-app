const mongoose = require('mongoose');

// Each pomodoro session gets its own document
const focusSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    default: null    // null = general focus, not linked to a task
  },
  taskTitle: { type: String, default: 'General Focus' },

  durationMinutes: { type: Number, required: true },   // 25 or custom
  type:            { type: String, enum: ['work', 'break'], default: 'work' },
  completedAt:     { type: Date, default: Date.now }

}, { timestamps: true });

module.exports = mongoose.model('FocusSession', focusSessionSchema);