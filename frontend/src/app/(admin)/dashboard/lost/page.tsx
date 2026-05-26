"use client";

import { useState } from "react";
import { 
  Search, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Smartphone, 
  Backpack, 
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function LostObjectsDashboard() {
  const [activeTab, setActiveTab] = useState("active");

  return (
    <div className="space-y-6 animate-slide-up">
      {/* En-tête */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-poppins font-black text-2xl text-noir">Objets Perdus</h1>
          <p className="font-raleway text-champagne text-sm">Modérez les déclarations d'objets</p>
        </div>
      </div>

      {/* Système d'onglets shadcn */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-champagne/15 rounded-xl p-1 h-auto mb-6 flex-wrap justify-start">
          <TabsTrigger value="active" className="py-2.5 px-5 rounded-lg font-montserrat font-bold text-sm data-[state=active]:bg-blanc data-[state=active]:shadow-sm data-[state=active]:text-noir text-champagne">
            ✅ En ligne <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700 hover:bg-green-100 border-0">22</Badge>
          </TabsTrigger>
          <TabsTrigger value="pending" className="py-2.5 px-5 rounded-lg font-montserrat font-bold text-sm data-[state=active]:bg-blanc data-[state=active]:shadow-sm data-[state=active]:text-noir text-champagne">
            ⏳ En attente <Badge variant="secondary" className="ml-2 bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-0">4</Badge>
          </TabsTrigger>
          <TabsTrigger value="closed" className="py-2.5 px-5 rounded-lg font-montserrat font-bold text-sm data-[state=active]:bg-blanc data-[state=active]:shadow-sm data-[state=active]:text-noir text-champagne">
            ✓ Clôturés <Badge variant="secondary" className="ml-2 bg-champagne/30 text-vert hover:bg-champagne/30 border-0">10</Badge>
          </TabsTrigger>
        </TabsList>

        {/* --- ONGLET : EN LIGNE --- */}
        <TabsContent value="active">
          <div className="bg-blanc rounded-2xl border border-champagne/20 overflow-hidden">
            <Table>
              <TableHeader className="bg-champagne/5">
                <TableRow className="hover:bg-transparent border-champagne/20">
                  <TableHead className="font-raleway font-semibold text-xs text-champagne tracking-widest uppercase">Réf.</TableHead>
                  <TableHead className="font-raleway font-semibold text-xs text-champagne tracking-widest uppercase">Objet</TableHead>
                  <TableHead className="font-raleway font-semibold text-xs text-champagne tracking-widest uppercase hidden md:table-cell">Lieu</TableHead>
                  <TableHead className="font-raleway font-semibold text-xs text-champagne tracking-widest uppercase hidden md:table-cell">Statut</TableHead>
                  <TableHead className="font-raleway font-semibold text-xs text-champagne tracking-widest uppercase text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="hover:bg-champagne/5 border-champagne/10 transition-colors">
                  <TableCell className="font-montserrat text-xs text-champagne">#OBJ-0042</TableCell>
                  <TableCell className="font-montserrat font-semibold text-sm">Sac à dos Nike</TableCell>
                  <TableCell className="font-montserrat text-xs text-champagne hidden md:table-cell">Place du marché</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-0 font-poppins font-black text-xs">Perdu</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="sm" className="bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 font-montserrat font-bold text-xs rounded-lg">
                        <Check size={14} className="mr-1.5" /> Trouvé
                      </Button>
                      <Button variant="ghost" size="icon" className="bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 rounded-lg h-8 w-8">
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                <TableRow className="hover:bg-champagne/5 border-champagne/10 transition-colors">
                  <TableCell className="font-montserrat text-xs text-champagne">#OBJ-0041</TableCell>
                  <TableCell className="font-montserrat font-semibold text-sm">Trousseau de clés</TableCell>
                  <TableCell className="font-montserrat text-xs text-champagne hidden md:table-cell">Rue République</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-0 font-poppins font-black text-xs">Trouvé</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="sm" className="bg-champagne/20 text-vert hover:bg-champagne/40 font-montserrat font-bold text-xs rounded-lg">
                        <Check size={14} className="mr-1.5" /> Clôturer
                      </Button>
                      <Button variant="ghost" size="icon" className="bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 rounded-lg h-8 w-8">
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* --- ONGLET : EN ATTENTE --- */}
        <TabsContent value="pending" className="space-y-4">
          <div className="bg-blanc border border-yellow-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-4 hover:shadow-md transition-all">
            <div className="w-14 h-14 bg-champagne/15 rounded-xl flex items-center justify-center text-champagne shrink-0">
              <Smartphone size={28} />
            </div>
            <div className="flex-1 min-w-0 w-full text-center sm:text-left">
              <h3 className="font-montserrat font-bold text-sm mb-1">Samsung Galaxy S24 — Coque bleue</h3>
              <div className="font-montserrat text-xs text-champagne">Déclaré par Lucie Martin · Parc municipal · il y a 3h</div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button size="sm" className="bg-green-500 hover:bg-green-600 text-blanc font-montserrat font-bold rounded-lg flex-1 sm:flex-none">
                <CheckCircle2 size={14} className="mr-1.5" /> Valider
              </Button>
              <Button size="sm" variant="outline" className="bg-red-50 border-0 text-red-500 hover:bg-red-100 font-montserrat font-bold rounded-lg flex-1 sm:flex-none">
                <XCircle size={14} className="mr-1.5" /> Refuser
              </Button>
            </div>
          </div>

          <div className="bg-blanc border border-yellow-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-4 hover:shadow-md transition-all">
            <div className="w-14 h-14 bg-champagne/15 rounded-xl flex items-center justify-center text-champagne shrink-0">
              <Backpack size={28} />
            </div>
            <div className="flex-1 min-w-0 w-full text-center sm:text-left">
              <h3 className="font-montserrat font-bold text-sm mb-1">Cartable enfant — Rouge avec étoiles</h3>
              <div className="font-montserrat text-xs text-champagne">Déclaré par Paul Durand · École primaire · il y a 5h</div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button size="sm" className="bg-green-500 hover:bg-green-600 text-blanc font-montserrat font-bold rounded-lg flex-1 sm:flex-none">
                <CheckCircle2 size={14} className="mr-1.5" /> Valider
              </Button>
              <Button size="sm" variant="outline" className="bg-red-50 border-0 text-red-500 hover:bg-red-100 font-montserrat font-bold rounded-lg flex-1 sm:flex-none">
                <XCircle size={14} className="mr-1.5" /> Refuser
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* --- ONGLET : CLÔTURÉS --- */}
        <TabsContent value="closed">
          <div className="bg-blanc rounded-2xl border border-champagne/20 p-8 text-center text-champagne flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 size={32} className="text-green-500" />
            </div>
            <p className="font-montserrat font-semibold text-noir">10 dossiers clôturés ce mois-ci</p>
            <p className="font-montserrat text-xs mt-2">Les objets ont été restitués à leurs propriétaires.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}