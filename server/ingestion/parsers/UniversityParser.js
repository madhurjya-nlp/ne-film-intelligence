const BaseParser = require('./BaseParser');

class UniversityParser extends BaseParser {
  get parserType() {
    return 'university';
  }

  async parse() {
    const html = await this.fetchHtml(this.source.url);
    const rawItems = this.extractListItems(html, this.source.url);
    const entityType = this.source.entity_type;

    return rawItems.map((item) => {
      const common = {
        ...item,
        country: this.config.country || this.source.country || 'Global',
        region: this.config.region || 'asia',
        format: 'offline',
        tags: ['university', 'film-education'],
        eligibility: 'Verify ST/reserved category benefits and attestation requirements from Guwahati.',
      };

      if (entityType === 'opportunity') {
        return {
          ...common,
          type: this.config.type || 'scholarship',
          org: this.config.org || this.source.name,
          amount: item.amount || 'Varies — check official portal',
          funding_info: 'Government or institutional funding — verify current cycle.',
        };
      }

      return {
        ...common,
        institute_name: this.config.instituteName || this.source.name,
        category: this.config.category || 'General',
        tuition_or_cost: item.tuition_or_cost || 'Check official fee schedule',
        description: `${item.summary}\n\nSource: ${this.source.name}.`,
      };
    });
  }
}

module.exports = UniversityParser;