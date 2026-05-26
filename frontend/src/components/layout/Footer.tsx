import Link from "next/link";
import { Landmark } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-noir px-6 pt-14 pb-8 mt-auto">
      <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-10 mb-10">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-linear-to-br from-vert to-noir rounded-xl flex items-center justify-center border-2 border-or text-or shadow-sm shrink-0">
              <Landmark size={18} />
            </div>
            <div>
              <div className="font-poppins font-black text-sm text-blanc">Collectif Chalonnais</div>
              <div className="font-raleway text-xs text-champagne">06 · Journal Municipal</div>
            </div>
          </div>
          <p className="font-montserrat text-sm text-blanc/50 leading-relaxed">
            Le journal officiel de la commune, pour rester connectés à la vie locale.
          </p>
        </div>
        
        <div>
          <h4 className="font-montserrat font-bold text-blanc text-sm mb-4">Navigation</h4>
          <div className="flex flex-col gap-2">
            <Link href="/" className="text-left font-montserrat text-sm text-blanc/50 hover:text-or transition-colors">Accueil</Link>
            <Link href="/categories" className="text-left font-montserrat text-sm text-blanc/50 hover:text-or transition-colors">Catégories</Link>
            <Link href="/lost" className="text-left font-montserrat text-sm text-blanc/50 hover:text-or transition-colors">Objets perdus</Link>
          </div>
        </div>
        
        <div>
          <h4 className="font-montserrat font-bold text-blanc text-sm mb-4">Catégories</h4>
          <div className="flex flex-col gap-2 font-montserrat text-sm text-blanc/50">
            <span>🎭 Culture</span>
            <span>⚽ Sport</span>
            <span>🏗️ Travaux</span>
            <span>🎉 Événements</span>
          </div>
        </div>
        
        <div>
          <h4 className="font-montserrat font-bold text-blanc text-sm mb-4">Contact</h4>
          <div className="flex flex-col gap-2 font-montserrat text-sm text-blanc/50">
            <span>contact@chalonnais.fr</span>
            <span>04 XX XX XX XX</span>
            <span>Mairie de Châlons</span>
          </div>
        </div>
      </div>
      
      <div className="border-t border-blanc/10 pt-6 flex justify-between items-center flex-wrap gap-3 font-montserrat text-xs text-blanc/40">
        <span>© 2026 Collectif Chalonnais 06 — Tous droits réservés</span>
        <span>Fait avec le ❤️ pour la commune</span>
      </div>
    </footer>
  );
}