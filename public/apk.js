const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const apkListEl = document.getElementById('apkList');
const progressWrap = document.getElementById('progressWrap');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');

if (dropZone) {
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

  async function uploadFile(file) {
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

  loadApks();
}
