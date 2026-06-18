const { run, queryOne, queryAll, transaction } = require('../db/db');

function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function slugify(text) {
  return String(text || 'untitled').toLowerCase().trim()
    .replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-');
}

const RoadmapService = {
  create(data) {
    const id = data.id || 'rm_' + generateId();
    const slug = data.slug || slugify(data.title);
    const now = new Date().toISOString();
    run(
      `INSERT INTO roadmaps (id, slug, title, summary, description, target_audience, publication_status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, slug, data.title, data.summary, data.description || null, data.target_audience || null, data.publication_status || 'draft', now, now]
    );
    return this.get(id);
  },

  get(id) {
    const roadmap = queryOne(`SELECT * FROM roadmaps WHERE id = ?`, [id]);
    if (!roadmap) return null;
    roadmap.steps = this.getSteps(id);
    return roadmap;
  },

  getBySlug(slug) {
    const roadmap = queryOne(`SELECT * FROM roadmaps WHERE slug = ?`, [slug]);
    if (!roadmap) return null;
    return this.get(roadmap.id);
  },

  getSteps(roadmapId) {
    const steps = queryAll(
      `SELECT * FROM roadmap_steps WHERE roadmap_id = ? ORDER BY step_order ASC`,
      [roadmapId]
    );
    return steps.map((step) => ({
      ...step,
      resources: queryAll(
        `SELECT * FROM roadmap_resources WHERE step_id = ? ORDER BY resource_order ASC`,
        [step.id]
      ),
      prerequisite: step.prerequisite_step_id
        ? queryOne(`SELECT id, title FROM roadmap_steps WHERE id = ?`, [step.prerequisite_step_id])
        : null,
    }));
  },

  addStep(roadmapId, data) {
    const id = 'rms_' + generateId();
    const now = new Date().toISOString();
    run(
      `INSERT INTO roadmap_steps (id, roadmap_id, title, summary, step_order, prerequisite_step_id, milestone_label, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, roadmapId, data.title, data.summary, data.step_order, data.prerequisite_step_id || null, data.milestone_label || null, now, now]
    );
    return queryOne(`SELECT * FROM roadmap_steps WHERE id = ?`, [id]);
  },

  addResource(stepId, data) {
    const id = 'rmr_' + generateId();
    const now = new Date().toISOString();
    run(
      `INSERT INTO roadmap_resources (id, step_id, entity_type, entity_id, resource_order, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, stepId, data.entity_type, data.entity_id, data.resource_order || 0, data.notes || null, now]
    );
    return queryOne(`SELECT * FROM roadmap_resources WHERE id = ?`, [id]);
  },

  list(filters = {}) {
    let sql = `SELECT * FROM roadmaps WHERE 1=1`;
    const params = [];
    if (filters.publication_status) {
      sql += ` AND publication_status = ?`;
      params.push(filters.publication_status);
    }
    if (filters.search) {
      sql += ` AND (title LIKE ? OR summary LIKE ?)`;
      const s = `%${filters.search}%`;
      params.push(s, s);
    }
    sql += ` ORDER BY title ASC`;
    const items = queryAll(sql, params).map((r) => ({
      ...r,
      step_count: queryOne(`SELECT COUNT(*) as c FROM roadmap_steps WHERE roadmap_id = ?`, [r.id]).c,
    }));
    return { total: items.length, items };
  },

  publish(id) {
    const now = new Date().toISOString();
    run(`UPDATE roadmaps SET publication_status = 'published', updated_at = ? WHERE id = ?`, [now, id]);
    return this.get(id);
  },
};

module.exports = { RoadmapService };