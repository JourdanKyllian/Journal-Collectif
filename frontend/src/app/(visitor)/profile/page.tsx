"use client";

import { useState } from "react";
import { User, LogOut, Star, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

export default function ProfilePage() {
  // Simulations d'états pour les notifications et abonnements
  const [notifImportant, setNotifImportant] = useState(true);
  const [notifCategories, setNotifCategories] = useState(false);

  // Simulation de l'utilisateur (à lier avec ton contexte/NestJS plus tard)
  const user = {
    name: "Jean Dupont",
    email: "jean@exemple.fr",
    role: "user", // Change en 'admin' pour voir le badge apparaître
  };

  return (
    <div className="w-full min-h-[calc(100vh-70px)] bg-blanc py-14 px-6">
      <div className="max-w-2xl mx-auto animate-slide-up">
        
        {/* --- EN-TÊTE PROFIL --- */}
        <div className="text-center mb-10">
          <div className="w-24 h-24 bg-linear-to-br from-vert to-noir rounded-full border-4 border-or flex items-center justify-center text-or mx-auto mb-4 shadow-lg">
            <User size={40} />
          </div>
          <h2 className="font-poppins font-black text-2xl text-noir">{user.name}</h2>
          <p className="font-montserrat text-sm text-champagne mt-1">{user.email}</p>
          
          {user.role === "admin" && (
            <Badge className="mt-3 bg-or text-noir font-poppins font-black text-xs px-3 py-1 hover:bg-or/90 border-0">
              Admin
            </Badge>
          )}
        </div>

        {/* --- CARTE DES PRÉFÉRENCES --- */}
        <div className="bg-blanc border border-champagne/30 rounded-2xl p-6 sm:p-8 mb-6 shadow-sm">
          
          {/* Abonnements */}
          <h3 className="font-raleway font-bold text-vert mb-5 flex items-center gap-2">
            <Star size={18} className="text-or" /> Mes abonnements
          </h3>
          <div className="flex flex-wrap gap-2 mb-8">
            <Badge className="bg-or text-noir hover:bg-or/90 font-montserrat font-bold text-sm px-4 py-2 rounded-full cursor-pointer border-0">
              🎭 Culture
            </Badge>
            <Badge className="bg-or text-noir hover:bg-or/90 font-montserrat font-bold text-sm px-4 py-2 rounded-full cursor-pointer border-0">
              🏗️ Travaux
            </Badge>
            <Badge variant="outline" className="bg-champagne/10 text-noir hover:bg-or hover:border-or font-montserrat font-bold text-sm px-4 py-2 rounded-full cursor-pointer border-champagne/30 transition-colors">
              ⚽ Sport
            </Badge>
            <Badge variant="outline" className="bg-champagne/10 text-noir hover:bg-or hover:border-or font-montserrat font-bold text-sm px-4 py-2 rounded-full cursor-pointer border-champagne/30 transition-colors">
              🎉 Événements
            </Badge>
          </div>

          <div className="h-px bg-champagne/20 w-full mb-8"></div>

          {/* Notifications */}
          <h3 className="font-raleway font-bold text-vert mb-5 flex items-center gap-2">
            <Bell size={18} className="text-champagne" /> Notifications
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-champagne/10">
              <span className="font-montserrat font-semibold text-sm text-noir">Alertes & Articles importants</span>
              <Switch 
                checked={notifImportant} 
                onCheckedChange={setNotifImportant} 
                className="data-[state=checked]:bg-or"
              />
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="font-montserrat font-semibold text-sm text-noir">Nouvelles catégories</span>
              <Switch 
                checked={notifCategories} 
                onCheckedChange={setNotifCategories} 
                className="data-[state=checked]:bg-or"
              />
            </div>
          </div>
        </div>

        {/* --- BOUTON DÉCONNEXION --- */}
        <Button 
          variant="destructive" 
          className="w-full py-6 bg-red-500 hover:bg-red-600 text-blanc font-montserrat font-bold rounded-xl transition-all hover:-translate-y-0.5 text-base"
        >
          <LogOut size={18} className="mr-2" /> Se déconnecter
        </Button>
      </div>
    </div>
  );
}