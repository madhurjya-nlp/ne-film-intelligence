(function () {
  'use strict';

  const container = document.getElementById('intel-home');
  if (!container) return;

  function section(title, html, link) {
    return `
      <section class="pub-home-section">
        <div class="pub-home-section__head">
          <h2>${title}</h2>
          ${link ? `<a href="${link}" class="pub-home-section__link">View all →</a>` : ''}
        </div>
        <div class="pub-grid">${html}</div>
      </section>`;
  }

  async function load() {
    try {
      const data = await PublicAPI.home();
      let html = '';

      if (data.featured_programs?.length) {
        html += section('Programs & Institutions',
          data.featured_programs.map((p) => PubUI.card(p, {
            href: `/explore?type=program&search=${encodeURIComponent(p.title)}`,
            tag: p.format || 'program',
            meta: [p.country, p.tuition_or_cost].filter(Boolean).join(' · '),
            cardType: 'opportunity',
          })).join(''),
          '/explore?type=program');
      }

      if (data.countries?.length) {
        html += section('Study Destinations',
          data.countries.map((c) => PubUI.card(c, { href: `/countries/${c.slug}`, tag: c.region, cardType: 'country' })).join(''),
          '/countries');
      }

      if (data.upcoming_deadlines?.length) {
        html += section('Application Deadlines',
          data.upcoming_deadlines.map((c) => PubUI.card(
            { title: c.title, summary: c.deadline_date || c.deadline_raw },
            { href: '/calendar', tag: c.deadline_status, cardType: 'opportunity' }
          )).join(''),
          '/calendar');
      }

      if (data.closing_soon?.length) {
        html += section('Closing Soon',
          data.closing_soon.map((c) => PubUI.card(
            { title: c.title, summary: c.deadline_raw },
            { href: '/calendar', tag: c.entity_type, countdown: c.days_remaining, cardType: 'opportunity' }
          )).join(''),
          '/calendar');
      }

      container.innerHTML = html || PubUI.empty('Start the server with npm start to load verified programs and institutions.');
    } catch (e) {
      container.innerHTML = `
        <div class="pub-empty">
          <p>Connect to local server (npm start) for live program data.</p>
          <p style="margin-top:var(--s-4);"><a href="programs.html" class="nb-btn nb-btn--primary">Browse Research Programs →</a></p>
        </div>`;
    }
  }

  load();
})();