require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.log('MongoDB connection error:', err));

// Routes
// Note: You might need to adjust these paths if your routes are not in the same directory.
// For Vercel, the routes will be relative to the root of your project.
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/user');

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);

// Root route for API status check
app.get('/', (req, res) => {
  res.send('Surety Member Management Backend API is running.');
});

// The key for Vercel: export the Express app as a serverless function
module.exports = app;

// The app.listen is commented out because Vercel handles this for you.
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
