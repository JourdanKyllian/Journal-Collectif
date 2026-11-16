# 🎓 Guide Complet de Soutenance & Dossier d'Évaluation (10 min)

Ce document fournit l'ensemble des éléments exigés par le barème officiel du **Projet Final - Évaluation Mobile** (Collectif Territorial / Journal Local).

---

## ⏱️ Déroulé Officiel de la Soutenance (10 minutes)
| Durée | Phase | Objectif |
| :--- | :--- | :--- |
| **2 min 30 s** | **Démonstration live** | Parcours fluide sur téléphone (connexion, géoloc, offline, profil, 6 états) |
| **3 min 00 s** | **Retour technique** | Présentation des 5 slides techniques et choix d'architecture |
| **2 min 00 s** | **Questions du jury** | Justification des décisions (sécurité, conteneurisation, RGPD, multi-tenancy) |

---

## 📱 Partie 1 : Script de Démo Chronométré (2 min 30 s)

> [!TIP]
> **Conseil pratique pour la démo** : Mettez votre téléphone en luminosité haute et activez le mode "Ne pas déranger".

### [00:00 - 00:30] Introduction & Détection Intelligente du Territoire
1. **Lancement de l'application** : Montrer le splash screen et l'arrivée fluide sur le fil d'actualité de Châlons-en-Champagne.
2. **Détection de localisation** : Montrer le bandeau `DetectedCityBanner` (« Vous semblez être à Châlons-en-Champagne ») qui calcule la distance via l'algorithme d'Haversine.
3. **Changement d'édition** : Ouvrir le sélecteur de commune (`CitySelectorSheet`) et basculer sur une autre édition pour prouver le multi-tenancy.

### [00:30 - 01:05] Navigation, 6 États UI & Recherche
1. **Feed d'actualités** : Montrer la `HeroCard` cinématique avec l'image plein format et le dégradé.
2. **Total de lignes** : Pointer le badge `DataCountBadge` indiquant par ex. « 8 articles ».
3. **Filtres de catégories** : Cliquer sur les pills horizontales (Culture, Travaux, Événements).
4. **État vide** : Choisir une catégorie sans article pour faire apparaître l'animation `EmptyState` avec bouton d'action direct.
5. **Pull-to-Refresh** : Tirer vers le bas (`RefreshControl`) pour illustrer l'état rafraîchissement partiel sans blocage.

### [01:05 - 01:45] La Fonctionnalité Hors-Ligne (Offline First)
1. **Mise en favoris** : Touchez l'icône marque-page sur 2 articles différents (retour haptique immédiat).
2. **Filtre Favoris** : Cliquer sur la pilule **« ⭐ Favoris »** pour isoler les articles sauvegardés.
3. **Démonstration Mode Avion** :
   - Basculer le téléphone en **Mode Avion** (ou couper le Wi-Fi/données).
   - Rafraîchir l'écran : le badge bascule instantanément en `⚡ Hors-ligne (cache)`. Les articles restent parfaitement consultables grâce au cache local chiffré (`SecureStore`).
   - Rétablir la connexion réseau.

### [01:45 - 02:30] Profil, Personnalisation, Switchs & RGPD
1. **Onglet Profil** : Montrer les 2 statistiques réelles (contributions & édition active).
2. **Onglet Identité** : Montrer les champs modifiables (Prénom, Nom, Bio avec compteur /250) et la palette de sélection de la couleur d'avatar.
3. **Onglet Préférences** :
   - Actionner le **Switch 1 : Alertes Mairie** (vibration haptique + Toast contextuel).
   - Actionner le **Switch 2 : Mode Sombre** -> bascule instantanée de toute l'application en dark theme.
4. **Onglet Sécurité (RGPD)** :
   - Cliquer sur le lien **« Politique de confidentialité & RGPD »** (ouverture du modal avec les 4 articles de conformité).
   - Montrer la **Zone de Danger** avec le bouton rouge `Supprimer mon compte`. Cliquer pour faire apparaître l'alerte native de confirmation sécurisée.

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
