(function () {
  'use strict';

  const STORAGE_KEY = 'nefi_ui_sounds';
  const VOLUME = 0.15;

  const SOUNDS = {
    tap: '/public/audio/tap.wav',
    'card-drop': '/public/audio/card-drop.wav',
    stamp: '/public/audio/stamp.wav',
    toggle: '/public/audio/toggle.wav',
  };

  let enabled = false;
  const cache = {};

  function loadPreference() {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      enabled = v === '1';
    } catch (e) {
      enabled = false;
    }
    return enabled;
  }

  function savePreference(on) {
    enabled = !!on;
    try {
      localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0');
    } catch (e) { /* ignore */ }
  }

  function preload(name) {
    if (cache[name]) return cache[name];
    const src = SOUNDS[name];
    if (!src) return null;
    const audio = new Audio(src);
    audio.volume = VOLUME;
    audio.preload = 'auto';
    cache[name] = audio;
    return audio;
  }

  function play(name) {
    if (!enabled) return;
    const audio = preload(name);
    if (!audio) return;
    const clone = audio.cloneNode();
    clone.volume = VOLUME;
    clone.play().catch(() => {});
  }

  function injectSettings() {
    if (document.getElementById('nefi-sound-settings')) return;
    loadPreference();

    const panel = document.createElement('div');
    panel.id = 'nefi-sound-settings';
    panel.className = 'nefi-settings';
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-label', 'UI sound settings');
    panel.innerHTML = `
      <label>
        <input type="checkbox" id="nefi-sounds-toggle" ${enabled ? 'checked' : ''}>
        UI Sounds
      </label>`;

    document.body.appendChild(panel);

    const toggle = panel.querySelector('#nefi-sounds-toggle');
    toggle?.addEventListener('change', () => {
      savePreference(toggle.checked);
      if (toggle.checked) play('toggle');
    });
  }

  window.NEFISound = {
    play,
    isEnabled: () => enabled,
    setEnabled: savePreference,
    init() {
      loadPreference();
      injectSettings();
      Object.keys(SOUNDS).forEach(preload);
    },
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.NEFISound.init());
  } else {
    window.NEFISound.init();
  }
})();