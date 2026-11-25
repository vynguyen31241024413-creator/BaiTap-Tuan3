const express = require('express');
const path = require('path');
const db = require('./db');
const { seed } = require('./seed');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Lần chạy đầu tiên: nạp dữ liệu mẫu nếu bảng rỗng
if (db.prepare('SELECT COUNT(*) AS c FROM tasks').get().c === 0) seed();

const todayStr = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};
const PRIORITIES = ['low', 'medium', 'high'];
const STATUSES = ['todo', 'doing', 'done'];
const isDate = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};

function validate(body, partial = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return ['Dữ liệu gửi lên không hợp lệ'];
  const errors = [];
  if (!partial || body.title !== undefined) {
    if (!body.title || !String(body.title).trim()) errors.push('Tiêu đề không được để trống');
  }
  if (body.priority !== undefined && !PRIORITIES.includes(body.priority)) errors.push('Độ ưu tiên không hợp lệ');
  if (body.status !== undefined && !STATUSES.includes(body.status)) errors.push('Trạng thái không hợp lệ');
  if (body.due_date !== undefined && body.due_date !== null && body.due_date !== '') {
    if (!isDate(String(body.due_date))) errors.push('Ngày hạn không hợp lệ (YYYY-MM-DD)');
  }
  for (const field of ['description', 'category']) {
    if (body[field] !== undefined && typeof body[field] !== 'string') errors.push(`${field === 'category' ? 'Danh mục' : 'Mô tả'} phải là văn bản`);
  }
  if (body.title !== undefined && typeof body.title !== 'string') errors.push('Tiêu đề phải là văn bản');
  return errors;
}

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ errors: ['JSON gửi lên không hợp lệ'] });
  }
  next(err);
});

// Danh sách task: ?q=&status=&priority=&category=&date=today|YYYY-MM-DD|overdue
app.get('/api/tasks', (req, res) => {
  const { q, status, priority, category, date } = req.query;
  if (status && !STATUSES.includes(status)) return res.status(400).json({ errors: ['Trạng thái lọc không hợp lệ'] });
  if (priority && !PRIORITIES.includes(priority)) return res.status(400).json({ errors: ['Độ ưu tiên lọc không hợp lệ'] });
  if (date && date !== 'today' && date !== 'overdue' && !isDate(date)) {
    return res.status(400).json({ errors: ['Ngày lọc không hợp lệ'] });
  }
  const where = [];
  const params = [];
  if (q) {
    where.push('(title LIKE ? OR description LIKE ?)');
    params.push(`%${q}%`, `%${q}%`);
  }
  if (status) { where.push('status = ?'); params.push(status); }
  if (priority) { where.push('priority = ?'); params.push(priority); }
  if (category) { where.push('category = ?'); params.push(category); }
  if (date === 'today') { where.push('due_date = ?'); params.push(todayStr()); }
  else if (date === 'overdue') { where.push("due_date < ? AND status != 'done'"); params.push(todayStr()); }
  else if (date) { where.push('due_date = ?'); params.push(date); }

  const sql = `SELECT * FROM tasks ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
               ORDER BY (status = 'done'), due_date IS NULL, due_date,
                        CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END`;
  res.json(db.prepare(sql).all(...params));
});

app.get('/api/categories', (req, res) => {
  res.json(db.prepare('SELECT DISTINCT category FROM tasks ORDER BY category').all().map(r => r.category));
});

app.post('/api/tasks', (req, res) => {
  const errors = validate(req.body);
  if (errors.length) return res.status(400).json({ errors });
  const { title, description = '', category = 'Khác', priority = 'medium', status = 'todo', due_date = null } = req.body;
  const info = db.prepare(`INSERT INTO tasks (title, description, category, priority, status, due_date, completed_at)
                           VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(title.trim(), description, category || 'Khác', priority, status, due_date || null,
         status === 'done' ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null);
  res.status(201).json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(info.lastInsertRowid));
});

app.put('/api/tasks/:id', (req, res) => {
  const old = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!old) return res.status(404).json({ errors: ['Không tìm thấy task'] });
  const errors = validate(req.body, true);
  if (errors.length) return res.status(400).json({ errors });
  const t = { ...old, ...req.body };
  let completed = old.completed_at;
  if (t.status === 'done' && old.status !== 'done') completed = new Date().toISOString().slice(0, 19).replace('T', ' ');
  if (t.status !== 'done') completed = null;
  db.prepare(`UPDATE tasks SET title=?, description=?, category=?, priority=?, status=?, due_date=?, completed_at=? WHERE id=?`)
    .run(String(t.title).trim(), t.description || '', t.category || 'Khác', t.priority, t.status, t.due_date || null, completed, old.id);
  res.json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(old.id));
});

app.delete('/api/tasks/:id', (req, res) => {
  const info = db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  if (!info.changes) return res.status(404).json({ errors: ['Không tìm thấy task'] });
  res.status(204).end();
});

// Thống kê
app.get('/api/stats', (req, res) => {
  const today = todayStr();
  const total = db.prepare('SELECT COUNT(*) AS c FROM tasks').get().c;
  const done = db.prepare("SELECT COUNT(*) AS c FROM tasks WHERE status='done'").get().c;
  const overdue = db.prepare("SELECT COUNT(*) AS c FROM tasks WHERE due_date < ? AND status != 'done'").get(today).c;
  const todayTotal = db.prepare('SELECT COUNT(*) AS c FROM tasks WHERE due_date = ?').get(today).c;
  const todayDone = db.prepare("SELECT COUNT(*) AS c FROM tasks WHERE due_date = ? AND status='done'").get(today).c;
  const byStatus = db.prepare('SELECT status AS label, COUNT(*) AS count FROM tasks GROUP BY status').all();
  const byPriority = db.prepare('SELECT priority AS label, COUNT(*) AS count FROM tasks GROUP BY priority').all();
  const byCategory = db.prepare('SELECT category AS label, COUNT(*) AS count FROM tasks GROUP BY category ORDER BY count DESC').all();

  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    last7.push({
      date: ds,
      total: db.prepare('SELECT COUNT(*) AS c FROM tasks WHERE due_date = ?').get(ds).c,
      done: db.prepare("SELECT COUNT(*) AS c FROM tasks WHERE due_date = ? AND status='done'").get(ds).c,
    });
  }
  res.json({ total, done, overdue, todayTotal, todayDone,
             completionRate: total ? Math.round((done / total) * 100) : 0,
             byStatus, byPriority, byCategory, last7 });
});

app.listen(PORT, () => console.log(`Todo App chạy tại http://localhost:${PORT}`));
