function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderPublicPage({ title, description, canonical, bodyContent, scripts = [], jsonLd = null, ogImage = null }) {
  const ld = jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : '';
  const extraScripts = scripts.map((s) => `<script src="${s}" defer></script>`).join('\n');
  const imageTag = ogImage ? `
  <meta property="og:image" content="${escapeHtml(ogImage)}">
  <meta name="twitter:image" content="${escapeHtml(ogImage)}">` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">${imageTag}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700;800&family=Inter:wght@400;500;600&family=Courier+Prime:wght@400;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/design-system-v2.css">
  ${ld}
</head>
<body class="public-page" data-pub-header>
${bodyContent}
<script src="/js/public-api.js"></script>
<script src="/js/public-shell.js" defer></script>
<script src="/js/sound-engine.js" defer></script>
<script src="/js/motion-controller.js" defer></script>
<script src="/js/scroll-engine.js" defer></script>
${extraScripts}
</body>
</html>`;
}

module.exports = { renderPublicPage, escapeHtml };