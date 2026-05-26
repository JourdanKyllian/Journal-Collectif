"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Info, X, ChevronLeft, ChevronRight } from "lucide-react";

// ── Données des alertes ──────────────────────────────────────
// À remplacer par un fetch vers ton API NestJS : GET /api/alerts?isActive=true
const ALERTS = [
  {
    id: 1,
    type: "urgent" as const,
    message: "Grande Foire de Châlons — Perturbations trafic centre-ville ce week-end",
  },
  {
    id: 2,
    type: "info" as const,
    message: "Alerte météo — Fortes pluies prévues samedi et dimanche, déplacements déconseillés",
  },
] satisfies { id: number; type: "urgent" | "info"; message: string }[];

export default function AlertBanner() {
  const [currentIdx, setCurrentIdx]   = useState(0);
  const [visible, setVisible]         = useState(true);
  const [dismissed, setDismissed]     = useState(false);

  // ── Rotation automatique toutes les 5s ─────────────────────
  useEffect(() => {
    if (ALERTS.length <= 1) return;

    const interval = setInterval(() => {
      triggerTransition((currentIdx + 1) % ALERTS.length);
    }, 5000);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdx]);

  // ── Transition fade+slide ────────────────────────────────────
  function triggerTransition(nextIdx: number) {
    setVisible(false);
    setTimeout(() => {
      setCurrentIdx(nextIdx);
      setVisible(true);
    }, 350); // doit correspondre à la durée CSS ci-dessous
  }

  function goTo(delta: 1 | -1) {
    const next = (currentIdx + delta + ALERTS.length) % ALERTS.length;
    triggerTransition(next);
  }

  if (dismissed || ALERTS.length === 0) return null;

  const alert = ALERTS[currentIdx];
  const isUrgent = alert.type === "urgent";

  return (
    <div
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      className={`
        w-full px-4 py-2.5 flex items-center gap-3
        ${isUrgent
          ? "bg-linear-to-r from-red-600 to-red-700"
          : "bg-linear-to-r from-vert to-vert/90"}
        text-white
      `}
    >
      {/* ── Icône type ────────────────────────────────── */}
      <span
        className={`
          hidden sm:inline-flex items-center gap-1.5 shrink-0
          font-poppins font-black text-xs px-3 py-1 rounded-full
          ${isUrgent ? "bg-white/20 animate-pulse" : "bg-white/15"}
        `}
        aria-hidden="true"
      >
        {isUrgent
          ? <AlertTriangle size={12} aria-hidden="true" />
          : <Info size={12} aria-hidden="true" />}
        {isUrgent ? "URGENT" : "INFO"}
      </span>

      {/* ── Message animé ─────────────────────────────── */}
      <p
        className="flex-1 font-montserrat font-semibold text-sm truncate"
        style={{
          opacity:    visible ? 1 : 0,
          transform:  visible ? "translateY(0)" : "translateY(-6px)",
          transition: "opacity 0.35s ease, transform 0.35s ease",
        }}
      >
        {/* Icône mobile uniquement */}
        <span className="sm:hidden mr-1.5" aria-hidden="true">
          {isUrgent ? "🚨" : "ℹ️"}
        </span>
        {alert.message}
      </p>

      {/* ── Navigation (si plusieurs alertes) ─────────── */}
      {ALERTS.length > 1 && (
        <div
          className="hidden md:flex items-center gap-1 shrink-0"
          aria-label="Navigation entre les alertes"
        >
          <button
            onClick={() => goTo(-1)}
            aria-label="Alerte précédente"
            className="p-1 rounded hover:bg-white/20 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          {/* Indicateurs de pagination */}
          <div className="flex gap-1" aria-hidden="true">
            {ALERTS.map((_, i) => (
              <button
                key={i}
                onClick={() => triggerTransition(i)}
                aria-label={`Aller à l'alerte ${i + 1}`}
                className={`
                  w-1.5 h-1.5 rounded-full transition-all
                  ${i === currentIdx ? "bg-white scale-125" : "bg-white/40 hover:bg-white/70"}
                `}
              />
            ))}
          </div>
          <button
            onClick={() => goTo(1)}
            aria-label="Alerte suivante"
            className="p-1 rounded hover:bg-white/20 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* ── Fermer ────────────────────────────────────── */}
      <button
        onClick={() => setDismissed(true)}
        aria-label="Fermer le bandeau d'alertes"
        className="shrink-0 p-1 rounded hover:bg-white/20 transition-colors text-white/70 hover:text-white"
      >
        <X size={18} />
      </button>
    </div>
  );
}
