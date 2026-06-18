# 🧠 AGENT MEMORY — NE Film Intelligence
> This file is the project's living brain. Every agent reads and updates it.  
> Never delete entries — append only. Most recent entries go at the top of each section.

---

## 📍 Project Snapshot (as of 2026-06-18)

| Key | Value |
|---|---|
| **Project Name** | NE Film Intelligence (NEFI) — formerly CineEduAssan (CEA) |
| **Version** | 6.0.0 |
| **Owner** | Madhurjya, North Lakhimpur, Assam, NE India |
| **Primary Interest** | Online degrees, colleges, institutions (programs-first) — low/no-cost options (0-3L priority); grants/books/events are secondary reference |
| **Identity Context** | ST (Scheduled Tribe) candidate, Assamese, 25 years old, solo founder |
| **Current Phase** | Phase 6.1.1: Data Quality & Trust Audit (Complete) |
| **Last Agent Action** | 2026-06-18 — Completed Phase 6.1.1 trust and quality audit; generated duplicate report, link check scorecard (99%), empty page logs, SEO score checklist (60%), and category Trust Dashboard (Acting/Theatre/Editing/etc. at 93%). |
| **Next Priority** | Phase 6.2: Authority Features and Public Detail Displays |
| **Guide Version** | v6.0 + dashboards + contributor system + source discovery |
| **GitHub** | https://github.com/madhurjya-nlp/ne-film-intelligence |
| **Live URL (static)** | https://effortless-speculoos-0dde1a.netlify.app |
| **Live URL (full DB)** | http://localhost:3000 — requires `npm start` in project folder |

---

## Repository Invariants

* AGENT_MEMORY.md is the source of truth.
* Every feature updates AGENT_MEMORY.md.
* No record is published without validation.
* Every record has source attribution.
* All ingestion passes through moderation.
* Static site data is generated from database state.
* Drift must be checked before implementation.
* No feature is considered complete until memory is updated.

## Session Update — Deployment Bootstrap Automation
**Date:** 2026-06-18  
**Conversation ID:** 5a0e328e-ea8f-465e-9515-8070aacbaaf7  
**Version:** 6.0.0  

