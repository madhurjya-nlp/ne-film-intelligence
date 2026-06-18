(function () {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    || document.documentElement.classList.contains('nefi-reduced-motion');

  function staggerReveal(selector, staggerMs = 60) {
    const items = document.querySelectorAll(selector);
    if (!items.length) return;

    if (reduced) {
      items.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const io = new IntersectionObserver((entries) => {
      const visible = entries.filter((e) => e.isIntersecting).map((e) => e.target);
      visible.sort((a, b) => {
        const ai = [...items].indexOf(a);
        const bi = [...items].indexOf(b);
        return ai - bi;
      });
      visible.forEach((el, i) => {
        setTimeout(() => {
          el.classList.add('is-visible');
          io.unobserve(el);
        }, i * staggerMs);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.08 });

    items.forEach((el) => {
      el.classList.add('motion-reveal');
      io.observe(el);
    });
  }

  function activateSections() {
    const sections = document.querySelectorAll('.section, .pub-home-section');
    if (!sections.length || reduced) return;

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle('is-section-active', entry.isIntersecting);
      });
    }, { threshold: 0.2 });

    sections.forEach((s) => io.observe(s));
  }

  function initStacking() {
    const grids = document.querySelectorAll('.pub-grid, .card-grid');
    grids.forEach((grid) => {
      staggerReveal(`#${grid.id} .pub-card, #${grid.id} .nb-card, #${grid.id} .card`, 50);
    });
    staggerReveal('.reveal, .strat-item, .nc, .ql', 70);
  }

  window.NEFIScroll = {
    init() {
      initStacking();
      activateSections();
    },
    staggerReveal,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.NEFIScroll.init());
  } else {
    window.NEFIScroll.init();
  }
})();