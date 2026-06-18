(function () {
  'use strict';

  const root = document.getElementById('page-root');

  async function render(inst) {
    if (!inst) {
      root.innerHTML = `<main class="pub-main"><div class="pub-empty">Institute not found.</div></main>`;
      return;
    }

    root.innerHTML = `
      <main class="pub-main">
        <div style="margin-bottom: var(--s-3);">
          <a href="/explore" class="nb-btn nb-btn--secondary" style="display: inline-flex; align-items: center; gap: 8px;">
            ← Back to Explorer
          </a>
        </div>

        <div class="pub-hero" style="border: 4px solid #111; padding: var(--s-4); background: var(--c-bg-paper); box-shadow: 8px 8px 0 #111; margin-bottom: var(--s-5);">
          <span class="nb-badge nb-badge--country" style="margin-bottom: var(--s-2); text-transform: uppercase;">
            ${inst.country} (${inst.region})
          </span>
          <h1 style="font-family: var(--f-heading); margin-bottom: var(--s-2); font-size: var(--h1);">${inst.title}</h1>
          <p class="lead" style="font-size: 1.2rem; line-height: 1.6; margin-bottom: var(--s-3); font-family: var(--f-body);">${inst.summary}</p>
          ${inst.description ? `<div style="font-family: var(--f-body); margin-bottom: var(--s-4); opacity: 0.85;">${inst.description}</div>` : ''}
          ${inst.website_url ? `
            <a href="${inst.website_url}" target="_blank" rel="noopener noreferrer" class="nb-btn nb-btn--primary" style="display: inline-block; margin-top: var(--s-2);">
              Visit Official Website ↗
            </a>` : ''}
        </div>

        <!-- Programs Section -->
        ${inst.programs?.length ? `
          <section class="pub-home-section" style="margin-bottom: var(--s-5);">
            <h2 style="font-family: var(--f-heading); margin-bottom: var(--s-3);">Programs Offered</h2>
            <div class="pub-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: var(--s-4);">
              ${inst.programs.map((p) => `
                <div class="nb-card nb-card--opportunity pub-card" style="display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
                  <div>
                    <span class="nb-badge nb-badge--online" style="margin-bottom: var(--s-2);">${p.format}</span>
                    <h3 class="h4" style="font-family: var(--f-heading); margin-bottom: var(--s-2);">${p.title}</h3>
                    <p class="nb-card__body pub-card__body" style="font-family: var(--f-body); font-size: 0.95rem; line-height: 1.5; margin-bottom: var(--s-3);">${p.summary}</p>
                  </div>
                  <div style="border-top: 2px dashed #111; padding-top: var(--s-2); margin-top: var(--s-2);">
                    <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-family: var(--f-meta); margin-bottom: var(--s-2);">
                      <span>Cost: <strong>${p.tuition_or_cost}</strong></span>
                      ${p.deadline ? `<span>Deadline: ${p.deadline}</span>` : ''}
                    </div>
                    <a href="/explore?type=program&id=${p.slug}" class="nb-btn nb-btn--secondary nb-btn--sm" style="display: block; text-align: center; width: 100%;">
                      View Details
                    </a>
                  </div>
                </div>
              `).join('')}
            </div>
          </section>` : ''}

        <!-- Featured Alumni Section -->
        ${inst.alumni?.length ? `
          <section class="pub-home-section" style="margin-bottom: var(--s-5);">
            <h2 style="font-family: var(--f-heading); margin-bottom: var(--s-3);">Featured Alumni</h2>
            <div class="pub-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--s-4);">
              ${inst.alumni.map((a) => `
                <div class="nb-card nb-card--country pub-card" style="height: 100%;">
                  <span class="nb-badge nb-badge--verified" style="margin-bottom: var(--s-2);">Class of ${a.graduation_year}</span>
                  <h3 class="h4" style="font-family: var(--f-heading); margin-bottom: var(--s-1);">${a.name}</h3>
                  <p class="nb-card__meta pub-card__meta" style="font-family: var(--f-meta); font-size: 0.85rem; margin-bottom: var(--s-2); color: var(--c-danger);">
                    Role: <strong>${a.current_role}</strong>
                  </p>
                  <p class="nb-card__body pub-card__body" style="font-family: var(--f-body); font-size: 0.9rem; line-height: 1.5;">${a.achievement_summary}</p>
                </div>
              `).join('')}
            </div>
          </section>` : ''}

        <!-- Success Stories Section -->
        ${inst.success_stories?.length ? `
          <section class="pub-home-section" style="margin-bottom: var(--s-5);">
            <h2 style="font-family: var(--f-heading); margin-bottom: var(--s-3);">Student Success Stories</h2>
            <div style="display: flex; flex-direction: column; gap: var(--s-4);">
              ${inst.success_stories.map((s) => `
                <article class="nb-card nb-card--roadmap" style="padding: var(--s-4); border: 4px solid #111; background: var(--c-bg-paper); box-shadow: 4px 4px 0 #111;">
                  <h3 class="h3" style="font-family: var(--f-heading); margin-bottom: var(--s-1);">${s.title}</h3>
                  <p class="nb-caption" style="font-family: var(--f-meta); font-size: 0.85rem; margin-bottom: var(--s-3);">
                    Profile Feature: <strong>${s.alumni_name}</strong>
                  </p>
                  <p style="font-family: var(--f-body); font-size: 1.05rem; line-height: 1.6; margin-bottom: var(--s-3);">${s.summary}</p>
                  <div class="story-content" style="background: rgba(0,0,0,0.02); padding: var(--s-3); border-left: 4px solid var(--c-accent-yellow); margin-bottom: var(--s-3); font-family: var(--f-body); font-size: 0.95rem; line-height: 1.6;">
                    ${s.body_content}
                  </div>
                  ${s.video_url ? `
                    <div class="story-video" style="margin-top: var(--s-3); max-width: 560px;">
                      <iframe width="100%" height="315" src="${s.video_url}" frameborder="0" allowfullscreen style="border: 3px solid #111; box-shadow: 4px 4px 0 #111;"></iframe>
                    </div>` : ''}
                </article>
              `).join('')}
            </div>
          </section>` : ''}

        <!-- Career Outcomes Section -->
        ${inst.career_outcomes?.length ? `
          <section class="pub-home-section" style="margin-bottom: var(--s-5);">
            <h2 style="font-family: var(--f-heading); margin-bottom: var(--s-3);">Career Outcomes & Salary Projections</h2>
            <div class="pub-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--s-4);">
              ${inst.career_outcomes.map((o) => `
                <div class="nb-card nb-card--report pub-card" style="height: 100%; display: flex; flex-direction: column; justify-content: space-between;">
                  <div>
                    <span class="nb-badge nb-badge--scholarship" style="margin-bottom: var(--s-2);">Est. Salary: ₹${o.salary_range_low}L - ₹${o.salary_range_high}L/yr</span>
                    <h3 class="h4" style="font-family: var(--f-heading); margin-bottom: var(--s-2);">${o.title}</h3>
                    <p class="nb-card__meta pub-card__meta" style="font-family: var(--f-meta); font-size: 0.85rem; margin-bottom: var(--s-2);">
                      Placement Rate: <strong>${o.placement_rate}%</strong>
                    </p>
                    <p class="nb-card__body pub-card__body" style="font-family: var(--f-body); font-size: 0.9rem; line-height: 1.5;">${o.requirements_text}</p>
                  </div>
                </div>
              `).join('')}
            </div>
          </section>` : ''}
      </main>
    `;
  }

  (async () => {
    const slug = root.dataset.slug;
    try {
      const inst = await PublicAPI.institute(slug);
      render(inst);
    } catch (err) {
      console.error('Failed to load institute details:', err);
      root.innerHTML = `<main class="pub-main"><div class="pub-empty">Failed to load research data.</div></main>`;
    }
    document.body.classList.add('public-page');
    if (!document.querySelector('.pub-header')) {
      const s = document.createElement('script');
      s.src = '/js/public-shell.js';
      document.body.appendChild(s);
    }
  })();
})();
