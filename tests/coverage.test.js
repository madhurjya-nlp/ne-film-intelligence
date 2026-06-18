const test = require('node:test');
const assert = require('node:assert');
const { CoverageService } = require('../server/services/coverageService');
const { queryOne, run } = require('../server/db/db');

test.describe('NE Film Intelligence Phase 6 Coverage & Community Tests', () => {

  test.it('Coverage calculations: Score and density checks', () => {
    // Fetch dashboard
    const dashboard = CoverageService.getCoverageDashboard();
    assert.ok(dashboard.categoryMetrics);
    assert.ok(Array.isArray(dashboard.categoryMetrics));
    assert.ok(Array.isArray(dashboard.expansionPriority));
    assert.ok(Array.isArray(dashboard.countriesCovered));
    assert.ok(Array.isArray(dashboard.countriesMissing));

    // Verify properties on a category metric
    if (dashboard.categoryMetrics.length > 0) {
      const first = dashboard.categoryMetrics[0];
      assert.ok(first.id);
      assert.ok(typeof first.programs === 'number');
      assert.ok(typeof first.opportunities === 'number');
      assert.ok(typeof first.sources === 'number');
      assert.ok(typeof first.score === 'number');
      assert.ok(['Excellent', 'Good', 'Needs Expansion', 'Critical Gap'].includes(first.rating));
    }
  });

  test.it('Source Health: Freshness rating logic', () => {
    const now = new Date();
    
    // Test case: Fresh (<30 days)
    const freshDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString();
    const freshSrc = { last_checked_at: freshDate };
    assert.strictEqual(CoverageService.getSourceFreshness(freshSrc), 'Fresh');

    // Test case: Aging (30–90 days)
    const agingDate = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString();
    const agingSrc = { last_checked_at: agingDate };
    assert.strictEqual(CoverageService.getSourceFreshness(agingSrc), 'Aging');

    // Test case: Stale (90–180 days)
    const staleDate = new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000).toISOString();
    const staleSrc = { last_checked_at: staleDate };
    assert.strictEqual(CoverageService.getSourceFreshness(staleSrc), 'Stale');

    // Test case: Needs Verification (180+ days)
    const oldDate = new Date(now.getTime() - 200 * 24 * 60 * 60 * 1000).toISOString();
    const oldSrc = { last_checked_at: oldDate };
    assert.strictEqual(CoverageService.getSourceFreshness(oldSrc), 'Needs Verification');

    // Test case: No check date
    assert.strictEqual(CoverageService.getSourceFreshness(null), 'Needs Verification');
    assert.strictEqual(CoverageService.getSourceFreshness({}), 'Needs Verification');
  });

  test.it('Dead Link Monitor: Check logging and update source timestamp', () => {
    // Find or create a test source
    let source = queryOne(`SELECT id, url FROM sources LIMIT 1`);
    if (!source) {
      const id = 'src_test_health';
      run(`INSERT INTO sources (id, name, type, url, created_at, updated_at) VALUES (?, 'Test', 'other', 'http://test.com', ?, ?)`, [id, new Date().toISOString(), new Date().toISOString()]);
      source = { id, url: 'http://test.com' };
    }

    const check = CoverageService.logLinkCheck(source.id, source.url, 404, 250);
    assert.ok(check.id);
    assert.strictEqual(check.source_id, source.id);
    assert.strictEqual(check.status_code, 404);

    // Verify check entry exists in DB
    const dbRow = queryOne(`SELECT * FROM dead_link_checks WHERE id = ?`, [check.id]);
    assert.ok(dbRow);
    assert.strictEqual(dbRow.status_code, 404);

    // Verify source checked timestamp updated
    const updatedSource = queryOne(`SELECT last_checked_at FROM sources WHERE id = ?`, [source.id]);
    assert.ok(updatedSource.last_checked_at);
  });

  test.it('Contributor Submission workflow: submit, moderate, publish and attribution', () => {
    const testTitle = 'Cinematography Masterclass';
    const testUrl = 'https://nfts.co.uk/masterclass';

    // Clean up pre-existing entries to ensure idempotency
    run(`DELETE FROM programs WHERE title = ? AND website_url = ?`, [testTitle, testUrl]);
    run(`DELETE FROM contributor_submissions WHERE name = ?`, ['Madhurjya Swaraj']);

    const payload = {
      title: testTitle,
      institute_id: 'inst_nfts',
      country: 'United Kingdom',
      format: 'offline',
      tuition_or_cost: '£1000',
      duration: '1 Month',
      summary: 'NFTS cinematography crash course.',
      website_url: testUrl,
      category: 'Cinematography'
    };

    const submission = CoverageService.submitContributorRecord({
      name: 'Madhurjya Swaraj',
      email: 'madhurjya@nefi.org',
      organization: 'Assam Film Society',
      submission_type: 'program',
      payload: payload
    });

    assert.ok(submission.id);
    assert.strictEqual(submission.name, 'Madhurjya Swaraj');
    assert.strictEqual(submission.status, 'pending');

    // Approve the submission
    const result = CoverageService.moderateSubmission(submission.id, 'approved', 'Looks good!', 'Editor Admin');
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.status, 'approved');

    // Verify program has been created in the database and has contributed_by attribution
    const program = queryOne(`SELECT * FROM programs WHERE title = ?`, [payload.title]);
    assert.ok(program);
    assert.strictEqual(program.contributed_by, 'Madhurjya Swaraj');
    assert.strictEqual(program.verification_status, 'verified');
    assert.strictEqual(program.publication_status, 'published');
  });

  test.it('Automated Source Discovery: Candidates registration and promotion', () => {
    const candidateUrl = 'https://www.lodzfilmschool.edu/directing';
    
    // Clean up if already exists to avoid unique constraint issues
    run(`DELETE FROM source_candidates WHERE url = ?`, [candidateUrl]);
    run(`DELETE FROM sources WHERE url = ?`, [candidateUrl]);

    // Create Candidate
    const candidate = CoverageService.createSourceCandidate({
      title: 'Lodz Directing Department',
      url: candidateUrl,
      country: 'Poland',
      category: 'producing',
      confidence_score: 0.95
    });

    assert.ok(candidate.id);
    assert.strictEqual(candidate.title, 'Lodz Directing Department');

    // Verify exists in candidates
    const candRow = queryOne(`SELECT * FROM source_candidates WHERE id = ?`, [candidate.id]);
    assert.ok(candRow);

    // Approve Candidate (Section E3 Trust Score: .edu URL should get trust level 100)
    const promotion = CoverageService.approveCandidate(candidate.id, 'university_parser');
    assert.strictEqual(promotion.success, true);
    assert.strictEqual(promotion.trust_level, 100);

    // Verify candidate deleted from queue
    const goneCand = queryOne(`SELECT * FROM source_candidates WHERE id = ?`, [candidate.id]);
    assert.strictEqual(goneCand, undefined);

    // Verify source registry entry added
    const source = queryOne(`SELECT * FROM sources WHERE id = ?`, [promotion.source_id]);
    assert.ok(source);
    assert.strictEqual(source.name, 'Lodz Directing Department');
    assert.strictEqual(source.trust_level, 100);
    assert.strictEqual(source.parser_type, 'university_parser');
  });

  test.it('Audit System: getAuditMetrics returns exact and complete measurements', () => {
    const metrics = CoverageService.getAuditMetrics();
    
    // Check Section A: Counts
    assert.ok(metrics.entityCounts);
    assert.ok(metrics.entityCounts.programs.total >= 0);
    assert.ok(metrics.entityCounts.opportunities.total >= 0);
    assert.ok(metrics.entityCounts.countries.total >= 0);
    assert.ok(metrics.entityCounts.books.total >= 0);
    assert.ok(metrics.entityCounts.roadmaps.total >= 0);
    assert.ok(metrics.entityCounts.reports.total >= 0);
    assert.ok(metrics.entityCounts.blog_posts.total >= 0);

    // Check Section B: Health & Freshness
    assert.ok(metrics.healthMetrics);
    assert.strictEqual(typeof metrics.healthMetrics.fresh, 'number');
    assert.strictEqual(typeof metrics.healthMetrics.dead, 'number');
    assert.strictEqual(typeof metrics.healthMetrics.freshPct, 'number');
    assert.strictEqual(typeof metrics.healthMetrics.deadPct, 'number');

    // Check Section C: Category Coverage
    assert.ok(Array.isArray(metrics.categoryMatrix));
    assert.strictEqual(metrics.categoryMatrix.length, 10);
    metrics.categoryMatrix.forEach(cat => {
      assert.ok(cat.category);
      assert.strictEqual(typeof cat.programs, 'number');
      assert.strictEqual(typeof cat.sources, 'number');
      assert.strictEqual(typeof cat.blogs, 'number');
      assert.strictEqual(typeof cat.opportunities, 'number');
      assert.strictEqual(typeof cat.books, 'number');
      assert.strictEqual(typeof cat.roadmaps, 'number');
      assert.strictEqual(typeof cat.reports, 'number');
      assert.ok(cat.flags);
      assert.strictEqual(typeof cat.flags.programs_gap, 'boolean');
      assert.strictEqual(typeof cat.flags.sources_gap, 'boolean');
      assert.strictEqual(typeof cat.flags.blogs_gap, 'boolean');
      assert.strictEqual(typeof cat.flags.opportunities_gap, 'boolean');
    });

    // Check Section D: Country Audit
    assert.ok(metrics.countryCoverage);
    assert.ok(Array.isArray(metrics.countryCoverage.topCountries));
    assert.ok(Array.isArray(metrics.countryCoverage.missingPriorityCountries));
    assert.ok(Array.isArray(metrics.countryCoverage.allCountries));

    // Check Section E: Content Gaps
    assert.ok(metrics.contentGaps);
    assert.ok(Array.isArray(metrics.contentGaps.priorityContentQueue));
    assert.strictEqual(typeof metrics.contentGaps.totalGaps, 'number');

    // Check Section F: Authority Readiness
    assert.ok(metrics.authorityReadiness);
    assert.strictEqual(metrics.authorityReadiness.readinessScore, 34);
    assert.strictEqual(metrics.authorityReadiness.features.length, 5);
    assert.ok(Array.isArray(metrics.authorityReadiness.recommendedOrder));
  });

});
