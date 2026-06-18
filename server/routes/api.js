const express = require('express');
const router = express.Router();
const { 
  InstituteService, 
  ProgramService, 
  OpportunityService, 
  EventService, 
  SourceService, 
  SubmissionService, 
  ModerationService,
  BlogService,
  NewsletterService
} = require('../services/dbService');

const {
  instituteSchema,
  programSchema,
  opportunitySchema,
  eventSchema,
  sourceSchema,
  submissionSchema,
  reviewQueueSchema,
  blogPostSchema,
  newsletterSubscriberSchema
} = require('../services/validation');

// Helper for async routing error handling
const asyncRoute = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ── SOURCES ROUTES ──
router.get('/sources', asyncRoute(async (req, res) => {
  const sources = SourceService.list();
  res.json(sources);
}));

router.post('/sources', asyncRoute(async (req, res) => {
  const check = sourceSchema.safeParse(req.body);
  if (!check.success) return res.status(400).json({ errors: check.error.format() });
  
  const source = SourceService.create(check.data);
  res.status(201).json(source);
}));

// ── INSTITUTES ROUTES ──
router.get('/institutes', asyncRoute(async (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;
  const filters = {
    search: req.query.search,
    region: req.query.region,
    country: req.query.country,
    verification_status: req.query.verification_status,
    publication_status: req.query.publication_status
  };
  const result = InstituteService.list(filters, limit, offset);
  res.json(result);
}));

router.get('/institutes/:id', asyncRoute(async (req, res) => {
  const inst = InstituteService.get(req.params.id);
  if (!inst) return res.status(404).json({ error: 'Institute not found' });
  res.json(inst);
}));

router.post('/institutes', asyncRoute(async (req, res) => {
  const check = instituteSchema.safeParse(req.body);
  if (!check.success) return res.status(400).json({ errors: check.error.format() });
  
  const inst = InstituteService.create(check.data);
  res.status(201).json(inst);
}));

router.put('/institutes/:id', asyncRoute(async (req, res) => {
  const check = instituteSchema.partial().safeParse(req.body);
  if (!check.success) return res.status(400).json({ errors: check.error.format() });
  
  const inst = InstituteService.update(req.params.id, check.data);
  res.json(inst);
}));

router.delete('/institutes/:id', asyncRoute(async (req, res) => {
  InstituteService.delete(req.params.id);
  res.status(204).end();
}));

// ── PROGRAMS ROUTES ──
router.get('/programs', asyncRoute(async (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;
  const filters = {
    search: req.query.search,
    category: req.query.category,
    region: req.query.region,
    country: req.query.country,
    format: req.query.format,
    verification_status: req.query.verification_status,
    publication_status: req.query.publication_status,
    remote_or_online: req.query.remote_or_online !== undefined ? req.query.remote_or_online === 'true' || req.query.remote_or_online === '1' : undefined
  };
  const result = ProgramService.list(filters, limit, offset);
  res.json(result);
}));

router.get('/programs/:id', asyncRoute(async (req, res) => {
  const prog = ProgramService.get(req.params.id);
  if (!prog) return res.status(404).json({ error: 'Program not found' });
  res.json(prog);
}));

router.post('/programs', asyncRoute(async (req, res) => {
  const check = programSchema.safeParse(req.body);
  if (!check.success) return res.status(400).json({ errors: check.error.format() });
  
  const prog = ProgramService.create(check.data);
  res.status(201).json(prog);
}));

router.put('/programs/:id', asyncRoute(async (req, res) => {
  const check = programSchema.partial().safeParse(req.body);
  if (!check.success) return res.status(400).json({ errors: check.error.format() });
  
  const prog = ProgramService.update(req.params.id, check.data);
  res.json(prog);
}));

router.delete('/programs/:id', asyncRoute(async (req, res) => {
  ProgramService.delete(req.params.id);
  res.status(204).end();
}));

