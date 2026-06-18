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
  });

})();
