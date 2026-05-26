"use client";

import { useState, useCallback } from "react";
import Link   from "next/link";
import {
  Palette, Trophy, HardHat, Siren,
  PartyPopper, Megaphone, Building2,
  ArrowRight, Bell, Mail, Smartphone, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Catégories (incluant la nouvelle "Politique & Mairie") ──
const CATEGORIES = [
  {
    id:          "culture",
    name:        "Culture",
    count:       42,
    icon:        Palette,
    description: "Expositions, spectacles, patrimoine et vie culturelle",
  },
  {
    id:          "sport",
    name:        "Sport",
    count:       28,
    icon:        Trophy,
    description: "Résultats, compétitions et clubs locaux",
  },
  {
    id:          "travaux",
    name:        "Travaux",
    count:       34,
    icon:        HardHat,
    description: "Chantiers, fermetures et aménagements urbains",
  },
  {
    id:          "faits-divers",
    name:        "Faits divers",
    count:       15,
    icon:        Siren,
    description: "Accidents, incidents et alertes de sécurité",
  },
  {
    id:          "evenements",
    name:        "Événements",
    count:       56,
    icon:        PartyPopper,
    description: "Fêtes, marchés, concerts et animations",
  },
  {
    id:          "annonces",
    name:        "Annonces",
    count:       23,
    icon:        Megaphone,
    description: "Communiqués officiels et appels à projets",
  },
  // ── Nouvelle catégorie ────────────────────────────────────
  {
    id:          "politique",
    name:        "Politique & Mairie",
    count:       18,
    icon:        Building2,
    description: "Conseil municipal, élections et décisions locales",
  },
] as const;

// ── Mini-Toast maison (pas de librairie externe) ─────────────
function useToast() {
  const [message, setMessage] = useState<string | null>(null);

  const show = useCallback((msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3500);
  }, []);

  return { message, show };
}

// ── Composant Toast inline ────────────────────────────────────
function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-vert text-blanc font-montserrat font-semibold text-sm px-5 py-3 rounded-2xl shadow-2xl animate-slide-up"
    >
      <Bell size={16} className="text-or shrink-0" aria-hidden="true" />
      {message}
      <button
        onClick={onClose}
        aria-label="Fermer la notification"
        className="ml-1 text-blanc/60 hover:text-blanc transition-colors"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

// ── Page Catégories ──────────────────────────────────────────
export default function CategoriesPage() {
  const toast = useToast();

  function handleSubscribe(type: "email" | "push", categoryName: string) {
    const label = type === "email" ? "email" : "notifications push";
    toast.show(`✅ Abonnement ${label} enregistré pour « ${categoryName} »`);
  }

  return (
    <>
      {/* ── Toast ──────────────────────────────────────────── */}
      {toast.message && (
        <Toast message={toast.message} onClose={() => {}} />
      )}

      <div className="w-full">
        {/* ── En-tête ──────────────────────────────────────── */}
        <header className="bg-linear-to-br from-vert to-noir py-16 px-6 text-center">
          <h1 className="font-poppins font-black text-4xl text-blanc mb-3">
            Toutes les <span className="text-or">Catégories</span>
          </h1>
          <p className="font-raleway text-blanc/70 text-lg">
            Filtrez les actualités selon vos centres d'intérêt — abonnez-vous pour ne rien manquer
          </p>
        </header>

        {/* ── Grille catégories ────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-6 py-14">
          <h2 className="font-montserrat font-black text-2xl mb-2">
            Choisissez une catégorie
          </h2>
          <p className="font-raleway text-sm text-champagne mb-8">
            Cliquez sur une catégorie pour consulter ses articles, ou abonnez-vous pour recevoir les nouveautés.
          </p>

          <div
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
            role="list"
            aria-label="Liste des catégories"
          >
            {CATEGORIES.map((cat) => (
              <article
                key={cat.id}
                role="listitem"
                className="group bg-blanc border border-champagne/30 rounded-2xl overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl hover:border-or/50"
              >
                {/* ── Ligne principale : lien vers les articles ── */}
                {/*
                  ↓ Utilise /articles?category=X pour bénéficier du
                  prefetching Next.js et des filtres avancés de la page Presse.
                */}
                <Link
                  href={`/articles?category=${cat.id}`}
                  className="flex items-center gap-4 p-6 pb-4"
                  aria-label={`Voir les articles de la catégorie ${cat.name}`}
                >
                  <div className="w-14 h-14 bg-or/10 border-2 border-or/20 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-or/20 group-hover:border-or/40 transition-all">
                    <cat.icon
                      size={24}
                      className="text-or"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-montserrat font-bold text-noir group-hover:text-vert transition-colors">
                      {cat.name}
                    </div>
                    <div className="font-montserrat text-xs text-champagne mt-0.5">
                      {cat.count} articles
                    </div>
                    <div className="font-raleway text-xs text-champagne/80 mt-1 line-clamp-1">
                      {cat.description}
                    </div>
                  </div>
                  <ArrowRight
                    size={20}
                    className="text-champagne group-hover:text-or group-hover:translate-x-1 transition-all shrink-0"
                    aria-hidden="true"
                  />
                </Link>

                {/* ── Boutons d'abonnement ──────────────────── */}
                <div className="px-6 pb-5 pt-2 border-t border-champagne/15 flex items-center gap-2">
                  <span className="font-montserrat text-xs text-champagne mr-auto">
                    S'abonner :
                  </span>
                  <button
                    onClick={() => handleSubscribe("email", cat.name)}
                    aria-label={`S'abonner par email à la catégorie ${cat.name}`}
                    className="flex items-center gap-1.5 font-montserrat font-bold text-xs px-3 py-1.5 rounded-lg bg-champagne/15 text-vert hover:bg-or hover:text-noir transition-all"
                  >
                    <Mail size={13} aria-hidden="true" /> Email
                  </button>
                  <button
                    onClick={() => handleSubscribe("push", cat.name)}
                    aria-label={`S'abonner aux notifications push pour la catégorie ${cat.name}`}
                    className="flex items-center gap-1.5 font-montserrat font-bold text-xs px-3 py-1.5 rounded-lg bg-champagne/15 text-vert hover:bg-or hover:text-noir transition-all"
                  >
                    <Smartphone size={13} aria-hidden="true" /> Push
                  </button>
                </div>
              </article>
            ))}
          </div>

          {/* ── CTA global ───────────────────────────────────── */}
          <div className="mt-12 bg-linear-to-br from-vert to-noir rounded-2xl p-8 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            <div className="w-16 h-16 bg-or/20 border-2 border-or/40 rounded-2xl flex items-center justify-center shrink-0 mx-auto sm:mx-0">
              <Bell size={28} className="text-or" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <h3 className="font-poppins font-black text-blanc text-lg mb-1">
                Abonnement global
              </h3>
              <p className="font-raleway text-blanc/70 text-sm">
                Recevez toutes les actualités de Châlons sans exception, en une seule notification journalière.
              </p>
            </div>
            <Button
              onClick={() => toast.show("✅ Abonnement global enregistré !")}
              aria-label="S'abonner à toutes les actualités du journal"
              className="bg-or text-noir font-montserrat font-bold px-6 py-3 rounded-xl hover:bg-or/90 transition-all hover:-translate-y-0.5 hover:shadow-lg shadow-or/20 shrink-0"
            >
              Tout recevoir
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
