const { queryOne, queryAll } = require('../db/db');
const { PUB } = require('./publicService');

const SORT_MAP = {
  title: 'title ASC',
  newest: 'created_at DESC',
  country: 'country ASC',
  deadline: 'deadline ASC',
};

function parseBudgetBand(band) {
  if (!band) return null;
  const map = {
    '0-3': ['0-3', '0-3L', 'free', '₹0', '€0'],
    '4-6': ['4-6', '4-6L'],
    '7-9': ['7-9', '7-9L'],
  };
  return map[band] || [band];
}

const ExplorerService = {
  explore(filters = {}, sort = 'newest', page = 1, limit = 20) {
    const offset = (Math.max(1, page) - 1) * limit;
    const results = { programs: [], opportunities: [], institutes: [], total: 0, page, limit };

    const types = filters.type
      ? [filters.type]
      : (filters.types || ['program', 'opportunity', 'institute']);

    if (types.includes('program')) {
      results.programs = this._queryPrograms(filters, sort, limit, offset);
    }
    if (types.includes('opportunity')) {
      results.opportunities = this._queryOpportunities(filters, sort, limit, offset);
    }
    if (types.includes('institute')) {
      results.institutes = this._queryInstitutes(filters, sort, limit, offset);
    }

    results.total = results.programs.length + results.opportunities.length + results.institutes.length;
    return results;
  },

  count(filters = {}) {
    let total = 0;
    total += this._countTable('programs', filters, true);
    total += this._countTable('opportunities', filters, true);
    if (!filters.type || filters.type === 'institute') {
      total += this._countTable('institutes', filters, false);
    }
    return total;
  },

  _countTable(table, filters, hasFormat) {
    const { sql, params } = this._buildWhere(table, filters, hasFormat);
    return queryOne(`SELECT COUNT(*) as c FROM ${table} WHERE ${sql}`, params).c;
  },

  _buildWhere(table, filters, hasFormat) {
    let sql = PUB;
    const params = [];

    if (filters.search) {
      sql += ` AND (title LIKE ? OR summary LIKE ?)`;
      const s = `%${filters.search}%`;
      params.push(s, s);
    }
    if (filters.country) { sql += ` AND country = ?`; params.push(filters.country); }
    if (filters.region) { sql += ` AND region = ?`; params.push(filters.region); }
    if (hasFormat && filters.format) { sql += ` AND format = ?`; params.push(filters.format); }
    if (table === 'opportunities' && filters.category) {
      sql += ` AND type = ?`; params.push(filters.category);
    }
    if (table === 'programs' && filters.category) {
      sql += ` AND category = ?`; params.push(filters.category);
    }
    if (filters.scholarship === 'true' && table === 'opportunities') {
      sql += ` AND type IN ('scholarship', 'grant', 'fellowship')`;
    }
    if (filters.budget && table === 'programs') {
      const bands = parseBudgetBand(filters.budget);
      const clauses = bands.map(() => `tuition_or_cost LIKE ?`).join(' OR ');
      sql += ` AND (${clauses})`;
      bands.forEach((b) => params.push(`%${b}%`));
    }
    if (filters.deadline_status) {
      sql += ` AND id IN (
        SELECT entity_id FROM calendar_events WHERE entity_type = ? AND deadline_status = ?
      )`;
      const entityType = table === 'programs' ? 'program' : table === 'opportunities' ? 'opportunity' : 'event';
      params.push(entityType, filters.deadline_status);
    }

    return { sql, params };
  },

  _queryPrograms(filters, sort, limit, offset) {
    const { sql, params } = this._buildWhere('programs', filters, true);
    const order = SORT_MAP[sort] || SORT_MAP.newest;
    return queryAll(
      `SELECT id, slug, title, country, region, format, tuition_or_cost, summary, deadline, 'program' as entity_type
       FROM programs WHERE ${sql} ORDER BY ${order} LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
  },

  _queryOpportunities(filters, sort, limit, offset) {
    const { sql, params } = this._buildWhere('opportunities', filters, true);
    const order = SORT_MAP[sort] || SORT_MAP.newest;
    return queryAll(
      `SELECT id, slug, title, country, region, format, type, amount, summary, deadline, 'opportunity' as entity_type
       FROM opportunities WHERE ${sql} ORDER BY ${order} LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
  },

  _queryInstitutes(filters, sort, limit, offset) {
    let sql = PUB;
    const params = [];
    if (filters.search) {
      sql += ` AND (title LIKE ? OR summary LIKE ?)`;
      const s = `%${filters.search}%`;
      params.push(s, s);
    }
    if (filters.country) { sql += ` AND country = ?`; params.push(filters.country); }
    if (filters.region) { sql += ` AND region = ?`; params.push(filters.region); }
    const order = SORT_MAP[sort] || SORT_MAP.newest;
    return queryAll(
      `SELECT id, slug, title, country, region, summary, website_url, 'institute' as entity_type
       FROM institutes WHERE ${sql} ORDER BY ${order} LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
  },
};

module.exports = { ExplorerService };