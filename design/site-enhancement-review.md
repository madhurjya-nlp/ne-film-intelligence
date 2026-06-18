# Design Document Review: The Film Path — Personal Research Hub Enhancement

### Summary
Needs revision. The document is thorough, specific, and well-structured with strong citations to code and research, but contains gaps in describing the *current* state of the codebase (broken internal links, incomplete filter/search UI integration), overstates "existing patterns" for some JS features, and has a PR Plan with one overly broad step. Several claims about architecture match reality after verification, but assumptions about current navigability and data scope need explicit addressing. With targeted fixes, it would be ready for implementation.

### Issue 1: Background & Current State omits known broken internal links and missing files
- **Severity**: major
- **Section**: Background & Motivation (lines ~25-32)
- **Description**: Document accurately describes the built pages (programs.html, grants.html etc.) and shared CSS/JS, but does not mention that `index.html` (and mobile nav, quick links, hero-adjacent sections) contains multiple hardcoded links to the non-existent `guide/media_programs_v4.html` (8+ occurrences) and `research/continents/*.md` (6 links in continent tracker). Directory listing and code inspection confirm no `guide/` directory and no `research/continents/` subdirectory exist. AGENT_MEMORY.md already flags some dead links but not these. Design's "current state" and "References" sections focus only on present files.
- **Suggestion**: Add a dedicated subsection "Known Technical Debt / Stale References" under Background. Explicitly list the broken guide/ and continents/ links. Either (a) include link cleanup in PR 5 (or a dedicated early PR 0/1 subtask), or (b) document that the enhancement will *not* touch legacy guide references (with rationale). Update design's "Current state" bullet to reference verified file presence.
- **Status**: addressed
- **Response**: Added dedicated "Known Technical Debt / Stale References" subsection under Background & Motivation. Explicitly listed all verified broken `guide/media_programs_v4.html` (8+ occurrences in nav, mobile, cards, quick links, footer) and `research/continents/*.md` (6 continent tracker `.cc` links) with citations from index.html grep/list_dir. Updated "Current state" to reference verified file presence. Added recommendation + rationale in PR 1 (audit) and PR 5 (cleanup or markers) per suggestion. Also referenced AGENT_MEMORY dead links. (Design doc edits: lines ~32-48 in Background.)

### Issue 2: Overstates maturity of existing filter/search UI patterns
- **Severity**: major
- **Section**: Proposed Design (High-Level Architecture, Card Design), API/Interface Changes, PR 2
- **Description**: Design repeatedly cites "Existing JS patterns (`.reveal`, `initAccordions()`, `initFilters()`, `initSearch()`, data attrs)" and says "extend rather than replace." JS code does implement `initFilters()` (searches `.filter-bar` + `.filter-btn[data-filter]` + `[data-category]`) and `initSearch()` (`.search-input[data-target]` + `[data-searchable]`). However, *no* `.filter-bar`, `.filter-btn`, `.search-input`, or `.search-box` markup exists in programs.html, grants.html, events.html, books.html, or index.html (verified via grep across all .html). Only data attrs and `.reveal`/`.accordion` (timeline only) are actively used. Filter logic is "dormant" — design treats it as a live, battle-tested primitive.
- **Suggestion**: Revise language to "Existing JS *infrastructure* and data-attribute conventions (from AGENT_INSTRUCTIONS.md and app.js) will be activated and extended by adding the corresponding filter-bar/search UI markup." Explicitly scope PR 2 to include introducing the first `.filter-bar` + `.search-input` instances (with examples). Add a small "Current UI integration status" note in Background.
- **Status**: addressed
- **Response**: Revised Overview and Background language to "JS infrastructure and data-attribute conventions ... will be activated (via addition of corresponding markup)" + explicit "dormant" note. Added "Current UI integration status" bullet in Background detailing absence of .filter-bar/.search-input markup (verified grep) vs. CSS/JS presence. Scoped PR 2 description to explicitly "introduce first concrete .filter-bar + .filter-btn + optional .search-input markup" with demo of data attrs. Updated Personal Dashboard section similarly. (Design doc: Overview ~19, Background ~33, Personal ~171, PR Plan ~402.)

