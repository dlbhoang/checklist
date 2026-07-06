const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8081;

const UPLOAD_DIR = path.join(__dirname, 'uploads');
const DATA_DIR = path.join(__dirname, 'data');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');

const apksRouter = require('./routes/apks');
const tasksRouter = require('./routes/tasks');

// Đảm bảo thư mục & file dữ liệu tồn tại
[UPLOAD_DIR, DATA_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});
if (!fs.existsSync(TASKS_FILE)) fs.writeFileSync(TASKS_FILE, '[]');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api/apks', apksRouter);
app.use('/api/tasks', tasksRouter);

app.listen(PORT, () => {
  console.log(`✅ Dashboard đang chạy tại http://localhost:${PORT}`);
});
