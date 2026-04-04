const express = require('express');
const router  = express.Router();
const Task    = require('../models/Task');
const protect = require('../middleware/auth');

router.use(protect);

// GET /tasks
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) { res.status(500).json({ message: 'Error fetching tasks.' }); }
});

// POST /tasks
router.post('/', async (req, res) => {
  try {
    const { title, priority, category, dueDate, tags, isAISuggested } = req.body;
    if (!title?.trim()) return res.status(400).json({ message: 'Title required.' });

    const task = await Task.create({
      userId: req.userId,
      title, priority, category, dueDate,
      tags: tags || [],
      isAISuggested: isAISuggested || false
    });
    res.status(201).json(task);
  } catch (err) { res.status(500).json({ message: 'Error creating task.' }); }
});

// PUT /tasks/:id
router.put('/:id', async (req, res) => {
  try {
    const update = { ...req.body };

    // Auto-set completedAt timestamp when marking complete
    if (update.completed === true)  update.completedAt = new Date();
    if (update.completed === false) update.completedAt = null;

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      update,
      { new: true, runValidators: true }
    );
    if (!task) return res.status(404).json({ message: 'Task not found.' });
    res.json(task);
  } catch (err) { res.status(500).json({ message: 'Error updating task.' }); }
});

// DELETE /tasks/:id
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!task) return res.status(404).json({ message: 'Task not found.' });
    res.json({ message: 'Deleted.' });
  } catch (err) { res.status(500).json({ message: 'Error deleting task.' }); }
});

module.exports = router;