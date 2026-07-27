"use client";

import { useEffect, useState } from "react";
import { Landmark, Mail, Phone } from "lucide-react";
import { fetchApi } from "@/lib/api";

export default function Footer() {
  const [settings, setSettings] = useState({ 
    nom_journal: "Collectif Chalonnais", 
    type_journal: "Journal Municipal",
    description_footer: "Le journal officiel et indépendant de la commune.",
    email_contact: "Chargement...", 
    tel_contact: "Chargement..." 
  });

  useEffect(() => {
    fetchApi<typeof settings>('/v1/settings')
      .then(data => setSettings(data))
      .catch(() => {});
  }, []);

  return (
    <footer className="bg-noir px-6 pt-14 pb-8 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center md:items-start gap-10 mb-10 text-center md:text-left">
        
        {/* Partie Gauche : Identité du journal */}
        <div className="flex flex-col items-center md:items-start max-w-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-linear-to-br from-vert to-noir rounded-xl flex items-center justify-center border-2 border-or text-or shadow-sm shrink-0">
              <Landmark size={20} />
            </div>
            <div className="text-left">
              <div className="font-poppins font-black text-base text-blanc leading-tight">{settings.nom_journal}</div>
              <div className="font-raleway text-xs text-champagne font-semibold tracking-wide">· {settings.type_journal}</div>
            </div>
          </div>
          <p className="font-montserrat text-sm text-blanc/50 leading-relaxed">
            {settings.description_footer}
          </p>
        </div>

        {/* Partie Droite : Contact Dynamique */}
        <div className="flex flex-col items-center md:items-end">
          <h4 className="font-poppins font-bold text-blanc text-sm mb-4 tracking-wider uppercase">Nous contacter</h4>
          <div className="flex flex-col gap-3 font-montserrat text-sm text-blanc/60 items-center md:items-end">
            <a href={`mailto:${settings.email_contact}`} className="flex items-center gap-2.5 hover:text-or transition-colors">
              <Mail size={16} className="text-champagne" /> {settings.email_contact}
            </a>
            <a href={`tel:${settings.tel_contact}`} className="flex items-center gap-2.5 hover:text-or transition-colors">
              <Phone size={16} className="text-champagne" /> {settings.tel_contact}
            </a>
          </div>
        </div>
      </div>
      
      <div className="border-t border-blanc/10 pt-6 flex justify-between items-center flex-col sm:flex-row gap-3 font-montserrat text-xs text-blanc/40 text-center">
        <span>© {new Date().getFullYear()} {settings.nom_journal} — Tous droits réservés</span>
        <span>Fait avec le ❤️ pour la commune</span>
      </div>
    </footer>
  );
}
