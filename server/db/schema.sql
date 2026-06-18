-- CineEduAssan (CEA) Research Database Schema
-- Built using native SQLite constraints and indexes

-- 1. Sources: Ingestion source registry (Phase 2)
CREATE TABLE IF NOT EXISTS sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'website', 'docx', 'xlsx', 'manual', 'system', 'government', 'university', 'festival', 'other'
  url TEXT,
  country TEXT,
  category TEXT, -- e.g. 'programs', 'grants', 'events', 'scholarships'
  trust_level INTEGER DEFAULT 50 CHECK(trust_level >= 0 AND trust_level <= 100),
  active_status INTEGER CHECK(active_status IN (0, 1)) DEFAULT 1,
  crawl_frequency TEXT DEFAULT 'weekly', -- 'daily', 'weekly', 'monthly', 'manual'
  parser_type TEXT, -- 'daad', 'festival', 'university', 'generic'
  entity_type TEXT CHECK(entity_type IN ('program', 'opportunity', 'event', 'institute')) DEFAULT 'opportunity',
  parser_config TEXT, -- JSON: custom selectors / parser options
  last_checked_at TEXT,
  last_run_at TEXT,
  last_success_at TEXT,
  discovered_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sources_url ON sources(url) WHERE url IS NOT NULL;

