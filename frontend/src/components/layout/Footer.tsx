"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Landmark, Mail, Phone } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchApi } from "@/lib/api";

interface FooterSettings {
  nom_journal: string;
  type_journal: string;
  description_footer: string;
  email_contact: string;
  tel_contact: string;
}

export default function Footer() {
  const [settings, setSettings] = useState<FooterSettings | null>(null);

  useEffect(() => {
    fetchApi<FooterSettings>('/v1/settings')
      .then(data => setSettings(data))
      .catch(() => setSettings({
        nom_journal: "Collectif", 
        type_journal: "Journal",
        description_footer: "Erreur de chargement.",
        email_contact: "contact@local", 
        tel_contact: "-" 
      }));
  }, []);

  return (
    <footer className="bg-noir px-6 pt-16 pb-8 mt-auto border-t border-blanc/5">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-8 mb-12 text-center md:text-left">
        
        {/* === COLONNE 1 & 2 : Identité & Description === */}
        <div className="flex flex-col items-center md:items-start md:col-span-2 pr-0 lg:pr-12">
          <div className="flex items-center gap-3 mb-5 w-full md:w-auto">
            <div className="w-12 h-12 bg-linear-to-br from-vert to-noir rounded-xl flex items-center justify-center border-2 border-or text-or shadow-sm shrink-0">
              <Landmark size={24} />
            </div>
            
            {settings ? (
              <div className="text-left min-w-0">
                <div className="font-poppins font-black text-lg text-blanc leading-tight wrap-break-word">
                  {settings.nom_journal}
                </div>
                <div className="font-raleway text-xs text-champagne font-semibold tracking-wide">
                  · {settings.type_journal}
                </div>
              </div>
            ) : (
              <div className="text-left min-w-0 space-y-2">
                <Skeleton className="h-5 w-40 bg-blanc/10" />
                <Skeleton className="h-3 w-24 bg-blanc/10" />
              </div>
            )}
          </div>

          {settings ? (
            <p className="font-montserrat text-sm text-blanc/60 leading-relaxed max-w-xl whitespace-pre-wrap">
              {settings.description_footer}
            </p>
          ) : (
            <div className="space-y-2 max-w-xl w-full mt-2">
              <Skeleton className="h-4 w-full bg-blanc/10" />
              <Skeleton className="h-4 w-5/6 bg-blanc/10" />
              <Skeleton className="h-4 w-4/6 bg-blanc/10" />
            </div>
          )}
        </div>

        {/* === COLONNE 3 : Contact === */}
        <div className="flex flex-col items-center md:items-start md:col-start-3 w-full">
          <h4 className="font-poppins font-bold text-blanc text-sm mb-5 tracking-wider uppercase">
            Nous contacter
          </h4>
          <div className="flex flex-col gap-4 font-montserrat text-sm text-blanc/60 items-center md:items-start w-full">
            {settings ? (
              <>
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
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 w-full justify-center md:justify-start">
                   <Skeleton className="h-8 w-8 rounded-full bg-blanc/10 shrink-0" />
                   <Skeleton className="h-4 w-48 bg-blanc/10" />
                </div>
                <div className="flex items-center gap-3 w-full justify-center md:justify-start">
                   <Skeleton className="h-8 w-8 rounded-full bg-blanc/10 shrink-0" />
                   <Skeleton className="h-4 w-32 bg-blanc/10" />
                </div>
              </>
            )}
          </div>
        </div>

      </div>
      
      {/* === BARRE DE DROITS === */}
      <div className="max-w-7xl mx-auto border-t border-blanc/10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 font-montserrat text-xs text-blanc/40 text-center">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 items-center">
          <span>
            © {new Date().getFullYear()} {settings ? settings.nom_journal : <Skeleton className="h-3 w-24 inline-block bg-blanc/10 align-middle ml-1" />} — Tous droits réservés
          </span>
          <Link 
            href="/mentions-legales"
            className="hover:text-blanc transition-colors underline decoration-blanc/20 underline-offset-4"
          >
            Mentions légales
          </Link>
        </div>
        <span>Fait avec le ❤️ pour la commune</span>
      </div>
    </footer>
  );
}
