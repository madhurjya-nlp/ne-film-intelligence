# Summary: Site Enhancement Design Document Produced

**Produced:** 2026-06-18  
**Output files:**  
- `C:\Users\Asus\Downloads\cinema-edu\design\site-enhancement-design.md` (full design document)  
- This summary (`C:\Users\Asus\Downloads\cinema-edu\design\site-enhancement-summary.md`)

## What Was Produced

A comprehensive systems architecture design document for transforming the existing "The Film Path" static site (cinema-edu) into a detailed **personal research hub** for the owner (25yo ST Assamese filmmaker, North Lakhimpur, Assam).

The document follows the exact requested structure:
- Title & Metadata (Draft status)
- Overview (1-2 paras focused on problem + solution)
- Background & Motivation (current site state from code, research files, pain points, owner profile from AGENT_MEMORY)
- Goals & Non-Goals (explicit boundaries: static-only, within design-system.css, personal use, online priority)
- Proposed Design (detailed, with Mermaid architecture diagrams, card interaction sequence, information architecture; concrete examples citing `programs.html` line ranges, `js/app.js` functions like `initAccordions`, `css/design-system.css` `.card` + `.accordion` rules)
- API / Interface Changes (before/after HTML snippets for cards)
- Data Model Changes (research xlsx/docx as sources, localStorage for notes)
- Alternatives Considered (3 options with full trade-off analysis)
- Security & Privacy (threat model, mitigations)
- Observability (static constraints + enhancements)
- Rollout Plan (phased with risks/mitigations)
- Open Questions
- References (absolute paths to index.html, programs.html, CSS, JS, all research/*.docx/*.xlsx/*.md, AGENT_* files)
- **Key Decisions** (7 major architectural/design decisions with rationale, e.g. inline expandables, strict CSS adherence, personal dashboard, data sourcing)
- **PR Plan** (6 concrete, ordered, independently mergeable PRs with titles, files, deps, descriptions — realistic incremental from CSS foundations → JS → dashboard → rich cards content → polish)

## Exploration Performed (Without review_file path)

- **Directory structure**: Full top-level + design/ (empty), research/, css/, js/, all *.html.
- **Key source reads**:
  - All HTML: index.html (hero, nav cards, stats), programs.html (full — Cultural Context, cost bands, Erasmus cards, NOS, regions, timeline accordions at ~715), grants.html, books.html (card patterns), events.html.
  - CSS: design-system.css (tokens, grain, .card/.card-grid, .accordion, .page-hero, responsive, footer; read in multiple chunks).
  - JS: app.js (complete: reveals, mobile, accordions, filters, search, keyboard, dates, inits).
- **Research corpus** (primary data sources):
  - programs-research.md (exec summary, Erasmus tables, regions, ground reality).
  - Extracted via python-docx: Cultural_Context_Assam_NE_Cinema_Media.docx (full history Joymoti/DBHRGFTI/NE challenges/opportunities) + Pathways_Abroad_Assam_NE_Ground_Reality.docx (NOS details, Guwahati attestation, VFS, GAU flights, 3-phase plan, profile logistics).
  - xlsx via openpyxl: `Film_Education_Programs_Categorized_0-9Lacs_Assam_NE.xlsx` (sheets, headers, 18+ program rows with Cost Band/Institution/Country/Program/Duration/Est Tuition/NE Notes/Link; samples from 0-3L DBHRGFTI/Bir Tikendrajit/Sapientia/Germany through 7-9L FAMU etc.).
- **Context files**: AGENT_MEMORY.md (full profile, project snapshot, what exists/missing, research logs, owner details), AGENT_INSTRUCTIONS.md (structure, research protocol, data attrs, rules).
- **Patterns identified & cited**: Card markup (many `<a class="card">` + divs, data-* for filters), filter/search implementation, existing accordion usage (timeline), external link handling (rel=noopener, foot arrows), Cultural Context + bands as recent additions, exact file references for future sync.
- **Constraints respected**: 100% static, only edit within design-system.css, no new pages unless incremental, cite specifics, quantify (e.g. ~18 programs, card minmax 340px, GAU flights estimates), risks called out, film-reel metaphor using existing --ease.

No files created except the two required design artifacts. No changes to source HTML/CSS/JS (design phase only).

## Key Elements Addressed from Prompt

- **Personal research hub + owner focus**: "My Recommended Path", profile-derived recs (online/flex, ST, doc, remote Assam, low budget), persistent notes, dashboard feel.
- **Clickable + expandable EVERY card/institute**: Explicit requirement met via hybrid `<a>` + rich panel (details/JS). Rich fields: fees (date), duration, online/hybrid status, Assam process (attestation/VFS/flights from Pathways docx), ST/NOS, NE fit (Cultural + xlsx Notes), scholarships, Apply/contact, network value, Assam relevance.
- **Design within existing**: Celluloid yellow, film grain, Space Grotesk + Courier, sharp edges, --ease. Enhancements: elegant cards, long-content typography, film-reel expand micro-interactions.
- **UX/Info density**: New filters ("Online Only", "ST Friendly", "Infra/Knowledge/Network"), smooth collapse, personal notes, hierarchy.
- **Data-driven**: Direct integration of xlsx categorized + docx prose; citations throughout.
- **Lightweight static, accessibility, mobile, online priority**: All called out.
- **Mermaid diagrams**: Architecture data flow, card sequence, IA.
- **Specificity**: File paths (e.g. programs.html:199 for DocNomads card), function names (initFilters etc.), line examples, exact research fields.
- **PR Plan + Key Decisions**: At bottom as required.

## Next Steps (for implementer)

1. Read the full design doc.
2. Follow PR Plan order (start with PR 1 for safe CSS-only changes).
3. Use research/ files as source when populating rich panels.
4. Test thoroughly: local file load, mobile, reduced-motion, keyboard, all cards clickable+expand.
5. Append to AGENT_MEMORY.md per project norms after implementation.
6. Owner review of Open Questions.

The document is ready for review/implementation. It is precise, cites the actual codebase and research extensively, and provides an executable blueprint.
