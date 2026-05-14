import Database from 'better-sqlite3'
import { join } from 'path'
import { app } from 'electron'
import { v4 as uuidv4 } from 'uuid'
import { runMigrations } from './migrations'

let db

function getDb() {
  if (!db) {
    const dbPath = join(app.getPath('userData'), 'projecthub.db')
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    initializeSchema()
    runMigrations(db)
  }
  return db
}

function initializeSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'active',
      color TEXT DEFAULT '#3B82F6',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      synced_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'todo',
      priority TEXT DEFAULT 'medium',
      due_date INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      synced_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      color TEXT DEFAULT '#6B7280'
    );

    CREATE TABLE IF NOT EXISTS task_tags (
      task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      tag_id  TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (task_id, tag_id)
    );
  `)
}

// ── Projects ──────────────────────────────────────────────────────────────────

function getAllProjects() {
  return getDb().prepare(`
    SELECT
      p.*,
      COUNT(t.id) AS task_count,
      SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) AS done_count
    FROM projects p
    LEFT JOIN tasks t ON t.project_id = p.id
    GROUP BY p.id
    ORDER BY p.updated_at DESC
  `).all()
}

function getProjectById(id) {
  return getDb().prepare('SELECT * FROM projects WHERE id = ?').get(id)
}

function createProject({ name, description, color }) {
  const now = Date.now()
  const id = uuidv4()
  getDb().prepare(`
    INSERT INTO projects (id, name, description, color, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'active', ?, ?)
  `).run(id, name, description || null, color || '#3B82F6', now, now)
  return getProjectById(id)
}

function updateProject({ id, name, description, color, status, notes }) {
  const now = Date.now()
  getDb().prepare(`
    UPDATE projects
    SET name = ?, description = ?, color = ?, status = ?, notes = ?, updated_at = ?
    WHERE id = ?
  `).run(name, description || null, color, status, notes !== undefined ? notes : null, now, id)
  return getProjectById(id)
}

function deleteProject(id) {
  getDb().prepare('DELETE FROM projects WHERE id = ?').run(id)
  return { success: true }
}

// ── Tasks ─────────────────────────────────────────────────────────────────────

function getTasksByProject(projectId) {
  const tasks = getDb().prepare(`
    SELECT * FROM tasks WHERE project_id = ? ORDER BY
      CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END,
      created_at ASC
  `).all(projectId)

  return tasks.map(task => ({
    ...task,
    tags: getTagsByTask(task.id)
  }))
}

function getTaskById(id) {
  const task = getDb().prepare('SELECT * FROM tasks WHERE id = ?').get(id)
  if (!task) return null
  return { ...task, tags: getTagsByTask(id) }
}

function createTask({ projectId, title, description, status, priority, dueDate, tagIds }) {
  const now = Date.now()
  const id = uuidv4()
  getDb().prepare(`
    INSERT INTO tasks (id, project_id, title, description, status, priority, due_date, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    projectId,
    title,
    description || null,
    status || 'todo',
    priority || 'medium',
    dueDate || null,
    now,
    now
  )

  if (tagIds && tagIds.length > 0) {
    setTaskTags(id, tagIds)
  }

  return getTaskById(id)
}

function updateTask({ id, title, description, status, priority, dueDate, tagIds }) {
  const now = Date.now()
  getDb().prepare(`
    UPDATE tasks
    SET title = ?, description = ?, status = ?, priority = ?, due_date = ?, updated_at = ?
    WHERE id = ?
  `).run(title, description || null, status, priority, dueDate || null, now, id)

  if (tagIds !== undefined) {
    setTaskTags(id, tagIds)
  }

  return getTaskById(id)
}

function deleteTask(id) {
  getDb().prepare('DELETE FROM tasks WHERE id = ?').run(id)
  return { success: true }
}

function updateTaskStatus(id, status) {
  const now = Date.now()
  getDb().prepare('UPDATE tasks SET status = ?, updated_at = ? WHERE id = ?').run(status, now, id)
  return getTaskById(id)
}

// ── Tags ──────────────────────────────────────────────────────────────────────

function getAllTags() {
  return getDb().prepare('SELECT * FROM tags ORDER BY name ASC').all()
}

function createTag({ name, color }) {
  const existing = getDb().prepare('SELECT * FROM tags WHERE name = ?').get(name)
  if (existing) return existing
  const id = uuidv4()
  getDb().prepare('INSERT INTO tags (id, name, color) VALUES (?, ?, ?)').run(
    id,
    name,
    color || '#6B7280'
  )
  return getDb().prepare('SELECT * FROM tags WHERE id = ?').get(id)
}

