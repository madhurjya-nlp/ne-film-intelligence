const fs = require('fs');
const path = require('path');
const { run, queryOne, queryAll, transaction } = require('../db/db');

function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function parseSourceRow(row) {
  if (!row) return null;
  const parsed = { ...row };
  if (parsed.parser_config && typeof parsed.parser_config === 'string') {
    try {
      parsed.parser_config = JSON.parse(parsed.parser_config);
    } catch {
      parsed.parser_config = {};
    }
  }
  parsed.active_status = parsed.active_status === 1 || parsed.active_status === true;
  return parsed;
}

const SourceRegistryService = {
  create(data) {
    const id = data.id || 'src_' + generateId();
    const now = new Date().toISOString();
    run(
      `INSERT INTO sources (
        id, name, type, url, country, category, trust_level, active_status,
        crawl_frequency, parser_type, entity_type, parser_config,
        last_checked_at, last_run_at, last_success_at, discovered_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.name,
        data.type,
        data.url || null,
        data.country || null,
        data.category || null,
        data.trust_level ?? 50,
        data.active_status === false ? 0 : 1,
        data.crawl_frequency || 'weekly',
        data.parser_type || 'generic',
        data.entity_type || 'opportunity',
        data.parser_config ? JSON.stringify(data.parser_config) : null,
        data.last_checked_at || now,
        data.last_run_at || null,
        data.last_success_at || null,
        data.discovered_at || now,
        now,
        now,
      ]
    );
    return this.get(id);
  },

  get(id) {
    return parseSourceRow(queryOne(`SELECT * FROM sources WHERE id = ?`, [id]));
  },

  update(id, data) {
    const current = this.get(id);
    if (!current) throw new Error(`Source ${id} not found`);

    const now = new Date().toISOString();
    run(
      `UPDATE sources SET
        name = ?, type = ?, url = ?, country = ?, category = ?, trust_level = ?,
        active_status = ?, crawl_frequency = ?, parser_type = ?, entity_type = ?,
        parser_config = ?, last_checked_at = ?, last_run_at = ?, last_success_at = ?,
        updated_at = ?
       WHERE id = ?`,
      [
        data.name ?? current.name,
        data.type ?? current.type,
        data.url !== undefined ? data.url : current.url,
        data.country !== undefined ? data.country : current.country,
        data.category !== undefined ? data.category : current.category,
        data.trust_level ?? current.trust_level,
        data.active_status === false ? 0 : data.active_status === true ? 1 : (current.active_status ? 1 : 0),
        data.crawl_frequency ?? current.crawl_frequency,
        data.parser_type ?? current.parser_type,
        data.entity_type ?? current.entity_type,
        data.parser_config ? JSON.stringify(data.parser_config) : (current.parser_config ? JSON.stringify(current.parser_config) : null),
        data.last_checked_at ?? current.last_checked_at,
        data.last_run_at !== undefined ? data.last_run_at : current.last_run_at,
        data.last_success_at !== undefined ? data.last_success_at : current.last_success_at,
        now,
        id,
      ]
    );
    return this.get(id);
  },

  list(filters = {}) {
    let sql = `SELECT * FROM sources WHERE 1=1`;
    const params = [];

    if (filters.active_status !== undefined) {
      sql += ` AND active_status = ?`;
      params.push(filters.active_status ? 1 : 0);
    }
    if (filters.parser_type) {
      sql += ` AND parser_type = ?`;
      params.push(filters.parser_type);
    }
    if (filters.category) {
      sql += ` AND category = ?`;
      params.push(filters.category);
    }
    if (filters.search) {
      sql += ` AND (name LIKE ? OR url LIKE ? OR country LIKE ?)`;
      const s = `%${filters.search}%`;
      params.push(s, s, s);
    }

    sql += ` ORDER BY name ASC`;
    return queryAll(sql, params).map(parseSourceRow);
  },

  getActiveSources() {
    return this.list({ active_status: true });
  },

  markRunComplete(id, { success, errorMessage = null } = {}) {
    const now = new Date().toISOString();
    const updates = {
      last_run_at: now,
      last_checked_at: now,
      last_success_at: success ? now : undefined,
    };
    return this.update(id, updates);
  },

  seedFromConfig(configPath) {
    const file = configPath || path.join(__dirname, '..', 'config', 'sources.json');
    if (!fs.existsSync(file)) {
      throw new Error(`Sources config not found: ${file}`);
    }

    const entries = JSON.parse(fs.readFileSync(file, 'utf8'));
    let inserted = 0;
    let updated = 0;

    transaction(() => {
      for (const entry of entries) {
        const existing = this.get(entry.id);
        if (existing) {
          this.update(entry.id, entry);
          updated++;
        } else {
          this.create(entry);
          inserted++;
        }
      }
    });

    return { inserted, updated, total: entries.length };
  },
};

const SyncLogService = {
  start(sourceId) {
    const id = 'sync_' + generateId();
    const now = new Date().toISOString();
    run(
      `INSERT INTO sync_logs (id, source_id, started_at, status, created_at)
       VALUES (?, ?, ?, 'running', ?)`,
      [id, sourceId, now, now]
    );
    return this.get(id);
  },

  get(id) {
    const row = queryOne(
      `SELECT sl.*, s.name as source_name, s.parser_type
       FROM sync_logs sl
       JOIN sources s ON s.id = sl.source_id
       WHERE sl.id = ?`,
      [id]
    );
    return row;
  },

  complete(id, stats) {
    const now = new Date().toISOString();
    const started = queryOne(`SELECT started_at FROM sync_logs WHERE id = ?`, [id]);
    const durationMs = started
      ? new Date(now).getTime() - new Date(started.started_at).getTime()
      : 0;

    const status = stats.error_count > 0
      ? (stats.records_inserted + stats.records_updated > 0 ? 'partial' : 'failed')
      : 'success';

    run(
      `UPDATE sync_logs SET
        completed_at = ?, records_found = ?, records_inserted = ?, records_updated = ?,
        records_rejected = ?, error_count = ?, duration_ms = ?, status = ?, error_message = ?
       WHERE id = ?`,
      [
        now,
        stats.records_found || 0,
        stats.records_inserted || 0,
        stats.records_updated || 0,
        stats.records_rejected || 0,
        stats.error_count || 0,
        durationMs,
        status,
        stats.error_message || null,
        id,
      ]
    );
    return this.get(id);
  },

  list(filters = {}, limit = 50, offset = 0) {
    let sql = `
      SELECT sl.*, s.name as source_name, s.parser_type, s.trust_level
      FROM sync_logs sl
      JOIN sources s ON s.id = sl.source_id
      WHERE 1=1
    `;
    const params = [];

    if (filters.source_id) {
      sql += ` AND sl.source_id = ?`;
      params.push(filters.source_id);
    }
    if (filters.status) {
      sql += ` AND sl.status = ?`;
      params.push(filters.status);
    }

    const countSql = `SELECT COUNT(*) as count FROM (${sql})`;
    const total = queryOne(countSql, params).count;

    sql += ` ORDER BY sl.started_at DESC LIMIT ? OFFSET ?`;
    const items = queryAll(sql, [...params, limit, offset]);
    return { total, items };
  },
};

module.exports = {
  SourceRegistryService,
  SyncLogService,
};