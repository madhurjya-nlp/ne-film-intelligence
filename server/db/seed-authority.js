const { run, queryOne, transaction } = require('./db');

function seedAuthorityData() {
  console.log('[Seeding Authority] Seeding alumni, success stories, and career outcomes...');

  transaction(() => {
    // 1. Seed Career Outcomes
    const outcomes = [
      {
        id: 'co_doc_filmmaker',
        title: 'Independent Documentary Filmmaker',
        salary_range_low: 3.5, // Lacs INR/yr
        salary_range_high: 12.0,
        placement_rate: 75.0, // %
        related_programs: JSON.stringify(['dbhrgfti', 'nos-st', 'germany-public-ma']),
        requirements_text: 'Strong visual portfolio, editing skills (Premiere/DaVinci), grant writing ability, and deep research capability.'
      },
      {
        id: 'co_film_editor',
        title: 'Video & Film Editor',
        salary_range_low: 4.0,
        salary_range_high: 15.0,
        placement_rate: 88.0,
        related_programs: JSON.stringify(['dbhrgfti', 'mgr-chennai']),
        requirements_text: 'Proficiency in DaVinci Resolve, Avid Media Composer, or Premiere Pro. Strong sense of pacing, story structure, and sound synchronization.'
      },
      {
        id: 'co_cinematographer',
        title: 'Director of Photography (Cinematographer)',
        salary_range_low: 5.0,
        salary_range_high: 20.0,
        placement_rate: 82.0,
        related_programs: JSON.stringify(['dbhrgfti', 'mgr-chennai']),
        requirements_text: 'Lighting expertise, drone operation license (DGCA in India), camera package mastery (RED, ARRI, Sony FX series), and collaborative agility.'
      },
      {
        id: 'co_screenwriter',
        title: 'Screenplay Writer',
        salary_range_low: 3.0,
        salary_range_high: 18.0,
        placement_rate: 65.0,
        related_programs: JSON.stringify(['bir-tikendrajit', 'mediau-online']),
        requirements_text: 'Portfolio of 2-3 completed feature scripts or pilot episodes. Mastery of script formatting, character arcs, and pitch treatments.'
      }
    ];

    outcomes.forEach(o => {
      run(
        `INSERT OR REPLACE INTO career_outcomes 
         (id, title, salary_range_low, salary_range_high, placement_rate, related_programs, requirements_text, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          o.id,
          o.title,
          o.salary_range_low,
          o.salary_range_high,
          o.placement_rate,
          o.related_programs,
          o.requirements_text,
          new Date().toISOString(),
          new Date().toISOString()
        ]
      );
      console.log(` - Seeded career outcome: ${o.title}`);
    });

    // 2. Seed Alumni
    const alumni = [
      {
        id: 'alumni_snigdha',
        name: 'Snigdha P. Roy',
        graduation_year: 2023,
        institute_id: 'inst_famu',
        program_id: 'germany-public-ma', // Mapping to a seeded program slug
        current_role: 'Independent Documentary Director',
        achievement_summary: 'Directed the acclaimed short documentary \'Aakuti\' exploring indigenous Assamese tribal customs. Selected for the Northeast India Film Festival (NEIFF) and various South Asian international film programs.',
        profile_image_url: '/public/images/alumni/snigdha.jpg'
      },
      {
        id: 'alumni_maharshi',
        name: 'Maharshi Tuhin Kashyap',
        graduation_year: 2021,
        institute_id: 'inst_srfti',
        program_id: 'mgr-chennai', // Mapping to a seeded program slug
        current_role: 'Screenwriter & Feature Director',
        achievement_summary: 'Created the award-winning short film \'The Horse from Heaven\' (Neona) which brings traditional Ojha-Pali oral storytelling into modern cinematic form. Winner of multiple national awards.',
        profile_image_url: '/public/images/alumni/maharshi.jpg'
      },
      {
        id: 'alumni_madhurjya',
        name: 'Madhurjya',
        graduation_year: 2024,
        institute_id: 'inst_dbhrgfti-dr-bhupen-hazarika-regional-govt-film-tv-institute',
        program_id: 'dbhrgfti',
        current_role: 'Documentary Editor & Founder',
        achievement_summary: 'Founder of NEFI and active documentary editor. Shot and edited multiple regional non-fiction broadcasts for Doordarshan. Specializes in drone cinematography and post-production workflows in Assam.',
        profile_image_url: '/public/images/alumni/madhurjya.jpg'
      }
    ];

    alumni.forEach(a => {
      run(
        `INSERT OR REPLACE INTO alumni 
         (id, name, graduation_year, institute_id, program_id, current_role, achievement_summary, profile_image_url, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          a.id,
          a.name,
          a.graduation_year,
          a.institute_id,
          a.program_id,
          a.current_role,
          a.achievement_summary,
          a.profile_image_url,
          new Date().toISOString(),
          new Date().toISOString()
        ]
      );
      console.log(` - Seeded alumnus: ${a.name}`);
    });

    // 3. Seed Success Stories
    const stories = [
      {
        id: 'story_snigdha_pathway',
        title: 'From Assam to FAMU: Crafting Indigenous Stories with the National Overseas Scholarship',
        slug: 'assam-to-famu-snigdha-pathway',
        alumni_id: 'alumni_snigdha',
        summary: 'How Snigdha leveraged her ST status and the National Overseas Scholarship (NOS) to fund her documentary directing studies at FAMU Prague, returning to capture underrepresented voices.',
        body_content: `<p>Snigdha P. Roy, a native of Dibrugarh, Assam, always wanted to tell the stories of her community. However, the high tuition fees of elite European film schools were a major barrier.</p>
                       <h3>The Leverage: National Overseas Scholarship</h3>
                       <p>As a Scheduled Tribe (ST) candidate, Snigdha applied for the National Overseas Scholarship administered by the Ministry of Tribal Affairs. With family income under the ₹6 Lakhs ceiling and an unconditional acceptance letter from FAMU Prague for their English documentary track, she secured 100% funding covering tuition, flights from Guwahati, health insurance, and a monthly stipend of over $15,000 equivalent.</p>
                       <h3>The Outcome: \'Aakuti\'</h3>
                       <p>During her studies, she returned to Assam to shoot \'Aakuti\', a poetic documentary examining the oral histories and ecological practices of Mising tribe women along the Brahmaputra. The film went on to screen at regional and international film festivals, demonstrating the global hunger for authentic regional stories.</p>`,
        video_url: 'https://www.youtube.com/embed/dummy_snigdha',
        publication_status: 'published'
      },
      {
        id: 'story_maharshi_folklore',
        title: 'Reclaiming Oral Traditions: Maharshi Tuhin Kashyap on Ojha-Pali Cinema',
        slug: 'reclaiming-oral-traditions-maharshi-ojha-pali',
        alumni_id: 'alumni_maharshi',
        summary: 'How Satyajit Ray Film & Television Institute (SRFTI) graduate Maharshi Tuhin Kashyap utilized his training to adapt Assamese folklore for international audiences.',
        body_content: `<p>Maharshi Tuhin Kashyap, an SRFTI graduate, believes that the storytelling forms of Northeast India are a global superpower. His student film, \'The Horse from Heaven\' (Neona), is a testament to this belief.</p>
                       <h3>The Training at SRFTI</h3>
                       <p>Studying Direction and Screenplay Writing at Satyajit Ray Film & Television Institute in Kolkata, Maharshi honed his technical craft while remaining deeply connected to his roots. The highly subsidized fees at SRFTI and access to world-class camera packages allowed him to experiment with narrative structure.</p>
                       <h3>Connecting with Folk Art</h3>
                       <p>By using Ojha-Pali, a traditional narrative performance art of Assam, Maharshi created a distinct aesthetic that stood out from conventional film school outputs. His advice to young NE filmmakers: "Master the international craft so that you can break its rules and present your regional folklore in its purest, most authentic form."</p>`,
        video_url: 'https://www.youtube.com/embed/dummy_maharshi',
        publication_status: 'published'
      }
    ];

    stories.forEach(s => {
      run(
        `INSERT OR REPLACE INTO success_stories 
         (id, title, slug, alumni_id, summary, body_content, video_url, publication_status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          s.id,
          s.title,
          s.slug,
          s.alumni_id,
          s.summary,
          s.body_content,
          s.video_url,
          s.publication_status,
          new Date().toISOString(),
          new Date().toISOString()
        ]
      );
      console.log(` - Seeded success story: ${s.title}`);
    });
  });

  console.log('[Seeding Authority] Seeding completed successfully.');
}

if (require.main === module) {
  seedAuthorityData();
}

module.exports = { seedAuthorityData };
