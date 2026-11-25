const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const db = new DatabaseSync(path.join(__dirname, 'todo.db'));
db.exec('PRAGMA journal_mode = WAL;');

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    title        TEXT NOT NULL,
    description  TEXT DEFAULT '',
    category     TEXT DEFAULT 'Khác',
    priority     TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
    status       TEXT NOT NULL DEFAULT 'todo'   CHECK (status IN ('todo','doing','done')),
    due_date     TEXT,
    created_at   TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    completed_at TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks(due_date);
  CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
`);

module.exports = db;
