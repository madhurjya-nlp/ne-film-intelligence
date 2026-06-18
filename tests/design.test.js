const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const v2 = fs.readFileSync(path.join(root, 'css', 'design-system-v2.css'), 'utf8');

const REQUIRED_TOKENS = [
  '--paper:        #F5F1E8',
  '--black:        #111111',
  '--accent-yellow:#FFD400',
  '--accent-red:   #FF4D4D',
  '--accent-blue:  #4EA3FF',
  '--shadow-1: 4px 4px 0 var(--black)',
  '--max-width: 1440px',
];

const REQUIRED_COMPONENTS = [
  '.nb-btn',
  '.nb-card--roadmap',
  '.nb-card--country',
  '.nb-card--opportunity',
  '.nb-card--report',
  '.nb-badge--verified',
  '.nb-alert--success',
  '.explore-layout',
  '.pub-header',
  ':focus-visible',
];

const HTML_FILES = [
  'index.html', 'admin.html', 'programs.html', 'grants.html', 'books.html', 'events.html',
  'pages/roadmaps.html', 'pages/calendar.html', 'pages/countries.html', 'pages/explore.html',
  'pages/reports.html', 'pages/relationships.html', 'pages/search.html', 'pages/404.html',
];

test.describe('CineEduAssan Phase 5 Design System Tests', () => {

  test.it('design-system-v2.css exists with required color tokens', () => {
    for (const token of REQUIRED_TOKENS) {
      assert.ok(v2.includes(token), `Missing token: ${token}`);
    }
  });

  test.it('design-system-v2.css defines component library', () => {
    for (const cls of REQUIRED_COMPONENTS) {
      assert.ok(v2.includes(cls), `Missing component: ${cls}`);
    }
  });

  test.it('design-system-v2.css uses 4px spacing scale', () => {
    assert.ok(v2.includes('--s-1:  4px'));
    assert.ok(v2.includes('--s-24: 96px'));
    assert.match(v2, /--border:\s+4px solid/);
  });

  test.it('all pages reference design-system-v2.css', () => {
    for (const file of HTML_FILES) {
      const content = fs.readFileSync(path.join(root, file), 'utf8');
      assert.ok(
        content.includes('design-system-v2.css'),
        `${file} should link design-system-v2.css`
      );
      assert.ok(
        !content.includes('design-system.css"') && !content.includes("design-system.css'"),
        `${file} should not link legacy design-system.css`
      );
    }
  });

  test.it('seo.js renders pages with design-system-v2.css', () => {
    const seo = fs.readFileSync(path.join(root, 'server', 'utils', 'seo.js'), 'utf8');
    assert.ok(seo.includes('design-system-v2.css'));
    assert.ok(!seo.includes("href=\"/css/design-system.css\""));
  });

  test.it('package.json version is 6.0.0', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
    assert.strictEqual(pkg.version, '6.0.0');
  });

  test.it('public-shell.js exposes PubUI with card type variants', () => {
    const shell = fs.readFileSync(path.join(root, 'js', 'public-shell.js'), 'utf8');
    assert.ok(shell.includes('nb-card--'));
    assert.ok(shell.includes('cardType'));
  });
});