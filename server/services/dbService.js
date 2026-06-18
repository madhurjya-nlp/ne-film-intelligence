const { run, queryOne, queryAll, transaction } = require('../db/db');

// Helper to generate UUID-like IDs
function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Helper to generate a slug
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

// Generate unique slug in database table
function getUniqueSlug(table, title, excludeId = null) {
  const baseSlug = slugify(title) || 'untitled';
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    const row = excludeId
      ? queryOne(`SELECT id FROM ${table} WHERE slug = ? AND id != ?`, [slug, excludeId])
      : queryOne(`SELECT id FROM ${table} WHERE slug = ?`, [slug]);
      
    if (!row) return slug;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

// Deduplication Helper: checks for exact slug OR (title + website_url) match
function findDuplicate(table, title, websiteUrl, excludeId = null) {
  if (websiteUrl) {
    const row = excludeId
      ? queryOne(`SELECT id, title, verification_status, publication_status FROM ${table} WHERE (title = ? OR website_url = ?) AND id != ?`, [title, websiteUrl, excludeId])
      : queryOne(`SELECT id, title, verification_status, publication_status FROM ${table} WHERE title = ? OR website_url = ?`, [title, websiteUrl]);
    if (row) return row;
  } else {
    const row = excludeId
      ? queryOne(`SELECT id, title, verification_status, publication_status FROM ${table} WHERE title = ? AND id != ?`, [title, excludeId])
      : queryOne(`SELECT id, title, verification_status, publication_status FROM ${table} WHERE title = ?`, [title]);
    if (row) return row;
  }
  return null;
}

// ── INSTITUTES SERVICE ──
const InstituteService = {
  create(data) {
    return transaction(() => {
      const id = data.id || 'inst_' + generateId();
      const slug = getUniqueSlug('institutes', data.title);
      
      // Check for duplicate
      const duplicate = findDuplicate('institutes', data.title, data.website_url);
      const verificationStatus = duplicate ? 'needs_review' : (data.verification_status || 'pending');
      const duplicateOfId = duplicate ? duplicate.id : null;

      run(
        `INSERT INTO institutes (
          id, slug, title, country, region, city, website_url, summary, description, 
          verification_status, publication_status, confidence_score, duplicate_of_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          slug,
          data.title,
          data.country,
          data.region,
          data.city || null,
          data.website_url || null,
          data.summary,
          data.description || null,
          verificationStatus,
          data.publication_status || 'draft',
          data.confidence_score || (duplicate ? 0.5 : 1.0),
          duplicateOfId,
          new Date().toISOString(),
          new Date().toISOString()
        ]
      );
      
      return this.get(id);
    });
  },

  get(id) {
    return queryOne(`SELECT * FROM institutes WHERE id = ?`, [id]);
  },

  update(id, data) {
    return transaction(() => {
      const current = this.get(id);
      if (!current) throw new Error(`Institute ${id} not found`);

      const slug = data.title && data.title !== current.title 
        ? getUniqueSlug('institutes', data.title, id)
        : current.slug;

      run(
        `UPDATE institutes SET 
          slug = ?, title = ?, country = ?, region = ?, city = ?, website_url = ?, 
          summary = ?, description = ?, verification_status = ?, publication_status = ?, 
          confidence_score = ?, duplicate_of_id = ?, updated_at = ?
         WHERE id = ?`,
        [
          slug,
          data.title || current.title,
          data.country || current.country,
          data.region || current.region,
          data.city !== undefined ? data.city : current.city,
          data.website_url !== undefined ? data.website_url : current.website_url,
          data.summary || current.summary,
          data.description !== undefined ? data.description : current.description,
          data.verification_status || current.verification_status,
          data.publication_status || current.publication_status,
          data.confidence_score !== undefined ? data.confidence_score : current.confidence_score,
          data.duplicate_of_id !== undefined ? data.duplicate_of_id : current.duplicate_of_id,
          new Date().toISOString(),
          id
        ]
      );
      return this.get(id);
    });
  },

  list(filters = {}, limit = 50, offset = 0) {
    let sql = `SELECT * FROM institutes WHERE 1=1`;
    const params = [];

    if (filters.search) {
      sql += ` AND (title LIKE ? OR summary LIKE ? OR description LIKE ?)`;
      const s = `%${filters.search}%`;
      params.push(s, s, s);
    }
    if (filters.region) {
      sql += ` AND region = ?`;
      params.push(filters.region);
    }
    if (filters.country) {
      sql += ` AND country = ?`;
      params.push(filters.country);
    }
    if (filters.verification_status) {
      sql += ` AND verification_status = ?`;
      params.push(filters.verification_status);
    }
    if (filters.publication_status) {
      sql += ` AND publication_status = ?`;
      params.push(filters.publication_status);
    }

    const countSql = `SELECT COUNT(*) as count FROM (${sql})`;
    const total = queryOne(countSql, params).count;

    sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    const items = queryAll(sql, [...params, limit, offset]);

    return { total, items };
  },

  delete(id) {
    return run(`DELETE FROM institutes WHERE id = ?`, [id]);
  }
};

// ── PROGRAMS SERVICE ──
const ProgramService = {
  create(data) {
    return transaction(() => {
      const id = data.id || 'prog_' + generateId();
      const slug = getUniqueSlug('programs', data.title);
      
      const duplicate = findDuplicate('programs', data.title, data.website_url);
      const verificationStatus = duplicate ? 'needs_review' : (data.verification_status || 'pending');
      const duplicateOfId = duplicate ? duplicate.id : null;

      run(
        `INSERT INTO programs (
          id, slug, title, institute_id, category, subcategory, country, region, city, 
          remote_or_online, format, summary, description, eligibility, tuition_or_cost, 
          duration, deadline, application_url, website_url, source_id, 
          verification_status, publication_status, confidence_score, duplicate_of_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          slug,
          data.title,
          data.institute_id,
          data.category,
          data.subcategory || null,
          data.country,
          data.region,
          data.city || null,
          data.remote_or_online || 0,
          data.format || 'offline',
          data.summary,
          data.description || null,
          data.eligibility || null,
          data.tuition_or_cost || null,
          data.duration || null,
          data.deadline || null,
          data.application_url || null,
          data.website_url || null,
          data.source_id || null,
          verificationStatus,
          data.publication_status || 'draft',
          data.confidence_score || (duplicate ? 0.5 : 1.0),
          duplicateOfId,
          new Date().toISOString(),
          new Date().toISOString()
        ]
      );

      // Handle tags
      if (data.tags && Array.isArray(data.tags)) {
        associateTags('program', id, data.tags);
      }

      return this.get(id);
    });
  },

  get(id) {
    const prog = queryOne(`SELECT p.*, i.title as institute_title FROM programs p JOIN institutes i ON p.institute_id = i.id WHERE p.id = ?`, [id]);
    if (prog) {
      prog.tags = queryAll(`SELECT t.name FROM tags t JOIN entity_tags et ON t.id = et.tag_id WHERE et.entity_type = 'program' AND et.entity_id = ?`, [id]).map(row => row.name);
    }
    return prog;
  },

  update(id, data) {
    return transaction(() => {
      const current = this.get(id);
      if (!current) throw new Error(`Program ${id} not found`);

      const slug = data.title && data.title !== current.title 
        ? getUniqueSlug('programs', data.title, id)
        : current.slug;

      run(
        `UPDATE programs SET 
          slug = ?, title = ?, institute_id = ?, category = ?, subcategory = ?, country = ?, region = ?, 
          city = ?, remote_or_online = ?, format = ?, summary = ?, description = ?, eligibility = ?, 
          tuition_or_cost = ?, duration = ?, deadline = ?, application_url = ?, website_url = ?, 
          source_id = ?, verification_status = ?, publication_status = ?, confidence_score = ?, 
          duplicate_of_id = ?, updated_at = ?
         WHERE id = ?`,
        [
          slug,
          data.title || current.title,
          data.institute_id || current.institute_id,
          data.category || current.category,
          data.subcategory !== undefined ? data.subcategory : current.subcategory,
          data.country || current.country,
          data.region || current.region,
          data.city !== undefined ? data.city : current.city,
          data.remote_or_online !== undefined ? data.remote_or_online : current.remote_or_online,
          data.format || current.format,
          data.summary || current.summary,
          data.description !== undefined ? data.description : current.description,
          data.eligibility !== undefined ? data.eligibility : current.eligibility,
          data.tuition_or_cost !== undefined ? data.tuition_or_cost : current.tuition_or_cost,
          data.duration !== undefined ? data.duration : current.duration,
          data.deadline !== undefined ? data.deadline : current.deadline,
          data.application_url !== undefined ? data.application_url : current.application_url,
          data.website_url !== undefined ? data.website_url : current.website_url,
          data.source_id !== undefined ? data.source_id : current.source_id,
          data.verification_status || current.verification_status,
          data.publication_status || current.publication_status,
          data.confidence_score !== undefined ? data.confidence_score : current.confidence_score,
          data.duplicate_of_id !== undefined ? data.duplicate_of_id : current.duplicate_of_id,
          new Date().toISOString(),
          id
        ]
      );

      if (data.tags && Array.isArray(data.tags)) {
        run(`DELETE FROM entity_tags WHERE entity_type = 'program' AND entity_id = ?`, [id]);
        associateTags('program', id, data.tags);
      }

      return this.get(id);
    });
  },

  list(filters = {}, limit = 50, offset = 0) {
    let sql = `SELECT p.*, i.title as institute_title FROM programs p JOIN institutes i ON p.institute_id = i.id WHERE 1=1`;
    const params = [];

    if (filters.search) {
      sql += ` AND (p.title LIKE ? OR p.summary LIKE ? OR p.description LIKE ? OR i.title LIKE ?)`;
      const s = `%${filters.search}%`;
      params.push(s, s, s, s);
    }
    if (filters.category) {
      sql += ` AND p.category = ?`;
      params.push(filters.category);
    }
    if (filters.region) {
      sql += ` AND p.region = ?`;
      params.push(filters.region);
    }
    if (filters.country) {
      sql += ` AND p.country = ?`;
      params.push(filters.country);
    }
    if (filters.format) {
      sql += ` AND p.format = ?`;
      params.push(filters.format);
    }
    if (filters.verification_status) {
      sql += ` AND p.verification_status = ?`;
      params.push(filters.verification_status);
    }
    if (filters.publication_status) {
      sql += ` AND p.publication_status = ?`;
      params.push(filters.publication_status);
    }
    if (filters.remote_or_online !== undefined) {
      sql += ` AND p.remote_or_online = ?`;
      params.push(Number(filters.remote_or_online));
    }

    const countSql = `SELECT COUNT(*) as count FROM (${sql})`;
    const total = queryOne(countSql, params).count;

    sql += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
    const items = queryAll(sql, [...params, limit, offset]);

    // Populate tags for each item
    items.forEach(item => {
      item.tags = queryAll(
        `SELECT t.name FROM tags t JOIN entity_tags et ON t.id = et.tag_id WHERE et.entity_type = 'program' AND et.entity_id = ?`, 
        [item.id]
      ).map(row => row.name);
    });

    return { total, items };
  },

  delete(id) {
    return run(`DELETE FROM programs WHERE id = ?`, [id]);
  }
};

// ── OPPORTUNITIES SERVICE ──
const OpportunityService = {
  create(data) {
    return transaction(() => {
      const id = data.id || 'opp_' + generateId();
      const slug = getUniqueSlug('opportunities', data.title);
      
      const duplicate = findDuplicate('opportunities', data.title, data.website_url);
      const verificationStatus = duplicate ? 'needs_review' : (data.verification_status || 'pending');
      const duplicateOfId = duplicate ? duplicate.id : null;

      run(
        `INSERT INTO opportunities (
          id, slug, title, type, subcategory, org, amount, country, region, city, 
          remote_or_online, format, summary, description, eligibility, funding_info, 
          duration, deadline, application_url, website_url, source_id, 
          verification_status, publication_status, confidence_score, duplicate_of_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          slug,
          data.title,
          data.type,
          data.subcategory || null,
          data.org,
          data.amount || null,
          data.country,
          data.region,
          data.city || null,
          data.remote_or_online || 0,
          data.format || 'offline',
          data.summary,
          data.description || null,
          data.eligibility || null,
          data.funding_info || null,
          data.duration || null,
          data.deadline || null,
          data.application_url || null,
          data.website_url || null,
          data.source_id || null,
          verificationStatus,
          data.publication_status || 'draft',
          data.confidence_score || (duplicate ? 0.5 : 1.0),
          duplicateOfId,
          new Date().toISOString(),
          new Date().toISOString()
        ]
      );

      if (data.tags && Array.isArray(data.tags)) {
        associateTags('opportunity', id, data.tags);
      }

      return this.get(id);
    });
  },

  get(id) {
    const opp = queryOne(`SELECT * FROM opportunities WHERE id = ?`, [id]);
    if (opp) {
      opp.tags = queryAll(`SELECT t.name FROM tags t JOIN entity_tags et ON t.id = et.tag_id WHERE et.entity_type = 'opportunity' AND et.entity_id = ?`, [id]).map(row => row.name);
    }
    return opp;
  },

  update(id, data) {
    return transaction(() => {
      const current = this.get(id);
      if (!current) throw new Error(`Opportunity ${id} not found`);

      const slug = data.title && data.title !== current.title 
        ? getUniqueSlug('opportunities', data.title, id)
        : current.slug;

      run(
        `UPDATE opportunities SET 
          slug = ?, title = ?, type = ?, subcategory = ?, org = ?, amount = ?, country = ?, region = ?, 
          city = ?, remote_or_online = ?, format = ?, summary = ?, description = ?, eligibility = ?, 
          funding_info = ?, duration = ?, deadline = ?, application_url = ?, website_url = ?, 
          source_id = ?, verification_status = ?, publication_status = ?, confidence_score = ?, 
          duplicate_of_id = ?, updated_at = ?
         WHERE id = ?`,
        [
          slug,
          data.title || current.title,
          data.type || current.type,
          data.subcategory !== undefined ? data.subcategory : current.subcategory,
          data.org || current.org,
          data.amount !== undefined ? data.amount : current.amount,
          data.country || current.country,
          data.region || current.region,
          data.city !== undefined ? data.city : current.city,
          data.remote_or_online !== undefined ? data.remote_or_online : current.remote_or_online,
          data.format || current.format,
          data.summary || current.summary,
          data.description !== undefined ? data.description : current.description,
          data.eligibility !== undefined ? data.eligibility : current.eligibility,
          data.funding_info !== undefined ? data.funding_info : current.funding_info,
          data.duration !== undefined ? data.duration : current.duration,
          data.deadline !== undefined ? data.deadline : current.deadline,
          data.application_url !== undefined ? data.application_url : current.application_url,
          data.website_url !== undefined ? data.website_url : current.website_url,
          data.source_id !== undefined ? data.source_id : current.source_id,
          data.verification_status || current.verification_status,
          data.publication_status || current.publication_status,
          data.confidence_score !== undefined ? data.confidence_score : current.confidence_score,
          data.duplicate_of_id !== undefined ? data.duplicate_of_id : current.duplicate_of_id,
          new Date().toISOString(),
          id
        ]
      );

      if (data.tags && Array.isArray(data.tags)) {
        run(`DELETE FROM entity_tags WHERE entity_type = 'opportunity' AND entity_id = ?`, [id]);
        associateTags('opportunity', id, data.tags);
      }

      return this.get(id);
    });
  },

  list(filters = {}, limit = 50, offset = 0) {
    let sql = `SELECT * FROM opportunities WHERE 1=1`;
    const params = [];

    if (filters.search) {
      sql += ` AND (title LIKE ? OR org LIKE ? OR summary LIKE ? OR description LIKE ?)`;
      const s = `%${filters.search}%`;
      params.push(s, s, s, s);
    }
    if (filters.type) {
      sql += ` AND type = ?`;
      params.push(filters.type);
    }
    if (filters.region) {
      sql += ` AND region = ?`;
      params.push(filters.region);
    }
    if (filters.country) {
      sql += ` AND country = ?`;
      params.push(filters.country);
    }
    if (filters.format) {
      sql += ` AND format = ?`;
      params.push(filters.format);
    }
    if (filters.verification_status) {
      sql += ` AND verification_status = ?`;
      params.push(filters.verification_status);
    }
    if (filters.publication_status) {
      sql += ` AND publication_status = ?`;
      params.push(filters.publication_status);
    }

    const countSql = `SELECT COUNT(*) as count FROM (${sql})`;
    const total = queryOne(countSql, params).count;

    sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    const items = queryAll(sql, [...params, limit, offset]);

    items.forEach(item => {
      item.tags = queryAll(
        `SELECT t.name FROM tags t JOIN entity_tags et ON t.id = et.tag_id WHERE et.entity_type = 'opportunity' AND et.entity_id = ?`, 
        [item.id]
      ).map(row => row.name);
    });

    return { total, items };
  },

  delete(id) {
    return run(`DELETE FROM opportunities WHERE id = ?`, [id]);
  }
};

// ── EVENTS SERVICE ──
const EventService = {
  create(data) {
    return transaction(() => {
      const id = data.id || 'ev_' + generateId();
      const slug = getUniqueSlug('events', data.title);
      
      const duplicate = findDuplicate('events', data.title, data.website_url);
      const verificationStatus = duplicate ? 'needs_review' : (data.verification_status || 'pending');
      const duplicateOfId = duplicate ? duplicate.id : null;

      run(
        `INSERT INTO events (
          id, slug, title, type, subcategory, country, region, city, 
          remote_or_online, format, summary, description, eligibility, 
          duration, deadline, application_url, website_url, source_id, 
          verification_status, publication_status, confidence_score, duplicate_of_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          slug,
          data.title,
          data.type,
          data.subcategory || null,
          data.country,
          data.region,
          data.city || null,
          data.remote_or_online || 0,
          data.format || 'offline',
          data.summary,
          data.description || null,
          data.eligibility || null,
          data.duration || null,
          data.deadline || null,
          data.application_url || null,
          data.website_url || null,
          data.source_id || null,
          verificationStatus,
          data.publication_status || 'draft',
          data.confidence_score || (duplicate ? 0.5 : 1.0),
          duplicateOfId,
          new Date().toISOString(),
          new Date().toISOString()
        ]
      );

      if (data.tags && Array.isArray(data.tags)) {
        associateTags('event', id, data.tags);
      }

      return this.get(id);
    });
  },

  get(id) {
    const ev = queryOne(`SELECT * FROM events WHERE id = ?`, [id]);
    if (ev) {
      ev.tags = queryAll(`SELECT t.name FROM tags t JOIN entity_tags et ON t.id = et.tag_id WHERE et.entity_type = 'event' AND et.entity_id = ?`, [id]).map(row => row.name);
    }
    return ev;
  },

  update(id, data) {
    return transaction(() => {
      const current = this.get(id);
      if (!current) throw new Error(`Event ${id} not found`);

      const slug = data.title && data.title !== current.title 
        ? getUniqueSlug('events', data.title, id)
        : current.slug;

      run(
        `UPDATE events SET 
          slug = ?, title = ?, type = ?, subcategory = ?, country = ?, region = ?, 
          city = ?, remote_or_online = ?, format = ?, summary = ?, description = ?, eligibility = ?, 
          duration = ?, deadline = ?, application_url = ?, website_url = ?, 
          source_id = ?, verification_status = ?, publication_status = ?, confidence_score = ?, 
          duplicate_of_id = ?, updated_at = ?
         WHERE id = ?`,
        [
          slug,
          data.title || current.title,
          data.type || current.type,
          data.subcategory !== undefined ? data.subcategory : current.subcategory,
          data.country || current.country,
          data.region || current.region,
          data.city !== undefined ? data.city : current.city,
          data.remote_or_online !== undefined ? data.remote_or_online : current.remote_or_online,
          data.format || current.format,
          data.summary || current.summary,
          data.description !== undefined ? data.description : current.description,
          data.eligibility !== undefined ? data.eligibility : current.eligibility,
          data.duration !== undefined ? data.duration : current.duration,
          data.deadline !== undefined ? data.deadline : current.deadline,
          data.application_url !== undefined ? data.application_url : current.application_url,
          data.website_url !== undefined ? data.website_url : current.website_url,
          data.source_id !== undefined ? data.source_id : current.source_id,
          data.verification_status || current.verification_status,
          data.publication_status || current.publication_status,
          data.confidence_score !== undefined ? data.confidence_score : current.confidence_score,
          data.duplicate_of_id !== undefined ? data.duplicate_of_id : current.duplicate_of_id,
          new Date().toISOString(),
          id
        ]
      );

      if (data.tags && Array.isArray(data.tags)) {
        run(`DELETE FROM entity_tags WHERE entity_type = 'event' AND entity_id = ?`, [id]);
        associateTags('event', id, data.tags);
      }

      return this.get(id);
    });
  },

  list(filters = {}, limit = 50, offset = 0) {
    let sql = `SELECT * FROM events WHERE 1=1`;
    const params = [];

    if (filters.search) {
      sql += ` AND (title LIKE ? OR summary LIKE ? OR description LIKE ?)`;
      const s = `%${filters.search}%`;
      params.push(s, s, s);
    }
    if (filters.type) {
      sql += ` AND type = ?`;
      params.push(filters.type);
    }
    if (filters.region) {
      sql += ` AND region = ?`;
      params.push(filters.region);
    }
    if (filters.country) {
      sql += ` AND country = ?`;
      params.push(filters.country);
    }
    if (filters.format) {
      sql += ` AND format = ?`;
      params.push(filters.format);
    }
    if (filters.verification_status) {
      sql += ` AND verification_status = ?`;
      params.push(filters.verification_status);
    }
    if (filters.publication_status) {
      sql += ` AND publication_status = ?`;
      params.push(filters.publication_status);
    }

    const countSql = `SELECT COUNT(*) as count FROM (${sql})`;
    const total = queryOne(countSql, params).count;

    sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    const items = queryAll(sql, [...params, limit, offset]);

    items.forEach(item => {
      item.tags = queryAll(
        `SELECT t.name FROM tags t JOIN entity_tags et ON t.id = et.tag_id WHERE et.entity_type = 'event' AND et.entity_id = ?`, 
        [item.id]
      ).map(row => row.name);
    });

    return { total, items };
  },

  delete(id) {
    return run(`DELETE FROM events WHERE id = ?`, [id]);
  }
};

// Helper: inserts a tag relation in standard way
function associateTags(entityType, entityId, tags) {
  if (!tags || !Array.isArray(tags)) return;
  for (const tagName of tags) {
    const cleanTagName = tagName.trim().toLowerCase();
    if (!cleanTagName) continue;
    const tagId = 'tag_' + slugify(cleanTagName);
    run(`INSERT OR IGNORE INTO tags (id, name) VALUES (?, ?)`, [tagId, cleanTagName]);
    run(
      `INSERT OR IGNORE INTO entity_tags (entity_type, entity_id, tag_id) VALUES (?, ?, ?)`,
      [entityType, entityId, tagId]
    );
  }
}

// ── SOURCES SERVICE ──
const SourceService = {
  create(data) {
    const id = data.id || 'src_' + generateId();
    run(
      `INSERT INTO sources (id, name, type, url, last_checked_at, discovered_at, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.name,
        data.type,
        data.url || null,
        new Date().toISOString(),
        new Date().toISOString(),
        new Date().toISOString(),
        new Date().toISOString()
      ]
    );
    return this.get(id);
  },

  get(id) {
    return queryOne(`SELECT * FROM sources WHERE id = ?`, [id]);
  },

  list() {
    return queryAll(`SELECT * FROM sources ORDER BY name ASC`);
  }
};

// ── SUBMISSIONS SERVICE ──
const SubmissionService = {
  create(data) {
    const id = 'sub_' + generateId();
    run(
      `INSERT INTO submissions (id, submitter_name, submitter_email, data_type, payload, notes, status, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.submitter_name || null,
        data.submitter_email || null,
        data.data_type,
        JSON.stringify(data.payload),
        data.notes || null,
        'pending',
        new Date().toISOString(),
        new Date().toISOString()
      ]
    );
    return this.get(id);
  },

  get(id) {
    const row = queryOne(`SELECT * FROM submissions WHERE id = ?`, [id]);
    if (row && typeof row.payload === 'string') {
      row.payload = JSON.parse(row.payload);
    }
    return row;
  },

  updateStatus(id, status) {
    run(
      `UPDATE submissions SET status = ?, updated_at = ? WHERE id = ?`,
      [status, new Date().toISOString(), id]
    );
    return this.get(id);
  },

  list(status = null) {
    let sql = `SELECT * FROM submissions`;
    const params = [];
    if (status) {
      sql += ` WHERE status = ?`;
      params.push(status);
    }
    sql += ` ORDER BY created_at DESC`;
    const items = queryAll(sql, params);
    items.forEach(item => {
      if (typeof item.payload === 'string') {
        item.payload = JSON.parse(item.payload);
      }
    });
    return items;
  }
};

// ── MODERATION SERVICE ──
const ModerationService = {
  moderate(targetType, targetId, status, notes, reviewerName = 'System Moderator') {
    return transaction(() => {
      // 1. Update target record status
      let table;
      if (targetType === 'program') table = 'programs';
      else if (targetType === 'opportunity') table = 'opportunities';
      else if (targetType === 'event') table = 'events';
      else if (targetType === 'institute') table = 'institutes';
      else if (targetType === 'submission') {
        // Submissions moderate differently (they transition to approved or rejected)
        const subStatus = status === 'verified' ? 'approved' : 'rejected';
        SubmissionService.updateStatus(targetId, subStatus);
        
        // If approved, create the actual record!
        if (subStatus === 'approved') {
          const submission = SubmissionService.get(targetId);
          if (submission) {
            const payload = submission.payload;
            payload.verification_status = 'verified';
            payload.publication_status = 'published';
            if (submission.data_type === 'program') ProgramService.create(payload);
            else if (submission.data_type === 'opportunity') OpportunityService.create(payload);
            else if (submission.data_type === 'event') EventService.create(payload);
            else if (submission.data_type === 'institute') InstituteService.create(payload);
          }
        }
        
        // Insert into log
        const logId = 'mod_' + generateId();
        run(
          `INSERT INTO review_queue (id, target_type, target_id, status, reviewer_notes, updated_by, updated_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [logId, targetType, targetId, status, notes, reviewerName, new Date().toISOString()]
        );
        return { success: true, submissionStatus: subStatus };
      } else {
        throw new Error(`Invalid target type: ${targetType}`);
      }

      run(
        `UPDATE ${table} SET verification_status = ?, updated_at = ? WHERE id = ?`,
        [status, new Date().toISOString(), targetId]
      );

      // If verified, mark publication status as published by default if draft
      if (status === 'verified') {
        run(
          `UPDATE ${table} SET publication_status = 'published', updated_at = ? WHERE id = ? AND publication_status = 'draft'`,
          [new Date().toISOString(), targetId]
        );
      }

      // 2. Add log entry into review queue
      const logId = 'mod_' + generateId();
      run(
        `INSERT INTO review_queue (id, target_type, target_id, status, reviewer_notes, updated_by, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [logId, targetType, targetId, status, notes, reviewerName, new Date().toISOString()]
      );

      return { success: true };
    });
  },

  getReviewQueue(targetType = null, targetId = null) {
    let sql = `SELECT * FROM review_queue`;
    const params = [];
    if (targetType && targetId) {
      sql += ` WHERE target_type = ? AND target_id = ?`;
      params.push(targetType, targetId);
    }
    sql += ` ORDER BY updated_at DESC`;
    return queryAll(sql, params);
  }
};

// ── BLOG SERVICE ──
const BlogService = {
  create(data) {
    return transaction(() => {
      const id = data.id || 'post_' + generateId();
      const slug = getUniqueSlug('blog_posts', data.title);
      
      const words = (data.content || '').split(/\s+/).filter(Boolean).length;
      const readingTime = data.reading_time || Math.max(1, Math.round(words / 200));

      const now = new Date().toISOString();
      const status = data.status || 'draft';
      const publishedAt = status === 'published' ? (data.published_at || now) : null;

      run(
        `INSERT INTO blog_posts (
          id, title, slug, excerpt, content, cover_image, author, status, 
          published_at, created_at, updated_at, reading_time, featured
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          data.title,
          slug,
          data.excerpt || null,
          data.content,
          data.cover_image || null,
          data.author || 'Admin',
          status,
          publishedAt,
          now,
          now,
          readingTime,
          data.featured !== undefined ? (data.featured ? 1 : 0) : 0
        ]
      );

      return this.get(id);
    });
  },

  get(id) {
    return queryOne(`SELECT * FROM blog_posts WHERE id = ?`, [id]);
  },

  getBySlug(slug) {
    return queryOne(`SELECT * FROM blog_posts WHERE slug = ?`, [slug]);
  },

  update(id, data) {
    return transaction(() => {
      const current = this.get(id);
      if (!current) throw new Error('Blog post not found');

      const title = data.title !== undefined ? data.title : current.title;
      const slug = data.title !== undefined ? getUniqueSlug('blog_posts', data.title, id) : current.slug;
      
      const content = data.content !== undefined ? data.content : current.content;
      let readingTime = current.reading_time;
      if (data.content !== undefined) {
        const words = content.split(/\s+/).filter(Boolean).length;
        readingTime = data.reading_time || Math.max(1, Math.round(words / 200));
      } else if (data.reading_time !== undefined) {
        readingTime = data.reading_time;
      }

      const status = data.status !== undefined ? data.status : current.status;
      let publishedAt = current.published_at;
      if (data.status !== undefined) {
        if (status === 'published' && !current.published_at) {
          publishedAt = data.published_at || new Date().toISOString();
        } else if (status !== 'published') {
          publishedAt = null;
        }
      }

      run(
        `UPDATE blog_posts SET 
          title = ?, slug = ?, excerpt = ?, content = ?, cover_image = ?, 
          author = ?, status = ?, published_at = ?, updated_at = ?, 
          reading_time = ?, featured = ?
         WHERE id = ?`,
        [
          title,
          slug,
          data.excerpt !== undefined ? data.excerpt : current.excerpt,
          content,
          data.cover_image !== undefined ? data.cover_image : current.cover_image,
          data.author !== undefined ? data.author : current.author,
          status,
          publishedAt,
          new Date().toISOString(),
          readingTime,
          data.featured !== undefined ? (data.featured ? 1 : 0) : current.featured,
          id
        ]
      );

      return this.get(id);
    });
  },

  delete(id) {
    return run(`DELETE FROM blog_posts WHERE id = ?`, [id]);
  },

  list(filters = {}, limit = 50, offset = 0) {
    let sql = `SELECT * FROM blog_posts`;
    const params = [];
    const conditions = [];

    if (filters.status) {
      conditions.push(`status = ?`);
      params.push(filters.status);
    }
    if (filters.featured !== undefined) {
      conditions.push(`featured = ?`);
      params.push(filters.featured ? 1 : 0);
    }
    if (filters.search) {
      conditions.push(`(title LIKE ? OR content LIKE ? OR excerpt LIKE ?)`);
      const term = `%${filters.search}%`;
      params.push(term, term, term);
    }

    if (conditions.length > 0) {
      sql += ` WHERE ` + conditions.join(` AND `);
    }

    sql += ` ORDER BY featured DESC, COALESCE(published_at, created_at) DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const items = queryAll(sql, params);

    let countSql = `SELECT COUNT(*) as total FROM blog_posts`;
    const countParams = params.slice(0, -2);
    if (conditions.length > 0) {
      countSql += ` WHERE ` + conditions.join(` AND `);
    }
    const totalRow = queryOne(countSql, countParams);
    const total = totalRow ? totalRow.total : 0;

    return { items, total };
  },

  getStats() {
    const draftCount = queryOne(`SELECT COUNT(*) as count FROM blog_posts WHERE status = 'draft'`).count;
    const publishedCount = queryOne(`SELECT COUNT(*) as count FROM blog_posts WHERE status = 'published'`).count;
    const archivedCount = queryOne(`SELECT COUNT(*) as count FROM blog_posts WHERE status = 'archived'`).count;
    const totalCount = queryOne(`SELECT COUNT(*) as count FROM blog_posts`).count;

    return {
      draft: draftCount,
      published: publishedCount,
      archived: archivedCount,
      total: totalCount
    };
  }
};

// ── NEWSLETTER SERVICE ──
const NewsletterService = {
  subscribe(email) {
    return transaction(() => {
      const existing = queryOne(`SELECT id, email, created_at FROM newsletter_subscribers WHERE email = ?`, [email.toLowerCase().trim()]);
      if (existing) return existing;

      const id = 'sub_' + generateId();
      const now = new Date().toISOString();
      run(
        `INSERT INTO newsletter_subscribers (id, email, created_at) VALUES (?, ?, ?)`,
        [id, email.toLowerCase().trim(), now]
      );
      return { id, email: email.toLowerCase().trim(), created_at: now };
    });
  },

  list(limit = 50, offset = 0) {
    const items = queryAll(`SELECT * FROM newsletter_subscribers ORDER BY created_at DESC LIMIT ? OFFSET ?`, [limit, offset]);
    const totalRow = queryOne(`SELECT COUNT(*) as total FROM newsletter_subscribers`);
    const total = totalRow ? totalRow.total : 0;
    return { items, total };
  },

  unsubscribe(email) {
    return run(`DELETE FROM newsletter_subscribers WHERE email = ?`, [email.toLowerCase().trim()]);
  }
};

module.exports = {
  InstituteService,
  ProgramService,
  OpportunityService,
  EventService,
  SourceService,
  SubmissionService,
  ModerationService,
  BlogService,
  NewsletterService
};

