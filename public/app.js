// ================= Theme (dark/light) =================
const themeToggle = document.getElementById('themeToggle');
const savedTheme = localStorage.getItem('theme') || 'dark';
applyTheme(savedTheme);

themeToggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  localStorage.setItem('theme', next);
});

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeToggle.textContent = theme === 'dark' ? '🌙' : '☀️';
}

// ================= Toast helper =================
const toastEl = document.getElementById('toast');
let toastTimer = null;
function showToast(message, isError = false) {
  toastEl.textContent = message;
  toastEl.classList.remove('hidden');
  toastEl.classList.toggle('error', isError);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.add('hidden'), 2500);
}

// ================= Utils =================
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ================= APK Upload / List =================
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const apkListEl = document.getElementById('apkList');
const progressWrap = document.getElementById('progressWrap');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');

dropZone.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', () => {
  if (fileInput.files.length) uploadFile(fileInput.files[0]);
  fileInput.value = '';
});

['dragenter', 'dragover'].forEach((evt) => {
  dropZone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });
});

['dragleave', 'drop'].forEach((evt) => {
  dropZone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
  });
});

dropZone.addEventListener('drop', (e) => {
  const file = e.dataTransfer.files[0];
  if (!file) return;
  if (!file.name.toLowerCase().endsWith('.apk')) {
    showToast('Chỉ chấp nhận file .apk', true);
    return;
  }
  uploadFile(file);
});

function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  const xhr = new XMLHttpRequest();
  xhr.open('POST', '/api/apks/upload');

  progressWrap.classList.remove('hidden');
  progressBar.style.width = '0%';
  progressText.textContent = '0%';

  xhr.upload.addEventListener('progress', (e) => {
    if (e.lengthComputable) {
      const pct = Math.round((e.loaded / e.total) * 100);
      progressBar.style.width = pct + '%';
      progressText.textContent = pct + '%';
    }
  });

  xhr.onload = () => {
    progressWrap.classList.add('hidden');
    if (xhr.status === 200) {
      showToast('Upload APK thành công');
      loadApks();
    } else {
      const res = JSON.parse(xhr.responseText || '{}');
      showToast(res.error || 'Upload thất bại', true);
    }
  };

  xhr.onerror = () => {
    progressWrap.classList.add('hidden');
    showToast('Lỗi kết nối khi upload', true);
  };

  xhr.send(formData);
}

async function loadApks() {
  try {
    const res = await fetch('/api/apks');
    const files = await res.json();
    renderApkList(files);
  } catch (err) {
    showToast('Không tải được danh sách APK', true);
  }
}

function renderApkList(files) {
  if (!files.length) {
    apkListEl.innerHTML = '<p class="empty-hint">Chưa có file APK nào được upload.</p>';
    return;
  }

  apkListEl.innerHTML = files
    .map(
      (f) => `
    <div class="apk-item" data-filename="${escapeHtml(f.filename)}">
      <div class="apk-item__info">
        <div class="apk-item__name">📱 ${escapeHtml(f.name)}</div>
        <div class="apk-item__meta">${formatBytes(f.size)} · ${formatDate(f.uploadedAt)}</div>
      </div>
      <div class="apk-item__actions">
        <button class="btn-icon" data-action="download" title="Tải xuống">⬇️</button>
        <button class="btn-icon danger" data-action="delete" title="Xóa">🗑️</button>
      </div>
    </div>
  `
    )
    .join('');
}

apkListEl.addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const item = btn.closest('.apk-item');
  const filename = item.dataset.filename;
  const action = btn.dataset.action;

  if (action === 'download') {
    window.location.href = `/api/apks/${encodeURIComponent(filename)}/download`;
  } else if (action === 'delete') {
    if (!confirm('Xóa file APK này?')) return;
    try {
      const res = await fetch(`/api/apks/${encodeURIComponent(filename)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      showToast('Đã xóa file APK');
      loadApks();
    } catch {
      showToast('Xóa thất bại', true);
    }
  }
});

// ================= Checklist =================
const taskForm = document.getElementById('taskForm');
const taskInput = document.getElementById('taskInput');
const taskListEl = document.getElementById('taskList');

taskForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = taskInput.value.trim();
  if (!text) return;

  try {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error();
    taskInput.value = '';
    loadTasks();
  } catch {
    showToast('Thêm công việc thất bại', true);
  }
});

async function loadTasks() {
  try {
    const res = await fetch('/api/tasks');
    const tasks = await res.json();
    renderTaskList(tasks);
  } catch {
    showToast('Không tải được checklist', true);
  }
}

function renderTaskList(tasks) {
  if (!tasks.length) {
    taskListEl.innerHTML = '<p class="empty-hint">Chưa có công việc nào.</p>';
    return;
  }

  taskListEl.innerHTML = tasks
    .map(
      (t) => `
    <li class="task-item ${t.done ? 'done' : ''}" data-id="${t.id}">
      <input type="checkbox" ${t.done ? 'checked' : ''} />
      <input type="text" class="task-item__text" value="${escapeHtml(t.text)}" />
      <button class="btn-icon danger" data-action="delete" title="Xóa">🗑️</button>
    </li>
  `
    )
    .join('');
}

taskListEl.addEventListener('change', async (e) => {
  const checkbox = e.target.closest('input[type="checkbox"]');
  if (!checkbox) return;
  const li = checkbox.closest('.task-item');
  const id = li.dataset.id;
  const done = checkbox.checked;

  li.classList.toggle('done', done);
  try {
    await fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done }),
    });
  } catch {
    showToast('Cập nhật thất bại', true);
  }
});

// Sửa nội dung công việc trực tiếp (lưu khi rời khỏi ô input)
taskListEl.addEventListener(
  'focusout',
  async (e) => {
    const input = e.target.closest('.task-item__text');
    if (!input) return;
    const li = input.closest('.task-item');
    const id = li.dataset.id;
    const text = input.value.trim();
    if (!text) return;

    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
    } catch {
      showToast('Cập nhật thất bại', true);
    }
  },
  true
);

taskListEl.addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-action="delete"]');
  if (!btn) return;
  const li = btn.closest('.task-item');
  const id = li.dataset.id;

  try {
    const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error();
    loadTasks();
  } catch {
    showToast('Xóa công việc thất bại', true);
  }
});

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ================= Init =================
loadApks();
loadTasks();
