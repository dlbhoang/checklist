const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const DATA_DIR = path.join(__dirname, '..', 'data');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');

function readTasks() {
  return JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
}

function writeTasks(tasks) {
  fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2));
}

router.get('/', (req, res) => {
  res.json(readTasks());
});

router.post('/', (req, res) => {
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

router.put('/:id', (req, res) => {
  const tasks = readTasks();
  const idx = tasks.findIndex((t) => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Không tìm thấy công việc' });

  const { text, done } = req.body;
  if (text !== undefined) tasks[idx].text = text;
  if (done !== undefined) tasks[idx].done = done;
  writeTasks(tasks);
  res.json(tasks[idx]);
});

router.delete('/:id', (req, res) => {
  let tasks = readTasks();
  const before = tasks.length;
  tasks = tasks.filter((t) => t.id !== req.params.id);
  if (tasks.length === before) return res.status(404).json({ error: 'Không tìm thấy công việc' });
  writeTasks(tasks);
  res.json({ success: true });
});

module.exports = router;
