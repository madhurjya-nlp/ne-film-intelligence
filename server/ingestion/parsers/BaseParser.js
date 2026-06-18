const cheerio = require('cheerio');
const { normalizeUrl } = require('../normalizer');

class BaseParser {
  constructor(source) {
    this.source = source;
    this.config = source.parser_config || {};
  }

  get parserType() {
    return 'base';
  }

  async fetchHtml(url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'CineEduAssan-Ingestion/2.3 (+https://effortless-speculoos-0dde1a.netlify.app)',
          Accept: 'text/html,application/xhtml+xml',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${url}`);
      }

      return await response.text();
    } finally {
      clearTimeout(timeout);
    }
  }

  extractListItems(html, baseUrl) {
    const $ = cheerio.load(html);
    const listSelector = this.config.listSelector || 'article, li, .card, .item';
    const titleSelector = this.config.titleSelector || 'h2, h3, a';
    const linkSelector = this.config.linkSelector || 'a[href]';
    const summarySelector = this.config.summarySelector || 'p';

    const items = [];
    const seen = new Set();

    $(listSelector).each((_, el) => {
      const block = $(el);
      const titleEl = block.find(titleSelector).first();
      const linkEl = block.find(linkSelector).first();
      const title = titleEl.text().trim() || linkEl.text().trim();
      const href = linkEl.attr('href');
      const summary = block.find(summarySelector).first().text().trim();

      if (!title || title.length < 4) return;
      const url = normalizeUrl(baseUrl, href);
      const dedupeKey = `${title}|${url || ''}`;
      if (seen.has(dedupeKey)) return;
      seen.add(dedupeKey);

      items.push({
        title,
        summary: summary || title,
        website_url: url,
        application_url: url,
      });
    });

    return items.slice(0, 50);
  }

  async parse() {
    const html = await this.fetchHtml(this.source.url);
    return this.extractListItems(html, this.source.url);
  }
}

module.exports = BaseParser;