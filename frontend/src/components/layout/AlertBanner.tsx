"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { AlertTriangle, Info, X, ChevronLeft, ChevronRight, PartyPopper } from "lucide-react";
import { fetchApi } from "@/lib/api";

// ── Types ────────────────────────────────────────────────────
interface AlertItem {
  id: number;
  type: "urgent" | "info" | "event";
  title: string;
  message: string;
  startDate: string | null;
  endDate: string | null;
}

/**
 * Composant de bannière d'alerte défilante affiché en haut du site.
 * Gère la rotation automatique des alertes, les transitions fluides et la fermeture par l'utilisateur.
 * 
 * @returns {JSX.Element | null} Le composant de bannière rendu ou null si fermé.
 */
export default function AlertBanner() {
  const pathname = usePathname();
  const [alerts, setAlerts]           = useState<AlertItem[]>([]);
  const [currentIdx, setCurrentIdx]   = useState(0);
  const [visible, setVisible]         = useState(true);
  const [dismissed, setDismissed]     = useState(false);

  // ── Récupération dynamique des alertes depuis l'API ────────
  useEffect(() => {
    const loadAlerts = async () => {
      try {
        const data = await fetchApi<AlertItem[]>('/v1/alerts');
        
        // Filtrage côté client pour n'afficher que les alertes actives à la date du jour
        const today = new Date().toISOString().split('T')[0];
        
        const activeAlerts = data.filter(alert => {
          // Si une date de début est définie et qu'elle est dans le futur, on masque
          if (alert.startDate && alert.startDate > today) return false;
          // Si une date de fin est définie et qu'elle est dans le passé, on masque
          if (alert.endDate && alert.endDate < today) return false;
          return true;
        });

        setAlerts(activeAlerts);
      } catch (error) {
        console.error("Erreur lors de la récupération des alertes pour la bannière:", error);
      }
    };

    loadAlerts();
  }, []);

  // ── Rotation automatique toutes les 5s ─────────────────────
  useEffect(() => {
    if (alerts.length <= 1) return;

    const interval = setInterval(() => {
      triggerTransition((currentIdx + 1) % alerts.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [currentIdx, alerts.length]);

  /**
   * Déclenche une transition fluide (fade + slide) lors du changement d'alerte.
   * 
   * @param {number} nextIdx - L'index de la prochaine alerte à afficher.
   */
  function triggerTransition(nextIdx: number) {
    setVisible(false);
    setTimeout(() => {
      setCurrentIdx(nextIdx);
      setVisible(true);
    }, 350); // doit correspondre à la durée CSS ci-dessous
  }

  /**
   * Navigue vers l'alerte précédente ou suivante.
   * 
   * @param {1 | -1} delta - La direction du déplacement (-1 pour précédent, 1 pour suivant).
   */
  function goTo(delta: 1 | -1) {
    const next = (currentIdx + delta + alerts.length) % alerts.length;
    triggerTransition(next);
  }

  // --- RÈGLE D'AFFICHAGE ---
  if (pathname === '/profile' || dismissed || alerts.length === 0) return null;

  const alert = alerts[currentIdx];
  
  // Sécurité supplémentaire au cas où le tableau se viderait pendant le rendu
  if (!alert) return null;
  
  // Configuration dynamique selon le type d'alerte pour s'aligner avec le Dashboard
  const getTypeConfig = (type: string) => {
    switch(type) {
      case 'urgent': return { bg: "bg-linear-to-r from-red-600 to-red-700", icon: AlertTriangle, label: "URGENT", badgeBg: "bg-white/20 animate-pulse", emoji: "🚨" };
      case 'info': return { bg: "bg-linear-to-r from-orange-500 to-orange-600", icon: Info, label: "INFO", badgeBg: "bg-white/20", emoji: "ℹ️" };
      case 'event': return { bg: "bg-linear-to-r from-vert to-vert/90", icon: PartyPopper, label: "ÉVÉNEMENT", badgeBg: "bg-white/15", emoji: "🎪" };
      default: return { bg: "bg-linear-to-r from-vert to-vert/90", icon: Info, label: "INFO", badgeBg: "bg-white/15", emoji: "ℹ️" };
    }
  };

  const config = getTypeConfig(alert.type);

  return (
    <div
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      className={`w-full px-4 py-2.5 flex items-center gap-3 ${config.bg} text-white transition-colors duration-500`}
    >
      {/* ── Icône type ────────────────────────────────── */}
      <span
        className={`hidden sm:inline-flex items-center gap-1.5 shrink-0 font-poppins font-black text-xs px-3 py-1 rounded-full ${config.badgeBg}`}
        aria-hidden="true"
      >
        <config.icon size={12} aria-hidden="true" />
        {config.label}
      </span>

      {/* ── Message animé ─────────────────────────────── */}
      <p
        className="flex-1 font-montserrat text-sm truncate"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(-6px)",
          transition: "opacity 0.35s ease, transform 0.35s ease",
        }}
      >
        {/* Icône mobile uniquement */}
        <span className="sm:hidden mr-1.5" aria-hidden="true">{config.emoji}</span>
        <strong className="font-bold mr-1.5">{alert.title} —</strong> 
        <span className="font-medium">{alert.message}</span>
      </p>

      {/* ── Navigation (si plusieurs alertes) ─────────── */}
      {alerts.length > 1 && (
        <div className="hidden md:flex items-center gap-1 shrink-0" aria-label="Navigation entre les alertes">
          <button onClick={() => goTo(-1)} aria-label="Alerte précédente" className="p-1 rounded hover:bg-white/20 transition-colors">
            <ChevronLeft size={16} />
          </button>
          
          {/* Indicateurs de pagination */}
          <div className="flex gap-1" aria-hidden="true">
            {alerts.map((_, i) => (
              <button
                key={i}
                onClick={() => triggerTransition(i)}
                aria-label={`Aller à l'alerte ${i + 1}`}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentIdx ? "bg-white scale-125" : "bg-white/40 hover:bg-white/70"}`}
              />
            ))}
          </div>
          
          <button onClick={() => goTo(1)} aria-label="Alerte suivante" className="p-1 rounded hover:bg-white/20 transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* ── Fermer ────────────────────────────────────── */}
      <button onClick={() => setDismissed(true)} aria-label="Fermer le bandeau d'alertes" className="shrink-0 p-1 rounded hover:bg-white/20 transition-colors text-white/70 hover:text-white">
        <X size={18} />
      </button>
    </div>
  );
}
