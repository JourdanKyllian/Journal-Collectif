# Instructions du Projet (Next.js 16 + Tailwind v4)

## Commandes de base
- **Dév :** `npm run dev` (utilise Turbopack par défaut)
- **Build :** `npm run build`
- **Lint :** `npm run lint`

## Stack Technique
- **Framework :** Next.js 16 (App Router)
- **Style :** Tailwind CSS v4 (Nouvelle syntaxe `@import "tailwindcss";` dans globals.css)
- **Composants UI :** Shadcn/ui (basé sur Radix UI)
- **Icônes :** Lucide React
- **Fonts :** Poppins (Titres), Montserrat (Texte/UI), Raleway (Accents)

## Règles de Style & Architecture
- **Composants :** - `src/components/ui/` pour les composants atomiques (shadcn).
  - `src/components/features/` pour les cartes métier (ex: `ArticleCard`, `LostObjectCard`).
  - `src/components/layout/` pour `Navbar` et `Footer`.
- **Tailwind v4 :** - Ne pas utiliser `tailwind.config.js` (tout est dans `globals.css`).
  - Utiliser les variables CSS thématiques : `--color-vert`, `--color-or`, `--color-noir`, `--color-champagne`, `--color-blanc`.
  - Préférer `bg-linear-to-br` pour les dégradés.
- **Types :** Toujours typer les props et les réponses API dans `src/lib/types.ts`.
- **Fetching :** Utiliser le wrapper `fetchApi` situé dans `src/lib/api.ts`.