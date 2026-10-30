"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  PenSquare, Trash2, Eye, CheckCircle2, 
  XCircle, Plus, Clock, FileText, FileEdit, FolderTree, UserX, ArchiveRestore
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SkeletonTableRow, SkeletonGrid } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FeedbackAlert, FeedbackMessage } from "@/components/ui/feedback-alert";
import { FileUpload } from "@/components/ui/file-upload";
import { useFetchApi } from "@/hooks/useFetchApi";
import { fetchApi, resolveImageUrl } from "@/lib/api";
import { PaginatedResponse } from "@/lib/types";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { formatDateToFrench, getCategoryUI } from "@/lib/formatters";

interface ArticleCredit {
  role: string;
  name: string;
  anonymous?: boolean;
}

interface AdminArticle {
  id: number;
  titre: string;
  contenu: string;
  image_couverture?: string | null;
  published_at: string | null;
  scheduled_at?: string | null;
  statut: "brouillon" | "en_attente" | "publie" | "corbeille";
  categorie?: { id?: number; libelle: string };
  credits?: ArticleCredit[];
}

interface AdminCategorie {
  id: number;
  libelle: string;
  description: string | null;
  icon: string;
  image_bandeau_url: string;
}

interface AuthUser {
  role: string | { libelle: string };
}

/**
 * Interface d'administration globale du contenu éditorial.
 * Gère la création d'articles, la modération et l'arborescence des catégories.
 */
