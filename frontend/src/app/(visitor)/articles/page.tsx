"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Search, X, CalendarDays,
  Palette, HardHat, Trophy,
  Megaphone, Siren, PartyPopper, Building2,
  LucideIcon
} from "lucide-react";
import ArticleCard from "@/components/features/ArticleCard";
import { Input }   from "@/components/ui/input";
import { Button }  from "@/components/ui/button";

// ── Types ────────────────────────────────────────────────────
type Category =
  | "all"
  | "culture"
  | "sport"
  | "travaux"
  | "faits-divers"
  | "evenements"
  | "annonces"
  | "politique";

interface ArticleMock {
  id:            number;
  title:         string;
  excerpt:       string;
  category:      string;
  categorySlug:  Category;
  date:          string;
  dateIso:       string;   // YYYY-MM-DD — pour le tri et le filtre date
  readTime:      string;
  icon:          LucideIcon;
  gradientClass: string;
}

// ── Données mock (triées du + récent au + ancien) ────────────
// Remplacer par :
//   const res = await fetchApi<ArticleMock[]>('/articles?sort=publishedAt:desc')
const ALL_ARTICLES: ArticleMock[] = [
  { id: 1, title: "Festival d'Été 2026 : Programme complet dévoilé",         excerpt: "Trois jours de concerts, expositions et animations pour toute la famille...", category: "Culture",          categorySlug: "culture",     date: "15 fév. 2026", dateIso: "2026-02-15", readTime: "3 min",  icon: Palette,   gradientClass: "bg-linear-to-br from-vert to-noir"     },
  { id: 2, title: "Rénovation Route Nationale : fermeture jusqu'au 28 fév.", excerpt: "Des déviations sont mises en place. Voici les itinéraires conseillés...",     category: "Travaux",          categorySlug: "travaux",     date: "14 fév. 2026", dateIso: "2026-02-14", readTime: "2 min",  icon: HardHat,   gradientClass: "bg-linear-to-br from-vert/80 to-vert"  },
  { id: 3, title: "Victoire de l'équipe locale en demi-finale régionale",     excerpt: "Un match remporté 3-1 dans une ambiance électrisante au stade...",            category: "Sport",            categorySlug: "sport",       date: "13 fév. 2026", dateIso: "2026-02-13", readTime: "4 min",  icon: Trophy,    gradientClass: "bg-linear-to-br from-noir to-vert"     },
  { id: 4, title: "Conseil municipal — Compte-rendu séance du 10 fév.",       excerpt: "Budget 2026 voté, nouveau plan de mobilité douce approuvé...",               category: "Annonces",         categorySlug: "annonces",    date: "12 fév. 2026", dateIso: "2026-02-12", readTime: "5 min",  icon: Megaphone, gradientClass: "bg-linear-to-br from-noir/90 to-vert/60"},
  { id: 5, title: "Alerte météo : fortes pluies attendues ce week-end",       excerpt: "La préfecture recommande d'éviter les déplacements non essentiels...",       category: "Faits divers",     categorySlug: "faits-divers",date: "11 fév. 2026", dateIso: "2026-02-11", readTime: "2 min",  icon: Siren,     gradientClass: "bg-linear-to-br from-vert to-noir/90"  },
  { id: 6, title: "Marché de printemps — Inscriptions 2026 ouvertes",         excerpt: "La municipalité lance les inscriptions pour l'édition 2026...",              category: "Événements",       categorySlug: "evenements",  date: "10 fév. 2026", dateIso: "2026-02-10", readTime: "3 min",  icon: PartyPopper,gradientClass: "bg-linear-to-br from-noir to-vert/80"  },
  { id: 7, title: "Élections municipales partielles — Dates annoncées",       excerpt: "La préfecture confirme les dates du prochain scrutin pour le 14e arrond...", category: "Politique & Mairie",categorySlug: "politique",   date: "9 fév. 2026",  dateIso: "2026-02-09", readTime: "4 min",  icon: Building2, gradientClass: "bg-linear-to-br from-vert/70 to-noir"  },
  { id: 8, title: "Nouveau complexe sportif — Inauguration le 1er mars",      excerpt: "L'équipement accueillera football, basketball et salle de fitness...",       category: "Sport",            categorySlug: "sport",       date: "8 fév. 2026",  dateIso: "2026-02-08", readTime: "3 min",  icon: Trophy,    gradientClass: "bg-linear-to-br from-noir to-vert"     },
  { id: 9, title: "Plan de mobilité douce — Consultation citoyenne ouverte",  excerpt: "La mairie invite les habitants à donner leur avis sur le réseau cyclable...", category: "Politique & Mairie",categorySlug: "politique",  date: "7 fév. 2026",  dateIso: "2026-02-07", readTime: "6 min",  icon: Building2, gradientClass: "bg-linear-to-br from-vert/70 to-noir"  },
];

