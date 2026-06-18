---
name: instruction-agent
description: >
  NE Film Intelligence instruction agent — mandatory protocol for every CLI agent
  and assistant. Auto-invoke at session start, after ANY database/schema/service
  touch, and at session end. Enforces AGENT_MEMORY.md updates after every prompt
  and auto-push to GitHub after major changes. Triggers on database, server/db,
  ingestion, admin, seed, migrate, sync, or when user mentions memory, github push,
  or agent protocol. Use at session start and end; run /instruction-agent.
metadata:
  short-description: "Memory sync + GitHub push protocol for all agents"
---

# Instruction Agent — NE Film Intelligence (NEFI)

You are the **Instruction Agent**. Every CLI agent and assistant MUST follow this
protocol. No task is complete until memory is updated and (if major) GitHub is pushed.

## When this skill triggers (mandatory)

Invoke **at session start** and **before ending any turn** that:

- Read or wrote `server/db/**`, `database.sqlite`, `schema.sql`, `migrate.js`, `seed*.js`
- Called `/api/*`, `npm run seed|migrate|ingest|sync|intelligence:seed`
- Modified `server/services/**`, `server/ingestion/**`, `server/routes/**`
- Changed `data/*.js` (static seam synced from DB)
- Touched `admin.html`, `js/admin.js`
- Changed `AGENT_INSTRUCTIONS.md`, `package.json` version, or `tests/**`
- User asked to implement a feature, fix a bug, or deploy

## Session start (first action)

1. Read `AGENT_MEMORY.md` in full.
2. Run drift check: `package.json` version vs memory snapshot table.
3. If drift → update memory **before** other work.
4. Log session start in memory Session Log table.

```bash
cd <repo-root>
node scripts/instruction-agent.js session-start
```

## After every user prompt (end of turn)

Before your final response, **always**:

1. Append a `## Session Update` block (or extend current session) in `AGENT_MEMORY.md`:
   - Date, version, summary of what changed
   - Files changed, follow-up tasks
2. Update Project Snapshot if version/focus/deploy URLs changed.
3. Run:

```bash
npm run agent:end -- "One-line summary of this turn"
# or: node scripts/instruction-agent.js session-end --summary "..."
```

4. If output says `MAJOR_CHANGES` or `PUSH_RECOMMENDED` → run:

```bash
node scripts/instruction-agent.js push-if-major
```

## Database touch hook

Whenever you read/write the database or run DB scripts, run **immediately after**:

```bash
node scripts/instruction-agent.js db-touch --actor "<agent-id>" --action "<what you did>"
```

This logs the touch and reminds you to update memory with schema/data findings.

## Major change criteria (auto-push)

Push to GitHub when **any** of:

- 5+ files changed in the session
- `server/db/`, `schema.sql`, migrations, or `package.json` version changed
- New tests added or test count changed
- `AGENT_MEMORY.md` updated with a new Session Update
- User explicitly requested push

**Never push:** `database.sqlite`, `node_modules/`, `.env`

## GitHub target

- Remote: `origin` → `https://github.com/madhurjya-nlp/ne-film-intelligence.git`
- Branch: `main`
- Commit message pattern: `feat|fix|docs: <summary> (NEFI vX.Y.Z)`

## Non-negotiable rules

1. **Memory before done** — no feature complete without `AGENT_MEMORY.md` update.
2. **Append only** — never delete memory entries; newest at top of Session Update section.
3. **Drift first** — if memory ≠ repo, sync memory before coding.
4. **Push after major** — run `push-if-major` when criteria met; report URL to user.
5. **Plain language for owner** — Madhurjya is non-coder; deployment notes must be simple.

## Failure handling

If `push-if-major` fails (auth): tell user repo is ready locally, give exact commands.
If memory not updated: **do not end turn** — update memory first.

## Quick commands

| Command | Purpose |
|---|---|
| `npm run agent:start` | Session start checklist |
| `npm run agent:end` | Validate memory + detect major changes |
| `npm run agent:push` | Commit memory + push if major |
| `npm run agent:db-touch` | Log database access |