### Issue 3: PR 4 is too large and not realistically independently mergeable as described
- **Severity**: major
- **Section**: PR Plan (PR 4 description)
- **Description**: PR 4 is labeled "Core" and described as one logical unit: "upgrade every card in Erasmus, regions, govt, local, online sections" in programs.html + "minor updates to grants/events if time" + data attrs + "Add to My Path" buttons + footer notes + search/filter updates. This spans dozens of individual card instances (programs.html alone has 5+ Erasmus + 4 govt + multiple region sections + online certs + NOS + free tools; events/grants have 20-30+ cards). Design notes "Can be split into sub-PRs (e.g. Erasmus first)" but lists it as a single PR. Dependencies list PR 3. "Independently mergeable" claim in intro is weakened. Content population (fees+dates+Assam logistics+NE fit excerpts from xlsx/docx) is high-effort manual work.
- **Suggestion**: Split explicitly: PR 4a (Erasmus + NOS cards only), PR 4b (remaining programs.html regions/online), PR 4c (selective grants/events/books). Or keep as one but provide a clear "Minimal viable slice for first merge" with exact card count/sections and "Add to My Path" as follow-up. Add time estimate or "owner-assisted content population" callout. Ensure PR description states the exact number of cards/sections targeted.
- **Status**: addressed
- **Response**: Split PR 4 into PR 4a (Erasmus 5 + NOS + ~3 Govt = ~9 cards, minimal viable), PR 4b (remaining ~10-15 programs.html regions/online/local), PR 4c (selective on grants/events/books). Renumbered subsequent PRs. Each now has exact scope, card counts/sections, independent dependencies (4b depends on 4a), and "Add to My Path" progression. Updated PR Plan intro and overall notes. Added precise card counts from programs.html inspection in Goals scope too. (Design doc PR Plan section fully revised.)

### Issue 4: Program/institute count claims are internally inconsistent and not clarified for scope
- **Severity**: minor
- **Section**: Goals, Background, Proposed Design (Data-Driven), PR 4
- **Description**: Legacy tickers/stats claim "80+ Programs" (index.html hero, programs.html ticker, AGENT_MEMORY inventory of old v4). Design correctly narrows to "~18+ from xlsx + Erasmus + local + online certs" and references the 19-row xlsx sheet. However, "all institutes/universities" and "every card" language is ambiguous when applied to books.html (30+ <div class="card"> entries that are not institutes), events (labs/markets), or grants. No explicit "In-scope for rich expandable treatment" list. xlsx verification confirms 18 data rows + 3 sheets with Band Summary and Ground Reality.
- **Suggestion**: Add a table or bullet in Goals or Data Model Changes: "Primary rich treatment target: the ~18-25 institute/program cards in programs.html (Erasmus 5, Govt 4, regions ~8-10, online/local ~7). Selective for key items on grants/events/books (list 5-7 examples). Books and most grants remain simple cards." Update all "80+" references in scope discussion or explicitly deprecate in PR 5.
- **Status**: addressed
- **Response**: Added explicit "Primary rich expandable treatment scope" bullets/table in Goals section with exact breakdown (~18-25 in programs.html: Erasmus 5, Govt 4, regions ~8-10, online/local ~7). Clarified books.html (30+) and most grants remain simple. Updated Goals "all" language, Background/Observability "80+" mentions (legacy ticker vs. scoped ~20), PR 4a/4b/5 descriptions, and PR 5 for ticker deprecation. (Design: Goals ~50-60, Observability ~314, PR Plan multiple.)