function deleteTag(id) {
  getDb().prepare('DELETE FROM tags WHERE id = ?').run(id)
  return { success: true }
}

function getTagsByTask(taskId) {
  return getDb().prepare(`
    SELECT tags.*
    FROM tags
    JOIN task_tags ON tags.id = task_tags.tag_id
    WHERE task_tags.task_id = ?
  `).all(taskId)
}

function setTaskTags(taskId, tagIds) {
  getDb().prepare('DELETE FROM task_tags WHERE task_id = ?').run(taskId)
  const stmt = getDb().prepare('INSERT INTO task_tags (task_id, tag_id) VALUES (?, ?)')
  for (const tagId of tagIds) {
    stmt.run(taskId, tagId)
  }
}

// ── Search ────────────────────────────────────────────────────────────────────

function search(query) {
  const q = `%${query}%`

  const projects = getDb().prepare(`
    SELECT 'project' AS type, id, name, description, color, status
    FROM projects
    WHERE name LIKE ? OR description LIKE ?
    LIMIT 20
  `).all(q, q)

  const tasks = getDb().prepare(`
    SELECT 'task' AS type, t.id, t.title AS name, t.description,
           t.status, t.priority, t.project_id, p.name AS project_name, p.color AS project_color
    FROM tasks t
    JOIN projects p ON p.id = t.project_id
    WHERE t.title LIKE ? OR t.description LIKE ?
    LIMIT 20
  `).all(q, q)

  return { projects, tasks }
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export function getDashboardStats() {
  const db = getDb()
  const now = Date.now()
  const sevenDays = 7 * 24 * 60 * 60 * 1000

  const activeProjects = db.prepare(
    `SELECT COUNT(*) AS c FROM projects WHERE status = 'active'`
  ).get().c

  const openTasks = db.prepare(
    `SELECT COUNT(*) AS c FROM tasks t
     JOIN projects p ON t.project_id = p.id
     WHERE p.status = 'active' AND t.status != 'done'`
  ).get().c

  const inProgress = db.prepare(
    `SELECT COUNT(*) AS c FROM tasks t
     JOIN projects p ON t.project_id = p.id
     WHERE p.status = 'active' AND t.status = 'in_progress'`
  ).get().c

  const overdue = db.prepare(
    `SELECT COUNT(*) AS c FROM tasks t
     JOIN projects p ON t.project_id = p.id
     WHERE p.status = 'active' AND t.status != 'done'
       AND t.due_date IS NOT NULL AND t.due_date < ?`
  ).get(now).c

  const upcoming = db.prepare(
    `SELECT t.id, t.title, t.due_date, t.priority, t.status,
            p.id AS project_id, p.name AS project_name, p.color AS project_color
     FROM tasks t
     JOIN projects p ON t.project_id = p.id
     WHERE p.status = 'active' AND t.status != 'done'
       AND t.due_date IS NOT NULL AND t.due_date >= ? AND t.due_date <= ?
     ORDER BY t.due_date ASC
     LIMIT 15`
  ).all(now - 24 * 60 * 60 * 1000, now + sevenDays)

  const recentProjects = db.prepare(
    `SELECT p.*,
       COUNT(t.id) AS task_count,
       SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) AS done_count
     FROM projects p
     LEFT JOIN tasks t ON t.project_id = p.id
     WHERE p.status = 'active'
     GROUP BY p.id
     ORDER BY p.updated_at DESC
     LIMIT 5`
  ).all()

  return { activeProjects, openTasks, inProgress, overdue, upcoming, recentProjects }
}

// ── Deadline notifications helper ─────────────────────────────────────────────

/**
 * Returns tasks whose deadline falls within the last 24 h (overdue today) or
 * the next 24 h (due today / tomorrow), excluding already-done tasks.
 * Called by notifications.js.
 */
export function getUpcomingDeadlineTasks(hours = 24) {
  const now = Date.now()
  const windowMs = hours * 60 * 60 * 1000
  return getDb()
    .prepare(
      `SELECT t.title, t.due_date, p.name AS project_name
       FROM tasks t
       JOIN projects p ON t.project_id = p.id
       WHERE t.status != 'done'
         AND t.due_date IS NOT NULL
         AND t.due_date > ?
         AND t.due_date <= ?`
    )
    .all(now - windowMs, now + windowMs)
}

export {
  getAllProjects,
  createProject,
  updateProject,
  deleteProject,
  getTasksByProject,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  getAllTags,
  createTag,
  deleteTag,
  search
}