// ── Catégories pour les filtres ──────────────────────────────
const CATEGORY_FILTERS: { id: Category; label: string }[] = [
  { id: "all",         label: "Tous"             },
  { id: "culture",     label: "🎭 Culture"       },
  { id: "sport",       label: "⚽ Sport"         },
  { id: "travaux",     label: "🏗️ Travaux"      },
  { id: "faits-divers",label: "🚨 Faits divers"  },
  { id: "evenements",  label: "🎉 Événements"    },
  { id: "annonces",    label: "📢 Annonces"      },
  { id: "politique",   label: "🏛️ Politique"    },
];

// ── Composant DateRange stylisé ──────────────────────────────
// Utilise les inputs natifs type="date" (pas de dépendances externes)
function DateRangePicker({
  from, to, onFromChange, onToChange, onClear,
}: {
  from: string; to: string;
  onFromChange: (v: string) => void;
  onToChange:   (v: string) => void;
  onClear:      () => void;
}) {
  const hasRange = from || to;
  return (
    <div
      className="flex items-center gap-2 flex-wrap"
      role="group"
      aria-label="Filtrer par période"
    >
      <div className="flex items-center gap-2 bg-blanc border border-champagne/40 rounded-xl px-3 py-2 focus-within:border-or focus-within:ring-2 focus-within:ring-or/10 transition-all">
        <CalendarDays size={16} className="text-champagne shrink-0" aria-hidden="true" />
        <label htmlFor="date-from" className="sr-only">Date de début</label>
        <input
          id="date-from"
          type="date"
          value={from}
          max={to || undefined}
          onChange={(e) => onFromChange(e.target.value)}
          className="font-montserrat text-sm text-noir bg-transparent outline-none cursor-pointer w-32"
          aria-label="Date de début"
        />
        <span className="text-champagne text-sm font-montserrat" aria-hidden="true">→</span>
        <label htmlFor="date-to" className="sr-only">Date de fin</label>
        <input
          id="date-to"
          type="date"
          value={to}
          min={from || undefined}
          onChange={(e) => onToChange(e.target.value)}
          className="font-montserrat text-sm text-noir bg-transparent outline-none cursor-pointer w-32"
          aria-label="Date de fin"
        />
      </div>
      {hasRange && (
        <button
          onClick={onClear}
          aria-label="Effacer le filtre de dates"
          className="flex items-center gap-1 text-xs font-montserrat font-semibold text-champagne hover:text-noir transition-colors px-2 py-1"
        >
          <X size={14} aria-hidden="true" /> Effacer dates
        </button>
      )}
    </div>
  );
}

