const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

class AuthService {
  constructor() {
    this.JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  }

  async login(loginDto) {
    const user = await User.findOne({ email: loginDto.email });
    
    if (!user) {
      throw new Error('User not found');
    }

    const isPasswordValid = await user.comparePassword(loginDto.password);
    if (!isPasswordValid) {
      throw new Error('Invalid password');
    }

    const token = this.generateToken(user);
    return {
      token,
      user: this.mapToDto(user)
    };
  }

  generateToken(user) {
    return jwt.sign(
      { id: user._id, email: user.email },
      this.JWT_SECRET,
      { expiresIn: '24h' }
    );
  }

  mapToDto(user) {
    return {
      id: user._id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt
    };
  }
}

module.exports = AuthService;
