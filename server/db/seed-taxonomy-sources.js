const { run, queryOne, transaction } = require('./db');

const CATEGORIES = [
  { id: 'acting', name: 'Acting', slug: 'acting', description: 'Acting and performance for theater and screen' },
  { id: 'theatre', name: 'Theatre', slug: 'theatre', description: 'Stagecraft, theatre production, and dramatic arts' },
  { id: 'screenwriting', name: 'Screenwriting', slug: 'screenwriting', description: 'Scriptwriting, writing for television, cinema, and digital media' },
  { id: 'editing', name: 'Editing', slug: 'editing', description: 'Post-production, film editing, and continuity editing' },
  { id: 'documentary', name: 'Documentary', slug: 'documentary', description: 'Non-fiction storytelling, factual media, and documentary production' },
  { id: 'animation', name: 'Animation', slug: 'animation', description: '2D/3D animation, character design, and visual effects' },
  { id: 'film-criticism', name: 'Film Criticism', slug: 'film-criticism', description: 'Film analysis, academic writing, and film journalism' },
  { id: 'producing', name: 'Producing', slug: 'producing', description: 'Creative producing, film financing, marketing, and distribution' },
  { id: 'cinematography', name: 'Cinematography', slug: 'cinematography', description: 'Camera operation, lighting setups, and visual design' },
  { id: 'sound-design', name: 'Sound Design', slug: 'sound-design', description: 'Audio post-production, foley, scoring, and sound engineering' }
];

const SOURCES = [
  // ACTING
  { id: 'src_rada_acting', name: 'RADA — Royal Academy of Dramatic Art', type: 'university', url: 'https://www.rada.ac.uk/acting', country: 'United Kingdom', category: 'acting', trust_level: 100 },
  { id: 'src_lamda_acting', name: 'LAMDA — London Academy of Music & Dramatic Art', type: 'university', url: 'https://www.lamda.ac.uk/acting', country: 'United Kingdom', category: 'acting', trust_level: 100 },
  { id: 'src_guildhall_acting', name: 'Guildhall School of Music & Drama', type: 'university', url: 'https://www.gsmd.ac.uk', country: 'United Kingdom', category: 'acting', trust_level: 100 },
  { id: 'src_drama_centre_archive', name: 'Drama Centre London Archive', type: 'university', url: 'https://www.arts.ac.uk/colleges/central-saint-martins/drama-centre-london', country: 'United Kingdom', category: 'acting', trust_level: 100 },
  { id: 'src_nsd_acting', name: 'National School of Drama (NSD)', type: 'university', url: 'https://nsd.gov.in', country: 'India', category: 'acting', trust_level: 100 },
  // SCREENWRITING
  { id: 'src_sundance_writers', name: 'Sundance Labs', type: 'festival', url: 'https://www.sundance.org/programs/feature-film', country: 'United States', category: 'screenwriting', trust_level: 95 },
  { id: 'src_torino_screenwriting', name: 'TorinoFilmLab Screenwriting', type: 'festival', url: 'https://www.torinofilmlab.it/screenwriting', country: 'Italy', category: 'screenwriting', trust_level: 95 },
  { id: 'src_series_mania_writers', name: 'Series Mania Writers Campus', type: 'festival', url: 'https://seriesmania.com/writers-campus', country: 'France', category: 'screenwriting', trust_level: 95 },
  { id: 'src_screencraft_writing', name: 'ScreenCraft Fellowships', type: 'industry', url: 'https://screencraft.org', country: 'United States', category: 'screenwriting', trust_level: 85 },
  // DOCUMENTARY
  { id: 'src_idfa_academy', name: 'IDFA Academy', type: 'festival', url: 'https://www.idfa.nl', country: 'Netherlands', category: 'documentary', trust_level: 95 },
  { id: 'src_docedge', name: 'Docedge NZ', type: 'festival', url: 'https://www.docedge.nz', country: 'New Zealand', category: 'documentary', trust_level: 90 },
  { id: 'src_docs_by_the_sea', name: 'Docs By The Sea', type: 'festival', url: 'https://www.docsbythesea.org', country: 'Indonesia', category: 'documentary', trust_level: 95 },
  { id: 'src_documentary_campus', name: 'Documentary Campus', type: 'other', url: 'https://www.documentary-campus.com', country: 'Germany', category: 'documentary', trust_level: 90 },
  { id: 'src_hot_docs_labs', name: 'Hot Docs Labs', type: 'festival', url: 'https://www.hotdocs.ca', country: 'Canada', category: 'documentary', trust_level: 95 },
  // EDITING
  { id: 'src_nfts_editing', name: 'NFTS Editing School', type: 'university', url: 'https://nfts.co.uk/editing', country: 'United Kingdom', category: 'editing', trust_level: 100 },
  { id: 'src_metfilm_editing', name: 'MetFilm Editing Pathways', type: 'university', url: 'https://www.metfilmschool.ac.uk', country: 'United Kingdom', category: 'editing', trust_level: 100 },
  { id: 'src_assistant_editor_mentorship', name: 'Assistant Editor Mentorship Pathways (ACE)', type: 'other', url: 'https://americancinemaeditors.org', country: 'United States', category: 'editing', trust_level: 85 },
  // ANIMATION
  { id: 'src_gobelins_animation', name: 'Gobelins L’École de l’Image', type: 'university', url: 'https://www.gobelins-school.com', country: 'France', category: 'animation', trust_level: 100 },
  { id: 'src_sheridan_animation', name: 'Sheridan College Animation', type: 'university', url: 'https://www.sheridancollege.ca', country: 'Canada', category: 'animation', trust_level: 100 },
  { id: 'src_animation_mentor', name: 'Animation Mentor Online', type: 'university', url: 'https://www.animationmentor.com', country: 'United States', category: 'animation', trust_level: 100 },
  // CINEMATOGRAPHY
  { id: 'src_nfts_cinematography', name: 'NFTS Cinematography Department', type: 'university', url: 'https://nfts.co.uk/cinematography', country: 'United Kingdom', category: 'cinematography', trust_level: 100 },
  { id: 'src_afi_cinematography', name: 'AFI Cinematography program', type: 'university', url: 'https://www.afi.com', country: 'United States', category: 'cinematography', trust_level: 100 },
  { id: 'src_lodz_cinematography', name: 'Lodz Film School Cinematography', type: 'university', url: 'https://www.filmschool.lodz.pl', country: 'Poland', category: 'cinematography', trust_level: 100 },
  // SOUND DESIGN
  { id: 'src_nfts_sound', name: 'NFTS Sound Design Program', type: 'university', url: 'https://nfts.co.uk/sound-design', country: 'United Kingdom', category: 'sound-design', trust_level: 100 },
  { id: 'src_berklee_scoring', name: 'Berklee Screen Scoring Program', type: 'university', url: 'https://www.berklee.edu/screen-scoring', country: 'United States', category: 'sound-design', trust_level: 100 },
  { id: 'src_filmsound_institute', name: 'Film Sound Institute', type: 'other', url: 'https://filmsound.org', country: 'United States', category: 'sound-design', trust_level: 85 },
  // PRODUCING
  { id: 'src_eave_producing', name: 'EAVE Producers Workshop', type: 'industry', url: 'https://eave.org', country: 'Luxembourg', category: 'producing', trust_level: 95 },
  { id: 'src_torino_producing', name: 'TorinoFilmLab Producing Lab', type: 'festival', url: 'https://www.torinofilmlab.it/producing', country: 'Italy', category: 'producing', trust_level: 95 },
  { id: 'src_film_independent_producing', name: 'Film Independent Producing Lab', type: 'industry', url: 'https://www.filmindependent.org/programs/artist-development/producing-lab', country: 'United States', category: 'producing', trust_level: 90 },
  // FILM CRITICISM
  { id: 'src_fipresci_criticism', name: 'FIPRESCI (International Critics)', type: 'industry', url: 'https://www.fipresci.org', country: 'Germany', category: 'film-criticism', trust_level: 85 },
  { id: 'src_berlinale_critics_campus', name: 'Berlinale Critics Campus', type: 'festival', url: 'https://www.berlinale-talents.de/critics', country: 'Germany', category: 'film-criticism', trust_level: 95 },
  { id: 'src_young_critics_labs', name: 'Young Critics Labs', type: 'other', url: 'https://www.fipresci.org/education', country: 'Germany', category: 'film-criticism', trust_level: 85 }
];

