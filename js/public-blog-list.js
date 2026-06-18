(function() {
  'use strict';

  const grid = document.getElementById('latest-articles-grid');
  const featuredContainer = document.getElementById('featured-article-container');
  const searchInput = document.getElementById('blog-search');
  const categorySelector = document.getElementById('category-selector');
  const newsletterForm = document.getElementById('newsletter-sidebar-form');

  let currentCategory = '';
  let searchQuery = '';

  async function fetchAndRenderArticles() {
    grid.innerHTML = PubUI.loading();
    try {
      // Build query string
      let q = '';
      if (searchQuery) {
        q = `?search=${encodeURIComponent(searchQuery)}`;
      }
      
      const data = await PublicAPI.blog(q);
      
      let articles = data.items || [];

      // Client-side category filtering using keyword/tag heuristics
      if (currentCategory) {
        const cat = currentCategory.toLowerCase();
        articles = articles.filter(post => {
          const title = (post.title || '').toLowerCase();
          const excerpt = (post.excerpt || '').toLowerCase();
          const content = (post.content || '').toLowerCase();
          
          if (cat === 'research') {
            return title.includes('research') || title.includes('study') || title.includes('education') || title.includes('germany') || content.includes('research') || content.includes('study');
          } else if (cat === 'funding') {
            return title.includes('scholarship') || title.includes('fund') || title.includes('grant') || title.includes('bazaar') || excerpt.includes('fund') || content.includes('fund');
          } else if (cat === 'countries') {
            return title.includes('abroad') || title.includes('germany') || title.includes('country') || content.includes('visa') || content.includes('abroad');
          } else if (cat === 'career') {
            return title.includes('roadmap') || title.includes('become') || title.includes('career') || title.includes('editor') || content.includes('career');
          } else if (cat === 'industry') {
            return title.includes('bazaar') || title.includes('industry') || title.includes('editor') || title.includes('market') || content.includes('industry');
          }
          return false;
        });
      }

      if (articles.length === 0) {
        featuredContainer.style.display = 'none';
        grid.innerHTML = PubUI.empty('No articles match your criteria.');
        return;
      }

      // Find featured article (if active category, we don't separate featured to allow standard grid)
      let featuredPost = null;
      let regularPosts = articles;

      if (!currentCategory) {
        featuredPost = articles.find(p => p.featured === 1);
        if (featuredPost) {
          regularPosts = articles.filter(p => p.id !== featuredPost.id);
        }
      }

      // Render Featured Post
      if (featuredPost) {
        featuredContainer.style.display = 'block';
        const coverImg = featuredPost.cover_image || 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=800';
        featuredContainer.innerHTML = `
          <div class="nb-card--featured">
            <div class="featured-image" style="background-image: url('${coverImg}');"></div>
            <div class="featured-content">
              <span class="nb-card__tag pub-card__tag" style="background: var(--red); color: white;">🌟 FEATURED</span>
              <h2 style="font-family: var(--f-display); font-size: 24px; margin: 12px 0 8px 0;">
                <a href="/blog/${featuredPost.slug}" style="color: var(--text); text-decoration: none;">${featuredPost.title}</a>
              </h2>
              <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px; line-height: 1.6;">
                ${featuredPost.excerpt || ''}
              </p>
              <div style="font-size: 11px; font-family: var(--f-mono); color: var(--text-muted); display: flex; gap: 12px; align-items: center;">
                <span>By ${featuredPost.author || 'Admin'}</span>
                <span>•</span>
                <span>${featuredPost.reading_time || 1} min read</span>
                <span>•</span>
                <span>${featuredPost.published_at ? new Date(featuredPost.published_at).toLocaleDateString() : ''}</span>
              </div>
            </div>
          </div>
        `;
      } else {
        featuredContainer.style.display = 'none';
      }

      // Render Regular Articles
      if (regularPosts.length === 0) {
        grid.innerHTML = featuredPost ? '' : PubUI.empty();
        return;
      }

      grid.innerHTML = regularPosts.map(post => {
        const formattedDate = post.published_at ? new Date(post.published_at).toLocaleDateString() : '';
        return PubUI.card(post, {
          href: `/blog/${post.slug}`,
          tag: post.author || 'Admin',
          meta: `${formattedDate} · ${post.reading_time || 1} min read`
        });
      }).join('');

      // Add sound triggers if SoundEngine is present
      if (window.NEFISound) {
        document.querySelectorAll('.pub-card').forEach(card => {
          card.addEventListener('mouseenter', () => window.NEFISound.play('tap'));
        });
      }

    } catch (e) {
      grid.innerHTML = PubUI.empty('Failed to load blog articles from server.');
      console.error(e);
    }
  }

  // Bind category clicks
  categorySelector?.addEventListener('click', (e) => {
    const btn = e.target.closest('.category-tab');
    if (!btn) return;

    categorySelector.querySelectorAll('.category-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    currentCategory = btn.dataset.category || '';
    fetchAndRenderArticles();
  });

  // Debounced search
  let debounceTimeout;
  searchInput?.addEventListener('input', () => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      searchQuery = searchInput.value.trim();
      fetchAndRenderArticles();
    }, 300);
  });

  // Newsletter Form Handler
  newsletterForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const emailInput = document.getElementById('newsletter-sidebar-email');
    const email = emailInput?.value.trim();
    if (!email) return;

    const btn = newsletterForm.querySelector('button[type="submit"]');
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

  // Init load
  fetchAndRenderArticles();
})();
