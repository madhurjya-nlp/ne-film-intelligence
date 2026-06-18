(function () {
  'use strict';

  const NAV = [
    { href: '/', label: 'Home' },
    { href: '/programs.html', label: 'Programs' },
    { href: '/explore', label: 'Explore' },
    { href: '/countries', label: 'Countries' },
    { href: '/books.html', label: 'Books' },
    { href: '/events.html', label: 'Events' },
    { href: '/search', label: 'Search' },
    { href: '/admin.html', label: 'Admin' },
  ];

  const FOOTER_LINKS = [
    { href: '/programs.html', label: 'Programs' },
    { href: '/explore?type=program', label: 'Explore' },
    { href: '/countries', label: 'Countries' },
    { href: '/books.html', label: 'Books' },
    { href: '/events.html', label: 'Events' },
    { href: '/search', label: 'Search' },
    { href: '/grants.html', label: 'Grants (ref)' },
    { href: '/calendar', label: 'Calendar' },
  ];

  const CARD_TYPES = {
    pathway: 'roadmap',
    roadmap: 'roadmap',
    country: 'country',
    report: 'report',
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
            <div class="pub-footer__ver">v5.1.0 · Build 2026-06-18</div>
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

  if (shouldInject) {
    injectHeader();
    injectFooter();
    loadPlatformScripts();
  }
})();