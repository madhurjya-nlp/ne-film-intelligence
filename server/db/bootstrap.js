const { queryOne } = require('./db');

/**
 * Automates seeding of the database if it is empty on startup.
 * Safe, idempotent, and requires no manual database checks.
 */
function bootstrapDatabase() {
  // Never auto-bootstrap in test mode to keep unit tests isolated
  if (process.env.NODE_ENV === 'test') {
    console.log('[Bootstrap] Test environment detected. Skipping auto-bootstrap.');
    return;
  }

  try {
    // 1. Detect if the programs table contains data
    const programCheck = queryOne("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='programs'");
    if (!programCheck || programCheck.count === 0) {
      console.log('[Bootstrap] Database tables not initialized yet. Skipping bootstrap.');
      return;
    }

    const countResult = queryOne("SELECT COUNT(*) as count FROM programs");
    const programCount = countResult ? countResult.count : 0;

    // 2. If empty, run seeds
    if (programCount === 0) {
      console.log('\n=============================================================');
      console.log('[Bootstrap] 🚨 Empty database detected on startup!');
      console.log('[Bootstrap] Running core database seeder...');
      
      const { seedDatabase } = require('./seed');
      seedDatabase();
      
      console.log('[Bootstrap] Running intelligence database seeder...');
      const { seedIntelligence } = require('./seed-intelligence');
      seedIntelligence();

      console.log('[Bootstrap] ✅ Deployment bootstrap completed successfully.');
      console.log('=============================================================\n');
    } else {
      console.log(`[Bootstrap] Database contains ${programCount} programs. Skipping bootstrap.`);
    }
  } catch (err) {
    console.error('[Bootstrap] ❌ Error during database bootstrap verification:', err);
  }
}

module.exports = { bootstrapDatabase };
