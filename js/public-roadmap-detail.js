(function () {
  'use strict';

  const root = document.getElementById('page-root');
  const bootstrap = document.getElementById('page-bootstrap');

  async function render(rm) {
    document.title = `${rm.title} — Filmmaker Roadmap | NE Film Intelligence`;
    const steps = rm.steps || [];
    const trackHtml = steps.length ? `
        <div class="roadmap-track" aria-label="Roadmap progress">
          ${steps.map((s, i) => `
            <div class="roadmap-track__segment" data-step-index="${i}">
              <span class="roadmap-track__node${i === 0 ? ' is-active' : ''}" aria-hidden="true"></span>
              ${i < steps.length - 1 ? `<span class="roadmap-track__line${i === 0 ? ' is-filled' : ''}"><span class="roadmap-track__line-fill"></span></span>` : ''}
            </div>
          `).join('')}
        </div>` : '';
    root.innerHTML = `
      <main class="pub-main">
        <div class="pub-hero">
          <p class="nb-eyebrow">Filmmaker Roadmap</p>
          <h1>${rm.title}</h1>
          <p>${rm.summary}</p>
          <p class="nb-card__meta" style="margin-top:var(--s-3);border:none;padding:0;">${rm.target_audience || ''} · ${rm.estimated_timeline}</p>
        </div>
        ${trackHtml}
        <div class="pub-steps" role="list" aria-label="Roadmap milestones">
          ${(rm.steps || []).map((s) => `
            <div class="pub-step" role="listitem">
              <span class="pub-step__order">Milestone ${s.step_order}${s.milestone_label ? ' — ' + s.milestone_label : ''}</span>
              ${s.prerequisite ? `<p class="nb-caption">Requires: ${s.prerequisite.title}</p>` : ''}
              <h3>${s.title}</h3>
              <p>${s.summary}</p>
              ${s.resources?.length ? `<ul style="margin-top:var(--s-3);font-size:var(--text-caption);list-style:square;padding-left:var(--s-6);">${s.resources.map((r) =>
                r.entity ? `<li><a href="/explore?search=${encodeURIComponent(r.entity.title)}">${r.entity.title}</a></li>` : ''
              ).join('')}</ul>` : ''}
            </div>
          `).join('')}
        </div>
        ${rm.related_countries?.length ? `
          <section class="pub-home-section">
            <h2>Related Countries</h2>
            <div class="pub-grid">${rm.related_countries.map((c) => PubUI.card(c, { href: `/countries/${c.slug}`, tag: c.region, cardType: 'country' })).join('')}</div>
          </section>` : ''}
      </main>`;
  }

  (async () => {
    let rm = bootstrap ? JSON.parse(bootstrap.textContent) : null;
    if (!rm?.steps) {
      rm = await PublicAPI.roadmap(root.dataset.slug);
    }
    render(rm);
    if (!document.querySelector('.pub-header')) {
      document.body.classList.add('public-page');
      const s = document.createElement('script');
      s.src = '/js/public-shell.js';
      document.body.appendChild(s);
    }
  })();
})();