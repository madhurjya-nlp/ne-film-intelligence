const { queryOne, queryAll } = require('../db/db');
const { RoadmapService } = require('./roadmapService');
const { CalendarService } = require('./calendarService');
const { CountryService } = require('./countryService');
const { ReportService } = require('./reportService');
const { RelationshipService } = require('./relationshipService');

const PUB = `verification_status = 'verified' AND publication_status = 'published'`;

function resolveEntity(type, id) {
  const tables = {
    program: 'programs', opportunity: 'opportunities', event: 'events',
    institute: 'institutes', country: 'countries', report: 'reports', roadmap: 'roadmaps',
  };
  const table = tables[type];
  if (!table) return null;
  const labelCol = type === 'country' || type === 'source' ? 'name' : 'title';
  const pubFilter = ['country', 'roadmap', 'report'].includes(type)
    ? (type === 'country' ? `publication_status = 'published'` : `publication_status = 'published'`)
    : PUB;
  return queryOne(
    `SELECT id, ${labelCol} as title, slug, summary FROM ${table} WHERE id = ? AND ${pubFilter}`,
    [id]
  );
}

function enrichResources(steps) {
  return steps.map((step) => ({
    ...step,
    resources: (step.resources || []).map((r) => ({
      ...r,
      entity: resolveEntity(r.entity_type, r.entity_id),
    })).filter((r) => r.entity),
  }));
}