export default function ArticlesDashboard() {
  const [activeTab, setActiveTab] = useState<string>("published");
  
  const { data: user } = useFetchApi<AuthUser>('/v1/auth/me');
  const { data: articlesPage, isLoading: isArticlesLoading, refetch: refetchArticles } = useFetchApi<PaginatedResponse<AdminArticle>>('/v1/article/admin/all?limit=100');
  const { data: categories, isLoading: isCatsLoading, refetch: refetchCategories } = useFetchApi<AdminCategorie[]>('/v1/categorie');

  const [isSubmittingArticle, setIsSubmittingArticle] = useState<boolean>(false);
  const [articleFeedback, setArticleFeedback] = useState<FeedbackMessage | null>(null);
  const [articleData, setArticleData] = useState({ titre: "", contenu: "", categorieId: "", image_couverture: "" });

  const [isSubmittingCat, setIsSubmittingCat] = useState<boolean>(false);
  const [catFeedback, setCatFeedback] = useState<FeedbackMessage | null>(null);
  const [catData, setCatData] = useState({ libelle: "", description: "", icon: "", image_bandeau_url: "" });

  const userRole = (typeof user?.role === 'string' ? user.role : user?.role?.libelle || '').toLowerCase();
  const isAdmin = ['super_admin', 'admin'].includes(userRole);
  const canManageCategories = isAdmin;

  const articles = articlesPage?.data || [];
  const publishedArticles = articles.filter(a => a.statut === "publie");
  const pendingArticles = articles.filter(a => a.statut === "en_attente");
  const draftArticles = articles.filter(a => a.statut === "brouillon");

  /**
   * Soumet les données du formulaire pour créer ou sauvegarder un article.
   */
  const handleArticleSubmit = async (e: React.FormEvent, isDraft: boolean): Promise<void> => {
    e.preventDefault();
    
    if (!articleData.categorieId) {
      setArticleFeedback({ type: "error", message: "Veuillez sélectionner une catégorie." });
      return;
    }

    setIsSubmittingArticle(true);
    setArticleFeedback(null);

    try {
      await fetchApi('/v1/article', {
        method: 'POST',
        body: JSON.stringify({
          titre: articleData.titre,
          contenu: articleData.contenu,
          categorieId: Number(articleData.categorieId),
          image_couverture: articleData.image_couverture.trim() || undefined,
          statut: isDraft ? "brouillon" : (isAdmin ? "publie" : "en_attente")
        })
      });

      setArticleFeedback({
        type: "success",
        message: isDraft
          ? "Brouillon sauvegardé."
          : isAdmin
            ? "Article publié avec succès."
            : "Article soumis à la validation d'un administrateur.",
      });
      setArticleData({ titre: "", contenu: "", categorieId: "", image_couverture: "" });
      await refetchArticles();
      
      setTimeout(() => setActiveTab(isDraft ? "drafts" : (isAdmin ? "published" : "pending")), 1000);
    } catch (error: unknown) {
      setArticleFeedback({ type: "error", message: (error as Error).message || "Erreur de sauvegarde." });
    } finally {
      setIsSubmittingArticle(false);
    }
  };

  /**
   * Valide et publie publiquement un article (Réservé Admin / Super Admin).
   */
  const handlePublishArticle = async (id: number): Promise<void> => {
    try {
      await fetchApi(`/v1/article/${id}/publish`, { method: 'PATCH' });
      await refetchArticles();
    } catch (error: unknown) {
      alert((error as Error).message || "Erreur lors de la publication.");
    }
  };

  /**
   * Soumet un brouillon en attente de modération (Rédacteur ou Admin).
   */
  const handleSubmitDraftForReview = async (id: number): Promise<void> => {
    try {
      if (isAdmin) {
        await fetchApi(`/v1/article/${id}/publish`, { method: 'PATCH' });
      } else {
        await fetchApi(`/v1/article/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ statut: 'en_attente' }),
        });
      }
      await refetchArticles();
    } catch (error: unknown) {
      alert((error as Error).message || "Erreur lors de la soumission du brouillon.");
    }
  };

  /**
   * Dépublie un article et le renvoie en brouillon (Réservé Admin).
   */
  const handleUnpublishArticle = async (id: number): Promise<void> => {
    try {
      await fetchApi(`/v1/article/${id}/unpublish`, { method: 'PATCH' });
      await refetchArticles();
    } catch (error: unknown) {
      alert((error as Error).message || "Erreur lors de la dépublication.");
    }
  };

  /**
   * Anonymise l'auteur d'un article sur demande RGPD sans supprimer le contenu (Réservé Admin).
   */
  const handleAnonymizeArticle = async (id: number): Promise<void> => {
    if (!confirm("Retirer le nom de l'auteur sur cet article (demande RGPD) ? L'article restera en ligne.")) return;
    try {
      await fetchApi(`/v1/article/${id}/anonymize`, { method: 'PATCH' });
      await refetchArticles();
    } catch (error: unknown) {
      alert((error as Error).message || "Erreur lors de l'anonymisation.");
    }
  };

  /**
   * Supprime ou refuse un article (Soft Delete réservé Admin).
   */
  const handleDeleteArticle = async (id: number): Promise<void> => {
    if (!confirm("Confirmer la suppression (ou le refus) de cet article ?")) return;
    try {
      await fetchApi(`/v1/article/${id}`, { method: 'DELETE' });
      await refetchArticles();
    } catch (error: unknown) {
      alert((error as Error).message || "Erreur lors de la suppression.");
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setIsSubmittingCat(true);
    setCatFeedback(null);

    try {
      await fetchApi('/v1/categorie', {
        method: 'POST',
        body: JSON.stringify(catData)
      });
      setCatFeedback({ type: "success", message: "Catégorie créée avec succès." });
      setCatData({ libelle: "", description: "", icon: "", image_bandeau_url: "" });
      await refetchCategories();
    } catch (error: unknown) {
      setCatFeedback({ type: "error", message: (error as Error).message || "Erreur de création." });
    } finally {
      setIsSubmittingCat(false);
    }
  };

  const handleDeleteCategory = async (id: number): Promise<void> => {
    if (!confirm("Attention : supprimer cette catégorie affectera les articles liés. Confirmer ?")) return;
    try {
      await fetchApi(`/v1/categorie/${id}`, { method: 'DELETE' });
      await refetchCategories();
    } catch (error: unknown) {
      alert((error as Error).message || "Erreur lors de la suppression.");
    }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-poppins font-black text-2xl text-noir">Comité de Rédaction</h1>
          <p className="font-raleway text-champagne text-sm">Gérez le contenu éditorial et l&apos;arborescence du journal</p>
        </div>
        <Button 
          onClick={() => setActiveTab("create")}
          className="bg-or text-noir font-montserrat font-bold hover:bg-or/90 transition-all rounded-xl"
        >
          <Plus size={16} className="mr-2" /> Nouvel article
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col">
        <TabsList className="bg-champagne/15 rounded-xl p-1 h-auto mb-6 flex flex-wrap justify-start gap-1">
          <TabsTrigger value="published" className="py-2.5 px-4 sm:px-5 rounded-lg font-montserrat font-bold text-xs sm:text-sm data-[state=active]:bg-blanc data-[state=active]:shadow-sm data-[state=active]:text-noir text-champagne">
            <CheckCircle2 size={16} className="mr-1.5 hidden sm:block" /> Publiés <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700 hover:bg-green-100 border-0">{publishedArticles.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="pending" className="py-2.5 px-4 sm:px-5 rounded-lg font-montserrat font-bold text-xs sm:text-sm data-[state=active]:bg-blanc data-[state=active]:shadow-sm data-[state=active]:text-noir text-champagne">
            <Clock size={16} className="mr-1.5 hidden sm:block" /> En attente <Badge variant="secondary" className="ml-2 bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-0">{pendingArticles.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="drafts" className="py-2.5 px-4 sm:px-5 rounded-lg font-montserrat font-bold text-xs sm:text-sm data-[state=active]:bg-blanc data-[state=active]:shadow-sm data-[state=active]:text-noir text-champagne">
            <FileText size={16} className="mr-1.5 hidden sm:block" /> Brouillons <Badge variant="secondary" className="ml-2 bg-champagne/30 text-vert hover:bg-champagne/30 border-0">{draftArticles.length}</Badge>
          </TabsTrigger>
          {canManageCategories && (
            <TabsTrigger value="categories" className="py-2.5 px-4 sm:px-5 rounded-lg font-montserrat font-bold text-xs sm:text-sm data-[state=active]:bg-blanc data-[state=active]:shadow-sm data-[state=active]:text-noir text-champagne">
              <FolderTree size={16} className="mr-1.5 hidden sm:block" /> Catégories <Badge variant="secondary" className="ml-2 bg-champagne/30 text-vert hover:bg-champagne/30 border-0">{categories?.length || 0}</Badge>
            </TabsTrigger>
          )}
          <TabsTrigger value="create" className="py-2.5 px-4 sm:px-5 rounded-lg font-montserrat font-bold text-xs sm:text-sm data-[state=active]:bg-blanc data-[state=active]:shadow-sm data-[state=active]:text-noir text-champagne">
            <Plus size={16} className="mr-1.5 hidden sm:block" /> Créer
          </TabsTrigger>
        </TabsList>

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
                {isArticlesLoading ? (
                  <SkeletonGrid count={5} Component={SkeletonTableRow} />
                ) : publishedArticles.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-6 text-champagne">Aucun article publié.</TableCell></TableRow>
                ) : (
                  publishedArticles.map((row) => {
                    const CatIcon = getCategoryUI(row.categorie?.libelle || "Général").icon;
                    const hasIdentifiedAuthor = row.credits?.some(c => c.role === 'Auteur' && !c.anonymous && c.name !== 'Citoyen Anonyme');
                    return (
                      <TableRow key={row.id} className="hover:bg-champagne/5 border-champagne/10 transition-colors">
                        <TableCell className="font-montserrat font-semibold text-sm">
                          <div className="flex items-center gap-3">
                            {row.image_couverture ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={resolveImageUrl(row.image_couverture)!}
                                alt=""
                                className="w-10 h-10 rounded-lg object-cover shrink-0 border border-champagne/20"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-champagne/15 flex items-center justify-center shrink-0 text-champagne">
                                <CatIcon size={16} />
                              </div>
                            )}
                            <span className="line-clamp-2">{row.titre}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge className="bg-or/15 text-vert hover:bg-or/20 border-0 font-montserrat font-bold flex items-center gap-1.5 w-fit">
                            <CatIcon size={14} />
                            {row.categorie?.libelle || "Général"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-montserrat text-xs text-champagne hidden md:table-cell">{formatDateToFrench(row.published_at)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Link href={`/articles/${row.id}`}>
                              <Button variant="ghost" size="icon" className="bg-champagne/20 text-vert hover:bg-champagne/40 rounded-lg h-8 w-8" title="Voir l'article">
                                <Eye size={14} />
                              </Button>
                            </Link>
                            {isAdmin && hasIdentifiedAuthor && (
                              <Button onClick={() => handleAnonymizeArticle(row.id)} variant="ghost" size="icon" className="bg-champagne/20 text-noir hover:bg-or/30 rounded-lg h-8 w-8" title="Anonymiser l'auteur (RGPD)">
                                <UserX size={14} />
                              </Button>
                            )}
                            {isAdmin && (
                              <>
                                <Button onClick={() => handleUnpublishArticle(row.id)} variant="ghost" size="icon" className="bg-yellow-50 text-yellow-700 hover:bg-yellow-100 rounded-lg h-8 w-8" title="Dépublier (repasser en brouillon)">
                                  <ArchiveRestore size={14} />
                                </Button>
                                <Button onClick={() => handleDeleteArticle(row.id)} variant="ghost" size="icon" className="bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 rounded-lg h-8 w-8" title="Supprimer">
                                  <Trash2 size={14} />
                                </Button>
                              </>
                            )}
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

        <TabsContent value="pending" className="space-y-4 outline-none">
          {isArticlesLoading ? (
             <SkeletonGrid count={2} Component={SkeletonTableRow} />
          ) : pendingArticles.length === 0 ? (
            <div className="text-center py-10 bg-champagne/5 rounded-xl border border-champagne/20 text-champagne">Aucun article en attente de validation.</div>
          ) : (
            pendingArticles.map(article => {
              const CatIcon = getCategoryUI(article.categorie?.libelle || "Général").icon;
              return (
                <div key={article.id} className="bg-blanc border border-yellow-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start gap-4 hover:shadow-md transition-all">
                  {article.image_couverture ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={resolveImageUrl(article.image_couverture)!}
                      alt=""
                      className="w-14 h-14 rounded-xl object-cover shrink-0 border border-champagne/20"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center shrink-0">
                      <Clock size={24} className="text-yellow-700" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-montserrat font-bold text-sm">{article.titre}</h3>
                      <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-0 font-poppins font-black text-xs">En attente</Badge>
                    </div>
                    <div className="font-montserrat text-xs text-champagne mb-3 flex items-center gap-1.5">
                      <CatIcon size={14} /> Thématique : {article.categorie?.libelle || "Général"}
                    </div>
                  </div>
                  <div className="flex sm:flex-col gap-2 shrink-0 w-full sm:w-auto mt-4 sm:mt-0">
                    <Link href={`/articles/${article.id}`} className="flex-1 sm:flex-none">
                      <Button size="sm" variant="outline" className="w-full border-champagne/40 text-noir font-montserrat font-bold rounded-lg">
                        <Eye size={14} className="mr-1.5" /> Aperçu
                      </Button>
                    </Link>
                    {isAdmin && (
                      <>
                        <Button onClick={() => handlePublishArticle(article.id)} size="sm" className="bg-green-500 hover:bg-green-600 text-blanc font-montserrat font-bold rounded-lg flex-1 sm:flex-none">
                          <CheckCircle2 size={14} className="mr-1.5" /> Publier
                        </Button>
                        <Button onClick={() => handleDeleteArticle(article.id)} size="sm" variant="outline" className="bg-red-50 border-0 text-red-500 hover:bg-red-100 font-montserrat font-bold rounded-lg flex-1 sm:flex-none">
                          <XCircle size={14} className="mr-1.5" /> Refuser
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="drafts" className="outline-none space-y-4">
           {isArticlesLoading ? (
             <SkeletonGrid count={2} Component={SkeletonTableRow} />
          ) : draftArticles.length === 0 ? (
            <div className="text-center py-10 bg-champagne/5 rounded-xl border border-champagne/20 text-champagne">Aucun brouillon enregistré.</div>
          ) : (
            draftArticles.map(article => {
              const CatIcon = getCategoryUI(article.categorie?.libelle || "Général").icon;
              return (
                <div key={article.id} className="bg-blanc border border-champagne/30 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:shadow-md transition-all opacity-80">
                  {article.image_couverture ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={resolveImageUrl(article.image_couverture)!}
                      alt=""
                      className="w-12 h-12 rounded-xl object-cover shrink-0 border border-champagne/20"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-champagne/20 rounded-xl flex items-center justify-center shrink-0 text-champagne">
                      <FileEdit size={24} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-montserrat font-bold text-sm mb-1">{article.titre}</h3>
                    <div className="font-montserrat text-xs text-champagne flex items-center gap-1.5">
                      <CatIcon size={14} /> Catégorie : {article.categorie?.libelle || "Non classé"}
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto mt-4 sm:mt-0">
                    <Button onClick={() => handleSubmitDraftForReview(article.id)} size="sm" className="bg-or text-noir hover:bg-or/80 font-montserrat font-bold rounded-lg flex-1 sm:flex-none">
                      <CheckCircle2 size={14} className="mr-1.5" /> {isAdmin ? "Publier" : "Soumettre"}
                    </Button>
                    {isAdmin && (
                      <Button onClick={() => handleDeleteArticle(article.id)} size="icon" variant="ghost" className="bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 rounded-lg h-9 w-9 shrink-0">
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </TabsContent>

        {canManageCategories && (
          <TabsContent value="categories" className="outline-none space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 bg-blanc rounded-2xl border border-champagne/20 p-6 h-fit">
                <h3 className="font-poppins font-black text-lg text-noir mb-4 flex items-center gap-2">
                  <FolderTree className="text-or" size={18} /> Nouvelle Section
                </h3>
                
                <FeedbackAlert feedback={catFeedback} />

                <form onSubmit={handleCategorySubmit} className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-3 space-y-2">
                      <label className="text-xs font-montserrat font-bold text-vert uppercase">Libellé *</label>
                      <Input required value={catData.libelle} onChange={e => setCatData({...catData, libelle: e.target.value})} placeholder="Ex: Sport" className="border-champagne/40 bg-blanc font-montserrat text-sm" />
                    </div>
                    <div className="col-span-1 space-y-2">
                      <label className="text-xs font-montserrat font-bold text-vert uppercase">Icône *</label>
                      <Input required value={catData.icon} onChange={e => setCatData({...catData, icon: e.target.value})} placeholder="⚽" maxLength={5} className="border-champagne/40 bg-blanc font-montserrat text-sm text-center" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-montserrat font-bold text-vert uppercase">Description courte</label>
                    <Textarea value={catData.description} onChange={e => setCatData({...catData, description: e.target.value})} rows={2} placeholder="Sera affichée sur la page des catégories..." className="border-champagne/40 bg-blanc font-montserrat text-sm resize-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-montserrat font-bold text-vert uppercase">Bandeau d&apos;illustration *</label>
                    <FileUpload value={catData.image_bandeau_url} onChange={url => setCatData({...catData, image_bandeau_url: url})} description="Format paysage obligatoire" />
                  </div>
                  <Button type="submit" disabled={isSubmittingCat || !catData.image_bandeau_url || !catData.libelle || !catData.icon} className="w-full bg-noir text-blanc hover:bg-vert font-montserrat font-bold py-6 rounded-xl mt-2">
                    {isSubmittingCat ? "Création..." : "Ajouter la catégorie"}
                  </Button>
                </form>
              </div>

              <div className="lg:col-span-2 bg-blanc rounded-2xl border border-champagne/20 overflow-hidden">
                <Table>
                  <TableHeader className="bg-champagne/5">
                    <TableRow className="hover:bg-transparent border-champagne/20">
                      <TableHead className="w-16 text-center font-raleway font-semibold text-xs text-champagne tracking-widest uppercase">Icon</TableHead>
                      <TableHead className="font-raleway font-semibold text-xs text-champagne tracking-widest uppercase">Thématique & Description</TableHead>
                      <TableHead className="text-right font-raleway font-semibold text-xs text-champagne tracking-widest uppercase">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isCatsLoading ? (
                      <SkeletonGrid count={4} Component={SkeletonTableRow} />
                    ) : categories?.length === 0 ? (
                      <TableRow><TableCell colSpan={3} className="text-center py-6 text-champagne">Aucune catégorie existante.</TableCell></TableRow>
                    ) : (
                      categories?.map((cat) => (
                        <TableRow key={cat.id} className="hover:bg-champagne/5 border-champagne/10 transition-colors">
                          <TableCell className="text-center text-xl">{cat.icon}</TableCell>
                          <TableCell>
                            <div className="font-montserrat font-bold text-sm text-noir">{cat.libelle}</div>
                            <div className="font-raleway text-xs text-champagne line-clamp-1 mt-0.5">{cat.description || "Aucune description"}</div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button onClick={() => handleDeleteCategory(cat.id)} variant="ghost" size="icon" className="bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 rounded-lg h-8 w-8">
                              <Trash2 size={14} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>
        )}

        <TabsContent value="create" className="outline-none">
          <div className="bg-blanc rounded-2xl border border-champagne/20 p-6 max-w-4xl">
            <h2 className="font-poppins font-black text-xl text-noir mb-6 flex items-center gap-2">
              <PenSquare size={20} className="text-or" /> Nouvel article
            </h2>
            
            <FeedbackAlert feedback={articleFeedback} />

            <form onSubmit={(e) => handleArticleSubmit(e, false)} className="space-y-5">
              <div className="space-y-2">
                <label className="font-montserrat font-bold text-xs text-vert tracking-wide uppercase">Titre *</label>
                <Input 
                  required 
                  value={articleData.titre} 
                  onChange={(e) => setArticleData({...articleData, titre: e.target.value})} 
                  placeholder="Titre accrocheur de l'article" 
                  className="px-4 py-6 border-champagne/40 rounded-xl bg-blanc focus-visible:ring-or/30 focus-visible:border-or text-lg font-bold" 
                />
              </div>

              <div className="space-y-2">
                <label className="font-montserrat font-bold text-xs text-vert tracking-wide uppercase">Catégorie *</label>
                <Select required value={articleData.categorieId} onValueChange={(val) => setArticleData({...articleData, categorieId: val})}>
                  <SelectTrigger className="px-4 py-6 border-champagne/40 rounded-xl bg-blanc focus:ring-or/30 focus:border-or font-montserrat text-sm w-full md:w-1/2">
                    <SelectValue placeholder="Sélectionnez une thématique..." />
                  </SelectTrigger>
                  <SelectContent className="bg-blanc border-champagne/40 rounded-xl font-montserrat">
                    {categories?.map((cat) => {
                      const CatIcon = getCategoryUI(cat.libelle).icon;
                      return (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          <div className="flex items-center gap-2">
                            <CatIcon size={14} /> <span>{cat.libelle}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="font-montserrat font-bold text-xs text-vert tracking-wide uppercase">
                  Photo de couverture (Optionnelle)
                </label>
                <FileUpload 
                  value={articleData.image_couverture} 
                  onChange={(url) => setArticleData({ ...articleData, image_couverture: url })} 
                  description="Format 16:9 recommandé (PNG, JPG ou WEBP max. 5 Mo)"
                />
              </div>

              <div className="space-y-2">
                <label className="font-montserrat font-bold text-xs text-vert tracking-wide uppercase">Contenu de l&apos;article *</label>
                <RichTextEditor 
                  value={articleData.contenu} 
                  onChange={(html) => setArticleData({...articleData, contenu: html})} 
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-champagne/20">
                <Button 
                  type="button" 
                  onClick={(e) => handleArticleSubmit(e, true)}
                  disabled={isSubmittingArticle || !articleData.titre} 
                  variant="outline" 
                  className="flex-1 py-6 border-champagne/40 text-noir font-montserrat font-bold rounded-xl hover:bg-champagne/10"
                >
                  <PenSquare size={16} className="mr-2" /> Sauvegarder le brouillon
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmittingArticle || !articleData.titre || !articleData.categorieId || !articleData.contenu} 
                  className="flex-1 py-6 bg-noir text-blanc font-montserrat font-bold rounded-xl hover:bg-vert hover:-translate-y-0.5 transition-all"
                >
                  <CheckCircle2 size={16} className="mr-2" /> {isAdmin ? "Publier l'article" : "Soumettre l'article"}
                </Button>
              </div>
            </form>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
