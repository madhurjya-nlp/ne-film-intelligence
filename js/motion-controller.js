(function () {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    || document.documentElement.classList.contains('nefi-reduced-motion');

  function observeOnce(selector, visibleClass = 'is-visible', rootMargin = '0px 0px -8% 0px') {
    const els = document.querySelectorAll(selector);
    if (!els.length) return;

    if (reduced) {
      els.forEach((el) => el.classList.add(visibleClass));
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add(visibleClass);
        io.unobserve(entry.target);
      });
    }, { rootMargin, threshold: 0.12 });

    els.forEach((el) => io.observe(el));
  }

  function initCardDrops() {
    document.querySelectorAll('.metric-card, .nb-card--metric, .hero__stat-row').forEach((el) => {
      el.classList.add('motion-card-drop');
    });
    observeOnce('.motion-card-drop', 'is-visible');
  }

  function initDocDrops() {
    document.querySelectorAll('.nb-card--report, .pub-card.nb-card--report').forEach((el) => {
      el.classList.add('motion-doc-drop');
    });
    observeOnce('.motion-doc-drop', 'is-visible', '0px 0px -5% 0px');
  }

  function stamp(el) {
    if (!el) return;
    el.classList.add('nb-stamp', 'is-slamming');
    if (window.NEFISound) window.NEFISound.play('stamp');
    el.addEventListener('animationend', () => el.classList.remove('is-slamming'), { once: true });
  }

  function bindButtonSounds() {
    if (!window.NEFISound) return;
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.nb-btn, .btn, button[type="submit"]');
      if (btn && !btn.classList.contains('mobile-nav-toggle')) {
        window.NEFISound.play('tap');
      }
    }, { passive: true });
  }

  function bindFilterSounds() {
    if (!window.NEFISound) return;
    document.querySelectorAll('.pub-filters select, .pub-filters input, .filter-bar select').forEach((el) => {
      el.addEventListener('change', () => window.NEFISound.play('card-drop'), { passive: true });
    });
  }

  function initRoadmapTrack() {
    const track = document.querySelector('.roadmap-track');
    if (!track || reduced) return;

    const segments = track.querySelectorAll('.roadmap-track__segment');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const idx = Number(entry.target.dataset.stepIndex || 0);
        segments.forEach((seg, i) => {
          const node = seg.querySelector('.roadmap-track__node');
          const line = seg.querySelector('.roadmap-track__line');
          if (i <= idx) {
            node?.classList.add('is-active');
            line?.classList.add('is-filled');
          }
        });
      });
    }, { threshold: 0.5 });

    segments.forEach((seg) => io.observe(seg));
  }

  window.NEFIMotion = {
    init() {
      initCardDrops();
      initDocDrops();
      bindButtonSounds();
      bindFilterSounds();
      initRoadmapTrack();
    },
    stamp,
    observeOnce,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.NEFIMotion.init());
  } else {
    window.NEFIMotion.init();
  }
})();