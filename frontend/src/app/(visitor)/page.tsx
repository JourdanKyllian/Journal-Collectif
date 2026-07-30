"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, LucideIcon, PenTool, ShieldCheck, CheckCircle2 } from "lucide-react";
import ArticleCard from "@/components/features/ArticleCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchApi } from "@/lib/api";
import { getCategoryUI, getGradientClassByIndex, calculateReadTime, formatDateToFrench } from "@/lib/formatters";

interface BackendArticle {
  id: number;
  titre: string;
  contenu: string;
  published_at: string;
  categorie?: { libelle: string };
}

interface BackendCategorie {
  id: number;
  libelle: string;
}

interface AppSettings {
  nom_journal: string;
  nom_ville: string;
}

interface ArticlePreview {
  id: number;
  title: string;
  excerpt: string;
  categorie: string;
  date: string;
  dateIso: string;
  readTime: string;
  icon: LucideIcon;
  gradientClass: string;
  href?: string;
}

interface DashboardStats {
  articles: number;
  categories: number;
  subscribers: number;
}

/**
 * Page d'accueil du portail public.
 * Affiche les derniers articles publiés, l'appel à contribution citoyenne et les statistiques.
 */
export default function Home() {
  const [latestArticles, setLatestArticles] = useState<ArticlePreview[]>([]);
  const [stats, setStats] = useState<DashboardStats>({ articles: 0, categories: 0, subscribers: 0 });
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [articlesRes, categoriesRes, settingsRes] = await Promise.all([
          fetchApi<BackendArticle[]>('/v1/article/published').catch(() => []),
          fetchApi<BackendCategorie[]>('/v1/categorie').catch(() => []),
          fetchApi<AppSettings>('/v1/settings').catch(() => ({ nom_journal: "Collectif", nom_ville: "la commune" }))
        ]);

        const formattedArticles = articlesRes.slice(0, 6).map((article, index) => {
          const catName = article.categorie?.libelle || "Général";
          const uiConfig = getCategoryUI(catName);

          return {
            id: article.id,
            title: article.titre,
            excerpt: article.contenu ? article.contenu.substring(0, 100) + "..." : "Pas de résumé disponible...",
            categorie: catName,
            date: formatDateToFrench(article.published_at),
            dateIso: article.published_at,
            readTime: calculateReadTime(article.contenu),
            icon: uiConfig.icon,
            gradientClass: getGradientClassByIndex(index),
            href: `/articles/${article.id}`,
          };
        });

        setLatestArticles(formattedArticles);
        setSettings(settingsRes);
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
      {/* --- HERO SECTION --- */}
      <section
        className="bg-linear-to-br from-vert via-vert/90 to-noir pt-16 pb-24 px-6 relative overflow-hidden"
        aria-label="Présentation du journal"
      >
        <div className="absolute top-0 right-0 w-125 h-125 bg-or/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/4" aria-hidden="true" />
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-blanc" style={{ clipPath: "ellipse(55% 100% at 50% 100%)" }} aria-hidden="true" />

        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center relative z-10">
          <div>
            {isLoading || !settings ? (
              <div className="mb-8 space-y-4">
                <Skeleton className="h-7 w-64 rounded-full bg-blanc/20" />
                <Skeleton className="h-12 w-full max-w-md bg-blanc/20" />
                <Skeleton className="h-12 w-3/4 max-w-sm bg-blanc/20" />
              </div>
            ) : (
              <>
                <span className="inline-block bg-or/20 border border-or/50 text-or font-poppins font-black text-xs px-4 py-1.5 rounded-full mb-5 tracking-wide">
                  📰 Journal en ligne · {settings.nom_journal}
                </span>
                <h1 className="font-poppins font-black text-4xl md:text-5xl text-blanc leading-tight mb-5">
                  L&apos;actualité de<br />
                  <span className="text-or">{settings.nom_ville}</span> en temps réel
                </h1>
              </>
            )}
            
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
            <div className="hidden md:block bg-blanc/5 border border-or/25 rounded-2xl p-7 backdrop-blur-md" aria-label="Article à la une">
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
                  {featuredArticle.categorie}
                </span>
                <span>📅 {featuredArticle.date}</span>
                <span>📖 {featuredArticle.readTime}</span>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* --- DERNIERS ARTICLES --- */}
      <section className="max-w-7xl mx-auto px-6 py-16" aria-labelledby="recent-articles-heading">
        <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
          <div>
            <p className="font-poppins font-black text-xs text-or tracking-widest mb-1">
              DERNIÈRES NOUVELLES
            </p>
            <h2 id="recent-articles-heading" className="font-montserrat font-black text-3xl text-noir">
              Articles récents
            </h2>
          </div>
          <Link href="/articles" className="font-montserrat font-semibold text-sm text-vert hover:bg-vert/10 px-4 py-2 rounded-lg transition-all flex items-center gap-1.5" aria-label="Voir tous les articles avec filtres">
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

      {/* --- APPEL À L'ACTION : PARTICIPATION CITOYENNE --- */}
      <section className="bg-champagne/5 py-20 px-6 border-y border-champagne/20">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1">
            <h2 className="font-poppins font-black text-3xl md:text-4xl text-noir mb-4">
              La plume est <span className="text-vert">à vous !</span>
            </h2>
            <p className="font-raleway text-lg text-noir/80 mb-8 leading-relaxed">
              Ce journal est avant tout le vôtre. Vous avez organisé un événement local, 
              remarqué une belle initiative citoyenne ou souhaitez partager une tribune ? 
              Prenez la parole et publiez votre propre actualité.
            </p>
            
            <ul className="space-y-5 mb-10 font-montserrat text-sm text-noir/80">
              <li className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-champagne/20 flex items-center justify-center shrink-0">
                  <ShieldCheck className="text-vert" size={20} />
                </div>
                <span><strong>Créez un compte vérifié</strong> en complétant votre profil avec de vraies données (possibilité de publier anonymement via le RGPD).</span>
              </li>
              <li className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-champagne/20 flex items-center justify-center shrink-0">
                  <PenTool className="text-or" size={20} />
                </div>
                <span><strong>Rédigez votre article</strong> grâce à notre éditeur en ligne professionnel (intégration de photos et de mise en forme).</span>
              </li>
              <li className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-champagne/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="text-vert" size={20} />
                </div>
                <span><strong>Validation par la mairie :</strong> Le comité de rédaction relit et publie votre actualité pour tous les citoyens.</span>
              </li>
            </ul>

            <Link href="/articles/soumettre">
              <Button className="bg-noir text-blanc font-montserrat font-bold px-8 py-6 text-base rounded-xl transition-all hover:bg-vert hover:-translate-y-0.5 hover:shadow-lg shadow-vert/20">
                Proposer mon premier article
              </Button>
            </Link>
          </div>
          
          <div className="hidden md:flex w-72 h-72 bg-linear-to-br from-vert to-noir rounded-full shrink-0 items-center justify-center shadow-2xl relative">
            <div className="absolute inset-2 border-2 border-or/30 rounded-full border-dashed animate-[spin_20s_linear_infinite]" />
            <PenTool size={64} className="text-or" />
          </div>
        </div>
      </section>

      {/* --- STATISTIQUES --- */}
      <section className="bg-linear-to-r from-noir to-vert py-16 px-6" aria-label="Statistiques du journal">
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
              { value: stats.subscribers.toString(), label: "Abonnés actifs" },
              { value: stats.articles.toString(), label: "Articles publiés" },
              { value: stats.categories.toString(), label: "Catégories" },
              { value: "24/7", label: "Infos en direct" },
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
