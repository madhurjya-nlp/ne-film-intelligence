(function () {
  'use strict';

  const container = document.getElementById('live-programs');
  if (!container || typeof PublicAPI === 'undefined') return;

  async function load() {
    container.innerHTML = PubUI.loading();
    try {
      const data = await PublicAPI.explore({ type: 'program', limit: 12, sort: 'newest' });
      const items = data.programs || [];
      if (!items.length) {
        container.innerHTML = PubUI.empty('No verified programs in database yet. Run npm start and publish records via admin.');
        return;
      }
      container.innerHTML = items.map((p) => PubUI.card(p, {
        href: p.website_url || `/explore?type=program&search=${encodeURIComponent(p.title)}`,
        tag: [p.format, p.country].filter(Boolean).join(' · '),
        meta: p.tuition_or_cost || '',
        cardType: 'opportunity',
      })).join('');
    } catch (e) {
      container.innerHTML = PubUI.empty('Start the server (npm start) to load verified programs from the database.');
    }
  }

  load();
})();