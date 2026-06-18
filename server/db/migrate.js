const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const DB_FILE = path.join(__dirname, 'database.sqlite');

const PHASE2_COLUMNS = [
  { name: 'country', sql: 'ALTER TABLE sources ADD COLUMN country TEXT' },
  { name: 'category', sql: 'ALTER TABLE sources ADD COLUMN category TEXT' },
  { name: 'trust_level', sql: 'ALTER TABLE sources ADD COLUMN trust_level INTEGER DEFAULT 50' },
  { name: 'active_status', sql: 'ALTER TABLE sources ADD COLUMN active_status INTEGER DEFAULT 1' },
  { name: 'crawl_frequency', sql: "ALTER TABLE sources ADD COLUMN crawl_frequency TEXT DEFAULT 'weekly'" },
  { name: 'parser_type', sql: 'ALTER TABLE sources ADD COLUMN parser_type TEXT' },
  { name: 'entity_type', sql: "ALTER TABLE sources ADD COLUMN entity_type TEXT DEFAULT 'opportunity'" },
  { name: 'parser_config', sql: 'ALTER TABLE sources ADD COLUMN parser_config TEXT' },
  { name: 'last_run_at', sql: 'ALTER TABLE sources ADD COLUMN last_run_at TEXT' },
  { name: 'last_success_at', sql: 'ALTER TABLE sources ADD COLUMN last_success_at TEXT' },
];

function columnExists(db, table, column) {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all();
  return rows.some((row) => row.name === column);
}

function tableExists(db, table) {
  const row = db.prepare(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?"
  ).get(table);
  return !!row;
}

