const express  = require('express');
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const verifyToken = require('../middleWare/VerifyToken');
const Material = require('../models/Material');
// Course по‑прежнему оставляем, если понадобится фильтрация /course/:id
const Course   = require('../models/Course');

const router = express.Router();

/* ----------  multer  ---------- */
const uploadDir = path.join(__dirname, '..', 'uploads', 'materials');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename:    (_, file, cb) =>
    cb(null, `${Date.now()}-${Math.round(Math.random()*1e9)}-${file.originalname}`)
});
const upload = multer({ storage });

/* ----------  POST /api/materials  (без courseId) ---------- */
router.post('/', verifyToken, upload.single('file'), async (req, res) => {
  try {
    if (req.user.role !== 'instructor')
      return res.status(403).json({ message: 'Tylko instruktor może dodawać materiały' });

    const { title, description, link } = req.body;

    // требуем хотя бы что‑то одно: файл ИЛИ ссылка
    if (!title || (!req.file && !link))
      return res.status(400).json({ message: 'Wymagany jest plik lub link' });

    const material = await Material.create({
      title,
      description,
      filePath: req.file ? req.file.path.replace(/\\\\/g, '/') : undefined,
      link,
      instructor: req.user._id
    });

    res.status(201).json(material);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Błąd podczas dodawania materiału' });
  }
});


/* ----------  GET /api/materials  — все материалы ---------- */
router.get('/', verifyToken, async (req, res) => {
  try {
    const mats = await Material
      .find()
      .populate('instructor', 'name surname email');
    res.json(mats);
  } catch (e) {
    res.status(500).json({ message: 'Błąd pobierania materiałów', error: e });
  }
});

/* ----------  GET /api/materials/course/:courseId  (опционально) ---------- */
router.get('/course/:courseId', verifyToken, async (req, res) => {
  try {
    const mats = await Material
      .find({ course: req.params.courseId })
      .populate('instructor', 'name surname email');
    res.json(mats);
  } catch (e) {
    res.status(500).json({ message: 'Błąd pobierania materiałów', error: e });
  }
});

/* ----------  GET /api/materials/download/:id  ---------- */
router.get('/download/:id', verifyToken, async (req, res) => {
  try {
    const mat = await Material.findById(req.params.id);
    if (!mat) return res.status(404).json({ message: 'Materiał nie znaleziony' });
    res.download(path.resolve(mat.filePath));
  } catch (e) {
    res.status(500).json({ message: 'Błąd pobierania pliku', error: e });
  }
});

module.exports = router;
