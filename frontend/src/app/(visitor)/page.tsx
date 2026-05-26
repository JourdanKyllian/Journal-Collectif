"use client";

import Link from "next/link";
import {
  ArrowRight,
  Palette, HardHat, Trophy,
  Megaphone, Siren, PartyPopper, Building2,
} from "lucide-react";
import ArticleCard from "@/components/features/ArticleCard";
import { Button }  from "@/components/ui/button";

// ── Données mock (triées du + récent au + ancien) ────────────
// Remplacer par : await fetchApi<Article[]>('/articles?limit=6&sort=publishedAt:desc')
const RECENT_ARTICLES = [
  {
    id: 1,
    title:         "Festival d'Été 2026 : Programme complet dévoilé",
    excerpt:       "Trois jours de concerts, expositions et animations pour toute la famille...",
    category:      "Culture",
    date:          "15 fév. 2026",
    dateIso:       "2026-02-15",
    readTime:      "3 min",
    icon:          Palette,
    gradientClass: "bg-linear-to-br from-vert to-noir",
  },
  {
    id: 2,
    title:         "Rénovation Route Nationale : fermeture jusqu'au 28 fév.",
    excerpt:       "Des déviations sont mises en place. Voici les itinéraires conseillés...",
    category:      "Travaux",
    date:          "14 fév. 2026",
    dateIso:       "2026-02-14",
    readTime:      "2 min",
    icon:          HardHat,
    gradientClass: "bg-linear-to-br from-vert/80 to-vert",
  },
  {
    id: 3,
    title:         "Victoire de l'équipe locale en demi-finale régionale",
    excerpt:       "Un match remporté 3-1 dans une ambiance électrisante au stade...",
    category:      "Sport",
    date:          "13 fév. 2026",
    dateIso:       "2026-02-13",
    readTime:      "4 min",
    icon:          Trophy,
    gradientClass: "bg-linear-to-br from-noir to-vert",
  },
  {
    id: 4,
    title:         "Conseil municipal — Compte-rendu séance du 10 fév.",
    excerpt:       "Budget 2026 voté, nouveau plan de mobilité douce approuvé...",
    category:      "Annonces",
    date:          "12 fév. 2026",
    dateIso:       "2026-02-12",
    readTime:      "5 min",
    icon:          Megaphone,
    gradientClass: "bg-linear-to-br from-noir/90 to-vert/60",
  },
  {
    id: 5,
    title:         "Alerte météo : fortes pluies attendues ce week-end",
    excerpt:       "La préfecture recommande d'éviter les déplacements non essentiels...",
    category:      "Faits divers",
    date:          "11 fév. 2026",
    dateIso:       "2026-02-11",
    readTime:      "2 min",
    icon:          Siren,
    gradientClass: "bg-linear-to-br from-vert to-noir/90",
  },
  {
    id: 6,
    title:         "Marché de printemps — Inscriptions 2026 ouvertes",
    excerpt:       "La municipalité lance les inscriptions pour l'édition 2026...",
    category:      "Événements",
    date:          "10 fév. 2026",
    dateIso:       "2026-02-10",
    readTime:      "3 min",
    icon:          PartyPopper,
    gradientClass: "bg-linear-to-br from-noir to-vert/80",
  },
] satisfies {
  id: number; title: string; excerpt: string; category: string;
  date: string; dateIso: string; readTime: string;
  icon: React.ElementType; gradientClass: string;
}[];

// ── Tri du plus récent au plus ancien ────────────────────────
const sortedArticles = [...RECENT_ARTICLES].sort(
  (a, b) => new Date(b.dateIso).getTime() - new Date(a.dateIso).getTime()
);

export default function Home() {
  return (
    <div className="w-full">

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section
        className="bg-linear-to-br from-vert via-vert/90 to-noir pt-16 pb-24 px-6 relative overflow-hidden"
        aria-label="Présentation du journal"
      >
        {/* Orbe décoratif */}
        <div
          className="absolute top-0 right-0 w-125 h-125 bg-or/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/4"
          aria-hidden="true"
        />
        {/* Découpe bas de section */}
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

          {/* Carte "À la une" — desktop uniquement */}
          <div
            className="hidden md:block bg-blanc/5 border border-or/25 rounded-2xl p-7 backdrop-blur-md"
            aria-label="Article à la une"
          >
            <span className="inline-flex items-center gap-1.5 bg-or text-noir font-poppins font-black text-xs px-3 py-1 rounded-full mb-4">
              🔥 À la une
            </span>
            <h2 className="font-montserrat font-bold text-blanc text-xl leading-tight mb-3">
              {sortedArticles[0].title}
            </h2>
            <p className="font-raleway text-blanc/70 text-sm leading-relaxed mb-5">
              {sortedArticles[0].excerpt}
            </p>
            <div className="flex gap-4 text-xs text-champagne font-montserrat">
              <span className="flex items-center gap-1">
                <Palette size={14} aria-hidden="true" />
                {sortedArticles[0].category}
              </span>
              <span>📅 {sortedArticles[0].date}</span>
              <span>📖 {sortedArticles[0].readTime}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6 Articles récents ────────────────────────────────── */}
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
          {/* Lien vers /articles pour les filtres avancés */}
          <Link
            href="/articles"
            className="font-montserrat font-semibold text-sm text-vert hover:bg-vert/10 px-4 py-2 rounded-lg transition-all flex items-center gap-1.5"
            aria-label="Voir tous les articles avec filtres"
          >
            Tous les articles <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>

        {/* Grille — 6 articles max, triés par date ──── */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedArticles.slice(0, 6).map((article) => (
            <ArticleCard key={article.id} {...article} />
          ))}
        </div>
      </section>

      {/* ── Bandeau statistiques ─────────────────────────────── */}
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
