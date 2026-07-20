import Link from "next/link";
import {
  ArrowRight,
  Palette, HardHat, Trophy,
  Megaphone, Siren, PartyPopper, Building2, BookOpen,
  LucideIcon
} from "lucide-react";
import ArticleCard from "@/components/features/ArticleCard";
import { Button }  from "@/components/ui/button";
import { fetchApi } from "@/lib/api";
import type { JSX } from "react";

/**
 * Determines the appropriate icon for a given category name.
 *
 * @param {string} categoryName - The name of the category.
 * @returns {LucideIcon} The corresponding Lucide React icon component.
 */
const getCategoryIcon = (categoryName: string): LucideIcon => {
  switch (categoryName?.toLowerCase()) {
    case 'culture': return Palette;
    case 'sport': return Trophy;
    case 'travaux': return HardHat;
    case 'faits divers': return Siren;
    case 'événements': return PartyPopper;
    case 'annonces': return Megaphone;
    case 'politique & mairie': return Building2;
    default: return BookOpen;
  }
};

/**
 * Returns a background gradient class based on the article's index.
 *
 * @param {number} index - The position index of the article in the list.
 * @returns {string} Tailwind CSS classes for the gradient background.
 */
const getGradientClass = (index: number): string => {
  const gradients = [
    "bg-linear-to-br from-vert to-noir",
    "bg-linear-to-br from-vert/80 to-vert",
    "bg-linear-to-br from-noir to-vert",
    "bg-linear-to-br from-noir/90 to-vert/60",
    "bg-linear-to-br from-vert to-noir/90",
    "bg-linear-to-br from-noir to-vert/80",
  ];
  return gradients[index % gradients.length];
};

/**
 * Calculates the estimated reading time for a given text based on a 225 words per minute average.
 *
 * @param {string} text - The content of the article.
 * @returns {string} The estimated reading time formatted as a string.
 */
const calculateReadTime = (text: string): string => {
  if (!text) return "1 min";
  const wordCount = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(wordCount / 225);
  return `${minutes} min`;
};

/**
 * Formats an ISO date string into a localized French date string.
 *
 * @param {string} isoDate - The ISO formatted date string.
 * @returns {string} The localized date string.
 */
const formatDate = (isoDate: string): string => {
  if (!isoDate) return "Date inconnue";
  const date = new Date(isoDate);
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
};

/**
 * Represents the article data structure retrieved from the backend API.
 *
 * @interface BackendArticle
 * @property {number} id - The unique identifier of the article.
 * @property {string} titre - The title of the article.
 * @property {string} contenu - The main body content of the article.
 * @property {string} published_at - The publication timestamp in ISO format.
 * @property {Object} [category] - The category relation object.
 * @property {string} category.libelle - The name of the category.
 */
interface BackendArticle {
  id: number;
  titre: string;
  contenu: string;
  published_at: string;
  category?: {
    libelle: string;
  };
}

/**
 * Server component rendering the homepage.
 * Fetches published articles from the backend API and maps them to the frontend format.
 *
 * @returns {Promise<JSX.Element>} The rendered homepage component.
 */
