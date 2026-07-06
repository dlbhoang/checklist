const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

const UPLOAD_DIR = path.join(__dirname, 'uploads');
const DATA_DIR = path.join(__dirname, 'data');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');

// Đảm bảo thư mục & file dữ liệu tồn tại
[UPLOAD_DIR, DATA_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});
if (!fs.existsSync(TASKS_FILE)) fs.writeFileSync(TASKS_FILE, '[]');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ============ Multer config cho upload APK ============
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    // Sửa lỗi encoding tên file tiếng Việt khi upload multipart
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
  limits: { fileSize: 500 * 1024 * 1024 }, // giới hạn 500MB
});

// ============ API: APK ============
app.post('/api/apks/upload', (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Không có file được upload' });
    res.json({ success: true, file: req.file.filename });
  });
});

app.get('/api/apks', (req, res) => {
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

app.delete('/api/apks/:filename', (req, res) => {
  const filePath = path.join(UPLOAD_DIR, req.params.filename);
  if (!filePath.startsWith(UPLOAD_DIR)) {
    return res.status(400).json({ error: 'Đường dẫn không hợp lệ' });
  }
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File không tồn tại' });
  fs.unlinkSync(filePath);
  res.json({ success: true });
});

app.get('/api/apks/:filename/download', (req, res) => {
  const filePath = path.join(UPLOAD_DIR, req.params.filename);
  if (!filePath.startsWith(UPLOAD_DIR) || !fs.existsSync(filePath)) {
    return res.status(404).send('File không tồn tại');
  }
  res.download(filePath);
});

// ============ API: Checklist ============
function readTasks() {
  return JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
}
function writeTasks(tasks) {
  fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2));
}

app.get('/api/tasks', (req, res) => {
  res.json(readTasks());
});

app.post('/api/tasks', (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Nội dung công việc không được để trống' });
  }
  const tasks = readTasks();
  const newTask = {
    id: Date.now().toString(),
    text: text.trim(),
    done: false,
    createdAt: new Date(),
  };
  tasks.unshift(newTask);
  writeTasks(tasks);
  res.json(newTask);
});

app.put('/api/tasks/:id', (req, res) => {
  const tasks = readTasks();
  const idx = tasks.findIndex((t) => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Không tìm thấy công việc' });
  const { text, done } = req.body;
  if (text !== undefined) tasks[idx].text = text;
  if (done !== undefined) tasks[idx].done = done;
  writeTasks(tasks);
  res.json(tasks[idx]);
});

app.delete('/api/tasks/:id', (req, res) => {
  let tasks = readTasks();
  const before = tasks.length;
  tasks = tasks.filter((t) => t.id !== req.params.id);
  if (tasks.length === before) return res.status(404).json({ error: 'Không tìm thấy công việc' });
  writeTasks(tasks);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`✅ Dashboard đang chạy tại http://localhost:${PORT}`);
});
