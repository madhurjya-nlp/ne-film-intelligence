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
      
      if (data.stats) {
        // Update hero stats
        const statsEl = document.getElementById('hero-stats');
        if (statsEl) {
          statsEl.innerHTML = `
            <div class="hero__stat-row">
              <span class="hero__stat-n">${data.stats.programs}+</span>
              <span class="hero__stat-l">Programs</span>
            </div>
            <div class="hero__stat-div"></div>
            <div class="hero__stat-row">
              <span class="hero__stat-n">${data.stats.countries}</span>
              <span class="hero__stat-l">Countries</span>
            </div>
            <div class="hero__stat-div"></div>
            <div class="hero__stat-row">
              <span class="hero__stat-n">${data.stats.opportunities}+</span>
              <span class="hero__stat-l">Grants & Funds</span>
            </div>
            <div class="hero__stat-div"></div>
            <div class="hero__stat-row">
              <span class="hero__stat-n">${data.stats.books}+</span>
              <span class="hero__stat-l">Curated Books</span>
            </div>
          `;
        }

        // Update ticker items
        const tickerBelt = document.querySelector('.ticker__belt');
        if (tickerBelt) {
          tickerBelt.innerHTML = `
            <span class="ticker__item"><b>${data.stats.programs}+</b> Programs</span><span class="ticker__dot">&nbsp;·&nbsp;</span>
            <span class="ticker__item"><b>${data.stats.opportunities}+</b> Grants & Funds</span><span class="ticker__dot">&nbsp;·&nbsp;</span>
            <span class="ticker__item"><b>${data.stats.countries}</b> Countries Mapped</span><span class="ticker__dot">&nbsp;·&nbsp;</span>
            <span class="ticker__item"><b>${data.stats.books}+</b> Curated Books</span><span class="ticker__dot">&nbsp;·&nbsp;</span>
            <span class="ticker__item">Curated for Indian Filmmakers on a Budget</span><span class="ticker__dot">&nbsp;·&nbsp;</span>
            <span class="ticker__item">ST Scholarship Paths Included</span><span class="ticker__dot">&nbsp;·&nbsp;</span>
            <span class="ticker__item">Open-Access Books & Papers</span><span class="ticker__dot">&nbsp;·&nbsp;</span>
            <span class="ticker__item"><b>${data.stats.programs}+</b> Programs</span><span class="ticker__dot">&nbsp;·&nbsp;</span>
            <span class="ticker__item"><b>${data.stats.opportunities}+</b> Grants & Funds</span><span class="ticker__dot">&nbsp;·&nbsp;</span>
            <span class="ticker__item"><b>${data.stats.countries}</b> Countries Mapped</span><span class="ticker__dot">&nbsp;·&nbsp;</span>
            <span class="ticker__item"><b>${data.stats.books}+</b> Curated Books</span><span class="ticker__dot">&nbsp;·&nbsp;</span>
          `;
        }
      }

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