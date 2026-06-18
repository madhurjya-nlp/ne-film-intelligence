(function () {
  'use strict';

  const root = document.getElementById('page-root');

  async function render(c) {
    root.innerHTML = `
      <main class="pub-main">
        <div class="pub-hero">
          <p class="nb-eyebrow">${c.region}</p>
          <h1>${c.name}</h1>
          <p>${c.summary}</p>
          ${c.language_notes ? `<p style="margin-top:var(--s-3);"><strong>Language:</strong> ${c.language_notes}</p>` : ''}
        </div>
        ${c.cost_profiles?.length ? `<section class="pub-home-section"><h2>Cost Profile</h2><div class="pub-grid">${c.cost_profiles.map((p) => `
          <div class="nb-card nb-card--country"><span class="nb-badge nb-badge--country">${p.cost_band}</span>
          <p>${p.tuition_notes || ''}</p><p class="nb-caption">${p.living_cost_notes || ''}</p></div>
        `).join('')}</div></section>` : ''}
        ${c.visa_notes?.length ? `<section class="pub-home-section"><h2>Visa Notes</h2>${c.visa_notes.map((v) => `
          <div class="pub-step"><strong>${v.visa_type || 'Visa'}</strong><p>${v.notes}</p>
          ${v.st_candidate_notes ? `<p class="nb-alert nb-alert--info" style="margin-top:var(--s-3);">ST/NE: ${v.st_candidate_notes}</p>` : ''}</div>
        `).join('')}</section>` : ''}
        ${c.scholarship_notes?.length ? `<section class="pub-home-section"><h2>Scholarships</h2><div class="pub-grid">${c.scholarship_notes.map((s) => `
          <div class="nb-card nb-card--opportunity"><span class="nb-badge nb-badge--scholarship">Scholarship</span>
          <h3 class="h4">${s.title}</h3><p>${s.notes}</p></div>
        `).join('')}</div></section>` : ''}
        ${c.related_programs?.length ? `<section class="pub-home-section"><h2>Related Programs</h2><div class="pub-grid">${c.related_programs.map((p) => PubUI.card(p, { tag: p.format, meta: p.tuition_or_cost, cardType: 'opportunity' })).join('')}</div></section>` : ''}
        ${c.related_opportunities?.length ? `<section class="pub-home-section"><h2>Related Opportunities</h2><div class="pub-grid">${c.related_opportunities.map((o) => PubUI.card(o, { tag: o.type, meta: o.amount, cardType: 'opportunity' })).join('')}</div></section>` : ''}
      </main>`;
  }

  (async () => {
    const slug = root.dataset.slug;
    const c = await PublicAPI.country(slug);
    render(c);
    document.body.classList.add('public-page');
    if (!document.querySelector('.pub-header')) {
      const s = document.createElement('script');
      s.src = '/js/public-shell.js';
      document.body.appendChild(s);
    }
  })();
})();