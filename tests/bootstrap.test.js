const test = require('node:test');
const assert = require('node:assert');
const { bootstrapDatabase } = require('../server/db/bootstrap');
const { queryOne, run } = require('../server/db/db');

test('NE Film Intelligence — Deployment Bootstrap Tests', async (t) => {
  
  test.after(() => {
    // Re-seed the test database cleanly after bootstrap tests finish
    try {
      const { seedDatabase } = require('../server/db/seed');
      seedDatabase();
    } catch (err) {
      console.error('Failed to re-seed test DB after bootstrap tests:', err);
    }
  });

  await t.test('bootstrapDatabase: skips execution in test env', () => {
    const oldEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';

    try {
      // Clear programs to verify seeder does NOT trigger
      run("DELETE FROM programs");
      
      bootstrapDatabase();
      
      const check = queryOne("SELECT COUNT(*) as count FROM programs");
      assert.strictEqual(check.count, 0, 'Should not seed database when NODE_ENV is test');
    } finally {
      process.env.NODE_ENV = oldEnv;
    }
  });

  await t.test('bootstrapDatabase: skips seeding if programs already exist', () => {
    const oldEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    try {
      // Insert a stub institute first to satisfy foreign key constraints
      run(`INSERT OR REPLACE INTO institutes 
           (id, slug, title, country, region, summary, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
          ['inst_stub', 'inst-stub', 'Stub Institute', 'India', 'india', 'A stub institute.', new Date().toISOString(), new Date().toISOString()]
      );

      // Insert a single program stub to represent pre-existing data
      run(`INSERT OR REPLACE INTO programs 
           (id, slug, title, institute_id, category, country, region, summary, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
          ['stub_prog', 'stub-prog', 'Stub Program', 'inst_stub', 'General', 'India', 'india', 'A stub program.', new Date().toISOString(), new Date().toISOString()]
      );

      const initialCheck = queryOne("SELECT COUNT(*) as count FROM programs");
      assert.ok(initialCheck.count > 0, 'Pre-existing program stub should be present');

      // Execute bootstrap
      bootstrapDatabase();

      const postCheck = queryOne("SELECT COUNT(*) as count FROM programs");
      assert.strictEqual(postCheck.count, initialCheck.count, 'Should not run seeders if programs already exist');
    } finally {
      process.env.NODE_ENV = oldEnv;
      // Clean up the stub program and institute
      run("DELETE FROM programs WHERE id = 'stub_prog'");
      run("DELETE FROM institutes WHERE id = 'inst_stub'");
    }
  });
});
