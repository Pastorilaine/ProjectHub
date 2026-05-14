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
