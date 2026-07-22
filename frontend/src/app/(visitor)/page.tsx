"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Palette, HardHat, Trophy,
  Megaphone, Siren, PartyPopper, Building2, BookOpen,
  LucideIcon
} from "lucide-react";
import ArticleCard from "@/components/features/ArticleCard";
import { Button }  from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchApi } from "@/lib/api";

/**
 * Détermine l'icône appropriée pour un nom de catégorie donné.
 *
 * @param {string} categoryName - Le nom de la catégorie.
 * @returns {LucideIcon} Le composant d'icône Lucide React correspondant.
 */
const getCategoryIcon = (categoryName: string): LucideIcon => {
  const normalized = categoryName?.toLowerCase() || "";
  if (normalized.includes('culture')) return Palette;
  if (normalized.includes('sport')) return Trophy;
  if (normalized.includes('travaux')) return HardHat;
  if (normalized.includes('divers') || normalized.includes('alerte')) return Siren;
  if (normalized.includes('evénement') || normalized.includes('evenement')) return PartyPopper;
  if (normalized.includes('politique') || normalized.includes('mairie')) return Building2;
  if (normalized.includes('annonce')) return Megaphone;
  return BookOpen;
};

/**
 * Renvoie une classe de dégradé d'arrière-plan en fonction de l'index de l'article.
 *
 * @param {number} index - L'index de position de l'article dans la liste.
 * @returns {string} Les classes CSS Tailwind pour le fond en dégradé.
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
 * Calcule le temps de lecture estimé pour un texte donné sur la base d'une moyenne de 225 mots par minute.
 *
 * @param {string} text - Le contenu de l'article.
 * @returns {string} Le temps de lecture estimé formaté sous forme de chaîne de caractères.
 */
const calculateReadTime = (text: string): string => {
  if (!text) return "1 min";
  const wordCount = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(wordCount / 225);
  return `${minutes} min`;
};

/**
 * Formate une chaîne de date ISO en une chaîne de date française localisée.
 *
 * @param {string} isoDate - La chaîne de date au format ISO.
 * @returns {string} La chaîne de date localisée.
 */
const formatDate = (isoDate: string): string => {
  if (!isoDate) return "Date inconnue";
  const date = new Date(isoDate);
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
};

/**
 * Interface représentant la structure d'un article en base de données.
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
 * Interface représentant la structure d'une catégorie en base de données.
 */
interface BackendCategory {
  id: number;
  libelle: string;
}

/**
 * Interface représentant la structure d'un aperçu d'article formaté pour l'affichage frontal.
 */
interface ArticlePreview {
  id: number;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  dateIso: string;
  readTime: string;
  icon: LucideIcon;
  gradientClass: string;
}

/**
 * Interface représentant les statistiques globales à afficher.
 */
interface DashboardStats {
  articles: number;
  categories: number;
  subscribers: number;
}

/**
 * Composant client rendant la page d'accueil.
 * Gère la récupération asynchrone des articles et des statistiques, l'affichage des Skeleton Loaders,
 * et le rendu de l'interface utilisateur.
 *
 * @returns {JSX.Element} Le composant de page d'accueil rendu.
 */
export default function Home() {
  const [latestArticles, setLatestArticles] = useState<ArticlePreview[]>([]);
  const [stats, setStats] = useState<DashboardStats>({ articles: 0, categories: 0, subscribers: 0 });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [articlesRes, categoriesRes] = await Promise.all([
          fetchApi<BackendArticle[]>('/v1/article/published').catch(() => []),
          fetchApi<BackendCategory[]>('/v1/category').catch(() => [])
        ]);

        const formattedArticles = articlesRes.slice(0, 6).map((article, index) => ({
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

        setLatestArticles(formattedArticles);
        
        setStats({
          articles: articlesRes.length,
          categories: categoriesRes.length,
          subscribers: 0, 
        });

      } catch (error) {
        console.error("Erreur lors de la récupération des données :", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

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
              L&apos;actualité de<br />
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

          {isLoading ? (
            <div className="hidden md:block bg-blanc/5 border border-or/25 rounded-2xl p-7 backdrop-blur-md">
              <Skeleton className="h-6 w-24 rounded-full mb-4 bg-blanc/20" />
              <Skeleton className="h-8 w-3/4 mb-3 bg-blanc/20" />
              <Skeleton className="h-4 w-full mb-2 bg-blanc/20" />
              <Skeleton className="h-4 w-5/6 mb-5 bg-blanc/20" />
              <div className="flex gap-4">
                <Skeleton className="h-4 w-20 bg-blanc/20" />
                <Skeleton className="h-4 w-24 bg-blanc/20" />
              </div>
            </div>
          ) : featuredArticle ? (
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
          ) : null}
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
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
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
            ))
          ) : latestArticles.length > 0 ? (
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
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center justify-center">
                <Skeleton className="h-10 w-24 mb-2 bg-blanc/10" />
                <Skeleton className="h-4 w-32 bg-blanc/10" />
              </div>
            ))
          ) : (
            [
              { value: stats.subscribers.toString(), label: "Abonnés actifs"  },
              { value: stats.articles.toString(),    label: "Articles publiés" },
              { value: stats.categories.toString(),  label: "Catégories"       },
              { value: "24/7",                       label: "Infos en direct"  },
            ].map(({ value, label }) => (
              <div key={label}>
                <div className="font-poppins font-black text-4xl text-or mb-2" aria-label={`${value} ${label}`}>
                  {value}
                </div>
                <div className="font-raleway text-blanc/70 text-sm">{label}</div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}