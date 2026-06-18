const express = require('express');
const router = express.Router();
const { PublicService } = require('../services/publicService');
const { ExplorerService } = require('../services/explorerService');
const { SearchService } = require('../services/searchService');

const asyncRoute = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

router.get('/home', asyncRoute(async (req, res) => {
  res.json(PublicService.getHomepage());
}));

router.get('/roadmaps', asyncRoute(async (req, res) => {
  res.json(PublicService.listRoadmaps({ search: req.query.search, audience: req.query.audience }));
}));

router.get('/roadmaps/:slug', asyncRoute(async (req, res) => {
  const rm = PublicService.getRoadmapBySlug(req.params.slug);
  if (!rm) return res.status(404).json({ error: 'Roadmap not found' });
  res.json(rm);
}));

router.get('/calendar', asyncRoute(async (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;
  res.json(PublicService.listCalendar({
    view: req.query.view || 'all',
    limit, offset,
    category: req.query.category,
  }));
}));

router.get('/countries', asyncRoute(async (req, res) => {
  res.json(PublicService.listCountries({
    search: req.query.search,
    region: req.query.region,
    cost_band: req.query.cost_band,
  }));
}));

router.get('/countries/:slug', asyncRoute(async (req, res) => {
  const c = PublicService.getCountryBySlug(req.params.slug);
  if (!c) return res.status(404).json({ error: 'Country not found' });
  res.json(c);
}));

router.get('/explore', asyncRoute(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const filters = {
    search: req.query.search,
    country: req.query.country,
    region: req.query.region,
    format: req.query.format,
    budget: req.query.budget,
    category: req.query.category,
    scholarship: req.query.scholarship,
    deadline_status: req.query.deadline_status,
    type: req.query.type,
  };
  const result = ExplorerService.explore(filters, req.query.sort || 'newest', page, limit);
  result.total_all = ExplorerService.count(filters);
  res.json(result);
}));

router.get('/reports', asyncRoute(async (req, res) => {
  res.json(PublicService.listReports({ search: req.query.search, report_type: req.query.report_type }));
}));

router.get('/reports/:slug', asyncRoute(async (req, res) => {
  const r = PublicService.getReportBySlug(req.params.slug);
  if (!r) return res.status(404).json({ error: 'Report not found' });
  res.json(r);
}));

router.get('/relationships', asyncRoute(async (req, res) => {
  res.json(PublicService.getRelationships({
    root_type: req.query.root_type,
    root_id: req.query.root_id,
    limit: parseInt(req.query.limit) || 80,
  }));
}));

router.get('/relationships/:type/:id', asyncRoute(async (req, res) => {
  const detail = PublicService.getEntityDetail(req.params.type, req.params.id);
  if (!detail) return res.status(404).json({ error: 'Entity not found' });
  res.json(detail);
}));

router.get('/search', asyncRoute(async (req, res) => {
  res.json(SearchService.search(req.query.q, { limit: parseInt(req.query.limit) || 8 }));
}));

router.get('/sitemap-data', asyncRoute(async (req, res) => {
  const base = `${req.protocol}://${req.get('host')}`;
  res.json(PublicService.getSitemapUrls(base));
}));

router.get('/blog', asyncRoute(async (req, res) => {
  res.json(PublicService.getBlogPosts({ search: req.query.search }));
}));

router.get('/blog/:slug', asyncRoute(async (req, res) => {
  const post = PublicService.getBlogPostBySlug(req.params.slug);
  if (!post) return res.status(404).json({ error: 'Blog post not found' });
  res.json(post);
}));

const { CoverageService } = require('../services/coverageService');

router.post('/contribute', asyncRoute(async (req, res) => {
  const { name, email, organization, submission_type, payload } = req.body;
  if (!name || !email || !submission_type || !payload) {
    return res.status(400).json({ error: 'Name, email, submission_type, and payload are required' });
  }
  const result = CoverageService.submitContributorRecord({
    name, email, organization, submission_type, payload
  });
  res.status(201).json(result);
}));

router.get('/categories', asyncRoute(async (req, res) => {
  const { queryAll } = require('../db/db');
  const categories = queryAll('SELECT id, name, slug FROM category_taxonomy ORDER BY name ASC');
  res.json(categories);
}));

module.exports = router;