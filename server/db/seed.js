const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { run, queryOne, transaction } = require('./db');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const PROGRAMS_FILE = path.join(DATA_DIR, 'programs.js');
const GRANTS_FILE = path.join(DATA_DIR, 'grants.js');
const EVENTS_FILE = path.join(DATA_DIR, 'events.js');

// Utility to generate UUID-like IDs if needed (fallback)
function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Utility to generate a slug from text
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')       // Replace spaces with -
    .replace(/[^\w\-]+/g, '')   // Remove all non-word chars
    .replace(/\-\-+/g, '-')     // Replace multiple - with single -
    .replace(/^-+/, '')         // Trim - from start
    .replace(/-+$/, '');        // Trim - from end
}

// Load data using the VM module
function loadStaticData(filePath, globalVarName) {
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return [];
  }
  const content = fs.readFileSync(filePath, 'utf8');
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(content, sandbox);
  return sandbox.window[globalVarName] || [];
}

function seedDatabase() {
  console.log('[Seeding] Starting database seeding from static files...');

  const programsData = loadStaticData(PROGRAMS_FILE, 'FILM_PATH_PROGRAMS');
  const grantsData = loadStaticData(GRANTS_FILE, 'FILM_PATH_GRANTS');
  const eventsData = loadStaticData(EVENTS_FILE, 'FILM_PATH_EVENTS');

  console.log(`[Seeding] Loaded data counts:`);
  console.log(` - Programs: ${programsData.length}`);
  console.log(` - Grants (Opportunities): ${grantsData.length}`);
  console.log(` - Events: ${eventsData.length}`);

  transaction(() => {
    // 1. Create default system source
    const sysSourceId = 'src_system';
    run(
      `INSERT OR IGNORE INTO sources (id, name, type, url, last_checked_at, discovered_at, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sysSourceId,
        'Static Seeder Source',
        'system',
        'http://localhost/seeder',
        new Date().toISOString(),
        new Date().toISOString(),
        new Date().toISOString(),
        new Date().toISOString()
      ]
    );

    // Helper to insert tags and build relations
    function associateTags(entityType, entityId, tags) {
      if (!tags || !Array.isArray(tags)) return;
      
      for (const tagName of tags) {
        const cleanTagName = tagName.trim().toLowerCase();
        if (!cleanTagName) continue;
        
        const tagId = 'tag_' + slugify(cleanTagName);
        
        // Insert tag if it doesn't exist
        run(`INSERT OR IGNORE INTO tags (id, name) VALUES (?, ?)`, [tagId, cleanTagName]);
        
        // Insert relation
        run(
          `INSERT OR IGNORE INTO entity_tags (entity_type, entity_id, tag_id) VALUES (?, ?, ?)`,
          [entityType, entityId, tagId]
        );
      }
    }

    // 2. Seed Institutes and Programs
    programsData.forEach(p => {
      const instTitle = p.institution || 'Unknown Institution';
      const instId = 'inst_' + slugify(instTitle);
      const instSlug = slugify(instTitle);

      // Extract details
      const details = p.details || {};
      const dataAttrs = p.dataAttrs || {};

      // Insert Institute
      run(
        `INSERT OR IGNORE INTO institutes (id, slug, title, country, region, city, website_url, summary, description, verification_status, publication_status, confidence_score, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          instId,
          instSlug,
          instTitle,
          p.country || 'Unknown',
          dataAttrs.category || 'india',
          p.country ? p.country.split(',')[0].trim() : '',
          p.link || '',
          p.body || instTitle,
          `Seeded from program database. Cost: ${details.cost || 'N/A'}. Online/Flex: ${details.online || 'N/A'}.`,
          'verified',
          'published',
          1.0,
          new Date().toISOString(),
          new Date().toISOString()
        ]
      );

      // Insert Program
      const progId = p.id || 'prog_' + generateId();
      const progSlug = p.id || slugify(p.title);
      
      // Combine eligibility and details for programs
      const description = `
${p.body}
---
Online / Flex: ${details.online || ''}
Network, Knowledge, Infra Value: ${details.value || ''}
Next Step: ${details.next || ''}
      `.trim();

      const format = dataAttrs.format ? 
        (dataAttrs.format.includes('online') ? 'online' : 
         dataAttrs.format.includes('hybrid') ? 'hybrid' : 'offline') : 'offline';
      
      const remoteOrOnline = (format === 'online' || (details.online && details.online.toLowerCase().includes('100% remote'))) ? 1 : 0;

      run(
        `INSERT OR IGNORE INTO programs (
          id, slug, title, institute_id, category, subcategory, country, region, city, 
          remote_or_online, format, summary, description, eligibility, tuition_or_cost, 
          duration, deadline, application_url, website_url, source_id, 
          verification_status, publication_status, confidence_score, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          progId,
          progSlug,
          p.title || instTitle,
          instId,
          dataAttrs.focus || 'General',
          dataAttrs.focus ? dataAttrs.focus.split(' ')[0] : null,
          p.country || 'Unknown',
          dataAttrs.category || 'india',
          p.country ? p.country.split(',')[0].trim() : '',
          remoteOrOnline,
          format,
          p.body || '',
          description,
          details.assam || 'ST status benefits applicable.',
          details.cost || p.band || '0-3L',
          p.meta ? (p.meta.includes('•') ? p.meta.split('•')[1].trim() : p.meta) : '3 years',
          details.next ? details.next.split('deadline')[1]?.trim() || null : null,
          p.link || '',
          p.link || '',
          sysSourceId,
          'verified',
          'published',
          1.0,
          new Date().toISOString(),
          new Date().toISOString()
        ]
      );

      // Seed tags
      const tags = dataAttrs.focus ? dataAttrs.focus.split(' ') : [];
      if (dataAttrs.stEligible === 'yes') tags.push('st-eligible');
      associateTags('program', progId, tags);
    });

    // 3. Seed Opportunities (Grants)
    grantsData.forEach(g => {
      const oppId = g.id || 'opp_' + generateId();
      const oppSlug = g.id || slugify(g.title);

      const format = g.tags && g.tags.includes('online') ? 'online' : 'offline';
      const remoteOrOnline = format === 'online' ? 1 : 0;

      const description = `
Host Organization: ${g.org}
Amount: ${g.amount}
NE India Notes: ${g.ne_notes || ''}
      `.trim();

      run(
        `INSERT OR IGNORE INTO opportunities (
          id, slug, title, type, subcategory, org, amount, country, region, city, 
          remote_or_online, format, summary, description, eligibility, funding_info, 
          duration, deadline, application_url, website_url, source_id, 
          verification_status, publication_status, confidence_score, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          oppId,
          oppSlug,
          g.title,
          'grant',
          g.category || 'international',
          g.org,
          g.amount,
          'Global',
          g.category || 'international',
          '',
          remoteOrOnline,
          format,
          g.ne_notes || g.title,
          description,
          g.eligibility || 'Open to Indian/Assam applicants',
          g.amount,
          'N/A',
          g.deadline,
          g.url,
          g.url,
          sysSourceId,
          'verified',
          'published',
          1.0,
          new Date().toISOString(),
          new Date().toISOString()
        ]
      );

      associateTags('opportunity', oppId, g.tags);
    });

    // 4. Seed Events
    eventsData.forEach(e => {
      const evId = e.id || 'ev_' + generateId();
      const evSlug = e.id || slugify(e.title);

      const format = e.tags && e.tags.includes('online') ? 'online' : 'offline';
      const remoteOrOnline = format === 'online' ? 1 : 0;

      const description = `
Cost: ${e.cost}
NE Relevance: ${e.ne_relevance || ''}
      `.trim();

      run(
        `INSERT OR IGNORE INTO events (
          id, slug, title, type, subcategory, country, region, city, 
          remote_or_online, format, summary, description, eligibility, 
          duration, deadline, application_url, website_url, source_id, 
          verification_status, publication_status, confidence_score, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          evId,
          evSlug,
          e.title,
          e.type && e.type.toLowerCase().includes('festival') ? 'festival' : 
          (e.type && e.type.toLowerCase().includes('market') ? 'co-production market' : 'pitch forum'),
          e.category || 'labs',
          'Global',
          e.category || 'labs',
          '',
          remoteOrOnline,
          format,
          e.ne_relevance || e.title,
          description,
          e.eligibility || 'Open to filmmakers',
          'N/A',
          e.when || 'Annual',
          e.url,
          e.url,
          sysSourceId,
          'verified',
          'published',
          1.0,
          new Date().toISOString(),
          new Date().toISOString()
        ]
      );

      associateTags('event', evId, e.tags);
    });
  });

  console.log('[Seeding] Finished seeding database successfully.');
  try {
    const { seedBlogPosts } = require('./seed-blog');
    seedBlogPosts();
  } catch (err) {
    console.error('[Seeding] Failed to run blog seed during database seed:', err);
  }
}

// Check if we are running this script directly
if (require.main === module) {
  try {
    seedDatabase();
  } catch (err) {
    console.error('[Seeding] Error seeding database:', err);
    process.exit(1);
  }
}

module.exports = { seedDatabase };
