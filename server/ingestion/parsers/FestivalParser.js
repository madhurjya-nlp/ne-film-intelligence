const BaseParser = require('./BaseParser');

class FestivalParser extends BaseParser {
  get parserType() {
    return 'festival';
  }

  async parse() {
    const html = await this.fetchHtml(this.source.url);
    const rawItems = this.extractListItems(html, this.source.url);

    return rawItems.map((item) => ({
      ...item,
      type: this.config.eventType || 'festival',
      country: this.source.country || 'Global',
      region: this.config.region || 'online',
      format: 'offline',
      tags: ['festival', 'labs', 'networking'],
      eligibility: 'Open to filmmakers; verify NE India travel/logistics before applying.',
      description: `${item.summary}\n\nDiscovered from ${this.source.name}.`,
    }));
  }
}

module.exports = FestivalParser;