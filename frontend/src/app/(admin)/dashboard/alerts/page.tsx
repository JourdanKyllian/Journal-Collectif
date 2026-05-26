"use client";

import { useState } from "react";
import { 
  AlertTriangle, 
  Trash2, 
  Info, 
  CalendarDays,
  Megaphone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function AlertsDashboard() {
  const [alertsCount, setAlertsCount] = useState(2);

  return (
    <div className="space-y-8 animate-slide-up max-w-4xl">
      <div>
        <h1 className="font-poppins font-black text-2xl text-noir mb-1 flex items-center gap-2">
          <AlertTriangle className="text-red-500" /> Alertes Importantes
        </h1>
        <p className="font-raleway text-champagne text-sm">Gérez les bannières d'urgence affichées en tête du site</p>
      </div>

      {/* --- LISTE DES ALERTES ACTIVES --- */}
      <div className="space-y-4">
        <h2 className="font-montserrat font-bold text-base flex items-center gap-2">
          Alertes actives 
          <span className="bg-red-100 text-red-600 font-poppins font-black text-xs px-2.5 py-1 rounded-full">
            {alertsCount}
          </span>
        </h2>
        
        <div className="space-y-3">
          {/* Alerte 1 */}
          <div className="bg-blanc border-l-4 border-red-500 rounded-xl p-5 flex flex-col sm:flex-row items-start gap-4 hover:shadow-md transition-all">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-500 shrink-0 mt-1">
              <Megaphone size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="bg-red-500 text-blanc font-poppins font-black text-xs px-2.5 py-0.5 rounded-full animate-pulse">URGENT</span>
                <h3 className="font-montserrat font-bold text-sm">Grande Foire de Châlons — Perturbations trafic</h3>
              </div>
              <p className="font-montserrat text-xs text-champagne mb-2">Foire annuelle du 15 au 18 mars. Fermetures de rues prévues. Plan de circulation disponible en mairie.</p>
              <div className="font-montserrat text-xs text-champagne flex items-center gap-1.5">
                <CalendarDays size={12} /> Du 15 au 18 mars · Créée par Admin
              </div>
            </div>
            <Button variant="ghost" size="sm" className="bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 font-montserrat font-bold text-xs rounded-lg mt-2 sm:mt-0">
              <Trash2 size={14} className="mr-1.5" /> Retirer
            </Button>
          </div>

          {/* Alerte 2 */}
          <div className="bg-blanc border-l-4 border-orange-400 rounded-xl p-5 flex flex-col sm:flex-row items-start gap-4 hover:shadow-md transition-all">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-500 shrink-0 mt-1">
              <Info size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="bg-orange-400 text-blanc font-poppins font-black text-xs px-2.5 py-0.5 rounded-full">INFO</span>
                <h3 className="font-montserrat font-bold text-sm">Alerte météo — Fortes pluies ce weekend</h3>
              </div>
              <p className="font-montserrat text-xs text-champagne mb-2">La préfecture recommande de limiter les déplacements samedi et dimanche.</p>
              <div className="font-montserrat text-xs text-champagne flex items-center gap-1.5">
                <CalendarDays size={12} /> Samedi 22 - Dimanche 23 fév.
              </div>
            </div>
            <Button variant="ghost" size="sm" className="bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 font-montserrat font-bold text-xs rounded-lg mt-2 sm:mt-0">
              <Trash2 size={14} className="mr-1.5" /> Retirer
            </Button>
          </div>
        </div>
      </div>

      {/* --- CRÉER UNE ALERTE --- */}
      <div className="bg-blanc rounded-2xl border border-champagne/20 p-6 sm:p-8 mt-8">
        <h2 className="font-poppins font-black text-lg text-noir mb-6 flex items-center gap-2">
          ＋ Créer une nouvelle alerte
        </h2>
        
        <div className="space-y-6">
          <div className="space-y-3">
            <Label className="font-montserrat font-bold text-xs text-vert tracking-wide uppercase">Niveau d'urgence</Label>
            <RadioGroup defaultValue="urgent" className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2 border-2 border-red-300 bg-red-50 px-4 py-3 rounded-xl cursor-pointer hover:bg-red-100 transition-colors">
                <RadioGroupItem value="urgent" id="urgent" className="border-red-500 text-red-500" />
                <Label htmlFor="urgent" className="font-montserrat font-bold text-sm text-red-600 cursor-pointer">🚨 URGENT</Label>
              </div>
              <div className="flex items-center space-x-2 border-2 border-champagne/40 bg-blanc px-4 py-3 rounded-xl cursor-pointer hover:bg-champagne/10 transition-colors">
                <RadioGroupItem value="info" id="info" className="border-orange-400 text-orange-400" />
                <Label htmlFor="info" className="font-montserrat font-bold text-sm text-orange-500 cursor-pointer">ℹ️ INFO</Label>
              </div>
              <div className="flex items-center space-x-2 border-2 border-champagne/40 bg-blanc px-4 py-3 rounded-xl cursor-pointer hover:bg-champagne/10 transition-colors">
                <RadioGroupItem value="event" id="event" className="border-vert text-vert" />
                <Label htmlFor="event" className="font-montserrat font-bold text-sm text-vert cursor-pointer">🎪 ÉVÉNEMENT</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label className="font-montserrat font-bold text-xs text-vert tracking-wide uppercase">Titre de l'alerte *</Label>
            <Input placeholder="Ex: Grande Foire de Chalon — Fermeture du centre-ville" className="px-4 py-6 border-champagne/40 rounded-xl bg-blanc focus-visible:ring-or/30 focus-visible:border-or" />
          </div>

          <div className="space-y-2">
            <Label className="font-montserrat font-bold text-xs text-vert tracking-wide uppercase">Message court (affiché dans la bannière) *</Label>
            <Textarea rows={2} placeholder="Message affiché directement sur la bannière du site..." className="px-4 py-3 border-champagne/40 rounded-xl bg-blanc focus-visible:ring-or/30 focus-visible:border-or resize-none" />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-montserrat font-bold text-xs text-vert tracking-wide uppercase">Date de début</Label>
              <Input type="date" className="px-4 py-6 border-champagne/40 rounded-xl bg-blanc focus-visible:ring-or/30 focus-visible:border-or" />
            </div>
            <div className="space-y-2">
              <Label className="font-montserrat font-bold text-xs text-vert tracking-wide uppercase">Date de fin</Label>
              <Input type="date" className="px-4 py-6 border-champagne/40 rounded-xl bg-blanc focus-visible:ring-or/30 focus-visible:border-or" />
            </div>
          </div>

          <Button className="w-full py-6 bg-noir text-blanc font-montserrat font-bold text-sm rounded-xl hover:bg-vert transition-all hover:-translate-y-0.5 mt-2">
            <Megaphone size={16} className="mr-2" /> Publier l'alerte sur le site
          </Button>
        </div>
      </div>
    </div>
  );
}