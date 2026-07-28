"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Landmark, Mail, Phone, MapPin } from "lucide-react";
import { fetchApi } from "@/lib/api";

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * @interface FooterSettings
 * @description Typage des paramètres globaux nécessaires pour l'affichage du pied de page.
 */
interface FooterSettings {
  nom_journal: string;
  type_journal: string;
  description_footer: string;
  email_contact: string;
  tel_contact: string;
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

/**
 * @component Footer
 * @description Pied de page global de l'application. Récupère dynamiquement les
 * paramètres de la plateforme pour afficher l'identité, la description et les
 * informations de contact. Intègre également une navigation rapide.
 * 
 * @returns {JSX.Element} L'interface du pied de page.
 */
export default function Footer() {
  const [settings, setSettings] = useState<FooterSettings>({ 
    nom_journal: "Collectif Chalonnais", 
    type_journal: "Journal Municipal",
    description_footer: "Le journal officiel et indépendant de la commune.",
    email_contact: "Chargement...", 
    tel_contact: "Chargement..." 
  });

  useEffect(() => {
    fetchApi<FooterSettings>('/v1/settings')
      .then(data => setSettings(data))
      .catch(() => console.error("Impossible de charger les paramètres du footer."));
  }, []);

  return (
    <footer className="bg-noir px-6 pt-16 pb-8 mt-auto border-t border-blanc/5">
      {/* Conteneur principal en grille (1 col sur mobile, 2 sur tablette, 4 sur desktop) */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-12 text-center md:text-left">
        
        {/* === COLONNE 1 & 2 : Identité & Description (Plus large) === */}
        <div className="flex flex-col items-center md:items-start lg:col-span-2 pr-0 lg:pr-12">
          <div className="flex items-center gap-3 mb-5 w-full md:w-auto">
            <div className="w-12 h-12 bg-linear-to-br from-vert to-noir rounded-xl flex items-center justify-center border-2 border-or text-or shadow-sm shrink-0">
              <Landmark size={24} />
            </div>
            <div className="text-left min-w-0">
              {/* break-words permet de couper les noms très longs comme "Saint-Remy-en-Bouzemont..." */}
              <div className="font-poppins font-black text-lg text-blanc leading-tight break-words">
                {settings.nom_journal}
              </div>
              <div className="font-raleway text-xs text-champagne font-semibold tracking-wide">
                · {settings.type_journal}
              </div>
            </div>
          </div>
          {/* whitespace-pre-wrap est la classe magique pour conserver les retours à la ligne ! */}
          <p className="font-montserrat text-sm text-blanc/60 leading-relaxed max-w-xl whitespace-pre-wrap">
            {settings.description_footer}
          </p>
        </div>

        {/* === COLONNE 3 : Navigation Rapide === */}
        <div className="flex flex-col items-center md:items-start">
          <h4 className="font-poppins font-bold text-blanc text-sm mb-5 tracking-wider uppercase">
            Navigation
          </h4>
          <nav className="flex flex-col gap-3.5 font-montserrat text-sm text-blanc/60 items-center md:items-start">
            <Link href="/articles" className="hover:text-or hover:translate-x-1 transition-all">
              Toutes les actualités
            </Link>
            <Link href="/categories" className="hover:text-or hover:translate-x-1 transition-all">
              Catégories &amp; Thématiques
            </Link>
            <Link href="/lost" className="hover:text-or hover:translate-x-1 transition-all">
              Objets trouvés
            </Link>
            {/* Liens placeholders très utiles pour un aspect "Pro" */}
            <Link href="#" className="hover:text-or hover:translate-x-1 transition-all pt-2 mt-2 border-t border-blanc/10 w-fit">
              Mentions légales
            </Link>
          </nav>
        </div>

        {/* === COLONNE 4 : Contact === */}
        <div className="flex flex-col items-center md:items-start">
          <h4 className="font-poppins font-bold text-blanc text-sm mb-5 tracking-wider uppercase">
            Nous contacter
          </h4>
          <div className="flex flex-col gap-4 font-montserrat text-sm text-blanc/60 items-center md:items-start">
            <a href={`mailto:${settings.email_contact}`} className="flex items-center gap-3 hover:text-or transition-colors group">
              <div className="w-8 h-8 rounded-full bg-blanc/5 flex items-center justify-center group-hover:bg-or/20 transition-colors shrink-0">
                <Mail size={14} className="text-champagne group-hover:text-or" />
              </div>
              <span className="truncate">{settings.email_contact}</span>
            </a>
            <a href={`tel:${settings.tel_contact.replace(/\s/g, '')}`} className="flex items-center gap-3 hover:text-or transition-colors group">
              <div className="w-8 h-8 rounded-full bg-blanc/5 flex items-center justify-center group-hover:bg-or/20 transition-colors shrink-0">
                <Phone size={14} className="text-champagne group-hover:text-or" />
              </div>
              <span>{settings.tel_contact}</span>
            </a>
            {/* Ajout optionnel d'une icône de lieu pour habiller */}
            <div className="flex items-center gap-3 group cursor-default pt-1">
              <div className="w-8 h-8 rounded-full bg-blanc/5 flex items-center justify-center shrink-0">
                <MapPin size={14} className="text-champagne" />
              </div>
              <span>Hôtel de Ville</span>
            </div>
          </div>
        </div>

      </div>
      
      {/* === BARRE DE DROITS === */}
      <div className="max-w-7xl mx-auto border-t border-blanc/10 pt-8 flex justify-between items-center flex-col sm:flex-row gap-4 font-montserrat text-xs text-blanc/40 text-center">
        <span>© {new Date().getFullYear()} {settings.nom_journal} — Tous droits réservés</span>
        <span>Fait avec le ❤️ pour la commune</span>
      </div>
    </footer>
  );
}
