# 📱 Collectif Territorial - Journal Local & Services Citoyens

Plateforme territoriale citoyenne multi-tenant composée d'une **application mobile native (Expo SDK 57 / React Native 0.86)**, d'un **backend modulaire (NestJS 11 / Node 22 LTS / Prisma)** et d'une base de données **PostgreSQL hébergée sur Supabase**.

---

## 🚀 1. Installation & Démarrage Rapide

### Prérequis
- Node.js version 20 ou 22 LTS
- npm version 10+
- Expo Go ou Xcode (iOS) / Android Studio (Android) pour l'exécution mobile

### Application Mobile (`/mobile`)
```bash
# Se déplacer dans le dossier mobile
cd mobile

# Installer les dépendances
npm install

# Lancer le serveur de développement Expo
npm run start

# Exécuter sur simulateur ou téléphone
npm run ios       # Lancement sur iOS (Xcode / simulateur)
npm run android   # Lancement sur Android

# Lancer la suite de tests (Unitaires, Composants & E2E)
npm test

# Vérifications de qualité de code
npm run typecheck # Validation stricte TypeScript (0 erreur)
npm run lint      # Validation ESLint Expo
```

### Backend d'API (`/backend`)
```bash
cd backend
npm install
npm run start:dev

# Lancer les tests unitaires et d'intégration backend (219 tests)
npm test
```

---

## 🏛️ 2. Architecture du Projet

Le projet suit une architecture modulaire découplée et sécurisée par conception :

```
Journal-Collectif/
├── mobile/                   # Application Mobile React Native (Expo SDK 57)
│   ├── src/
│   │   ├── app/              # Navigation par fichiers (Expo Router)
│   │   ├── components/       # Composants UI réutilisables (DRY)
│   │   ├── context/          # Contextes globaux (Auth, City Multi-Tenant, Theme)
│   │   ├── lib/services/     # Services métier (Location, Offline, Feed, Parking)
│   │   ├── theme/            # Tokens de design (Couleurs, Typographies, Thèmes)
│   │   └── __tests__/        # Tests unitaires, composants & E2E
│   └── jest.config.js        # Configuration du runner Jest
├── backend/                  # API REST modulaire NestJS
│   ├── src/                  # Modules métier (Auth, Article, Tenant, Parking...)
│   └── Dockerfile            # Dockerfile multi-stage Distroless Stage 3
└── docs/                     # Dossier d'évaluation & documentation
    ├── ARCHITECTURE_DECISIONS.md  # Justification détaillée des choix techniques
    ├── SECURITY_CHECKLIST.md      # Checklist sécurité & conformité RGPD
    ├── AGENTS.md                  # Documentation IA (prompts, skills, MCP, méthode)
    └── SOUTENANCE_GUIDE.md        # Script de démo (5 min), slides et synthèse
```

---

## ⚙️ 3. Choix Techniques & Décisions Clés

- **Expo SDK 57 & Expo Router** : Navigation typée par système de fichiers, réduisant le boilerplate et garantissant la parité native iOS/Android.
- **Sécurité Matérielle (SecureStore)** : Les sessions et favoris sont chiffrés sur le matériel via iOS Keychain (Secure Enclave) et Android Keystore.
- **Architecture Offline-First & 5 États UI** : Mise en cache locale automatique par commune. Tous les écrans de flux gèrent les 5 états obligatoires : *Contenu*, *Chargement* (Skeleton), *Vide* (`EmptyState`), *Erreur* (`ErrorState` avec bouton Réessayer), et *Hors-ligne* (Pastille dégradée).
- **Conformité RGPD** : Droit à l'effacement direct (`DELETE /auth/me`), modal dédiée de politique de confidentialité et minimisation stricte des données.
- **Docker Distroless en Production** : Image finale sans shell (`/bin/sh`) ni gestionnaire de paquets pour réduire la surface d'attaque de 95%.
- **Déploiement Blue/Green Zero-Downtime** : Bascule de trafic orchestrée après validation de l'endpoint `/health`.

---

## 📚 4. Liens Utiles & Documentation d'Évaluation

- [Choix d'Architecture Détaillés](docs/ARCHITECTURE_DECISIONS.md)
- [Checklist de Sécurité & RGPD](docs/SECURITY_CHECKLIST.md)
- [Documentation IA (AGENTS.md)](docs/AGENTS.md)
- [Guide de Soutenance & Script Chronométré](docs/SOUTENANCE_GUIDE.md)
