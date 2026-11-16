# 🎓 Guide Complet de Soutenance & Dossier d'Évaluation (10 min)

Ce document fournit l'ensemble des éléments exigés par le barème officiel du **Projet Final - Évaluation Mobile** (Collectif Territorial / Journal Local).

---

## ⏱️ Déroulé Officiel de la Soutenance (10 minutes, Seul)
| Durée | Phase | Objectif |
| :--- | :--- | :--- |
| **5 min 00 s** | **Démo sur un vrai téléphone** | Parcours fluide : Connexion, géoloc, notifications, offline, profil, 5 états UI |
| **3 min 00 s** | **Revue technique** | Architecture globale, données et règles d'accès (Multi-tenancy & Sécurité) |
| **2 min 00 s** | **Questions du jury** | Justification des décisions (Docker Distroless, RGPD, choix techniques) |

---

## 📱 Partie 1 : Script de Démo Chronométré (5 minutes)

> [!TIP]
> **Conseil pratique pour la démo** : Mettez votre téléphone en luminosité haute et activez le mode "Ne pas déranger".

### [00:00 - 01:00] 1. Connexion & Règles d'accès (2 comptes de rôles distincts)
1. **Lancement de l'application** : Montrer le splash screen et l'accueil.
2. **Connexion Compte 1 (Citoyen / Lecteur)** :
   - Ouvrir la modal de connexion (`visiteur.complet@exemple.fr`).
   - Montrer l'accès aux actualités, signalement d'objets perdus et consultation des parkings en temps réel.
3. **Changement vers Compte 2 (Gérant / SuperAdmin)** :
   - Se reconnecter avec `superadmin@journal.fr`.
   - Montrer l'apparition du bandeau **« Studio d'Administration »** et l'accès aux écrans de modération réservés aux gestionnaires de la commune.

### [01:00 - 02:00] 2. Les 2 Fonctionnalités du Téléphone (Position & Notifications)
1. **Position géographique (GPS / Haversine)** :
   - Montrer le bandeau `DetectedCityBanner` (« Vous semblez être à Châlons-en-Champagne ») calculé en direct par rapport aux coordonnées du centre-ville.
   - Ouvrir le sélecteur de commune (`CitySelectorSheet`) et changer d'édition pour montrer l'isolation multi-tenant.
2. **Notifications & Alertes Mairie** :
   - Déclencher ou pointer le bandeau d'alerte travaux/urgence de la mairie sous le header (`AlertBanner`).

### [02:00 - 03:15] 3. Les 5 États des Écrans de Données & La Feature Offline
1. **État 1 (Contenu nominal)** : Montrer la `HeroCard` cinématique avec image plein format et la liste des articles.
2. **État 2 (Chargement)** : Lors du changement de filtre, observer les skeletons shimmer non bloquants (`ArticleCardSkeleton`).
3. **État 3 (Vide)** : Sélectionner une catégorie sans article pour faire apparaître l'animation `EmptyState` et le bouton d'action contextuel.
4. **État 4 (Erreur)** : Montrer le composant `ErrorState` avec bouton `[🔄 Réessayer]` et retour haptique.
5. **État 5 (Hors-ligne / Cache)** :
   - Mettre 2 articles en favoris via le bouton marque-page.
   - Basculer le téléphone en **Mode Avion**.
   - Tirer vers le bas (pull-to-refresh) : le badge bascule instantanément en `⚡ Hors-ligne (cache)` et la pilule **« ⭐ Favoris »** permet de lire les articles stockés dans le trousseau sécurisé (`SecureStore`).
   - Désactiver le Mode Avion pour rétablir la connexion.

### [03:15 - 04:15] 4. Profil Personnalisé, Switchs & Mode Sombre
1. **Onglet Profil & Statistiques** : Montrer les 2 compteurs réels (nombre de contributions et édition communale active).
2. **Onglet Identité** : Montrer les champs textuels modifiables (Nom, Prénom, Bio /250) et le sélecteur de couleur d'avatar.
3. **Onglet Préférences & 2 Switchs** :
   - **Switch 1 : Alertes Mairie** (vibration haptique + Toast confirmation).
   - **Switch 2 : Mode Sombre** -> bascule instantanée de toute l'application en thème sombre.

### [04:15 - 05:00] 5. Sécurité, RGPD & Clôture
1. **Modal Politique de Confidentialité** : Ouvrir la politique RGPD rédigée en 4 articles.
2. **Droit à l'effacement** : Pointer la zone de danger dans l'onglet Sécurité avec le bouton `Supprimer mon compte` et l'alerte native de confirmation.

---

## 📑 Partie 2 : Les 5 Slides de Retour Technique (3 minutes)

```
┌────────────────────────────────────────────────────────────────────────┐
│ SLIDE 1 : ARCHITECTURE GLOBALE & STACK                                 │
├────────────────────────────────────────────────────────────────────────┤
│ • Mobile : React Native 0.86, Expo SDK 57, Expo Router (Filesystem)    │
│ • Backend : NestJS modulaire, Node.js 22 LTS, Prisma ORM               │
│ • Base de données : PostgreSQL hébergé chez Supabase                   │
│ • Architecture Multi-Tenant : Isolation stricte par commune (Tenants) │
│ • Performance : Shimmer Skeleton, Reanimated 4, Fast Image Caching     │
└────────────────────────────────────────────────────────────────────────┘
```

