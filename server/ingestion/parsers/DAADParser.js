const BaseParser = require('./BaseParser');

class DAADParser extends BaseParser {
  get parserType() {
    return 'daad';
  }

  async parse() {
    const html = await this.fetchHtml(this.source.url);
    const rawItems = this.extractListItems(html, this.source.url);

    return rawItems.map((item) => ({
      ...item,
      country: 'Germany',
      region: this.config.region || 'europe',
      category: this.config.category || 'General',
      institute_name: 'DAAD Partner University',
      tuition_or_cost: '€0 tuition (public universities)',
      format: 'offline',
      tags: ['daad', 'germany', 'film', 'media'],
      eligibility: 'English-taught programs; NOS scholarship eligible for ST candidates from Assam.',
      description: `${item.summary}\n\nSource: DAAD — German Academic Exchange Service.`,
    }));
  }
}

module.exports = DAADParser;