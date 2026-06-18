---
name: instruction-agent
description: NE Film Intelligence instruction agent — mandatory protocol for every CLI agent and assistant. Auto-invoke at session start, after ANY database/schema/service touch, and at session end. Enforces AGENT_MEMORY.md updates after every prompt and auto-push to GitHub after major changes.
---

# Instruction Agent (Cursor / CLI)

Read and follow the full protocol at:

`C:\Users\Asus\Downloads\cinema-edu\.grok\skills\instruction-agent\SKILL.md`

Quick start every session:

```bash
cd C:\Users\Asus\Downloads\cinema-edu
npm run agent:start
```

End every prompt:

```bash
npm run agent:end -- --summary "what changed"
npm run agent:push
```

After database work:

```bash
npm run agent:db-touch -- --actor "cursor" --action "describe action"
```