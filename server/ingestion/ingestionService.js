const { run, queryOne, queryAll } = require('../db/db');
const {
  InstituteService,
  ProgramService,
  OpportunityService,
  EventService,
} = require('../services/dbService');
const { SourceRegistryService, SyncLogService } = require('../services/sourceRegistryService');
const { createParser } = require('./parsers');
const { normalizeRawRecord, finalizeRecord } = require('./normalizer');
const {
  resolveVerificationStatus,
  resolvePublicationStatus,
  resolveConfidenceScore,
} = require('./trustModel');
const {
  instituteSchema,
  programSchema,
  opportunitySchema,
  eventSchema,
} = require('../services/validation');

function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function slugify(text) {
  return String(text || 'untitled')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

function getValidator(entityType) {
  if (entityType === 'program') return programSchema;
  if (entityType === 'opportunity') return opportunitySchema;
  if (entityType === 'event') return eventSchema;
  if (entityType === 'institute') return instituteSchema;
  return null;
}

function findDuplicate(table, title, websiteUrl) {
  if (websiteUrl) {
    return queryOne(
      `SELECT id FROM ${table} WHERE title = ? OR website_url = ?`,
      [title, websiteUrl]
    );
  }
  return queryOne(`SELECT id FROM ${table} WHERE title = ?`, [title]);
}

function getOrCreateInstitute(name, defaults = {}) {
  const slug = slugify(name);
  const instId = 'inst_' + slug.slice(0, 40);
  const existing = queryOne(`SELECT id FROM institutes WHERE slug = ? OR title = ?`, [slug, name]);
  if (existing) return existing.id;

  const created = InstituteService.create({
    id: instId,
    title: name,
    country: defaults.country || 'Unknown',
    region: defaults.region || 'online',
    summary: `Auto-created institute from ingestion: ${name}`,
    website_url: defaults.website_url || null,
    verification_status: 'pending',
    publication_status: 'draft',
  });
  return created.id;
}

function getHashRecord(sourceId, externalId) {
  return queryOne(
    `SELECT * FROM source_record_hashes WHERE source_id = ? AND external_id = ?`,
    [sourceId, externalId]
  );
}

function upsertHash(sourceId, externalId, contentHash, entityType, entityId) {
  const now = new Date().toISOString();
  run(
    `INSERT INTO source_record_hashes (source_id, external_id, content_hash, entity_type, entity_id, last_seen_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(source_id, external_id) DO UPDATE SET
       content_hash = excluded.content_hash,
       entity_id = excluded.entity_id,
       last_seen_at = excluded.last_seen_at`,
    [sourceId, externalId, contentHash, entityType, entityId, now]
  );
}

function buildEntityPayload(record, source, entityType, duplicate) {
  const trustLevel = source.trust_level ?? 50;
  const verificationStatus = resolveVerificationStatus(trustLevel, { isDuplicate: !!duplicate });
  const publicationStatus = resolvePublicationStatus(trustLevel);
  const confidenceScore = resolveConfidenceScore(trustLevel, !!duplicate);

  const common = {
    title: record.title,
    summary: record.summary,
    description: record.description,
    country: record.country,
    region: record.region,
    city: record.city,
    format: record.format,
    remote_or_online: record.remote_or_online,
    deadline: record.deadline,
    duration: record.duration,
    eligibility: record.eligibility,
    website_url: record.website_url,
    application_url: record.application_url,
    source_id: source.id,
    verification_status: verificationStatus,
    publication_status: publicationStatus,
    confidence_score: confidenceScore,
    duplicate_of_id: duplicate ? duplicate.id : null,
    tags: record.tags,
  };

  if (entityType === 'program') {
    const instituteId = record.institute_id || getOrCreateInstitute(record.institute_name || source.name, record);
    return {
      ...common,
      institute_id: instituteId,
      category: record.category || 'General',
      subcategory: record.subcategory,
      tuition_or_cost: record.tuition_or_cost,
    };
  }

  if (entityType === 'opportunity') {
    return {
      ...common,
      type: record.type || 'grant',
      subcategory: record.subcategory,
      org: record.org || source.name,
      amount: record.amount,
      funding_info: record.funding_info,
    };
  }

  if (entityType === 'event') {
    return {
      ...common,
      type: record.type || 'other',
      subcategory: record.subcategory,
    };
  }

  return common;
}

function persistRecord(payload, entityType, existingEntityId) {
  if (existingEntityId) {
    if (entityType === 'program') return ProgramService.update(existingEntityId, payload);
    if (entityType === 'opportunity') return OpportunityService.update(existingEntityId, payload);
    if (entityType === 'event') return EventService.update(existingEntityId, payload);
    if (entityType === 'institute') return InstituteService.update(existingEntityId, payload);
  }

  if (entityType === 'program') return ProgramService.create(payload);
  if (entityType === 'opportunity') return OpportunityService.create(payload);
  if (entityType === 'event') return EventService.create(payload);
  if (entityType === 'institute') return InstituteService.create(payload);
  throw new Error(`Unsupported entity type: ${entityType}`);
}

function logDiscovery(targetType, targetId, status, sourceName) {
  const logId = 'mod_' + generateId();
  run(
    `INSERT INTO review_queue (id, target_type, target_id, status, reviewer_notes, updated_by, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      logId,
      targetType,
      targetId,
      status,
      `Discovered via ingestion from ${sourceName}`,
      'Ingestion Pipeline',
      new Date().toISOString(),
    ]
  );
}

async function processRecord(rawRecord, source) {
  const entityType = source.entity_type || 'opportunity';
  const normalized = finalizeRecord(normalizeRawRecord(rawRecord, source, entityType));
  const stats = { inserted: 0, updated: 0, rejected: 0, skipped: 0 };

  const hashRow = getHashRecord(source.id, normalized.external_id);
  if (hashRow && hashRow.content_hash === normalized.content_hash) {
    upsertHash(source.id, normalized.external_id, normalized.content_hash, entityType, hashRow.entity_id);
    stats.skipped = 1;
    return stats;
  }

  const tableMap = {
    program: 'programs',
    opportunity: 'opportunities',
    event: 'events',
    institute: 'institutes',
  };
  const table = tableMap[entityType];
  const duplicate = findDuplicate(table, normalized.title, normalized.website_url);
  const payload = buildEntityPayload(normalized, source, entityType, duplicate);

  const validator = getValidator(entityType);
  const check = validator.safeParse(payload);
  if (!check.success) {
    stats.rejected = 1;
    return stats;
  }

  const saved = persistRecord(check.data, entityType, hashRow?.entity_id);
  upsertHash(source.id, normalized.external_id, normalized.content_hash, entityType, saved.id);
  logDiscovery(entityType, saved.id, saved.verification_status, source.name);

  if (hashRow?.entity_id) {
    stats.updated = 1;
  } else {
    stats.inserted = 1;
  }

  return stats;
}

async function syncSource(sourceId) {
  const source = SourceRegistryService.get(sourceId);
  if (!source) throw new Error(`Source not found: ${sourceId}`);
  if (!source.active_status) throw new Error(`Source is inactive: ${sourceId}`);

  const syncLog = SyncLogService.start(sourceId);
  const aggregate = {
    records_found: 0,
    records_inserted: 0,
    records_updated: 0,
    records_rejected: 0,
    error_count: 0,
    error_message: null,
  };

  try {
    const parser = createParser(source);
    const rawRecords = await parser.parse();
    aggregate.records_found = rawRecords.length;

    for (const raw of rawRecords) {
      try {
        const result = await processRecord(raw, source);
        aggregate.records_inserted += result.inserted || 0;
        aggregate.records_updated += result.updated || 0;
        aggregate.records_rejected += result.rejected || 0;
      } catch (err) {
        aggregate.error_count += 1;
        aggregate.error_message = err.message;
      }
    }

    SourceRegistryService.markRunComplete(sourceId, { success: aggregate.error_count === 0 });
    return SyncLogService.complete(syncLog.id, aggregate);
  } catch (err) {
    aggregate.error_count += 1;
    aggregate.error_message = err.message;
    SourceRegistryService.markRunComplete(sourceId, { success: false, errorMessage: err.message });
    return SyncLogService.complete(syncLog.id, aggregate);
  }
}

async function syncAllActive() {
  const sources = SourceRegistryService.getActiveSources();
  const results = [];

  for (const source of sources) {
    try {
      const log = await syncSource(source.id);
      results.push({ source_id: source.id, source_name: source.name, success: true, log });
    } catch (err) {
      results.push({ source_id: source.id, source_name: source.name, success: false, error: err.message });
    }
  }

  return results;
}

function listPendingDiscoveries(limit = 50, offset = 0) {
  const tables = [
    { type: 'program', table: 'programs' },
    { type: 'opportunity', table: 'opportunities' },
    { type: 'event', table: 'events' },
    { type: 'institute', table: 'institutes' },
  ];

  const items = [];

  for (const { type, table } of tables) {
    const rows = queryAll(
      `SELECT p.*, s.name as source_name, s.trust_level
       FROM ${table} p
       LEFT JOIN sources s ON s.id = p.source_id
       WHERE p.verification_status IN ('pending', 'needs_review')
         AND p.source_id IS NOT NULL
         AND p.source_id != 'src_system'
       ORDER BY p.created_at DESC
       LIMIT ?`,
      [limit]
    );

    rows.forEach((row) => {
      items.push({ ...row, entity_type: type });
    });
  }

  items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return {
    total: items.length,
    items: items.slice(offset, offset + limit),
  };
}

module.exports = {
  processRecord,
  syncSource,
  syncAllActive,
  listPendingDiscoveries,
};