function runMigrations(db) {
  let applied = 0;

  if (tableExists(db, 'sources')) {
    for (const col of PHASE2_COLUMNS) {
      if (!columnExists(db, 'sources', col.name)) {
        db.exec(col.sql);
        applied++;
        console.log(`[Migration] Added sources.${col.name}`);
      }
    }
  }

  if (!tableExists(db, 'sync_logs')) {
    db.exec(`
      CREATE TABLE sync_logs (
        id TEXT PRIMARY KEY,
        source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
        started_at TEXT NOT NULL,
        completed_at TEXT,
        records_found INTEGER DEFAULT 0,
        records_inserted INTEGER DEFAULT 0,
        records_updated INTEGER DEFAULT 0,
        records_rejected INTEGER DEFAULT 0,
        error_count INTEGER DEFAULT 0,
        duration_ms INTEGER DEFAULT 0,
        status TEXT CHECK(status IN ('running', 'success', 'partial', 'failed')) DEFAULT 'running',
        error_message TEXT,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_sync_logs_source ON sync_logs(source_id);
      CREATE INDEX IF NOT EXISTS idx_sync_logs_started ON sync_logs(started_at);
    `);
    applied++;
    console.log('[Migration] Created sync_logs table');
  }

  if (!tableExists(db, 'source_record_hashes')) {
    db.exec(`
      CREATE TABLE source_record_hashes (
        source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
        external_id TEXT NOT NULL,
        content_hash TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT,
        last_seen_at TEXT NOT NULL,
        PRIMARY KEY (source_id, external_id)
      );
      CREATE INDEX IF NOT EXISTS idx_record_hashes_entity ON source_record_hashes(entity_id);
    `);
    applied++;
    console.log('[Migration] Created source_record_hashes table');
  }

  if (tableExists(db, 'sources') && columnExists(db, 'sources', 'active_status')) {
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_sources_active ON sources(active_status)',
      'CREATE INDEX IF NOT EXISTS idx_sources_parser ON sources(parser_type)',
      'CREATE INDEX IF NOT EXISTS idx_sources_trust ON sources(trust_level)',
    ];
    for (const idx of indexes) {
      try {
        db.exec(idx);
      } catch (err) {
        console.warn(`[Migration] Index skipped: ${err.message}`);
      }
    }
  }

  // Phase 3: Research Intelligence tables
  const phase3Tables = [
    {
      name: 'roadmaps',
      sql: `CREATE TABLE roadmaps (
        id TEXT PRIMARY KEY, slug TEXT UNIQUE NOT NULL, title TEXT NOT NULL,
        summary TEXT NOT NULL, description TEXT, target_audience TEXT,
        publication_status TEXT DEFAULT 'draft',
        created_at TEXT NOT NULL, updated_at TEXT NOT NULL
      )`,
    },
    {
      name: 'roadmap_steps',
      sql: `CREATE TABLE roadmap_steps (
        id TEXT PRIMARY KEY, roadmap_id TEXT NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
        title TEXT NOT NULL, summary TEXT NOT NULL, step_order INTEGER NOT NULL,
        prerequisite_step_id TEXT, milestone_label TEXT,
        created_at TEXT NOT NULL, updated_at TEXT NOT NULL
      )`,
    },
    {
      name: 'roadmap_resources',
      sql: `CREATE TABLE roadmap_resources (
        id TEXT PRIMARY KEY, step_id TEXT NOT NULL REFERENCES roadmap_steps(id) ON DELETE CASCADE,
        entity_type TEXT NOT NULL, entity_id TEXT NOT NULL,
        resource_order INTEGER DEFAULT 0, notes TEXT, created_at TEXT NOT NULL
      )`,
    },
    {
      name: 'calendar_events',
      sql: `CREATE TABLE calendar_events (
        id TEXT PRIMARY KEY, entity_type TEXT NOT NULL, entity_id TEXT NOT NULL,
        title TEXT NOT NULL, deadline_date TEXT, deadline_raw TEXT,
        deadline_status TEXT DEFAULT 'unknown',
        country TEXT, region TEXT, source_id TEXT,
        created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
        UNIQUE(entity_type, entity_id)
      )`,
    },
    {
      name: 'reports',
      sql: `CREATE TABLE reports (
        id TEXT PRIMARY KEY, slug TEXT UNIQUE NOT NULL, title TEXT NOT NULL,
        report_type TEXT NOT NULL, summary TEXT,
        publication_status TEXT DEFAULT 'draft',
        generated_at TEXT NOT NULL, published_at TEXT,
        created_at TEXT NOT NULL, updated_at TEXT NOT NULL
      )`,
    },
    {
      name: 'report_sections',
      sql: `CREATE TABLE report_sections (
        id TEXT PRIMARY KEY, report_id TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
        section_order INTEGER NOT NULL, heading TEXT NOT NULL,
        content TEXT NOT NULL, query_meta TEXT, created_at TEXT NOT NULL
      )`,
    },
    {
      name: 'countries',
      sql: `CREATE TABLE countries (
        id TEXT PRIMARY KEY, slug TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
        region TEXT NOT NULL, summary TEXT NOT NULL, language_notes TEXT,
        publication_status TEXT DEFAULT 'draft',
        created_at TEXT NOT NULL, updated_at TEXT NOT NULL
      )`,
    },
    {
      name: 'country_cost_profiles',
      sql: `CREATE TABLE country_cost_profiles (
        id TEXT PRIMARY KEY, country_id TEXT NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
        cost_band TEXT NOT NULL, tuition_notes TEXT, living_cost_notes TEXT,
        currency TEXT, created_at TEXT NOT NULL
      )`,
    },
    {
      name: 'country_visa_notes',
      sql: `CREATE TABLE country_visa_notes (
        id TEXT PRIMARY KEY, country_id TEXT NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
        visa_type TEXT, notes TEXT NOT NULL, processing_time TEXT,
        st_candidate_notes TEXT, created_at TEXT NOT NULL
      )`,
    },
    {
      name: 'country_scholarship_notes',
      sql: `CREATE TABLE country_scholarship_notes (
        id TEXT PRIMARY KEY, country_id TEXT NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
        title TEXT NOT NULL, notes TEXT NOT NULL, eligibility TEXT,
        linked_opportunity_id TEXT, created_at TEXT NOT NULL
      )`,
    },
    {
      name: 'entity_relationships',
      sql: `CREATE TABLE entity_relationships (
        id TEXT PRIMARY KEY,
        from_type TEXT NOT NULL, from_id TEXT NOT NULL,
        to_type TEXT NOT NULL, to_id TEXT NOT NULL,
        relationship_type TEXT NOT NULL, weight REAL DEFAULT 1.0, notes TEXT,
        created_at TEXT NOT NULL,
        UNIQUE(from_type, from_id, to_type, to_id, relationship_type)
      )`,
    },
  ];

  for (const tbl of phase3Tables) {
    if (!tableExists(db, tbl.name)) {
      db.exec(tbl.sql);
      applied++;
      console.log(`[Migration] Created ${tbl.name} table`);
    }
  }

  // Phase 5.1: Books ecosystem (additive only)
  if (!tableExists(db, 'books')) {
    db.exec(`
      CREATE TABLE books (
        id TEXT PRIMARY KEY,
        slug TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        author TEXT,
        category TEXT,
        summary TEXT,
        ne_relevance TEXT,
        legacy_link TEXT,
        verification_status TEXT DEFAULT 'pending',
        publication_status TEXT DEFAULT 'draft',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);
      CREATE INDEX IF NOT EXISTS idx_books_category ON books(category);
    `);
    applied++;
    console.log('[Migration] Created books table');
  }

  if (!tableExists(db, 'book_external_links')) {
    db.exec(`
      CREATE TABLE book_external_links (
        id TEXT PRIMARY KEY,
        book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
        link_type TEXT CHECK(link_type IN ('publisher','amazon','archive','open_access','goodreads')) NOT NULL,
        url TEXT NOT NULL,
        label TEXT,
        priority INTEGER DEFAULT 0,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_book_links_book ON book_external_links(book_id);
      CREATE INDEX IF NOT EXISTS idx_book_links_type ON book_external_links(link_type);
    `);
    applied++;
    console.log('[Migration] Created book_external_links table');
  }

  if (applied === 0) {
    console.log('[Migration] Database already up to date.');
  } else {
    console.log(`[Migration] Applied ${applied} migration step(s).`);
  }
}

if (require.main === module) {
  const db = new DatabaseSync(DB_FILE);
  runMigrations(db);
}

module.exports = { runMigrations };