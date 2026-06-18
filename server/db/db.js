const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const DB_FILE = process.env.NODE_ENV === 'test'
  ? path.join(__dirname, 'database.test.sqlite')
  : (process.env.DATABASE_PATH || path.join(__dirname, 'database.sqlite'));
const DB_DIR = path.dirname(DB_FILE);
const SCHEMA_FILE = path.join(__dirname, 'schema.sql');

// Ensure database directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Initialize database connection
let db;
try {
  db = new DatabaseSync(DB_FILE);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA busy_timeout = 5000;');
  console.log(`[Database] Connected to SQLite database at: ${DB_FILE}`);
} catch (err) {
  console.error('[Database] Failed to open SQLite database:', err);
  process.exit(1);
}

// Initialize tables and schema
function initSchema() {
  try {
    const schemaSql = fs.readFileSync(SCHEMA_FILE, 'utf8');
    db.exec(schemaSql);
    console.log('[Database] Schema initialized successfully.');
  } catch (err) {
    console.error('[Database] Failed to initialize schema:', err);
    throw err;
  }
}

// For existing DBs: add columns first, then run full schema (CREATE IF NOT EXISTS + new tables)
const { runMigrations } = require('./migrate');
runMigrations(db);
initSchema();

/**
 * Execute a query that returns multiple rows
 */
function queryAll(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    // Bind parameters and execute
    return stmt.all(...params);
  } catch (err) {
    console.error(`[Database] QueryAll Error: ${err.message}\nSQL: ${sql}`);
    throw err;
  }
}

/**
 * Execute a query that returns a single row
 */
function queryOne(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    return stmt.get(...params);
  } catch (err) {
    console.error(`[Database] QueryOne Error: ${err.message}\nSQL: ${sql}`);
    throw err;
  }
}

/**
 * Execute a mutation query (INSERT, UPDATE, DELETE)
 */
function run(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    return stmt.run(...params);
  } catch (err) {
    console.error(`[Database] Run Error: ${err.message}\nSQL: ${sql}`);
    throw err;
  }
}

/**
 * Execute multiple statements in a transaction
 */
function transaction(callback) {
  // In node:sqlite DatabaseSync, we can run transactions manually with SQL
  try {
    db.exec('BEGIN TRANSACTION;');
    const result = callback();
    db.exec('COMMIT;');
    return result;
  } catch (err) {
    db.exec('ROLLBACK;');
    console.error('[Database] Transaction Rolled Back:', err);
    throw err;
  }
}

module.exports = {
  db,
  queryAll,
  queryOne,
  run,
  transaction,
  DB_FILE
};
