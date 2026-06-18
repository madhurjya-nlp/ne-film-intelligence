const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const { runMigrations } = require('../server/db/migrate');
const { bookSchema, bookExternalLinkSchema, ingestionSourceSchema } = require('../server/services/validation');

const root = path.join(__dirname, '..');

test.describe('NE Film Intelligence Phase 5.1 Tests', () => {

  test.it('design-tokens-v3.css defines fluid typography scale', () => {
    const css = fs.readFileSync(path.join(root, 'css', 'design-tokens-v3.css'), 'utf8');
    assert.ok(css.includes('--h1: clamp(4rem, 8vw, 8rem)'));
    assert.ok(css.includes('--body: clamp(1rem, 1.25vw, 1.125rem)'));
  });

  test.it('motion-system.css defines editorial animations', () => {
    const css = fs.readFileSync(path.join(root, 'css', 'motion-system.css'), 'utf8');
    assert.ok(css.includes('@keyframes card-drop'));
    assert.ok(css.includes('@keyframes stamp-slam'));
    assert.ok(css.includes('@keyframes doc-drop'));
    assert.ok(css.includes('prefers-reduced-motion'));
    assert.ok(css.includes('box-shadow: var(--btn-shadow'));
  });

  test.it('motion-controller.js initializes with IntersectionObserver', () => {
    const js = fs.readFileSync(path.join(root, 'js', 'motion-controller.js'), 'utf8');
    assert.ok(js.includes('IntersectionObserver'));
    assert.ok(js.includes('NEFIMotion'));
    assert.ok(js.includes('motion-card-drop'));
  });

  test.it('scroll-engine.js uses performant observers', () => {
    const js = fs.readFileSync(path.join(root, 'js', 'scroll-engine.js'), 'utf8');
    assert.ok(js.includes('IntersectionObserver'));
    assert.ok(!js.includes('addEventListener(\'scroll\''));
    assert.ok(js.includes('NEFIScroll'));
  });

  test.it('sound-engine.js defaults off and persists preference', () => {
    const js = fs.readFileSync(path.join(root, 'js', 'sound-engine.js'), 'utf8');
    assert.ok(js.includes('nefi_ui_sounds'));
    assert.ok(js.includes('localStorage'));
    assert.ok(js.includes('0.15') || js.includes('VOLUME = 0.15'));
    assert.ok(js.includes('enabled = false') || js.includes("v === '1'"));
  });

  test.it('UI audio files exist', () => {
    for (const f of ['tap.wav', 'card-drop.wav', 'stamp.wav', 'toggle.wav']) {
      assert.ok(fs.existsSync(path.join(root, 'public', 'audio', f)), `Missing ${f}`);
    }
  });

  test.it('sources.json includes new category coverage (additive)', () => {
    const sources = JSON.parse(fs.readFileSync(path.join(root, 'server', 'config', 'sources.json'), 'utf8'));
    const categories = new Set(sources.map((s) => s.category));
    for (const cat of ['acting', 'screenwriting', 'theatre', 'video-editing', 'documentary']) {
      assert.ok(categories.has(cat), `Missing category source: ${cat}`);
    }
    assert.ok(sources.length >= 15, 'Expected expanded source registry');
  });

  test.it('book schema validates external_links with priority types', () => {
    const payload = {
      title: 'Test Book',
      external_links: [
        { link_type: 'open_access', url: 'https://archive.org/details/example', priority: 1 },
        { link_type: 'amazon', url: 'https://www.amazon.com/dp/example', priority: 3 },
      ],
    };
    const parsed = bookSchema.parse(payload);
    assert.strictEqual(parsed.external_links.length, 2);
    assert.throws(() => bookExternalLinkSchema.parse({
      book_id: 'b1', link_type: 'invalid', url: 'https://example.com',
    }));
  });

  test.it('migration creates books and book_external_links tables', () => {
    const tmp = path.join(root, 'tests', '_phase51_tmp.sqlite');
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    const db = new DatabaseSync(tmp);
    runMigrations(db);
    const books = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='books'").get();
    const links = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='book_external_links'").get();
    assert.ok(books);
    assert.ok(links);
    db.close();
    fs.unlinkSync(tmp);
  });

  test.it('data/books.js extends records with external_links (legacy link preserved)', () => {
    const src = fs.readFileSync(path.join(root, 'data', 'books.js'), 'utf8');
    assert.ok(src.includes('external_links'));
    assert.ok(src.includes('open_access'));
    assert.ok(src.includes('link:'));
  });

  test.it('hero overlap prevention — stats become static below 1100px', () => {
    const css = fs.readFileSync(path.join(root, 'css', 'motion-system.css'), 'utf8');
    assert.ok(css.includes('max-width: 1100px'));
    assert.ok(css.includes('.hero__stats') && css.includes('position: static'));
  });

  test.it('public-shell rebranded to NE Film Intelligence', () => {
    const shell = fs.readFileSync(path.join(root, 'js', 'public-shell.js'), 'utf8');
    assert.ok(shell.includes('NE Film Intelligence'));
    assert.ok(shell.includes('sound-engine.js'));
  });

  test.it('package.json version is 5.2.0', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
    assert.strictEqual(pkg.version, '5.2.0');
  });
});