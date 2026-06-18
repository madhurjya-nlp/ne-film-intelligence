/* ═══════════════════════════════════════════════════════
   THE FILM PATH — Shared JavaScript v2.0
   Scroll reveals, navigation, search, filtering, accordion
   ═══════════════════════════════════════════════════════ */

(function() {
  'use strict';

  /* ── Scroll Reveal via IntersectionObserver ── */
  function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal');
    if (!reveals.length) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      reveals.forEach(el => {
        el.classList.add('visible');
      });
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    reveals.forEach(el => observer.observe(el));
  }

  /* ── Mobile Menu Toggle ── */
  function initMobileMenu() {
    const toggle = document.querySelector('.menu-toggle');
    const mobileNav = document.querySelector('.mobile-nav');
    if (!toggle || !mobileNav) return;

    toggle.addEventListener('click', () => {
      toggle.classList.toggle('open');
      mobileNav.classList.toggle('open');
      document.body.style.overflow = mobileNav.classList.contains('open') ? 'hidden' : '';
    });

    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        toggle.classList.remove('open');
        mobileNav.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  /* ── Accordion ── */
  function initAccordions() {
    document.querySelectorAll('.accordion__trigger').forEach(trigger => {
      trigger.addEventListener('click', () => {
        const item = trigger.closest('.accordion__item');
        const wasOpen = item.classList.contains('open');

        // Close siblings
        item.parentElement.querySelectorAll('.accordion__item.open').forEach(open => {
          open.classList.remove('open');
        });

        if (!wasOpen) {
          item.classList.add('open');
        }
      });
    });
  }

  /* ── Filter Buttons ── */
  function initFilters() {
    document.querySelectorAll('.filter-bar').forEach(bar => {
      const buttons = bar.querySelectorAll('.filter-btn');
      const targetId = bar.dataset.target;
      const target = targetId ? document.getElementById(targetId) : bar.nextElementSibling;
      if (!target) return;

      buttons.forEach(btn => {
        btn.addEventListener('click', () => {
          // Update active state
          buttons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');

          const filter = btn.dataset.filter;
          const items = target.querySelectorAll('[data-category]');

          items.forEach(item => {
            if (filter === 'all' || item.dataset.category === filter || item.dataset.category?.includes(filter)) {
              item.style.display = '';
              item.style.opacity = '0';
              item.style.transform = 'translateY(10px)';
              requestAnimationFrame(() => {
                item.style.transition = 'opacity 300ms ease, transform 300ms ease';
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
              });
            } else {
              item.style.display = 'none';
            }
          });
        });
      });
    });
  }

  /* ── Search ── */
  function initSearch() {
    document.querySelectorAll('.search-input').forEach(input => {
      const targetId = input.dataset.target;
      const target = targetId ? document.getElementById(targetId) : null;
      if (!target) return;

      input.addEventListener('input', debounce((e) => {
        const query = e.target.value.toLowerCase().trim();
        const items = target.querySelectorAll('[data-searchable]');

        items.forEach(item => {
          const text = item.textContent.toLowerCase();
          item.style.display = text.includes(query) || query === '' ? '' : 'none';
        });

        // Update count
        const countEl = document.querySelector('.search-count');
        if (countEl) {
          const visible = target.querySelectorAll('[data-searchable]:not([style*="display: none"])').length;
          countEl.textContent = `${visible} results`;
        }
      }, 200));
    });
  }

  /* ── Continent Progress Bars ── */
  function initProgressBars() {
    const grid = document.querySelector('.continent-grid');
    if (!grid) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const fills = entry.target.querySelectorAll('.cc-fill');
        fills.forEach((el, i) => {
          setTimeout(() => {
            el.style.width = (el.dataset.fill || 0) + '%';
          }, i * 100);
        });
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.2 });

    observer.observe(grid);
  }

  /* ── Set Current Date ── */
  function initDates() {
    const today = new Date().toISOString().split('T')[0];
    ['header-date', 'footer-ts'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = id === 'footer-ts' ? 'Last updated: ' + today : today;
    });
  }

  /* ── Keyboard Navigation ── */
  function initKeyboardNav() {
    document.querySelectorAll('.card, .nc, .cc').forEach(el => {
      if (!el.getAttribute('tabindex')) {
        el.setAttribute('tabindex', '0');
      }
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          el.click();
        }
      });
    });
  }

  /* ── Active Nav Highlighting ── */
  function initActiveNav() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.header-nav a, .mobile-nav a').forEach(link => {
      const href = link.getAttribute('href');
      if (href && (href === currentPage || href.endsWith(currentPage) || (currentPage === 'index.html' && href === './'))) {
        link.classList.add('active');
      }
    });
  }

  /* ── Smooth Scroll for # links ── */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', (e) => {
        const target = document.querySelector(link.getAttribute('href'));
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  /* ── Debounce utility ── */
  function debounce(fn, ms) {
    let timer;
    return function(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  /* ── Reduced Motion Check ── */
  function respectReducedMotion() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.querySelectorAll('.cc-fill').forEach(el => {
        el.style.transition = 'none';
        el.style.width = (el.dataset.fill || 0) + '%';
      });
    }
  }

  /* ── Rich Expandable Cards (film-reel details) ── */
  function initRichExpanders() {
    // Native details already work; this adds keyboard + smooth + film touch
    document.querySelectorAll('.film-reel-details').forEach(details => {
      const summary = details.querySelector('summary');
      if (!summary) return;

      details.addEventListener('toggle', () => {
        if (details.open) {
          // subtle reveal
          details.style.transition = 'border-color var(--dur) var(--ease)';
        }
      });

      // Ensure keyboard friendly (already native)
      summary.setAttribute('tabindex', '0');
    });
  }

  /* ── Personal Filters (activate + extend for Online/ST/Infra) ── */
  function initPersonalFilters() {
    const bars = document.querySelectorAll('.filter-bar');
    if (!bars.length) return;

    bars.forEach(bar => {
      const buttons = bar.querySelectorAll('.filter-btn');
      const targetSelector = bar.dataset.target || '.card-grid';
      const target = document.querySelector(targetSelector);
      if (!target) return;

      buttons.forEach(btn => {
        btn.addEventListener('click', () => {
          buttons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');

          const filter = btn.dataset.filter;
          const cards = target.querySelectorAll('.card, [data-category]');

          cards.forEach(card => {
            const cat = (card.dataset.category || '').toLowerCase();
            const online = (card.dataset.format || '').toLowerCase().includes('online') || card.dataset.online === 'true';
            const st = card.dataset.stEligible === 'yes' || cat.includes('india') || cat.includes('st');

            let show = true;
            if (filter === 'online' && !online) show = false;
            if (filter === 'st' && !st) show = false;
            if (filter === 'infra' && !cat.includes('infra') && !card.textContent.toLowerCase().includes('network')) show = false;

            if (show || filter === 'all') {
              card.style.display = '';
            } else {
              card.style.display = 'none';
            }
          });
        });
      });
    });
  }

  /* ── Personal Notes (localStorage for this personal doc) ── */
  function initPersonalNotes() {
    const areas = document.querySelectorAll('[data-personal-notes]');
    areas.forEach(area => {
      const key = 'film-path-notes-' + (area.dataset.notesKey || 'default');
      // restore
      const saved = localStorage.getItem(key);
      if (saved) area.value = saved;

      const save = debounce(() => {
        localStorage.setItem(key, area.value);
      }, 400);

      area.addEventListener('input', save);

      // optional export button if present
      const exportBtn = document.querySelector('[data-export-notes]');
      if (exportBtn) {
        exportBtn.addEventListener('click', () => {
          const blob = new Blob([area.value], {type: 'text/plain'});
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'my-film-path-notes.txt';
          a.click();
          URL.revokeObjectURL(url);
        });
      }
    });
  }

  /* ── High-End Magnetic Buttons + Fluid Expands ── */
  function initHighEndInteractions() {
    // Magnetic CTAs (light JS for premium feel)
    document.querySelectorAll('.magnetic-cta').forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * 6;
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * 4;
        btn.style.transform = `translate(${x}px, ${y}px)`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translate(0,0)';
      });
    });

    // Fluid expand for film-reel (add spring feel)
    document.querySelectorAll('.film-reel-details').forEach(details => {
      details.addEventListener('toggle', () => {
        if (details.open) {
          details.style.transition = `border-color var(--dur) var(--ease), max-height var(--dur) var(--ease-spring)`;
        }
      });
    });
  }

  /* ── Data Seam + Renderer Adapter (deepens Programs module) ── */
  function renderBentoCard(program) {
    const el = document.createElement('div');
    el.className = `bento-card glass-card double-bezel`;
    Object.keys(program.dataAttrs || {}).forEach(k => {
      el.dataset[k] = program.dataAttrs[k];
    });

    const detailsHtml = `
      <details class="film-reel-details">
        <summary>▼ DETAILED — Fees, Assam logistics, online/flex, network value</summary>
        <div class="rich-panel">
          <div class="meta-row">
            <span class="meta"><b>Cost</b>: ${program.details.cost}</span>
            <span class="meta">data-verified: 2026-06-18</span>
          </div>
          <p><strong>Online/Flex:</strong> ${program.details.online}</p>
          <h4>From North Lakhimpur / Assam Ground Reality</h4>
          <ul>
            ${program.details.assam.split('\n').map(line => `<li>${line}</li>`).join('')}
          </ul>
          <h4>Network + Knowledge + Infra Value</h4>
          <p>${program.details.value}</p>
          <p><strong>Next step:</strong> ${program.details.next}</p>
          <p><strong>Source:</strong> ${program.details.source}</p>
        </div>
      </details>
    `;

    el.innerHTML = `
      <div class="double-bezel-inner">
        <h3 class="card__title">${program.title}</h3>
        <div class="card__meta">${program.meta}</div>
        <div class="card__body">${program.body}</div>
        ${detailsHtml}
        <div class="card__foot">
          <span class="card__detail"><b>${program.band}L</b></span>
          <a href="${program.link}" target="_blank" rel="noopener" class="magnetic-cta">Visit Site <span class="icon-island">→</span></a>
        </div>
      </div>
    `;
    return el;
  }

  function initDataRenderer() {
    const container = document.getElementById('path-bento');
    if (!container || !window.FILM_PATH_PROGRAMS) return;

    container.innerHTML = '';

    const programs = window.FILM_PATH_PROGRAMS;
    programs.forEach(prog => {
      const card = renderBentoCard(prog);
      container.appendChild(card);
    });

    if (typeof initRichExpanders === 'function') initRichExpanders();
    if (typeof initHighEndInteractions === 'function') initHighEndInteractions();
  }

  /* ── Artistic Mixed-Media Popup / Notification ── */
  function showArtPopup(title, message, autoClose = 4200) {
    const popup = document.createElement('div');
    popup.className = 'art-popup';
    popup.innerHTML = `
      <div class="close">×</div>
      <h4>${title}</h4>
      <p>${message}</p>
    `;
    document.body.appendChild(popup);

    popup.querySelector('.close').onclick = () => popup.remove();

    if (autoClose) {
      setTimeout(() => {
        if (popup.parentNode) popup.remove();
      }, autoClose);
    }
    return popup;
  }

  /* ── Slow Guided Landing (progressive reveal + directions) ── */
  function initGuidedLanding() {
    const steps = document.querySelectorAll('.guide-step');
    if (!steps.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add('visible');
            // Trigger artistic notification on key steps
            if (entry.target.dataset.notify) {
              showArtPopup("Note from the archive", entry.target.dataset.notify, 3200);
            }
          }, i * 180);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.35 });

    steps.forEach(s => observer.observe(s));
  }

  /* ── Similar deepening for Grants / Books / Events ── */
  function renderGrantCard(grant) {
    const el = document.createElement('div');
    el.className = 'grant-card glass-card double-bezel';
    el.innerHTML = `
      <div class="double-bezel-inner">
        <h3>${grant.title}</h3>
        <div class="meta">${grant.org} • ${grant.amount}</div>
        <p>${grant.ne_notes}</p>
        <div class="foot">
          <span class="detail">${grant.deadline}</span>
          <a href="${grant.url}" target="_blank" class="magnetic-cta">Apply <span class="icon-island">→</span></a>
        </div>
      </div>
    `;
    return el;
  }

  function initGrantsRenderer() {
    const container = document.getElementById('grants-container');
    if (!container || !window.FILM_PATH_GRANTS) return;
    container.innerHTML = '';
    window.FILM_PATH_GRANTS.forEach(g => container.appendChild(renderGrantCard(g)));
  }

  const BOOK_LINK_ORDER = { open_access: 1, publisher: 2, amazon: 3, archive: 1, goodreads: 4 };

  function resolveBookLinks(book) {
    const links = (book.external_links || []).slice();
    if (!links.length && book.link) {
      links.push({ link_type: 'archive', url: book.link, label: 'Read', priority: 1 });
    }
    return links.sort((a, b) => {
      const pa = BOOK_LINK_ORDER[a.link_type] ?? (a.priority || 99);
      const pb = BOOK_LINK_ORDER[b.link_type] ?? (b.priority || 99);
      return pa - pb;
    });
  }

  function renderBookCard(book) {
    const el = document.createElement('div');
    el.className = 'book-card glass-card double-bezel motion-reveal';
    const links = resolveBookLinks(book);
    const linksHtml = links.map((l) => {
      const label = l.label || l.link_type.replace('_', ' ');
      return `<a href="${l.url}" target="_blank" rel="noopener" class="book-link book-link--${l.link_type}">${label} →</a>`;
    }).join('');
    el.innerHTML = `
      <div class="double-bezel-inner">
        <h3>${book.title}</h3>
        <div class="author">${book.author} — ${book.category}</div>
        <p><strong>Why it matters:</strong> ${book.why}</p>
        <p class="ne"><strong>NE relevance:</strong> ${book.ne_relevance}</p>
        <div class="book-links">${linksHtml}</div>
      </div>
    `;
    return el;
  }

  function initBooksRenderer() {
    const container = document.getElementById('books-container');
    if (!container || !window.FILM_PATH_BOOKS) return;
    container.innerHTML = '';
    window.FILM_PATH_BOOKS.forEach(b => container.appendChild(renderBookCard(b)));
  }

  function renderEventCard(ev) {
    const el = document.createElement('div');
    el.className = 'event-card glass-card double-bezel';
    el.innerHTML = `
      <div class="double-bezel-inner">
        <h3>${ev.title}</h3>
        <div class="type">${ev.type} • ${ev.when}</div>
        <p>${ev.ne_relevance}</p>
        <a href="${ev.url}" target="_blank" class="magnetic-cta">Details</a>
      </div>
    `;
    return el;
  }

  function initEventsRenderer() {
    const container = document.getElementById('events-container');
    if (!container || !window.FILM_PATH_EVENTS) return;
    container.innerHTML = '';
    window.FILM_PATH_EVENTS.forEach(e => container.appendChild(renderEventCard(e)));
  }

  /* ── Initialize Everything on DOM Ready ── */
  document.addEventListener('DOMContentLoaded', () => {
    initScrollReveal();
    initMobileMenu();
    initAccordions();
    initFilters();
    initSearch();
    initProgressBars();
    initDates();
    initKeyboardNav();
    initActiveNav();
    initSmoothScroll();
    respectReducedMotion();

    // New personal hub enhancements (design-approved)
    initRichExpanders();
    initPersonalFilters();
    initPersonalNotes();
    initHighEndInteractions();

    // Data seam adapters
    initDataRenderer();
    initGrantsRenderer();
    initBooksRenderer();
    initEventsRenderer();

    initGuidedLanding();
  });

})();
