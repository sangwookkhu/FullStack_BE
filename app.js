const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
require('./config/passport');
const AuthService = require('./services/auth_service');
const authMiddleware = require('./middleware/auth.middleware');
const scoreRoutes = require('./routes/score.routes');


const app = express();

// Middleware
app.use(cors({ credentials: true, origin: 'http://localhost:3000' }));
app.use(express.json());
app.use(session({ 
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use('/api/scores', scoreRoutes);

mongoose.connect('mongodb://localhost:27017/musemate')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const authService = new AuthService();

// auth_route
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  async (req, res) => {
    try {
      const { accessToken, refreshToken } = authService.generateTokens(req.user);
      await authService.saveRefreshToken(req.user._id, refreshToken);
      
      res.redirect(`http://localhost:3000/auth/success?token=${accessToken}&refresh=${refreshToken}`);
    } catch (error) {
      res.redirect('/login');
    }
  }
);

// token 갱신
app.post('/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const tokens = await authService.refreshAccessToken(refreshToken);
    res.json(tokens);
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
});

// 로그아웃
app.post('/auth/logout', authMiddleware, async (req, res) => {
  try {
    await authService.logout(req.user.id);
    res.json({ message: 'Successfully logged out' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});