(function () {
  'use strict';

  const root = document.getElementById('page-root');
  const list = document.getElementById('graph-list');

  function labelFor(nodes, type, id) {
    const n = (nodes || []).find((x) => x.type === type && x.id === id);
    return n?.label || type;
  }

  async function load() {
    list.innerHTML = PubUI.loading();
    const params = new URLSearchParams(window.location.search);
    const rootType = params.get('type');
    const rootId = params.get('id');
    const data = await PublicAPI.relationships({
      root_type: rootType,
      root_id: rootId,
    });

    const crumb = document.getElementById('graph-breadcrumb');
    if (crumb) {
      if (rootType && rootId) {
        const rootLabel = labelFor(data.nodes, rootType, rootId);
        crumb.innerHTML = `<a href="/relationships" style="color:var(--text-muted);">All pathways</a> → <strong>${rootLabel}</strong>`;
      } else {
        crumb.textContent = 'Showing all mapped relationships';
      }
    }

    if (!data.edges?.length) {
      list.innerHTML = PubUI.empty('No relationships mapped yet.');
      return;
    }

    list.innerHTML = data.edges.map((e) => `
      <div class="pub-graph-chain">
        <a href="/relationships?type=${e.from_type}&id=${e.from_id}">${labelFor(data.nodes, e.from_type, e.from_id)}</a>
        <span class="pub-graph-arrow">→ ${e.relationship_type} →</span>
        <a href="/relationships?type=${e.to_type}&id=${e.to_id}">${labelFor(data.nodes, e.to_type, e.to_id)}</a>
        ${e.notes ? `<span style="color:var(--text-muted);font-size:11px;">(${e.notes})</span>` : ''}
      </div>
    `).join('');
  }

  load();
})();