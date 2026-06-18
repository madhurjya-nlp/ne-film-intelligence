const { run, queryOne, transaction } = require('./db');

// Sample programs to insert under the new categories
const SAMPLE_PROGRAMS = [
  { id: 'prog_rada_acting_ba', title: 'BA (Hons) in Acting', institute_id: 'inst_rada', source_id: 'src_rada_acting', category: 'acting', country: 'United Kingdom', tuition_or_cost: '£22,000/yr', duration: '3 years' },
  { id: 'prog_lamda_mfa', title: 'MFA Professional Acting', institute_id: 'inst_lamda', source_id: 'src_lamda_acting', category: 'acting', country: 'United Kingdom', tuition_or_cost: '£25,000/yr', duration: '2 years' },
  { id: 'prog_nfts_cinematography_ma', title: 'MA in Cinematography', institute_id: 'inst_nfts', source_id: 'src_nfts_cinematography', category: 'cinematography', country: 'United Kingdom', tuition_or_cost: '£32,000/yr', duration: '2 years' },
  { id: 'prog_afi_cinematography_mfa', title: 'MFA in Cinematography', institute_id: 'inst_afi', source_id: 'src_afi_cinematography', category: 'cinematography', country: 'United States', tuition_or_cost: 'Premium', duration: '2 years' },
  { id: 'prog_gobelins_character', title: 'Master of Arts in Character Animation', institute_id: 'inst_gobelins', source_id: 'src_gobelins_animation', category: 'animation', country: 'France', tuition_or_cost: '€14,000/yr', duration: '2 years' },
  { id: 'prog_nfts_sound_ma', title: 'MA in Sound Design for Film and Television', institute_id: 'inst_nfts', source_id: 'src_nfts_sound', category: 'sound-design', country: 'United Kingdom', tuition_or_cost: '£30,000/yr', duration: '2 years' }
];

const SAMPLE_OPPORTUNITIES = [
  { id: 'opp_sundance_fellowship', title: 'Sundance Screenwriters Fellowship', type: 'fellowship', org: 'Sundance Institute', amount: '$10,000 stipend', category: 'screenwriting', country: 'United States', deadline: '2026-09-15' },
  { id: 'opp_torino_development', title: 'TorinoFilmLab Script Development Grant', type: 'grant', org: 'TorinoFilmLab', amount: '€8,000', category: 'screenwriting', country: 'Italy', deadline: '2026-10-01' },
  { id: 'opp_idfa_bertha_doc', title: 'IDFA Bertha Fund Classic', type: 'grant', org: 'IDFA Bertha Fund', amount: '€17,500', category: 'documentary', country: 'Netherlands', deadline: '2026-08-10' },
  { id: 'opp_eave_producers_sch', title: 'EAVE Scholarship for Emerging Producers', type: 'scholarship', org: 'EAVE', amount: 'Full tuition waiver', category: 'producing', country: 'Luxembourg', deadline: '2026-11-20' }
];

const SAMPLE_EVENTS = [
  { id: 'ev_berlinale_critics_c', title: 'Berlinale Talents: Critics Campus', type: 'festival', country: 'Germany', category: 'film-criticism', summary: 'Workshop for young film critics and journalists' },
  { id: 'ev_docs_sea_pitch', title: 'Docs By The Sea Pitching Forum', type: 'pitch forum', country: 'Indonesia', category: 'documentary', summary: 'International forum for documentary pitches' }
];

const SAMPLE_BOOKS = [
  { id: 'bk_film_sound_altman', slug: 'film-sound-altman', title: 'Film Sound: Theory and Practice', author: 'Rick Altman', category: 'sound-design', summary: 'A comprehensive reader on theory of film sound.', ne_relevance: 'Highly recommended reference for local soundscapes.' },
  { id: 'bk_directing_actors_west', slug: 'directing-actors-west', title: 'Directing Actors', author: 'Judith Weston', category: 'acting', summary: 'Essential reading for directors working with cast.', ne_relevance: 'Useful for working with tribal/indigenous actors.' }
];

