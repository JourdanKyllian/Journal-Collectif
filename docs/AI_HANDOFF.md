<ai_handoff_registry version="1.0">

# 🤝 Registre de Passation Inter-IA & Journal de Bord (AI_HANDOFF.md)

> **Document de Référence pour la Collaboration Multi-IA**  
> Ce document assure la continuité du contexte entre les différents modèles et agents d'IA (Claude, Gemini, Antigravity, ChatGPT, Cursor, etc.).  
> **Règle d'or : Toute IA intervenant sur le dépôt DOIT lire ce fichier avant d'agir, et y consigner son résumé d'intervention avant de clore sa session.**

---

<project_health status="operational" last_checked="2026-11-17">
## 1. État de Santé Actuel du Projet (Statut de Référence)

| Composant | Technologie | État des Tests & Linters | Statut |
| :--- | :--- | :--- | :--- |
| **Backend API** | NestJS 10, TypeORM, PostgreSQL, Redis | `npm run test` ➔ **26 suites, 219 tests passés** (0 échec) <br>`npm run lint` ➔ **0 erreur** | ✅ 100% Opérationnel |
| **Mobile App** | Expo SDK 57, React Native 0.79, Expo Router | `npm test` ➔ **17 tests passés** (14 unitaires, 2 composants, 1 E2E) <br>`npm run typecheck` ➔ **0 erreur** <br>`npm run lint` ➔ **0 erreur, 0 warning** | ✅ 100% Opérationnel |
| **Frontend Web** | Next.js 15+, Tailwind CSS, Shadcn | `npm run lint` ➔ **0 erreur** | ✅ 100% Opérationnel |
</project_health>

---

<protocol_directives priority="critical" max_active_sessions="5">
## 2. Protocole Obligatoire pour Toute IA Prenant le Relais