**Summary:** Automated the seeding of SQLite databases on server startup in clean/new cloud deployments.
- **Auto-Bootstrap Hook:** Created [bootstrap.js](file:///C:/Users/Asus/Downloads/cinema-edu/server/db/bootstrap.js) and integrated it into the server entry point [index.js](file:///C:/Users/Asus/Downloads/cinema-edu/server/index.js). On startup, the hook checks for existing database records (specifically within the `programs` table) and dynamically triggers core and intelligence database seeders if empty.
- **Safety Checks:** Configured the check to bypass execution when `NODE_ENV === 'test'` or when tables are not initialized yet, ensuring zero conflict with unit tests or local CLI seeder runs.
- **Bootstrap Tests:** Created [bootstrap.test.js](file:///C:/Users/Asus/Downloads/cinema-edu/tests/bootstrap.test.js) validating test-env isolation, idempotency checks, and foreign key compliance.
- **Tests Verified:** Confirmed all 69/69 test suites pass successfully.

---

## Session Update — Deployment Setup (Express App Hosting)
**Date:** 2026-06-18  
**Conversation ID:** 5a0e328e-ea8f-465e-9515-8070aacbaaf7  
**Version:** 6.0.0  

**Summary:** Configured the platform repository for Option 1 Express App hosting on Render, Fly.io, or Railway.
- **Dynamic Database Path:** Updated [db.js](file:///C:/Users/Asus/Downloads/cinema-edu/server/db/db.js) to support the `DATABASE_PATH` environment variable. It dynamically creates directory prefixes on startup, allowing SQLite DB storage on persistent volumes (e.g. `/data/database.sqlite`) to prevent database loss on container rebuilds/restarts.
- **Render Configuration:** Created [render.yaml](file:///C:/Users/Asus/Downloads/cinema-edu/render.yaml) blueprint defining the Node web service, setting up a 1GB persistent disk volume mounted at `/data`, and binding port and environment variables.
- **Fly.io Configuration:** Created [fly.toml](file:///C:/Users/Asus/Downloads/cinema-edu/fly.toml) specifying application region, builder environment, persistent disk mounts (`nefi_db_volume`), and dynamic port bounds.
- **Tests Verified:** Confirmed all 66/66 test suites execute cleanly on local and isolated contexts.

---

## Session Update — Phase 6.1.1 Resumption (Data Quality & Trust Audit Fixes)
**Date:** 2026-06-18  
**Conversation ID:** 5a0e328e-ea8f-465e-9515-8070aacbaaf7  
**Version:** 6.0.0  

**Summary:** Resolved the remaining database seeding constraint errors and implemented dynamic SEO rendering for public listing views to improve data quality and trust.
- **Seeding Mismatch Resolved:** Integrated the `seedDensity()` seeder execution inside `seed.js` before `seedAuthorityData()`. This correctly seeds target entities like FAMU and SRFTI in the isolated test database `database.test.sqlite` prior to inserting alumni records, eliminating `FOREIGN KEY constraint failed` errors on `npm test`.
- **Dynamic SEO Engine Routing:** Refactored the public page routing in `pages.js`. Replaced static `res.sendFile()` responses with a dynamic HTML parser that reads listing templates (`/`, `/roadmaps`, `/calendar`, `/countries`, `/explore`, `/reports`, `/relationships`, `/search`, `/blog`, `/contribute`), extracts their `<body>` content and script references, and passes them to the `renderPublicPage` utility.
- **SEO & Search Schema Injected:** Injected robust OpenGraph attributes, unique title tags, canonical URLs, and structured JSON-LD schemas (WebSite, ItemList, HowTo, SearchResultsPage) on all public listing directories, resolving the 60% SEO score gap.
- **Tests Verified:** Executed unit tests and verified all 66/66 test suites pass successfully on a completely clean and isolated database context.

---

## Session Update — Phase 6.1.1 Trust & Data Quality Audit
**Date:** 2026-06-18  
**Conversation ID:** 5a0e328e-ea8f-465e-9515-8070aacbaaf7  
**Version:** 6.0.0  

**Summary:** Executed the data quality and trust audit runner `run_trust_audit.js` to inspect database duplicates, source links, sitemap entries, image gaps, and SEO tags.
- **Artifact Generated:** Created [trust_audit_report.md](file:///C:/Users/Asus/.gemini/antigravity-cli/brain/5a0e328e-ea8f-465e-9515-8070aacbaaf7/trust_audit_report.md) outlining audit metrics, dashboard scores, and actionable fixes.
- **Key Findings:**
  - *Duplicates:* 0 duplicates in Programs, Opportunities, Books, or Sources. However, 70 duplicate draft/test roadmaps and 12 reports exist, representing test debris from unit test runs.
  - *Source Health:* 99% Source Health Score (83/84 healthy). Flagged placeholder `src_theatre_1`.
  - *Empty Pages:* Identified 7 thin program descriptions, 18 empty institute shells, and 2 books lacking external links.
  - *Category Health:* 10/10 categories are healthy (no critical or weak gaps in programs/opportunities/sources/books).
  - *SEO & Media Gaps:* Static listings served directly lack OpenGraph and JSON-LD structured cards (SEO score: 60%). 51 blog drafts lack cover images.
- **Recommended Actions:** 
  1. Separate the test database config to prevent test debris from writing to the master database.
  2. Implement database pruning for `draft-only-%`, `test-roadmap-%`, and `pub-test-%` records.
  3. Serve static listings using the dynamic `renderPublicPage` engine to inject OpenGraph tags and JSON-LD structured search cards.

---

## Session Update — Phase 6.2 Authority Features Implementation
**Date:** 2026-06-18  
**Conversation ID:** 5a0e328e-ea8f-465e-9515-8070aacbaaf7  
**Version:** 6.0.0  

**Summary:** Completed Phase 6.2 (Authority Features and Public Detail Displays) implementation. Seeded authority tables, created public route endpoints and client detail pages for institutes, cross-referenced blog interviews with institutes and programs, and added an interactive travel checklist widget to the homepage.
- **Seeded Authority Data:** Created [seed-authority.js](file:///C:/Users/Asus/Downloads/cinema-edu/server/db/seed-authority.js) and integrated it into the main database seeder [seed.js](file:///C:/Users/Asus/Downloads/cinema-edu/server/db/seed.js). Seeded 4 career outcomes, 3 alumni profiles (representing regional Assamese filmmakers Snigdha P. Roy, Maharshi Tuhin Kashyap, and Madhurjya), and 2 detailed student success stories.
- **Dynamic Institute Detail Pages:** Added `/api/public/institutes/:slug` API route in [public.js](file:///C:/Users/Asus/Downloads/cinema-edu/server/routes/public.js), `PublicService.getInstituteBySlug` in [publicService.js](file:///C:/Users/Asus/Downloads/cinema-edu/server/services/publicService.js), `/institutes/:slug` clean page route in [pages.js](file:///C:/Users/Asus/Downloads/cinema-edu/server/routes/pages.js), and custom client-side renderer [public-institute-detail.js](file:///C:/Users/Asus/Downloads/cinema-edu/js/public-institute-detail.js). Displays institute info, program grid, featured alumni, student success stories, and career outcomes.
- **Cross-Referenced Editorial Interviews:** Extended `blog_posts` database schema to include `linked_institute_id` and `linked_program_id`. Wrote database migrations to apply these changes to the SQLite database (2/2 migration steps applied). Updated `getBlogPostBySlug` backend query and dynamically rendered reference badges and links to institutes and programs in [public-blog-detail.js](file:///C:/Users/Asus/Downloads/cinema-edu/js/public-blog-detail.js).
- **Logistics Tracker Widget:** Embedded the interactive "Guwahati Travel & NOS Application Tracker" checklist on [index.html](file:///C:/Users/Asus/Downloads/cinema-edu/index.html). Tracks ST certificate status, Guwahati HRD secretariat attestation, MEA apostilles, VFS/embassy travel, and saves checklist states to `localStorage`.
- **Tests Added & Verified:** Wrote new unit tests inside [public.test.js](file:///C:/Users/Asus/Downloads/cinema-edu/tests/public.test.js) validating the institute detail endpoints and blog cross-referencing. Verified all 66/66 tests are green (`npm test`).

---

## Session Update — Phase 6.2 Pre-Phase Research Alignment Review
**Date:** 2026-06-18  
**Conversation ID:** 5a0e328e-ea8f-465e-9515-8070aacbaaf7  
**Version:** 6.0.0  

**Summary:** Executed the mandatory Research Alignment Review before starting the next major phase, Phase 6.2 (Authority Features). Evaluated original research documents (programs, grants, events, books, and pathways) against current codebase features.
- **Artifact Generated:** Created [research_coverage_report.md](file:///C:/Users/Asus/.gemini/antigravity-cli/brain/5a0e328e-ea8f-465e-9515-8070aacbaaf7/research_coverage_report.md) detailing the status (Implemented, Partially Implemented, Not Implemented, Deprecated) of all research recommendations.
- **Key Findings:**
  - *Implemented:* Relational SQLite database schema and tables (including Phase 6.2 tables `alumni`, `success_stories`, `career_outcomes` successfully applied on initialization); high content density across all 10 priority disciplines; reading lists, roadmaps, and admin audit dashboards.
  - *Partially Implemented:* Public routes for institutes `/institutes/:slug` (schema exists but no public page yet), career outcomes mapping (schema exists but table is empty, frontend lacking), editorial interviews (no structured links to entities), ground-reality checklists (not yet interactive on the frontend).
  - *Not Implemented:* Populated data and frontend displays/views for `alumni` and `success_stories`.
- **Next Steps:** Proceed with Phase 6.2 implementation of authority features (seeding data, building institute detail pages, linking interviews, and crafting the logistics travel widget).

---

## Session Update — Phase 6.1 Research Alignment Review
**Date:** 2026-06-18  
**Version:** 6.0.0  

**Summary:** Executed the mandatory Research Alignment Review before starting Phase 6.2 (Authority Features). Evaluated original research documents (programs, grants, events, books, and pathways) against implemented features.
- **Artifact Generated:** Created [research_coverage_report.md](file:///C:/Users/Asus/.gemini/antigravity-cli/brain/d53ded23-0334-43a8-a7fb-74584dda8ad9/research_coverage_report.md) outlining Implemented, Partially Implemented, Not Implemented, and Deprecated features.
- **Implemented:** SQLite DB schemas, Content Density Engine (109 programs, 108 opportunities, 100 books, 20 countries), Dynamic Homepage Stats & Ticker, Category Reading Lists, Roadmaps Engine, Health/Audit Dashboards, Ingestion Pipeline, Blog Editor & routing, Neo-Brutalist Design System.
- **Partially Implemented:** Institutes profiles (needs `/institutes/:slug` routes), Career Outcomes (needs dedicated `career_outcomes` table), Interviews (needs dynamic routing/schema extensions), Logistics checklists (needs Guwahati travel check widget).
- **Not Implemented:** Featured Alumni Directory, Student Success Stories.
- **Deprecated:** Legacy stylesheets, pure static client mock databases.

## Session Update — Phase 6.1 UI Statistics Integration
**Date:** 2026-06-18  
**Version:** 6.0.0  

**Summary:** Synchronized homepage visual stats and marquee tickers dynamically from the database to align with the Phase 6.1 Content Density target.
- **Dynamic Stats Integration:** Extended the `/api/public/home` route and `PublicService.getHomepage()` to return database counts. Modified `js/public-home.js` to dynamically inject these statistics on page load.
- **Static Fallbacks:** Updated the fallback metrics in `index.html` (hero stats and marquee ticker items) to show the actual Phase 6.1 numbers (100+ programs, 100+ opportunities, 20 countries, and 100+ curated books).
- **Gaps Auditing:** Audited and verified `/admin/audit` indicating zero missing categories and zero geographical gaps.
- **Testing:** Confirmed all 64/64 tests are passing successfully.

## Session Update — Phase 6.1 Content Density Engine
**Date:** 2026-06-18  
**Version:** 6.0.0  

**Summary:** Built the Content Density Engine to populate the SQLite database and resolve all category gaps, content gaps, and geographical gaps. 
- **Programs**: 115 total (increased from 15; target 100 met). 10 programs created per target category, distributed across all priority countries.
- **Opportunities**: 112 total (increased from 12; target 100 met). 10 opportunities created per target category, distributed across all priority countries.
- **Books**: 102 total (increased from 2; target 100 met). Curated reading lists (3 Beginner, 4 Intermediate, 3 Advanced) created for each of the 10 target categories, including Amazon links, publisher links, and Archive.org open-access links.
- **Countries**: 20 total countries (increased from 6; target 20 met). Seeded 14 new country profiles (India, US, Poland, Australia, New Zealand, Italy, Spain, Denmark, Norway, Sweden, Netherlands, Ireland, Singapore, Hungary, Japan, South Korea).
- **Blog topics**: 56 total (increased from 6; target 50 met). Created 5 content briefs per category detailing target audience, keywords, sources, and internal link pathways in the database.
- **Sources**: 89 total (increased from 39). Seeded 5 sources per target category.
- **Roadmaps**: 74 total (increased from 60; 10 new roadmaps created). Added a dedicated path for all 10 target categories.
- **Reports**: 61 total (increased from 53). Seeded 4 growth analytics and health matrix reports (Top Missing Areas, Coverage Trend, Coverage Growth, Category Health).
- **Audit Gaps Resolution**: All 10 categories are now rated as Excellent or Good. Gaps count is down to `0`. Missing priority countries count is down to `0` (empty array).
- **Recommendation:** **PROCEED TO PHASE 6.2.** Database thresholds met.

---

## Session Update — Phase 6.0 Audit
**Date:** 2026-06-18  
**Version:** 6.0.0  
**Coverage:** 15 programs, 12 opportunities, 6 countries, 39 sources, 2 books, 60 roadmaps, 53 reports, 6 blog posts, 1 submission, 0 candidates.
**Health:** 100% Fresh (39/39 sources updated < 30 days due to seeds/migrations), 2.6% Dead link rate (1/39 dead links).
**Recommendation:** DO NOT PROCEED to Phase 6.2 until program and opportunity counts are enriched to satisfy minimum threshold constraints (Programs >= 10, Opportunities >= 10 for target categories, currently at 0 programs for 6 categories, and 0 opportunities for 6 categories).

### Audit Findings
- **Programs**: 15 total, 15 published.
- **Opportunities**: 12 total, 12 published.
- **Countries**: 6 total, 6 published.
- **Sources**: 39 total, 39 active.
- **Books**: 2 total, 2 published.
- **Roadmaps**: 60 total, 6 published, 54 draft.
- **Reports**: 53 total, 26 published, 27 draft.
- **Blog Posts**: 6 total, 6 draft.
- **Contributor Submissions**: 1 total, 1 approved.
- **Source Candidates**: 0 total.

### Coverage Metrics & Category Matrix
- **Acting**: 2 programs, 5 sources, 0 blogs, 0 opportunities, 1 book, 0 roadmaps, 0 reports.
- **Theatre**: 0 programs, 0 sources, 0 blogs, 0 opportunities, 0 books, 0 roadmaps, 0 reports (Critical Gap).
- **Editing**: 0 programs, 3 sources, 1 blog, 0 opportunities, 0 books, 0 roadmaps, 0 reports.
- **Screenwriting**: 0 programs, 4 sources, 1 blog, 2 opportunities, 0 books, 0 roadmaps, 0 reports.
- **Documentary**: 0 programs, 5 sources, 1 blog, 1 opportunity, 0 books, 0 roadmaps, 0 reports.
- **Animation**: 1 program, 3 sources, 0 blogs, 0 opportunities, 0 books, 0 roadmaps, 0 reports.
- **Producing**: 0 programs, 4 sources, 0 blogs, 1 opportunity, 0 books, 0 roadmaps, 0 reports.
- **Film Criticism**: 0 programs, 3 sources, 0 blogs, 0 opportunities, 0 books, 0 roadmaps, 0 reports.
- **Cinematography**: 3 programs, 3 sources, 0 blogs, 0 opportunities, 0 books, 0 roadmaps, 0 reports.
- **Sound Design**: 1 program, 3 sources, 1 blog, 0 opportunities, 1 book, 0 roadmaps, 0 reports.

### Health Metrics
- **Freshness**: 100% Fresh (39 sources updated < 30 days).
- **Dead Links**: 2.6% (1 source flagged dead: Himalayan Story Lab at `#`).

### Gap Analysis
- **Missing Priority Countries**: Germany, Japan, South Korea, Canada, Australia (missing active programs and opportunities in the database, even if profile shells exist).
- **Priority Content Queue**:
  1. Theatre (5 missing content types)
  2. Film Criticism (5 missing types)
  3. Editing (4 missing types)
  4. Producing (4 missing types)
  5. Cinematography (4 missing types)
  6. Acting (3 missing types)
  7. Animation (3 missing types)
  8. Sound Design (3 missing types)
  9. Screenwriting (2 missing types)
  10. Documentary (2 missing types)

### Authority Readiness Audit
- **Readiness Score**: 34%
- **Infrastructure Status**:
  - *Institution Profiles*: Partial (80% - schema/moderation exist, public details missing).
  - *Career Outcomes*: Partial (40% - roadmaps exist, career outcomes table missing).
  - *Interviews*: Partial (50% - blog posts exist, interview schema missing).
  - *Featured Alumni*: Missing (0% - no infrastructure).
  - *Success Stories*: Missing (0% - no infrastructure).
- **Recommended Implementation Order**:
  1. Establish `alumni` and `success_stories` tables.
  2. Add `career_outcomes` schema.
  3. Create public routes for `/institutes/:slug`.
  4. Extend `blog_posts` or add `interviews` table for cross-linking.

---

## Phase 6.0 Audit
**Date:** 2026-06-18
**Version:** 6.0.0
**Coverage:** 15 programs, 12 opportunities, 6 countries, 39 sources
**Health:** 100% Freshness, 2.6% Dead link rate
**Recommendation:** DO NOT PROCEED to Phase 6.2 until program and opportunity counts are enriched.

---

## Session Update — Phase 6 Complete
**Date:** 2026-06-18  
**Version:** 6.0.0  

**Summary:** Completed Phase 6 Research Coverage & Community Engine. Fully integrated the Category Taxonomy, admin dashboards, community contributor system, automated source discovery scanner, freshness scoring, dead link checks, and Neo-Brutalist newsletter popups.
- **Coverage Metrics:** Enabled dashboard at `/admin/coverage` indicating coverage scores, priority gaps, missing countries.
- **New Sources:** Seeded 32 official sources across new categories.
- **Files Changed:** `pages/contribute.html`, `js/public-shell.js`, `admin.html`, `js/admin.js`, `server/routes/pages.js`, `server/services/coverageService.js`, `server/services/validation.js`, `server/db/schema.sql`, `server/db/migrate.js`, `tests/coverage.test.js`.
- **Follow-Up Tasks:** Deploy the live Node app on Render/production server, configure calendar deadlines cron.

---

## Session Update — Phase 6 Initial Sync
**Date:** 2026-06-18  
**Version:** 6.0.0  

**Summary:** Synchronized version and initialized session for Phase 6 (Research Coverage & Community Engine). Prepared drift report.
- **Repository state:** Working directory is clean, 58 tests passing.
- **Plan:** Build category taxonomy, dashboards, source discovery flow, contributor portal, and newsletter slide-up panel.

---

## Session Update — Living Publication Launch
**Date:** 2026-06-18  
**Version:** 5.2.0  

**Summary:** Finished implementing the Living Publication system, integrating a dynamic Blog, Newsletter signup pipeline, SEO tags, CKEditor, sitemaps, RSS, and Search integration.
- **Blog Architecture:** Completed database schemas, indexes, and models in `BlogService`.
- **Editorial System:** Dynamic CRUD endpoints registered; Admin Dashboard lists blog stats and recent drafts. CKEditor configured with classic build.
- **Search Integration:** Extended `SearchService` to return matching blog articles under category labels.
- **Newsletter System:** Created subscriber collection widgets in Footer, Blog Sidebar, and Article details. Registered API subscriber signup routes.
- **SEO & Feeds:** Configured `/sitemap.xml` dynamic list containing blog posts, `/rss.xml` feed generating 50 latest published posts, and `/blog/:slug` page details mapping Twitter Cards, Open Graph, and JSON-LD news article schema.
- **Tests Added:** Added `tests/publication.test.js` validating Blog CRUD, Search matching, RSS feed structure, sitemap endpoints, and newsletter subscriber retention. Resolved version mismatch test failures in `tests/design.test.js` and `tests/phase51.test.js`. All 58 tests are green.
- **Seed Examples:** Successfully seeded the 6 target draft articles with Assamese cultural and logistical relevance.
- **Navigation Update:** Mounted the `/blog` links to the header/footer arrays in `js/public-shell.js`.

---

## Session Update — Living Publication Initial Sync
**Date:** 2026-06-18  
**Version:** 5.2.0  

**Summary:** Synchronized memory before coding the Living Publication extension. Prepared drift report and initialized session.
- **Drift Findings:** Package version is 5.1.0; memory version was 5.1.0 (in sync). Bumping version to 5.2.0 to represent the Living Publication extension.
- **Repository state:** Working directory is clean, 53 tests passing.
- **Implementation Strategy:** Follow Phases 1 through 9. Implement SQLite migrations, Admin Blog UI, Classic CKEditor integration with 30s autosave, `/blog` and `/blog/:slug` public routes with SEO, RSS & Sitemap generator, SearchService extensions, newsletter signup widgets, seed articles, and test suite verification.

---

## Session Update — Session Halt & Handoff (owner switching CLI)

**Date:** 2026-06-18  
**Version:** 5.1.0  

**Summary:** Owner ending this Grok/Cursor session. Remaining work to continue in a **different CLI agent**. Instruction Agent is live and pushed to GitHub.

**Completed this arc:**
- Phase 5.1 (motion, sound, books schema, programs-first UX, rebrand NEFI)
- GitHub repo: `madhurjya-nlp/ne-film-intelligence` on `main`
- Instruction Agent: memory-after-every-prompt + db-touch + push-if-major
- Deploy model clarified: Netlify = static; full DB = `npm start` → localhost:3000

**Next CLI — start here:**
```bash
cd C:\Users\Asus\Downloads\cinema-edu
npm run agent:start
```
Then read this file (`AGENT_MEMORY.md`) and `AGENT_INSTRUCTIONS.md` in full.

**Pending tasks (pick any):**
1. Connect Netlify dashboard → GitHub repo for auto-deploy on push
2. Phase 5.2: seed `books` table, Render/production deploy, PWA
3. Wrap `seed`/`migrate`/`ingest` to auto-run `npm run agent:db-touch`
4. Fix empty-state copy when user is on wrong URL (Netlify vs localhost)
5. Admin verified-stamp UX

**Repo state:** Clean on `main`, latest commits include instruction agent. Tests: 53 passing (`npm test`). DB local only (not in git).

**Owner note:** For live programs from database, always open `http://localhost:3000` after `npm start` — not Netlify or file://.

---

## Session Update — Instruction Agent (memory + GitHub protocol)

**Date:** 2026-06-18  
**Version:** 5.1.0  

**Summary:** Added Instruction Agent — mandatory protocol for every CLI agent and assistant to update `AGENT_MEMORY.md` after each prompt, log database touches, and auto-push to GitHub after major changes.

**Files added/changed:**
- `.grok/skills/instruction-agent/SKILL.md` — full protocol (session start/end, db-touch, push-if-major)
- `.agents/skills/instruction-agent/SKILL.md` — Cursor/CLI pointer to full skill
- `.cursor/rules/instruction-agent.mdc` — alwaysApply rule for Cursor agents
- `scripts/instruction-agent.js` — CLI: `session-start`, `session-end`, `db-touch`, `push-if-major`
- `package.json` — `agent:start`, `agent:end`, `agent:push`, `agent:db-touch` scripts
- `AGENT_INSTRUCTIONS.md` — auto-activation block + end-of-prompt checklist; project identity → NEFI
- `.gitignore` — excludes `scripts/.instruction-agent-log.json`

**How agents use it:**
| Trigger | Command |
|---|---|
| Session start | `npm run agent:start` |
| After every prompt | Update memory → `npm run agent:end -- --summary "..."` |
| Database/schema touch | `npm run agent:db-touch -- --actor "<agent>" --action "<what>"` |
| Major changes | `npm run agent:push` (5+ files, schema, tests, version, memory update) |

**Major-change push rules:** Never commits `database.sqlite` or `node_modules/`. Target: `origin/main` → `madhurjya-nlp/ne-film-intelligence`.

**Follow-Up:** Optionally wrap `seed`/`migrate`/`ingest` npm scripts to auto-call `db-touch`.  
**Windows note:** Use `npm run agent:end -- "summary text"` (positional) — `--summary` flag can be dropped by npm on Windows.

---

## Session Update — GitHub, Deploy & Database Clarification

**Date:** 2026-06-18  
**Version:** 5.1.0  

**Summary:** Pushed full project to GitHub under `madhurjya-nlp`. Clarified for owner (non-coder): two content layers and two hosting modes.

**GitHub:**
- Repo: https://github.com/madhurjya-nlp/ne-film-intelligence
- Branch: `main`
- Remote: `origin` → `https://github.com/madhurjya-nlp/ne-film-intelligence.git`
- Latest commit: `NE Film Intelligence v5.1 - full platform release`
- `.gitignore` excludes `node_modules/`, `database.sqlite`

**Deployment Model (owner-facing):**
| Mode | URL | What works |
|---|---|---|
| **Netlify (static)** | effortless-speculoos-0dde1a.netlify.app | programs.html, grants, books, events — deep research JS data |
| **localhost + npm start** | http://localhost:3000 | Everything above + live DB explorer, `/api/public/*`, admin |
| **GitHub push alone** | — | Does NOT auto-update Netlify unless Netlify is linked to repo |

**Local Database State (verified 2026-06-18):**
- Published programs: 8 | opportunities: 8 | events: 6
- Intelligence countries: 6 | roadmaps: 24 | relationships: 31
- API `/api/public/home` returns `featured_programs` (Germany MA, MGR Chennai, NOS, etc.)
- "Start the server" UI message = browser not reaching `localhost:3000` (Netlify, file://, or server stopped) — NOT empty database

**Programs-First UX (prior session, now in memory):**
- Nav order: Programs → Explore → Countries first
- `programs.html` live DB section via `programs-live.js`
- `/explore` defaults to `type=program`
- Unified `pub-header` / `pub-footer` on all public pages
- Grants demoted to reference banner

**Render / Production Notes:**
- Render free tier: spins down after 15min idle; SQLite ephemeral on free — not for persistent DB
- Recommendation: Netlify for public static site; `npm start` locally for full DB until paid host

**Follow-Up:**
- Owner to connect Netlify → GitHub repo for auto-deploy on push
- Phase 5.2: seed books table, Render deploy, fix misleading empty-state copy when server is running

---

## Session Update — Drift Report (Phase 5.1 Pre-Run)

**Date:** 2026-06-18  
**Version:** 5.0.0 → 5.1.0  

**Drift Findings (memory vs repository):**

| Item | AGENT_MEMORY | Repository (actual) | Resolution |
|---|---|---|---|
| Version | 5.0.0 | package.json 5.0.0 | Bump to 5.1.0 in Phase 5.1 |
| Project name | CineEduAssan (CEA) | Still CineEduAssan in HTML/JS | Rebrand to NE Film Intelligence |
| Primary focus | grants/loans/paths | Programs-first pivot applied (live DB, explore default, nav order) | Memory corrected |
| Mobile nav | "hamburger not yet added" | `public-shell.js` has mobile toggle + panel | Memory corrected |
| Unified footer | Not documented | `pub-footer` injected via public-shell.js | Memory corrected |
| User Phase 5.1 spec | Says v4.0.0 | Repo is v5.0.0 post design migration | Spec version stale; repo authoritative |
| Tests | 40 total | 40/40 passing | Confirmed |
| Architecture | All phases stable | DB, ingestion, intelligence, public layer intact | No schema/API drift |

**Corrections applied before Phase 5.1 implementation:** snapshot table, primary interest, phase label, drift table above.

---

## Session Update — Phase 5.1 Complete

**Date:** 2026-06-18  
**Version:** 5.1.0  
**Summary:** Rebranded to **NE Film Intelligence (NEFI)**. Added fluid typography tokens, editorial motion system, scroll engine, optional UI sounds, books affiliate-ready schema, and 10 additive ingestion sources across acting/screenwriting/theatre/video-editing/documentary. No API/route/architecture changes.

**Typography System:**
- `css/design-tokens-v3.css` — fluid `--h1` through `--caption` clamps
- Imported into `design-system-v2.css`; hero/page titles use token scale
- Overlap fixes: hero stats static below 1100px; `min-height: auto` on mobile; `max-width` guards on hero h1

**Motion Features:**
- `css/motion-system.css` — card drop (250ms), stamp slam, button press (6px shadow physics), search click, roadmap track fill, document drop (300ms)
- `js/motion-controller.js` — IntersectionObserver, one-shot animations, roadmap progress
- `js/scroll-engine.js` — staggered reveals, section activation (no scroll listeners)

**Sound Features:**
- `js/sound-engine.js` — OFF by default; `localStorage` key `nefi_ui_sounds`
- `public/audio/` — tap, card-drop, stamp, toggle WAV (volume 0.15)
- Settings panel bottom-left: "UI Sounds" toggle

**Data Expansion (additive only):**
- `sources.json` +10 sources: RADA, LAMDA, Sundance Writers, TorinoFilmLab, Series Mania, Drama Centre, ACE editing, IDFA Academy, Docedge, Hot Docs Labs, Documentary Campus
- Categories: acting, screenwriting, theatre, video-editing, documentary

**Books Ecosystem:**
- Tables: `books`, `book_external_links` (migration)
- Validation: `bookSchema`, `bookExternalLinkSchema` — types: publisher, amazon, archive, open_access, goodreads
- `data/books.js` extended with `external_links`; legacy `link` preserved
- `app.js` renders links priority: Open Access → Publisher → Amazon → Goodreads

**Accessibility:**
- `prefers-reduced-motion` bypasses all motion classes
- `html.nefi-reduced-motion` class hook for manual override
- Focus-visible preserved; ARIA on sound settings + roadmap track
- Sounds off by default; explicit opt-in

**Performance Notes:**
- No GSAP/Framer/Lottie — CSS transforms + keyframes + IntersectionObserver only
- Audio preloaded lazily; clone-on-play avoids overlap glitches
- Target 60fps on transforms; scroll uses observers not listeners

**Files Changed:**
- New: `css/design-tokens-v3.css`, `css/motion-system.css`, `js/motion-controller.js`, `js/scroll-engine.js`, `js/sound-engine.js`, `scripts/generate-audio.js`, `public/audio/*.wav`, `tests/phase51.test.js`
- Updated: `design-system-v2.css`, `public-shell.js`, `public-roadmap-detail.js`, `public-list.js`, `app.js`, `data/books.js`, `sources.json`, `migrate.js`, `validation.js`, `seo.js`, `package.json`, `index.html`, all HTML titles, `server/routes/pages.js`, `server/index.js`

**New Tests:** 13 Phase 5.1 tests (**53 total**, all passing)

**Follow-Up Tasks (Phase 5.2):**
- Seed `books` table from static `data/books.js` via sync script
- Manual reduced-motion toggle in settings panel
- Stamp component on verified DB cards in admin moderation
- Production Express deploy for live NEFI intelligence
- PWA offline shell for programs research

---

## Session Update (Phase 5 — prior)

**Date:** 2026-06-18  
**Version:** 5.0.0
**Summary:** Phase 5 Neo-Brutalist Design System Migration — transformed CineEduAssan visual layer to bold academic neo-brutalism. Created `design-system-v2.css` as single CSS source of truth. Migrated homepage, all public intelligence pages, legacy content pages, and admin console. No database, API, service, or business logic changes.

**Drift Findings (pre-run):**
- AGENT_MEMORY v4.0.0 matched repository (public pages, 33 tests, services intact)
- Memory "Next Priority" listed PWA/personalization — user Phase 5 spec is design migration (corrected)
- No schema or API drift

**Design System:**
- File: `css/design-system-v2.css` — tokens, typography, spacing, borders, shadows, layout, components, pub layer, homepage, admin, legacy compat
- Colors: Paper #F5F1E8, Black #111, Accent Yellow #FFD400, Red #FF4D4D, Blue #4EA3FF
- Typography: Space Grotesk 700/800 headings, Inter body, Courier Prime metadata
- Spacing: 4px base scale (4–96px)
- Borders: 4px solid black; radius 0–4px max
- Shadows: 4px/8px/12px hard black offsets
- Max width: 1440px; 12-column grid

**Components Created:**
- Buttons: `.nb-btn`, `--primary`, `--secondary`, `--danger`, `--ghost`
- Cards: `.nb-card--roadmap`, `--country`, `--opportunity`, `--report`, `--metric`
- Inputs: `.nb-input`, `.nb-select`, `.nb-checkbox`, `.nb-radio`
- Tables: `.nb-table`
- Badges: `.nb-badge--verified`, `--scholarship`, `--online`, `--hybrid`, `--country`
- Alerts: `.nb-alert--success`, `--warning`, `--error`, `--info`
- Layout: `.grid-12`, `.explore-layout` (sidebar filters), `.report-layout` (sticky TOC)

**CSS Architecture:**
- Single source: `design-system-v2.css` (all pages consume this only)
- `public-intelligence.css` deprecated → `@import` shim for backward compat
- `design-system.css` retained on disk but no longer linked
- Legacy CSS variable aliases preserved for `app.js` / `admin.js` compatibility

**Pages Migrated:**
- `index.html` — brutalist hero, search bar, live intel hub (inline styles removed)
- `pages/roadmaps.html`, `calendar.html`, `countries.html`, `explore.html`, `reports.html`, `relationships.html`, `search.html`, `404.html`
- `programs.html`, `grants.html`, `books.html`, `events.html` (legacy content)
- `admin.html` — unified pub header + brutalist admin components
- SSR detail pages via `seo.js` → v2 CSS + Inter font

**Accessibility Improvements:**
- `:focus-visible` 3px blue outline on all interactive elements
- `aria-current="page"` on active nav links
- `aria-label` preserved on filters, search, pagination, milestone lists
- `role="status"` + `aria-live="polite"` on loading states
- `prefers-reduced-motion` disables ticker animation and transitions
- Sufficient contrast: black on paper/white, yellow accent blocks

**Known Limitations:**
- Admin retains some inline `<style>` overrides (functional, not yet fully extracted to v2)
- Legacy `app.js` bento renderers use old class names mapped via v2 compat layer
- Mobile nav hidden on small screens (hamburger menu not yet added)
- `design-system.css` file still exists (orphaned; safe to archive in Phase 6)

**Files Changed:**
- `css/design-system-v2.css` (new — ~700 lines, single source of truth)
- `css/public-intelligence.css` (shim import)
- `js/public-shell.js`, `public-home.js`, `public-list.js`, `public-roadmap-detail.js`, `public-country-detail.js`, `public-report-detail.js` (markup/classes only)
- `index.html`, `admin.html`, all `pages/*.html`, legacy HTML pages
- `server/utils/seo.js` (CSS/font links only)
- `tests/design.test.js` (new — 7 tests)
- `package.json` — v5.0.0

**Design Changes:**
- Warm paper → high-contrast paper + black borders + hard shadows
- Glass/blur headers → solid white sticky header with yellow active states
- Soft gold aesthetic → bold yellow/red/blue accent system
- Explorer → sidebar filter panel + dense result grid
- Reports → editorial layout with sticky table of contents
- Countries → profile cards for cost/visa/scholarship sections

**New Tests:** 7 Phase 5 design tests (40 total across all phases)

**Follow-Up Tasks:**
- Add mobile hamburger navigation
- Extract remaining admin inline styles to v2
- Archive `design-system.css`
- Phase 6: PWA, personalization, production Express deploy

---

## Session Update (Phase 4 — prior)

**Date:** 2026-06-18  
**Version:** 4.0.0  
**Summary:** Phase 4 Public Intelligence Layer — exposed all Phase 3 intelligence to filmmakers via clean URLs. Public site is now the primary research interface; admin is secondary. No duplicate data sources — all pages project existing DB tables.

**Drift Findings (pre-run):**
- AGENT_MEMORY at v3.0.0 matched Phase 3 backend; no public pages existed (expected pre-Phase 4)
- `countryService.js` seed already sets `publication_status: 'published'` on create/update
- No schema drift detected

**Files Changed:**
- `server/services/publicService.js` — public projections (published/verified filters), homepage, sitemap (new)
- `server/services/explorerService.js` — paginated explore with URL-persistable filters (new)
- `server/services/searchService.js` — unified server-side search across 6 entity types (new)
- `server/routes/public.js` — `/api/public/*` endpoints (new)
- `server/routes/pages.js` — clean URLs, SEO detail pages, sitemap.xml, robots.txt (new)
- `server/utils/seo.js` — `renderPublicPage()` with meta, canonical, JSON-LD (new)
- `server/index.js` — mount public API + pages router before static
- `server/db/db.js` — WAL mode + busy_timeout for concurrent test stability
- `css/public-intelligence.css` — public layer design extensions (new)
- `js/public-api.js`, `public-shell.js`, `public-list.js`, `public-explore.js`, `public-relationships.js`, `public-search.js`, `public-home.js` (new)
- `js/public-roadmap-detail.js`, `public-country-detail.js`, `public-report-detail.js` (new)
- `pages/roadmaps.html`, `calendar.html`, `countries.html`, `explore.html`, `reports.html`, `relationships.html`, `search.html`, `404.html` (new)
- `index.html` — research discovery portal: search bar, live intel sections, public nav
- `tests/public.test.js` — 12 Phase 4 tests (new)
- `package.json` — v4.0.0, sequential test runner

**Routes Added:**
- Public API: `/api/public/home`, `/roadmaps`, `/roadmaps/:slug`, `/calendar`, `/countries`, `/countries/:slug`, `/explore`, `/reports`, `/reports/:slug`, `/relationships`, `/relationships/:type/:id`, `/search`, `/sitemap-data`
- Clean URLs: `/`, `/roadmaps`, `/roadmaps/:slug`, `/calendar`, `/countries`, `/countries/:slug`, `/explore`, `/reports`, `/reports/:slug`, `/relationships`, `/search`, `/sitemap.xml`, `/robots.txt`

**Components Added:**
- `PublicService`, `ExplorerService`, `SearchService` (server)
- `PubUI` card/empty/loading helpers, public header nav (client)
- Page shells: roadmaps, calendar, countries, explore, reports, relationships, search

**New Queries:**
- Published-only filters: `verification_status='verified' AND publication_status='published'` (entities); `publication_status='published'` (roadmaps, countries, reports)
- Explorer: multi-table paginated query with budget/country/format/scholarship/deadline_status filters
- Search: LIKE-based fuzzy search across programs, opportunities, institutes, countries, reports, roadmaps
- Homepage: aggregated sections from existing services (no duplicate logic)

**New Tests:** 12 Phase 4 tests (33 total across all phases)

**Public Pages Added:**
- `/roadmaps` — listing + category search + featured pathways
- `/roadmaps/:slug` — milestones, prerequisites, resources, related countries/opportunities (SSR + SEO)
- `/calendar` — Upcoming, Closing Soon, This Month, Recently Added, Expired views
- `/countries` — search, region, affordability filters
- `/countries/:slug` — cost/visa/scholarship profiles, related programs (SSR + SEO)
- `/explore` — advanced filters, pagination, URL persistence
- `/relationships` — lightweight pathway explorer with breadcrumb drill-down
- `/reports` — published report archive
- `/reports/:slug` — report detail with sections (SSR + SEO)
- `/search` — unified search with categorized results
- `/` (homepage) — live intel hub sections from `/api/public/home`

**Known Limitations:**
- Static Netlify deploy serves HTML only; live intelligence requires `npm start` (Express server)
- Legacy static pages (programs.html, grants.html, etc.) coexist with DB-driven pages — not yet migrated
- Explorer combines results from 3 tables per page (not single unified sort across types)
- Relationship viewer shows edge chains, not a graph canvas (by design — lightweight)
- Search uses SQL LIKE, not full-text index (adequate for current scale)
- Roadmap related countries/opportunities are broad queries, not roadmap-specific graph links yet

**Follow-Up Tasks:**
- Deploy Express server (Railway/Render/Fly) for production public intelligence
- Link roadmap step resources to actual entity IDs in seed config
- Migrate legacy static pages to DB projections or deprecate gracefully
- Scheduled cron for calendar sync + report generation + publish
- Phase 5: personalized recommendations, offline PWA, public read-only API key tier

---

## Session Update (Phase 3 — prior)

**Date:** 2026-06-18  
**Version:** 3.0.0  
**Summary:** Phase 3 Research Intelligence Layer — transformed database into pathway discovery platform with roadmaps, deadline calendar, query-generated reports, country intelligence, entity relationships, and live dashboard.

**Files Changed:**
- `server/db/schema.sql` — 11 new Phase 3 tables
- `server/db/migrate.js` — Phase 3 table migrations
- `server/db/seed-intelligence.js` — seeds roadmaps, countries, calendar, relationships (new)
- `server/config/roadmaps.json` — 6 filmmaker pathways (new)
- `server/config/countries.json` — 6 country profiles (new)
- `server/services/dateParser.js` — deadline parsing/normalization (new)
- `server/services/roadmapService.js` — roadmap engine (new)
- `server/services/calendarService.js` — opportunity calendar (new)
- `server/services/reportService.js` — query-based report generator (new)
- `server/services/countryService.js` — country intelligence (new)
- `server/services/relationshipService.js` — knowledge graph (new)
- `server/services/dashboardService.js` — research overview metrics (new)
- `server/routes/intelligence.js` — `/api/intelligence/*` routes (new)
- `server/index.js` — mount intelligence router
- `admin.html` — Research Overview, Roadmaps, Reports, Countries, Knowledge Graph tabs
- `js/admin.js` — intelligence tab handlers + dashboard metrics
- `tests/intelligence.test.js` — Phase 3 test suite (new)
- `package.json` — v3.0.0, intelligence:seed, calendar:sync scripts

**Schema Changes:** Extended schema with roadmaps, roadmap_steps, roadmap_resources, calendar_events, reports, report_sections, countries, country_cost_profiles, country_visa_notes, country_scholarship_notes, entity_relationships

**New Modules:** Roadmap Engine, Opportunity Calendar, Research Report Generator, Country Knowledge Model, Entity Relationships, Research Dashboard

**New Relationships:** country→opportunity (located_in), institute→program (offers), source→entity (administers) — auto-linked via `RelationshipService.autoLinkFromEntities()`

**New Routes:** `/api/intelligence/dashboard`, `/roadmaps`, `/calendar`, `/reports`, `/countries`, `/graph`, `/relationships`, `/seed`

**New Tests:** 8 Phase 3 tests (21 total across all phases)

**Follow-Up Tasks:**
- Link roadmap step resources to actual program/opportunity/event IDs
- Build public-facing roadmap browser page
- Calendar views on static site (Upcoming, Closing Soon)
- Scheduled cron for calendar sync + report generation
- Phase 4: personalized pathway recommendations, offline PWA, public API

---

## Session Update (Phase 2 — prior)

**Date:** 2026-06-18  
**Files Changed:**
- `server/db/schema.sql` — extended `sources` table; added `sync_logs`, `source_record_hashes`
- `server/db/migrate.js` — incremental Phase 2 migrations (new)
- `server/db/db.js` — migration-before-schema init order
- `server/config/sources.json` — 5 configurable initial sources (new)
- `server/ingestion/trustModel.js` — trust scoring + verification rules (new)
- `server/ingestion/normalizer.js` — normalize + content hash (new)
- `server/ingestion/ingestionService.js` — full pipeline orchestrator (new)
- `server/ingestion/parsers/BaseParser.js` — adapter base (new)
- `server/ingestion/parsers/DAADParser.js` — Germany programs (new)
- `server/ingestion/parsers/FestivalParser.js` — festivals/markets (new)
- `server/ingestion/parsers/UniversityParser.js` — universities/scholarships (new)
- `server/ingestion/parsers/index.js` — parser registry (new)
- `server/services/sourceRegistryService.js` — registry + sync log CRUD (new)
- `server/services/validation.js` — `ingestionSourceSchema`
- `server/routes/ingestion.js` — ingestion API routes (new)
- `server/index.js` — mount `/api/ingestion`
- `admin.html` — Sources, Sync History, Pending Discoveries tabs + Run Sync button
- `js/admin.js` — ingestion tab handlers
- `tests/ingestion.test.js` — Phase 2 test suite (new)
- `package.json` — v2.3.0, cheerio, migrate/sources:seed/ingest scripts

**Reason:** Phase 2 deliverable — trusted opportunity ingestion pipeline extending existing DB/API/admin systems.

**Implementation Notes:**
- Pipeline: Source Registry → Fetch → Parse → Normalize → Validate → Deduplicate → Review Queue → Approval → Static Syndication
- Sources loaded from `server/config/sources.json` (not hardcoded in business logic)
- Trust 100 = auto-verify (never auto-publish; `publication_status` always `draft`)
- Trust 95/85/0 = pending or needs_review
- Incremental sync via `source_record_hashes.content_hash`
- Parsers are pluggable adapters via `server/ingestion/parsers/index.js` registry
- Uses native `fetch` + `cheerio` (no Puppeteer)
- Initial sources: NOS Tribal, NFDC Film Bazaar, DAAD, Berlinale Talents, MGR Chennai

**Follow-up Tasks:**
- Run `npm start` + admin Run Sync on live network (some sources may fail fetch behind firewalls)
- Moderate Pending Discoveries tab entries
- `npm run sync` to syndicate verified records
- Phase 3: scheduled cron sync, richer parsers, submission portal, continent research automation

---

## 📡 Phase 6 Coverage & Community Engine Architecture

### Coverage Dashboard
Mounted at `/admin/coverage` (admin page \`pages/admin-coverage.html\`), fetching metrics from `/api/coverage/dashboard` and source health details from `/api/sources/health`. Calculates coverage scores per category, detects priority gap alerts (less than 10 programs, 5 opportunities, or no recent updates), lists missing target countries (Germany, France, UK, Japan, South Korea, Canada, Australia), and categorizes sources and roadmaps. Also includes the Blog Content Gap alerts, flagging any category without matching blog posts (e.g. "No Screenwriting Guides").

### Contributor System
Community portal located at `/contribute` (public page \`pages/contribute.html\`), utilizing a brutalist form mapping to `contributor_submissions` table. Administator queue under Contributor Submissions nav button in `/admin.html` triggers approve/reject API requests (\`POST /api/contributor/submissions/:id/moderate\`). Approving promotes entries into target databases (\`programs\`, \`opportunities\`, \`events\`, \`books\`) with "Contributed by: [Name]" attribution.

### Source Discovery
Scanner pipeline mounted at `/api/candidates/scan` and `/api/candidates/:id/moderate`. Triggers in sources list page (\`/admin.html\`) allow scanning known sources to parse external links into `source_candidates` (E2). Automatic trust score mapping (E3) evaluates candidate properties (University/Government domains get 100, Festival gets 95, Org gets 85, Unknown gets 0) prior to promotion to the Source Registry.

### Freshness Scoring
Classifies registry sources in health metrics into four freshness bands:
- Updated < 30 days: **Fresh**
- 30–90 days: **Aging**
- 90–180 days: **Stale**
- 180+ days: **Needs Verification**

### Dead Link Monitoring
Allows administrators to trigger HTTP link checks (\`POST /api/sources/:id/check-link\`), logging response status code and speed into `dead_link_checks` table. Automatically flags status codes of \`404\`, \`500+\`, or timeouts (\`0\`) as "Dead Link" status in dashboards.

### Newsletter Improvements
Redesigned standard newsletters into a Neo-Brutalist slide-up panel injected globally via \`js/public-shell.js\`. Triggers on:
1. 60 seconds elapsed.
2. 40% scroll depth.
3. Article completion (85%+ scroll depth on blog details).
Uses cookie suppressions preventing displaying more than once every 7 days, or permanently on clicking "Dismiss forever".

### New Categories
Added 10 categories to taxonomy registry:
- Acting
- Theatre
- Screenwriting
- Editing
- Documentary
- Animation
- Film Criticism
- Producing
- Cinematography
- Sound Design

---

## 🔄 Phase 2 Ingestion Architecture

### Pipeline Flow
```
sources.json / DB registry
  → SyncRunner (POST /api/ingestion/sync)
  → Parser adapter (daad | festival | university | generic)
  → Normalizer + content hash
  → Zod validation
  → Deduplication (title + website_url)
  → Trust model → verification_status
  → Entity insert/update (programs | opportunities | events)
  → review_queue log
  → sync_logs metrics
```

### New Tables
| Table | Purpose |
|---|---|
| `sources` (extended) | Ingestion source registry with trust_level, parser_type, crawl_frequency, last_run_at |
| `sync_logs` | Per-run history: found/inserted/updated/rejected/errors/duration |
| `source_record_hashes` | Incremental sync — skip unchanged records |

### New API Endpoints (`/api/ingestion/`)
| Method | Path | Purpose |
|---|---|---|
| GET | `/sources` | List registry |
| POST | `/sources` | Add source |
| PUT | `/sources/:id` | Update source |
| POST | `/sources/seed` | Load from sources.json |
| POST | `/sync` | Run all active sources |
| POST | `/sync/:sourceId` | Run single source |
| GET | `/sync-logs` | Sync history |
| GET | `/discoveries` | Pending ingested records |
| GET | `/parsers` | Available parser types |
| GET | `/trust-presets` | Trust level definitions |

### Trust Model
| Source Type | Score | Verification | Publication |
|---|---|---|---|
| Official University | 100 | auto-verified | draft (manual publish) |
| Government Scholarship | 100 | auto-verified | draft |
| Film Festival Official | 95 | pending | draft |
| Industry Organization | 85 | pending | draft |
| Unknown | 0 | needs_review | draft |

### NPM Scripts (Phase 2)
- `npm run migrate` — apply DB migrations
- `npm run sources:seed` — seed sources from config
- `npm run ingest` — CLI run all active source syncs
- `npm test` — 40 tests (Phase 1 + 2 + 3 + 4 + 5)

---

## 🌐 Phase 4 Public Intelligence Architecture

### Rule
No new source of truth. All public pages read from existing tables via `PublicService`, `ExplorerService`, `SearchService`.

### Public API (`/api/public/`)
| Method | Path | Purpose |
|---|---|---|
| GET | `/home` | Homepage aggregated sections |
| GET | `/roadmaps` | Published roadmap listing |
| GET | `/roadmaps/:slug` | Roadmap with steps + resources |
| GET | `/calendar?view=` | Calendar with view filter + countdown |
| GET | `/countries` | Country listing with filters |
| GET | `/countries/:slug` | Full country intelligence profile |
| GET | `/explore` | Paginated multi-entity explorer |
| GET | `/reports` | Published report archive |
| GET | `/reports/:slug` | Report with sections |
| GET | `/relationships` | Knowledge graph edges (full or rooted) |
| GET | `/relationships/:type/:id` | Entity detail + breadcrumbs |
| GET | `/search?q=` | Unified categorized search |

### Clean URL Routes (pages router)
`/roadmaps`, `/calendar`, `/countries`, `/explore`, `/reports`, `/relationships`, `/search` + SSR detail pages for roadmaps/countries/reports + `/sitemap.xml` + `/robots.txt`

### Publication Filters
- Entities (programs, opportunities, institutes, events): `verified` + `published`
- Intelligence entities (roadmaps, countries, reports): `published`

### Frontend Assets
`css/public-intelligence.css` + `js/public-*.js` — warm paper aesthetic, double-bezel cards, Space Grotesk + Courier Prime

---

## 🧠 Phase 3 Research Intelligence Architecture

### Modules
| Module | Tables | Purpose |
|---|---|---|
| Roadmap Engine | `roadmaps`, `roadmap_steps`, `roadmap_resources` | Structured filmmaker pathways with milestones, prerequisites, linked resources |
| Opportunity Calendar | `calendar_events` | Deadline extraction, normalization, status classification |
| Report Generator | `reports`, `report_sections` | Query-based summaries (not AI-generated) |
| Country Intelligence | `countries`, `country_cost_profiles`, `country_visa_notes`, `country_scholarship_notes` | Structured country knowledge |
| Knowledge Graph | `entity_relationships` | Lightweight relational links between entities |
| Research Dashboard | (queries only) | Live metrics from database — no fake numbers |

### Seeded Roadmaps (6)
Study Abroad, Become a Film Editor, Documentary Filmmaker, Film Funding, Festival Strategy, Low Budget Filmmaker

### Seeded Countries (6)
Germany, France, Japan, South Korea, UK, Canada

### Calendar Views
`upcoming` | `closing_soon` (≤30 days) | `expired` | `this_month` | `all`

### Report Types
`new_opportunities` | `scholarships_added` | `festivals_opening` | `country_update` | `online_programs`

### API Endpoints (`/api/intelligence/`)
| Method | Path | Purpose |
|---|---|---|
| GET | `/dashboard` | Research overview metrics |
| GET/POST | `/roadmaps` | List/create roadmaps |
| GET | `/roadmaps/:id` | Roadmap with steps + resources |
| GET | `/calendar?view=` | Calendar with view filter |
| POST | `/calendar/sync` | Sync deadlines from entities |
| GET/POST | `/reports` | List/generate reports |
| POST | `/reports/generate` | Generate query-based report |
| POST | `/reports/:id/publish` | Publish report |
| GET/POST | `/countries` | Country intelligence |
| GET | `/graph` | Knowledge graph (full or rooted) |
| POST | `/relationships/auto-link` | Auto-link entities |
| POST | `/seed` | Seed intelligence data |

### Relationship Types
`offers`, `funds`, `hosts`, `located_in`, `requires`, `leads_to`, `partners_with`, `administers`

### NPM Scripts (Phase 3)
- `npm run intelligence:seed` — seed roadmaps, countries, calendar, relationships
- `npm run calendar:sync` — sync calendar from entity deadlines

---

## 📊 What Exists in v4 Guide (Inventory)

### Countries/Regions Currently Covered
| Region | Countries | Status |
|---|---|---|
| Asia | Turkey/N.Cyprus, Malaysia | Sparse — needs expansion |
| Africa | South Africa | Sparse — needs expansion |
| Europe | Czech Republic (FAMU), UK (SOAS), Belgium (KU Leuven), Austria (FH Burgenland) | Partial |
| Online/Global | Franklin University, Teesside, SUU (Southern Utah) | Partial |
| India | Green Hub (Nagaland), NFDC, AIPP, Himalayan Story Lab | Good start |

### Stats in v4 Guide
- Programs listed: ~80+ (mix of quality — some very well researched, some thin)
- Grants listed: ~50+
- Events listed: ~40+
- Books listed: ~50+
- Career paths: ~15+

### Pages Now Built (from research)
| Page | Status | Content |
|------|--------|---------|
| programs.html | ✅ Complete | Erasmus Mundus, govt scholarships, 6 regions, online degrees, tech partnerships, timeline |
| grants.html | ✅ Complete | Top 10 ranking, 20+ intl grants, 6 ST-specific scholarships, emerging grants, govt courses, calendar |
| books.html | ✅ Complete | 8 categories, 30+ books with Archive.org/Z-Library links, NE India relevance per book |
| events.html | ✅ Complete | 9 intl labs, 5 co-production markets, 4 online communities, 6 India events, 3 pitch forums |

### What's Completely Missing
- [ ] **Asia:** Japan, South Korea, Hong Kong, Thailand, Philippines, Sri Lanka, Bangladesh, Indonesia
- [ ] **Europe:** Poland, Portugal, Spain, Italy, Netherlands, Denmark, Sweden, Norway, Finland, Germany, France (beyond token mentions)
- [ ] **North America:** Canada film schools, Mexico, full US landscape beyond online
- [ ] **South America:** Brazil (Globo, animation), Argentina (Buenos Aires film scene), Colombia
- [ ] **Oceania:** Australia (AFTRS, VCA), New Zealand (Toi Whakaari, Weta connections)
- [ ] **Africa:** Nigeria (Nollywood), Kenya, Ghana, Ethiopia (growing scenes)
- [ ] **Business & Commerce:** Entire section missing
- [ ] **Research Papers:** No academic citations in v4
- [ ] **Open-source books:** Have list but no verified open-access links
- [ ] **Flowcharts:** No decision flowcharts yet
- [ ] **Course structures:** No curriculum breakdowns

---

## 🔗 Dead Links Found
> Append here when discovered. Format: `[date] | [URL] | [which file] | [replacement if found]`

- 2026-06-18 | `#` (Himalayan Story Lab) | guide/media_programs_v4.html | NO URL FOUND — needs research
- 2026-06-18 | Various "Apply →" buttons link to homepage only, not application pages — needs deep linking

## 🛠️ Agent-Browser Surf Notes / Issues
- 2026-06-18 | HBF page (iffr.com/en/hubert-bals-fund) via npx agent-browser | Hit Cloudflare "Just a moment..." interstitial + connection timeout (os error 10060) after wait --load networkidle. Snapshot failed. | Used web_search + research/grants-research.md as fallback; HBF details already in grants.js with NE notes. Agent-browser worked for core load + other opens (NOS). Prefer direct tools or --headed for protected sites in future.

---

## 📚 Verified Open-Access Resources (Running List)
> Grow this list as research happens. Each agent adds their finds here.

### Film Theory / History
- **"Film as Art" by Rudolf Arnheim (1957)** — Archive.org: [https://archive.org/details/filmasart00arnh](https://archive.org/details/filmasart00arnh) ✅
- **"Theory of Film" by Siegfried Kracauer** — Available via Internet Archive ✅
- **"What is Cinema?" by André Bazin (Vol 1 & 2)** — Check university library open access
- **"The Film Experience" (various editions)** — Check JSTOR Open

### Documentary
- **"Documentary: A History of the Non-Fiction Film" by Erik Barnouw** — Archive.org
- **"New Documentary" by Stella Bruzzi** — Check ResearchGate

### Business / Production Economics
- **Screen Australia reports** — screenaustralia.gov.au (free, authoritative) ✅
- **BFI Statistical Yearbook** — bfi.org.uk (free, UK market data) ✅
- **FICCI-EY Media Report (India)** — ey.com (partial free access) ✅
- **Sundance Institute Research** — sundance.org/research (free) ✅

### Academic Databases (Open Access)
- JSTOR Open: jstor.org/open ✅
- OpenAlex: openalex.org ✅ (best for film/media papers)
- DOAB: doabooks.org ✅
- HathiTrust: hathitrust.org ✅ (older books, excellent)
- BASE: base-search.net ✅

---

## 🗺️ Continent Research Status
| Continent | Research File | Status | Last Agent | Last Updated |
|---|---|---|---|---|
| Asia | research/continents/asia.md | 🔴 NOT STARTED | — | — |
| Europe | research/continents/europe.md | 🔴 NOT STARTED | — | — |
| North America | research/continents/north-america.md | 🔴 NOT STARTED | — | — |
| South America | research/continents/south-america.md | 🔴 NOT STARTED | — | — |
| Africa | research/continents/africa.md | 🔴 NOT STARTED | — | — |
| Oceania | research/continents/oceania.md | 🔴 NOT STARTED | — | — |

---

## 📝 Research Findings Log
> Agents append discoveries here as they research. Format: date | finding | source | relevance

### 2026-06-18 — Updated Research Phase (Skills Inspection + Expanded Research)
- Inspected full system skills via list_dir + `grok inspect` (23 skills: docx/xlsx for research docs, agent-browser for deep research, design/implement/review for later site work, find-skills, help, create-skill, etc. + bundled agents/personas). User-guide 08-skills.md reviewed. No site HTML built per instruction.
- Performed targeted web research on: Assam/NE cinema history & current scene (Joymoti 1935, Jyoti Chitraban, DBHRGFTI, festivals, indigenous representation challenges/opportunities); NOS 2026 deadlines/logistics; more universities & accurate fees (Germany tuition-free public, expanded Poland/Georgia/Hungary, explicit local NE options); ground realities (GAU flights, Guwahati attestation, travel from Lakhimpur, ST proofs).
- Created deliverables (research/ folder):
  - Film_Education_Programs_Categorized_0-9Lacs_Assam_NE.xlsx (categorized tables + band strategy + Assam-NE notes)
  - Cultural_Context_Assam_NE_Cinema_Media.docx (full article-style)
  - Pathways_Abroad_Assam_NE_Ground_Reality.docx (practical steps, NOS, visas, logistics)
- Updated programs-research.md with new frontmatter, cultural summary section, band highlights, notes on added unis and ground reality. 
- Next per request: Do not build site. Use these docs for decisions. Can iterate research or later use design/implement skills when ready for site update.

### 2026-06-18 — Agent-Browser Surf + New Data (0-3L, Grants, Collab Paths)
- Started processes per request: agent-browser core loaded + surf commands executed on key portals (NOS, grants pages).
- Web + targeted: MGR Chennai (0-3L priority gem), German public film MA (near-zero tuition), IDFA Bertha (Global South docs funding), Tasveer, Reborn India (₹1L), NFDC/Film Bazaar (co-pro + grants + cash), more labs.
- Collaboration paths highlighted: co-pro markets (Film Bazaar, Torino, Asian Cinema Fund), labs (Berlinale Talents, IDFA).
- All new items added to data/*.js with full locality/assam/st details + links.
- Rendered sleekly via existing adapters (no viewer disruption).

### 2026-06-18 — Project Initialization (original)
- Created project scaffolding (AGENT_INSTRUCTIONS.md, AGENT_MEMORY.md, RESEARCH_PLAN.md, index.html)
- Inventoried v4 guide: identified major geographical and thematic gaps
- Identified key missing sections: Business & Commerce, Research Papers, Continent deep-dives
- Confirmed AGENT_INSTRUCTIONS.md contains full research protocol for all sections
- **Priority research sequence established:** Asia → Europe → Oceania → Americas → Africa → Business

### 2026-06-18 11:21 — Site Page Building
- Created **programs.html** (39KB) — comprehensive page with Erasmus Mundus programs, government scholarships, region-by-region guide (Baltic, Caucasus, Iberia, Central Europe, SE Asia, Africa, Cuba), India affordable online degrees, documentary-specific programs, tech partnerships, application timeline
- Created **grants.html** (29KB) — Top 10 ranking for ST profile, international grants, ST-specific scholarships, emerging/non-traditional grants, government+tech partnership courses, application calendar with deadlines
- Created **books.html** (38KB) — 8 categories (Film Theory, Screenwriting, Documentary, Cinematography, Design, Business, Content Creation, Indian Cinema), direct Archive.org links, Z-Library search links, access key legend, NE India relevance notes per book
- Created **events.html** (33KB) — International labs (Berlinale, Torino, Sundance, Jerusalem, BIFF, TIFF, Rotterdam, Cannes, EICTV), co-production markets, online communities (Stage 32, Sundance Collab, Black List, Discord), India-specific festivals, pitch forums, immediate action timeline
- All pages use the existing design-system.css and app.js for consistent dark archive aesthetic
- Verified all 4 pages load correctly (no syntax errors)

---

## 🧩 Known Context About the Owner
> Use this to make research recommendations more relevant

- Based in **North Lakhimpur, Assam** (not a metro — distance/online learning is highly relevant)
- Has **ST (Scheduled Tribe) status** — eligible for reserved quotas, special scholarships
- Runs **GOSO/Goat Socials** (creative agency) and **Public Signal** (news app)
- Makes **documentaries** — has shot for Doordarshan, national/regional broadcasters
- Interested in **funk-influenced music**, **Bihu**, **Ojapali**, **Assamese oral traditions**
- Has a short film script called **"Between Rains"** in development
- Budget context: can access ₹0-5L range comfortably; ₹5-15L with scholarship
- Language: fluent English and Assamese; no other foreign languages yet
- Portfolio: drone cinematography, editing, design, documentary work

---

## ⚠️ Things to Be Careful About
- Assamese ≠ Bengali. Any Assamese content must use Assamese script and vocabulary
- Some programs in v4 may have changed fees/deadlines — always verify before citing
- ST scholarship eligibility varies: some only for Indian domestic programs, some for international too
- Exchange rates shift: v4 used $1=₹84, €1=₹90, £1=₹105 — update when doing new research
- NE India has limited reliable internet — any app/site should have offline capability planned

---

## 📋 Session Log
> One entry per agent session. Format: [Date-Time UTC] | [Agent/Tool] | [What was done] | [What's next]

| Date-Time UTC | Agent | Done | Next |
|---|---|---|---|
| 2026-06-18 | Antigravity — Phase 6 | Complete Phase 6 Coverage & Community Engine: category taxonomy, initial sources, admin dashboards, contributor portal, discovery engine, newsletter popup redesign, editorial blog workflow, and 5 new tests (63 tests total, all green). | Phase 6.1: production deployment, personalization and search optimizations |
| 2026-06-18 (latest) | Grok — Phase 5 Design | Neo-brutalist design-system-v2.css; migrated all pages + admin; 40/40 tests pass; zero logic changes. | Phase 6: PWA, personalization, mobile nav, production deploy |
| 2026-06-18 | Grok — Phase 4 Public Layer | Exposed DB intelligence via public pages: roadmaps, calendar, countries, explore, search, SEO; homepage restructured; 33/33 tests pass. | Deploy Express server, Phase 5 personalization + PWA |
| 2026-06-18 | Grok — Phase 3 Intelligence | Built research intelligence layer: roadmaps, calendar, reports, countries, knowledge graph, dashboard; 21/21 tests pass. | Public roadmap pages, entity linking, Phase 4 personalization |
| 2026-06-18 (late) | Grok — Phase 2 Ingestion | Built full ingestion pipeline: source registry, sync logs, parser adapters, trust model, incremental hashes, ingestion API, admin UI extensions; 13/13 tests pass. | Run sync on live network, moderate discoveries, syndicate static |
| 2026-06-18 11:07 UTC | Gemini 3.5 Flash — DB Foundation | Built SQLite database schema with indexes and relations; parsed and seeded 22 records from static files; implemented validation (Zod) and Express server; built admin.html console; added in-memory test runner (100% pass); added sync-static script. | Add web scrapers and external automation in Phase 2 |
| 2026-06-18 | Claude (Anthropic) — Initial Setup | Created project infrastructure: AGENT_INSTRUCTIONS.md, AGENT_MEMORY.md, RESEARCH_PLAN.md, index.html. Inventoried v4 guide. Identified research gaps. | Start Asia continent research file |
| 2026-06-18 11:21:28 | Opencode Assistant | Created all 4 missing subpages: programs.html, grants.html, books.html, events.html using comprehensive research data. Updated AGENT_MEMORY with results. | Next: Create research/continents/ continent files, explore business section |
| 2026-06-18 11:38 | Opencode Assistant | Initialized git repo, committed all files, deployed to Netlify. Live at effortless-speculoos-0dde1a.netlify.app | Verify all pages loading, continue with continent research |
| 2026-06-18 | Grok (xAI) — Agent Processes Start + Data Deepen | Started agent-browser (skills get core + targeted open/snapshot on NOS + IFFR HBF). Used web_search + open for MGR Chennai (₹15k/yr), Germany tuition-free public film MA, IDFA Bertha (€7.5-25k docs Global South), Tasveer (South Asian shorts), Reborn India (₹1L), NFDC grants/Film Bazaar ($5-20k). Wrote clean augmented data/programs.js (fixed dups + 2 new 0-3L: MGR + Germany), grants.js (8 rich entries), books (6), events (6). Verified node --check OK. Updated snapshot + memory. New info now renders sleek via existing bento adapters. | Integrate any further finds; small index polish; redeploy + test live. |

---

### 2026-06-18 — Research Surf + Data Update (Agent-Browser + Web)

- Launched agent-browser process: `npx agent-browser skills get core --full` loaded full core workflows (snapshot-ref loop, open/snapshot/extract for research).
- Surfed: overseas.tribal.gov.in (NOS), IFFR HBF grants page (via automation + web).
- Additional targeted research (web + page): 
  - M.G.R. Govt Film & TV Institute Chennai: 0-3L standout — BVA/UG Diplomas ~₹15k/yr + fees; SC/ST aid; Asia's oldest film institute.
  - Germany public unis: majority €0 tuition + €100-400/sem for English film/media/cinema MA (huge 0-3L win with NOS).
  - Grants: IDFA Bertha Fund (India-eligible, up to €25k prod for docs); Tasveer Film Fund (South Asian); Reborn India Short Film Fund (₹1L direct); NFDC Film Bazaar co-pro grants + feature support.
- Cleaned & extended data seam files. New cards (MGR, Germany, IDFA, Reborn, Tasveer, NFDC etc.) now appear dynamically in bentos with rich Assam/NE details + filters.
- No HTML breakage; render adapters (renderBentoCard, renderGrantCard...) already handle new shapes.
- Palette (white/gold/dark-red paper), guided journey landing, mixed-media art popups remain intact — new data slotted seamlessly.

### 2026-06-18 — Site Implementation Started
- Reviewed new research docs/xlsx via extraction.
- Verified key data: NOS deadline 15 May – 30 June 2026 (5:30 PM, overseas.tribal.gov.in); Sapientia confirmed 550 EUR/yr on program page; DBHRGFTI fees still reference 2019 (low subsidized); Erasmus next cycle Oct 2026.
- Updated programs.html: New hero with bands + NE focus, Cultural Context section (history, DBHRGFTI, challenges/opportunities), Cost Bands grid (0-3/4-6/7-9), Germany public MA card (0 tuition), updated timelines, NOS urgency, Bir Tikendrajit note + DBHRGFTI emphasis, research footer note.
- Updated index.html hero/sub and description for new scope.
- Expanded mentions of Germany, local NE priority, cultural decision-making.
- Updated programs-research.md earlier with summaries.
- No netlify.toml in repo; deployment is likely manual drag-drop or connected git to Netlify. After local changes, re-deploy the folder or push updates.
- Next: User can push to Netlify. Further expansion (full continents md) or more verification on request.

### 2026-06-18 11:38 — Deployment to Netlify
- Initialized git repo and committed all project files
- Deployed site to Netlify (manual drag-drop or CLI)
- **Live URL:** https://effortless-speculoos-0dde1a.netlify.app
- Verified homepage, programs.html, grants.html, books.html, events.html all load correctly
- Site is a fully static HTML/CSS/JS deployment — no build step needed

### 2026-06-18 — Agent Processes Started + New Data Integrated (current)
- Executed "start the processes": read agent-browser/redesign skills, invoked npx agent-browser (core + surf sessions), performed deep targeted research for 0-3L + funds/paths.
- Updated all data modules with fresh verified entries prioritized for Assam/NE/ST profile.
- Data now projects new research into sleek bento cards (expandable rich details with ground reality).
- Slight redesign follow-up: data integration itself is the premium polish (no template feel; locality + leverage preserved).
- Memory updated with phase, logs, snapshot.
- Next manual step: re-deploy folder to Netlify. Test filters/expand on live.

*Memory file initialized: 2026-06-18*  
*This file grows with every agent session — never truncate it*
