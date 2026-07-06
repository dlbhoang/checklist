const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8081;

// Enable CORS for development: allow dynamic origin and credentials
app.use(cors({ origin: true, credentials: true }));
app.options('*', cors({ origin: true, credentials: true }));

const UPLOAD_DIR = path.join(__dirname, 'uploads');
const DATA_DIR = path.join(__dirname, 'data');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');
const AUTH_COOKIE_NAME = 'apkSession';
const AUTH_USER = 'BodanDuong';
const AUTH_PASS = 'BoDanDuong';
const AUTH_TOKEN = 'authorized';

const apksRouter = require('./routes/apks');
const tasksRouter = require('./routes/tasks');

// Đảm bảo thư mục & file dữ liệu tồn tại
[UPLOAD_DIR, DATA_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});
if (!fs.existsSync(TASKS_FILE)) fs.writeFileSync(TASKS_FILE, '[]');

function parseCookies(cookieHeader = '') {
  return cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())
    .filter(Boolean)
    .reduce((acc, cookie) => {
      const [name, ...rest] = cookie.split('=');
      acc[name] = rest.join('=');
      return acc;
    }, {});
}

function isAuthorized(req) {
  const cookies = parseCookies(req.headers.cookie || '');
  return cookies[AUTH_COOKIE_NAME] === AUTH_TOKEN;
}

function protectApkAccess(req, res, next) {
  const publicPaths = ['/', '/index.html', '/login.html', '/tasks.html', '/style.css', '/shared.js', '/tasks.js', '/apk.js'];
  const pathName = req.path;

  if (pathName === '/apk.html' || pathName.startsWith('/api/apks')) {
    if (isAuthorized(req)) {
      return next();
    }

    if (pathName.startsWith('/api/apks')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    return res.redirect('/login.html');
  }

  return next();
}

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(protectApkAccess);
app.get('/', (req, res) => res.redirect('/tasks.html'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api/apks', apksRouter);
app.use('/api/tasks', tasksRouter);

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === AUTH_USER && password === AUTH_PASS) {
    res.setHeader('Set-Cookie', `${AUTH_COOKIE_NAME}=${AUTH_TOKEN}; HttpOnly; Path=/; Max-Age=3600`);
    return res.redirect('/apk.html');
  }

  return res.redirect('/login.html?error=1');
});

app.listen(PORT, () => {
  console.log(`✅ Dashboard đang chạy tại http://localhost:${PORT}`);
});
