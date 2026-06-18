const express = require('express');
const path = require('path');
const { renderPublicPage } = require('../utils/seo');
const { PublicService } = require('../services/publicService');

const router = express.Router();
const rootDir = path.join(__dirname, '..', '..');

function sendShell(res, file) {
  res.sendFile(path.join(rootDir, file));
}

const LIST_PAGES = [
  ['/', 'index.html'],
  ['/roadmaps', 'pages/roadmaps.html'],
  ['/calendar', 'pages/calendar.html'],
  ['/countries', 'pages/countries.html'],
  ['/explore', 'pages/explore.html'],
  ['/reports', 'pages/reports.html'],
  ['/relationships', 'pages/relationships.html'],
  ['/search', 'pages/search.html'],
  ['/blog', 'pages/blog.html'],
  ['/contribute', 'pages/contribute.html'],
  ['/admin/coverage', 'pages/admin-coverage.html'],
  ['/admin/audit', 'pages/admin-audit.html'],
];

LIST_PAGES.forEach(([route, file]) => {
  router.get(route, (req, res) => sendShell(res, file));
});

router.get('/roadmaps/:slug', (req, res) => {
  const rm = PublicService.getRoadmapBySlug(req.params.slug);
  if (!rm) return res.status(404).sendFile(path.join(rootDir, 'pages/404.html'));
  const base = `${req.protocol}://${req.get('host')}`;
  res.send(renderPublicPage({
    title: `${rm.title} — Filmmaker Roadmap | NE Film Intelligence`,
    description: rm.summary,
    canonical: `${base}/roadmaps/${rm.slug}`,
    bodyContent: `
      <div id="page-root" data-page="roadmap-detail" data-slug="${rm.slug}"></div>
      <script id="page-bootstrap" type="application/json">${JSON.stringify(rm).replace(/</g, '\\u003c')}</script>
    `,
    scripts: ['/js/public-roadmap-detail.js'],
    jsonLd: { '@context': 'https://schema.org', '@type': 'HowTo', name: rm.title, description: rm.summary },
  }));
});

router.get('/countries/:slug', (req, res) => {
  const c = PublicService.getCountryBySlug(req.params.slug);
  if (!c) return res.status(404).sendFile(path.join(rootDir, 'pages/404.html'));
  const base = `${req.protocol}://${req.get('host')}`;
  res.send(renderPublicPage({
    title: `Film Education in ${c.name} — Country Guide | NE Film Intelligence`,
    description: c.summary,
    canonical: `${base}/countries/${c.slug}`,
    bodyContent: `
      <div id="page-root" data-page="country-detail" data-slug="${c.slug}"></div>
      <script id="page-bootstrap" type="application/json">${JSON.stringify({ id: c.id, slug: c.slug, name: c.name, summary: c.summary }).replace(/</g, '\\u003c')}</script>
    `,
    scripts: ['/js/public-country-detail.js'],
    jsonLd: { '@context': 'https://schema.org', '@type': 'Place', name: c.name, description: c.summary },
  }));
});

router.get('/reports/:slug', (req, res) => {
  const r = PublicService.getReportBySlug(req.params.slug);
  if (!r) return res.status(404).sendFile(path.join(rootDir, 'pages/404.html'));
  const base = `${req.protocol}://${req.get('host')}`;
  res.send(renderPublicPage({
    title: `${r.title} — Research Report | NE Film Intelligence`,
    description: r.summary || r.title,
    canonical: `${base}/reports/${r.slug}`,
    bodyContent: `
      <div id="page-root" data-page="report-detail" data-slug="${r.slug}"></div>
      <script id="page-bootstrap" type="application/json">${JSON.stringify({ slug: r.slug, title: r.title }).replace(/</g, '\\u003c')}</script>
    `,
    scripts: ['/js/public-report-detail.js'],
    jsonLd: { '@context': 'https://schema.org', '@type': 'Article', headline: r.title, description: r.summary },
  }));
});

router.get('/blog/:slug', (req, res) => {
  const post = PublicService.getBlogPostBySlug(req.params.slug);
  if (!post) return res.status(404).sendFile(path.join(rootDir, 'pages/404.html'));
  const base = `${req.protocol}://${req.get('host')}`;
  
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    'headline': post.title,
    'description': post.excerpt || post.title,
    'datePublished': post.published_at || post.created_at,
    'dateModified': post.updated_at || post.created_at,
    'author': {
      '@type': 'Person',
      'name': post.author || 'Admin'
    }
  };

  res.send(renderPublicPage({
    title: `${post.title} | NE Film Intelligence Blog`,
    description: post.excerpt || post.title,
    canonical: `${base}/blog/${post.slug}`,
    ogImage: post.cover_image || null,
    bodyContent: `
      <div id="page-root" data-page="blog-detail" data-slug="${post.slug}"></div>
      <script id="page-bootstrap" type="application/json">${JSON.stringify(post).replace(/</g, '\\u003c')}</script>
    `,
    scripts: ['/js/public-blog-detail.js'],
    jsonLd
  }));
});

router.get('/sitemap.xml', (req, res) => {
  const base = `${req.protocol}://${req.get('host')}`;
  const urls = PublicService.getSitemapUrls(base);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u.loc}</loc><priority>${u.priority}</priority></url>`).join('\n')}
</urlset>`;
  res.type('application/xml').send(xml);
});

router.get('/robots.txt', (req, res) => {
  const base = `${req.protocol}://${req.get('host')}`;
  res.type('text/plain').send(`User-agent: *
Allow: /
Disallow: /admin.html
Disallow: /api/ingestion/
Sitemap: ${base}/sitemap.xml
`);
});

router.get('/rss.xml', (req, res) => {
  const base = `${req.protocol}://${req.get('host')}`;
  const now = new Date().toUTCString();
  const { queryAll } = require('../db/db');
  const posts = queryAll(`SELECT * FROM blog_posts WHERE status = 'published' ORDER BY published_at DESC LIMIT 50`);
  
  function escapeXml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  const itemsXml = posts.map(post => `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${base}/blog/${post.slug}</link>
      <guid>${base}/blog/${post.slug}</guid>
      <pubDate>${new Date(post.published_at || post.created_at).toUTCString()}</pubDate>
      <description>${escapeXml(post.excerpt || post.title)}</description>
    </item>`).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>NE Film Intelligence Blog</title>
    <link>${base}/blog</link>
    <description>Living publication &amp; research articles on film education for Northeast India.</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${base}/rss.xml" rel="self" type="application/rss+xml" />
${itemsXml}
  </channel>
</rss>`;

  res.type('application/xml').send(xml);
});

module.exports = router;