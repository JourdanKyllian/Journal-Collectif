"use client";

import { useState } from "react";
import { 
  PenSquare, Trash2, Eye, CheckCircle2, 
  XCircle, Plus, Clock, FileText, FileEdit
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SkeletonTableRow, SkeletonGrid } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FeedbackAlert, FeedbackMessage } from "@/components/ui/feedback-alert";
import { useFetchApi } from "@/hooks/useFetchApi";
import { fetchApi } from "@/lib/api";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { formatDateToFrench, getCategoryUI } from "@/lib/formatters";

interface AdminArticle {
  id: number;
  titre: string;
  contenu: string;
  published_at: string;
  statut: "brouillon" | "en_attente" | "publie" | "corbeille";
  categorie?: { libelle: string };
}

interface Categorie {
  id: number;
  libelle: string;
  icon: string;
}

/**
 * Interface d'administration globale du contenu éditorial.
 * Permet aux rédacteurs de créer des articles (avec éditeur riche) et aux administrateurs de les valider.
 */
export default function ArticlesDashboard() {
  const [activeTab, setActiveTab] = useState("published");
  
  const { data: articles, isLoading, refetch: refetchArticles } = useFetchApi<AdminArticle[]>('/v1/article/admin/all');
  const { data: categories } = useFetchApi<Categorie[]>('/v1/categorie');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);
  const [formData, setFormData] = useState({
    titre: "",
    contenu: "",
    categorieId: "",
  });

  const publishedArticles = articles?.filter(a => a.statut === "publie") || [];
  const pendingArticles = articles?.filter(a => a.statut === "en_attente") || [];
  const draftArticles = articles?.filter(a => a.statut === "brouillon") || [];

  /**
   * Gère la soumission du formulaire pour créer un article.
   * 
   * @param {React.FormEvent} e - L'événement natif du formulaire.
   * @param {boolean} isDraft - Indique si l'utilisateur souhaite sauvegarder en brouillon ou publier.
   */
  const handleSubmit = async (e: React.FormEvent, isDraft: boolean) => {
    e.preventDefault();
    
    if (!formData.categorieId) {
      setFeedback({ type: "error", message: "Veuillez sélectionner une catégorie." });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const payload = {
        titre: formData.titre,
        contenu: formData.contenu,
        categorieId: Number(formData.categorieId),
        statut: isDraft ? "brouillon" : "publie" 
      };

      await fetchApi('/v1/article', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setFeedback({ type: "success", message: isDraft ? "Brouillon sauvegardé !" : "Article soumis avec succès !" });
      
      setFormData({ titre: "", contenu: "", categorieId: "" });
      await refetchArticles();
      
      setTimeout(() => setActiveTab(isDraft ? "drafts" : "pending"), 1000);

    } catch (error: unknown) {
      setFeedback({ type: "error", message: (error as Error).message || "Erreur de sauvegarde" });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Action administrateur pour valider un article en attente.
   * 
   * @param {number} id - L'identifiant de l'article à valider.
   */
  const handlePublish = async (id: number) => {
    try {
      await fetchApi(`/v1/article/${id}/publish`, { method: 'PATCH' });
      await refetchArticles();
    } catch (error: unknown) {
      alert((error as Error).message || "Erreur lors de la publication");
    }
  };

  /**
   * Action pour supprimer un article (Soft Delete).
   * 
   * @param {number} id - L'identifiant de l'article à supprimer.
   */
  const handleDelete = async (id: number) => {
    if (!confirm("Voulez-vous vraiment supprimer cet article ?")) return;
    try {
      await fetchApi(`/v1/article/${id}`, { method: 'DELETE' });
      await refetchArticles();
    } catch (error: unknown) {
      alert((error as Error).message || "Erreur lors de la suppression");
    }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* En-tête avec bouton de création rapide */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-poppins font-black text-2xl text-noir">Articles</h1>
          <p className="font-raleway text-champagne text-sm">Gérez l&apos;ensemble du contenu éditorial</p>
        </div>
        <Button 
          onClick={() => setActiveTab("create")}
          className="bg-or text-noir font-montserrat font-bold hover:bg-or/90 transition-all rounded-xl"
        >
          <Plus size={16} className="mr-2" /> Nouvel article
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col">
        {/* Navigation des onglets */}
        <TabsList className="bg-champagne/15 rounded-xl p-1 h-auto mb-6 flex flex-wrap justify-start gap-1">
          <TabsTrigger value="published" className="py-2.5 px-5 rounded-lg font-montserrat font-bold text-sm data-[state=active]:bg-blanc data-[state=active]:shadow-sm data-[state=active]:text-noir text-champagne">
            <CheckCircle2 size={16} className="mr-1.5" /> Publiés <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700 hover:bg-green-100 border-0">{publishedArticles.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="pending" className="py-2.5 px-5 rounded-lg font-montserrat font-bold text-sm data-[state=active]:bg-blanc data-[state=active]:shadow-sm data-[state=active]:text-noir text-champagne">
            <Clock size={16} className="mr-1.5" /> En attente <Badge variant="secondary" className="ml-2 bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-0">{pendingArticles.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="drafts" className="py-2.5 px-5 rounded-lg font-montserrat font-bold text-sm data-[state=active]:bg-blanc data-[state=active]:shadow-sm data-[state=active]:text-noir text-champagne">
            <FileText size={16} className="mr-1.5" /> Brouillons <Badge variant="secondary" className="ml-2 bg-champagne/30 text-vert hover:bg-champagne/30 border-0">{draftArticles.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="create" className="py-2.5 px-5 rounded-lg font-montserrat font-bold text-sm data-[state=active]:bg-blanc data-[state=active]:shadow-sm data-[state=active]:text-noir text-champagne">
            <Plus size={16} className="mr-1.5" /> Créer
          </TabsTrigger>
        </TabsList>

        {/* --- ONGLET PUBLIÉS --- */}
        <TabsContent value="published" className="outline-none">
          <div className="bg-blanc rounded-2xl border border-champagne/20 overflow-hidden">
            <Table>
              <TableHeader className="bg-champagne/5">
                <TableRow className="hover:bg-transparent border-champagne/20">
                  <TableHead className="font-raleway font-semibold text-xs text-champagne tracking-widest uppercase">Titre</TableHead>
                  <TableHead className="font-raleway font-semibold text-xs text-champagne tracking-widest uppercase hidden md:table-cell">Catégorie</TableHead>
                  <TableHead className="font-raleway font-semibold text-xs text-champagne tracking-widest uppercase hidden md:table-cell">Date</TableHead>
                  <TableHead className="font-raleway font-semibold text-xs text-champagne tracking-widest uppercase text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <SkeletonGrid count={5} Component={SkeletonTableRow} />
                ) : publishedArticles.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-6 text-champagne">Aucun article publié.</TableCell></TableRow>
                ) : (
                  publishedArticles.map((row) => {
                    const CatIcon = getCategoryUI(row.categorie?.libelle || "Général").icon;
                    return (
                      <TableRow key={row.id} className="hover:bg-champagne/5 border-champagne/10 transition-colors">
                        <TableCell className="font-montserrat font-semibold text-sm">{row.titre}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge className="bg-or/15 text-vert hover:bg-or/20 border-0 font-montserrat font-bold flex items-center gap-1.5 w-fit">
                            <CatIcon size={14} />
                            {row.categorie?.libelle || "Général"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-montserrat text-xs text-champagne hidden md:table-cell">{formatDateToFrench(row.published_at)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button variant="ghost" size="icon" className="bg-champagne/20 text-vert hover:bg-champagne/40 rounded-lg h-8 w-8">
                              <Eye size={14} />
                            </Button>
                            <Button onClick={() => handleDelete(row.id)} variant="ghost" size="icon" className="bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 rounded-lg h-8 w-8">
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* --- ONGLET EN ATTENTE --- */}
        <TabsContent value="pending" className="space-y-4 outline-none">
          {isLoading ? (
             <SkeletonGrid count={2} Component={SkeletonTableRow} />
          ) : pendingArticles.length === 0 ? (
            <div className="text-center py-10 bg-champagne/5 rounded-xl border border-champagne/20 text-champagne">Aucun article en attente de validation.</div>
          ) : (
            pendingArticles.map(article => {
              const CatIcon = getCategoryUI(article.categorie?.libelle || "Général").icon;
              return (
                <div key={article.id} className="bg-blanc border border-yellow-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start gap-4 hover:shadow-md transition-all">
                  <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center shrink-0">
                    <Clock size={24} className="text-yellow-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-montserrat font-bold text-sm">{article.titre}</h3>
                      <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-0 font-poppins font-black text-xs">En attente</Badge>
                    </div>
                    <div className="font-montserrat text-xs text-champagne mb-3 flex items-center gap-1.5">
                      <CatIcon size={14} />
                      Thématique : {article.categorie?.libelle || "Général"}
                    </div>
                  </div>
                  <div className="flex sm:flex-col gap-2 shrink-0 w-full sm:w-auto mt-4 sm:mt-0">
                    <Button onClick={() => handlePublish(article.id)} size="sm" className="bg-green-500 hover:bg-green-600 text-blanc font-montserrat font-bold rounded-lg flex-1 sm:flex-none">
                      <CheckCircle2 size={14} className="mr-1.5" /> Publier
                    </Button>
                    <Button onClick={() => handleDelete(article.id)} size="sm" variant="outline" className="bg-red-50 border-0 text-red-500 hover:bg-red-100 font-montserrat font-bold rounded-lg flex-1 sm:flex-none">
                      <XCircle size={14} className="mr-1.5" /> Refuser
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </TabsContent>

        {/* --- ONGLET BROUILLONS --- */}
        <TabsContent value="drafts" className="outline-none space-y-4">
           {isLoading ? (
             <SkeletonGrid count={2} Component={SkeletonTableRow} />
          ) : draftArticles.length === 0 ? (
            <div className="text-center py-10 bg-champagne/5 rounded-xl border border-champagne/20 text-champagne">Aucun brouillon enregistré.</div>
          ) : (
            draftArticles.map(article => {
              const CatIcon = getCategoryUI(article.categorie?.libelle || "Général").icon;
              return (
                <div key={article.id} className="bg-blanc border border-champagne/30 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:shadow-md transition-all opacity-80">
                  <div className="w-12 h-12 bg-champagne/20 rounded-xl flex items-center justify-center shrink-0 text-champagne">
                    <FileEdit size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-montserrat font-bold text-sm mb-1">{article.titre}</h3>
                    <div className="font-montserrat text-xs text-champagne flex items-center gap-1.5">
                      <CatIcon size={14} />
                      Catégorie : {article.categorie?.libelle || "Non classé"}
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto mt-4 sm:mt-0">
                    <Button onClick={() => handlePublish(article.id)} size="sm" className="bg-or text-noir hover:bg-or/80 font-montserrat font-bold rounded-lg flex-1 sm:flex-none">
                      <CheckCircle2 size={14} className="mr-1.5" /> Soumettre
                    </Button>
                    <Button onClick={() => handleDelete(article.id)} size="icon" variant="ghost" className="bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 rounded-lg h-9 w-9 shrink-0">
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </TabsContent>

        {/* --- ONGLET CRÉER --- */}
        <TabsContent value="create" className="outline-none">
          <div className="bg-blanc rounded-2xl border border-champagne/20 p-6 max-w-4xl">
            <h2 className="font-poppins font-black text-xl text-noir mb-6 flex items-center gap-2">
              <PenSquare size={20} className="text-or" /> Nouvel article
            </h2>
            
            <FeedbackAlert feedback={feedback} />

            <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-5">
              <div className="space-y-2">
                <label className="font-montserrat font-bold text-xs text-vert tracking-wide uppercase">Titre *</label>
                <Input 
                  required 
                  value={formData.titre} 
                  onChange={(e) => setFormData({...formData, titre: e.target.value})} 
                  placeholder="Titre accrocheur de l'article" 
                  className="px-4 py-6 border-champagne/40 rounded-xl bg-blanc focus-visible:ring-or/30 focus-visible:border-or text-lg font-bold" 
                />
              </div>

              <div className="space-y-2">
                <label className="font-montserrat font-bold text-xs text-vert tracking-wide uppercase">Catégorie *</label>
                <Select required value={formData.categorieId} onValueChange={(val) => setFormData({...formData, categorieId: val})}>
                  <SelectTrigger className="px-4 py-6 border-champagne/40 rounded-xl bg-blanc focus:ring-or/30 focus:border-or font-montserrat text-sm w-full md:w-1/2">
                    <SelectValue placeholder="Sélectionnez une thématique..." />
                  </SelectTrigger>
                  <SelectContent className="bg-blanc border-champagne/40 rounded-xl font-montserrat">
                    {categories?.map((cat) => {
                      const CatIcon = getCategoryUI(cat.libelle).icon;
                      return (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          <div className="flex items-center gap-2">
                            <CatIcon size={14} />
                            <span>{cat.libelle}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="font-montserrat font-bold text-xs text-vert tracking-wide uppercase">Contenu de l&apos;article *</label>
                <RichTextEditor 
                  value={formData.contenu} 
                  onChange={(html) => setFormData({...formData, contenu: html})} 
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-champagne/20">
                <Button 
                  type="button" 
                  onClick={(e) => handleSubmit(e, true)}
                  disabled={isSubmitting || !formData.titre} 
                  variant="outline" 
                  className="flex-1 py-6 border-champagne/40 text-noir font-montserrat font-bold rounded-xl hover:bg-champagne/10"
                >
                  <PenSquare size={16} className="mr-2" /> Sauvegarder le brouillon
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !formData.titre || !formData.categorieId || !formData.contenu} 
                  className="flex-1 py-6 bg-noir text-blanc font-montserrat font-bold rounded-xl hover:bg-vert hover:-translate-y-0.5 transition-all"
                >
                  <CheckCircle2 size={16} className="mr-2" /> Soumettre l&apos;article
                </Button>
              </div>
            </form>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