function seedCoverageData() {
  console.log('[Coverage Seed] Starting sample coverage data seeding...');
  let programsCount = 0;
  let opportunitiesCount = 0;
  let eventsCount = 0;
  let booksCount = 0;
  let linksCount = 0;

  const now = new Date().toISOString();

  transaction(() => {
    // 1. Seed Institutes for programs
    const institutes = [
      { id: 'inst_rada', slug: 'rada', title: 'Royal Academy of Dramatic Art', country: 'United Kingdom', region: 'europe' },
      { id: 'inst_lamda', slug: 'lamda', title: 'London Academy of Music & Dramatic Art', country: 'United Kingdom', region: 'europe' },
      { id: 'inst_nfts', slug: 'nfts', title: 'National Film and Television School', country: 'United Kingdom', region: 'europe' },
      { id: 'inst_afi', slug: 'afi', title: 'American Film Institute', country: 'United States', region: 'north-america' },
      { id: 'inst_gobelins', slug: 'gobelins', title: 'Gobelins L’École de l’Image', country: 'France', region: 'europe' }
    ];

    institutes.forEach(inst => {
      const existing = queryOne(`SELECT id FROM institutes WHERE id = ?`, [inst.id]);
      if (!existing) {
        run(
          `INSERT INTO institutes (id, slug, title, country, region, city, website_url, summary, description, verification_status, publication_status, confidence_score, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, '', '', ?, '', 'verified', 'published', 1.0, ?, ?)`,
          [inst.id, inst.slug, inst.title, inst.country, inst.region, inst.title, now, now]
        );
      }
    });

    // 2. Seed Programs
    SAMPLE_PROGRAMS.forEach(prog => {
      const existing = queryOne(`SELECT id FROM programs WHERE id = ?`, [prog.id]);
      if (!existing) {
        run(
          `INSERT INTO programs (id, slug, title, institute_id, category, subcategory, country, region, city, remote_or_online, format, summary, description, eligibility, tuition_or_cost, duration, deadline, website_url, source_id, verification_status, publication_status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, '', ?, 'europe', '', 0, 'offline', ?, '', 'Open to international candidates', ?, ?, NULL, 'https://example.com', ?, 'verified', 'published', ?, ?)`,
          [prog.id, prog.id, prog.title, prog.institute_id, prog.category, prog.country, prog.title, prog.tuition_or_cost, prog.duration, prog.source_id, now, now]
        );
        programsCount++;
      }

      // Link to Category Taxonomy
      run(
        `INSERT OR IGNORE INTO entity_categories (entity_type, entity_id, category_id)
         VALUES ('program', ?, ?)`,
        [prog.id, prog.category]
      );
      linksCount++;
    });

    // 3. Seed Opportunities
    SAMPLE_OPPORTUNITIES.forEach(opp => {
      const existing = queryOne(`SELECT id FROM opportunities WHERE id = ?`, [opp.id]);
      if (!existing) {
        run(
          `INSERT INTO opportunities (id, slug, title, type, subcategory, org, amount, country, region, city, remote_or_online, format, summary, description, eligibility, funding_info, duration, deadline, website_url, source_id, verification_status, publication_status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'international', '', 0, 'offline', ?, '', 'Open to filmmakers', ?, 'N/A', ?, 'https://example.com', NULL, 'verified', 'published', ?, ?)`,
          [opp.id, opp.id, opp.title, opp.type, opp.category, opp.org, opp.amount, opp.country, opp.title, opp.amount, opp.deadline, now, now]
        );
        opportunitiesCount++;
      }

      // Link to Category Taxonomy
      run(
        `INSERT OR IGNORE INTO entity_categories (entity_type, entity_id, category_id)
         VALUES ('opportunity', ?, ?)`,
        [opp.id, opp.category]
      );
      linksCount++;
    });

    // 4. Seed Events
    SAMPLE_EVENTS.forEach(ev => {
      const existing = queryOne(`SELECT id FROM events WHERE id = ?`, [ev.id]);
      if (!existing) {
        run(
          `INSERT INTO events (id, slug, title, type, subcategory, country, region, city, remote_or_online, format, summary, description, eligibility, duration, deadline, website_url, source_id, verification_status, publication_status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, 'international', '', 0, 'hybrid', ?, '', 'Open to filmmakers', '1 week', NULL, 'https://example.com', NULL, 'verified', 'published', ?, ?)`,
          [ev.id, ev.id, ev.title, ev.type, ev.category, ev.country, ev.summary, now, now]
        );
        eventsCount++;
      }

      // Link to Category Taxonomy
      run(
        `INSERT OR IGNORE INTO entity_categories (entity_type, entity_id, category_id)
         VALUES ('event', ?, ?)`,
        [ev.id, ev.category]
      );
      linksCount++;
    });

    // 5. Seed Books
    SAMPLE_BOOKS.forEach(bk => {
      const existing = queryOne(`SELECT id FROM books WHERE id = ?`, [bk.id]);
      if (!existing) {
        run(
          `INSERT INTO books (id, slug, title, author, category, summary, ne_relevance, legacy_link, verification_status, publication_status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, '', 'verified', 'published', ?, ?)`,
          [bk.id, bk.slug, bk.title, bk.author, bk.category, bk.summary, bk.ne_relevance, now, now]
        );
        booksCount++;
      }

      // Link to Category Taxonomy
      run(
        `INSERT OR IGNORE INTO entity_categories (entity_type, entity_id, category_id)
         VALUES ('book', ?, ?)`,
        [bk.id, bk.category]
      );
      linksCount++;
    });
  });

  console.log(`[Coverage Seed] Complete. Seeded ${programsCount} programs, ${opportunitiesCount} opportunities, ${eventsCount} events, ${booksCount} books, and established ${linksCount} taxonomy links.`);
  return { programsCount, opportunitiesCount, eventsCount, booksCount, linksCount };
}

if (require.main === module) {
  try {
    seedCoverageData();
  } catch (err) {
    console.error('[Coverage Seed] Error:', err);
    process.exit(1);
  }
}

module.exports = { seedCoverageData };