```
┌────────────────────────────────────────────────────────────────────────┐
│ SLIDE 2 : SÉCURITÉ MATÉRIELLE, AUTH & RGPD                             │
├────────────────────────────────────────────────────────────────────────┤
│ • Stockage chiffré matériel : expo-secure-store (Keychain / KeyStore)  │
│ • Sessions : Access Token JWT 15 min + Refresh Token révocable         │
│ • Droit à l'effacement (Art. 17 RGPD) : DELETE /auth/me en cascade     │
│ • Validation zéro-confiance : class-validator whitelist + anti-XSS     │
│ • Mots de passe salés bcrypt coût 10, protection brute-force Throttler │
└────────────────────────────────────────────────────────────────────────┘
```

```
┌────────────────────────────────────────────────────────────────────────┐
│ SLIDE 3 : OFFLINE-FIRST & GESTION DES 6 ÉTATS UI                       │
├────────────────────────────────────────────────────────────────────────┤
│ • OfflineService : Cache persistant par commune + Favoris chiffrés     │
│ • Dégradation gracieuse : Si offline -> Bascule transparente sur cache │
│ • 6 états obligatoires respectés sur chaque flux de données :          │
│   1. Nominal  2. Loading skeleton  3. EmptyState  4. ErrorState (Retry)│
│   5. Total ligne (DataCountBadge)  6. Rafraîchissement silencieux      │
└────────────────────────────────────────────────────────────────────────┘
```

```
┌────────────────────────────────────────────────────────────────────────┐
│ SLIDE 4 : CONTENEURISATION DISTROLESS & CI/CD ZERO-DOWNTIME            │
├────────────────────────────────────────────────────────────────────────┤
│ • Dockerfile Stage 3 : gcr.io/distroless/nodejs (0 shell, 0 package)   │
│ • Surface d'attaque réduite de 95% : Impossible d'exécuter un binaire  │
│ • Déploiement Blue/Green : Bascule de trafic après validation /health  │
│ • Intégrité automatisée : Pre-commit Husky + lint + 231 tests unitaires│
└────────────────────────────────────────────────────────────────────────┘
```

```
┌────────────────────────────────────────────────────────────────────────┐
│ SLIDE 5 : BILAN TECHNIQUE, APPRENTISSAGES & PERSPECTIVES               │
├────────────────────────────────────────────────────────────────────────┤
│ • Réussites : App native fluide, zéro crash, 100% TypeScript strict    │
│ • Défis relevés : Gestion fine du cycle de vie React 19 et du cache    │
│ • Ce qu'on a appris : L'importance d'un contrat d'interface strict DRY │
│ • Perspectives futures : Notifications push géofencées, mode PWA       │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 📄 Partie 3 : Fiche de Synthèse 1/2 A4 (À Joindre au Jury)

### Projet : Journal Collectif Territorial
**Développeur** : Kyllian Jourdan  
**Stack** : Expo SDK 57 (React Native 0.86), NestJS, PostgreSQL Supabase, Docker Distroless.

#### 1. Justification des Choix Techniques
- **Expo SDK 57 + Expo Router** : Approche unifiée pour naviguer par URLs typées, réduisant le boilerplate et garantissant une compatibilité native iOS et Android.
- **Sécurité Matérielle (SecureStore)** : Aucun token ni secret n'est conservé dans un stockage non chiffré (`AsyncStorage` proscrit). Le trousseau matériel (iOS Keychain et Android EncryptedSharedPreferences) garantit l'inviolabilité des sessions.
- **Conformité RGPD native** : Implémentation complète de la suppression de compte (`DELETE /auth/me`) avec purge des sessions et détachement des appartenances.
- **Résilience Offline-First** : Cache local par commune et persistance des favoris. L'utilisateur peut consulter ses actualités et services dans les zones blanches ou en transport sans interruption.

#### 2. Couverture de Tests & Métriques de Qualité
- **Tests unitaires Mobile** : 12 tests Jest passés avec succès (Distance Haversine, OfflineService, Affluence Parking, Cohérence des thèmes).
- **Tests unitaires Backend** : 219 tests Jest passés avec succès (Auth, RBAC, Multi-tenancy, Sanitization XSS, HealthCheck).
- **TypeScript & Linter** : 0 erreur de typage (`tsc --noEmit`), 0 warning ESLint (`expo lint`).

---

## ❓ Partie 4 : Anticipation des Questions du Jury (2 minutes)

1. **Q : Pourquoi avoir choisi NestJS plutôt que de requêter directement Supabase depuis le mobile ?**
   - *R* : Pour maîtriser entièrement la logique métier, le multi-tenancy et la sécurité. Le backend NestJS sert de passerelle d'assainissement (anti-XSS, validation DTO, journalisation d'audit) et permet de basculer de fournisseur de base de données à tout moment sans réécrire l'application mobile.

2. **Q : Comment fonctionne la synchronisation hors-ligne si l'utilisateur modifie ses favoris en mode avion ?**
   - *R* : Les favoris sont stockés localement dans le stockage chiffré sécurisé de l'appareil. Dès que l'utilisateur ajoute ou retire un favori, l'état local et la mémoire sont mis à jour instantanément sans nécessiter d'appel réseau bloquant.

3. **Q : Pourquoi avoir opté pour une image Docker Distroless en production ?**
   - *R* : Une image Distroless ne contient ni shell (`/bin/sh`), ni gestionnaire de paquets (`apt`, `npm`). Si une faille RCE (Remote Code Execution) existait dans une dépendance tierce, l'attaquant ne pourrait exécuter aucune commande système ni télécharger d'outil malveillant.
