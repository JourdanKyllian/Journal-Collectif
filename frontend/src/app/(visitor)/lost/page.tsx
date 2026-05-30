"use client";

import { useState } from "react";
import { Search, Plus, Backpack, Key, Smartphone, Dog, Glasses, Gem } from "lucide-react";
import LostObjectCard, { ObjectStatus } from "@/components/features/LostObjectCard";
import { Button } from "@/components/ui/button";

export default function LostObjectsPage() {
  const [activeFilter, setActiveFilter] = useState("all");

  // Données factices inspirées de ton prototype
  const objects = [
    { id: 1, reference: "#OBJ-0042", title: "Sac à dos noir Nike", location: "Place du marché", date: "12 février 2026", status: "perdu" as ObjectStatus, icon: Backpack },
    { id: 2, reference: "#OBJ-0041", title: "Trousseau de clés", location: "Rue de la République", date: "10 février 2026", status: "trouve" as ObjectStatus, icon: Key },
    { id: 3, reference: "#OBJ-0040", title: "Téléphone Samsung Galaxy", location: "Parc municipal", date: "8 février 2026", status: "perdu" as ObjectStatus, icon: Smartphone },
    { id: 4, reference: "#OBJ-0039", title: "Chien perdu — Labrador beige", location: "Quartier des Fleurs", date: "7 février 2026", status: "perdu" as ObjectStatus, icon: Dog },
    { id: 5, reference: "#OBJ-0038", title: "Lunettes de vue", location: "Bibliothèque municipale", date: "5 février 2026", status: "trouve" as ObjectStatus, icon: Glasses },
    { id: 6, reference: "#OBJ-0037", title: "Alliance or jaune", location: "Salle des fêtes", date: "1er février 2026", status: "reclame" as ObjectStatus, icon: Gem },
  ];

  const filters = [
    { id: "all", label: "Tous" },
    { id: "perdu", label: "Perdus" },
    { id: "trouve", label: "Trouvés" },
    { id: "reclame", label: "Réclamés" },
  ];

  const filteredObjects = activeFilter === "all" 
    ? objects 
    : objects.filter(obj => obj.status === activeFilter);

  return (
    <div className="w-full relative pb-20">
      {/* En-tête */}
      <div className="bg-linear-to-br from-vert to-noir py-16 px-6 text-center">
        <h1 className="font-poppins font-black text-4xl text-blanc mb-3">
          Objets <span className="text-or">Perdus</span>
        </h1>
        <p className="font-raleway text-blanc/70 text-lg">
          Déclarez ou recherchez un objet perdu dans la commune
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Barre de recherche et Filtres */}
        <div className="flex gap-3 mb-8 flex-wrap items-center">
          <div className="relative flex-1 min-w-55">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-champagne" />
            <input 
              type="text" 
              placeholder="Rechercher un objet..." 
              className="w-full pl-11 pr-5 py-3 border border-champagne/40 rounded-xl font-montserrat text-sm bg-blanc text-noir focus:border-or focus:ring-2 focus:ring-or/10 transition-all outline-none"
            />
          </div>
          
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`font-montserrat font-bold text-sm px-5 py-3 rounded-full transition-all ${
                activeFilter === filter.id
                  ? "bg-or text-noir shadow-md"
                  : "bg-champagne/20 text-noir hover:bg-or hover:text-noir"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Grille des objets */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredObjects.map((obj) => (
            <LostObjectCard key={obj.id} {...obj} />
          ))}
        </div>
      </div>

      {/* Bouton d'action flottant (FAB) pour déclarer un objet */}
      <Button 
        className="fixed bottom-7 right-7 z-40 flex items-center gap-2 bg-or text-noir hover:bg-or/90 font-montserrat font-bold px-6 py-6 h-auto rounded-full shadow-2xl shadow-or/40 transition-all hover:-translate-y-1 hover:shadow-or/50"
      >
        <Plus size={20} /> Déclarer un objet
      </Button>
    </div>
  );
}