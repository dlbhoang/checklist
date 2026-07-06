const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const safeName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.originalname.toLowerCase().endsWith('.apk')) {
      return cb(new Error('Chỉ chấp nhận file .apk'));
    }
    cb(null, true);
  },
  limits: { fileSize: 500 * 1024 * 1024 },
});

router.post('/upload', (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Không có file được upload' });
    res.json({ success: true, file: req.file.filename });
  });
});

router.get('/', (req, res) => {
  const files = fs
    .readdirSync(UPLOAD_DIR)
    .filter((f) => f.toLowerCase().endsWith('.apk'))
    .map((f) => {
      const stat = fs.statSync(path.join(UPLOAD_DIR, f));
      const dashIdx = f.indexOf('-');
      const originalName = dashIdx !== -1 ? f.slice(dashIdx + 1) : f;
      return {
        filename: f,
        name: originalName,
        size: stat.size,
        uploadedAt: stat.mtime,
      };
    })
    .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  res.json(files);
});

router.delete('/:filename', (req, res) => {
  const filePath = path.join(UPLOAD_DIR, req.params.filename);
  if (!filePath.startsWith(UPLOAD_DIR)) {
    return res.status(400).json({ error: 'Đường dẫn không hợp lệ' });
  }
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File không tồn tại' });
  fs.unlinkSync(filePath);
  res.json({ success: true });
});

router.get('/:filename/download', (req, res) => {
  const filePath = path.join(UPLOAD_DIR, req.params.filename);
  if (!filePath.startsWith(UPLOAD_DIR) || !fs.existsSync(filePath)) {
    return res.status(404).send('File không tồn tại');
  }
  res.download(filePath);
});

module.exports = router;
