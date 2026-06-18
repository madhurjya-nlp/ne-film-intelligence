const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const { parseDeadline, classifyDeadline } = require('../server/services/dateParser');
const { RoadmapService } = require('../server/services/roadmapService');
const { CalendarService } = require('../server/services/calendarService');
const { ReportService } = require('../server/services/reportService');
const { RelationshipService } = require('../server/services/relationshipService');
const { DashboardService } = require('../server/services/dashboardService');

const schemaSql = fs.readFileSync(path.join(__dirname, '..', 'server', 'db', 'schema.sql'), 'utf8');
const testDb = new DatabaseSync(':memory:');
testDb.exec(schemaSql);

// Seed minimal data for intelligence tests
testDb.exec(`
  INSERT INTO institutes (id, slug, title, country, region, summary, verification_status, publication_status, created_at, updated_at)
  VALUES ('inst_test', 'test-inst', 'Test Film Institute', 'India', 'india', 'Test institute', 'verified', 'published', datetime('now'), datetime('now'));
  INSERT INTO programs (id, slug, title, institute_id, category, country, region, summary, deadline, verification_status, publication_status, created_at, updated_at)
  VALUES ('prog_test', 'test-prog', 'Test MA Film', 'inst_test', 'General', 'Germany', 'europe', 'Test program', 'June 2026', 'verified', 'published', datetime('now'), datetime('now'));
  INSERT INTO opportunities (id, slug, title, type, org, country, region, summary, deadline, verification_status, publication_status, created_at, updated_at)
  VALUES ('opp_test', 'test-grant', 'Test Scholarship', 'scholarship', 'DAAD', 'Germany', 'europe', 'Test grant', '2026-08-15', 'pending', 'draft', datetime('now'), datetime('now'));
  INSERT INTO countries (id, slug, name, region, summary, publication_status, created_at, updated_at)
  VALUES ('ctry_germany', 'germany', 'Germany', 'europe', 'Tuition-free public universities', 'published', datetime('now'), datetime('now'));
`);

test.describe('CineEduAssan Phase 3 Intelligence Tests', () => {

  test.it('DateParser: parses and classifies deadlines', () => {
    const result = parseDeadline('2026-08-15');
    assert.strictEqual(result.deadline_date, '2026-08-15');
    assert.ok(['upcoming', 'closing_soon', 'this_month'].includes(result.deadline_status));

    const expired = classifyDeadline(new Date('2020-01-01'));
    assert.strictEqual(expired, 'expired');
  });

  test.it('RoadmapService: creates roadmap with ordered steps', () => {
    const uid = Date.now();
    const rm = RoadmapService.create({
      id: `rm_test_${uid}`, slug: `test-roadmap-${uid}`, title: 'Test Pathway',
      summary: 'A test filmmaker pathway', target_audience: 'Testers',
    });
    assert.ok(rm);
    RoadmapService.addStep(rm.id, { title: 'Step 1', summary: 'First step', step_order: 1, milestone_label: 'Start' });
    const step2 = RoadmapService.addStep(rm.id, { title: 'Step 2', summary: 'Second step', step_order: 2, milestone_label: 'Next' });
    const full = RoadmapService.get(rm.id);
    assert.strictEqual(full.steps.length, 2);
    assert.strictEqual(full.steps[0].step_order, 1);
  });

  test.it('CalendarService: syncs deadlines from entities', () => {
    const result = CalendarService.syncFromEntities();
    assert.ok(result.synced >= 1);
    const upcoming = CalendarService.list('upcoming');
    assert.ok(upcoming.total >= 0);
    const stats = CalendarService.getStats();
    assert.ok(stats.total >= 0);
  });

  test.it('ReportService: generates query-based report with sections', () => {
    const report = ReportService.generate('scholarships_added', { slug: `scholarships-test-${Date.now()}` });
    assert.ok(report);
    assert.ok(report.sections.length >= 1);
    assert.strictEqual(report.publication_status, 'draft');
    assert.ok(report.sections[0].content.length > 0);
  });

  test.it('RelationshipService: creates and traverses graph edges', () => {
    const rel = RelationshipService.create({
      from_type: 'country', from_id: 'ctry_germany',
      to_type: 'opportunity', to_id: 'opp_test',
      relationship_type: 'funds',
    });
    assert.ok(rel);
    const graph = RelationshipService.getGraph('country', 'ctry_germany', 1);
    assert.ok(graph.edges.length >= 1);
    assert.ok(graph.nodes.length >= 1);
  });

  test.it('DashboardService: returns real metrics from database', () => {
    const overview = DashboardService.getOverview();
    assert.ok(overview.total_opportunities >= 2);
    assert.ok(overview.institutes_covered >= 1);
    assert.ok(overview.countries_covered >= 1);
    assert.ok(overview.generated_at);
    assert.strictEqual(typeof overview.pending_reviews, 'number');
  });

  test.it('Schema: Phase 3 tables exist', () => {
    const tables = ['roadmaps', 'roadmap_steps', 'roadmap_resources', 'calendar_events',
      'reports', 'report_sections', 'countries', 'country_cost_profiles',
      'country_visa_notes', 'country_scholarship_notes', 'entity_relationships'];
    for (const t of tables) {
      const row = testDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(t);
      assert.ok(row, `Table ${t} should exist`);
    }
  });

  test.it('Config: roadmaps.json and countries.json are valid', () => {
    const roadmaps = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'server', 'config', 'roadmaps.json'), 'utf8'));
    const countries = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'server', 'config', 'countries.json'), 'utf8'));
    assert.ok(roadmaps.length >= 6);
    assert.ok(countries.length >= 6);
  });
});