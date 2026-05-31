# Évaluation Technique & Architecture (TP DevOps/Qualité)

Ce document détaille les choix architecturaux, les pratiques de code et la configuration de l'infrastructure mis en place pour répondre aux exigences de qualité logicielle.

## 1. Architecture & Design Patterns

L'application backend est construite avec le framework **NestJS**, imposant naturellement une architecture modulaire et une forte ségrégation des responsabilités.

- **Pattern Repository :** L'accès aux données PostgreSQL est abstrait via TypeORM. Cela permet de séparer la logique métier (Services) des requêtes SQL, facilitant l'écriture de tests unitaires avec des mocks (ex: `mockArticleRepository`).
- **Pattern Dependency Injection (DI) :** Utilisé de manière intensive via les `@Injectable()` de NestJS pour découpler les contrôleurs des services, garantissant une meilleure testabilité et maintenabilité.
- **Pattern Singleton :** L'instance de la base de données et le client Redis sont gérés comme des singletons au sein du cycle de vie de l'application.

## 2. Qualité Logicielle & Tests

- **Mode Strict TypeScript :** Le projet est configuré en mode strict (`strict: true`), évitant les erreurs d'assignation au runtime.
- **Linter & Formatter :** Utilisation d'ESLint et de Prettier.
- **Pre-commit Hooks (Husky) :** Un pipeline local bloque tout commit ne respectant pas les règles de linting (`npm run lint`), empêchant la dette technique d'atteindre le dépôt distant.
- **Tests :** L'application intègre des tests unitaires (`.spec.ts`) validant la logique métier des services indépendamment de l'infrastructure de données.

## 3. Conteneurisation & Sécurité (Docker)

L'ensemble de la stack (Frontend, Backend, Postgres, Redis, Nginx) est orchestré via un `docker-compose.yml` centralisé. Un soin particulier a été apporté à l'optimisation et à la sécurité des images.

**Choix de conception du `Dockerfile` (Backend & Frontend) :**
- **Multi-stage Build :** Séparation des étapes de dépendances, de compilation et de production pour réduire drastiquement le poids de l'image finale.
- **Distroless (`gcr.io/distroless/nodejs22-debian12:nonroot`) :** L'image finale ne contient ni shell, ni gestionnaire de paquets, ce qui réduit considérablement la surface d'attaque en production (mitigation des CVE au niveau de l'OS).
- **Privilèges Restreints :** Le conteneur s'exécute avec l'utilisateur `nonroot` (UID 65532), évitant qu'une potentielle faille applicative ne donne un accès root au conteneur.

## 4. Pipeline CI/CD (GitHub Actions)

Un workflow automatisé (`.github/workflows/ci.yml`) est déclenché à chaque push ou Pull Request sur la branche `main`.

1. **Build & Test :** Installation propre des dépendances (`npm ci`), compilation (`npm run build`) et exécution de la suite de tests métier.
2. **Analyse de Vulnérabilités (Trivy) :** Le pipeline intègre l'action `aquasecurity/trivy-action` pour scanner les failles de sécurité de l'image (de niveau HIGH et CRITICAL). En cas de faille détectée, le pipeline échoue.

## 5. Observabilité & Monitoring

- **Health Checks :** Mise en place d'une route API `GET /api/v1/health` vérifiant de manière asynchrone l'état de la connexion PostgreSQL, du client Redis et calculant l'uptime de l'API. Ce point d'entrée permet à l'orchestrateur de vérifier si le conteneur est réellement apte à traiter les requêtes.
- **Logs Structurés (JSON) :** Intégration de `nestjs-pino` et `pino-http`. Le système remplace le logger standard par une sortie standardisée au format JSON, comprenant le contexte, la latence des requêtes et les statuts HTTP, facilitant ainsi l'ingestion par des outils de monitoring (ex: stack ELK ou Datadog).