function seedTaxonomyAndSources() {
  console.log('[Taxonomy Seed] Starting category and source seeding...');
  let categoriesCount = 0;
  let sourcesCount = 0;

  transaction(() => {
    // 1. Seed Categories
    CATEGORIES.forEach(cat => {
      const existing = queryOne(`SELECT id FROM category_taxonomy WHERE id = ?`, [cat.id]);
      if (!existing) {
        run(
          `INSERT INTO category_taxonomy (id, name, slug, parent_category, description, created_at)
           VALUES (?, ?, ?, NULL, ?, ?)`,
          [cat.id, cat.name, cat.slug, cat.description, new Date().toISOString()]
        );
        categoriesCount++;
      }
    });

    // 2. Seed Sources
    SOURCES.forEach(src => {
      // Check if ID or URL already exists
      const existingId = queryOne(`SELECT id FROM sources WHERE id = ?`, [src.id]);
      if (existingId) return;

      const existingUrl = queryOne(`SELECT id FROM sources WHERE url = ?`, [src.url]);
      if (existingUrl) {
        console.log(`[Taxonomy Seed] Skipping source ${src.id} due to duplicate URL: ${src.url}`);
        return;
      }

      const now = new Date().toISOString();
      run(
        `INSERT INTO sources (
          id, name, type, url, country, category, trust_level, active_status,
          crawl_frequency, parser_type, entity_type, parser_config,
          last_checked_at, last_run_at, last_success_at, discovered_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 'weekly', 'generic', 'opportunity', NULL, ?, ?, ?, ?, ?, ?)`,
        [
          src.id,
          src.name,
          src.type,
          src.url,
          src.country,
          src.category,
          src.trust_level,
          now, // last_checked_at
          now, // last_run_at
          now, // last_success_at
          now, // discovered_at
          now,
          now
        ]
      );
      sourcesCount++;
    });
  });

  console.log(`[Taxonomy Seed] Complete. Seeded ${categoriesCount} categories, ${sourcesCount} sources.`);
  return { categoriesCount, sourcesCount };
}

if (require.main === module) {
  try {
    seedTaxonomyAndSources();
  } catch (err) {
    console.error('[Taxonomy Seed] Error:', err);
    process.exit(1);
  }
}

module.exports = { seedTaxonomyAndSources };