const PublicService = {
  listRoadmaps({ search, audience } = {}) {
    const result = RoadmapService.list({ publication_status: 'published', search });
    let items = result.items;
    if (audience) {
      items = items.filter((r) => (r.target_audience || '').toLowerCase().includes(audience.toLowerCase()));
    }
    return { total: items.length, items, featured: items.slice(0, 3) };
  },

  getRoadmapBySlug(slug) {
    const rm = RoadmapService.getBySlug(slug);
    if (!rm || rm.publication_status !== 'published') return null;
    rm.steps = enrichResources(rm.steps);

    rm.related_opportunities = queryAll(
      `SELECT o.id, o.slug, o.title, o.type, o.country, o.amount
       FROM opportunities o WHERE ${PUB} AND o.country IN (
         SELECT name FROM countries WHERE publication_status = 'published'
       ) ORDER BY o.created_at DESC LIMIT 6`
    );

    rm.related_countries = queryAll(
      `SELECT c.id, c.slug, c.name, c.region, c.summary
       FROM countries c WHERE c.publication_status = 'published' ORDER BY c.name LIMIT 6`
    );

    rm.estimated_timeline = `${rm.steps.length} milestones · self-paced pathway`;
    return rm;
  },

  listCalendar({ view = 'all', limit = 50, offset = 0, category } = {}) {
    if (view === 'recently_added') {
      let sql = `SELECT ce.* FROM calendar_events ce
        JOIN (
          SELECT 'program' as t, id FROM programs WHERE ${PUB}
          UNION SELECT 'opportunity', id FROM opportunities WHERE ${PUB}
          UNION SELECT 'event', id FROM events WHERE ${PUB}
        ) pub ON ce.entity_type = pub.t AND ce.entity_id = pub.id
        WHERE ce.created_at >= date('now', '-30 days')`;
      const params = [];
      if (category) { sql += ` AND ce.entity_type = ?`; params.push(category); }
      const total = queryOne(`SELECT COUNT(*) as count FROM (${sql})`, params).count;
      sql += ` ORDER BY ce.created_at DESC LIMIT ? OFFSET ?`;
      const items = queryAll(sql, [...params, limit, offset]).map((ce) => ({
        ...ce,
        days_remaining: ce.deadline_date
          ? Math.ceil((new Date(ce.deadline_date) - new Date()) / 86400000)
          : null,
      }));
      return { total, items, view };
    }

    const result = CalendarService.list(view, limit, offset);
    result.items = result.items.filter((ce) => {
      const table = ce.entity_type === 'program' ? 'programs'
        : ce.entity_type === 'opportunity' ? 'opportunities' : 'events';
      const pub = queryOne(`SELECT id FROM ${table} WHERE id = ? AND ${PUB}`, [ce.entity_id]);
      return !!pub;
    }).map((ce) => ({
      ...ce,
      days_remaining: ce.deadline_date
        ? Math.ceil((new Date(ce.deadline_date) - new Date()) / 86400000)
        : null,
    }));
    if (category) result.items = result.items.filter((i) => i.entity_type === category);
    result.total = result.items.length;
    return result;
  },

  listCountries({ search, region, cost_band } = {}) {
    let sql = `SELECT c.* FROM countries c WHERE c.publication_status = 'published'`;
    const params = [];
    if (search) {
      sql += ` AND (c.name LIKE ? OR c.summary LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s);
    }
    if (region) { sql += ` AND c.region = ?`; params.push(region); }
    if (cost_band) {
      sql += ` AND EXISTS (SELECT 1 FROM country_cost_profiles cp WHERE cp.country_id = c.id AND cp.cost_band = ?)`;
      params.push(cost_band);
    }
    sql += ` ORDER BY c.name ASC`;
    const items = queryAll(sql, params);
    return { total: items.length, items };
  },

  getCountryBySlug(slug) {
    const country = queryOne(`SELECT * FROM countries WHERE slug = ? AND publication_status = 'published'`, [slug]);
    if (!country) return null;
    const full = CountryService.get(country.id);

    full.related_programs = queryAll(
      `SELECT p.id, p.slug, p.title, p.tuition_or_cost, p.format FROM programs p
       WHERE ${PUB} AND (p.country = ? OR p.id IN (
         SELECT to_id FROM entity_relationships WHERE from_type='country' AND from_id=? AND to_type='program'
       )) LIMIT 12`, [full.name, full.id]
    );

    full.related_opportunities = queryAll(
      `SELECT o.id, o.slug, o.title, o.type, o.amount FROM opportunities o
       WHERE ${PUB} AND (o.country = ? OR o.id IN (
         SELECT to_id FROM entity_relationships WHERE from_type='country' AND from_id=? AND to_type='opportunity'
       )) LIMIT 12`, [full.name, full.id]
    );

    full.related_roadmaps = queryAll(
      `SELECT r.id, r.slug, r.title, r.summary FROM roadmaps r
       WHERE r.publication_status = 'published' LIMIT 6`
    );

    return full;
  },

  getInstituteBySlug(slug) {
    const institute = queryOne(`SELECT * FROM institutes WHERE slug = ? AND publication_status = 'published'`, [slug]);
    if (!institute) return null;

    const programs = queryAll(
      `SELECT p.id, p.slug, p.title, p.category, p.tuition_or_cost, p.format, p.summary, p.deadline
       FROM programs p
       WHERE p.institute_id = ? AND ${PUB} ORDER BY p.title ASC`,
      [institute.id]
    );

    const alumni = queryAll(
      `SELECT a.id, a.name, a.graduation_year, a.current_role, a.achievement_summary, a.profile_image_url
       FROM alumni a
       WHERE a.institute_id = ? ORDER BY a.graduation_year DESC`,
      [institute.id]
    );

    let success_stories = [];
    if (alumni.length > 0) {
      const alumniIds = alumni.map(a => a.id);
      const placeholders = alumniIds.map(() => '?').join(',');
      success_stories = queryAll(
        `SELECT s.id, s.title, s.slug, s.summary, s.video_url, s.alumni_id, a.name as alumni_name
         FROM success_stories s
         JOIN alumni a ON s.alumni_id = a.id
         WHERE s.alumni_id IN (${placeholders}) AND s.publication_status = 'published'`,
        alumniIds
      );
    }

    const career_outcomes = queryAll(
      `SELECT id, title, salary_range_low, salary_range_high, placement_rate, related_programs, requirements_text
       FROM career_outcomes`
    ).filter(co => {
      try {
        const relatedProgs = JSON.parse(co.related_programs || '[]');
        return programs.some(p => relatedProgs.includes(p.id) || relatedProgs.includes(p.slug));
      } catch (err) {
        return false;
      }
    });

    return {
      ...institute,
      programs,
      alumni,
      success_stories,
      career_outcomes
    };
  },

  listReports({ search, report_type } = {}) {
    const result = ReportService.list({ publication_status: 'published', report_type });
    if (search) {
      result.items = result.items.filter((r) =>
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        (r.summary || '').toLowerCase().includes(search.toLowerCase())
      );
    }
    result.total = result.items.length;
    return result;
  },

  getReportBySlug(slug) {
    const report = queryOne(`SELECT * FROM reports WHERE slug = ? AND publication_status = 'published'`, [slug]);
    if (!report) return null;
    return ReportService.get(report.id);
  },

  getRelationships({ root_type, root_id, limit = 80 } = {}) {
    if (root_type && root_id) {
      return RelationshipService.traverse(root_type, root_id, 2);
    }
    return RelationshipService.getFullGraph(limit);
  },

  getEntityDetail(type, id) {
    const entity = resolveEntity(type, id);
    if (!entity) return null;
    const outgoing = RelationshipService.list({ from_type: type }, 50)
      .filter((e) => e.from_id === id);
    const incoming = queryAll(
      `SELECT * FROM entity_relationships WHERE to_type = ? AND to_id = ? LIMIT 50`,
      [type, id]
    );
    return { entity: { type, ...entity }, outgoing, incoming, breadcrumbs: [{ type, id, label: entity.title }] };
  },

  getHomepage() {
    const roadmaps = this.listRoadmaps().featured;
    const closingSoon = this.listCalendar({ view: 'closing_soon', limit: 6 }).items;
    const countries = this.listCountries().items.slice(0, 6);
    const reports = this.listReports().items.slice(0, 4);
    const upcoming = this.listCalendar({ view: 'upcoming', limit: 6 }).items;
    const programs = queryAll(
      `SELECT p.id, p.slug, p.title, p.country, p.tuition_or_cost, p.format, p.summary
       FROM programs p WHERE ${PUB} ORDER BY p.created_at DESC LIMIT 6`
    );
    const stats = {
      programs: queryOne(`SELECT COUNT(*) as count FROM programs WHERE ${PUB}`).count,
      opportunities: queryOne(`SELECT COUNT(*) as count FROM opportunities WHERE ${PUB}`).count,
      countries: queryOne(`SELECT COUNT(*) as count FROM countries WHERE publication_status = 'published'`).count,
      events: queryOne(`SELECT COUNT(*) as count FROM events WHERE ${PUB}`).count,
      books: queryOne(`SELECT COUNT(*) as count FROM books WHERE ${PUB}`).count,
    };
    return {
      featured_roadmaps: roadmaps,
      closing_soon: closingSoon,
      countries,
      latest_reports: reports,
      upcoming_deadlines: upcoming,
      featured_programs: programs,
      stats,
      generated_at: new Date().toISOString(),
    };
  },

  getBlogPosts({ search } = {}) {
    let sql = `SELECT id, title, slug, excerpt, cover_image, author, status, published_at, reading_time, featured FROM blog_posts WHERE status = 'published'`;
    const params = [];
    if (search) {
      sql += ` AND (title LIKE ? OR content LIKE ? OR excerpt LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }
    sql += ` ORDER BY featured DESC, published_at DESC`;
    const items = queryAll(sql, params);
    const featured = items.filter(i => i.featured === 1);
    const latest = items.filter(i => i.featured !== 1);
    return { total: items.length, items, featured, latest };
  },

  getBlogPostBySlug(slug) {
    const post = queryOne(`SELECT * FROM blog_posts WHERE slug = ? AND status = 'published'`, [slug]);
    if (!post) return null;

    if (post.linked_institute_id) {
      post.linked_institute = queryOne(`SELECT id, title, slug FROM institutes WHERE id = ?`, [post.linked_institute_id]);
    }
    if (post.linked_program_id) {
      post.linked_program = queryOne(`SELECT id, title, slug FROM programs WHERE id = ?`, [post.linked_program_id]);
    }
    
    post.related_articles = queryAll(
      `SELECT id, title, slug, excerpt, cover_image, author, published_at, reading_time 
       FROM blog_posts WHERE status = 'published' AND id != ? ORDER BY published_at DESC LIMIT 3`,
      [post.id]
    );
    return post;
  },

  getSitemapUrls(baseUrl) {
    const urls = [{ loc: `${baseUrl}/`, priority: '1.0' }];
    const add = (path, p = '0.8') => urls.push({ loc: `${baseUrl}${path}`, priority: p });

    add('/roadmaps'); add('/calendar'); add('/countries'); add('/explore');
    add('/reports'); add('/relationships'); add('/search'); add('/blog');

    queryAll(`SELECT slug FROM roadmaps WHERE publication_status='published'`).forEach((r) => add(`/roadmaps/${r.slug}`, '0.9'));
    queryAll(`SELECT slug FROM countries WHERE publication_status='published'`).forEach((c) => add(`/countries/${c.slug}`, '0.9'));
    queryAll(`SELECT slug FROM reports WHERE publication_status='published'`).forEach((r) => add(`/reports/${r.slug}`, '0.7'));
    queryAll(`SELECT slug FROM programs WHERE ${PUB}`).forEach((p) => add(`/explore?type=program&id=${p.slug}`, '0.6'));
    queryAll(`SELECT slug FROM blog_posts WHERE status='published'`).forEach((p) => add(`/blog/${p.slug}`, '0.8'));
    queryAll(`SELECT slug FROM institutes WHERE publication_status='published'`).forEach((inst) => add(`/institutes/${inst.slug}`, '0.7'));

    return urls;
  },
};

module.exports = { PublicService, PUB };