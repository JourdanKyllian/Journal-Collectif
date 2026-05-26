"use client";

import { useState } from "react";
import { 
  PenSquare, 
  Trash2, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  Image as ImageIcon, 
  Bold, 
  Italic, 
  Underline, 
  Heading2, 
  Link as LinkIcon 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ArticlesDashboard() {
  const [activeTab, setActiveTab] = useState("published");

  return (
    <div className="space-y-6 animate-slide-up">
      {/* En-tête */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-poppins font-black text-2xl text-noir">Articles</h1>
          <p className="font-raleway text-champagne text-sm">Gérez l'ensemble du contenu éditorial</p>
        </div>
        <Button 
          onClick={() => setActiveTab("create")}
          className="bg-or text-noir font-montserrat font-bold hover:bg-or/90 transition-all rounded-xl"
        >
          <PenSquare size={16} className="mr-2" /> Nouvel article
        </Button>
      </div>

      {/* Système d'onglets shadcn */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-champagne/15 rounded-xl p-1 h-auto mb-6 flex-wrap justify-start">
          <TabsTrigger value="published" className="py-2.5 px-5 rounded-lg font-montserrat font-bold text-sm data-[state=active]:bg-blanc data-[state=active]:shadow-sm data-[state=active]:text-noir text-champagne">
            ✅ Publiés <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700 hover:bg-green-100 border-0">12</Badge>
          </TabsTrigger>
          <TabsTrigger value="pending" className="py-2.5 px-5 rounded-lg font-montserrat font-bold text-sm data-[state=active]:bg-blanc data-[state=active]:shadow-sm data-[state=active]:text-noir text-champagne">
            ⏳ En attente <Badge variant="secondary" className="ml-2 bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-0">7</Badge>
          </TabsTrigger>
          <TabsTrigger value="drafts" className="py-2.5 px-5 rounded-lg font-montserrat font-bold text-sm data-[state=active]:bg-blanc data-[state=active]:shadow-sm data-[state=active]:text-noir text-champagne">
            📝 Brouillons <Badge variant="secondary" className="ml-2 bg-champagne/30 text-vert hover:bg-champagne/30 border-0">3</Badge>
          </TabsTrigger>
          <TabsTrigger value="create" className="py-2.5 px-5 rounded-lg font-montserrat font-bold text-sm data-[state=active]:bg-blanc data-[state=active]:shadow-sm data-[state=active]:text-noir text-champagne">
            ＋ Créer
          </TabsTrigger>
        </TabsList>

        {/* --- ONGLET : PUBLIÉS --- */}
        <TabsContent value="published">
          <div className="bg-blanc rounded-2xl border border-champagne/20 overflow-hidden">
            <Table>
              <TableHeader className="bg-champagne/5">
                <TableRow className="hover:bg-transparent border-champagne/20">
                  <TableHead className="font-raleway font-semibold text-xs text-champagne tracking-widest uppercase">Titre</TableHead>
                  <TableHead className="font-raleway font-semibold text-xs text-champagne tracking-widest uppercase hidden md:table-cell">Catégorie</TableHead>
                  <TableHead className="font-raleway font-semibold text-xs text-champagne tracking-widest uppercase hidden md:table-cell">Date</TableHead>
                  <TableHead className="font-raleway font-semibold text-xs text-champagne tracking-widest uppercase hidden md:table-cell">Vues</TableHead>
                  <TableHead className="font-raleway font-semibold text-xs text-champagne tracking-widest uppercase text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { title: "Festival d'Été 2026", cat: "🎭 Culture", date: "15 fév.", views: "1 234" },
                  { title: "Rénovation Route Nationale", cat: "🏗️ Travaux", date: "14 fév.", views: "892" },
                  { title: "Victoire en demi-finale", cat: "⚽ Sport", date: "13 fév.", views: "456" },
                ].map((row, i) => (
                  <TableRow key={i} className="hover:bg-champagne/5 border-champagne/10 transition-colors">
                    <TableCell className="font-montserrat font-semibold text-sm">{row.title}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge className="bg-or/15 text-vert hover:bg-or/20 border-0 font-montserrat font-bold">{row.cat}</Badge>
                    </TableCell>
                    <TableCell className="font-montserrat text-xs text-champagne hidden md:table-cell">{row.date}</TableCell>
                    <TableCell className="font-montserrat text-xs font-semibold hidden md:table-cell">{row.views}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="icon" className="bg-champagne/20 text-vert hover:bg-champagne/40 rounded-lg h-8 w-8">
                          <PenSquare size={14} />
                        </Button>
                        <Button variant="ghost" size="icon" className="bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 rounded-lg h-8 w-8">
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* --- ONGLET : EN ATTENTE --- */}
        <TabsContent value="pending" className="space-y-4">
          <div className="bg-blanc border border-yellow-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start gap-4 hover:shadow-md transition-all">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center text-xl shrink-0">📝</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="font-montserrat font-bold text-sm">Marché de printemps — Appel aux exposants</h3>
                <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-0 font-poppins font-black text-xs">En attente</Badge>
              </div>
              <div className="font-montserrat text-xs text-champagne mb-3">🎉 Événements · Soumis par Marie Dupont · il y a 2h</div>
              <p className="font-montserrat text-xs text-noir/70 line-clamp-2">La municipalité lance les inscriptions pour le marché de printemps 2026. Les exposants peuvent s'inscrire jusqu'au 15 mars...</p>
            </div>
            <div className="flex sm:flex-col gap-2 shrink-0 w-full sm:w-auto mt-4 sm:mt-0">
              <Button size="sm" className="bg-green-500 hover:bg-green-600 text-blanc font-montserrat font-bold rounded-lg flex-1 sm:flex-none">
                <CheckCircle2 size={14} className="mr-1.5" /> Publier
              </Button>
              <Button size="sm" variant="outline" className="bg-champagne/20 border-0 text-vert hover:bg-champagne/40 font-montserrat font-bold rounded-lg flex-1 sm:flex-none">
                <Eye size={14} className="mr-1.5" /> Aperçu
              </Button>
              <Button size="sm" variant="outline" className="bg-red-50 border-0 text-red-500 hover:bg-red-100 font-montserrat font-bold rounded-lg flex-1 sm:flex-none">
                <XCircle size={14} className="mr-1.5" /> Refuser
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* --- ONGLET : BROUILLONS --- */}
        <TabsContent value="drafts">
          <div className="bg-blanc border border-champagne/30 rounded-2xl p-5 flex items-center gap-4 hover:shadow-md transition-all opacity-80">
            <div className="w-12 h-12 bg-champagne/20 rounded-xl flex items-center justify-center text-xl shrink-0 text-champagne"><PenSquare size={20} /></div>
            <div className="flex-1 min-w-0">
              <h3 className="font-montserrat font-bold text-sm mb-1">Brouillon — Conseil municipal mars 2026</h3>
              <div className="font-montserrat text-xs text-champagne">📢 Annonces · Modifié il y a 1j</div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="bg-or text-noir hover:bg-or/80 font-montserrat font-bold rounded-lg"><PenSquare size={14} className="mr-1.5" /> Éditer</Button>
              <Button size="icon" variant="ghost" className="bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 rounded-lg h-9 w-9"><Trash2 size={14} /></Button>
            </div>
          </div>
        </TabsContent>

        {/* --- ONGLET : CRÉER --- */}
        <TabsContent value="create">
          <div className="bg-blanc rounded-2xl border border-champagne/20 p-6 max-w-3xl">
            <h2 className="font-poppins font-black text-xl text-noir mb-6 flex items-center gap-2"><PenSquare size={20} className="text-or" /> Nouvel article</h2>
            
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="font-montserrat font-bold text-xs text-vert tracking-wide uppercase">Titre *</label>
                <Input placeholder="Titre accrocheur de l'article" className="px-4 py-6 border-champagne/40 rounded-xl bg-blanc focus-visible:ring-or/30 focus-visible:border-or" />
              </div>

              <div className="space-y-2">
                <label className="font-montserrat font-bold text-xs text-vert tracking-wide uppercase">Résumé / Chapô *</label>
                <Textarea rows={3} placeholder="2-3 phrases qui donnent envie de lire..." className="px-4 py-3 border-champagne/40 rounded-xl bg-blanc focus-visible:ring-or/30 focus-visible:border-or resize-none" />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="font-montserrat font-bold text-xs text-vert tracking-wide uppercase">Catégorie *</label>
                  <Select>
                    <SelectTrigger className="px-4 py-6 border-champagne/40 rounded-xl bg-blanc focus:ring-or/30 focus:border-or font-montserrat text-sm">
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent className="bg-blanc border-champagne/40 rounded-xl font-montserrat">
                      <SelectItem value="culture">🎭 Culture</SelectItem>
                      <SelectItem value="sport">⚽ Sport</SelectItem>
                      <SelectItem value="travaux">🏗️ Travaux</SelectItem>
                      <SelectItem value="faits">🚨 Faits divers</SelectItem>
                      <SelectItem value="events">🎉 Événements</SelectItem>
                      <SelectItem value="annonces">📢 Annonces</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="font-montserrat font-bold text-xs text-vert tracking-wide uppercase">Tags</label>
                  <Input placeholder="festival, été (séparés par ,)" className="px-4 py-6 border-champagne/40 rounded-xl bg-blanc focus-visible:ring-or/30 focus-visible:border-or" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-montserrat font-bold text-xs text-vert tracking-wide uppercase">Contenu *</label>
                <div className="border border-champagne/40 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-or/30 focus-within:border-or transition-all">
                  {/* Toolbar WYSIWYG factice */}
                  <div className="bg-champagne/15 px-4 py-2.5 border-b border-champagne/30 flex gap-2 overflow-x-auto">
                    <Button variant="ghost" size="icon" className="h-8 w-8 bg-blanc border border-champagne/30 text-noir hover:bg-or/20 rounded-lg"><Bold size={14} /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 bg-blanc border border-champagne/30 text-noir hover:bg-or/20 rounded-lg"><Italic size={14} /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 bg-blanc border border-champagne/30 text-noir hover:bg-or/20 rounded-lg"><Underline size={14} /></Button>
                    <span className="w-px bg-champagne/30 mx-1 shrink-0"></span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 bg-blanc border border-champagne/30 text-noir hover:bg-or/20 rounded-lg"><Heading2 size={14} /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 bg-blanc border border-champagne/30 text-noir hover:bg-or/20 rounded-lg"><ImageIcon size={14} /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 bg-blanc border border-champagne/30 text-noir hover:bg-or/20 rounded-lg"><LinkIcon size={14} /></Button>
                  </div>
                  <Textarea rows={8} placeholder="Rédigez le contenu complet ici..." className="w-full border-0 focus-visible:ring-0 rounded-none bg-blanc font-montserrat text-sm resize-y" />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1 py-6 border-champagne/40 text-noir font-montserrat font-bold rounded-xl hover:bg-champagne/10">
                  <Eye size={16} className="mr-2" /> Aperçu
                </Button>
                <Button className="flex-1 py-6 bg-noir text-blanc font-montserrat font-bold rounded-xl hover:bg-vert hover:-translate-y-0.5 transition-all">
                  <CheckCircle2 size={16} className="mr-2" /> Publier l'article
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}