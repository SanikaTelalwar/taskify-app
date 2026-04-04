const express = require('express');
const router  = express.Router();
const Task    = require('../models/Task');
const protect = require('../middleware/auth');

router.use(protect);

// GET /suggestions — AI-style pattern-based suggestions
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.userId });

    if (tasks.length < 2) {
      return res.json({ suggestions: getDefaultSuggestions() });
    }

    // 1. Find most used categories
    const catCount = {};
    tasks.forEach(t => { catCount[t.category] = (catCount[t.category] || 0) + 1; });
    const topCategory = Object.entries(catCount).sort((a, b) => b[1] - a[1])[0]?.[0];

    // 2. Find common keywords in titles
    const words = tasks
      .flatMap(t => t.title.toLowerCase().split(/\s+/))
      .filter(w => w.length > 3);

    const wordCount = {};
    words.forEach(w => { wordCount[w] = (wordCount[w] || 0) + 1; });

    const topWords = Object.entries(wordCount)
      .filter(([, c]) => c >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([w]) => w);

    // 3. Build smart suggestions
    const suggestions = buildSuggestions(topCategory, topWords, tasks);

    res.json({ suggestions, topCategory, topWords });
  } catch (err) {
    res.status(500).json({ message: 'Error generating suggestions.' });
  }
});

function buildSuggestions(topCategory, topWords, tasks) {
  const templates = {
    work:     ['Prepare meeting notes', 'Send weekly report', 'Review project timeline',
                'Update task board', 'Follow up with team', 'Check project deadlines'],
    study:    ['Review lecture notes', 'Complete practice problems', 'Read chapter summary',
                'Watch tutorial video', 'Create study flashcards', 'Revise previous topics'],
    health:   ['30-min workout session', 'Drink 8 glasses of water', 'Meditate for 10 mins',
                'Take a walk outside', 'Meal prep for tomorrow', 'Sleep by 11 PM'],
    personal: ['Organize workspace', 'Call a friend or family', 'Plan the week ahead',
                'Read for 20 minutes', 'Clean up downloads folder', 'Journal your day'],
    other:    ['Set new monthly goals', 'Declutter your inbox', 'Update your resume',
                'Learn something new today', 'Backup important files', 'Review finances']
  };

  const existingTitles = tasks.map(t => t.title.toLowerCase());
  const pool = templates[topCategory] || templates['personal'];

  return pool
    .filter(s => !existingTitles.some(e => e.includes(s.toLowerCase().split(' ')[0])))
    .slice(0, 5)
    .map(title => ({
      title,
      category: topCategory || 'personal',
      priority: 'medium',
      reason: `Based on your ${topCategory || 'recent'} tasks`
    }));
}

function getDefaultSuggestions() {
  return [
    { title: 'Plan your week ahead',       category: 'personal', priority: 'medium', reason: 'Great way to start' },
    { title: 'Complete a learning module',  category: 'study',    priority: 'high',   reason: 'Boost your skills'  },
    { title: '30-min workout session',      category: 'health',   priority: 'medium', reason: 'Stay healthy'       },
    { title: 'Review pending tasks',        category: 'work',     priority: 'high',   reason: 'Stay on track'      },
    { title: 'Read for 20 minutes',         category: 'personal', priority: 'low',    reason: 'Daily habit'        },
  ];
}

module.exports = router;