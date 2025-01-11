const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
const Record = require('../models/record.model');

class RecordService {
  constructor() {
    this.bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: 'records'
    });
  }

  async uploadRecord(userId, file, title, type, duration) {
    const uploadStream = this.bucket.openUploadStream(file.originalname);

    return new Promise((resolve, reject) => {
      // 파일 스트림 생성
      file.stream.pipe(uploadStream)
        .on('error', reject)
        .on('finish', async () => {
          try {
            // 레코드 메타데이터 저장
            const record = await Record.create({
              userId,
              title,
              fileId: uploadStream.id,
              type,
              duration
            });
            resolve(record);
          } catch (error) {
            // 파일 업로드 실패시 삭제
            await this.bucket.delete(uploadStream.id);
            reject(error);
          }
        });
    });
  }

  async getAllRecords(userId, type = null) {
    const query = { userId };
    if (type) {
      query.type = type;
    }
    return Record.find(query).sort({ createdAt: -1 });
  }

  async getFavorites(userId) {
    return Record.find({ userId, isFavorite: true }).sort({ createdAt: -1 });
  }

  async getRecordFile(fileId) {
    return this.bucket.openDownloadStream(new mongoose.Types.ObjectId(fileId));
  }

  async toggleFavorite(recordId, userId) {
    const record = await Record.findOne({ _id: recordId, userId });
    if (!record) {
      throw new Error('Record not found');
    }

    record.isFavorite = !record.isFavorite;
    return record.save();
  }

  async deleteRecord(recordId, userId) {
    const record = await Record.findOne({ _id: recordId, userId });
    if (!record) {
      throw new Error('Record not found');
    }

    // 파일과 메타데이터 모두 삭제
    await this.bucket.delete(record.fileId);
    await Record.deleteOne({ _id: recordId });
  }
}

module.exports = RecordService;