// ── OPPORTUNITIES ROUTES ──
router.get('/opportunities', asyncRoute(async (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;
  const filters = {
    search: req.query.search,
    type: req.query.type,
    region: req.query.region,
    country: req.query.country,
    format: req.query.format,
    verification_status: req.query.verification_status,
    publication_status: req.query.publication_status
  };
  const result = OpportunityService.list(filters, limit, offset);
  res.json(result);
}));

router.get('/opportunities/:id', asyncRoute(async (req, res) => {
  const opp = OpportunityService.get(req.params.id);
  if (!opp) return res.status(404).json({ error: 'Opportunity not found' });
  res.json(opp);
}));

router.post('/opportunities', asyncRoute(async (req, res) => {
  const check = opportunitySchema.safeParse(req.body);
  if (!check.success) return res.status(400).json({ errors: check.error.format() });
  
  const opp = OpportunityService.create(check.data);
  res.status(201).json(opp);
}));

router.put('/opportunities/:id', asyncRoute(async (req, res) => {
  const check = opportunitySchema.partial().safeParse(req.body);
  if (!check.success) return res.status(400).json({ errors: check.error.format() });
  
  const opp = OpportunityService.update(req.params.id, check.data);
  res.json(opp);
}));

router.delete('/opportunities/:id', asyncRoute(async (req, res) => {
  OpportunityService.delete(req.params.id);
  res.status(204).end();
}));

// ── EVENTS ROUTES ──
router.get('/events', asyncRoute(async (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;
  const filters = {
    search: req.query.search,
    type: req.query.type,
    region: req.query.region,
    country: req.query.country,
    format: req.query.format,
    verification_status: req.query.verification_status,
    publication_status: req.query.publication_status
  };
  const result = EventService.list(filters, limit, offset);
  res.json(result);
}));

router.get('/events/:id', asyncRoute(async (req, res) => {
  const ev = EventService.get(req.params.id);
  if (!ev) return res.status(404).json({ error: 'Event not found' });
  res.json(ev);
}));

router.post('/events', asyncRoute(async (req, res) => {
  const check = eventSchema.safeParse(req.body);
  if (!check.success) return res.status(400).json({ errors: check.error.format() });
  
  const ev = EventService.create(check.data);
  res.status(201).json(ev);
}));

router.put('/events/:id', asyncRoute(async (req, res) => {
  const check = eventSchema.partial().safeParse(req.body);
  if (!check.success) return res.status(400).json({ errors: check.error.format() });
  
  const ev = EventService.update(req.params.id, check.data);
  res.json(ev);
}));

router.delete('/events/:id', asyncRoute(async (req, res) => {
  EventService.delete(req.params.id);
  res.status(204).end();
}));

// ── SUBMISSIONS ROUTES ──
router.post('/submissions', asyncRoute(async (req, res) => {
  const check = submissionSchema.safeParse(req.body);
  if (!check.success) return res.status(400).json({ errors: check.error.format() });
  
  const sub = SubmissionService.create(check.data);
  res.status(201).json(sub);
}));

router.get('/submissions', asyncRoute(async (req, res) => {
  const list = SubmissionService.list(req.query.status);
  res.json(list);
}));

// ── MODERATION ROUTES ──
router.post('/moderation', asyncRoute(async (req, res) => {
  const { target_type, target_id, status, notes, reviewer_name } = req.body;
  if (!target_type || !target_id || !status) {
    return res.status(400).json({ error: 'target_type, target_id, and status are required' });
  }
  
  const result = ModerationService.moderate(target_type, target_id, status, notes, reviewer_name);
  res.json(result);
}));

router.get('/moderation/history', asyncRoute(async (req, res) => {
  const history = ModerationService.getReviewQueue(req.query.target_type, req.query.target_id);
  res.json(history);
}));

