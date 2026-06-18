const { run, queryOne, queryAll, transaction } = require('../db/db');
const { parseDeadline } = require('./dateParser');

function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

const ENTITY_TABLES = [
  { type: 'program', table: 'programs' },
  { type: 'opportunity', table: 'opportunities' },
  { type: 'event', table: 'events' },
];

const CalendarService = {
  syncFromEntities() {
    const now = new Date().toISOString();
    let synced = 0;

    return transaction(() => {
      for (const { type, table } of ENTITY_TABLES) {
        const rows = queryAll(
          `SELECT id, title, deadline, country, region, source_id FROM ${table} WHERE deadline IS NOT NULL AND deadline != ''`
        );

        for (const row of rows) {
          const { deadline_date, deadline_status } = parseDeadline(row.deadline);
          const id = `cal_${type}_${row.id}`;

          run(
            `INSERT INTO calendar_events (id, entity_type, entity_id, title, deadline_date, deadline_raw, deadline_status, country, region, source_id, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(entity_type, entity_id) DO UPDATE SET
               title = excluded.title,
               deadline_date = excluded.deadline_date,
               deadline_raw = excluded.deadline_raw,
               deadline_status = excluded.deadline_status,
               country = excluded.country,
               region = excluded.region,
               source_id = excluded.source_id,
               updated_at = excluded.updated_at`,
            [
              id, type, row.id, row.title,
              deadline_date, row.deadline, deadline_status,
              row.country, row.region, row.source_id,
              now, now,
            ]
          );
          synced++;
        }
      }
      return { synced };
    });
  },

  list(view = 'all', limit = 50, offset = 0) {
    let sql = `SELECT * FROM calendar_events WHERE 1=1`;
    const params = [];

    if (view === 'upcoming') {
      sql += ` AND deadline_status IN ('upcoming', 'this_month')`;
    } else if (view === 'closing_soon') {
      sql += ` AND deadline_status = 'closing_soon'`;
    } else if (view === 'expired') {
      sql += ` AND deadline_status = 'expired'`;
    } else if (view === 'this_month') {
      sql += ` AND deadline_status = 'this_month'`;
    }

    const countSql = `SELECT COUNT(*) as count FROM (${sql})`;
    const total = queryOne(countSql, params).count;

    sql += ` ORDER BY deadline_date ASC NULLS LAST, title ASC LIMIT ? OFFSET ?`;
    const items = queryAll(sql, [...params, limit, offset]);
    return { total, items, view };
  },

  getStats() {
    const rows = queryAll(`
      SELECT deadline_status, COUNT(*) as count
      FROM calendar_events
      GROUP BY deadline_status
    `);
    const stats = { upcoming: 0, closing_soon: 0, expired: 0, this_month: 0, unknown: 0, total: 0 };
    rows.forEach((r) => {
      stats[r.deadline_status] = r.count;
      stats.total += r.count;
    });
    return stats;
  },
};

module.exports = { CalendarService };