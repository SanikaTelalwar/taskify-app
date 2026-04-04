const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
require('dotenv').config();

const app = express();

// ✅ CORS — simple version, works with all Express versions
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Log every incoming request
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`);
  next();
});

// ✅ Routes
app.use('/auth',        require('./routes/auth'));
app.use('/tasks',       require('./routes/tasks'));
app.use('/stats',       require('./routes/stats'));
app.use('/focus',       require('./routes/focus'));
app.use('/suggestions', require('./routes/suggestions'));

// ✅ Health check
app.get('/', (req, res) => {
  res.json({ message: '✅ Taskify API running!', time: new Date() });
});

// ✅ MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected!'))
  .catch(err => console.log('❌ MongoDB Error:', err.message));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);