-- 1b. Sync Logs: Ingestion run history
CREATE TABLE IF NOT EXISTS sync_logs (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  records_found INTEGER DEFAULT 0,
  records_inserted INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_rejected INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  duration_ms INTEGER DEFAULT 0,
  status TEXT CHECK(status IN ('running', 'success', 'partial', 'failed')) DEFAULT 'running',
  error_message TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sync_logs_source ON sync_logs(source_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_started ON sync_logs(started_at);

-- 1c. Source Record Hashes: Incremental sync tracking
CREATE TABLE IF NOT EXISTS source_record_hashes (
  source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  last_seen_at TEXT NOT NULL,
  PRIMARY KEY (source_id, external_id)
);

CREATE INDEX IF NOT EXISTS idx_record_hashes_entity ON source_record_hashes(entity_id);

-- 2. Institutes: Film schools, academies, universities
CREATE TABLE IF NOT EXISTS institutes (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  country TEXT NOT NULL,
  region TEXT NOT NULL, -- e.g. Northeast India, Europe, Asia, Online
  city TEXT,
  website_url TEXT,
  summary TEXT NOT NULL,
  description TEXT,
  verification_status TEXT CHECK(verification_status IN ('pending', 'verified', 'needs_review', 'rejected')) DEFAULT 'pending',
  publication_status TEXT CHECK(publication_status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
  confidence_score REAL DEFAULT 1.0,
  duplicate_of_id TEXT REFERENCES institutes(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Indexes for fast filtering and searching
CREATE INDEX IF NOT EXISTS idx_institutes_title ON institutes(title);
CREATE INDEX IF NOT EXISTS idx_institutes_region ON institutes(region);
CREATE INDEX IF NOT EXISTS idx_institutes_country ON institutes(country);
CREATE INDEX IF NOT EXISTS idx_institutes_verification ON institutes(verification_status);
CREATE INDEX IF NOT EXISTS idx_institutes_publication ON institutes(publication_status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_institutes_title_url ON institutes(title, website_url) WHERE website_url IS NOT NULL;

-- 3. Programs: Specific education tracks (MA, BVA, diploma, cert)
CREATE TABLE IF NOT EXISTS programs (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  institute_id TEXT NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- e.g. 'Direction', 'Cinematography', 'Editing', 'Audiography', 'General'
  subcategory TEXT,
  country TEXT NOT NULL,
  region TEXT NOT NULL,
  city TEXT,
  remote_or_online INTEGER CHECK(remote_or_online IN (0, 1)) DEFAULT 0,
  format TEXT CHECK(format IN ('online', 'offline', 'hybrid')) DEFAULT 'offline',
  summary TEXT NOT NULL,
  description TEXT,
  eligibility TEXT,
  tuition_or_cost TEXT, -- Cost description / bands (e.g. 0-3L, 4-6L, 7-9L)
  duration TEXT,
  deadline TEXT, -- Deadline info (e.g. 'Annual June 2026')
  application_url TEXT,
  website_url TEXT,
  source_id TEXT REFERENCES sources(id) ON DELETE SET NULL,
  verification_status TEXT CHECK(verification_status IN ('pending', 'verified', 'needs_review', 'rejected')) DEFAULT 'pending',
  publication_status TEXT CHECK(publication_status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
  confidence_score REAL DEFAULT 1.0,
  duplicate_of_id TEXT REFERENCES programs(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_programs_title ON programs(title);
CREATE INDEX IF NOT EXISTS idx_programs_category ON programs(category);
CREATE INDEX IF NOT EXISTS idx_programs_region ON programs(region);
CREATE INDEX IF NOT EXISTS idx_programs_country ON programs(country);
CREATE INDEX IF NOT EXISTS idx_programs_format ON programs(format);
CREATE INDEX IF NOT EXISTS idx_programs_verification ON programs(verification_status);
CREATE INDEX IF NOT EXISTS idx_programs_publication ON programs(publication_status);
CREATE INDEX IF NOT EXISTS idx_programs_deadline ON programs(deadline) WHERE deadline IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_programs_title_url ON programs(title, website_url) WHERE website_url IS NOT NULL;

-- 4. Opportunities: Scholarships, grants, fellowships, labs, residencies
CREATE TABLE IF NOT EXISTS opportunities (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  type TEXT CHECK(type IN ('scholarship', 'grant', 'fellowship', 'lab', 'residency')) NOT NULL,
  subcategory TEXT,
  org TEXT NOT NULL, -- Hosting organization
  amount TEXT, -- e.g. €25,000, Full Ride
  country TEXT NOT NULL,
  region TEXT NOT NULL,
  city TEXT,
  remote_or_online INTEGER CHECK(remote_or_online IN (0, 1)) DEFAULT 0,
  format TEXT CHECK(format IN ('online', 'offline', 'hybrid')) DEFAULT 'offline',
  summary TEXT NOT NULL,
  description TEXT,
  eligibility TEXT,
  funding_info TEXT,
  duration TEXT,
  deadline TEXT,
  application_url TEXT,
  website_url TEXT,
  source_id TEXT REFERENCES sources(id) ON DELETE SET NULL,
  verification_status TEXT CHECK(verification_status IN ('pending', 'verified', 'needs_review', 'rejected')) DEFAULT 'pending',
  publication_status TEXT CHECK(publication_status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
  confidence_score REAL DEFAULT 1.0,
  duplicate_of_id TEXT REFERENCES opportunities(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_opportunities_title ON opportunities(title);
CREATE INDEX IF NOT EXISTS idx_opportunities_type ON opportunities(type);
CREATE INDEX IF NOT EXISTS idx_opportunities_region ON opportunities(region);
CREATE INDEX IF NOT EXISTS idx_opportunities_country ON opportunities(country);
CREATE INDEX IF NOT EXISTS idx_opportunities_format ON opportunities(format);
CREATE INDEX IF NOT EXISTS idx_opportunities_verification ON opportunities(verification_status);
CREATE INDEX IF NOT EXISTS idx_opportunities_publication ON opportunities(publication_status);
CREATE INDEX IF NOT EXISTS idx_opportunities_deadline ON opportunities(deadline) WHERE deadline IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_opportunities_title_url ON opportunities(title, website_url) WHERE website_url IS NOT NULL;

-- 5. Events: Festivals, co-production markets, pitch forums
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  type TEXT CHECK(type IN ('festival', 'co-production market', 'pitch forum', 'other')) NOT NULL,
  subcategory TEXT,
  country TEXT NOT NULL,
  region TEXT NOT NULL,
  city TEXT,
  remote_or_online INTEGER CHECK(remote_or_online IN (0, 1)) DEFAULT 0,
  format TEXT CHECK(format IN ('online', 'offline', 'hybrid')) DEFAULT 'offline',
  summary TEXT NOT NULL,
  description TEXT,
  eligibility TEXT,
  duration TEXT,
  deadline TEXT,
  application_url TEXT,
  website_url TEXT,
  source_id TEXT REFERENCES sources(id) ON DELETE SET NULL,
  verification_status TEXT CHECK(verification_status IN ('pending', 'verified', 'needs_review', 'rejected')) DEFAULT 'pending',
  publication_status TEXT CHECK(publication_status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
  confidence_score REAL DEFAULT 1.0,
  duplicate_of_id TEXT REFERENCES events(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_title ON events(title);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_region ON events(region);
CREATE INDEX IF NOT EXISTS idx_events_country ON events(country);
CREATE INDEX IF NOT EXISTS idx_events_format ON events(format);
CREATE INDEX IF NOT EXISTS idx_events_verification ON events(verification_status);
CREATE INDEX IF NOT EXISTS idx_events_publication ON events(publication_status);
CREATE INDEX IF NOT EXISTS idx_events_deadline ON events(deadline) WHERE deadline IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_title_url ON events(title, website_url) WHERE website_url IS NOT NULL;

-- 6. Submissions: User suggestions or crowd submissions
CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  submitter_name TEXT,
  submitter_email TEXT,
  data_type TEXT CHECK(data_type IN ('institute', 'program', 'opportunity', 'event')) NOT NULL,
  payload TEXT NOT NULL, -- JSON string storing all submission fields
  notes TEXT,
  status TEXT CHECK(status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_submissions_type ON submissions(data_type);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);

-- 7. Review Queue / Moderation Logs: Tracks audit trail for changes & approvals
CREATE TABLE IF NOT EXISTS review_queue (
  id TEXT PRIMARY KEY,
  target_type TEXT CHECK(target_type IN ('institute', 'program', 'opportunity', 'event', 'submission')) NOT NULL,
  target_id TEXT NOT NULL,
  status TEXT CHECK(status IN ('pending', 'verified', 'needs_review', 'rejected')) DEFAULT 'pending',
  reviewer_notes TEXT,
  updated_by TEXT,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_review_target ON review_queue(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_review_status ON review_queue(status);

-- Supporting Normalization Tables (e.g. Tags & Categories)
CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS entity_tags (
  entity_type TEXT CHECK(entity_type IN ('institute', 'program', 'opportunity', 'event')) NOT NULL,
  entity_id TEXT NOT NULL,
  tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (entity_type, entity_id, tag_id)
);

-- ═══════════════════════════════════════════════════════════════
-- PHASE 3: Research Intelligence Layer
-- ═══════════════════════════════════════════════════════════════

-- 8. Roadmaps: Structured filmmaker pathways
CREATE TABLE IF NOT EXISTS roadmaps (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  description TEXT,
  target_audience TEXT,
  publication_status TEXT CHECK(publication_status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_roadmaps_slug ON roadmaps(slug);
CREATE INDEX IF NOT EXISTS idx_roadmaps_publication ON roadmaps(publication_status);

CREATE TABLE IF NOT EXISTS roadmap_steps (
  id TEXT PRIMARY KEY,
  roadmap_id TEXT NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  step_order INTEGER NOT NULL,
  prerequisite_step_id TEXT REFERENCES roadmap_steps(id) ON DELETE SET NULL,
  milestone_label TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_roadmap_steps_roadmap ON roadmap_steps(roadmap_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_steps_order ON roadmap_steps(roadmap_id, step_order);

CREATE TABLE IF NOT EXISTS roadmap_resources (
  id TEXT PRIMARY KEY,
  step_id TEXT NOT NULL REFERENCES roadmap_steps(id) ON DELETE CASCADE,
  entity_type TEXT CHECK(entity_type IN ('institute', 'program', 'opportunity', 'event', 'country', 'report')) NOT NULL,
  entity_id TEXT NOT NULL,
  resource_order INTEGER DEFAULT 0,
  notes TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_roadmap_resources_step ON roadmap_resources(step_id);

-- 9. Calendar Events: Deadline intelligence
CREATE TABLE IF NOT EXISTS calendar_events (
  id TEXT PRIMARY KEY,
  entity_type TEXT CHECK(entity_type IN ('program', 'opportunity', 'event')) NOT NULL,
  entity_id TEXT NOT NULL,
  title TEXT NOT NULL,
  deadline_date TEXT,
  deadline_raw TEXT,
  deadline_status TEXT CHECK(deadline_status IN ('upcoming', 'closing_soon', 'this_month', 'expired', 'unknown')) DEFAULT 'unknown',
  country TEXT,
  region TEXT,
  source_id TEXT REFERENCES sources(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_calendar_deadline_date ON calendar_events(deadline_date);
CREATE INDEX IF NOT EXISTS idx_calendar_status ON calendar_events(deadline_status);

-- 10. Reports: Query-generated research summaries
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  report_type TEXT CHECK(report_type IN (
    'new_opportunities', 'scholarships_added', 'festivals_opening',
    'country_update', 'online_programs', 'custom'
  )) NOT NULL,
  summary TEXT,
  publication_status TEXT CHECK(publication_status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
  generated_at TEXT NOT NULL,
  published_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(report_type);
CREATE INDEX IF NOT EXISTS idx_reports_publication ON reports(publication_status);

CREATE TABLE IF NOT EXISTS report_sections (
  id TEXT PRIMARY KEY,
  report_id TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  section_order INTEGER NOT NULL,
  heading TEXT NOT NULL,
  content TEXT NOT NULL,
  query_meta TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_report_sections_report ON report_sections(report_id);

-- 11. Countries: Structured country intelligence
CREATE TABLE IF NOT EXISTS countries (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  region TEXT NOT NULL,
  summary TEXT NOT NULL,
  language_notes TEXT,
  publication_status TEXT CHECK(publication_status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_countries_region ON countries(region);

CREATE TABLE IF NOT EXISTS country_cost_profiles (
  id TEXT PRIMARY KEY,
  country_id TEXT NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
  cost_band TEXT NOT NULL,
  tuition_notes TEXT,
  living_cost_notes TEXT,
  currency TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS country_visa_notes (
  id TEXT PRIMARY KEY,
  country_id TEXT NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
  visa_type TEXT,
  notes TEXT NOT NULL,
  processing_time TEXT,
  st_candidate_notes TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS country_scholarship_notes (
  id TEXT PRIMARY KEY,
  country_id TEXT NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  notes TEXT NOT NULL,
  eligibility TEXT,
  linked_opportunity_id TEXT REFERENCES opportunities(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL
);

-- 12. Entity Relationships: Lightweight knowledge graph
CREATE TABLE IF NOT EXISTS entity_relationships (
  id TEXT PRIMARY KEY,
  from_type TEXT CHECK(from_type IN ('country', 'institute', 'program', 'opportunity', 'event', 'source', 'roadmap')) NOT NULL,
  from_id TEXT NOT NULL,
  to_type TEXT CHECK(to_type IN ('country', 'institute', 'program', 'opportunity', 'event', 'source', 'roadmap')) NOT NULL,
  to_id TEXT NOT NULL,
  relationship_type TEXT NOT NULL,
  weight REAL DEFAULT 1.0,
  notes TEXT,
  created_at TEXT NOT NULL,
  UNIQUE(from_type, from_id, to_type, to_id, relationship_type)
);

CREATE INDEX IF NOT EXISTS idx_rel_from ON entity_relationships(from_type, from_id);
CREATE INDEX IF NOT EXISTS idx_rel_to ON entity_relationships(to_type, to_id);
CREATE INDEX IF NOT EXISTS idx_rel_type ON entity_relationships(relationship_type);

-- 13. Blog Posts (Phase 1)
CREATE TABLE IF NOT EXISTS blog_posts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  cover_image TEXT,
  author TEXT,
  status TEXT CHECK(status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
  published_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  reading_time INTEGER,
  featured INTEGER CHECK(featured IN (0, 1)) DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_blog_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_published ON blog_posts(published_at);
CREATE INDEX IF NOT EXISTS idx_blog_status ON blog_posts(status);

-- 14. Newsletter Subscribers (Phase 7)
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);

