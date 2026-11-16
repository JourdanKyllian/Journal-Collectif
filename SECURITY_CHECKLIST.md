# 🛡️ Checklist Sécurité & Conformité (Évaluation Projet Mobile & Collectif)

Cette checklist synthétise les mesures de sécurité et de conformité RGPD implémentées sur l'ensemble de la plateforme (Application Mobile Expo SDK 57, Backend NestJS et Base PostgreSQL / Supabase).

---

## 1. Authentification, Chiffrement & Gestion des Identités
- [x] **Mots de passe robustes** : Validation forte imposée côté backend (minimum 8 caractères, majuscule, minuscule, chiffre, caractère spécial).
- [x] **Hachage sécurisé** : Mots de passe salés et hachés via `bcrypt` (facteur de coût 10) sans jamais transiter ni être stockés en clair.
- [x] **Gestion des sessions JWT** :
  - Access Token court terme (15 minutes).
  - Refresh Token sécurisé avec rotation et invalidation explicite lors de la déconnexion.
- [x] **Stockage Mobile Sécurisé** :
  - Utilisation exclusive d'`expo-secure-store`.
  - Chiffrement matériel garanti sous le capot via **iOS Keychain** (Secure Enclave) et **Android EncryptedSharedPreferences** (KeyStore hardware).
  - Aucun token ou secret stocké dans `AsyncStorage` non chiffré.

---

## 2. Conformité RGPD & Respect de la Vie Privée
- [x] **Droit à l'effacement / Droit à l'oubli (Article 17 du RGPD)** :
  - Endpoint dédié : `DELETE /auth/me` avec confirmation par mot de passe.
  - Action directe intégrée dans l'onglet **Sécurité** du profil mobile ("Zone de danger" avec alerte de confirmation native iOS/Android).
  - Cascade de nettoyage : suppression intégrale des sessions actives, du profil utilisateur, des préférences locales et détachement des appartenances (memberships).
  - Protection contre l'auto-destruction des comptes plateforme d'infrastructure (`super_admin`).
- [x] **Minimisation des données (Article 5 du RGPD)** :
  - Seules les données strictes de profil public (nom, prénom, bio facultative, couleur avatar) sont persistées.
  - Aucune télémétrie invasive ou tracker tiers non consenti n'est injecté.

---

## 3. Contrôle d'Accès & Cloisonnement Multi-Tenant
- [x] **Contrôle d'accès basé sur les rôles (RBAC)** :
  - Hiérarchie stricte : `LECTEUR` < `REDACTEUR` < `ADMIN` < `SUPER_ADMIN`.
  - Décorateurs `@Roles(...)` et guards `@UseGuards(JwtAuthGuard, RolesGuard)` sur l'ensemble des endpoints sensibles.
- [x] **Isolation Multi-Tenancy (Journaux Locaux)** :
  - Chaque commune / journal local dispose de son propre périmètre d'édition.
  - `JournalAccessGuard` garantit qu'un rédacteur d'une commune ne peut ni visualiser les brouillons ni altérer les articles d'une autre commune.

---

## 4. Sécurité des Entrées, Anti-XSS & Anti-SQL Injection
- [x] **Validation stricte des entrées (Whitelisting)** :
  - `ValidationPipe` global NestJS avec `whitelist: true` et `forbidNonWhitelisted: true`.
  - Rejet automatique de tout paramètre inconnu ou payload manipulé (protection contre le *Mass Assignment*).
- [x] **Protection contre les injections SQL** :
  - Utilisation exclusive de l'ORM Prisma avec requêtes paramétrées et typées à 100%.
- [x] **Protection contre les attaques Cross-Site Scripting (XSS)** :
  - Nettoyage et assainissement systématique des contenus Markdown et HTML des articles via un validateur strict avant rendu.

---

## 5. Résilience Hors-Ligne & Robustesse Mobile (6 États UI)
- [x] **Stockage Hors-Ligne & Cache Dégradé** :
  - `OfflineService` : mise en cache persistante automatique des actualités par commune et gestion des favoris locaux.
  - En cas de perte de connectivité ou mode avion, l'application bascule automatiquement et de manière transparente sur les données chiffrées en cache sans crasher.
- [x] **6 États des Écrans de Données** :
  1. *Nominal* : Données fraîches chargées avec HeroCard cinématique et liste détaillée.
  2. *Chargement* : Skeletons shimmer non bloquants pendant l'attente serveur.
  3. *Vide* : Composant `EmptyState` avec visuel clair et action de retour ("Voir toutes les actualités").
  4. *Erreur* : Composant `ErrorState` avec bouton de reconnexion native `[🔄 Réessayer]` et retour haptique.
  5. *Total de ligne* : `DataCountBadge` affichant dynamiquement le nombre exact d'éléments et la pastille `⚡ Hors-ligne (cache)`.
  6. *Partiel / Refreshing* : `RefreshControl` natif pour un rafraîchissement silencieux sans gel de l'affichage.

---

## 6. Sécurité Conteneurisation & Déploiement (CI/CD)
- [x] **Dockerfile Multi-Stage Distroless (Stage 3)** :
  - L'image de production finale repose sur l'image minimale `gcr.io/distroless/nodejs`.
  - Ne contient **aucun shell** (`/bin/sh`, `/bin/bash`), aucun gestionnaire de paquets (`apt`, `npm`, `yarn`), ni aucun utilitaire système (`curl`, `wget`, `netcat`).
  - Toute tentative d'exécution de commande arbitraire par injection ou escalade est neutralisée dès la conception.
- [x] **Déploiement Blue/Green Zero-Downtime** :
  - Déploiement automatisé avec healthcheck `/health` avant bascule de trafic pour éliminer tout risque d'interruption de service.