### Issue 5: PR Plan and design do not address adding the first filter/search UI or activating dormant JS
- **Severity**: minor
- **Section**: PR Plan (PR 2 + PR 3), Proposed Design (Personal Dashboard & Filters)
- **Description**: New filters ("Online Only", "ST Friendly", "Infra/Knowledge/Network") and dashboard require introducing `.filter-bar` markup and `.search-input` (or enhancing existing). PR 2 only says "Add 'Online Only'... filters" and "Use existing filter/search patterns" but does not call out "add the first concrete filter-bar markup in programs.html/index.html". CSS already has some `.filter-bar` rules (including 480px override), which is good, but no HTML integration.
- **Suggestion**: In PR 2 description, add: "Introduce `.filter-bar` + buttons + optional search input markup in programs.html (and index for dashboard). Wire to new `initPersonalFilters()`. Ensure first usage demonstrates data-online/data-focus attrs."
- **Status**: addressed
- **Response**: PR 2 description now explicitly requires introducing first `.filter-bar` + `.filter-btn` + optional `.search-input` markup in programs.html (and index), wired to initPersonalFilters(). Updated Personal Dashboard section. First usage must demo data-online/data-focus attrs. Cross-referenced with Issue 2 changes. (Design: PR Plan ~402, Personal Dashboard ~171.)

### Issue 6: Handling of mixed card markup (<a class="card"> vs <div class="card"> vs nested links) is underspecified for implementation
- **Severity**: minor
- **Section**: Card Design & Expandable Pattern, API/Interface Changes
- **Description**: Design gives good base HTML example and hybrid proposal ("Outer <a> ... or split: title/meta always link; body + dedicated Details button"). Current reality (verified): programs.html mostly uses top-level `<a class="card">` for external; some `<div class="card st-glow">` (NOS, free tools); books.html and some grants use `<div class="card">` with *internal* `<a>`s in `.card__foot` and `.card__detail`; events mostly `<a>`. Nested interactive elements inside `<a>` would be invalid HTML. "Prevent default on expand control" is mentioned but no exact pattern or accessibility notes for mixed cases.
- **Suggestion**: Add a small "Card Markup Variants" subsection with 2-3 concrete before/after snippets for:
  1. External-link institute card (current `<a class="card">`).
  2. Non-link info card (current `<div>`).
  3. Card with internal footer links (books style).
  Include guidance: prefer making the card root non-<a> + prominent "Visit official →" link when rich expand is primary, or use `<a>` + JS `pointer-events` on expand button. Reference a11y (aria-controls, etc.).
- **Status**: addressed
- **Response**: Added full "Card Markup Variants" subsection under Card Design & Expandable Pattern (after Data attrs). Includes 3 detailed before/after code snippets (1. external <a class="card"> Erasmus style; 2. <div class="card"> NOS style; 3. internal footer books style) with JS preventDefault, aria notes, HTML validity guidance, and recommendation to prefer non-root-<a> when rich panel primary. References existing keyboard handling in app.js. (Design doc: ~145-175 in Card Design section.)

### Issue 7: Key Decision #6 and PR 6 lightly contradict "no new files / no complexity" non-goals
- **Severity**: nit
- **Section**: Key Decisions (item 6), PR Plan (PR 6), Non-Goals
- **Description**: Non-Goals: "No new CSS files", "Do not add heavy JS libs or complex state", "Static-only, no build step beyond manual/HTML edits". PR 6 proposes "Add `research/programs.json` (export from xlsx) + optional small JS hydration". Key Decision 6 says "Static-only, no build step beyond manual/HTML edits: ... JSON embed optional for future." While marked optional/post-merge, it is presented without weighing against the "lightweight editable by non-dev owner" motivation.
- **Suggestion**: Make the contradiction explicit in Alternatives or Key Decisions: "JSON hydration is deferred precisely because it risks the 'hand-authored HTML' + simple-edit properties valued for this personal/remote use case." Or move PR 6 to a separate "future ideas" appendix.
- **Status**: addressed
- **Response**: Made explicit in Data-Driven Implementation (new paragraph/note on deferral reasons) and updated Key Decision #6 (full reword with cross-refs to Non-Goals + "PR 6 moved to optional/future"). PR 6 description itself notes "without changing the static-first / hand-editable nature". No new files required for any inline option. (Design: Data-Driven ~205, Key Decisions ~386, PR Plan ~421.)

