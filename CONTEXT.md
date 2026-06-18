# CineEduAssan (CEA) — Domain Context

**Project**: Personal research navigator for film, documentary, content, and media education paths for filmmakers and students from Northeast India (focus on Assam, ST candidates, low/no-cost and scholarship-eligible options, with emphasis on online/flexible modes).

**Owner Profile**: 25-year-old ST (Scheduled Tribe) Assamese filmmaker from North Lakhimpur, Assam. Documentary and short-form focus, limited budget (comfortable 0-5L self, up to 15L with scholarship), remote location, English + Assamese, portfolio in drone/editing/documentary.

**Core Goals**:
- Discover low-cost, scholarship-eligible (esp. NOS for ST, Erasmus Mundus) paths into formal education globally.
- Understand practical ground realities for going abroad from Assam (visas, attestation in Guwahati, flights from GAU, connectivity, return).
- Build knowledge + network + infrastructure via mostly online modes initially.
- Leverage unique NE/Assam cultural stories (indigenous, biodiversity, oral traditions, Bihu, etc.) in global cinema.

## Key Domain Terms

### Program
A film/media education opportunity (MA, diploma, certificate, workshop, short course). 
Attributes include:
- institution, country/region
- program name and focus (e.g. documentary directing, film practice)
- duration
- cost (tuition in INR Lacs bands: 0-3, 4-6, 7-9; note living/travel separate)
- format (online, hybrid, in-person, multi-country)
- eligibility notes, especially for Indian/ST/NE candidates
- scholarship options (NOS, Erasmus, institutional)
- Assam/NE-specific ground reality notes (logistics, fit for stories, network value)
- direct link
- verified date/source

Programs are grouped by cost bands for decision-making.

### CostBand
Tuition-focused categorization:
- 0-3 Lacs: Local (e.g. DBHRGFTI Assam), ultra-affordable online/Asia/Europe public options, free certs/MOOCs.
- 4-6 Lacs: Mid-range Indian (SRFTI/FTII) or European/Asian with scholarships.
- 7-9 Lacs: Prestigious (FAMU English, UK online, full Erasmus self-funded) — typically require NOS or strong funding.

### ResearchArtifact
Structured source material in `/research/`:
- .md files (programs-research.md with tables, cultural context)
- .xlsx (categorized programs with columns for band, institution, details, Assam notes, links)
- .docx (Cultural_Context_Assam_NE_Cinema_Media, Pathways_Abroad_Assam_NE_Ground_Reality)
- Used for verification; currently not the live data source for the site UI.

### Card / BentoCard
UI representation of a single Program. Rich version includes:
- Clickable title/link
- Expandable details panel (fees, format, Assam logistics, NE fit, network/infra value, apply steps)
- data-* attributes for filtering (category, format, st-eligible, focus: infra/knowledge/network)

### Filter
Client-side mechanism using data attributes to show/hide cards (All, Online/Flex, ST/Assam Friendly, Knowledge+Network+Infra). Part of personal tool for quick decisioning.

### PersonalPath
Curated starting point for the owner: local first (DBHRGFTI), stack affordable online (Bir Tikendrajit), leverage big scholarships (NOS), then international exposure. Emphasizes building portfolio + free certs in parallel.

### ST / Assam Ground Reality
Practical constraints and advantages:
- Remote location (Lakhimpur → Guwahati for attestation/fests/airport)
- NOS eligibility (ST cert, income ≤6L, QS unis, film/media under humanities)
- Local assets (DBHRGFTI as only NE govt institute, Jyoti Chitraban studio, regional fests)
- Cultural superpower: underrepresented indigenous/NE stories highly valued globally for docs/festivals/funding

## Architecture Notes (for this task)
Current "programs" concern is split: rich structured knowledge lives in ResearchArtifacts, but UI is shallow hardcoded HTML in programs.html (bento grid of cards with inline data). Data-attrs and JS provide thin filtering. No single seam between research source and rendered view.

This candidate deepens the ProgramsData module + adapter/renderer seam so research becomes primary source.

See AGENT_INSTRUCTIONS.md for full research protocol and data attr spec.
