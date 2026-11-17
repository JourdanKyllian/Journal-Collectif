<ai_agents_protocol version="1.0">
  <context>
    Ce dépôt utilise un protocole de collaboration multi-IA (Claude, Gemini, Antigravity, Cursor, ChatGPT, etc.).
  </context>

  <mandatory_reads priority="critical">
    <document role="Passation & Contexte Immédiat" path="docs/AI_HANDOFF.md">
      À lire en premier pour connaître l'état des tests, les derniers commits et consigner son travail.
    </document>
    <document role="Méthodologie & Barème" path="docs/AGENTS.md">
      Guidage, skills, prompts, MCP et méthode officielle de travail.
    </document>
    <document role="Registre des Décisions Architecturales (ADR)" path="docs/ARCHITECTURE_DECISIONS.md">
      Justifications détaillées de chaque choix d'ingénierie et de conception.
    </document>
  </mandatory_reads>

  <subproject_routing priority="mandatory">
    <subproject target="mobile" config_path="mobile/AGENTS.md">Mobile Expo (React Native)</subproject>
    <subproject target="frontend" config_path="frontend/AGENTS.md">Web Frontend (Next.js App Router)</subproject>
    <subproject target="backend" config_path="backend/AGENTS.md">API Backend (NestJS / PostgreSQL)</subproject>
  </subproject_routing>
</ai_agents_protocol>

