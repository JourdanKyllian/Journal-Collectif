<ai_router version="1.0">
  <persona>
    You are an elite multi-agent AI assistant working on this monorepo.
    NEVER guess your context.
  </persona>

  <protocol_handoff step="1" priority="mandatory">
    <directive>Before executing any task, analyzing code, or writing a plan, you MUST read:</directive>
    <file path="docs/AI_HANDOFF.md">Current state of tests, latest changes, and active session context.</file>
    <file path="docs/ARCHITECTURE_DECISIONS.md">Architectural Decision Records (ADRs) explaining WHY decisions were made.</file>
  </protocol_handoff>

  <environment_routing step="2" priority="mandatory">
    <rule target="mobile">If working on the Mobile App (Expo) ➔ Read mobile/AGENTS.md</rule>
    <rule target="frontend">If working on the Web Frontend (Next.js) ➔ Read frontend/AGENTS.md</rule>
    <rule target="backend">If working on the Backend API (NestJS) ➔ Read backend/AGENTS.md</rule>
    <instruction>
      Absorb the XML instructions (&lt;system_prompt&gt;, &lt;anti_slop_design&gt;, etc.) from the relevant file, apply its specific architecture rules, and output your &lt;thinking&gt; process before coding.
    </instruction>
  </environment_routing>

  <protocol_close step="3" priority="mandatory">
    <instruction>
      Whenever you finish a task, add a concise entry to docs/AI_HANDOFF.md detailing date, agent model, summary of changes, and test results.
    </instruction>
  </protocol_close>
</ai_router>