### Issue 8: PR Plan lacks explicit rollback/verification steps per phase and owner content sign-off
- **Severity**: nit
- **Section**: Rollout Plan, PR Plan
- **Description**: Rollout Plan (phased 0-5) and PR notes are good on git revert and "owner tests locally", but lack concrete checklists: e.g., "After PR 1: reduced-motion + all existing cards unchanged + no layout shift." "After PR 4: owner must verify every rich panel's fees/Assam logistics against source xlsx/docx before merge." No mention of testing local file:// protocol (critical for remote Assam low-connectivity claim).
- **Suggestion**: Append a short "Per-PR Verification Checklist" table (or bullets under "Overall strategy notes") covering: visual regression (no breakage of existing), keyboard, mobile, reduced-motion, link health, data accuracy sign-off by owner.
- **Status**: addressed
- **Response**: Added comprehensive "Per-PR Verification Checklist" (bullets + detailed list) under Overall strategy notes in PR Plan. Covers: visual regression/no layout shift, keyboard+a11y (aria, no nested), mobile+reduced-motion, link health, data accuracy (owner must verify every panel vs xlsx/docx + sign-off), first filter-bar activation, critical local file:// test, rollback. Also integrated references into Rollout Plan phases + "see checklist" note. (Design doc: PR Plan ~426-440, Rollout ~346.)

### Strengths
- Extremely high specificity: exact line citations (programs.html ~119 Cultural, ~715 timeline accordions, ~198 Erasmus cards), function names (initAccordions, initFilters), CSS classes/props (minmax(340px), --ease-spring, .card-grid), data attr conventions from AGENT_INSTRUCTIONS.md.
- Research integration is concrete and correct: verified 19-row xlsx with matching columns/NE notes, docx paragraph counts, Pathways details (GAU flights, Guwahati attestation, NOS deadlines) match design examples.
- Architecture diagrams (Mermaid), before/after snippets, and data flow are clear and actionable.
- Strong constraint adherence: 100% static, within design-system.css (tokens, grain, sharp radius, fonts all verified), additive only, personal use focus derived directly from AGENT_MEMORY profile.
- Alternatives section is balanced with explicit trade-off reasoning; Key Decisions are numbered with rationale and cross-references.
- PR ordering is logical (CSS foundations first → JS → value → breadth).
- Security, observability, and risks sections are appropriate for a static personal site; threat model focuses correctly on staleness over infra attacks.
- "Film-reel" micro-interaction and hybrid clickable+expandable pattern are well-motivated against existing accordion usage.

### Additional Notes
- **External systems referenced but unverifiable here**: Official portals (overseas.tribal.gov.in, docnomads.eu, birtikendrajituniversity.ac.in, studyinestonia.ee, etc.) and live fee/deadline data — design correctly mandates `data-verified` dates + "always check official" text; no runtime scraping.
- **Assumptions valid**: Profile (ST, Assam remote, doc focus, 0-5L budget) matches AGENT_MEMORY verbatim. Static deploy model (manual/Netlify drag) confirmed by absence of netlify.toml and memory notes.
- **Clarity**: High overall; an engineer could implement most of it. Main ambiguities are the mixed-card edge cases and exact scope boundaries for "all cards."
- Recommend: After fixes to Issues 1-4, this would be approvable. Consider appending a short "Implementation Notes for Engineer" derived from the writer's summary (data sync process, post-merge AGENT_MEMORY update).

---

## Revision Summary