export default async function Home(): Promise<JSX.Element> {
  let latestArticles: any[] = [];

  try {
    const response = await fetchApi<BackendArticle[]>('/v1/article/published', {
      next: { revalidate: 60 }
    });

    latestArticles = response.slice(0, 6).map((article, index) => ({
      id: article.id,
      title: article.titre,
      excerpt: article.contenu ? article.contenu.substring(0, 100) + '...' : 'Pas de résumé disponible...',
      category: article.category?.libelle || 'Général',
      date: formatDate(article.published_at),
      dateIso: article.published_at,
      readTime: calculateReadTime(article.contenu),
      icon: getCategoryIcon(article.category?.libelle || ''),
      gradientClass: getGradientClass(index),
    }));
  } catch (error) {
    console.error("Erreur lors de la récupération des articles :", error);
    latestArticles = [];
  }

  const featuredArticle = latestArticles.length > 0 ? latestArticles[0] : null;

  return (
    <div className="w-full">
      <section
        className="bg-linear-to-br from-vert via-vert/90 to-noir pt-16 pb-24 px-6 relative overflow-hidden"
        aria-label="Présentation du journal"
      >
        <div
          className="absolute top-0 right-0 w-125 h-125 bg-or/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/4"
          aria-hidden="true"
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-16 bg-blanc"
          style={{ clipPath: "ellipse(55% 100% at 50% 100%)" }}
          aria-hidden="true"
        />

        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center relative z-10">
          <div>
            <span className="inline-block bg-or/20 border border-or/50 text-or font-poppins font-black text-xs px-4 py-1.5 rounded-full mb-5 tracking-wide">
              📰 Journal en ligne · Collectif Chalonnais
            </span>
            <h1 className="font-poppins font-black text-4xl md:text-5xl text-blanc leading-tight mb-5">
              L'actualité de<br />
              <span className="text-or">Châlons</span> en temps réel
            </h1>
            <p className="font-raleway text-blanc/80 text-lg leading-relaxed mb-8">
              Restez informés des événements, travaux, annonces et faits divers
              qui rythment la vie de votre commune.
            </p>
            <div className="flex gap-4 flex-wrap">
              <Link href="/articles" aria-label="Parcourir tous les articles du journal">
                <Button className="bg-or text-noir font-montserrat font-bold px-7 py-6 text-base rounded-xl transition-all hover:bg-or/90 hover:-translate-y-0.5 hover:shadow-lg shadow-or/30">
                  Parcourir les articles <ArrowRight size={18} className="ml-2" aria-hidden="true" />
                </Button>
              </Link>
              <Link href="/categories" aria-label="Voir toutes les catégories">
                <Button
                  variant="outline"
                  className="font-montserrat font-semibold text-blanc border-blanc/30 bg-transparent px-7 py-6 text-base rounded-xl transition-all hover:bg-blanc/10 hover:border-blanc hover:-translate-y-0.5"
                >
                  Voir les catégories
                </Button>
              </Link>
            </div>
          </div>

          {featuredArticle && (
            <div
              className="hidden md:block bg-blanc/5 border border-or/25 rounded-2xl p-7 backdrop-blur-md"
              aria-label="Article à la une"
            >
              <span className="inline-flex items-center gap-1.5 bg-or text-noir font-poppins font-black text-xs px-3 py-1 rounded-full mb-4">
                🔥 À la une
              </span>
              <h2 className="font-montserrat font-bold text-blanc text-xl leading-tight mb-3">
                {featuredArticle.title}
              </h2>
              <p className="font-raleway text-blanc/70 text-sm leading-relaxed mb-5">
                {featuredArticle.excerpt}
              </p>
              <div className="flex gap-4 text-xs text-champagne font-montserrat">
                <span className="flex items-center gap-1">
                  <featuredArticle.icon size={14} aria-hidden="true" />
                  {featuredArticle.category}
                </span>
                <span>📅 {featuredArticle.date}</span>
                <span>📖 {featuredArticle.readTime}</span>
              </div>
            </div>
          )}
        </div>
      </section>

      <section
        className="max-w-7xl mx-auto px-6 py-16"
        aria-labelledby="recent-articles-heading"
      >
        <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
          <div>
            <p className="font-poppins font-black text-xs text-or tracking-widest mb-1">
              DERNIÈRES NOUVELLES
            </p>
            <h2
              id="recent-articles-heading"
              className="font-montserrat font-black text-3xl text-noir"
            >
              Articles récents
            </h2>
          </div>
          <Link
            href="/articles"
            className="font-montserrat font-semibold text-sm text-vert hover:bg-vert/10 px-4 py-2 rounded-lg transition-all flex items-center gap-1.5"
            aria-label="Voir tous les articles avec filtres"
          >
            Tous les articles <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {latestArticles.length > 0 ? (
            latestArticles.map((article) => (
              <ArticleCard key={article.id} {...article} />
            ))
          ) : (
            <p className="col-span-full text-center text-champagne font-montserrat py-10">
              Aucun article publié pour le moment.
            </p>
          )}
        </div>
      </section>

      <section
        className="bg-linear-to-r from-noir to-vert py-16 px-6"
        aria-label="Statistiques du journal"
      >
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "1 240", label: "Abonnés actifs"  },
            { value: "380",   label: "Articles publiés" },
            { value: "7",     label: "Catégories"       },
            { value: "24/7",  label: "Infos en direct"  },
          ].map(({ value, label }) => (
            <div key={label}>
              <div className="font-poppins font-black text-4xl text-or mb-2" aria-label={`${value} ${label}`}>
                {value}
              </div>
              <div className="font-raleway text-blanc/70 text-sm">{label}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}