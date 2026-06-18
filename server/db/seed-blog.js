const { run, queryOne, transaction } = require('./db');

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

const SEED_POSTS = [
  {
    title: "How Film Students From Assam Can Study Abroad",
    excerpt: "A practical guide for Assamese students navigating applications, portfolio preparation, and cultural transitions for international film schools.",
    content: "<h2>Navigating the Path from Assam to International Film Schools</h2><p>Studying film abroad can seem daunting for students from Northeast India, but with structured preparation, it is entirely achievable.</p><p>Key steps include selecting the right programs (such as Erasmus Mundus, public universities in Germany, or specialized institutions in Europe), preparing a stellar visual portfolio that reflects unique local stories, and securing English proficiency certifications like IELTS/TOEFL.</p><p>Additionally, pay close attention to document attestation at Guwahati and visa processing times, which can take several months.</p>",
    author: "Madhurjya",
    reading_time: 5,
    featured: 1
  },
  {
    title: "Film Scholarships Every Northeast Student Should Know",
    excerpt: "Discover scholarship options including the National Overseas Scholarship (NOS), Erasmus Mundus, and trust funds specifically offering support to ST candidates.",
    content: "<h2>Funding Your Film Education: Top Scholarships</h2><p>For Scheduled Tribe (ST) candidates and students from Northeast India, several funding opportunities can cover 100% of tuition and living expenses abroad.</p><ul><li><strong>National Overseas Scholarship (NOS):</strong> Run by the Ministry of Tribal Affairs, this provides full funding for Master's and PhD programs abroad. Deadlines are typically between May and June.</li><li><strong>Erasmus Mundus Joint Masters:</strong> Fully funded European Union scholarships for collaborative film programs.</li><li><strong>Inlaks Shivdasani Foundation:</strong> Grants for Indian students studying in Europe/US.</li></ul>",
    author: "NEFI Editorial",
    reading_time: 6,
    featured: 0
  },
  {
    title: "Germany For Film Education",
    excerpt: "Why Germany is the top destination for low-cost, high-quality film education with tuition-free public universities and English-taught Master programs.",
    content: "<h2>Why Choose Germany?</h2><p>Germany has become a premier destination for film students because public universities offer tuition-free education (only a small semester contribution of ~300 EUR is required).</p><p>Top English-taught film and media master's programs allow international students to study directing, screenwriting, or media management without a high financial burden. We cover visa pathways, block accounts (Sperrkonto), and key universities like Film University Babelsberg Konrad Wolf.</p>",
    author: "Madhurjya",
    reading_time: 4,
    featured: 0
  },
  {
    title: "Film Bazaar Explained",
    excerpt: "A comprehensive breakdown of South Asia's largest co-production market, including tips for getting selected and pitching your project.",
    content: "<h2>Navigating NFDC Film Bazaar</h2><p>Organized by the National Film Development Corporation (NFDC), Film Bazaar is the premier co-production market in South Asia. Held annually in Goa, it features sections like the Co-Production Market, Work-in-Progress (WIP) Lab, and Viewing Room.</p><p>For Northeast filmmakers, pitching at Film Bazaar is a crucial gateway to international co-producers, sales agents, and festival programmers. Learn how to draft a pitch deck and apply for project development grants.</p>",
    author: "NEFI Editorial",
    reading_time: 7,
    featured: 0
  },
  {
    title: "Roadmap To Becoming A Film Editor",
    excerpt: "From mastering software to understanding narrative pacing, this guide maps out the step-by-step career path for aspiring film editors.",
    content: "<h2>The Editing Pathway</h2><p>Film editing is both a technical skill and a profound narrative art. This guide details the essential roadmap to establish a career as a professional editor.</p><p>Start by learning standard software (Premiere Pro, DaVinci Resolve, Avid Media Composer). Build editing experience by working on short films, documentaries, and collaborative student projects. Focus on pacing, story structure, and sound design to elevate your cuts.</p>",
    author: "Madhurjya",
    reading_time: 5,
    featured: 0
  },
  {
    title: "How To Fund Your First Documentary",
    excerpt: "Explore grants, pitch labs, and co-production markets tailored for documentary filmmakers, with a focus on regional storytelling.",
    content: "<h2>Securing Documentary Grants</h2><p>Documentaries about Northeast India have rich potential but funding is often hard to secure locally. This guide outlines international and national grants friendly to first-time documentary filmmakers.</p><p>Explore resources like the Hubert Bals Fund (HBF), IDFA Bertha Fund, Sundance Documentary Fund, and regional foundations supporting environmental or social justice storytelling, such as the Green Hub fellowships in Assam.</p>",
    author: "Madhurjya",
    reading_time: 6,
    featured: 0
  }
];

function seedBlogPosts() {
  console.log('[Blog Seed] Starting blog post seeding...');
  let inserted = 0;
  
  transaction(() => {
    SEED_POSTS.forEach((post, i) => {
      const slug = slugify(post.title);
      const id = 'blog_' + slug;
      
      const existing = queryOne(`SELECT id FROM blog_posts WHERE id = ?`, [id]);
      if (existing) return;
      
      run(
        `INSERT INTO blog_posts (
          id, title, slug, excerpt, content, cover_image, author, status, 
          published_at, created_at, updated_at, reading_time, featured
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          post.title,
          slug,
          post.excerpt,
          post.content,
          `/images/blog/cover_${i + 1}.jpg`,
          post.author,
          'draft', // Must be draft, do not publish automatically
          null, // Drafts don't have published_at dates yet
          new Date().toISOString(),
          new Date().toISOString(),
          post.reading_time,
          post.featured
        ]
      );
      inserted++;
    });
  });
  
  console.log(`[Blog Seed] Complete. Seeded ${inserted} blog draft articles.`);
  return inserted;
}

if (require.main === module) {
  try {
    seedBlogPosts();
  } catch (err) {
    console.error('[Blog Seed] Error seeding blog posts:', err);
    process.exit(1);
  }
}

module.exports = { seedBlogPosts };
