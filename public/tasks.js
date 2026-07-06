const taskForm = document.getElementById('taskForm');
const taskInput = document.getElementById('taskInput');
const taskListEl = document.getElementById('taskList');

if (taskForm) {
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

  loadTasks();
}
