const fs = require('fs');
const path = require('path');
const { run, queryOne, queryAll, transaction } = require('../db/db');

function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function slugify(text) {
  return String(text || 'untitled').toLowerCase().trim()
    .replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-');
}

const CountryService = {
  create(data) {
    const id = data.id || 'ctry_' + slugify(data.name);
    const slug = data.slug || slugify(data.name);
    const now = new Date().toISOString();
    run(
      `INSERT INTO countries (id, slug, name, region, summary, language_notes, publication_status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, slug, data.name, data.region, data.summary, data.language_notes || null, data.publication_status || 'draft', now, now]
    );

    if (data.cost_profiles) {
      for (const cp of data.cost_profiles) this.addCostProfile(id, cp);
    }
    if (data.visa_notes) {
      for (const vn of data.visa_notes) this.addVisaNote(id, vn);
    }
    if (data.scholarship_notes) {
      for (const sn of data.scholarship_notes) this.addScholarshipNote(id, sn);
    }

    return this.get(id);
  },

  get(id) {
    const country = queryOne(`SELECT * FROM countries WHERE id = ?`, [id]);
    if (!country) return null;
    country.cost_profiles = queryAll(`SELECT * FROM country_cost_profiles WHERE country_id = ?`, [id]);
    country.visa_notes = queryAll(`SELECT * FROM country_visa_notes WHERE country_id = ?`, [id]);
    country.scholarship_notes = queryAll(`SELECT * FROM country_scholarship_notes WHERE country_id = ?`, [id]);
    country.linked_entities = queryAll(
      `SELECT * FROM entity_relationships WHERE (from_type = 'country' AND from_id = ?) OR (to_type = 'country' AND to_id = ?)`,
      [id, id]
    );
    return country;
  },

  addCostProfile(countryId, data) {
    const id = 'ccp_' + generateId();
    run(
      `INSERT INTO country_cost_profiles (id, country_id, cost_band, tuition_notes, living_cost_notes, currency, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, countryId, data.cost_band, data.tuition_notes || null, data.living_cost_notes || null, data.currency || null, new Date().toISOString()]
    );
    return queryOne(`SELECT * FROM country_cost_profiles WHERE id = ?`, [id]);
  },

  addVisaNote(countryId, data) {
    const id = 'cvn_' + generateId();
    run(
      `INSERT INTO country_visa_notes (id, country_id, visa_type, notes, processing_time, st_candidate_notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, countryId, data.visa_type || null, data.notes, data.processing_time || null, data.st_candidate_notes || null, new Date().toISOString()]
    );
    return queryOne(`SELECT * FROM country_visa_notes WHERE id = ?`, [id]);
  },

  addScholarshipNote(countryId, data) {
    const id = 'csn_' + generateId();
    run(
      `INSERT INTO country_scholarship_notes (id, country_id, title, notes, eligibility, linked_opportunity_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, countryId, data.title, data.notes, data.eligibility || null, data.linked_opportunity_id || null, new Date().toISOString()]
    );
    return queryOne(`SELECT * FROM country_scholarship_notes WHERE id = ?`, [id]);
  },

  list(filters = {}) {
    let sql = `SELECT * FROM countries WHERE 1=1`;
    const params = [];
    if (filters.region) { sql += ` AND region = ?`; params.push(filters.region); }
    if (filters.publication_status) { sql += ` AND publication_status = ?`; params.push(filters.publication_status); }
    sql += ` ORDER BY name ASC`;
    return { total: 0, items: queryAll(sql, params) };
  },

  seedFromConfig(configPath) {
    const file = configPath || path.join(__dirname, '..', 'config', 'countries.json');
    const entries = JSON.parse(fs.readFileSync(file, 'utf8'));
    let inserted = 0;
    let updated = 0;
    transaction(() => {
      for (const entry of entries) {
        const existing = queryOne(`SELECT id FROM countries WHERE id = ? OR slug = ?`, [entry.id, entry.slug || slugify(entry.name)]);
        if (existing) {
          run(`UPDATE countries SET name=?, region=?, summary=?, language_notes=?, publication_status='published', updated_at=? WHERE id=?`,
            [entry.name, entry.region, entry.summary, entry.language_notes || null, new Date().toISOString(), existing.id]);
          updated++;
        } else {
          this.create({ ...entry, publication_status: 'published' });
          inserted++;
        }
      }
    });
    return { inserted, updated, total: entries.length };
  },
};

module.exports = { CountryService };