import Database from 'better-sqlite3';
import { config } from '../config';
import path from 'path';
import fs from 'fs';

let db: Database.Database | null = null;

export function initDatabase(): Database.Database {
  if (db) return db;

  const dbDir = path.dirname(config.db.path);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new Database(config.db.path);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  runMigrations(db);
  runAlterMigrations(db);
  seed(db);

  console.log(`Database initialized at ${config.db.path}`);
  return db;
}

export function getDatabase(): Database.Database {
  if (!db) throw new Error('Database not initialized');
  return db;
}

function runMigrations(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      github_id TEXT UNIQUE,
      username TEXT UNIQUE NOT NULL,
      display_name TEXT,
      avatar_url TEXT,
      token TEXT UNIQUE NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS archetypes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      color TEXT
    );

    CREATE TABLE IF NOT EXISTS seasons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      model_tag TEXT NOT NULL,
      starts_at TEXT NOT NULL,
      ends_at TEXT,
      is_active INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS builds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      name TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      archetype_id TEXT NOT NULL REFERENCES archetypes(id),
      season_id INTEGER NOT NULL REFERENCES seasons(id),
      current_version INTEGER DEFAULT 1,
      is_champion INTEGER DEFAULT 0,
      is_published INTEGER DEFAULT 1,
      vote_count INTEGER DEFAULT 0,
      pull_count INTEGER DEFAULT 0,
      copy_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS build_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      build_id INTEGER NOT NULL REFERENCES builds(id),
      version INTEGER NOT NULL,
      content TEXT NOT NULL,
      content_hash TEXT NOT NULL,
      byte_size INTEGER NOT NULL,
      line_count INTEGER NOT NULL,
      word_count INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(build_id, version)
    );

    CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      build_version_id INTEGER NOT NULL REFERENCES build_versions(id),
      archetype_purity REAL DEFAULT 0,
      consistency REAL DEFAULT 0,
      token_efficiency REAL DEFAULT 0,
      signal_density REAL DEFAULT 0,
      clarity REAL DEFAULT 0,
      composite REAL DEFAULT 0,
      judge_model TEXT,
      scored_at TEXT DEFAULT (datetime('now')),
      UNIQUE(build_version_id, judge_model)
    );

    CREATE TABLE IF NOT EXISTS votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      build_id INTEGER NOT NULL REFERENCES builds(id),
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, build_id)
    );

    CREATE TABLE IF NOT EXISTS pull_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      build_id INTEGER NOT NULL REFERENCES builds(id),
      ip_hash TEXT,
      user_agent TEXT,
      pulled_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      content TEXT NOT NULL,
      tags TEXT DEFAULT '',
      published_at TEXT DEFAULT (datetime('now')),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
    CREATE INDEX IF NOT EXISTS idx_builds_name ON builds(name);
    CREATE INDEX IF NOT EXISTS idx_builds_archetype ON builds(archetype_id);
    CREATE INDEX IF NOT EXISTS idx_builds_season ON builds(season_id);
    CREATE INDEX IF NOT EXISTS idx_build_versions_build ON build_versions(build_id, version);
    CREATE INDEX IF NOT EXISTS idx_scores_version ON scores(build_version_id);
    CREATE INDEX IF NOT EXISTS idx_pull_log_build ON pull_log(build_id);
    CREATE INDEX IF NOT EXISTS idx_pull_log_time ON pull_log(pulled_at);

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      build_id INTEGER NOT NULL REFERENCES builds(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_comments_build ON comments(build_id);

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      link TEXT,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
  `);
}

function runAlterMigrations(db: Database.Database) {
  // Add reasoning column if it doesn't exist
  const cols = db.prepare("PRAGMA table_info(scores)").all() as { name: string }[];
  if (!cols.find(c => c.name === 'reasoning')) {
    db.exec("ALTER TABLE scores ADD COLUMN reasoning TEXT DEFAULT ''");
    console.log('Added reasoning column to scores');
  }

  // Add is_admin column to users
  const userCols = db.prepare("PRAGMA table_info(users)").all() as { name: string }[];
  if (!userCols.find(c => c.name === 'is_admin')) {
    db.exec("ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0");
    console.log('Added is_admin column to users');
  }

  // Add forked_from column to builds
  const buildCols = db.prepare("PRAGMA table_info(builds)").all() as { name: string }[];
  if (!buildCols.find(c => c.name === 'forked_from')) {
    db.exec("ALTER TABLE builds ADD COLUMN forked_from INTEGER REFERENCES builds(id)");
    console.log('Added forked_from column to builds');
  }
  if (!buildCols.find(c => c.name === 'tags')) {
    db.exec("ALTER TABLE builds ADD COLUMN tags TEXT DEFAULT ''");
    console.log('Added tags column to builds');
  }
}

function seed(db: Database.Database) {
  const archetypeCount = (db.prepare('SELECT COUNT(*) as cnt FROM archetypes').get() as { cnt: number }).cnt;
  if (archetypeCount === 0) {
    const insert = db.prepare('INSERT INTO archetypes (id, name, description, color) VALUES (?, ?, ?, ?)');
    insert.run('GOFAST', 'GOFAST', 'Never ask. Assume and ship. Fix later. Maximum velocity.', '#ff2020');
    insert.run('CONTROL', 'CONTROL', 'Identify every ambiguity before writing a line. Verify then build.', '#2080ff');
    insert.run('MIDRANGE', 'MIDRANGE', 'Balanced approach. Ask only when genuinely unclear.', '#20cc60');
    insert.run('TEMPO', 'TEMPO', 'Minimal. Every instruction earns its place. Low token budget.', '#ffaa20');
    insert.run('COMBO', 'COMBO', 'Hyper-specialized for one workflow or outcome.', '#aa20ff');
    console.log('Seeded archetypes');
  }

  const seasonCount = (db.prepare('SELECT COUNT(*) as cnt FROM seasons').get() as { cnt: number }).cnt;
  if (seasonCount === 0) {
    db.prepare(
      'INSERT INTO seasons (name, model_tag, starts_at, is_active) VALUES (?, ?, ?, ?)'
    ).run('Opus 4 Era', 'claude-opus-4-20250514', '2025-05-14', 1);
    console.log('Seeded season 1');
  }
}
