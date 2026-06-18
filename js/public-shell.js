(function () {
  'use strict';

  const NAV = [
    { href: '/', label: 'Home' },
    { href: '/programs.html', label: 'Programs' },
    { href: '/explore', label: 'Explore' },
    { href: '/countries', label: 'Countries' },
    { href: '/books.html', label: 'Books' },
    { href: '/events.html', label: 'Events' },
    { href: '/blog', label: 'Blog' },
    { href: '/search', label: 'Search' },
    { href: '/admin.html', label: 'Admin' },
  ];

  const FOOTER_LINKS = [
    { href: '/programs.html', label: 'Programs' },
    { href: '/explore?type=program', label: 'Explore' },
    { href: '/countries', label: 'Countries' },
    { href: '/books.html', label: 'Books' },
    { href: '/events.html', label: 'Events' },
    { href: '/blog', label: 'Blog' },
    { href: '/search', label: 'Search' },
    { href: '/grants.html', label: 'Grants (ref)' },
    { href: '/calendar', label: 'Calendar' },
  ];

  const CARD_TYPES = {
    pathway: 'roadmap',
    roadmap: 'roadmap',
    country: 'country',
    report: 'report',
    blog: 'report',
    blog_article: 'report',
    program: 'opportunity',
    opportunity: 'opportunity',
    institute: 'opportunity',
    scholarship: 'opportunity',
    grant: 'opportunity',
    event: 'opportunity',
  };

  function navLink(n, path, className) {
    const active = (n.href === '/' && path === '/') || (n.href !== '/' && path.startsWith(n.href.replace('.html', '')));
    return `<a href="${n.href}" class="${className}${active ? ' active' : ''}" ${active ? 'aria-current="page"' : ''}>${n.label}</a>`;
  }

  function injectHeader() {
    const path = window.location.pathname;
    const navHtml = NAV.map((n) => navLink(n, path, '')).join('');

    const header = document.createElement('header');
    header.className = 'pub-header';
    header.innerHTML = `
      <div class="pub-header__inner">
        <a href="/" class="header-wordmark">NE Film Intelligence <span class="nb-caption">(NEFI)</span></a>
        <nav class="pub-nav" aria-label="Research navigation">${navHtml}</nav>
        <button type="button" class="mobile-nav-toggle" id="pub-mobile-toggle" aria-label="Open menu" aria-expanded="false" aria-controls="pub-mobile-panel">
          <span></span><span></span><span></span>
        </button>
      </div>`;

    const panel = document.createElement('nav');
    panel.className = 'mobile-nav-panel';
    panel.id = 'pub-mobile-panel';
    panel.setAttribute('aria-label', 'Mobile navigation');
    panel.innerHTML = NAV.map((n) => navLink(n, path, '')).join('');

    const anchor = document.querySelector('.ticker') || document.body.firstChild;
    document.body.insertBefore(header, anchor);
    document.body.appendChild(panel);

    const toggle = document.getElementById('pub-mobile-toggle');
    toggle?.addEventListener('click', () => {
      const open = panel.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    panel.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => {
        panel.classList.remove('open');
        toggle?.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  function injectFooter() {
    document.querySelectorAll('.site-footer').forEach((el) => el.remove());

    const footer = document.createElement('footer');
    footer.className = 'pub-footer';
    footer.setAttribute('role', 'contentinfo');
    footer.innerHTML = `
      <div class="container">
        <div class="pub-footer__grid">
          <div>
            <div class="pub-footer__brand">NE Film <span>Intelligence</span></div>
            <p class="pub-footer__tagline">Programs &amp; institutions research for Assam &amp; Northeast India filmmakers</p>
          </div>
          <div class="pub-footer__center">
            <div class="pub-footer__ver">v6.0.0 · Build 2026-06-18</div>
            <div class="pub-footer__ver pub-footer__ver--highlight">Database-verified programs · Personal research</div>
          </div>
          <div>
            <nav class="pub-footer__links" aria-label="Footer links">
              ${FOOTER_LINKS.map((l) => `<a href="${l.href}">${l.label}</a>`).join('')}
            </nav>
          </div>
        </div>
      </div>`;
    document.body.appendChild(footer);
  }

  function resolveCardType(tag, explicit) {
    if (explicit) return explicit;
    const key = (tag || '').toLowerCase();
    return CARD_TYPES[key] || 'opportunity';
  }

  window.PubUI = {
    card(item, opts = {}) {
      const href = opts.href || '#';
      const tag = opts.tag || '';
      const meta = opts.meta || '';
      const cardType = resolveCardType(tag, opts.cardType);
      const countdown = opts.countdown != null
        ? `<span class="pub-countdown ${opts.countdown <= 30 ? 'pub-countdown--soon' : ''}">${opts.countdown > 0 ? opts.countdown + ' days left' : 'Expired'}</span>`
        : '';
      return `
        <article class="nb-card nb-card--${cardType} pub-card">
          ${tag ? `<span class="nb-card__tag pub-card__tag">${tag}</span>` : ''}
          <a class="nb-card__title pub-card__title" href="${href}">${item.title || item.name}</a>
          <p class="nb-card__body pub-card__body">${(item.summary || '').slice(0, 160)}</p>
          <div class="nb-card__meta pub-card__meta">${meta} ${countdown}</div>
        </article>`;
    },

    metric(label, value) {
      return `
        <div class="nb-card nb-card--metric metric-card">
          <div class="metric-value">${value}</div>
          <div class="metric-label">${label}</div>
        </div>`;
    },

    empty(msg) {
      return `<div class="pub-empty" role="status"><p>${msg || 'No results found.'}</p></div>`;
    },

    loading() {
      return `<div class="pub-empty" role="status" aria-live="polite">Loading research data…</div>`;
    },
  };

  const shouldInject = document.body.classList.contains('public-page')
    || document.body.hasAttribute('data-pub-header')
    || document.body.hasAttribute('data-pub-shell');

  function loadPlatformScripts() {
    const scripts = ['/js/sound-engine.js', '/js/motion-controller.js', '/js/scroll-engine.js'];
    scripts.forEach((src) => {
      if (document.querySelector(`script[src="${src}"]`)) return;
      const s = document.createElement('script');
      s.src = src;
      s.defer = true;
      document.body.appendChild(s);
    });
  }

  function initNewsletterPopup() {
    const isDismissedForever = localStorage.getItem('nefi_newsletter_dismissed_forever') === 'true';
    const dismissedAt = localStorage.getItem('nefi_newsletter_dismissed');
    if (isDismissedForever) return;
    if (dismissedAt && (Date.now() - parseInt(dismissedAt, 10)) < 7 * 24 * 60 * 60 * 1000) return;

    // Inject CSS
    const style = document.createElement('style');
    style.innerHTML = `
      .nb-newsletter-popup {
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 320px;
        background: var(--surface, #F5F1E8);
        border: 4px solid var(--rule, #111);
        padding: 24px;
        box-shadow: 6px 6px 0 var(--rule, #111);
        z-index: 10000;
        transform: translateY(150%);
        transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }
      .nb-newsletter-popup.open {
        transform: translateY(0);
      }
      .nb-newsletter-popup .popup-close-btn {
        position: absolute;
        top: 8px;
        right: 12px;
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        font-family: inherit;
        color: var(--text, #111);
      }
      .nb-newsletter-popup .popup-title {
        font-family: var(--f-display, 'Space Grotesk'), sans-serif;
        font-size: 20px;
        margin: 4px 0 8px;
        font-weight: 800;
      }
      .nb-newsletter-popup .popup-desc {
        font-size: 13px;
        color: var(--text-secondary, #666);
        margin-bottom: 16px;
        line-height: 1.5;
      }
      .nb-newsletter-popup .popup-dismiss-forever-btn {
        background: none;
        border: none;
        color: var(--text-secondary, #666);
        text-decoration: underline;
        font-size: 11px;
        cursor: pointer;
      }
      .nb-newsletter-popup .popup-dismiss-forever-btn:hover {
        color: var(--red, #FF4D4D);
      }
      @media (max-width: 480px) {
        .nb-newsletter-popup {
          bottom: 0;
          right: 0;
          width: 100%;
          border-left: none;
          border-right: none;
          border-bottom: none;
          box-shadow: 0 -4px 0 var(--rule, #111);
          transform: translateY(100%);
        }
      }
    `;
    document.head.appendChild(style);

    // Create Popup Element
    const popup = document.createElement('div');
    popup.id = 'nefi-newsletter-popup';
    popup.className = 'nb-newsletter-popup';
    popup.innerHTML = `
      <button type="button" class="popup-close-btn" id="nefi-popup-close" aria-label="Close popup">&times;</button>
      <p class="nb-eyebrow" style="margin: 0;">Weekly Intelligence</p>
      <h3 class="popup-title">Join the Engine</h3>
      <p class="popup-desc">Get the latest grants, online degrees, and NE India research updates in your inbox.</p>
      <form id="nefi-popup-form">
        <input type="email" id="nefi-popup-email" placeholder="Your email address" required class="nb-input" style="width: 100%;">
        <button type="submit" class="nb-btn --primary" style="width: 100%; margin-top: 8px;">Subscribe</button>
      </form>
      <div style="margin-top: 12px; text-align: center;">
        <button type="button" id="nefi-popup-dismiss-forever" class="popup-dismiss-forever-btn">Dismiss forever</button>
      </div>
    `;
    document.body.appendChild(popup);

    let isShown = false;
    function showPopup() {
      if (isShown) return;
      isShown = true;
      popup.classList.add('open');
      
      // Remove triggers
      clearTimeout(timerId);
      window.removeEventListener('scroll', checkScrollTriggers);
    }

    function dismissPopup(forever = false) {
      popup.classList.remove('open');
      if (forever) {
        localStorage.setItem('nefi_newsletter_dismissed_forever', 'true');
      } else {
        localStorage.setItem('nefi_newsletter_dismissed', Date.now().toString());
      }
    }

    // Bind Close and Dismiss Buttons
    document.getElementById('nefi-popup-close').addEventListener('click', () => dismissPopup(false));
    document.getElementById('nefi-popup-dismiss-forever').addEventListener('click', () => dismissPopup(true));

    // Handle Form Submit
    document.getElementById('nefi-popup-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('nefi-popup-email').value;
      const btn = e.target.querySelector('button[type="submit"]');
      btn.innerText = 'Subscribing...';
      btn.disabled = true;
      try {
        if (window.PublicAPI && typeof window.PublicAPI.subscribeNewsletter === 'function') {
          await window.PublicAPI.subscribeNewsletter(email);
        } else {
          const res = await fetch('/api/newsletter/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
          });
          if (!res.ok) throw new Error('Failed');
        }
        btn.innerText = 'Subscribed!';
        alert('Thank you for subscribing to NE Film Intelligence!');
        dismissPopup(true);
      } catch (err) {
        console.error(err);
        alert('Failed to subscribe. Please try again.');
        btn.innerText = 'Subscribe';
        btn.disabled = false;
      }
    });

    // Triggers
    const timerId = setTimeout(showPopup, 60000);

    function checkScrollTriggers() {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight <= 0) return;

      const pct = (scrollTop / scrollHeight) * 100;

      if (pct >= 40) {
        showPopup();
        return;
      }

      const hasBlogDetail = document.querySelector('[data-page="blog-detail"]');
      if (hasBlogDetail && pct >= 85) {
        showPopup();
      }
    }

    window.addEventListener('scroll', checkScrollTriggers, { passive: true });
  }

  if (shouldInject) {
    injectHeader();
    injectFooter();
    loadPlatformScripts();
    initNewsletterPopup();
  }
})();