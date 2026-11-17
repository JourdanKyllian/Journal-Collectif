"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, ChevronRight } from "lucide-react";

const COOKIE_CONSENT_KEY = "jc_web_cookie_consent";

export default function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Différé après l'hydratation SSR pour éviter les cascades de rendu
    const timer = setTimeout(() => {
      const saved = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (!saved) {
        setIsVisible(true);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, []);

  const handleChoice = (choice: "essential" | "all") => {
    localStorage.setItem(COOKIE_CONSENT_KEY, choice);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <aside
      aria-label="Gestion des cookies et traceurs"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <div className="bg-blanc/95 backdrop-blur-md border border-champagne/30 rounded-2xl p-5 shadow-2xl text-noir">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-or/20 flex items-center justify-center text-or">
              <Cookie size={16} />
            </div>
            <h3 className="font-poppins font-bold text-sm text-vert">
              Respect de votre vie privée
            </h3>
          </div>
          <Link
            href="/politique-de-confidentialite"
            className="text-xs text-champagne hover:text-vert flex items-center gap-0.5 underline transition-colors"
          >
            <span>Détails</span>
            <ChevronRight size={12} />
          </Link>
        </div>

        {/* Message */}
        <p className="font-montserrat text-xs text-noir/70 leading-relaxed mb-4">
          Nous utilisons des traceurs strictement essentiels au fonctionnement du site
          (authentification, sélection communale) et des mesures d&apos;audience anonymes.
        </p>

        {/* Boutons conformes CNIL (même niveau de visibilité) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleChoice("essential")}
            className="flex-1 py-2 px-3 rounded-xl border border-champagne/40 bg-champagne/10 hover:bg-champagne/20 text-xs font-semibold text-champagne hover:text-noir transition-colors text-center cursor-pointer"
          >
            Essentiels uniquement
          </button>
          <button
            type="button"
            onClick={() => handleChoice("all")}
            className="flex-1 py-2 px-3 rounded-xl bg-vert hover:bg-vert/90 text-blanc text-xs font-bold transition-all shadow-sm hover:shadow text-center cursor-pointer"
          >
            Tout accepter
          </button>
        </div>
      </div>
    </aside>
  );
}