**Date of revisions:** 2026-06-18  
**Design doc revised:** `C:\Users\Asus\Downloads\cinema-edu\design\site-enhancement-design.md`  
**All 8 open issues addressed** (no wontfix or needs-user-input required; all feedback actionable and aligned with codebase reality after verification via list_dir/grep/read_file).

**Summary of changes made to design document (per issue):**
- **Issue 1 (major)**: Added "Known Technical Debt / Stale References" subsection in Background (detailed list of 8+ guide/ + 6 continents/ links from index.html with verification method). Updated current state bullets. Added explicit cleanup guidance + rationale to PR 1 and PR 5.
- **Issue 2 (major)**: Revised "existing JS patterns" language to "JS infrastructure ... will be activated" throughout (Overview, Background, etc.). Added "Current UI integration status" note in Background (grep-verified dormant state, CSS vs no markup). Scoped PR 2 + Personal Dashboard to require introducing first .filter-bar markup.
- **Issue 3 (major)**: Fully split PR 4 into independently mergeable PR 4a (Erasmus 5 + NOS/Govt ~9 cards, minimal slice), 4b (remaining programs.html ~10-15), 4c (selective cross-page). Renumbered PR 5/6. Added exact counts/sections, progression of "Add to My Path", adjusted dependencies and notes.
- **Issue 4 (minor)**: Added detailed "Primary rich expandable treatment scope" bullets in Goals (~18-25 programs.html breakdown + selective 5-7 examples; books/grants mostly simple). Scoped "80+" claims as legacy v4 ticker vs. current research target. Updated multiple sections + PR 5 for deprecation.
- **Issue 5 (minor)**: Explicitly added filter-bar + search markup requirement + data attr demo to PR 2 description. Reinforced in Personal Dashboard and cross-refs.
- **Issue 6 (minor)**: Added complete new "Card Markup Variants" subsection with 3 concrete before/after HTML+JS snippets, HTML validity guidance, a11y (aria-controls/expanded), pointer-events notes, and preference for non-root-<a> when expand primary. References app.js keyboard handling.
- **Issue 7 (nit)**: Made JSON contradiction explicit in Data-Driven Implementation (new deferral paragraph with reasons) + fully revised Key Decision #6 (cross-refs Non-Goals, PR 6 as optional, "no new files" for inline case only). PR 6 description updated.
- **Issue 8 (nit)**: Added detailed "Per-PR Verification Checklist" (visual regression, keyboard/a11y, mobile/reduced-motion, link health, owner data sign-off vs xlsx/docx, filter activation, local file:// test, rollback) in PR Plan. Integrated into Rollout Plan + strategy notes. Expanded for local file:// emphasis.

**Additional strengthening during edits**:
- All changes use precise citations to actual code (index.html lines via grep, programs.html sections, design-system.css ~667 for .filter-bar, app.js inits, xlsx row counts).
- PR Plan now has clearer independence, card counts, and checklists matching review suggestion.
- No changes that weaken core design (e.g. no new files forced; static constraints preserved).
- Design doc length increased appropriately with required subsections/snippets/checklists.

**Review file updates**: Every original open issue now has Status: addressed + detailed Response field citing exact design doc locations/changes. Revision Summary appended here.

**Next for implementer**: Follow revised PR Plan (start with PR 1 for debt audit + CSS). Re-verify checklist items (especially local file:// + owner xlsx/docx sign-off for rich panels). Update AGENT_MEMORY.md after merges.

All reviewer feedback incorporated or explicitly scoped where appropriate. Design is now tighter on current-state accuracy and implementability.

*Review based on full read of design + summary + direct code inspection of index.html, programs.html (full sections), grants.html, events.html, books.html, css/design-system.css (tokens + cards + accordion + filters), js/app.js (all inits), AGENT_MEMORY.md, AGENT_INSTRUCTIONS.md, research/programs-research.md, and xlsx/docx inspection via tools. All claims cross-checked against actual files as of 2026-06-18.*
