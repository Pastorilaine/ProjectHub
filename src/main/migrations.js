/**
 * Database migration runner.
 * Each migration runs exactly once; version is tracked in schema_version table.
 * Add new entries to MIGRATIONS to evolve the schema safely.
 */

const MIGRATIONS = [
  {
    version: 1,
    description: 'Initial schema baseline — tables already created in initializeSchema()',
    sql: null
  },
  {
    version: 2,
    description: 'Add notes column to projects',
    sql: `ALTER TABLE projects ADD COLUMN notes TEXT;`
  },
  {
    version: 3,
    description: 'Create ideas table for idea library',
    sql: `
      CREATE TABLE IF NOT EXISTS ideas (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT,
        category TEXT DEFAULT 'general',
        status TEXT DEFAULT 'raw',
        priority TEXT DEFAULT 'medium',
        linked_project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `
  },
  {
    version: 4,
    description: 'Add sort_order column to tasks for Kanban drag ordering',
    sql: `ALTER TABLE tasks ADD COLUMN sort_order INTEGER DEFAULT 0;`
  }
]

export function runMigrations(db) {
  // Ensure the version tracking table exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER NOT NULL,
      applied_at INTEGER NOT NULL
    );
  `)

  const row = db.prepare('SELECT MAX(version) AS v FROM schema_version').get()
  const currentVersion = row?.v ?? 0

  const pending = MIGRATIONS.filter((m) => m.version > currentVersion)

  for (const migration of pending) {
    db.transaction(() => {
      if (migration.sql) db.exec(migration.sql)
      db.prepare('INSERT INTO schema_version (version, applied_at) VALUES (?, ?)').run(
        migration.version,
        Date.now()
      )
    })()
    console.log(`[migrations] Applied v${migration.version}: ${migration.description}`)
  }
}
