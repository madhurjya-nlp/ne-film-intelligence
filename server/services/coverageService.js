const { queryOne, queryAll, run, transaction } = require('../db/db');

function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

const CoverageService = {
  // ── SECTION B: COVERAGE INTELLIGENCE ──

  getCategoryMetrics(categoryId) {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

    // 1. Program Count
    const progRow = queryOne(`
      SELECT COUNT(DISTINCT id) as count FROM (
        SELECT id FROM programs WHERE category = ?
        UNION
        SELECT entity_id FROM entity_categories WHERE entity_type = 'program' AND category_id = ?
      )
    `, [categoryId, categoryId]);
    const programs = progRow ? progRow.count : 0;

    // 2. Opportunity Count
    const oppRow = queryOne(`
      SELECT COUNT(DISTINCT id) as count FROM (
        SELECT id FROM opportunities WHERE subcategory = ?
        UNION
        SELECT entity_id FROM entity_categories WHERE entity_type = 'opportunity' AND category_id = ?
      )
    `, [categoryId, categoryId]);
    const opportunities = oppRow ? oppRow.count : 0;

    // 3. Source Count
    const srcRow = queryOne(`
      SELECT COUNT(*) as count FROM sources WHERE category = ?
    `, [categoryId]);
    const sources = srcRow ? srcRow.count : 0;

    // 4. Roadmap Count
    const roadRow = queryOne(`
      SELECT COUNT(DISTINCT entity_id) as count FROM entity_categories 
      WHERE entity_type = 'roadmap' AND category_id = ?
    `, [categoryId]);
    const roadmaps = roadRow ? roadRow.count : 0;

    // 5. Recent Updates Count (entities updated in last 90 days)
    const progUpdates = queryOne(`
      SELECT COUNT(DISTINCT id) as count FROM (
        SELECT id FROM programs WHERE category = ? AND updated_at >= ?
        UNION
        SELECT entity_id FROM entity_categories ec 
        JOIN programs p ON ec.entity_id = p.id
        WHERE ec.entity_type = 'program' AND ec.category_id = ? AND p.updated_at >= ?
      )
    `, [categoryId, ninetyDaysAgo, categoryId, ninetyDaysAgo]).count;

    const oppUpdates = queryOne(`
      SELECT COUNT(DISTINCT id) as count FROM (
        SELECT id FROM opportunities WHERE subcategory = ? AND updated_at >= ?
        UNION
        SELECT entity_id FROM entity_categories ec 
        JOIN opportunities o ON ec.entity_id = o.id
        WHERE ec.entity_type = 'opportunity' AND ec.category_id = ? AND o.updated_at >= ?
      )
    `, [categoryId, ninetyDaysAgo, categoryId, ninetyDaysAgo]).count;

    const recentUpdates = progUpdates + oppUpdates;

    // 6. Coverage Score Formula: Programs + Opportunities + Sources + Recent Updates
    const score = programs + opportunities + sources + recentUpdates;

    // 7. Score Label
    let rating = 'Critical Gap';
    if (score >= 25) rating = 'Excellent';
    else if (score >= 15) rating = 'Good';
    else if (score >= 5) rating = 'Needs Expansion';

    // 8. Missing Category Check (B2)
    const isWeak = programs < 10 || opportunities < 5 || recentUpdates === 0;

    return {
      category_id: categoryId,
      programs,
      opportunities,
      sources,
      roadmaps,
      recentUpdates,
      score,
      rating,
      isWeak
    };
  },

  getCoverageDashboard() {
    const categories = queryAll(`SELECT * FROM category_taxonomy`);
    const metrics = categories.map(cat => {
      const catMetrics = this.getCategoryMetrics(cat.id);
      return {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        ...catMetrics
      };
    });

    // expansion priority list (flagged categories)
    const expansionPriority = metrics.filter(m => m.isWeak);

    // Country counts
    const progCountries = queryAll(`SELECT country, COUNT(*) as count FROM programs GROUP BY country`);
    const oppCountries = queryAll(`SELECT country, COUNT(*) as count FROM opportunities GROUP BY country`);
    const srcCountries = queryAll(`SELECT country, COUNT(*) as count FROM sources WHERE country IS NOT NULL GROUP BY country`);

    const countryCoverage = {};
    const addCountryCounts = (list, key) => {
      list.forEach(item => {
        if (!item.country) return;
        const c = item.country.trim();
        if (!countryCoverage[c]) {
          countryCoverage[c] = { country: c, programs: 0, opportunities: 0, sources: 0 };
        }
        countryCoverage[c][key] = item.count;
      });
    };
    addCountryCounts(progCountries, 'programs');
    addCountryCounts(oppCountries, 'opportunities');
    addCountryCounts(srcCountries, 'sources');

    const countriesCovered = Object.values(countryCoverage);
    const coveredNames = countriesCovered.map(c => c.country.toLowerCase());

    const PRIORITY_COUNTRIES = ['Germany', 'France', 'United Kingdom', 'Japan', 'South Korea', 'Canada', 'Australia'];
    const countriesMissing = PRIORITY_COUNTRIES.filter(c => !coveredNames.includes(c.toLowerCase()));

    // Sources by category
    const srcCategories = queryAll(`SELECT category, COUNT(*) as count FROM sources WHERE category IS NOT NULL GROUP BY category`);
    
    // Roadmaps by category
    const roadCategories = queryAll(`
      SELECT ec.category_id as category, COUNT(DISTINCT ec.entity_id) as count 
      FROM entity_categories ec 
      WHERE ec.entity_type = 'roadmap' 
      GROUP BY ec.category_id
    `);

    // Blog content gaps (Section G)
    const blogGaps = [];
    categories.forEach(cat => {
      const term = `%${cat.name}%`;
      const row = queryOne(`
        SELECT COUNT(*) as count FROM blog_posts 
        WHERE title LIKE ? OR excerpt LIKE ? OR content LIKE ?
      `, [term, term, term]);
      const count = row ? row.count : 0;
      if (count === 0) {
        blogGaps.push({
          id: cat.id,
          name: cat.name,
          alertLabel: `No ${cat.name} Guides`
        });
      }
    });

    return {
      categoryMetrics: metrics,
      expansionPriority,
      countriesCovered,
      countriesMissing,
      sourcesByCategory: srcCategories,
      roadmapsByCategory: roadCategories,
      blogGaps,
      generated_at: new Date().toISOString()
    };
  },

  // ── SECTION C: SOURCE HEALTH SYSTEM ──

  getSourceFreshness(source) {
    if (!source) return 'Needs Verification';
    
    const dateStr = source.last_checked_at || source.updated_at || source.created_at;
    if (!dateStr) return 'Needs Verification';

    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 30) return 'Fresh';
    if (diffDays < 90) return 'Aging';
    if (diffDays < 180) return 'Stale';
    return 'Needs Verification';
  },

  getSourceHealthMetrics(sourceId) {
    const source = queryOne(`SELECT * FROM sources WHERE id = ?`, [sourceId]);
    if (!source) return null;

    const freshness = this.getSourceFreshness(source);

    // Verification Rate
    const totalProg = queryOne(`SELECT COUNT(*) as count FROM programs WHERE source_id = ?`, [sourceId]).count;
    const verifiedProg = queryOne(`SELECT COUNT(*) as count FROM programs WHERE source_id = ? AND verification_status = 'verified'`, [sourceId]).count;
    const totalOpp = queryOne(`SELECT COUNT(*) as count FROM opportunities WHERE source_id = ?`, [sourceId]).count;
    const verifiedOpp = queryOne(`SELECT COUNT(*) as count FROM opportunities WHERE source_id = ? AND verification_status = 'verified'`, [sourceId]).count;
    const totalEv = queryOne(`SELECT COUNT(*) as count FROM events WHERE source_id = ?`, [sourceId]).count;
    const verifiedEv = queryOne(`SELECT COUNT(*) as count FROM events WHERE source_id = ? AND verification_status = 'verified'`, [sourceId]).count;

    const totalEntities = totalProg + totalOpp + totalEv;
    const verifiedEntities = verifiedProg + verifiedOpp + verifiedEv;
    const verificationRate = totalEntities > 0 ? Math.round((verifiedEntities / totalEntities) * 100) : 100;

    // Latest Link check
    const check = queryOne(`SELECT * FROM dead_link_checks WHERE source_id = ? ORDER BY checked_at DESC LIMIT 1`, [sourceId]);
    let deadLinkStatus = 'Healthy';
    if (check) {
      if (check.status_code === 404 || check.status_code >= 500 || check.status_code === 0 || check.status_code === null) {
        deadLinkStatus = 'Dead Link';
      }
    }

    return {
      source_id: sourceId,
      name: source.name,
      url: source.url,
      freshness,
      verificationRate,
      deadLinkStatus,
      lastCheckedAt: source.last_checked_at,
      lastCheckDetails: check || null
    };
  },

  getSourceHealthDashboard() {
    const sources = queryAll(`SELECT id FROM sources`);
    const dashboard = sources.map(s => this.getSourceHealthMetrics(s.id)).filter(Boolean);
    return dashboard;
  },

  logLinkCheck(sourceId, url, statusCode, responseTime) {
    const id = 'chk_' + generateId();
    const now = new Date().toISOString();
    run(
      `INSERT INTO dead_link_checks (id, source_id, url, status_code, response_time, checked_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, sourceId, url, statusCode, responseTime, now]
    );

    // Update the source registry check timestamp
    run(`UPDATE sources SET last_checked_at = ?, updated_at = ? WHERE id = ?`, [now, now, sourceId]);

    return { id, source_id: sourceId, url, status_code: statusCode, checked_at: now };
  },

  // ── SECTION D: CONTRIBUTOR PORTAL ──

  submitContributorRecord(data) {
    const id = 'subm_' + generateId();
    const now = new Date().toISOString();
    run(
      `INSERT INTO contributor_submissions (id, name, email, organization, submission_type, payload, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [
        id,
        data.name,
        data.email,
        data.organization || null,
        data.submission_type, // 'program', 'opportunity', 'event', 'book'
        JSON.stringify(data.payload),
        now
      ]
    );
    return { id, name: data.name, submission_type: data.submission_type, status: 'pending' };
  },

  listSubmissions(status = null) {
    let sql = `SELECT * FROM contributor_submissions`;
    const params = [];
    if (status) {
      sql += ` WHERE status = ?`;
      params.push(status);
    }
    sql += ` ORDER BY created_at DESC`;
    const items = queryAll(sql, params);
    return items.map(item => {
      try {
        item.payload = JSON.parse(item.payload);
      } catch {
        item.payload = {};
      }
      return item;
    });
  },

  moderateSubmission(submissionId, status, notes = '', reviewerName = 'System Reviewer') {
    return transaction(() => {
      const submission = queryOne(`SELECT * FROM contributor_submissions WHERE id = ?`, [submissionId]);
      if (!submission) throw new Error('Submission not found');
      if (submission.status !== 'pending') throw new Error('Submission already moderated');

      run(
        `UPDATE contributor_submissions SET status = ? WHERE id = ?`,
        [status, submissionId]
      );

      if (status === 'approved') {
        const payload = JSON.parse(submission.payload);
        const contributedBy = submission.name;

        if (submission.submission_type === 'program') {
          const progId = payload.id || 'prog_' + generateId();
          run(
            `INSERT INTO programs (id, slug, title, institute_id, category, subcategory, country, region, city, format, summary, description, eligibility, tuition_or_cost, duration, deadline, website_url, source_id, verification_status, publication_status, contributed_by, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 'verified', 'published', ?, ?, ?)`,
            [
              progId,
              payload.slug || progId,
              payload.title,
              payload.institute_id,
              payload.category || 'General',
              payload.subcategory || '',
              payload.country || 'Unknown',
              payload.region || 'asia',
              payload.city || '',
              payload.format || 'offline',
              payload.summary || '',
              payload.description || '',
              payload.eligibility || '',
              payload.tuition_or_cost || '',
              payload.duration || '',
              payload.deadline || null,
              payload.website_url || '',
              contributedBy,
              new Date().toISOString(),
              new Date().toISOString()
            ]
          );

          if (payload.category_id) {
            run(`INSERT OR IGNORE INTO entity_categories (entity_type, entity_id, category_id) VALUES ('program', ?, ?)`, [progId, payload.category_id]);
          }
        } 
        else if (submission.submission_type === 'opportunity') {
          const oppId = payload.id || 'opp_' + generateId();
          run(
            `INSERT INTO opportunities (id, slug, title, type, subcategory, org, amount, country, region, city, format, summary, description, eligibility, funding_info, duration, deadline, website_url, source_id, verification_status, publication_status, contributed_by, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 'verified', 'published', ?, ?, ?)`,
            [
              oppId,
              payload.slug || oppId,
              payload.title,
              payload.type || 'grant',
              payload.subcategory || '',
              payload.org || '',
              payload.amount || '',
              payload.country || 'Global',
              payload.region || 'international',
              payload.city || '',
              payload.format || 'offline',
              payload.summary || '',
              payload.description || '',
              payload.eligibility || '',
              payload.funding_info || '',
              payload.duration || '',
              payload.deadline || null,
              payload.website_url || '',
              contributedBy,
              new Date().toISOString(),
              new Date().toISOString()
            ]
          );

          if (payload.category_id) {
            run(`INSERT OR IGNORE INTO entity_categories (entity_type, entity_id, category_id) VALUES ('opportunity', ?, ?)`, [oppId, payload.category_id]);
          }
        }
        else if (submission.submission_type === 'event') {
          const evId = payload.id || 'ev_' + generateId();
          run(
            `INSERT INTO events (id, slug, title, type, subcategory, country, region, city, format, summary, description, eligibility, duration, deadline, website_url, source_id, verification_status, publication_status, contributed_by, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 'verified', 'published', ?, ?, ?)`,
            [
              evId,
              payload.slug || evId,
              payload.title,
              payload.type || 'festival',
              payload.subcategory || '',
              payload.country || 'Global',
              payload.region || 'international',
              payload.city || '',
              payload.format || 'offline',
              payload.summary || '',
              payload.description || '',
              payload.eligibility || '',
              payload.duration || '',
              payload.deadline || null,
              payload.website_url || '',
              contributedBy,
              new Date().toISOString(),
              new Date().toISOString()
            ]
          );

          if (payload.category_id) {
            run(`INSERT OR IGNORE INTO entity_categories (entity_type, entity_id, category_id) VALUES ('event', ?, ?)`, [evId, payload.category_id]);
          }
        }
        else if (submission.submission_type === 'book') {
          const bkId = payload.id || 'bk_' + generateId();
          run(
            `INSERT INTO books (id, slug, title, author, category, summary, ne_relevance, legacy_link, verification_status, publication_status, contributed_by, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'verified', 'published', ?, ?, ?)`,
            [
              bkId,
              payload.slug || bkId,
              payload.title,
              payload.author || '',
              payload.category || '',
              payload.summary || '',
              payload.ne_relevance || '',
              payload.legacy_link || '',
              contributedBy,
              new Date().toISOString(),
              new Date().toISOString()
            ]
          );

          if (payload.category_id) {
            run(`INSERT OR IGNORE INTO entity_categories (entity_type, entity_id, category_id) VALUES ('book', ?, ?)`, [bkId, payload.category_id]);
          }
        }

        // Add review queue log
        const logId = 'mod_' + generateId();
        const queueStatus = status === 'approved' ? 'verified' : 'rejected';
        run(
          `INSERT INTO review_queue (id, target_type, target_id, status, reviewer_notes, updated_by, updated_at)
           VALUES (?, 'submission', ?, ?, ?, ?, ?)`,
          [logId, submissionId, queueStatus, notes, reviewerName, new Date().toISOString()]
        );
      }

      return { success: true, status };
    });
  },

  // ── SECTION E: AUTOMATED SOURCE DISCOVERY ──

  createSourceCandidate(data) {
    // Check if candidate url already exists in candidates or sources registry
    const existingSource = queryOne(`SELECT id FROM sources WHERE url = ?`, [data.url]);
    if (existingSource) return null;

    const existingCandidate = queryOne(`SELECT id FROM source_candidates WHERE url = ?`, [data.url]);
    if (existingCandidate) return existingCandidate;

    const id = 'cand_' + generateId();
    const now = new Date().toISOString();

    run(
      `INSERT INTO source_candidates (id, title, url, country, category, confidence_score, discovered_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.title,
        data.url,
        data.country || null,
        data.category || null,
        data.confidence_score || 0.0,
        now
      ]
    );

    return { id, title: data.title, url: data.url, confidence_score: data.confidence_score };
  },

  listCandidates() {
    return queryAll(`SELECT * FROM source_candidates ORDER BY confidence_score DESC, discovered_at DESC`);
  },

  approveCandidate(candidateId, customParserType = 'generic') {
    return transaction(() => {
      const candidate = queryOne(`SELECT * FROM source_candidates WHERE id = ?`, [candidateId]);
      if (!candidate) throw new Error('Candidate not found');

      // Convert candidate to source registry
      const sourceId = 'src_' + generateId();
      const now = new Date().toISOString();

      // Determine trust score based on category/url indicators (Section E3)
      let trustLevel = 0;
      const t = candidate.title.toLowerCase();
      const u = candidate.url.toLowerCase();
      if (u.includes('.edu') || u.includes('.ac.uk') || t.includes('university') || t.includes('school of')) {
        trustLevel = 100; // Official University
      } else if (u.includes('.gov') || t.includes('ministry') || t.includes('department of')) {
        trustLevel = 100; // Government
      } else if (t.includes('festival') || t.includes('biennale') || t.includes('talents')) {
        trustLevel = 95;  // Film Festival
      } else if (t.includes('guild') || t.includes('association') || t.includes('foundation')) {
        trustLevel = 85;  // Industry Organization
      }

      run(
        `INSERT INTO sources (
          id, name, type, url, country, category, trust_level, active_status,
          crawl_frequency, parser_type, entity_type, parser_config,
          last_checked_at, last_run_at, last_success_at, discovered_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 'weekly', ?, 'opportunity', NULL, ?, NULL, NULL, ?, ?, ?)`,
        [
          sourceId,
          candidate.title,
          trustLevel === 100 ? 'university' : trustLevel === 95 ? 'festival' : 'other',
          candidate.url,
          candidate.country,
          candidate.category,
          trustLevel,
          customParserType,
          now,
          candidate.discovered_at,
          now,
          now
        ]
      );

      // Delete from candidates
      run(`DELETE FROM source_candidates WHERE id = ?`, [candidateId]);

      return { success: true, source_id: sourceId, trust_level: trustLevel };
    });
  },

  rejectCandidate(candidateId) {
    run(`DELETE FROM source_candidates WHERE id = ?`, [candidateId]);
    return { success: true };
  },

  // Simple automation candidate parser wrapper: simulates discovery workflow (Section E2)
  discoverCandidatesFromSource(sourceId) {
    const source = queryOne(`SELECT * FROM sources WHERE id = ?`, [sourceId]);
    if (!source) return 0;

    // Mock candidates returned from scanning the source page's external links
    const mockLinks = [
      { title: 'AFI Conservatory', url: 'https://www.afi.com/conservatory', category: 'cinematography', country: 'United States', score: 0.95 },
      { title: 'Lodz Film School Directing', url: 'https://www.filmschool.lodz.pl/en/directing', category: 'producing', country: 'Poland', score: 0.90 },
      { title: 'European Film Academy', url: 'https://www.europeanfilmacademy.org', category: 'film-criticism', country: 'Germany', score: 0.85 }
    ];

    let count = 0;
    mockLinks.forEach(link => {
      const added = this.createSourceCandidate({
        title: link.title,
        url: link.url,
        category: link.category,
        country: link.country,
        confidence_score: link.score
      });
      if (added) count++;
    });

    return count;
  },

  getAuditMetrics() {
    // 1. Entity Counts
    const getStatusCounts = (table, statusCol = 'publication_status') => {
      try {
        const rows = queryAll(`SELECT ${statusCol} as status, COUNT(*) as count FROM ${table} GROUP BY ${statusCol}`);
        const result = { total: 0, published: 0, draft: 0, archived: 0 };
        rows.forEach(r => {
          const s = r.status || 'unknown';
          result[s] = r.count;
          result.total += r.count;
        });
        return result;
      } catch (err) {
        try {
          const row = queryOne(`SELECT COUNT(*) as count FROM ${table}`);
          return { total: row ? row.count : 0, published: 0, draft: 0, archived: 0 };
        } catch {
          return { total: 0, published: 0, draft: 0, archived: 0 };
        }
      }
    };

    const entityCounts = {
      programs: getStatusCounts('programs', 'publication_status'),
      opportunities: getStatusCounts('opportunities', 'publication_status'),
      countries: getStatusCounts('countries', 'publication_status'),
      sources: (() => {
        const srcRows = queryAll(`SELECT active_status as status, COUNT(*) as count FROM sources GROUP BY active_status`);
        const result = { total: 0, active: 0, inactive: 0 };
        srcRows.forEach(r => {
          if (r.status === 1) result.active = r.count;
          else if (r.status === 0) result.inactive = r.count;
          result.total += r.count;
        });
        return result;
      })(),
      books: getStatusCounts('books', 'publication_status'),
      roadmaps: getStatusCounts('roadmaps', 'publication_status'),
      reports: getStatusCounts('reports', 'publication_status'),
      blog_posts: (() => {
        const rows = queryAll(`SELECT status, COUNT(*) as count FROM blog_posts GROUP BY status`);
        const result = { total: 0, draft: 0, review: 0, published: 0, archived: 0 };
        rows.forEach(r => {
          const s = r.status || 'draft';
          result[s] = r.count;
          result.total += r.count;
        });
        return result;
      })(),
      contributor_submissions: (() => {
        const rows = queryAll(`SELECT status, COUNT(*) as count FROM contributor_submissions GROUP BY status`);
        const result = { total: 0, pending: 0, approved: 0, rejected: 0 };
        rows.forEach(r => {
          const s = r.status || 'pending';
          result[s] = r.count;
          result.total += r.count;
        });
        return result;
      })(),
      source_candidates: (() => {
        const row = queryOne(`SELECT COUNT(*) as count FROM source_candidates`);
        return { total: row ? row.count : 0 };
      })()
    };

    // 2. Source Health & Freshness Metrics
    const sources = queryAll(`SELECT id, name, last_checked_at, updated_at, created_at FROM sources`);
    let fresh = 0, aging = 0, stale = 0, needsVerification = 0;
    const now = Date.now();
    sources.forEach(src => {
      const dateStr = src.last_checked_at || src.updated_at || src.created_at;
      if (!dateStr) {
        needsVerification++;
        return;
      }
      const diffMs = now - new Date(dateStr).getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays < 30) fresh++;
      else if (diffDays < 90) aging++;
      else if (diffDays < 180) stale++;
      else needsVerification++;
    });

    const deadChecks = queryAll(`
      SELECT source_id, status_code 
      FROM dead_link_checks 
      WHERE id IN (SELECT MAX(id) FROM dead_link_checks GROUP BY source_id)
    `);
    let dead = 0;
    deadChecks.forEach(c => {
      if (c.status_code === 404 || c.status_code >= 500 || c.status_code === 0 || c.status_code === null) {
        dead++;
      }
    });

    const totalSources = sources.length;
    const healthMetrics = {
      totalSources,
      fresh,
      aging,
      stale,
      needsVerification,
      dead,
      freshPct: totalSources > 0 ? parseFloat((fresh / totalSources * 100).toFixed(1)) : 0,
      agingPct: totalSources > 0 ? parseFloat((aging / totalSources * 100).toFixed(1)) : 0,
      stalePct: totalSources > 0 ? parseFloat((stale / totalSources * 100).toFixed(1)) : 0,
      needsVerificationPct: totalSources > 0 ? parseFloat((needsVerification / totalSources * 100).toFixed(1)) : 0,
      deadPct: totalSources > 0 ? parseFloat((dead / totalSources * 100).toFixed(1)) : 0
    };

    // 3. Category Coverage Matrix
    const TARGET_CATEGORIES = [
      { name: 'Acting', slug: 'acting' },
      { name: 'Theatre', slug: 'theatre' },
      { name: 'Editing', slug: 'editing' },
      { name: 'Screenwriting', slug: 'screenwriting' },
      { name: 'Documentary', slug: 'documentary' },
      { name: 'Animation', slug: 'animation' },
      { name: 'Producing', slug: 'producing' },
      { name: 'Film Criticism', slug: 'film-criticism' },
      { name: 'Cinematography', slug: 'cinematography' },
      { name: 'Sound Design', slug: 'sound-design' }
    ];

    const categoryTaxonomy = queryAll(`SELECT * FROM category_taxonomy`);
    const categoryMatrix = TARGET_CATEGORIES.map(target => {
      const dbCat = categoryTaxonomy.find(c => c.name.toLowerCase() === target.name.toLowerCase() || c.slug === target.slug);
      const catId = dbCat ? dbCat.id : target.slug;
      const catName = dbCat ? dbCat.name : target.name;
      const catSlug = dbCat ? dbCat.slug : target.slug;

      const progs = queryOne(`
        SELECT COUNT(DISTINCT id) as count FROM (
          SELECT id FROM programs WHERE LOWER(category) = LOWER(?) OR LOWER(subcategory) = LOWER(?)
          UNION
          SELECT entity_id FROM entity_categories WHERE entity_type = 'program' AND category_id = ?
        )
      `, [catName, catName, catId]).count;

      const srcs = queryOne(`SELECT COUNT(*) as count FROM sources WHERE LOWER(category) = LOWER(?) OR LOWER(category) = LOWER(?)`, [catId, catSlug]).count;

      const term = `%${catName}%`;
      const blogs = queryOne(`SELECT COUNT(*) as count FROM blog_posts WHERE title LIKE ? OR excerpt LIKE ? OR content LIKE ?`, [term, term, term]).count;

      const opps = queryOne(`
        SELECT COUNT(DISTINCT id) as count FROM (
          SELECT id FROM opportunities WHERE LOWER(subcategory) = LOWER(?)
          UNION
          SELECT entity_id FROM entity_categories WHERE entity_type = 'opportunity' AND category_id = ?
        )
      `, [catName, catId]).count;

      const bks = queryOne(`
        SELECT COUNT(DISTINCT id) as count FROM (
          SELECT id FROM books WHERE LOWER(category) = LOWER(?)
          UNION
          SELECT entity_id FROM entity_categories WHERE entity_type = 'book' AND category_id = ?
        )
      `, [catName, catId]).count;

      const roadmaps = queryOne(`
        SELECT COUNT(*) as count FROM entity_categories WHERE entity_type = 'roadmap' AND category_id = ?
      `, [catId]).count;

      const reports = queryOne(`
        SELECT COUNT(DISTINCT r.id) as count
        FROM reports r
        LEFT JOIN report_sections rs ON r.id = rs.report_id
        WHERE r.title LIKE ? OR r.summary LIKE ? OR rs.heading LIKE ? OR rs.content LIKE ?
      `, [term, term, term, term]).count;

      return {
        category: catName,
        programs: progs,
        sources: srcs,
        blogs: blogs,
        opportunities: opps,
        books: bks,
        roadmaps: roadmaps,
        reports: reports,
        flags: {
          programs_gap: progs < 10,
          sources_gap: srcs < 5,
          blogs_gap: blogs === 0,
          opportunities_gap: opps < 5
        }
      };
    });

    // 4. Country Coverage Matrix
    const progCountries = queryAll(`SELECT country, COUNT(*) as count FROM programs GROUP BY country`);
    const oppCountries = queryAll(`SELECT country, COUNT(*) as count FROM opportunities GROUP BY country`);
    const srcCountries = queryAll(`SELECT country, COUNT(*) as count FROM sources WHERE country IS NOT NULL GROUP BY country`);
    
    // Country profile status
    const countryProfiles = queryAll(`SELECT id, name, publication_status FROM countries`);

    // Roadmaps referencing countries
    const roadmapsByCountry = {};
    const roadmapResourcesRows = queryAll(`
      SELECT c.name as country_name, COUNT(DISTINCT rs.roadmap_id) as count
      FROM roadmap_resources rr
      JOIN roadmap_steps rs ON rr.step_id = rs.id
      JOIN countries c ON rr.entity_id = c.id
      WHERE rr.entity_type = 'country'
      GROUP BY c.name
    `);
    roadmapResourcesRows.forEach(r => {
      roadmapsByCountry[r.country_name.toLowerCase()] = r.count;
    });

    const countryMap = {};
    const getOrInitCountry = (name) => {
      const trimmed = name.trim();
      const lower = trimmed.toLowerCase();
      if (!countryMap[lower]) {
        countryMap[lower] = {
          name: trimmed,
          programs: 0,
          opportunities: 0,
          sources: 0,
          roadmaps: 0,
          profileStatus: 'No Profile'
        };
      }
      return countryMap[lower];
    };

    progCountries.forEach(pc => {
      if (pc.country) getOrInitCountry(pc.country).programs = pc.count;
    });
    oppCountries.forEach(oc => {
      if (oc.country) getOrInitCountry(oc.country).opportunities = oc.count;
    });
    srcCountries.forEach(sc => {
      if (sc.country) getOrInitCountry(sc.country).sources = sc.count;
    });
    countryProfiles.forEach(cp => {
      const entry = getOrInitCountry(cp.name);
      entry.profileStatus = cp.publication_status;
    });

    Object.keys(countryMap).forEach(lower => {
      countryMap[lower].roadmaps = roadmapsByCountry[lower] || 0;
    });

    const countriesArray = Object.values(countryMap);

    // Identify Top 20 Countries
    const topCountries = [...countriesArray]
      .sort((a, b) => (b.programs + b.opportunities + b.sources) - (a.programs + a.opportunities + a.sources))
      .slice(0, 20);

    // Identify Missing Priority Countries
    const PRIORITY_COUNTRIES = ['Germany', 'France', 'United Kingdom', 'Japan', 'South Korea', 'Canada', 'Australia'];
    const missingPriorityCountries = PRIORITY_COUNTRIES.filter(pc => {
      const match = countriesArray.find(c => c.name.toLowerCase() === pc.toLowerCase());
      return !match || match.profileStatus !== 'published' || (match.programs === 0 && match.opportunities === 0);
    });

    // 5. Content Gap Audit & Priority Content Queue
    const priorityContentQueue = categoryMatrix.map(cat => {
      const missingTypes = [];
      if (cat.blogs === 0) missingTypes.push('Blogs');
      if (cat.roadmaps === 0) missingTypes.push('Roadmaps');
      if (cat.opportunities === 0) missingTypes.push('Opportunities');
      if (cat.books === 0) missingTypes.push('Books');
      if (cat.reports === 0) missingTypes.push('Reports');

      return {
        category: cat.category,
        missingCount: missingTypes.length,
        missingTypes: missingTypes,
        programs: cat.programs,
        sources: cat.sources
      };
    })
    .filter(item => item.missingCount > 0)
    .sort((a, b) => {
      if (b.missingCount !== a.missingCount) {
        return b.missingCount - a.missingCount;
      }
      return a.programs - b.programs; // Tie breaker: fewer programs first
    });

    // 6. Authority Readiness Audit
    const authorityReadiness = {
      features: [
        {
          name: 'Institution Profiles',
          status: 'Partial',
          score: 80,
          existing: 'institutes table exists in schema and contains seeded profiles. Administration moderation exists.',
          missing: 'Public detail pages (e.g. /institutes/:slug) and routes are missing.',
          schemaRequirements: 'Current table structure is sufficient, but could expand with alumni_count and placement_stats.'
        },
        {
          name: 'Career Outcomes',
          status: 'Partial',
          score: 40,
          existing: 'roadmaps and roadmap_steps tables exist to describe filmmaker pathways.',
          missing: 'No dedicated career_outcomes table to track salary statistics, career paths, and employment outcomes.',
          schemaRequirements: 'career_outcomes: id, title, salary_range_low, salary_range_high, placement_rate, related_programs, requirements_text.'
        },
        {
          name: 'Interviews',
          status: 'Partial',
          score: 50,
          existing: 'blog_posts table exists where interviews can be published as articles.',
          missing: 'No dedicated interview schema or entity type to link interviews to specific programs, categories, or institutes.',
          schemaRequirements: 'Extend blog_posts or create interviews table with fields: interviewee_name, interviewee_role, linked_institute_id, linked_program_id.'
        },
        {
          name: 'Featured Alumni',
          status: 'Missing',
          score: 0,
          existing: 'None',
          missing: 'No database table, admin moderation, or public components for alumni profiles.',
          schemaRequirements: 'alumni: id, name, graduation_year, institute_id, program_id, current_role, achievement_summary, profile_image_url.'
        },
        {
          name: 'Success Stories',
          status: 'Missing',
          score: 0,
          existing: 'None',
          missing: 'No database table, admin moderation, or public components for success stories.',
          schemaRequirements: 'success_stories: id, title, slug, alumni_id, summary, body_content, video_url, publication_status.'
        }
      ],
      recommendedOrder: [
        '1. Establish alumni and success_stories tables and link them to institutes and programs.',
        '2. Add career_outcomes schema to capture placement data and salaries.',
        '3. Create public routes for institutes (/institutes/:slug) to display these profiles, featured alumni, and success stories.',
        '4. Extend blog_posts schema or add interviews table to cross-link conversations with education profiles.'
      ],
      readinessScore: 34
    };

    return {
      entityCounts,
      healthMetrics,
      categoryMatrix,
      countryCoverage: {
        topCountries,
        missingPriorityCountries,
        allCountries: countriesArray
      },
      contentGaps: {
        priorityContentQueue,
        totalGaps: priorityContentQueue.length
      },
      authorityReadiness,
      auditTimestamp: new Date().toISOString()
    };
  }
};

module.exports = { CoverageService };
