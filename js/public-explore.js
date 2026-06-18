(function () {
  'use strict';

  const root = document.getElementById('page-root');
  const grid = document.getElementById('content-grid');
  const form = document.getElementById('explore-filters');
  let page = 1;

  function paramsFromUrl() {
    const p = new URLSearchParams(window.location.search);
    return Object.fromEntries(p.entries());
  }

  function syncUrl(params) {
    const q = new URLSearchParams(params);
    history.replaceState(null, '', `/explore?${q}`);
  }

  function collectFilters() {
    const fd = new FormData(form);
    const params = {};
    fd.forEach((v, k) => { if (v) params[k] = v; });
    params.page = page;
    params.limit = 20;
    return params;
  }

  async function load() {
    grid.innerHTML = PubUI.loading();
    const params = collectFilters();
    syncUrl(params);
    const data = await PublicAPI.explore(params);
    const items = [...data.programs, ...data.opportunities, ...data.institutes];
    if (!items.length) { grid.innerHTML = PubUI.empty(); return; }
    grid.innerHTML = items.map((item) => PubUI.card(item, {
      href: item.website_url || '#',
      tag: item.entity_type + (item.format ? ` · ${item.format}` : ''),
      meta: [item.country, item.tuition_or_cost || item.amount, item.type].filter(Boolean).join(' · '),
    })).join('');

    const pag = document.getElementById('pagination');
    if (pag) {
      pag.innerHTML = `
        <button id="prev-page" ${page <= 1 ? 'disabled' : ''}>Previous</button>
        <span style="font-family:var(--f-mono);font-size:11px;">Page ${page}</span>
        <button id="next-page" ${items.length < 20 ? 'disabled' : ''}>Next</button>`;
      document.getElementById('prev-page')?.addEventListener('click', () => { page--; load(); });
      document.getElementById('next-page')?.addEventListener('click', () => { page++; load(); });
    }
  }

  const urlParams = paramsFromUrl();
  if (urlParams.page) page = parseInt(urlParams.page) || 1;
  if (form) {
    if (!urlParams.type) form.elements.type.value = 'program';
    Object.entries(urlParams).forEach(([k, v]) => {
      const el = form.elements[k];
      if (el) el.value = v;
    });
    form.addEventListener('submit', (e) => { e.preventDefault(); page = 1; load(); });
    form.addEventListener('change', () => { page = 1; load(); });
  }
  load();
})();