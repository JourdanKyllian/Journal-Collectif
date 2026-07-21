"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  Search, X, CalendarDays,
  Palette, HardHat, Trophy,
  Megaphone, Siren, PartyPopper, Building2,
  LucideIcon, BookOpen
} from "lucide-react";
import ArticleCard from "@/components/features/ArticleCard";
import { Input }   from "@/components/ui/input";
import { Button }  from "@/components/ui/button";
import { fetchApi } from "@/lib/api";

type Category =
  | "all"
  | "culture"
  | "sport"
  | "travaux"
  | "faits-divers"
  | "evenements"
  | "annonces"
  | "politique";

interface RawArticle {
  id: number;
  title?: string;
  titre?: string;
  excerpt?: string;
  content?: string;
  contenu?: string;
  category?: string | { libelle?: string };
  publishedAt?: string;
  published_at?: string;
  createdAt?: string;
}

/**
 * Contrat d'interface pour l'affichage UI des articles.
 * Mappe les données brutes de l'API vers les besoins visuels (icônes, Tailwind).
 */
interface ArticleUI {
  id:            number;
  title:         string;
  excerpt:       string;
  category:      string;
  categorySlug:  Category;
  date:          string;
  dateIso:       string;
  readTime:      string;
  icon:          LucideIcon;
  gradientClass: string;
}

/**
 * Associe dynamiquement une catégorie BDD à ses propriétés UI.
 * Inclut une normalisation pour prévenir les erreurs de saisie côté back-office.
 */
const mapCategoryToUI = (categoryName: string): { slug: Category, icon: LucideIcon, gradient: string } => {
  const normalized = categoryName.toLowerCase().trim();
  
  if (normalized.includes("culture")) return { slug: "culture", icon: Palette, gradient: "bg-linear-to-br from-vert to-noir" };
  if (normalized.includes("travaux")) return { slug: "travaux", icon: HardHat, gradient: "bg-linear-to-br from-vert/80 to-vert" };
  if (normalized.includes("sport")) return { slug: "sport", icon: Trophy, gradient: "bg-linear-to-br from-noir to-vert" };
  if (normalized.includes("annonce")) return { slug: "annonces", icon: Megaphone, gradient: "bg-linear-to-br from-noir/90 to-vert/60" };
  if (normalized.includes("divers") || normalized.includes("alerte")) return { slug: "faits-divers", icon: Siren, gradient: "bg-linear-to-br from-vert to-noir/90" };
  if (normalized.includes("evénement") || normalized.includes("evenement")) return { slug: "evenements", icon: PartyPopper, gradient: "bg-linear-to-br from-noir to-vert/80" };
  if (normalized.includes("politique") || normalized.includes("mairie")) return { slug: "politique", icon: Building2, gradient: "bg-linear-to-br from-vert/70 to-noir" };
  
  return { slug: "annonces", icon: BookOpen, gradient: "bg-linear-to-br from-champagne/80 to-noir" };
};

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

