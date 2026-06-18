const test = require('node:test');
const assert = require('node:assert');
const { BlogService, NewsletterService } = require('../server/services/dbService');
const { SearchService } = require('../server/services/searchService');
const { PublicService } = require('../server/services/publicService');
const { queryOne, run } = require('../server/db/db');

test.describe('NE Film Intelligence Phase 5.2 Living Publication Tests', () => {

  test.it('BlogService: CRUD operations and stats', () => {
    // 1. Create
    const post = BlogService.create({
      title: 'Test Blog Post',
      excerpt: 'This is a test excerpt.',
      content: '<p>This is the test content for our publication.</p>',
      author: 'Test Writer',
      status: 'draft',
      featured: false
    });

    assert.ok(post.id);
    assert.strictEqual(post.title, 'Test Blog Post');
    assert.strictEqual(post.status, 'draft');
    assert.strictEqual(post.featured, 0);

    // 2. Get
    const found = BlogService.get(post.id);
    assert.ok(found);
    assert.strictEqual(found.title, 'Test Blog Post');

    const foundSlug = BlogService.getBySlug(post.slug);
    assert.ok(foundSlug);
    assert.strictEqual(foundSlug.id, post.id);

    // 3. Update
    const updated = BlogService.update(post.id, {
      title: 'Updated Test Blog Post',
      status: 'published',
      featured: true
    });
    assert.strictEqual(updated.title, 'Updated Test Blog Post');
    assert.strictEqual(updated.status, 'published');
    assert.strictEqual(updated.featured, 1);
    assert.ok(updated.published_at);

    // Stats check
    const stats = BlogService.getStats();
    assert.ok(stats.published >= 1);

    // 4. Delete
    BlogService.delete(post.id);
    const deleted = BlogService.get(post.id);
    assert.strictEqual(deleted, undefined);
  });

  test.it('SearchService: integrates and searches blog posts', () => {
    // Insert a published post
    const post = BlogService.create({
      title: 'Assam Film Editorial Piece',
      excerpt: 'Unique story from the northeast.',
      content: '<p>Assam has a rich film history dating back to 1935.</p>',
      status: 'published'
    });

    // Run search
    const results = SearchService.search('Assam');
    assert.ok('blog_articles' in results.categories);
    const found = results.categories.blog_articles.find(p => p.slug === post.slug);
    assert.ok(found);
    assert.strictEqual(found.title, 'Assam Film Editorial Piece');

    // Clean up
    BlogService.delete(post.id);
  });

  test.it('PublicService: retrieves published posts and lists them', () => {
    const post = BlogService.create({
      title: 'Public Guide to Directing',
      content: 'Testing public visibility.',
      status: 'published'
    });

    const list = PublicService.getBlogPosts();
    assert.ok(list.total >= 1);
    
    const item = PublicService.getBlogPostBySlug(post.slug);
    assert.ok(item);
    assert.strictEqual(item.title, 'Public Guide to Directing');
    assert.ok(Array.isArray(item.related_articles));

    BlogService.delete(post.id);
  });

  test.it('PublicService: sitemap contains blog entries', () => {
    const post = BlogService.create({
      title: 'Sitemap Test Post',
      content: 'Testing sitemap inclusions.',
      status: 'published'
    });

    const urls = PublicService.getSitemapUrls('http://localhost:3000');
    const hasPostUrl = urls.some(u => u.loc === `http://localhost:3000/blog/${post.slug}`);
    assert.ok(hasPostUrl);

    BlogService.delete(post.id);
  });

  test.it('NewsletterService: subscription storage and retrieval', () => {
    const email = 'subscriber-test@example.com';
    
    // Clean up any pre-existing subscription to avoid unique index violation
    NewsletterService.unsubscribe(email);

    // Subscribe
    const sub = NewsletterService.subscribe(email);
    assert.ok(sub.id);
    assert.strictEqual(sub.email, email);

    // Check database row
    const row = queryOne(`SELECT * FROM newsletter_subscribers WHERE email = ?`, [email]);
    assert.ok(row);

    // List subscribers
    const list = NewsletterService.list();
    assert.ok(list.total >= 1);
    assert.ok(list.items.some(s => s.email === email));

    // Unsubscribe
    NewsletterService.unsubscribe(email);
    const unlisted = queryOne(`SELECT * FROM newsletter_subscribers WHERE email = ?`, [email]);
    assert.strictEqual(unlisted, undefined);
  });
});
