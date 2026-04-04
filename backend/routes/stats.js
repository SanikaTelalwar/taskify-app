const express      = require('express');
const router       = express.Router();
const Task         = require('../models/Task');
const FocusSession = require('../models/FocusSession');
const protect      = require('../middleware/auth');

router.use(protect);

// GET /stats — Full dashboard stats
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.userId });
    const now   = new Date();

    // Daily stats — last 7 days
    const daily = Array.from({ length: 7 }, (_, i) => {
      const d     = new Date();
      d.setDate(d.getDate() - (6 - i));
      const start = new Date(d.setHours(0, 0, 0, 0));
      const end   = new Date(d.setHours(23, 59, 59, 999));
      const label = start.toLocaleDateString('en-US', { weekday: 'short' });

      return {
        day:       label,
        created:   tasks.filter(t => new Date(t.createdAt) >= start && new Date(t.createdAt) <= end).length,
        completed: tasks.filter(t => t.completedAt && new Date(t.completedAt) >= start && new Date(t.completedAt) <= end).length,
      };
    });

    // Focus sessions
    const sessions      = await FocusSession.find({ userId: req.userId, type: 'work' });
    const totalFocus    = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);
    const todayFocus    = sessions
      .filter(s => new Date(s.completedAt).toDateString() === now.toDateString())
      .reduce((sum, s) => sum + s.durationMinutes, 0);

    // Category breakdown
    const categories = ['personal', 'work', 'study', 'health', 'other'];
    const byCategory = categories.map(c => ({
      name:  c,
      total: tasks.filter(t => t.category === c).length,
      done:  tasks.filter(t => t.category === c && t.completed).length,
    }));

    // Priority breakdown
    const byPriority = ['high', 'medium', 'low'].map(p => ({
      name:  p,
      total: tasks.filter(t => t.priority === p).length,
      done:  tasks.filter(t => t.priority === p && t.completed).length,
    }));

    // Streak — consecutive days with at least 1 completion
    const streak = calcStreak(tasks);

    res.json({
      total:       tasks.length,
      completed:   tasks.filter(t => t.completed).length,
      active:      tasks.filter(t => !t.completed).length,
      overdue:     tasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < now).length,
      daily, byCategory, byPriority,
      totalFocusMinutes: totalFocus,
      todayFocusMinutes: todayFocus,
      totalSessions:     sessions.length,
      streak
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching stats.', error: err.message });
  }
});

function calcStreak(tasks) {
  const completedDates = [...new Set(
    tasks
      .filter(t => t.completedAt)
      .map(t => new Date(t.completedAt).toDateString())
  )];

  let streak = 0;
  const today = new Date();

  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (completedDates.includes(d.toDateString())) streak++;
    else if (i > 0) break;
  }
  return streak;
}

module.exports = router;