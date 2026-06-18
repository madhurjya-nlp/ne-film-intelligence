(function () {
  'use strict';

  const root = document.getElementById('page-root');
  if (!root) return;

  const page = root.dataset.page;
  const grid = document.getElementById('content-grid');
  const filtersEl = document.getElementById('filters');

  async function loadRoadmaps() {
    const search = document.getElementById('f-search')?.value || '';
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    const data = await PublicAPI.roadmaps(q);
    if (!data.items.length) { grid.innerHTML = PubUI.empty(); return; }
    grid.innerHTML = data.items.map((r) => PubUI.card(r, {
      href: `/roadmaps/${r.slug}`,
      tag: `${r.step_count || 0} steps`,
      meta: r.target_audience || '',
      cardType: 'roadmap',
    })).join('');
  }

  async function loadCalendar(view) {
    const data = await PublicAPI.calendar({ view, limit: 50 });
    if (!data.items.length) { grid.innerHTML = PubUI.empty('No deadlines in this view.'); return; }
    grid.innerHTML = data.items.map((c) => PubUI.card(
      { title: c.title, summary: c.deadline_raw || c.deadline_date || 'Date TBD' },
      {
        href: `/explore?type=${c.entity_type}&search=${encodeURIComponent(c.title)}`,
        tag: c.entity_type,
        meta: `${c.country || ''} · ${c.deadline_status}`,
        countdown: c.days_remaining,
      }
    )).join('');
  }

  async function loadCountries() {
    const params = {
      search: document.getElementById('f-search')?.value,
      region: document.getElementById('f-region')?.value,
      cost_band: document.getElementById('f-cost')?.value,
    };
    Object.keys(params).forEach((k) => !params[k] && delete params[k]);
    const data = await PublicAPI.countries(params);
    if (!data.items.length) { grid.innerHTML = PubUI.empty(); return; }
    grid.innerHTML = data.items.map((c) => PubUI.card(c, {
      href: `/countries/${c.slug}`,
      tag: c.region,
      meta: c.summary?.slice(0, 80),
      cardType: 'country',
    })).join('');
  }

  async function loadReports() {
    const data = await PublicAPI.reports();
    if (!data.items.length) {
      grid.innerHTML = PubUI.empty('No published reports yet. Check back after admin generates reports.');
      return;
    }
    grid.innerHTML = data.items.map((r) => PubUI.card(r, {
      href: `/reports/${r.slug}`,
      tag: r.report_type,
      meta: new Date(r.generated_at).toLocaleDateString(),
      cardType: 'report',
    })).join('');
    if (window.NEFIMotion) {
      document.querySelectorAll('.nb-card--report').forEach((el) => el.classList.add('motion-doc-drop'));
      window.NEFIMotion.observeOnce('.motion-doc-drop', 'is-visible');
    }
  }

  function bindCalendarTabs() {
    document.querySelectorAll('[data-cal-view]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-cal-view]').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        loadCalendar(btn.dataset.calView);
      });
    });
    loadCalendar('upcoming');
  }

  filtersEl?.addEventListener('change', () => {
    if (page === 'roadmaps') loadRoadmaps();
    if (page === 'countries') loadCountries();
  });
  document.getElementById('f-search')?.addEventListener('input', debounce(() => {
    if (page === 'roadmaps') loadRoadmaps();
    if (page === 'countries') loadCountries();
  }, 300));

  function debounce(fn, ms) {
    let t;
    return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  }

  grid.innerHTML = PubUI.loading();
  if (page === 'roadmaps') loadRoadmaps();
  else if (page === 'calendar') bindCalendarTabs();
  else if (page === 'countries') loadCountries();
  else if (page === 'reports') loadReports();
})();