(function () {
  'use strict';

  const root = document.getElementById('page-root');
  if (!root) return;

  function render(post) {
    const formattedDate = post.published_at ? new Date(post.published_at).toLocaleDateString() : 'Draft';
    const coverHtml = post.cover_image
      ? `<div class="article-cover" style="width: 100%; height: 350px; background-image: url('${post.cover_image}'); background-size: cover; background-position: center; border: 4px solid var(--rule); border-radius: var(--radius); margin-bottom: 24px; box-shadow: var(--shadow-sm);"></div>`
      : '';

    const relatedHtml = post.related_articles && post.related_articles.length > 0
      ? `
        <section class="pub-home-section" style="border-top: 4px solid var(--rule); padding-top: 40px; margin-top: 40px;">
          <h2 style="font-family: var(--f-display); font-size: 24px; margin-bottom: 20px;">Related Articles</h2>
          <div class="pub-grid">
            ${post.related_articles.map(p => PubUI.card(p, {
              href: `/blog/${p.slug}`,
              tag: p.author || 'Admin',
              meta: `${p.published_at ? new Date(p.published_at).toLocaleDateString() : ''} · ${p.reading_time || 1} min read`
            })).join('')}
          </div>
        </section>
      `
      : '';

    root.innerHTML = `
      <main class="pub-main">
        <div class="container" style="max-width: 800px; margin: 0 auto; padding-top: 40px;">
          <p class="page-hero__breadcrumb"><a href="/">Home</a> <span>/</span> <a href="/blog">Blog</a> <span>/</span> <span>${post.title}</span></p>
          
          <article class="blog-post" style="margin-top: 24px;">
            <header class="blog-post__header" style="margin-bottom: 32px;">
              <h1 style="font-family: var(--f-display); font-size: 38px; line-height: 1.2; margin-bottom: 16px;">${post.title}</h1>
              
              <div style="font-size: 12px; font-family: var(--f-mono); color: var(--text-secondary); display: flex; flex-wrap: wrap; gap: 16px; align-items: center; border-bottom: 1px solid var(--rule-light); padding-bottom: 16px;">
                <span>By <strong>${post.author || 'Admin'}</strong></span>
                <span>•</span>
                <span>Published: ${formattedDate}</span>
                <span>•</span>
                <span>Reading Time: ${post.reading_time || 1} min read</span>
              </div>
            </header>

            ${coverHtml}

            <div class="blog-post__body nb-rich-text" style="font-size: 16px; line-height: 1.8; color: var(--text);">
              ${post.content}
            </div>
            
            <!-- Newsletter End Widget -->
            <div class="nb-alert nb-alert--info" style="margin-top: 48px; border: 4px solid var(--rule); border-radius: var(--radius); padding: 24px; background: var(--bg-elevated);">
              <h3 style="font-family: var(--f-display); font-size: 16px; margin-bottom: 8px;">Never miss a resource update</h3>
              <p style="font-size: 12px; line-height: 1.5; margin-bottom: 16px; color: var(--text-secondary);">
                Get raw updates on opportunities, scholarships, admissions deadlines, and film festival strategies sent directly to your inbox.
              </p>
              <form id="newsletter-article-form" style="display: flex; gap: 8px; flex-wrap: wrap;">
                <input type="email" placeholder="Your email address" required class="nb-input" id="newsletter-article-email" style="flex: 1; min-width: 200px;">
                <button type="submit" class="nb-btn --primary">Subscribe</button>
              </form>
            </div>
          </article>
          
          ${relatedHtml}
        </div>
      </main>
    `;

    // Bind article newsletter form
    document.getElementById('newsletter-article-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('newsletter-article-email');
      const email = emailInput?.value.trim();
      if (!email) return;

      const btn = e.target.querySelector('button[type="submit"]');
      const originalText = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Subscribing...';

      try {
        await PublicAPI.subscribeNewsletter(email);
        alert('Thank you for subscribing to NE Film Intelligence newsletter!');
        emailInput.value = '';
      } catch (err) {
        alert('Subscription failed: email may already be registered or invalid.');
      } finally {
        btn.disabled = false;
        btn.textContent = originalText;
      }
    });

    // Add sound trigger to links in content
    if (window.NEFISound) {
      document.querySelectorAll('.blog-post__body a, .pub-card').forEach(el => {
        el.addEventListener('mouseenter', () => window.NEFISound.play('tap'));
      });
    }
  }

  (async () => {
    const slug = root.dataset.slug;
    try {
      const post = await PublicAPI.blogPost(slug);
      render(post);
    } catch (e) {
      root.innerHTML = PubUI.empty('Failed to load this blog post. It may have been archived or deleted.');
    }
  })();
})();