Quand vous commencez une tâche sur ce projet :
1. **Lisez ce fichier (`docs/AI_HANDOFF.md`)** pour connaître immédiatement l'état du code sans exploration superflue.
2. **Consultez la configuration locale ciblée** :
   - Côté Mobile ➔ [`mobile/AGENTS.md`](file:///Users/kyllianjourdan/projet/Collectif/Journal-Collectif/mobile/AGENTS.md)
   - Côté Web ➔ [`frontend/AGENTS.md`](file:///Users/kyllianjourdan/projet/Collectif/Journal-Collectif/frontend/AGENTS.md)
   - Côté API ➔ [`backend/AGENTS.md`](file:///Users/kyllianjourdan/projet/Collectif/Journal-Collectif/backend/AGENTS.md)
3. **Consultez les décisions d'architecture** dans [`docs/ARCHITECTURE_DECISIONS.md`](file:///Users/kyllianjourdan/projet/Collectif/Journal-Collectif/docs/ARCHITECTURE_DECISIONS.md) pour comprendre *pourquoi* les choix ont été faits avant de proposer une modification.
4. **Validez systématiquement** avant de terminer :
   - Backend : `npm --prefix backend test`
   - Mobile : `npm --prefix mobile test && npm --prefix mobile run typecheck`
   - Frontend : `npm --prefix frontend run lint`
5. **Inscrivez votre entrée** dans la section `<session_log>` ci-dessous en respectant la **Règle de la Fenêtre Glissante** :
   - Format concis (10 à 15 lignes max par session).
   - Ne conservez que les **5 dernières sessions détaillées**. Dès qu'une 6ᵉ arrive, condensez la plus ancienne en une seule ligne dans l'archive.
</protocol_directives>

---

<session_log order="anti-chronological">
## 3. Journal de Bord des Interventions (Ordre Antichronologique)

### 📅 Session du 17 Novembre 2026 — Agent : Antigravity (Google DeepMind)
* **Objectifs réalisés :**
  1. **Conformité Juridique Web (`frontend/`) :**
     - Création de la page CGU citoyenne ([`frontend/src/app/(visitor)/cgu/page.tsx`](file:///Users/kyllianjourdan/projet/Collectif/Journal-Collectif/frontend/src/app/(visitor)/cgu/page.tsx)).
     - Création de la page Politique de Confidentialité dédiée ([`frontend/src/app/(visitor)/politique-de-confidentialite/page.tsx`](file:///Users/kyllianjourdan/projet/Collectif/Journal-Collectif/frontend/src/app/(visitor)/politique-de-confidentialite/page.tsx)).
     - Ajout de la bannière cookies discrète non bloquante avec choix égalitaire CNIL ([`frontend/src/components/layout/CookieConsentBanner.tsx`](file:///Users/kyllianjourdan/projet/Collectif/Journal-Collectif/frontend/src/components/layout/CookieConsentBanner.tsx)).
     - Refonte du footer web avec barre légale centrée et discrète (`text-[11px]`) et bouton « Gestion des cookies ».
  2. **Purge & Conformité Native Mobile (`mobile/`) :**
     - Annulation totale des cookies sur mobile (suppression de `CookieConsentBanner.tsx` et `consent.service.ts` mobiles, les cookies HTTP n'existant pas sur mobile natif).
     - Refonte de la modale légale mobile ([`mobile/src/app/modals/privacy.tsx`](file:///Users/kyllianjourdan/projet/Collectif/Journal-Collectif/mobile/src/app/modals/privacy.tsx)) intégrant les 5 piliers : Mentions Légales, RGPD, Chiffrement TLS/Keychain, CGU citoyennes et Droit à l'effacement.
     - Points d'accès mobile garantis : visible sur l'écran de Login (`modals/login.tsx`), accessible pour tous dans l'onglet Sécurité du profil (`ProfileSecurityTab.tsx`, mode connecté ET invité), et dans les préférences (`ProfilePreferencesTab.tsx`).
  3. **Multi-IA & Documentation :**
     - Mise en place du protocole de passation inter-IA (`docs/AI_HANDOFF.md`).
     - Alignement de `CLAUDE.md`, `AGENTS.md` et `docs/ARCHITECTURE_DECISIONS.md`.
  4. **Bonus Maestro & EAS Workflows :**
     - Installation du CLI officiel Maestro v2.12.1 en local sur Mac (100% gratuit, 0 € d'hébergement).
     - Création du flow de test E2E déclaratif ([`mobile/.maestro/citizen-flow.yaml`](file:///Users/kyllianjourdan/projet/Collectif/Journal-Collectif/mobile/.maestro/citizen-flow.yaml)) testant le parcours citoyen complet.
     - Configuration du profil `e2e-test` dans [`mobile/eas.json`](file:///Users/kyllianjourdan/projet/Collectif/Journal-Collectif/mobile/eas.json) et du workflow Expo officiel ([`mobile/.eas/workflows/e2e-test-android.yml`](file:///Users/kyllianjourdan/projet/Collectif/Journal-Collectif/mobile/.eas/workflows/e2e-test-android.yml)).
     - Ajout des scripts npm `npm run maestro:test` et `npm run maestro:studio` dans `mobile/package.json`.
  5. **Résolution des Échecs CI GitHub Actions :**
     - Suppression du fichier en doublon `frontend/next.config.mjs` (qui entrait en conflit avec `next.config.ts` et faisait crasher le build Next.js après 50s).
     - Correction du paramètre `cache-dependency-path` dans `.github/workflows/ci.yml` (suppression du préfixe erroné `./` qui provoquait l'échec immédiat des jobs en 2s).
     - Intégration de l'étape de tests `npm test` dans le job mobile du workflow CI.
* **Fichiers modifiés / créés :**
  - `frontend/src/app/(visitor)/cgu/page.tsx`
  - `frontend/src/app/(visitor)/politique-de-confidentialite/page.tsx`
  - `frontend/src/components/layout/CookieConsentBanner.tsx`
  - `frontend/src/components/layout/Footer.tsx`
  - `mobile/src/app/modals/privacy.tsx`
  - `mobile/src/app/modals/login.tsx`
  - `mobile/src/components/profile/ProfileSecurityTab.tsx`
  - `mobile/src/components/profile/ProfilePreferencesTab.tsx`
  - `mobile/src/__tests__/unit.test.ts`
  - `docs/AI_HANDOFF.md`
  - `docs/ARCHITECTURE_DECISIONS.md`
* **Vérification finale :**
  - Backend : 219 tests réussis.
  - Mobile : 17 tests réussis, 0 erreur typecheck, 0 erreur lint.
  - Web : 0 erreur lint.

---

### 📅 Session du 16 Novembre 2026 — Agent : Antigravity (Google DeepMind)
* **Objectifs réalisés :**
  1. **Bonus Fonction IA Gratuite dans l'App Mobile :**
     - Service local `AiAssistantService` ([`mobile/src/lib/services/ai-assistant.service.ts`](file:///Users/kyllianjourdan/projet/Collectif/Journal-Collectif/mobile/src/lib/services/ai-assistant.service.ts)) : correction syntaxique, élimination des redondances, suggestions citoyennes bienveillantes, respect strict du sens utilisateur, 0 € de coût token.
     - Bouton interactif « ✨ Améliorer avec l'Assistant » dans la modale de soumission d'article ([`mobile/src/app/modals/submit.tsx`](file:///Users/kyllianjourdan/projet/Collectif/Journal-Collectif/mobile/src/app/modals/submit.tsx)).
  2. **Bonus Mode Hors-Ligne Synchronisé :**
     - Service `SyncQueueService` ([`mobile/src/lib/services/sync-queue.service.ts`](file:///Users/kyllianjourdan/projet/Collectif/Journal-Collectif/mobile/src/lib/services/sync-queue.service.ts)) : file d'attente persistante locale via SecureStore, capture des soumissions sans réseau, rejeu automatique dès reconnexion.
  3. **Documentation Soutenance & Cadrage :**
     - Création de `docs/SOUTENANCE_GUIDE.md` (minutage 5 min démo / 3 min archi / 2 min questions).
     - Remplissage de `docs/SECURITY_CHECKLIST.md` (authentification, RBAC, chiffrement, RGPD, scans trivy).
     - Rédaction du `docs/ARCHITECTURE_DECISIONS.md` (ADR complet).
</session_log>

</ai_handoff_registry>
