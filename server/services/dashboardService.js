const { queryOne, queryAll } = require('../db/db');
const { CalendarService } = require('./calendarService');

const DashboardService = {
  getOverview() {
    const programs = queryOne(`SELECT COUNT(*) as total,
      SUM(CASE WHEN verification_status='verified' AND publication_status='published' THEN 1 ELSE 0 END) as active,
      SUM(CASE WHEN verification_status IN ('pending','needs_review') THEN 1 ELSE 0 END) as pending
      FROM programs`);

    const opportunities = queryOne(`SELECT COUNT(*) as total,
      SUM(CASE WHEN verification_status='verified' AND publication_status='published' THEN 1 ELSE 0 END) as active,
      SUM(CASE WHEN verification_status IN ('pending','needs_review') THEN 1 ELSE 0 END) as pending
      FROM opportunities`);

    const events = queryOne(`SELECT COUNT(*) as total,
      SUM(CASE WHEN verification_status='verified' AND publication_status='published' THEN 1 ELSE 0 END) as active,
      SUM(CASE WHEN verification_status IN ('pending','needs_review') THEN 1 ELSE 0 END) as pending
      FROM events`);

    const institutes = queryOne(`SELECT COUNT(*) as total FROM institutes`);
    const countriesTable = queryOne(`SELECT COUNT(*) as total FROM countries`);
    const roadmaps = queryOne(`SELECT COUNT(*) as total FROM roadmaps`);
    const reports = queryOne(`SELECT COUNT(*) as total FROM reports`);
    const relationships = queryOne(`SELECT COUNT(*) as total FROM entity_relationships`);

    const distinctCountries = queryAll(`
      SELECT country FROM programs WHERE country IS NOT NULL AND country != ''
      UNION SELECT country FROM opportunities WHERE country IS NOT NULL AND country != ''
      UNION SELECT country FROM events WHERE country IS NOT NULL AND country != ''
      UNION SELECT name FROM countries
    `);

    const pendingReviews = queryOne(`
      SELECT COUNT(*) as total FROM (
        SELECT id FROM programs WHERE verification_status IN ('pending','needs_review')
        UNION ALL SELECT id FROM opportunities WHERE verification_status IN ('pending','needs_review')
        UNION ALL SELECT id FROM events WHERE verification_status IN ('pending','needs_review')
        UNION ALL SELECT id FROM institutes WHERE verification_status IN ('pending','needs_review')
      )
    `);

    const calendarStats = CalendarService.getStats();

    const totalOpportunities = (programs?.total || 0) + (opportunities?.total || 0) + (events?.total || 0);
    const activeOpportunities = (programs?.active || 0) + (opportunities?.active || 0) + (events?.active || 0);

    return {
      total_opportunities: totalOpportunities,
      active_opportunities: activeOpportunities,
      breakdown: {
        programs: { total: programs?.total || 0, active: programs?.active || 0, pending: programs?.pending || 0 },
        opportunities: { total: opportunities?.total || 0, active: opportunities?.active || 0, pending: opportunities?.pending || 0 },
        events: { total: events?.total || 0, active: events?.active || 0, pending: events?.pending || 0 },
      },
      countries_covered: distinctCountries.length,
      countries_in_intelligence: countriesTable?.total || 0,
      institutes_covered: institutes?.total || 0,
      roadmaps: roadmaps?.total || 0,
      reports: reports?.total || 0,
      relationships: relationships?.total || 0,
      pending_reviews: pendingReviews?.total || 0,
      calendar: calendarStats,
      upcoming_deadlines: (calendarStats.closing_soon || 0) + (calendarStats.this_month || 0) + (calendarStats.upcoming || 0),
      generated_at: new Date().toISOString(),
    };
  },
};

module.exports = { DashboardService };