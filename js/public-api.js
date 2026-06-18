const PublicAPI = {
  base: '/api/public',

  async get(path) {
    const res = await fetch(`${this.base}${path}`);
    if (!res.ok) throw new Error(`API ${res.status}`);
    return res.json();
  },

  home() { return this.get('/home'); },
  roadmaps(q = '') { return this.get(`/roadmaps${q}`); },
  roadmap(slug) { return this.get(`/roadmaps/${slug}`); },
  calendar(params) {
    const q = new URLSearchParams(params).toString();
    return this.get(`/calendar?${q}`);
  },
  countries(params = {}) {
    const q = new URLSearchParams(params).toString();
    return this.get(`/countries?${q}`);
  },
  country(slug) { return this.get(`/countries/${slug}`); },
  institute(slug) { return this.get(`/institutes/${slug}`); },
  explore(params = {}) {
    const q = new URLSearchParams(params).toString();
    return this.get(`/explore?${q}`);
  },
  reports(params = {}) {
    const q = new URLSearchParams(params).toString();
    return this.get(`/reports?${q}`);
  },
  report(slug) { return this.get(`/reports/${slug}`); },
  relationships(params = {}) {
    const q = new URLSearchParams(params).toString();
    return this.get(`/relationships?${q}`);
  },
  entity(type, id) { return this.get(`/relationships/${type}/${id}`); },
  search(q, limit = 8) { return this.get(`/search?q=${encodeURIComponent(q)}&limit=${limit}`); },
  blog(q = '') { return this.get(`/blog${q}`); },
  blogPost(slug) { return this.get(`/blog/${slug}`); },
  subscribeNewsletter(email) {
    return fetch('/api/newsletter/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    }).then(res => {
      if (!res.ok) throw new Error('Subscription failed');
      return res.json();
    });
  },
};