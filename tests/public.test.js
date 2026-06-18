const test = require('node:test');
const assert = require('node:assert');
const { PublicService } = require('../server/services/publicService');
const { ExplorerService } = require('../server/services/explorerService');
const { SearchService } = require('../server/services/searchService');
const { RoadmapService } = require('../server/services/roadmapService');
const { ReportService } = require('../server/services/reportService');
const { RelationshipService } = require('../server/services/relationshipService');

test.describe('CineEduAssan Phase 4 Public Intelligence Tests', () => {

  test.it('PublicService: lists published roadmaps with featured pathways', () => {
    const result = PublicService.listRoadmaps();
    assert.ok(Array.isArray(result.items));
    assert.ok(result.items.every((r) => r.publication_status === 'published'));
    if (result.items.length) {
      assert.ok(result.featured.length <= 3);
      assert.ok(result.items[0].slug);
    }
  });

  test.it('PublicService: renders roadmap by slug with ordered milestones', () => {
    const list = PublicService.listRoadmaps();
    if (!list.items.length) return;
    const rm = PublicService.getRoadmapBySlug(list.items[0].slug);
    assert.ok(rm);
    assert.strictEqual(rm.publication_status, 'published');
    assert.ok(Array.isArray(rm.steps));
    if (rm.steps.length > 1) {
      assert.ok(rm.steps[0].step_order <= rm.steps[1].step_order);
    }
    assert.ok(rm.estimated_timeline);
  });

  test.it('PublicService: calendar views return deadline metadata', () => {
    for (const view of ['upcoming', 'closing_soon', 'this_month', 'recently_added', 'expired']) {
      const result = PublicService.listCalendar({ view, limit: 10 });
      assert.ok(Array.isArray(result.items));
      assert.strictEqual(result.view, view);
      for (const item of result.items) {
        assert.ok(item.entity_type);
        if (item.deadline_date) assert.ok('days_remaining' in item);
      }
    }
  });

  test.it('PublicService: country pages load full intelligence profile', () => {
    const list = PublicService.listCountries();
    if (!list.items.length) return;
    const country = PublicService.getCountryBySlug(list.items[0].slug);
    assert.ok(country);
    assert.strictEqual(country.publication_status, 'published');
    assert.ok(Array.isArray(country.cost_profiles));
    assert.ok(Array.isArray(country.visa_notes));
    assert.ok(Array.isArray(country.scholarship_notes));
    assert.ok(Array.isArray(country.related_programs));
    assert.ok(Array.isArray(country.related_roadmaps));
  });

  test.it('PublicService: country filters by region and search', () => {
    const all = PublicService.listCountries();
    if (!all.items.length) return;
    const region = all.items[0].region;
    const filtered = PublicService.listCountries({ region });
    assert.ok(filtered.items.every((c) => c.region === region));
    const searched = PublicService.listCountries({ search: all.items[0].name.slice(0, 3) });
    assert.ok(searched.items.length >= 1);
  });

  test.it('ExplorerService: filters programs and opportunities with pagination', () => {
    const result = ExplorerService.explore({ type: 'program' }, 'newest', 1, 10);
    assert.ok(Array.isArray(result.programs));
    assert.strictEqual(result.opportunities.length, 0);
    assert.ok(result.page === 1);

    const withCountry = ExplorerService.explore({ country: 'Germany' }, 'newest', 1, 20);
    for (const p of withCountry.programs) {
      assert.strictEqual(p.country, 'Germany');
    }
    for (const o of withCountry.opportunities) {
      assert.strictEqual(o.country, 'Germany');
    }

    const count = ExplorerService.count({ country: 'Germany' });
    assert.ok(typeof count === 'number');
  });

  test.it('SearchService: unified search returns categorized results', () => {
    const empty = SearchService.search('a');
    assert.strictEqual(empty.total, 0);

    const result = SearchService.search('film');
    assert.ok('categories' in result);
    assert.ok('programs' in result.categories);
    assert.ok('roadmaps' in result.categories);
    assert.ok('countries' in result.categories);
    assert.ok(Array.isArray(result.results));
    if (result.total > 0) {
      assert.ok(result.results[0].href);
    }
  });

  test.it('PublicService: relationship traversal from entity root', () => {
    const graph = PublicService.getRelationships({ limit: 20 });
    assert.ok(graph.edges);
    if (!graph.edges.length) return;

    const edge = graph.edges[0];
    const rooted = PublicService.getRelationships({
      root_type: edge.from_type,
      root_id: edge.from_id,
    });
    assert.ok(rooted.edges.length >= 1);

    const detail = PublicService.getEntityDetail(edge.from_type, edge.from_id);
    if (detail) {
      assert.ok(detail.entity);
      assert.ok(Array.isArray(detail.breadcrumbs));
    }
  });

  test.it('PublicService: homepage aggregates live sections', () => {
    const home = PublicService.getHomepage();
    assert.ok(home.generated_at);
    assert.ok(Array.isArray(home.featured_roadmaps));
    assert.ok(Array.isArray(home.closing_soon));
    assert.ok(Array.isArray(home.countries));
    assert.ok(Array.isArray(home.latest_reports));
    assert.ok(Array.isArray(home.upcoming_deadlines));
    assert.ok(Array.isArray(home.featured_programs));
  });

  test.it('PublicService: sitemap includes public routes and detail pages', () => {
    const urls = PublicService.getSitemapUrls('http://localhost:3000');
    const locs = urls.map((u) => u.loc);
    assert.ok(locs.includes('http://localhost:3000/roadmaps'));
    assert.ok(locs.includes('http://localhost:3000/countries'));
    assert.ok(locs.includes('http://localhost:3000/explore'));
    assert.ok(locs.includes('http://localhost:3000/sitemap.xml') === false);
  });

  test.it('PublicService: published reports accessible by slug', () => {
    const uid = Date.now();
    const report = ReportService.generate('scholarships_added', { slug: `pub-test-${uid}` });
    ReportService.publish(report.id);
    const listed = PublicService.listReports();
    const found = listed.items.find((r) => r.slug === `pub-test-${uid}`);
    assert.ok(found);
    const full = PublicService.getReportBySlug(`pub-test-${uid}`);
    assert.ok(full.sections.length >= 1);
  });

  test.it('PublicService: draft roadmaps are not publicly visible', () => {
    const uid = Date.now();
    const rm = RoadmapService.create({
      slug: `draft-only-${uid}`,
      title: 'Draft Pathway',
      summary: 'Should not appear publicly',
      publication_status: 'draft',
    });
    const pub = PublicService.getRoadmapBySlug(rm.slug);
    assert.strictEqual(pub, null);
  });
});