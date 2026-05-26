"use client";

import { Settings, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SettingsDashboard() {
  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="font-poppins font-black text-2xl text-noir mb-1 flex items-center gap-2">
          <Settings className="text-champagne" /> Paramètres
        </h1>
        <p className="font-raleway text-champagne text-sm">Configuration générale du journal municipal</p>
      </div>

      <div className="bg-blanc rounded-2xl border border-champagne/20 p-6 sm:p-8 max-w-xl space-y-6 mt-6">
        <div className="space-y-2">
          <Label className="font-montserrat font-bold text-xs text-vert uppercase tracking-wide">Nom de la commune</Label>
          <Input 
            defaultValue="Collectif Chalonnais 06" 
            className="px-4 py-6 border-champagne/40 rounded-xl bg-blanc focus-visible:ring-or/30 focus-visible:border-or font-montserrat text-sm"
          />
        </div>
        
        <div className="space-y-2">
          <Label className="font-montserrat font-bold text-xs text-vert uppercase tracking-wide">Email de contact</Label>
          <Input 
            type="email" 
            defaultValue="contact@chalonnais.fr" 
            className="px-4 py-6 border-champagne/40 rounded-xl bg-blanc focus-visible:ring-or/30 focus-visible:border-or font-montserrat text-sm"
          />
        </div>

        <Button className="w-full py-6 bg-noir text-blanc font-montserrat font-bold rounded-xl hover:bg-vert transition-all hover:-translate-y-0.5 mt-4">
          <Save size={16} className="mr-2" /> Sauvegarder les modifications
        </Button>
      </div>
    </div>
  );
}