// ── Page principale ──────────────────────────────────────────
export default function ArticlesPage() {
  const [search,      setSearch]      = useState("");
  const [category,    setCategory]    = useState<Category>("all");
  const [dateFrom,    setDateFrom]    = useState("");
  const [dateTo,      setDateTo]      = useState("");

  // ── Filtre + tri ──────────────────────────────────────────
  const filtered = useMemo(() => {
    // 1. Tri date DESC (le plus récent en premier)
    const sorted = [...ALL_ARTICLES].sort(
      (a, b) => new Date(b.dateIso).getTime() - new Date(a.dateIso).getTime()
    );

    return sorted.filter((article) => {
      // 2. Filtre catégorie
      if (category !== "all" && article.categorySlug !== category) return false;

      // 3. Filtre mot-clé (titre + excerpt)
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (
          !article.title.toLowerCase().includes(q) &&
          !article.excerpt.toLowerCase().includes(q)
        ) return false;
      }

      // 4. Filtre date
      if (dateFrom && article.dateIso < dateFrom) return false;
      if (dateTo   && article.dateIso > dateTo)   return false;

      return true;
    });
  }, [search, category, dateFrom, dateTo]);

  const clearAll = useCallback(() => {
    setSearch(""); setCategory("all"); setDateFrom(""); setDateTo("");
  }, []);

  const hasActiveFilter = search || category !== "all" || dateFrom || dateTo;

  return (
    <div className="w-full">
      {/* ── En-tête de page ─────────────────────────────────── */}
      <header className="bg-linear-to-br from-vert to-noir py-14 px-6 text-center">
        <h1 className="font-poppins font-black text-4xl text-blanc mb-3">
          La <span className="text-or">Presse</span>
        </h1>
        <p className="font-raleway text-blanc/70 text-lg">
          Toute l'actualité de Châlons — recherchez, filtrez, explorez
        </p>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* ── Barre de recherche & filtres ─────────────────── */}
        <section
          aria-label="Filtres de recherche"
          className="space-y-4 mb-10"
        >
          {/* Ligne 1 : Recherche + Dates */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            {/* Input recherche */}
            <div className="relative flex-1 min-w-0">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-champagne pointer-events-none"
                aria-hidden="true"
              />
              <Input
                id="article-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un article..."
                aria-label="Rechercher dans les articles"
                className="pl-11 h-12 border-champagne/40 rounded-xl font-montserrat text-sm bg-blanc focus-visible:border-or focus-visible:ring-or/20"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  aria-label="Effacer la recherche"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-champagne hover:text-noir transition-colors"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              )}
            </div>

            {/* Sélecteur de dates */}
            <DateRangePicker
              from={dateFrom}
              to={dateTo}
              onFromChange={setDateFrom}
              onToChange={setDateTo}
              onClear={() => { setDateFrom(""); setDateTo(""); }}
            />
          </div>

          {/* Ligne 2 : Chips catégories + bouton reset */}
          <div className="flex gap-2 flex-wrap items-center">
            <div
              role="group"
              aria-label="Filtrer par catégorie"
              className="flex gap-2 flex-wrap"
            >
              {CATEGORY_FILTERS.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  aria-pressed={category === cat.id}
                  className={`
                    font-montserrat font-bold text-sm px-5 py-2 rounded-full transition-all
                    ${category === cat.id
                      ? "bg-or text-noir shadow-md"
                      : "bg-champagne/20 text-noir hover:bg-or/70 hover:text-noir"}
                  `}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Bouton tout effacer */}
            {hasActiveFilter && (
              <button
                onClick={clearAll}
                aria-label="Effacer tous les filtres"
                className="flex items-center gap-1.5 font-montserrat font-semibold text-xs text-red-500 hover:text-red-700 transition-colors ml-1 px-2 py-1"
              >
                <X size={14} aria-hidden="true" /> Tout effacer
              </button>
            )}
          </div>
        </section>

        {/* ── Résultats ────────────────────────────────────── */}
        <div
          aria-live="polite"
          aria-atomic="true"
          className="mb-5 flex items-center justify-between flex-wrap gap-2"
        >
          <p className="font-montserrat text-sm text-champagne">
            {filtered.length === 0
              ? "Aucun article trouvé"
              : `${filtered.length} article${filtered.length > 1 ? "s" : ""} trouvé${filtered.length > 1 ? "s" : ""}`}
          </p>
          <p className="font-montserrat text-xs text-champagne/70">
            Triés du plus récent au plus ancien
          </p>
        </div>

        {filtered.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((article) => (
              <ArticleCard key={article.id} {...article} />
            ))}
          </div>
        ) : (
          /* État vide */
          <div className="text-center py-20 bg-champagne/5 rounded-2xl border border-champagne/20">
            <Search
              size={40}
              className="text-champagne/40 mx-auto mb-4"
              aria-hidden="true"
            />
            <h2 className="font-montserrat font-bold text-lg text-noir mb-2">
              Aucun résultat
            </h2>
            <p className="font-montserrat text-sm text-champagne mb-6">
              Essayez d'autres mots-clés ou modifiez les filtres.
            </p>
            <Button
              onClick={clearAll}
              className="bg-or text-noir font-montserrat font-bold px-6 py-2.5 rounded-xl hover:bg-or/90 transition-all"
            >
              Réinitialiser les filtres
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
