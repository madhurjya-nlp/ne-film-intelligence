/**
 * NE Film Intelligence (NEFI) — Admin Console Client Scripts
 * Vanilla JS to handle CRUD, Moderation, and Syndication
 */

(function() {
  'use strict';

  // API Base Path
  const API_BASE = '/api';

  // State
  let currentTab = 'research-overview';
  let institutesList = [];
  let activeEditItem = null;
  let activeModItem = null;
  let editorInstance = null;
  let autosaveTimer = null;

  // DOM Elements
  const tabButtons = document.querySelectorAll('.admin-nav-btn');
  const itemsList = document.getElementById('items-list');
  const loadingEl = document.getElementById('loading');
  const btnSyncStatic = document.getElementById('btn-sync-static');
  const btnRunSync = document.getElementById('btn-run-sync');
  const btnAddItem = document.getElementById('btn-add-item');
  const toastNotify = document.getElementById('toast-notify');

  // Filters
  const searchBox = document.getElementById('search-box');
  const filterRegion = document.getElementById('filter-region');
  const filterFormat = document.getElementById('filter-format');
  const filterStatus = document.getElementById('filter-status');
  const filterRegionGroup = document.getElementById('filter-region-group');
  const filterFormatGroup = document.getElementById('filter-format-group');

  // Modals
  const modModal = document.getElementById('mod-modal');
  const editModal = document.getElementById('edit-modal');
  const entryForm = document.getElementById('entry-form');
  const modNotes = document.getElementById('mod-notes');
  const modStatusSelect = document.getElementById('mod-status-select');
  const modReviewerName = document.getElementById('mod-reviewer-name');
  const modTargetInfo = document.getElementById('mod-target-info');

  // ── TOAST NOTIFICATION ──
  function showToast(message) {
    toastNotify.textContent = message;
    toastNotify.classList.add('show');
    setTimeout(() => {
      toastNotify.classList.remove('show');
    }, 4000);
  }

  // ── LOAD INSTITUTES LIST (for dropdowns) ──
  async function loadInstitutesList() {
    try {
      const res = await fetch(`${API_BASE}/institutes?limit=100`);
      if (res.ok) {
        const data = await res.json();
        institutesList = data.items || [];
        
        // Populate dropdown
        const instSelect = document.getElementById('form-institute-id');
        if (instSelect) {
          instSelect.innerHTML = '<option value="">-- Select Institute --</option>';
          institutesList.forEach(i => {
            instSelect.innerHTML += `<option value="${i.id}">${i.title} (${i.country})</option>`;
          });
        }
      }
    } catch (err) {
      console.error('Failed to load institutes list', err);
    }
  }

  const INGESTION_TABS = ['sources', 'sync-history', 'discoveries'];
  const INTELLIGENCE_TABS = ['research-overview', 'roadmaps', 'reports', 'countries', 'knowledge-graph'];

  async function fetchDashboard() {
    loadingEl.style.display = 'block';
    itemsList.innerHTML = '';
    try {
      const res = await fetch(`${API_BASE}/intelligence/dashboard`);
      if (!res.ok) throw new Error('Dashboard API error');
      const data = await res.json();
      loadingEl.style.display = 'none';

      const metrics = [
        { label: 'Total Opportunities', value: data.total_opportunities },
        { label: 'Active (Published)', value: data.active_opportunities },
        { label: 'Countries Covered', value: data.countries_covered },
        { label: 'Institutes', value: data.institutes_covered },
        { label: 'Upcoming Deadlines', value: data.upcoming_deadlines },
        { label: 'Pending Reviews', value: data.pending_reviews },
        { label: 'Roadmaps', value: data.roadmaps },
        { label: 'Blog Articles', value: data.blog?.total || 0 },
      ];

      const recentBlogHtml = data.blog?.recent && data.blog.recent.length > 0
        ? `
          <div class="item-card" style="margin-top: 16px;">
            <div class="item-card__header"><h3 class="item-card__title">Recent Blog Articles</h3></div>
            <div class="item-card__body">
              <ul style="padding-left: 18px; margin: 8px 0;">
                ${data.blog.recent.map(post => `
                  <li style="margin-bottom: 8px;">
                    <strong>${post.title}</strong> 
                    <span class="status-badge ${post.status}" style="font-size: 8px; padding: 1px 6px; margin-left: 6px;">${post.status}</span>
                    <span style="font-size: 11px; color: var(--text-muted); font-family: var(--f-mono); margin-left: 8px;">
                      Created: ${new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </li>
                `).join('')}
              </ul>
            </div>
          </div>
        `
        : '';

      itemsList.innerHTML = `
        <div class="metrics-grid">
          ${metrics.map(m => `
            <div class="metric-card">
              <div class="metric-card__value">${m.value}</div>
              <div class="metric-card__label">${m.label}</div>
            </div>
          `).join('')}
        </div>
        <div class="item-card verified">
          <div class="item-card__header"><h3 class="item-card__title">Breakdown</h3></div>
          <div class="item-card__body">
            <strong>Programs:</strong> ${data.breakdown.programs.total} total, ${data.breakdown.programs.active} active, ${data.breakdown.programs.pending} pending<br>
            <strong>Grants:</strong> ${data.breakdown.opportunities.total} total, ${data.breakdown.opportunities.active} active<br>
            <strong>Events:</strong> ${data.breakdown.events.total} total, ${data.breakdown.events.active} active<br>
            <strong>Blog Articles:</strong> ${data.blog?.total || 0} total, ${data.blog?.published || 0} published, ${data.blog?.draft || 0} drafts<br>
            <strong>Calendar:</strong> ${data.calendar.closing_soon || 0} closing soon, ${data.calendar.expired || 0} expired
          </div>
          <div class="item-card__footer">
            <span class="source-tag">Live DB query · ${new Date(data.generated_at).toLocaleString()}</span>
            <button class="btn btn-primary" data-action="refresh-dashboard">Refresh</button>
          </div>
        </div>
        ${recentBlogHtml}
      `;
      itemsList.querySelector('[data-action="refresh-dashboard"]')?.addEventListener('click', fetchDashboard);
    } catch (err) {
      loadingEl.style.display = 'none';
      itemsList.innerHTML = `<div class="empty-state"><h3>Dashboard unavailable</h3><p>Start server with npm start</p></div>`;
    }
  }

  // ── FETCH AND RENDER LIST ──
  async function fetchItems() {
    if (currentTab === 'research-overview') {
      return fetchDashboard();
    }

    loadingEl.style.display = 'block';
    itemsList.innerHTML = '';

    const query = searchBox.value.trim();
    const region = filterRegion.value;
    const format = filterFormat.value;
    const status = filterStatus.value;

    let url;
    if (currentTab === 'roadmaps') {
      url = `${API_BASE}/intelligence/roadmaps`;
      if (query) url += `?search=${encodeURIComponent(query)}`;
    } else if (currentTab === 'reports') {
      url = `${API_BASE}/intelligence/reports`;
    } else if (currentTab === 'countries') {
      url = `${API_BASE}/intelligence/countries`;
      if (region) url += `?region=${region}`;
    } else if (currentTab === 'knowledge-graph') {
      url = `${API_BASE}/intelligence/graph`;
    } else if (currentTab === 'sources') {
      url = `${API_BASE}/ingestion/sources?limit=100`;
      if (query) url += `&search=${encodeURIComponent(query)}`;
    } else if (currentTab === 'sync-history') {
      url = `${API_BASE}/ingestion/sync-logs?limit=100`;
      if (status) url += `&status=${status}`;
    } else if (currentTab === 'discoveries') {
      url = `${API_BASE}/ingestion/discoveries?limit=100`;
    } else if (currentTab === 'blog') {
      url = `${API_BASE}/blog?limit=100`;
      if (query) url += `&search=${encodeURIComponent(query)}`;
      if (status) url += `&status=${status}`;
    } else {
      url = `${API_BASE}/${currentTab}?limit=100`;
      if (query) url += `&search=${encodeURIComponent(query)}`;
      if (region && currentTab !== 'submissions') url += `&region=${region}`;
      if (format && currentTab !== 'submissions' && currentTab !== 'institutes') url += `&format=${format}`;
      if (status) {
        url += currentTab === 'submissions' ? `&status=${status}` : `&verification_status=${status}`;
      }
    }

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('API server returned error');
      
      let data = await res.json();
      loadingEl.style.display = 'none';

      if (currentTab === 'knowledge-graph') {
        renderKnowledgeGraph(data);
        return;
      }

      const items = currentTab === 'submissions' ? data : (data.items || []);

      if (!items || items.length === 0) {
        if (currentTab === 'reports') {
          itemsList.innerHTML = `
            <div class="empty-state"><h3>No reports yet</h3>
            <p>Generate a query-based report below.</p></div>
            <div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap;">
              <button class="btn btn-primary" data-action="gen-report" data-type="new_opportunities">New Opportunities</button>
              <button class="btn btn-primary" data-action="gen-report" data-type="scholarships_added">Scholarships</button>
              <button class="btn btn-primary" data-action="gen-report" data-type="festivals_opening">Festivals Opening</button>
              <button class="btn btn-primary" data-action="gen-report" data-type="country_update">Country Update</button>
              <button class="btn btn-primary" data-action="gen-report" data-type="online_programs">Online Programs</button>
            </div>`;
          bindReportButtons();
          return;
        }
        renderEmptyState();
        return;
      }

      if (currentTab === 'reports') {
        const genBar = document.createElement('div');
        genBar.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;';
        genBar.innerHTML = `
          <button class="btn btn-primary" data-action="gen-report" data-type="new_opportunities">+ New Opportunities</button>
          <button class="btn btn-primary" data-action="gen-report" data-type="scholarships_added">+ Scholarships</button>
          <button class="btn btn-primary" data-action="gen-report" data-type="festivals_opening">+ Festivals</button>
          <button class="btn btn-primary" data-action="gen-report" data-type="country_update">+ Countries</button>
          <button class="btn btn-primary" data-action="gen-report" data-type="online_programs">+ Online</button>`;
        itemsList.appendChild(genBar);
        bindReportButtons();
      }

      items.forEach(item => {
        const card = createItemCard(item);
        itemsList.appendChild(card);
      });
    } catch (err) {
      loadingEl.style.display = 'none';
      itemsList.innerHTML = `
        <div class="empty-state" style="border-color: var(--red);">
          <h3>Failed to Connect to Database API</h3>
          <p>Please ensure the local Node server is running (<code>npm start</code>) and listening at <code>http://localhost:3000</code>.</p>
        </div>
      `;
    }
  }

  function bindReportButtons() {
    document.querySelectorAll('[data-action="gen-report"]').forEach(btn => {
      btn.onclick = async () => {
        const res = await fetch(`${API_BASE}/intelligence/reports/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ report_type: btn.dataset.type })
        });
        if (res.ok) { showToast('Report generated.'); fetchItems(); }
        else showToast('Report generation failed.');
      };
    });
  }

  function renderKnowledgeGraph(data) {
    const nodes = data.nodes || [];
    const edges = data.edges || [];
    itemsList.innerHTML = `
      <div class="item-card">
        <div class="item-card__header">
          <h3 class="item-card__title">Knowledge Graph</h3>
          <span class="status-badge verified">${edges.length} edges · ${nodes.length} nodes</span>
        </div>
        <div class="item-card__body" style="max-height:500px;overflow-y:auto;">
          ${edges.length ? edges.map(e => `
            <div class="graph-edge">
              <strong>${e.from_type}</strong> ${e.from_id.slice(0,12)}…
              <span style="color:var(--gold);">—${e.relationship_type}→</span>
              <strong>${e.to_type}</strong> ${e.to_id.slice(0,12)}…
            </div>
          `).join('') : '<p>No relationships yet. Run auto-link.</p>'}
        </div>
        <div class="item-card__footer">
          <button class="btn btn-primary" data-action="auto-link">Auto-Link Entities</button>
        </div>
      </div>`;
    itemsList.querySelector('[data-action="auto-link"]')?.addEventListener('click', async () => {
      const res = await fetch(`${API_BASE}/intelligence/relationships/auto-link`, { method: 'POST' });
      if (res.ok) { showToast('Auto-link complete.'); fetchItems(); }
    });
  }

  // ── RENDER EMPTY STATE ──
  function renderEmptyState() {
    itemsList.innerHTML = `
      <div class="empty-state">
        <h3>No records found</h3>
        <p>No matches fit the selected filters in the '${currentTab}' archive.</p>
      </div>
    `;
  }

  // ── CREATE CARD FOR RECORD ──
  function createItemCard(item) {
    const card = document.createElement('div');
    const status = item.verification_status || item.status || 'pending';
    card.className = `item-card ${status.replace('_', '-')}`;

    let headerMetaHtml = '';
    let detailsHtml = '';
    let footerHtml = '';

    if (currentTab === 'programs') {
      headerMetaHtml = `${item.institute_title || 'Unknown Institute'} • ${item.category || 'General'}`;
      detailsHtml = `
        <div class="item-card__details">
          <strong>Tuition Cost</strong>: ${item.tuition_or_cost || 'N/A'} &nbsp;·&nbsp; 
          <strong>Duration</strong>: ${item.duration || 'N/A'} &nbsp;·&nbsp;
          <strong>Format</strong>: ${item.format} &nbsp;·&nbsp;
          <strong>Deadline</strong>: ${item.deadline || 'N/A'}
        </div>
        ${item.eligibility ? `<p style="font-size:12px;margin-bottom:8px;"><b>Assam Ground Reality:</b> ${item.eligibility}</p>` : ''}
      `;
    } else if (currentTab === 'opportunities') {
      headerMetaHtml = `${item.org || 'Unknown Org'} • ${item.type || 'grant'}`;
      detailsHtml = `
        <div class="item-card__details">
          <strong>Funding / Amount</strong>: ${item.amount || 'N/A'} &nbsp;·&nbsp; 
          <strong>Format</strong>: ${item.format} &nbsp;·&nbsp;
          <strong>Deadline</strong>: ${item.deadline || 'N/A'}
        </div>
      `;
    } else if (currentTab === 'events') {
      headerMetaHtml = `${item.type || 'lab'} • ${item.subcategory || 'labs'}`;
      detailsHtml = `
        <div class="item-card__details">
          <strong>Schedule/When</strong>: ${item.deadline || 'Annual'} &nbsp;·&nbsp;
          <strong>Attendance</strong>: ${item.format}
        </div>
      `;
    } else if (currentTab === 'submissions') {
      headerMetaHtml = `Submitted by: ${item.submitter_name || 'Anonymous'} (${item.submitter_email || 'No email'})`;
      detailsHtml = `
        <div class="item-card__details" style="font-family: var(--f-mono); font-size: 11px; max-height: 200px; overflow-y: auto;">
          <strong>TYPE:</strong> ${item.data_type.toUpperCase()}<br>
          ${JSON.stringify(item.payload, null, 2).replace(/\n/g, '<br>').replace(/\s/g, '&nbsp;')}
        </div>
        ${item.notes ? `<p style="font-size:12px;"><b>Submitter Notes:</b> ${item.notes}</p>` : ''}
      `;
    } else if (currentTab === 'institutes') {
      headerMetaHtml = `${item.city || ''}, ${item.country || ''} • ${item.region}`;
      detailsHtml = `
        <div class="item-card__details">
          <strong>Website</strong>: <a href="${item.website_url}" target="_blank">${item.website_url || 'N/A'}</a>
        </div>
      `;
    } else if (currentTab === 'sources') {
      headerMetaHtml = `${item.country || 'Global'} • ${item.category || 'general'} • ${item.parser_type || 'generic'} parser`;
      detailsHtml = `
        <div class="item-card__details">
          <strong>URL</strong>: <a href="${item.url}" target="_blank">${item.url || 'N/A'}</a> &nbsp;·&nbsp;
          <strong>Crawl</strong>: ${item.crawl_frequency || 'weekly'} &nbsp;·&nbsp;
          <strong>Entity</strong>: ${item.entity_type || 'opportunity'} &nbsp;·&nbsp;
          <strong>Last Run</strong>: ${item.last_run_at ? new Date(item.last_run_at).toLocaleString() : 'Never'}
        </div>
        <span class="trust-badge">Trust: ${item.trust_level ?? 50}</span>
        <span class="status-badge ${item.active_status ? 'verified' : 'rejected'}" style="margin-left:8px;">${item.active_status ? 'active' : 'inactive'}</span>
      `;
    } else if (currentTab === 'sync-history') {
      headerMetaHtml = `${item.source_name || 'Unknown Source'} • ${item.parser_type || 'generic'}`;
      detailsHtml = `
        <div class="item-card__details">
          <strong>Found</strong>: ${item.records_found} &nbsp;·&nbsp;
          <strong>Inserted</strong>: ${item.records_inserted} &nbsp;·&nbsp;
          <strong>Updated</strong>: ${item.records_updated} &nbsp;·&nbsp;
          <strong>Rejected</strong>: ${item.records_rejected} &nbsp;·&nbsp;
          <strong>Errors</strong>: ${item.error_count}
          <br><strong>Duration</strong>: ${item.duration_ms}ms &nbsp;·&nbsp;
          <strong>Started</strong>: ${new Date(item.started_at).toLocaleString()}
          ${item.error_message ? `<br><strong>Error</strong>: ${item.error_message}` : ''}
        </div>
      `;
    } else if (currentTab === 'discoveries') {
      headerMetaHtml = `${item.entity_type || 'record'} • Source: ${item.source_name || 'Ingestion'} • Trust: ${item.trust_level ?? '?'}`;
      detailsHtml = `
        <div class="item-card__details">
          <strong>Country</strong>: ${item.country || 'N/A'} &nbsp;·&nbsp;
          <strong>Region</strong>: ${item.region || 'N/A'} &nbsp;·&nbsp;
          <strong>Publication</strong>: ${item.publication_status || 'draft'}
        </div>
      `;
    } else if (currentTab === 'roadmaps') {
      headerMetaHtml = `${item.target_audience || 'General'} • ${item.step_count || 0} steps`;
      detailsHtml = `<div class="item-card__details"><strong>Slug</strong>: ${item.slug} &nbsp;·&nbsp; <strong>Status</strong>: ${item.publication_status}</div>`;
    } else if (currentTab === 'reports') {
      headerMetaHtml = `${item.report_type} • Generated ${new Date(item.generated_at).toLocaleDateString()}`;
      detailsHtml = `<div class="item-card__details"><strong>Status</strong>: ${item.publication_status} &nbsp;·&nbsp; ${item.summary || ''}</div>`;
    } else if (currentTab === 'countries') {
      headerMetaHtml = `${item.region} • ${item.publication_status}`;
      detailsHtml = `<div class="item-card__details">${item.summary?.slice(0, 200) || ''}…</div>`;
    } else if (currentTab === 'blog') {
      headerMetaHtml = `By ${item.author || 'Admin'} &nbsp;·&nbsp; ${item.reading_time || 1} min read &nbsp;·&nbsp; ${item.featured ? '🌟 Featured' : 'Standard'}`;
      detailsHtml = `
        <div class="item-card__details">
          <strong>Slug</strong>: ${item.slug}<br>
          <strong>Cover Image</strong>: ${item.cover_image ? `<a href="${item.cover_image}" target="_blank">${item.cover_image.slice(0, 50)}…</a>` : 'None'}<br>
          <strong>Published Date</strong>: ${item.published_at ? new Date(item.published_at).toLocaleString() : 'Not Published'}
        </div>
      `;
    }

    // Source display
    const sourceHtml = item.website_url ? 
      `<a href="${item.website_url}" target="_blank" class="source-tag">Website Link ↗</a>` : 
      `<span class="source-tag">Manual Source</span>`;

    // Moderation controls
    let moderationControls = '';
    if (currentTab === 'sources') {
      moderationControls = `
        <button class="btn btn-primary" data-action="sync-source" data-id="${item.id}">Run Sync</button>
        <button class="btn" data-action="toggle-source" data-id="${item.id}">${item.active_status ? 'Deactivate' : 'Activate'}</button>
      `;
    } else if (currentTab === 'sync-history') {
      moderationControls = `<span class="status-badge ${item.status}">${item.status}</span>`;
    } else if (currentTab === 'discoveries') {
      const modType = item.entity_type === 'opportunity' ? 'opportunity' : item.entity_type;
      moderationControls = `
        <button class="btn btn-success" data-action="approve-discovery" data-id="${item.id}" data-type="${modType}">Verify</button>
        <button class="btn btn-primary" data-action="moderate-discovery" data-id="${item.id}" data-type="${modType}">Review</button>
        <button class="btn" data-action="reject-discovery" data-id="${item.id}" data-type="${modType}" style="color:var(--red);">Reject</button>
      `;
    } else if (currentTab === 'roadmaps') {
      moderationControls = `<button class="btn" data-action="view-roadmap" data-id="${item.id}">View Steps</button>`;
    } else if (currentTab === 'reports') {
      moderationControls = `
        <button class="btn btn-success" data-action="publish-report" data-id="${item.id}">Publish</button>
        <button class="btn" data-action="view-report" data-id="${item.id}">View</button>
      `;
    } else if (currentTab === 'countries') {
      moderationControls = `<button class="btn" data-action="view-country" data-id="${item.id}">View Profile</button>`;
    } else if (currentTab === 'submissions') {
      if (item.status === 'pending') {
        moderationControls = `
          <button class="btn btn-success" data-action="approve-sub" data-id="${item.id}">Approve</button>
          <button class="btn" data-action="reject-sub" data-id="${item.id}" style="color:var(--red);border-color:var(--red);">Reject</button>
        `;
      }
    } else if (currentTab === 'blog') {
      const publishBtn = item.status !== 'published' ? 
        `<button class="btn btn-success" data-action="publish-blog" data-id="${item.id}">Publish</button>` : '';
      const archiveBtn = item.status !== 'archived' ? 
        `<button class="btn" data-action="archive-blog" data-id="${item.id}">Archive</button>` : '';
      moderationControls = `
        ${publishBtn}
        ${archiveBtn}
        <button class="btn" data-action="edit" data-id="${item.id}">Edit</button>
        <button class="btn" data-action="delete" data-id="${item.id}" style="color:var(--red);border-color:transparent;padding:6px;">Delete</button>
      `;
    } else {
      moderationControls = `
        <button class="btn" data-action="edit" data-id="${item.id}">Edit</button>
        <button class="btn btn-primary" data-action="moderate" data-id="${item.id}">Moderate</button>
        <button class="btn" data-action="delete" data-id="${item.id}" style="color:var(--red);border-color:transparent;padding:6px;">Delete</button>
      `;
    }

    const cardTitle = currentTab === 'sync-history'
      ? `Sync: ${item.source_name || item.source_id}`
      : (currentTab === 'sources' ? item.name : (item.title || item.name));

    card.innerHTML = `
      <div class="item-card__header">
        <h3 class="item-card__title">${cardTitle}</h3>
        <span class="status-badge ${status}">${status}</span>
      </div>
      <div class="item-card__meta">${headerMetaHtml}</div>
      <div class="item-card__body">
        ${item.summary || item.body || ''}
      </div>
      ${detailsHtml}
      <div class="item-card__footer">
        ${sourceHtml}
        <div class="moderation-panel">
          ${moderationControls}
        </div>
      </div>
    `;

    // Event listeners
    card.querySelectorAll('button[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = btn.dataset.action;
        const id = btn.dataset.id;
        handleCardAction(action, id, item);
      });
    });

    return card;
  }

  // ── CARD BUTTON EVENT HANDLERS ──
  async function handleCardAction(action, id, item) {
    if (action === 'publish-blog') {
      try {
        const res = await fetch(`${API_BASE}/blog/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'published' })
        });
        if (res.ok) {
          showToast('Blog article published.');
          fetchItems();
        } else {
          showToast('Failed to publish article.');
        }
      } catch (err) {
        showToast('Failed to publish.');
      }
      return;
    } else if (action === 'archive-blog') {
      try {
        const res = await fetch(`${API_BASE}/blog/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'archived' })
        });
        if (res.ok) {
          showToast('Blog article archived.');
          fetchItems();
        } else {
          showToast('Failed to archive article.');
        }
      } catch (err) {
        showToast('Failed to archive.');
      }
      return;
    }

    if (action === 'view-roadmap') {
      const res = await fetch(`${API_BASE}/intelligence/roadmaps/${id}`);
      const rm = await res.json();
      const steps = (rm.steps || []).map(s => `${s.step_order}. ${s.title} — ${s.summary}`).join('\n');
      alert(`Roadmap: ${rm.title}\n\nSteps:\n${steps}`);
    } else if (action === 'publish-report') {
      const res = await fetch(`${API_BASE}/intelligence/reports/${id}/publish`, { method: 'POST' });
      if (res.ok) { showToast('Report published.'); fetchItems(); }
    } else if (action === 'view-report') {
      const res = await fetch(`${API_BASE}/intelligence/reports/${id}`);
      const rpt = await res.json();
      const sections = (rpt.sections || []).map(s => `## ${s.heading}\n${s.content}`).join('\n\n');
      alert(`${rpt.title}\n\n${sections}`);
    } else if (action === 'view-country') {
      const res = await fetch(`${API_BASE}/intelligence/countries/${id}`);
      const c = await res.json();
      alert(`${c.name}\n\n${c.summary}\n\nCost bands: ${(c.cost_profiles||[]).length}\nVisa notes: ${(c.visa_notes||[]).length}\nScholarships: ${(c.scholarship_notes||[]).length}`);
    } else if (action === 'sync-source') {
      try {
        const res = await fetch(`${API_BASE}/ingestion/sync/${id}`, { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          showToast(`Sync complete: ${data.log.records_inserted} inserted, ${data.log.records_updated} updated.`);
          fetchItems();
        } else {
          showToast('Sync failed.');
        }
      } catch (err) {
        showToast('Sync request failed.');
      }
    } else if (action === 'toggle-source') {
      try {
        const res = await fetch(`${API_BASE}/ingestion/sources/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ active_status: !item.active_status })
        });
        if (res.ok) {
          showToast(item.active_status ? 'Source deactivated.' : 'Source activated.');
          fetchItems();
        }
      } catch (err) {
        showToast('Failed to update source.');
      }
    } else if (action === 'approve-discovery' || action === 'reject-discovery' || action === 'moderate-discovery') {
      const status = action === 'approve-discovery' ? 'verified'
        : action === 'reject-discovery' ? 'rejected' : 'needs_review';
      const targetType = item.entity_type || item.dataset?.type;
      try {
        const res = await fetch(`${API_BASE}/moderation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            target_type: targetType,
            target_id: id,
            status,
            notes: `Moderated from Pending Discoveries tab.`,
            reviewer_name: modReviewerName.value || 'Console Admin'
          })
        });
        if (res.ok) {
          showToast(`Discovery marked as ${status}.`);
          fetchItems();
        }
      } catch (err) {
        showToast('Failed to moderate discovery.');
      }
    } else if (action === 'delete') {
      if (confirm(`Are you sure you want to delete this ${currentTab.slice(0, -1)}?`)) {
        try {
          const res = await fetch(`${API_BASE}/${currentTab}/${id}`, { method: 'DELETE' });
          if (res.ok) {
            showToast('Deleted successfully.');
            fetchItems();
          }
        } catch (err) {
          showToast('Failed to delete.');
        }
      }
    } else if (action === 'moderate') {
      activeModItem = { type: currentTab.slice(0, -1), item };
      modTargetInfo.innerHTML = `
        <strong>Title:</strong> ${item.title}<br>
        <strong>Category:</strong> ${currentTab.toUpperCase()} &nbsp;·&nbsp; <strong>ID:</strong> ${item.id}
      `;
      modStatusSelect.value = item.verification_status || 'pending';
      modNotes.value = '';
      modModal.classList.add('open');
    } else if (action === 'edit') {
      activeEditItem = item;
      openEditModal(item);
    } else if (action === 'approve-sub') {
      if (confirm('Approve this submission? This will automatically create the record.')) {
        try {
          const res = await fetch(`${API_BASE}/moderation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              target_type: 'submission',
              target_id: id,
              status: 'verified',
              notes: 'Approved from user submissions queue.',
              reviewer_name: 'Console Admin'
            })
          });
          if (res.ok) {
            showToast('Submission approved & record created.');
            fetchItems();
          }
        } catch (err) {
          showToast('Failed to approve submission.');
        }
      }
    } else if (action === 'reject-sub') {
      if (confirm('Reject this submission?')) {
        try {
          const res = await fetch(`${API_BASE}/moderation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              target_type: 'submission',
              target_id: id,
              status: 'rejected',
              notes: 'Rejected from user submissions queue.',
              reviewer_name: 'Console Admin'
            })
          });
          if (res.ok) {
            showToast('Submission rejected.');
            fetchItems();
          }
        } catch (err) {
          showToast('Failed to reject submission.');
        }
      }
    }
  }

  // ── MODERATION MODAL ACTION ──
  document.getElementById('btn-mod-cancel').onclick = () => {
    modModal.classList.remove('open');
    activeModItem = null;
  };

  document.getElementById('btn-mod-save').onclick = async () => {
    if (!activeModItem) return;
    const status = modStatusSelect.value;
    const notes = modNotes.value;
    const reviewer = modReviewerName.value;

    try {
      const res = await fetch(`${API_BASE}/moderation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_type: activeModItem.type,
          target_id: activeModItem.item.id,
          status,
          notes,
          reviewer_name: reviewer
        })
      });
      
      if (res.ok) {
        showToast('Moderation status logged successfully.');
        modModal.classList.remove('open');
        fetchItems();
      } else {
        showToast('Failed to moderate record.');
      }
    } catch (err) {
      showToast('Error sending moderation data.');
    }
  };

  // ── RUN INGESTION SYNC ──
  btnRunSync.onclick = async () => {
    btnRunSync.disabled = true;
    btnRunSync.innerHTML = '🔄 Syncing...';
    try {
      const res = await fetch(`${API_BASE}/ingestion/sync`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const data = await res.json();
      if (data.success) {
        const summary = data.mode === 'all'
          ? `${data.results.length} sources processed`
          : 'Single source synced';
        showToast(`Ingestion sync complete: ${summary}`);
        if (currentTab === 'sync-history' || currentTab === 'discoveries') fetchItems();
      } else {
        showToast('Ingestion sync failed.');
      }
    } catch (err) {
      showToast('Ingestion sync request failed.');
    } finally {
      btnRunSync.disabled = false;
      btnRunSync.innerHTML = '🔄 Run Ingestion Sync';
    }
  };

  // ── SYNDICATE SYNC ──
  btnSyncStatic.onclick = async () => {
    btnSyncStatic.disabled = true;
    btnSyncStatic.innerHTML = '⚙️ Syndicating...';
    try {
      const res = await fetch(`${API_BASE}/sync`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(`Syndication Successful!\nSynced: ${data.stats.programs} programs, ${data.stats.grants} grants, ${data.stats.events} events.`);
      } else {
        showToast('Syndication failed: ' + data.error);
      }
    } catch (err) {
      showToast('API Connection failed. Cannot sync.');
    } finally {
      btnSyncStatic.disabled = false;
      btnSyncStatic.innerHTML = '⚡ Syndicate Static DB';
    }
  };

  // ── AUTOSAVE HELPERS ──
  function startAutosaveTimer() {
    stopAutosaveTimer();
    autosaveTimer = setInterval(() => {
      if (!editModal.classList.contains('open') || currentTab !== 'blog') {
        stopAutosaveTimer();
        return;
      }

      const title = document.getElementById('form-title').value;
      const author = document.getElementById('form-author').value;
      const featured = document.getElementById('form-featured').checked ? 1 : 0;
      const coverImage = document.getElementById('form-cover-image').value;
      const excerpt = document.getElementById('form-summary').value;
      const content = editorInstance ? editorInstance.getData() : document.getElementById('form-blog-content').value;

      if (title || excerpt || content) {
        const draft = { title, author, featured, coverImage, excerpt, content, timestamp: new Date().toISOString() };
        localStorage.setItem('nefi_blog_draft', JSON.stringify(draft));
        
        const titleEl = document.getElementById('edit-modal-title');
        const originalText = activeEditItem ? 'Edit Entry' : 'Add New Entry';
        titleEl.innerHTML = `${originalText} <span style="font-size: 10px; color: var(--text-muted); font-family: var(--f-mono); margin-left: 8px;">(Autosaved ${new Date().toLocaleTimeString()})</span>`;
      }
    }, 30000);
  }

  function stopAutosaveTimer() {
    if (autosaveTimer) {
      clearInterval(autosaveTimer);
      autosaveTimer = null;
    }
  }

  // ── EDIT/CREATE FORM MODAL ──
  function openEditModal(item = null) {
    entryForm.reset();
    document.getElementById('entry-id').value = item ? item.id : '';
    document.getElementById('edit-modal-title').textContent = item ? 'Edit Entry' : 'Add New Entry';

    const instContainer = document.getElementById('form-institute-container');
    const orgContainer = document.getElementById('form-org-container');
    const typeContainer = document.getElementById('form-type-container');
    const costContainer = document.getElementById('form-cost-container');
    const locationContainer = document.getElementById('form-location-container');
    const formatCostContainer = document.getElementById('form-format-cost-container');
    const durationDeadlineContainer = document.getElementById('form-duration-deadline-container');
    const eligibilityContainer = document.getElementById('form-eligibility-container');
    const urlTagsContainer = document.getElementById('form-url-tags-container');
    const descriptionContainer = document.getElementById('form-description-container');

    const blogMetaContainer = document.getElementById('form-blog-meta-container');
    const coverImageContainer = document.getElementById('form-cover-image-container');
    const blogContentContainer = document.getElementById('form-blog-content-container');

    const titleLabel = document.getElementById('form-title-label');
    const titleInput = document.getElementById('form-title');
    const summaryLabel = document.getElementById('form-summary-label');
    const summaryInput = document.getElementById('form-summary');

    const typeSelect = document.getElementById('form-type');

    // Default Labels
    titleLabel.textContent = 'Opportunity Title *';
    titleInput.placeholder = 'e.g. Diploma in Editing';
    summaryLabel.textContent = 'Brief Summary (UI Card Body) *';
    summaryInput.placeholder = '1-2 sentences on what this is...';

    // Hide autosave recovery by default
    document.getElementById('autosave-recovery-banner').style.display = 'none';

    if (currentTab === 'blog') {
      instContainer.style.display = 'none';
      orgContainer.style.display = 'none';
      typeContainer.style.display = 'none';
      costContainer.style.display = 'none';
      locationContainer.style.display = 'none';
      formatCostContainer.style.display = 'none';
      durationDeadlineContainer.style.display = 'none';
      eligibilityContainer.style.display = 'none';
      urlTagsContainer.style.display = 'none';
      descriptionContainer.style.display = 'none';

      blogMetaContainer.style.display = 'grid';
      coverImageContainer.style.display = 'block';
      blogContentContainer.style.display = 'block';

      titleLabel.textContent = 'Article Title *';
      titleInput.placeholder = 'e.g. How Film Students From Assam Can Study Abroad';
      summaryLabel.textContent = 'Excerpt / Brief Summary *';
      summaryInput.placeholder = 'A short 1-2 sentence description of the article...';

      if (item) {
        titleInput.value = item.title;
        document.getElementById('form-author').value = item.author || 'Admin';
        document.getElementById('form-featured').checked = item.featured === 1;
        document.getElementById('form-cover-image').value = item.cover_image || '';
        summaryInput.value = item.excerpt || '';
        document.getElementById('form-blog-content').value = item.content || '';
      } else {
        document.getElementById('form-author').value = 'Admin';
        const draft = localStorage.getItem('nefi_blog_draft');
        if (draft) {
          document.getElementById('autosave-recovery-banner').style.display = 'flex';
        }
      }

      // Initialize CKEditor
      if (window.ClassicEditor) {
        if (!editorInstance) {
          window.ClassicEditor.create(document.querySelector('#form-blog-content'), {
            toolbar: ['heading', '|', 'bold', 'italic', 'link', 'bulletedList', 'numberedList', 'blockQuote', 'insertTable', 'undo', 'redo']
          })
            .then(editor => {
              editorInstance = editor;
              editorInstance.setData(item ? item.content || '' : '');
            })
            .catch(err => console.error('CKEditor Init Error:', err));
        } else {
          editorInstance.setData(item ? item.content || '' : '');
        }
      }

      startAutosaveTimer();

    } else {
      blogMetaContainer.style.display = 'none';
      coverImageContainer.style.display = 'none';
      blogContentContainer.style.display = 'none';

      instContainer.style.display = currentTab === 'programs' ? 'block' : 'none';
      orgContainer.style.display = currentTab === 'opportunities' ? 'block' : 'none';
      typeContainer.style.display = ['programs', 'opportunities', 'events'].includes(currentTab) ? 'block' : 'none';
      costContainer.style.display = currentTab === 'programs' ? 'block' : 'none';

      locationContainer.style.display = 'grid';
      formatCostContainer.style.display = 'grid';
      durationDeadlineContainer.style.display = 'grid';
      eligibilityContainer.style.display = 'block';
      urlTagsContainer.style.display = 'grid';
      descriptionContainer.style.display = 'block';

      if (currentTab === 'programs') {
        typeContainer.querySelector('label').textContent = 'Program Focus Category *';
        typeSelect.innerHTML = `
          <option value="General">General / All-round</option>
          <option value="Direction">Directing</option>
          <option value="Cinematography">Cinematography</option>
          <option value="Editing">Editing</option>
          <option value="Audiography">Sound/Audiography</option>
          <option value="Production">Production & Business</option>
        `;

        if (item) {
          titleInput.value = item.title;
          document.getElementById('form-institute-id').value = item.institute_id;
          typeSelect.value = item.category;
          document.getElementById('form-country').value = item.country;
          document.getElementById('form-region').value = item.region;
          document.getElementById('form-format').value = item.format;
          document.getElementById('form-cost').value = item.tuition_or_cost;
          document.getElementById('form-duration').value = item.duration;
          document.getElementById('form-deadline').value = item.deadline;
          summaryInput.value = item.summary;
          document.getElementById('form-description').value = item.description || '';
          document.getElementById('form-eligibility').value = item.eligibility || '';
          document.getElementById('form-url').value = item.website_url || '';
          document.getElementById('form-tags').value = item.tags ? item.tags.join(', ') : '';
        }
      } else if (currentTab === 'opportunities') {
        typeContainer.querySelector('label').textContent = 'Opportunity Type *';
        typeSelect.innerHTML = `
          <option value="grant">Grant</option>
          <option value="scholarship">Scholarship</option>
          <option value="fellowship">Fellowship</option>
          <option value="lab">Development Lab</option>
          <option value="residency">Artist Residency</option>
        `;

        if (item) {
          titleInput.value = item.title;
          document.getElementById('form-org').value = item.org;
          typeSelect.value = item.type;
          document.getElementById('form-country').value = item.country;
          document.getElementById('form-region').value = item.region;
          document.getElementById('form-format').value = item.format;
          document.getElementById('form-duration').value = item.duration;
          document.getElementById('form-deadline').value = item.deadline;
          summaryInput.value = item.summary;
          document.getElementById('form-description').value = item.description || '';
          document.getElementById('form-eligibility').value = item.eligibility || '';
          document.getElementById('form-url').value = item.website_url || '';
          document.getElementById('form-tags').value = item.tags ? item.tags.join(', ') : '';
        }
      } else if (currentTab === 'events') {
        typeContainer.querySelector('label').textContent = 'Event Type *';
        typeSelect.innerHTML = `
          <option value="festival">Film Festival</option>
          <option value="co-production market">Co-Production Market</option>
          <option value="pitch forum">Pitch Forum</option>
          <option value="other">Other Event</option>
        `;

        if (item) {
          titleInput.value = item.title;
          typeSelect.value = item.type;
          document.getElementById('form-country').value = item.country;
          document.getElementById('form-region').value = item.region;
          document.getElementById('form-format').value = item.format;
          document.getElementById('form-duration').value = item.duration;
          document.getElementById('form-deadline').value = item.deadline;
          summaryInput.value = item.summary;
          document.getElementById('form-description').value = item.description || '';
          document.getElementById('form-eligibility').value = item.eligibility || '';
          document.getElementById('form-url').value = item.website_url || '';
          document.getElementById('form-tags').value = item.tags ? item.tags.join(', ') : '';
        }
      } else if (currentTab === 'institutes') {
        if (item) {
          titleInput.value = item.title;
          document.getElementById('form-country').value = item.country;
          document.getElementById('form-region').value = item.region;
          summaryInput.value = item.summary;
          document.getElementById('form-description').value = item.description || '';
          document.getElementById('form-url').value = item.website_url || '';
        }
      }
    }

    editModal.classList.add('open');
  }

  btnAddItem.onclick = () => {
    activeEditItem = null;
    openEditModal();
  };

  document.getElementById('btn-edit-cancel').onclick = () => {
    editModal.classList.remove('open');
    activeEditItem = null;
    stopAutosaveTimer();
  };

  document.getElementById('btn-restore-draft').onclick = () => {
    const draftStr = localStorage.getItem('nefi_blog_draft');
    if (draftStr) {
      const draft = JSON.parse(draftStr);
      document.getElementById('form-title').value = draft.title || '';
      document.getElementById('form-author').value = draft.author || 'Admin';
      document.getElementById('form-featured').checked = draft.featured === 1;
      document.getElementById('form-cover-image').value = draft.coverImage || '';
      document.getElementById('form-summary').value = draft.excerpt || '';
      document.getElementById('form-blog-content').value = draft.content || '';
      if (editorInstance && draft.content) {
        editorInstance.setData(draft.content);
      }
      showToast('Draft restored.');
    }
    document.getElementById('autosave-recovery-banner').style.display = 'none';
  };

  document.getElementById('btn-discard-draft').onclick = () => {
    localStorage.removeItem('nefi_blog_draft');
    document.getElementById('autosave-recovery-banner').style.display = 'none';
    showToast('Draft discarded.');
  };

  document.getElementById('btn-edit-save').onclick = async () => {
    const id = document.getElementById('entry-id').value;
    const title = document.getElementById('form-title').value;
    const country = document.getElementById('form-country').value;
    const region = document.getElementById('form-region').value;
    const format = document.getElementById('form-format').value;
    const summary = document.getElementById('form-summary').value;
    const description = document.getElementById('form-description').value;
    const eligibility = document.getElementById('form-eligibility').value;
    const url = document.getElementById('form-url').value;
    
    // Parse tags
    const tagsStr = document.getElementById('form-tags').value;
    const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [];

    const isEdit = !!id;
    let endpoint = `${API_BASE}/${currentTab}`;
    if (isEdit) endpoint += `/${id}`;

    const method = isEdit ? 'PUT' : 'POST';

    // Compile payload depending on active tab
    let payload = {};
    if (currentTab === 'programs') {
      payload = {
        title,
        institute_id: document.getElementById('form-institute-id').value,
        category: document.getElementById('form-type').value,
        country,
        region,
        format,
        tuition_or_cost: document.getElementById('form-cost').value,
        duration: document.getElementById('form-duration').value,
        deadline: document.getElementById('form-deadline').value,
        summary,
        description,
        eligibility,
        website_url: url,
        application_url: url,
        tags
      };
    } else if (currentTab === 'opportunities') {
      payload = {
        title,
        org: document.getElementById('form-org').value,
        type: document.getElementById('form-type').value,
        country,
        region,
        format,
        amount: document.getElementById('form-duration').value, // mapping simple
        deadline: document.getElementById('form-deadline').value,
        summary,
        description,
        eligibility,
        website_url: url,
        application_url: url,
        tags
      };
    } else if (currentTab === 'events') {
      payload = {
        title,
        type: document.getElementById('form-type').value,
        country,
        region,
        format,
        deadline: document.getElementById('form-deadline').value,
        summary,
        description,
        eligibility,
        website_url: url,
        application_url: url,
        tags
      };
    } else if (currentTab === 'institutes') {
      payload = {
        title,
        country,
        region,
        summary,
        description,
        website_url: url
      };
    } else if (currentTab === 'blog') {
      payload = {
        title,
        author: document.getElementById('form-author').value,
        featured: document.getElementById('form-featured').checked ? 1 : 0,
        cover_image: document.getElementById('form-cover-image').value || null,
        excerpt: summary,
        content: editorInstance ? editorInstance.getData() : document.getElementById('form-blog-content').value
      };
    }

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast(isEdit ? 'Updated successfully.' : 'Created successfully.');
        editModal.classList.remove('open');
        localStorage.removeItem('nefi_blog_draft');
        stopAutosaveTimer();
        fetchItems();
      } else {
        const errorData = await res.json();
        showToast('Validation failed: ' + JSON.stringify(errorData.errors || errorData.error));
      }
    } catch (err) {
      showToast('Error saving record.');
    }
  };

  // ── TAB TRIGGERS ──
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      currentTab = btn.dataset.tab;

      // Adapt filter dropdown group visibility
      if (INTELLIGENCE_TABS.includes(currentTab)) {
        filterRegionGroup.style.display = currentTab === 'countries' ? 'flex' : 'none';
        filterFormatGroup.style.display = 'none';
        btnAddItem.style.display = 'none';
        filterStatus.parentElement.parentElement.style.display = 'none';
      } else if (INGESTION_TABS.includes(currentTab)) {
        filterRegionGroup.style.display = 'none';
        filterFormatGroup.style.display = 'none';
        btnAddItem.style.display = 'none';
        filterStatus.parentElement.parentElement.style.display = currentTab === 'sync-history' ? 'flex' : (currentTab === 'discoveries' ? 'none' : 'flex');
      } else if (currentTab === 'submissions') {
        filterRegionGroup.style.display = 'none';
        filterFormatGroup.style.display = 'none';
        btnAddItem.style.display = 'none';
        filterStatus.parentElement.parentElement.style.display = 'flex';
      } else if (currentTab === 'blog') {
        filterRegionGroup.style.display = 'none';
        filterFormatGroup.style.display = 'none';
        btnAddItem.style.display = 'inline-flex';
        filterStatus.parentElement.parentElement.style.display = 'flex';
      } else {
        filterRegionGroup.style.display = 'flex';
        filterFormatGroup.style.display = currentTab === 'institutes' ? 'none' : 'flex';
        btnAddItem.style.display = 'inline-flex';
        filterStatus.parentElement.parentElement.style.display = 'flex';
      }

      fetchItems();
    });
  });

  // ── DEBOUNCE FILTERS ──
  function debounce(fn, ms) {
    let timer;
    return function(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  // Register filter event listeners
  searchBox.addEventListener('input', debounce(fetchItems, 300));
  filterRegion.addEventListener('change', fetchItems);
  filterFormat.addEventListener('change', fetchItems);
  filterStatus.addEventListener('change', fetchItems);

  // ── INIT ──
  document.addEventListener('DOMContentLoaded', async () => {
    loadInstitutesList();
    try {
      await fetch(`${API_BASE}/ingestion/sources/seed`, { method: 'POST' });
      await fetch(`${API_BASE}/intelligence/seed`, { method: 'POST' });
    } catch (e) {
      // Server may not be running yet
    }
    currentTab = 'research-overview';
    fetchItems();
  });

})();
