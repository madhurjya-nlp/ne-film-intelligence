const { run, queryOne, queryAll, transaction } = require('../db/db');

function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function slugify(text) {
  return String(text || 'report').toLowerCase().trim()
    .replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-');
}

function formatEntityList(rows, fields) {
  if (!rows.length) return 'No records found for this query.';
  return rows.map((r, i) => {
    const parts = fields.map((f) => `${f.label}: ${r[f.key] || 'N/A'}`).join(' | ');
    return `${i + 1}. ${r.title || r.name} — ${parts}`;
  }).join('\n');
}

const REPORT_TEMPLATES = {
  new_opportunities: {
    title: 'New Opportunities This Month',
    sections: [
      {
        heading: 'Recently Added Programs',
        query: () => queryAll(
          `SELECT title, country, tuition_or_cost, verification_status, created_at
           FROM programs WHERE created_at >= date('now', '-30 days') ORDER BY created_at DESC LIMIT 20`
        ),
        fields: [{ key: 'country', label: 'Country' }, { key: 'tuition_or_cost', label: 'Cost' }, { key: 'verification_status', label: 'Status' }],
      },
      {
        heading: 'Recently Added Grants & Scholarships',
        query: () => queryAll(
          `SELECT title, org, amount, type, created_at
           FROM opportunities WHERE created_at >= date('now', '-30 days') ORDER BY created_at DESC LIMIT 20`
        ),
        fields: [{ key: 'org', label: 'Org' }, { key: 'amount', label: 'Amount' }, { key: 'type', label: 'Type' }],
      },
    ],
  },
  scholarships_added: {
    title: 'Scholarships Added',
    sections: [
      {
        heading: 'Scholarship & Grant Records',
        query: () => queryAll(
          `SELECT title, org, amount, country, eligibility, verification_status
           FROM opportunities WHERE type IN ('scholarship', 'grant', 'fellowship')
           ORDER BY created_at DESC LIMIT 25`
        ),
        fields: [{ key: 'org', label: 'Org' }, { key: 'amount', label: 'Amount' }, { key: 'country', label: 'Country' }],
      },
    ],
  },
  festivals_opening: {
    title: 'Festivals Opening Soon',
    sections: [
      {
        heading: 'Upcoming Festival Deadlines',
        query: () => queryAll(
          `SELECT ce.title, ce.deadline_date, ce.deadline_status, ce.country
           FROM calendar_events ce
           JOIN events e ON ce.entity_id = e.id AND ce.entity_type = 'event'
           WHERE ce.deadline_status IN ('closing_soon', 'this_month', 'upcoming')
           ORDER BY ce.deadline_date ASC LIMIT 20`
        ),
        fields: [{ key: 'deadline_date', label: 'Deadline' }, { key: 'deadline_status', label: 'Status' }, { key: 'country', label: 'Country' }],
      },
    ],
  },
  country_update: {
    title: 'Country Intelligence Update',
    sections: [
      {
        heading: 'Country Profiles',
        query: () => queryAll(`SELECT name, region, summary FROM countries ORDER BY name ASC`),
        fields: [{ key: 'region', label: 'Region' }],
      },
      {
        heading: 'Programs by Country',
        query: () => queryAll(
          `SELECT country, COUNT(*) as program_count FROM programs GROUP BY country ORDER BY program_count DESC LIMIT 15`
        ),
        fields: [{ key: 'program_count', label: 'Programs' }],
      },
    ],
  },
  online_programs: {
    title: 'Online Program Updates',
    sections: [
      {
        heading: 'Online & Hybrid Programs',
        query: () => queryAll(
          `SELECT title, country, format, tuition_or_cost, summary
           FROM programs WHERE format IN ('online', 'hybrid') OR remote_or_online = 1
           ORDER BY title ASC LIMIT 25`
        ),
        fields: [{ key: 'format', label: 'Format' }, { key: 'tuition_or_cost', label: 'Cost' }, { key: 'country', label: 'Country' }],
      },
    ],
  },
};

const ReportService = {
  generate(reportType, options = {}) {
    const template = REPORT_TEMPLATES[reportType];
    if (!template) throw new Error(`Unknown report type: ${reportType}`);

    const now = new Date().toISOString();
    const id = 'rpt_' + generateId();
    const slug = slugify(options.slug || `${reportType}-${now.slice(0, 10)}`);
    const title = options.title || template.title;

    return transaction(() => {
      run(
        `INSERT INTO reports (id, slug, title, report_type, summary, publication_status, generated_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'draft', ?, ?, ?)`,
        [id, slug, title, reportType, `Query-generated report: ${title}`, now, now, now]
      );

      let order = 1;
      for (const section of template.sections) {
        const rows = section.query();
        const content = formatEntityList(rows, section.fields);
        const sectionId = 'rps_' + generateId();
        run(
          `INSERT INTO report_sections (id, report_id, section_order, heading, content, query_meta, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [sectionId, id, order++, section.heading, content, JSON.stringify({ row_count: rows.length }), now]
        );
      }

      return this.get(id);
    });
  },

  get(id) {
    const report = queryOne(`SELECT * FROM reports WHERE id = ?`, [id]);
    if (!report) return null;
    report.sections = queryAll(
      `SELECT * FROM report_sections WHERE report_id = ? ORDER BY section_order ASC`,
      [id]
    );
    return report;
  },

  list(filters = {}) {
    let sql = `SELECT * FROM reports WHERE 1=1`;
    const params = [];
    if (filters.report_type) { sql += ` AND report_type = ?`; params.push(filters.report_type); }
    if (filters.publication_status) { sql += ` AND publication_status = ?`; params.push(filters.publication_status); }
    sql += ` ORDER BY generated_at DESC`;
    const items = queryAll(sql, params);
    return { total: items.length, items };
  },

  publish(id) {
    const now = new Date().toISOString();
    run(`UPDATE reports SET publication_status = 'published', published_at = ?, updated_at = ? WHERE id = ?`, [now, now, id]);
    return this.get(id);
  },

  getAvailableTypes() {
    return Object.keys(REPORT_TEMPLATES).map((key) => ({
      type: key,
      title: REPORT_TEMPLATES[key].title,
    }));
  },
};

module.exports = { ReportService, REPORT_TEMPLATES };