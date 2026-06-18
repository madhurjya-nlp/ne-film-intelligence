const express = require('express');
const router = express.Router();
const { SourceRegistryService, SyncLogService } = require('../services/sourceRegistryService');
const { syncSource, syncAllActive, listPendingDiscoveries } = require('../ingestion/ingestionService');
const { listParserTypes } = require('../ingestion/parsers');
const { ingestionSourceSchema } = require('../services/validation');
const { TRUST_PRESETS } = require('../ingestion/trustModel');

const asyncRoute = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

router.get('/sources', asyncRoute(async (req, res) => {
  const sources = SourceRegistryService.list({
    active_status: req.query.active_status === 'false' ? false : undefined,
    parser_type: req.query.parser_type,
    category: req.query.category,
    search: req.query.search,
  });
  res.json({ total: sources.length, items: sources });
}));

router.get('/sources/:id', asyncRoute(async (req, res) => {
  const source = SourceRegistryService.get(req.params.id);
  if (!source) return res.status(404).json({ error: 'Source not found' });
  res.json(source);
}));

router.post('/sources', asyncRoute(async (req, res) => {
  const check = ingestionSourceSchema.safeParse(req.body);
  if (!check.success) return res.status(400).json({ errors: check.error.format() });
  const source = SourceRegistryService.create(check.data);
  res.status(201).json(source);
}));

router.put('/sources/:id', asyncRoute(async (req, res) => {
  const check = ingestionSourceSchema.partial().safeParse(req.body);
  if (!check.success) return res.status(400).json({ errors: check.error.format() });
  const source = SourceRegistryService.update(req.params.id, check.data);
  res.json(source);
}));

router.post('/sources/seed', asyncRoute(async (req, res) => {
  const result = SourceRegistryService.seedFromConfig();
  res.json({ success: true, ...result });
}));

router.get('/sync-logs', asyncRoute(async (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;
  const result = SyncLogService.list({
    source_id: req.query.source_id,
    status: req.query.status,
  }, limit, offset);
  res.json(result);
}));

router.get('/sync-logs/:id', asyncRoute(async (req, res) => {
  const log = SyncLogService.get(req.params.id);
  if (!log) return res.status(404).json({ error: 'Sync log not found' });
  res.json(log);
}));

router.post('/sync', asyncRoute(async (req, res) => {
  const { source_id } = req.body || {};

  if (source_id) {
    const log = await syncSource(source_id);
    return res.json({ success: true, mode: 'single', log });
  }

  const results = await syncAllActive();
  res.json({ success: true, mode: 'all', results });
}));

router.post('/sync/:sourceId', asyncRoute(async (req, res) => {
  const log = await syncSource(req.params.sourceId);
  res.json({ success: true, log });
}));

router.get('/discoveries', asyncRoute(async (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;
  const result = listPendingDiscoveries(limit, offset);
  res.json(result);
}));

router.get('/parsers', asyncRoute(async (req, res) => {
  res.json({ parsers: listParserTypes() });
}));

router.get('/trust-presets', asyncRoute(async (req, res) => {
  res.json(TRUST_PRESETS);
}));

module.exports = router;