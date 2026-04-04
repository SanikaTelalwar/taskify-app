const express      = require('express');
const router       = express.Router();
const FocusSession = require('../models/FocusSession');
const Task         = require('../models/Task');
const protect      = require('../middleware/auth');

router.use(protect);

// POST /focus — Save a completed pomodoro session
router.post('/', async (req, res) => {
  try {
    const { taskId, taskTitle, durationMinutes, type } = req.body;

    const session = await FocusSession.create({
      userId: req.userId,
      taskId:          taskId || null,
      taskTitle:       taskTitle || 'General Focus',
      durationMinutes: durationMinutes || 25,
      type:            type || 'work'
    });

    // Add focus minutes to the specific task
    if (taskId && type === 'work') {
      await Task.findOneAndUpdate(
        { _id: taskId, userId: req.userId },
        { $inc: { focusMinutes: durationMinutes } }
      );
    }

    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ message: 'Error saving session.', error: err.message });
  }
});

// GET /focus/history — Last 10 sessions
router.get('/history', async (req, res) => {
  try {
    const sessions = await FocusSession
      .find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching history.' });
  }
});

module.exports = router;