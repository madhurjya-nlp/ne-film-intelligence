const fs = require('fs');
const path = require('path');
const { queryOne, transaction } = require('./db');
const { RoadmapService } = require('../services/roadmapService');
const { CountryService } = require('../services/countryService');
const { RelationshipService } = require('../services/relationshipService');
const { CalendarService } = require('../services/calendarService');

const ROADMAPS_FILE = path.join(__dirname, '..', 'config', 'roadmaps.json');

function seedRoadmaps() {
  const entries = JSON.parse(fs.readFileSync(ROADMAPS_FILE, 'utf8'));
  let inserted = 0;

  transaction(() => {
    for (const entry of entries) {
      const existing = queryOne(`SELECT id FROM roadmaps WHERE id = ?`, [entry.id]);
      if (existing) continue;

      RoadmapService.create({
        id: entry.id,
        slug: entry.slug,
        title: entry.title,
        summary: entry.summary,
        target_audience: entry.target_audience,
        publication_status: 'published',
      });

      const stepIdMap = {};
      for (const step of entry.steps || []) {
        const created = RoadmapService.addStep(entry.id, {
          title: step.title,
          summary: step.summary,
          step_order: step.step_order,
          milestone_label: step.milestone_label,
          prerequisite_step_id: step.prerequisite_step_order
            ? stepIdMap[step.prerequisite_step_order]
            : null,
        });
        stepIdMap[step.step_order] = created.id;
      }
      inserted++;
    }
  });

  return { roadmaps_inserted: inserted };
}

function seedIntelligence() {
  console.log('[Intelligence Seed] Starting Phase 3 seed...');

  const countries = CountryService.seedFromConfig();
  console.log(`[Intelligence Seed] Countries: ${countries.inserted} inserted, ${countries.updated} updated`);

  const roadmaps = seedRoadmaps();
  console.log(`[Intelligence Seed] Roadmaps: ${roadmaps.roadmaps_inserted} inserted`);

  const calendar = CalendarService.syncFromEntities();
  console.log(`[Intelligence Seed] Calendar: ${calendar.synced} events synced`);

  const relationships = RelationshipService.autoLinkFromEntities();
  console.log(`[Intelligence Seed] Relationships: ${relationships.linked} links created`);

  console.log('[Intelligence Seed] Complete.');
  return { countries, roadmaps, calendar, relationships };
}

if (require.main === module) {
  seedIntelligence();
}

module.exports = { seedIntelligence, seedRoadmaps };