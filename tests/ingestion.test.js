const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const { ingestionSourceSchema } = require('../server/services/validation');
const {
  resolveVerificationStatus,
  resolvePublicationStatus,
  resolveConfidenceScore,
  AUTO_VERIFY_THRESHOLD,
} = require('../server/ingestion/trustModel');
const { computeContentHash, normalizeRawRecord, finalizeRecord } = require('../server/ingestion/normalizer');
const { createParser, listParserTypes } = require('../server/ingestion/parsers');

const schemaSql = fs.readFileSync(path.join(__dirname, '..', 'server', 'db', 'schema.sql'), 'utf8');
const testDb = new DatabaseSync(':memory:');
testDb.exec(schemaSql);

test.describe('CineEduAssan Phase 2 Ingestion Tests', () => {

  test.it('Trust Model: official sources auto-verify but never auto-publish', () => {
    assert.strictEqual(resolveVerificationStatus(100), 'verified');
    assert.strictEqual(resolveVerificationStatus(100, { isDuplicate: true }), 'needs_review');
    assert.strictEqual(resolveVerificationStatus(95), 'pending');
    assert.strictEqual(resolveVerificationStatus(85), 'pending');
    assert.strictEqual(resolveVerificationStatus(0), 'needs_review');
    assert.strictEqual(resolvePublicationStatus(100), 'draft');
    assert.strictEqual(resolvePublicationStatus(50), 'draft');
    assert.ok(resolveConfidenceScore(100) >= 0.9);
    assert.strictEqual(AUTO_VERIFY_THRESHOLD, 100);
  });

  test.it('Validation: ingestion source schema accepts registry fields', () => {
    const source = {
      name: 'NFDC Film Bazaar',
      type: 'festival',
      url: 'https://filmbazaarindia.com',
      country: 'India',
      category: 'events',
      trust_level: 95,
      active_status: true,
      crawl_frequency: 'weekly',
      parser_type: 'festival',
      entity_type: 'event',
      parser_config: { eventType: 'co-production market' },
    };
    const check = ingestionSourceSchema.safeParse(source);
    assert.strictEqual(check.success, true);
  });

  test.it('Normalizer: computes stable content hash for incremental sync', () => {
    const source = {
      id: 'src_test',
      name: 'Test Source',
      country: 'India',
      category: 'grants',
      parser_config: { org: 'Test Org', region: 'india' },
    };

    const raw = {
      title: 'Documentary Development Grant',
      summary: 'Funding for NE India filmmakers',
      website_url: 'https://example.org/grant',
    };

    const normalized = finalizeRecord(normalizeRawRecord(raw, source, 'opportunity'));
    assert.ok(normalized.external_id);
    assert.ok(normalized.content_hash);
    assert.strictEqual(normalized.content_hash, computeContentHash(normalized));
  });

  test.it('Parser Registry: exposes adapter types without modifying core', () => {
    const types = listParserTypes();
    assert.ok(types.includes('daad'));
    assert.ok(types.includes('festival'));
    assert.ok(types.includes('university'));
    assert.ok(types.includes('generic'));

    const parser = createParser({
      id: 'src_x',
      name: 'Generic',
      url: 'https://example.com',
      parser_type: 'generic',
      parser_config: {},
    });
    assert.strictEqual(parser.parserType, 'base');
  });

  test.it('Schema: sync_logs and source_record_hashes tables exist', () => {
    const syncLogs = testDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='sync_logs'").get();
    const hashes = testDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='source_record_hashes'").get();
    assert.ok(syncLogs);
    assert.ok(hashes);

    const sourceCols = testDb.prepare('PRAGMA table_info(sources)').all().map((c) => c.name);
    assert.ok(sourceCols.includes('trust_level'));
    assert.ok(sourceCols.includes('parser_type'));
    assert.ok(sourceCols.includes('last_run_at'));
    assert.ok(sourceCols.includes('last_success_at'));
  });

  test.it('Config: sources.json is loadable and not empty', () => {
    const configPath = path.join(__dirname, '..', 'server', 'config', 'sources.json');
    const entries = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    assert.ok(Array.isArray(entries));
    assert.ok(entries.length >= 3);
    assert.ok(entries.every((e) => e.name && e.parser_type && e.trust_level !== undefined));
  });
});