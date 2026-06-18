(function () {
  'use strict';

  const input = document.getElementById('search-input');
  const results = document.getElementById('search-results');
  let idx = 0;

  async function run(q) {
    if (!q || q.length < 2) {
      results.innerHTML = PubUI.empty('Type at least 2 characters.');
      return;
    }
    results.innerHTML = PubUI.loading();
    const data = await PublicAPI.search(q, 12);
    if (!data.total) {
      results.innerHTML = PubUI.empty(`No results for "${q}".`);
      return;
    }

    let html = '';
    for (const [cat, items] of Object.entries(data.categories)) {
      if (!items.length) continue;
      html += `<div class="pub-search-cat"><h3>${cat}</h3><div class="pub-grid">`;
      html += items.map((item) => {
        const href = item.href || (item.slug ? `/${cat}/${item.slug}` : '#');
        return PubUI.card(item, { href, tag: cat.slice(0, -1) });
      }).join('');
      html += '</div></div>';
    }
    results.innerHTML = html;
  }

  input?.addEventListener('input', debounce(() => run(input.value), 250));
  input?.addEventListener('keydown', (e) => {
    const links = results.querySelectorAll('.pub-card__title');
    if (e.key === 'ArrowDown') { e.preventDefault(); idx = Math.min(idx + 1, links.length - 1); links[idx]?.focus(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); idx = Math.max(idx - 1, 0); links[idx]?.focus(); }
  });

  const q = new URLSearchParams(location.search).get('q');
  if (q) { input.value = q; run(q); }

  function debounce(fn, ms) {
    let t;
    return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  }
})();