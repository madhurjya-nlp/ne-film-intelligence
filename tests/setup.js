process.env.NODE_ENV = 'test';
const fs = require('fs');
const path = require('path');

// Clean up old test database files to start from a clean state
const dbPath = path.join(__dirname, '..', 'server', 'db', 'database.test.sqlite');
const dbWalPath = path.join(__dirname, '..', 'server', 'db', 'database.test.sqlite-wal');
const dbShmPath = path.join(__dirname, '..', 'server', 'db', 'database.test.sqlite-shm');
[dbPath, dbWalPath, dbShmPath].forEach(p => {
  if (fs.existsSync(p)) {
    try {
      fs.unlinkSync(p);
    } catch (err) {}
  }
});

// Seed the database.test.sqlite database fresh
try {
  const { seedDatabase } = require('../server/db/seed');
  seedDatabase();
} catch (err) {
  console.error('[Test Setup] Failed to seed test database:', err);
}
