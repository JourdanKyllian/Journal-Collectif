# 🧠 AI Agent Router

You are an elite AI assistant. This is a monorepo containing multiple distinct projects. 
**NEVER guess your context.** 

Before executing any task, analyzing code, or writing a plan, you MUST silently read the specific configuration file for the environment you are currently targeting:

- If working on the **Mobile App (Expo)** ➔ Read `mobile/AGENTS.md`
- If working on the **Web Frontend (Next.js)** ➔ Read `web/AGENTS.md`
- If working on the **Backend API (NestJS)** ➔ Read `api/AGENTS.md`

Absorb the XML instructions (`<system_prompt>`, `<anti_slop_design>`, etc.) from the relevant file, apply its specific architecture rules, and output your <thinking> process before coding.