// ── SYNC STATIC DATA ROUTE ──
router.post('/sync', asyncRoute(async (req, res) => {
  const { execSync } = require('child_process');
  try {
    const syncScriptPath = require.resolve('../scripts/sync-static');
    const result = require('../scripts/sync-static').syncAll();
    res.json({ success: true, message: 'SQLite database exported successfully to static files', stats: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}));

// ── BLOG ROUTES ──
router.get('/blog', asyncRoute(async (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;
  const filters = {
    search: req.query.search,
    status: req.query.status,
    featured: req.query.featured !== undefined ? req.query.featured === 'true' || req.query.featured === '1' : undefined
  };
  const result = BlogService.list(filters, limit, offset);
  res.json(result);
}));

router.get('/blog/stats', asyncRoute(async (req, res) => {
  const stats = BlogService.getStats();
  res.json(stats);
}));

router.get('/blog/:id', asyncRoute(async (req, res) => {
  const post = BlogService.get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Blog post not found' });
  res.json(post);
}));

router.post('/blog', asyncRoute(async (req, res) => {
  const check = blogPostSchema.safeParse(req.body);
  if (!check.success) return res.status(400).json({ errors: check.error.format() });

  const post = BlogService.create(check.data);
  res.status(201).json(post);
}));

router.put('/blog/:id', asyncRoute(async (req, res) => {
  const check = blogPostSchema.partial().safeParse(req.body);
  if (!check.success) return res.status(400).json({ errors: check.error.format() });

  const post = BlogService.update(req.params.id, check.data);
  res.json(post);
}));

router.delete('/blog/:id', asyncRoute(async (req, res) => {
  BlogService.delete(req.params.id);
  res.status(204).end();
}));

// ── NEWSLETTER ROUTES ──
router.post('/newsletter/subscribe', asyncRoute(async (req, res) => {
  const check = newsletterSubscriberSchema.safeParse(req.body);
  if (!check.success) return res.status(400).json({ errors: check.error.format() });

  const sub = NewsletterService.subscribe(check.data.email);
  res.status(201).json(sub);
}));

router.get('/newsletter/subscribers', asyncRoute(async (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;
  const result = NewsletterService.list(limit, offset);
  res.json(result);
}));

// ── COVERAGE & HEALTH ADMIN ROUTES (PHASE 6) ──
const { CoverageService } = require('../services/coverageService');

router.get('/coverage/dashboard', asyncRoute(async (req, res) => {
  res.json(CoverageService.getCoverageDashboard());
}));

router.get('/audit/dashboard', asyncRoute(async (req, res) => {
  res.json(CoverageService.getAuditMetrics());
}));

router.get('/sources/health', asyncRoute(async (req, res) => {
  res.json(CoverageService.getSourceHealthDashboard());
}));

router.post('/sources/:id/check-link', asyncRoute(async (req, res) => {
  const { url, statusCode, responseTime } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });
  const result = CoverageService.logLinkCheck(req.params.id, url, statusCode || 200, responseTime || 100);
  res.json(result);
}));

router.get('/contributor/submissions', asyncRoute(async (req, res) => {
  const status = req.query.status || null;
  res.json(CoverageService.listSubmissions(status));
}));

router.post('/contributor/submissions/:id/moderate', asyncRoute(async (req, res) => {
  const { status, notes, reviewerName } = req.body;
  if (!status || !['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Valid status (approved or rejected) is required' });
  }
  const result = CoverageService.moderateSubmission(req.params.id, status, notes || '', reviewerName || 'Admin Reviewer');
  res.json(result);
}));

router.get('/candidates', asyncRoute(async (req, res) => {
  res.json(CoverageService.listCandidates());
}));

router.post('/candidates/:id/moderate', asyncRoute(async (req, res) => {
  const { status, parserType } = req.body;
  if (!status || !['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Valid status is required' });
  }
  if (status === 'approved') {
    const result = CoverageService.approveCandidate(req.params.id, parserType || 'generic');
    res.json(result);
  } else {
    const result = CoverageService.rejectCandidate(req.params.id);
    res.json(result);
  }
}));

router.post('/candidates/scan', asyncRoute(async (req, res) => {
  const { sourceId } = req.body;
  if (!sourceId) return res.status(400).json({ error: 'sourceId is required' });
  const count = CoverageService.discoverCandidatesFromSource(sourceId);
  res.json({ success: true, count });
}));

module.exports = router;

