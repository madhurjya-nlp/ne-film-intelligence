const { queryAll } = require('../db/db');
const { PUB } = require('./publicService');

function fuzzyMatch(text, query) {
  if (!text || !query) return false;
  const t = text.toLowerCase();
  const q = query.toLowerCase().trim();
  if (t.includes(q)) return true;
  const words = q.split(/\s+/).filter(Boolean);
  return words.every((w) => t.includes(w));
}

const SearchService = {
  search(query, { limit = 5 } = {}) {
    if (!query || query.trim().length < 2) {
      return { query, total: 0, categories: {} };
    }

    const q = `%${query.trim()}%`;
    const categories = {
      programs: queryAll(
        `SELECT id, slug, title, country, summary, 'program' as type FROM programs
         WHERE ${PUB} AND (title LIKE ? OR summary LIKE ? OR country LIKE ?) LIMIT ?`,
        [q, q, q, limit]
      ),
      opportunities: queryAll(
        `SELECT id, slug, title, country, org, summary, type, 'opportunity' as result_type FROM opportunities
         WHERE ${PUB} AND (title LIKE ? OR summary LIKE ? OR org LIKE ?) LIMIT ?`,
        [q, q, q, limit]
      ),
      institutes: queryAll(
        `SELECT id, slug, title, country, summary, 'institute' as type FROM institutes
         WHERE ${PUB} AND (title LIKE ? OR summary LIKE ?) LIMIT ?`,
        [q, q, limit]
      ),
      countries: queryAll(
        `SELECT id, slug, name as title, region, summary, 'country' as type FROM countries
         WHERE publication_status = 'published' AND (name LIKE ? OR summary LIKE ?) LIMIT ?`,
        [q, q, limit]
      ),
      reports: queryAll(
        `SELECT id, slug, title, summary, report_type, 'report' as type FROM reports
         WHERE publication_status = 'published' AND (title LIKE ? OR summary LIKE ?) LIMIT ?`,
        [q, q, limit]
      ),
      roadmaps: queryAll(
        `SELECT id, slug, title, summary, target_audience, 'roadmap' as type FROM roadmaps
         WHERE publication_status = 'published' AND (title LIKE ? OR summary LIKE ? OR target_audience LIKE ?) LIMIT ?`,
        [q, q, q, limit]
      ),
      blog_articles: queryAll(
        `SELECT id, slug, title, excerpt as summary, 'blog_article' as type FROM blog_posts
         WHERE status = 'published' AND (title LIKE ? OR excerpt LIKE ? OR content LIKE ?) LIMIT ?`,
        [q, q, q, limit]
      ),
    };

    const total = Object.values(categories).reduce((sum, arr) => sum + arr.length, 0);

    return {
      query,
      total,
      categories,
      results: [
        ...categories.roadmaps.map((r) => ({ ...r, href: `/roadmaps/${r.slug}` })),
        ...categories.programs.map((r) => ({ ...r, href: `/explore?type=program&search=${encodeURIComponent(r.title)}` })),
        ...categories.opportunities.map((r) => ({ ...r, href: `/explore?type=opportunity&search=${encodeURIComponent(r.title)}` })),
        ...categories.countries.map((r) => ({ ...r, href: `/countries/${r.slug}` })),
        ...categories.reports.map((r) => ({ ...r, href: `/reports/${r.slug}` })),
        ...categories.institutes.map((r) => ({ ...r, href: `/explore?type=institute&search=${encodeURIComponent(r.title)}` })),
        ...categories.blog_articles.map((r) => ({ ...r, href: `/blog/${r.slug}` })),
      ],
    };
  },
};

module.exports = { SearchService };