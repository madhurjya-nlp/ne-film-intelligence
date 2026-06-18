const crypto = require('crypto');

function slugify(text) {
  return String(text || 'untitled')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

function makeExternalId(record) {
  const key = [record.title, record.website_url || record.application_url || ''].join('|');
  return crypto.createHash('sha256').update(key).digest('hex').slice(0, 16);
}

function computeContentHash(record) {
  const stable = {
    title: record.title,
    summary: record.summary,
    description: record.description,
    deadline: record.deadline,
    website_url: record.website_url,
    application_url: record.application_url,
    amount: record.amount,
    tuition_or_cost: record.tuition_or_cost,
    eligibility: record.eligibility,
  };
  return crypto.createHash('sha256').update(JSON.stringify(stable)).digest('hex');
}

function normalizeUrl(baseUrl, href) {
  if (!href) return null;
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return null;
  }
}

function normalizeRawRecord(raw, source, entityType) {
  const config = source.parser_config || {};
  const now = new Date().toISOString();

  const base = {
    title: String(raw.title || '').trim(),
    summary: String(raw.summary || raw.title || '').trim().slice(0, 500),
    description: raw.description ? String(raw.description).trim() : null,
    country: raw.country || config.country || source.country || 'Global',
    region: raw.region || config.region || 'online',
    city: raw.city || null,
    format: raw.format || 'offline',
    remote_or_online: raw.remote_or_online || 0,
    deadline: raw.deadline || null,
    duration: raw.duration || null,
    eligibility: raw.eligibility || null,
    website_url: raw.website_url || null,
    application_url: raw.application_url || raw.website_url || null,
    source_id: source.id,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    external_id: raw.external_id || makeExternalId(raw),
    content_hash: null,
    discovered_at: now,
  };

  if (entityType === 'program') {
    return {
      ...base,
      institute_id: raw.institute_id,
      institute_name: raw.institute_name || config.instituteName,
      category: raw.category || config.category || 'General',
      subcategory: raw.subcategory || null,
      tuition_or_cost: raw.tuition_or_cost || raw.cost || null,
    };
  }

  if (entityType === 'opportunity') {
    return {
      ...base,
      type: raw.type || config.type || 'grant',
      subcategory: raw.subcategory || source.category || null,
      org: raw.org || config.org || source.name,
      amount: raw.amount || null,
      funding_info: raw.funding_info || raw.amount || null,
    };
  }

  if (entityType === 'event') {
    return {
      ...base,
      type: raw.type || config.eventType || 'other',
      subcategory: raw.subcategory || source.category || null,
    };
  }

  if (entityType === 'institute') {
    return {
      title: base.title,
      summary: base.summary,
      description: base.description,
      country: base.country,
      region: base.region,
      city: base.city,
      website_url: base.website_url,
      source_id: source.id,
      external_id: base.external_id,
      content_hash: null,
      discovered_at: now,
    };
  }

  return base;
}

function finalizeRecord(record) {
  record.content_hash = computeContentHash(record);
  return record;
}

module.exports = {
  slugify,
  makeExternalId,
  computeContentHash,
  normalizeUrl,
  normalizeRawRecord,
  finalizeRecord,
};