/**
 * Sélecteur de période chronologique natif.
 * Privilégie <input type="date"> pour maximiser l'accessibilité sans dépendance externe.
 */
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
    <div className="flex items-center gap-2 flex-wrap" role="group" aria-label="Filtrer par période">
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
        />
      </div>
      {hasRange && (
        <button
          onClick={onClear}
          className="flex items-center gap-1 text-xs font-montserrat font-semibold text-champagne hover:text-noir transition-colors px-2 py-1"
        >
          <X size={14} /> Effacer dates
        </button>
      )}
    </div>
  );
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<ArticleUI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [search,      setSearch]      = useState("");
  const [category,    setCategory]    = useState<Category>("all");
  const [dateFrom,    setDateFrom]    = useState("");
  const [dateTo,      setDateTo]      = useState("");

  useEffect(() => {
    const loadArticles = async () => {
      try {
        setIsLoading(true);
        const rawArticles = await fetchApi<RawArticle[]>('/v1/article/published');
        
        const formattedArticles: ArticleUI[] = rawArticles.map((item) => {
          const categoryName = typeof item.category === 'object' && item.category !== null 
            ? (item.category as { libelle?: string }).libelle || 'Annonces' 
            : item.category || 'Annonces';
          
          const uiStyles = mapCategoryToUI(categoryName);
          const rawDate = item.publishedAt || item.published_at || item.createdAt || Date.now();
          const pubDate = new Date(rawDate);

          const titleText = item.title || item.titre || '';
          const bodyText = item.excerpt || item.content || item.contenu || '';

          return {
            id: item.id,
            title: titleText,
            excerpt: bodyText.length > 100 ? bodyText.substring(0, 100) + '...' : bodyText, 
            category: categoryName,
            categorySlug: uiStyles.slug,
            date: pubDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }),
            dateIso: pubDate.toISOString().split('T')[0],
            readTime: "3 min", 
            icon: uiStyles.icon,
            gradientClass: uiStyles.gradient,
          };
        });

        setArticles(formattedArticles);
      } catch (error) {
        console.error("Erreur lors de la récupération des articles:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadArticles();
  }, []);

  const filtered = useMemo(() => {
    const sorted = [...articles].sort(
      (a, b) => new Date(b.dateIso).getTime() - new Date(a.dateIso).getTime()
    );

    return sorted.filter((article) => {
      if (category !== "all" && article.categorySlug !== category) return false;

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (
          !article.title.toLowerCase().includes(q) &&
          !article.excerpt.toLowerCase().includes(q)
        ) return false;
      }

      if (dateFrom && article.dateIso < dateFrom) return false;
      if (dateTo   && article.dateIso > dateTo)   return false;

      return true;
    });
  }, [articles, search, category, dateFrom, dateTo]);

  const clearAll = useCallback(() => {
    setSearch(""); setCategory("all"); setDateFrom(""); setDateTo("");
  }, []);

  const hasActiveFilter = search || category !== "all" || dateFrom || dateTo;

  return (
    <div className="w-full">
      <header className="bg-linear-to-br from-vert to-noir py-14 px-6 text-center">
        <h1 className="font-poppins font-black text-4xl text-blanc mb-3">
          La <span className="text-or">Presse</span>
        </h1>
        <p className="font-raleway text-blanc/70 text-lg">
          Toute l&apos;actualité de Châlons — recherchez, filtrez, explorez
        </p>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <section aria-label="Filtres de recherche" className="space-y-4 mb-10">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            
            <div className="relative flex-1 min-w-0">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-champagne pointer-events-none" />
              <Input
                id="article-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un article..."
                className="pl-11 h-12 border-champagne/40 rounded-xl font-montserrat text-sm bg-blanc focus-visible:border-or focus-visible:ring-or/20"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-champagne hover:text-noir transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <DateRangePicker
              from={dateFrom}
              to={dateTo}
              onFromChange={setDateFrom}
              onToChange={setDateTo}
              onClear={() => { setDateFrom(""); setDateTo(""); }}
            />
          </div>

          <div className="flex gap-2 flex-wrap items-center">
            <div role="group" className="flex gap-2 flex-wrap">
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

            {hasActiveFilter && (
              <button
                onClick={clearAll}
                className="flex items-center gap-1.5 font-montserrat font-semibold text-xs text-red-500 hover:text-red-700 transition-colors ml-1 px-2 py-1"
              >
                <X size={14} /> Tout effacer
              </button>
            )}
          </div>
        </section>

        <div className="mb-5 flex items-center justify-between flex-wrap gap-2">
          <p className="font-montserrat text-sm text-champagne">
            {isLoading 
              ? "Chargement en cours..." 
              : filtered.length === 0
                ? "Aucun article trouvé"
                : `${filtered.length} article${filtered.length > 1 ? "s" : ""} trouvé${filtered.length > 1 ? "s" : ""}`
            }
          </p>
          <p className="font-montserrat text-xs text-champagne/70">
            Triés du plus récent au plus ancien
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-or"></div>
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((article) => (
              <ArticleCard key={article.id} {...article} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-champagne/5 rounded-2xl border border-champagne/20">
            <Search size={40} className="text-champagne/40 mx-auto mb-4" />
            <h2 className="font-montserrat font-bold text-lg text-noir mb-2">Aucun résultat</h2>
            <p className="font-montserrat text-sm text-champagne mb-6">Essayez d&apos;autres mots-clés ou modifiez les filtres.</p>
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