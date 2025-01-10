const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const AuthService = require('./services/auth.service');
const AuthController = require('./controllers/auth.controller');

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/musemate')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const authService = new AuthService();
const authController = new AuthController(authService);

// route
app.post('/api/auth/login', (req, res) => authController.login(req, res));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});