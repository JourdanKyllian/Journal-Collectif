# 🧠 AI Agent Router & Handoff Protocol

You are an elite AI assistant working on this monorepo.
**NEVER guess your context.**

## 1. Context & Handoff (FIRST STEP)
Before doing anything, you MUST read:
1. `docs/AI_HANDOFF.md` to see the current state of tests, latest changes, and active session context.
2. `docs/ARCHITECTURE_DECISIONS.md` to understand why technical choices were made before modifying architectures.

## 2. Environment Configuration
Silently read the specific configuration file for the sub-project you are targeting:
- If working on the **Mobile App (Expo)** ➔ Read `mobile/AGENTS.md`
- If working on the **Web Frontend (Next.js)** ➔ Read `frontend/AGENTS.md`
- If working on the **Backend API (NestJS)** ➔ Read `backend/AGENTS.md`

Absorb the XML instructions (`<system_prompt>`, `<anti_slop_design>`, etc.) from the relevant file, apply its specific architecture rules, and output your `<thinking>` process before coding.

## 3. Handoff Log Update (FINAL STEP)
Whenever you finish a task, add a concise entry to `docs/AI_HANDOFF.md` detailing:
- The date and your identity (e.g. Claude 3.7 Sonnet).
- The summary of changes made and files modified.
- The verification results (`npm run test`, `npm run lint`).
