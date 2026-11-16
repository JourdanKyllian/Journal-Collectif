# 🤖 Documentation IA : Méthodologie, Outils & Collaboration (AGENTS.md)

Ce document décrit en détail la méthodologie de collaboration avec l'intelligence artificielle (Antigravity), les directives de guidage, les skills, les prompts, les MCP et l'organisation du travail ayant permis de concevoir, développer et fiabiliser le projet mobile **Collectif Territorial**.

---

## 1. Ce qui a guidé l'IA (Directives de Cadrage & Règles d'Or)

Pour garantir une progression sans régressions, l'IA a été guidée par un ensemble de règles strictes :
- **Principe de précaution ("Pas à pas sans tout casser")** : Interdiction formelle de réécrire des pans entiers de code à l'aveugle. Chaque modification est isolée, ciblée et validée.
- **Typage Strict & Zéro Dette** : Chaque incrément de code doit valider simultanément :
  1. `npm run typecheck` (0 erreur TypeScript, mode strict)
  2. `npm run lint` (0 erreur, 0 warning ESLint)
  3. `npm test` (Exécution réussie des suites de tests unitaires, de composants et E2E)
- **Conception Modulaire & DRY** : Création systématique de composants génériques réutilisables (`ScreenContainer`, `EmptyState`, `ErrorState`, `DataCountBadge`, `CategoryPillsBar`, `HeroCard`, `ArticleListItem`).
- **Alignement strict avec le barème d'évaluation** : Découpage du travail calqué directement sur les exigences obligatoires (SDK 57, 5 états d'écrans de données, persistance offline, mode sombre, RGPD et tests ciblés).

---

## 2. Outils & Protocoles Utilisés (MCP & Skills)

### A. Les Outils MCP (Model Context Protocol) & Système
- **MCP Filesystem** (`read_file`, `write_file`, `edit_file`) : Lecture chirurgicale et application de diffs ciblés sans altérer les structures existantes.
- **MCP Terminal Sandbox** (`run_command`) : Exécution sécurisée des commandes de build, linters, analyseurs statiques et lanceurs de tests dans un bac à sable contrôlé.
- **MCP Tâches Asynchrones & Gestion de Process** (`manage_task`) : Pilotage des opérations longues (installation de dépendances npm, builds de pré-compilation).

### B. Les Skills & Connaissances Spécialisées
- **Skill Diagnostic Natif (iOS/Android)** : Résolution du conflit de version CocoaPods pour `expo-location` via `pod install` dans `mobile/ios`, et diagnostic de l'erreur réseau Android (`NoRouteToHostException`) lors du lancement sur périphérique physique.
- **Skill Customizations & Guide Antigravity** : Respect des conventions de nommage, gestion fine du contexte et des artefacts de documentation.

---

## 3. Prompts & Ingénierie de Prompt

Le projet a été mené grâce à une séquence de prompts structurés par étapes claires :

| Étape | Intitulé du Prompt / Cadrage | Objectif Atteint |
| :--- | :--- | :--- |
| **Étape 1** | *« Reprendre le profil pour afficher les données perso modifiables avec les catégories adaptées au mobile + suppression de compte »* | Refonte du profil (4 onglets, avatar couleur, 2 switchs, 2 stats) et endpoint backend `DELETE /auth/me` conforme RGPD. |
| **Étape 2** | *« Feature offline (cache & favoris) et respect des 5 états des écrans de données »* | Service `OfflineService`, gestion du cache local par commune, bouton favori et composant `DataCountBadge` avec pastille hors-ligne. |
| **Étape 3** | *« Intégration du Mode Sombre persistant et retours haptiques »* | Création de `ThemeContext`, synchronisation avec le switch utilisateur et retour haptique via `expo-haptics`. |
| **Étape 4** | *« Réalisation des tests : 3 unitaires, 2 de composant, 1 E2E »* | Configuration de Jest + ts-jest : 12 tests unitaires, 2 tests de composants (`DataCountBadge`, `EmptyState`) et 1 test E2E complet. |
| **Étape 5** | *« Rédaction des choix techniques, de la checklist sécurité et du support de soutenance »* | Rédaction de `ARCHITECTURE_DECISIONS.md`, `SECURITY_CHECKLIST.md` et `SOUTENANCE_GUIDE.md`. |

---

## 4. Modalités de Travail Collaboratif (Humain ⇄ IA)

Le binôme développeur / agent d'intelligence artificielle a fonctionné selon le modèle **Pilote & Co-pilote Spécialisé** :
1. **L'Humain apporte le contexte réel et la vision métier** :
   - Fourniture des grilles d'évaluation officielles et des captures d'écran des maquettes web/mobiles.
   - Signalement des erreurs réelles de compilation rencontrées sur téléphone physique Samsung et environnement Mac Xcode.
   - Validation des décisions d'architecture et arbitrage des priorités.
2. **L'IA prend en charge l'exécution technique rigoureuse** :
   - Analyse croisée des dépendances et de la compatibilité des paquets (Expo SDK 57 / React 19).
   - Rédaction du code source TypeScript, des composants d'interface et des styles.
   - Création automatisée des suites de tests unitaires, de composants et d'intégration de bout en bout.
   - Vérification systématique de non-régression via exécution des tests et linters avant chaque commit.
