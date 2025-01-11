const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
const Score = require('../models/score.model');

class ScoreService {
  constructor() {
    this.bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: 'scores'
    });
  }

  async uploadScore(userId, file, scoreData) {
    const uploadStream = this.bucket.openUploadStream(file.originalname);
    
    return new Promise((resolve, reject) => {
      file.stream.pipe(uploadStream)
        .on('error', reject)
        .on('finish', async () => {
          try {
            const score = await Score.create({
              userId,
              fileId: uploadStream.id,
              title: scoreData.title,
              category: scoreData.category,
              fileType: file.originalname.split('.').pop().toLowerCase()
            });
            resolve(score);
          } catch (error) {
            await this.bucket.delete(uploadStream.id);
            reject(error);
          }
        });
    });
  }

  async getAllScores(userId) {
    return Score.find({ userId }).sort({ createdAt: -1 });
  }

  async getFavorites(userId) {
    return Score.find({ userId, isFavorite: true }).sort({ createdAt: -1 });
  }

  async getScoreFile(fileId) {
    return this.bucket.openDownloadStream(new mongoose.Types.ObjectId(fileId));
  }

  async toggleFavorite(scoreId, userId) {
    const score = await Score.findOne({ _id: scoreId, userId });
    if (!score) {
      throw new Error('Score not found');
    }

    score.isFavorite = !score.isFavorite;
    return score.save();
  }

  async deleteScore(scoreId, userId) {
    const score = await Score.findOne({ _id: scoreId, userId });
    if (!score) {
      throw new Error('Score not found');
    }

    await this.bucket.delete(score.fileId);
    await Score.deleteOne({ _id: scoreId });
  }
}

module.exports = ScoreService;