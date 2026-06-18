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

module.exports = router;