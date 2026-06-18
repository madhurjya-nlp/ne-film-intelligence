const { run, queryOne, queryAll, transaction } = require('../db/db');

function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

const RELATIONSHIP_TYPES = [
  'offers', 'funds', 'hosts', 'located_in', 'requires', 'leads_to', 'partners_with', 'administers',
];

const RelationshipService = {
  create(data) {
    const id = 'rel_' + generateId();
    const now = new Date().toISOString();
    run(
      `INSERT OR IGNORE INTO entity_relationships (id, from_type, from_id, to_type, to_id, relationship_type, weight, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, data.from_type, data.from_id, data.to_type, data.to_id,
        data.relationship_type, data.weight ?? 1.0, data.notes || null, now,
      ]
    );
    return queryOne(
      `SELECT * FROM entity_relationships WHERE from_type=? AND from_id=? AND to_type=? AND to_id=? AND relationship_type=?`,
      [data.from_type, data.from_id, data.to_type, data.to_id, data.relationship_type]
    );
  },

  getGraph(rootType = null, rootId = null, depth = 2) {
    if (!rootType || !rootId) {
      return this.getFullGraph();
    }
    return this.traverse(rootType, rootId, depth);
  },

  getFullGraph(limit = 100) {
    const edges = queryAll(
      `SELECT * FROM entity_relationships ORDER BY created_at DESC LIMIT ?`,
      [limit]
    );
    const nodeMap = new Map();

    for (const edge of edges) {
      this._addNode(nodeMap, edge.from_type, edge.from_id);
      this._addNode(nodeMap, edge.to_type, edge.to_id);
    }

    return {
      nodes: Array.from(nodeMap.values()),
      edges,
      total_edges: edges.length,
    };
  },

  traverse(rootType, rootId, depth = 2) {
    const visited = new Set();
    const edges = [];
    const queue = [{ type: rootType, id: rootId, d: 0 }];

    while (queue.length) {
      const { type, id, d } = queue.shift();
      const key = `${type}:${id}`;
      if (visited.has(key) || d > depth) continue;
      visited.add(key);

      const outgoing = queryAll(
        `SELECT * FROM entity_relationships WHERE from_type = ? AND from_id = ?`,
        [type, id]
      );
      const incoming = queryAll(
        `SELECT * FROM entity_relationships WHERE to_type = ? AND to_id = ?`,
        [type, id]
      );

      for (const e of [...outgoing, ...incoming]) {
        if (!edges.find((x) => x.id === e.id)) edges.push(e);
        if (d < depth) {
          queue.push({ type: e.to_type, id: e.to_id, d: d + 1 });
          queue.push({ type: e.from_type, id: e.from_id, d: d + 1 });
        }
      }
    }

    const nodeMap = new Map();
    for (const edge of edges) {
      this._addNode(nodeMap, edge.from_type, edge.from_id);
      this._addNode(nodeMap, edge.to_type, edge.to_id);
    }

    return { root: { type: rootType, id: rootId }, nodes: Array.from(nodeMap.values()), edges };
  },

  _addNode(nodeMap, type, id) {
    const key = `${type}:${id}`;
    if (nodeMap.has(key)) return;
    const label = this._resolveLabel(type, id);
    nodeMap.set(key, { type, id, label, key });
  },

  _resolveLabel(type, id) {
    const labelQueries = {
      country: `SELECT name as label FROM countries WHERE id = ?`,
      institute: `SELECT title as label FROM institutes WHERE id = ?`,
      program: `SELECT title as label FROM programs WHERE id = ?`,
      opportunity: `SELECT title as label FROM opportunities WHERE id = ?`,
      event: `SELECT title as label FROM events WHERE id = ?`,
      source: `SELECT name as label FROM sources WHERE id = ?`,
      roadmap: `SELECT title as label FROM roadmaps WHERE id = ?`,
    };
    const sql = labelQueries[type];
    if (!sql) return id;
    const row = queryOne(sql, [id]);
    return row?.label || id;
  },

  linkOpportunityToCountry(opportunityId, countryId, notes) {
    return this.create({
      from_type: 'opportunity', from_id: opportunityId,
      to_type: 'country', to_id: countryId,
      relationship_type: 'located_in', notes,
    });
  },

  autoLinkFromEntities() {
    let linked = 0;
    return transaction(() => {
      const countries = queryAll(`SELECT id, name FROM countries`);
      const countryMap = new Map(countries.map((c) => [c.name.toLowerCase(), c.id]));

      for (const table of ['programs', 'opportunities', 'events']) {
        const type = table.slice(0, -1) === 'opportunitie' ? 'opportunity' : table.slice(0, -1);
        const entityType = table === 'programs' ? 'program' : table === 'opportunities' ? 'opportunity' : 'event';
        const rows = queryAll(`SELECT id, country, title FROM ${table}`);
        for (const row of rows) {
          const cId = countryMap.get((row.country || '').toLowerCase());
          if (cId) {
            this.create({
              from_type: entityType, from_id: row.id,
              to_type: 'country', to_id: cId,
              relationship_type: 'located_in',
              notes: `Auto-linked from ${row.country}`,
            });
            linked++;
          }
        }
      }

      // Institute → Program
      const progs = queryAll(`SELECT id, institute_id, title FROM programs`);
      for (const p of progs) {
        if (p.institute_id) {
          this.create({
            from_type: 'institute', from_id: p.institute_id,
            to_type: 'program', to_id: p.id,
            relationship_type: 'offers',
          });
          linked++;
        }
      }

      // Source → entities via source_id
      for (const { table, type } of [
        { table: 'programs', type: 'program' },
        { table: 'opportunities', type: 'opportunity' },
        { table: 'events', type: 'event' },
      ]) {
        const rows = queryAll(`SELECT id, source_id FROM ${table} WHERE source_id IS NOT NULL`);
        for (const r of rows) {
          this.create({
            from_type: 'source', from_id: r.source_id,
            to_type: type, to_id: r.id,
            relationship_type: 'administers',
          });
          linked++;
        }
      }

      return { linked };
    });
  },

  list(filters = {}, limit = 100) {
    let sql = `SELECT * FROM entity_relationships WHERE 1=1`;
    const params = [];
    if (filters.from_type) { sql += ` AND from_type = ?`; params.push(filters.from_type); }
    if (filters.to_type) { sql += ` AND to_type = ?`; params.push(filters.to_type); }
    if (filters.relationship_type) { sql += ` AND relationship_type = ?`; params.push(filters.relationship_type); }
    sql += ` ORDER BY created_at DESC LIMIT ?`;
    return queryAll(sql, [...params, limit]);
  },

  getTypes() {
    return RELATIONSHIP_TYPES;
  },
};

module.exports = { RelationshipService, RELATIONSHIP_TYPES };