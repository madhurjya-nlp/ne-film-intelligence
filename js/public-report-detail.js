(function () {
  'use strict';

  const root = document.getElementById('page-root');

  async function render(r) {
    const toc = (r.sections || []).map((s, i) =>
      `<a href="#section-${i}">${s.heading}</a>`
    ).join('');

    root.innerHTML = `
      <main class="pub-main">
        <div class="pub-hero">
          <p class="nb-eyebrow">${r.report_type} · ${new Date(r.generated_at).toLocaleDateString()}</p>
          <h1>${r.title}</h1>
          <p>${r.summary || ''}</p>
        </div>
        <div class="report-layout">
          ${toc ? `<nav class="report-toc" aria-label="Table of contents">${toc}</nav>` : ''}
          <div class="report-body">
            ${(r.sections || []).map((s, i) => `
              <section class="pub-home-section" id="section-${i}">
                <h2>${s.heading}</h2>
                <div class="report-section-content">${s.content}</div>
              </section>
            `).join('')}
          </div>
        </div>
      </main>`;
  }

  (async () => {
    const r = await PublicAPI.report(root.dataset.slug);
    render(r);
    document.body.classList.add('public-page');
    if (!document.querySelector('.pub-header')) {
      const s = document.createElement('script');
      s.src = '/js/public-shell.js';
      document.body.appendChild(s);
    }
  })();
})();