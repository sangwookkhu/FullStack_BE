const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  category: {
    type: String,
    default: 'Uncategorized'
  },
  isFavorite: {
    type: Boolean,
    default: false
  },
  fileType: {
    type: String,
    enum: ['pdf', 'jpg', 'png'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Score = mongoose.model('Score', scoreSchema);

module.exports = Score;