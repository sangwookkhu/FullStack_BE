const express = require('express');
const multer = require('multer');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const ScoreService = require('../services/score.service');

const scoreService = new ScoreService();

// Multer 설정
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB 제한
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.mimetype)) {
      cb(new Error('Invalid file type. Only PDF, JPG and PNG are allowed.'));
    }
    cb(null, true);
  }
});

// 악보 업로드
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const file = {
      originalname: req.file.originalname,
      stream: require('stream').Readable.from(req.file.buffer)
    };

    const score = await scoreService.uploadScore(req.user.id, file, {
      title: req.body.title,
      category: req.body.category
    });

    res.json(score);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 악보 목록 조회
router.get('/', authMiddleware, async (req, res) => {
  try {
    const scores = await scoreService.getAllScores(req.user.id);
    res.json(scores);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 즐겨찾기 악보 조회
router.get('/favorites', authMiddleware, async (req, res) => {
  try {
    const scores = await scoreService.getFavorites(req.user.id);
    res.json(scores);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 악보 파일 다운로드
router.get('/:id/download', authMiddleware, async (req, res) => {
  try {
    const score = await Score.findOne({ _id: req.params.id, userId: req.user.id });
    if (!score) {
      return res.status(404).json({ message: 'Score not found' });
    }

    const stream = await scoreService.getScoreFile(score.fileId);
    res.set('Content-Type', score.fileType === 'pdf' ? 'application/pdf' : `image/${score.fileType}`);
    res.set('Content-Disposition', `attachment; filename="${score.title}.${score.fileType}"`);
    stream.pipe(res);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 즐겨찾기 토글
router.post('/:id/favorite', authMiddleware, async (req, res) => {
  try {
    const score = await scoreService.toggleFavorite(req.params.id, req.user.id);
    res.json(score);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 악보 삭제
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await scoreService.deleteScore(req.params.id, req.user.id);
    res.json({ message: 'Score deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;