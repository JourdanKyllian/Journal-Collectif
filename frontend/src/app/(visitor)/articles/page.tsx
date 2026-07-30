"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Search, X, CalendarDays, LucideIcon } from "lucide-react";
import ArticleCard from "@/components/features/ArticleCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchApi } from "@/lib/api";
import { getCategoryUI, formatDateToFrench, generateSlug, calculateReadTime } from "@/lib/formatters";

interface RawArticle {
  id: number;
  title?: string;
  titre?: string;
  excerpt?: string;
  content?: string;
  contenu?: string;
  categorie?: string | { libelle?: string };
  publishedAt?: string;
  published_at?: string;
  createdAt?: string;
}

interface BackendCategorie {
  id: number;
  libelle: string;
  icon: string;
}

interface ArticleUI {
  id: number;
  title: string;
  excerpt: string;
  categorie: string;
  categorieSlug: string;
  date: string;
  dateIso: string;
  readTime: string;
  icon: LucideIcon;
  gradientClass: string;
  href?: string;
}

interface FilterCategorie {
  id: string;
  label: string;
}

function DateRangePicker({
  from, to, onFromChange, onToChange, onClear,
}: {
  from: string; to: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  onClear: () => void;
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

/**
 * Page répertoriant tous les articles.
 * Gère le filtrage côté client par catégorie, recherche textuelle et plage de dates.
 */
export default function ArticlesPage() {
  const [articles, setArticles] = useState<ArticleUI[]>([]);
  const [categorieFilters, setCategorieFilters] = useState<FilterCategorie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [search, setSearch] = useState("");
  const [categorie, setCategorie] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [rawArticles, rawCategories] = await Promise.all([
          fetchApi<RawArticle[]>('/v1/article/published'),
          fetchApi<BackendCategorie[]>('/v1/categorie')
        ]);

        const formattedCategories: FilterCategorie[] = [
          { id: "all", label: "Tous" },
          ...rawCategories.map(cat => ({
            id: generateSlug(cat.libelle),
            label: `${cat.icon} ${cat.libelle}`
          }))
        ];
        setCategorieFilters(formattedCategories);

        const formattedArticles: ArticleUI[] = rawArticles.map((item) => {
          const categorieName = typeof item.categorie === 'object' && item.categorie !== null 
            ? (item.categorie as { libelle?: string }).libelle || 'Annonces' 
            : item.categorie || 'Annonces';
          
          const uiStyles = getCategoryUI(categorieName);
          const rawDate = item.publishedAt || item.published_at || item.createdAt || Date.now();
          const pubDate = new Date(rawDate);

          const titleText = item.title || item.titre || '';
          const bodyText = item.excerpt || item.content || item.contenu || '';

          return {
            id: item.id,
            title: titleText,
            excerpt: bodyText.length > 100 ? bodyText.substring(0, 100) + '...' : bodyText, 
            categorie: categorieName,
            categorieSlug: uiStyles.slug,
            date: formatDateToFrench(pubDate),
            dateIso: pubDate.toISOString().split('T')[0],
            readTime: calculateReadTime(bodyText), 
            icon: uiStyles.icon,
            gradientClass: uiStyles.gradient,
            href: `/articles/${item.id}`,
          };
        });

        setArticles(formattedArticles);
      } catch (error) {
        console.error("Erreur lors de la récupération des données:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const filtered = useMemo(() => {
    const sorted = [...articles].sort(
      (a, b) => new Date(b.dateIso).getTime() - new Date(a.dateIso).getTime()
    );

    return sorted.filter((article) => {
      if (categorie !== "all" && article.categorieSlug !== categorie) return false;

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (!article.title.toLowerCase().includes(q) && !article.excerpt.toLowerCase().includes(q)) return false;
      }

      if (dateFrom && article.dateIso < dateFrom) return false;
      if (dateTo && article.dateIso > dateTo) return false;

      return true;
    });
  }, [articles, search, categorie, dateFrom, dateTo]);

  const clearAll = useCallback(() => {
    setSearch(""); setCategorie("all"); setDateFrom(""); setDateTo("");
  }, []);

  const hasActiveFilter = search || categorie !== "all" || dateFrom || dateTo;

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
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-24 rounded-full" />
                ))
              ) : (
                categorieFilters.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategorie(cat.id)}
                    aria-pressed={categorie === cat.id}
                    className={`
                      font-montserrat font-bold text-sm px-5 py-2 rounded-full transition-all
                      ${categorie === cat.id
                        ? "bg-or text-noir shadow-md"
                        : "bg-champagne/20 text-noir hover:bg-or/70 hover:text-noir"}
                    `}
                  >
                    {cat.label}
                  </button>
                ))
              )}
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
              ? "Recherche des archives..." 
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-blanc border border-champagne/30 rounded-2xl overflow-hidden shadow-sm">
                <Skeleton className="h-44 w-full rounded-none" />
                <div className="p-5 space-y-4">
                  <Skeleton className="h-5 w-3/4" />
                  <div className="space-y-2">
                    <Skeleton className="h-3.5 w-full" />
                    <Skeleton className="h-3.5 w-5/6" />
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </div>
            ))}
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
