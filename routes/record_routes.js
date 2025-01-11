const express = require('express');
const multer = require('multer');
const authMiddleware = require('../middleware/auth.middleware');
const RecordService = require('../services/record.service');
const recordRoutes = require('./routes/record.routes');

const router = express.Router();
const recordService = new RecordService();

// Multer 설정
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB 제한
  }
});

// 녹음 파일 업로드
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const { title, type, duration } = req.body;
    const file = {
      originalname: req.file.originalname,
      stream: require('stream').Readable.from(req.file.buffer)
    };

    const record = await recordService.uploadRecord(
      req.user.id,
      file,
      title,
      type,
      parseFloat(duration)
    );

    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 녹음 목록 조회
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { type } = req.query;
    const records = await recordService.getAllRecords(req.user.id, type);
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 즐겨찾기 목록 조회
router.get('/favorites', authMiddleware, async (req, res) => {
  try {
    const records = await recordService.getFavorites(req.user.id);
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 녹음 파일 스트리밍
router.get('/:id/stream', authMiddleware, async (req, res) => {
  try {
    const record = await Record.findOne({ _id: req.params.id, userId: req.user.id });
    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    const stream = await recordService.getRecordFile(record.fileId);
    res.set('Content-Type', 'audio/webm');
    stream.pipe(res);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 즐겨찾기 토글
router.post('/:id/favorite', authMiddleware, async (req, res) => {
  try {
    const record = await recordService.toggleFavorite(req.params.id, req.user.id);
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 녹음 삭제
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await recordService.deleteRecord(req.params.id, req.user.id);
    res.json({ message: 'Record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.use('/api/records', recordRoutes);

module.exports = router;