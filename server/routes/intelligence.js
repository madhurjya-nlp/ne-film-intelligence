const express = require('express');
const router = express.Router();
const { RoadmapService } = require('../services/roadmapService');
const { CalendarService } = require('../services/calendarService');
const { ReportService } = require('../services/reportService');
const { CountryService } = require('../services/countryService');
const { RelationshipService } = require('../services/relationshipService');
const { DashboardService } = require('../services/dashboardService');

const asyncRoute = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ── DASHBOARD ──
router.get('/dashboard', asyncRoute(async (req, res) => {
  res.json(DashboardService.getOverview());
}));

// ── ROADMAPS ──
router.get('/roadmaps', asyncRoute(async (req, res) => {
  res.json(RoadmapService.list({
    publication_status: req.query.publication_status,
    search: req.query.search,
  }));
}));

router.get('/roadmaps/:id', asyncRoute(async (req, res) => {
  const rm = RoadmapService.get(req.params.id) || RoadmapService.getBySlug(req.params.id);
  if (!rm) return res.status(404).json({ error: 'Roadmap not found' });
  res.json(rm);
}));

router.post('/roadmaps', asyncRoute(async (req, res) => {
  const rm = RoadmapService.create(req.body);
  res.status(201).json(rm);
}));

router.post('/roadmaps/:id/publish', asyncRoute(async (req, res) => {
  res.json(RoadmapService.publish(req.params.id));
}));

router.post('/roadmaps/:id/steps', asyncRoute(async (req, res) => {
  const step = RoadmapService.addStep(req.params.id, req.body);
  res.status(201).json(step);
}));

router.post('/roadmaps/steps/:stepId/resources', asyncRoute(async (req, res) => {
  const resource = RoadmapService.addResource(req.params.stepId, req.body);
  res.status(201).json(resource);
}));

// ── CALENDAR ──
router.get('/calendar', asyncRoute(async (req, res) => {
  const view = req.query.view || 'all';
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;
  res.json(CalendarService.list(view, limit, offset));
}));

router.get('/calendar/stats', asyncRoute(async (req, res) => {
  res.json(CalendarService.getStats());
}));

router.post('/calendar/sync', asyncRoute(async (req, res) => {
  res.json({ success: true, ...CalendarService.syncFromEntities() });
}));

// ── REPORTS ──
router.get('/reports', asyncRoute(async (req, res) => {
  res.json(ReportService.list({
    report_type: req.query.report_type,
    publication_status: req.query.publication_status,
  }));
}));

router.get('/reports/types', asyncRoute(async (req, res) => {
  res.json(ReportService.getAvailableTypes());
}));

router.get('/reports/:id', asyncRoute(async (req, res) => {
  const report = ReportService.get(req.params.id);
  if (!report) return res.status(404).json({ error: 'Report not found' });
  res.json(report);
}));

router.post('/reports/generate', asyncRoute(async (req, res) => {
  const { report_type, title, slug } = req.body;
  if (!report_type) return res.status(400).json({ error: 'report_type is required' });
  const report = ReportService.generate(report_type, { title, slug });
  res.status(201).json(report);
}));

router.post('/reports/:id/publish', asyncRoute(async (req, res) => {
  res.json(ReportService.publish(req.params.id));
}));

// ── COUNTRIES ──
router.get('/countries', asyncRoute(async (req, res) => {
  const result = CountryService.list({
    region: req.query.region,
    publication_status: req.query.publication_status,
  });
  result.total = result.items.length;
  res.json(result);
}));

router.get('/countries/:id', asyncRoute(async (req, res) => {
  const country = CountryService.get(req.params.id);
  if (!country) return res.status(404).json({ error: 'Country not found' });
  res.json(country);
}));

router.post('/countries', asyncRoute(async (req, res) => {
  const country = CountryService.create(req.body);
  res.status(201).json(country);
}));

router.post('/countries/seed', asyncRoute(async (req, res) => {
  res.json({ success: true, ...CountryService.seedFromConfig() });
}));

// ── KNOWLEDGE GRAPH ──
router.get('/graph', asyncRoute(async (req, res) => {
  const { root_type, root_id, depth } = req.query;
  res.json(RelationshipService.getGraph(root_type, root_id, parseInt(depth) || 2));
}));

router.get('/relationships', asyncRoute(async (req, res) => {
  res.json(RelationshipService.list({
    from_type: req.query.from_type,
    to_type: req.query.to_type,
    relationship_type: req.query.relationship_type,
  }));
}));

router.post('/relationships', asyncRoute(async (req, res) => {
  const rel = RelationshipService.create(req.body);
  res.status(201).json(rel);
}));

router.post('/relationships/auto-link', asyncRoute(async (req, res) => {
  res.json({ success: true, ...RelationshipService.autoLinkFromEntities() });
}));

router.get('/relationships/types', asyncRoute(async (req, res) => {
  res.json(RelationshipService.getTypes());
}));

// ── INTELLIGENCE SEED ──
router.post('/seed', asyncRoute(async (req, res) => {
  const { seedIntelligence } = require('../db/seed-intelligence');
  res.json({ success: true, ...seedIntelligence() });
}));

module.exports = router;