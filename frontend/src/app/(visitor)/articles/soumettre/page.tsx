"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, ShieldCheck, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FeedbackAlert, FeedbackMessage } from "@/components/ui/feedback-alert";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { useFetchApi } from "@/hooks/useFetchApi";
import { fetchApi } from "@/lib/api";
import { getCategoryUI } from "@/lib/formatters";

interface Categorie {
  id: number;
  libelle: string;
}

/**
 * Interface publique permettant à un utilisateur authentifié de soumettre
 * une proposition d'article au comité de rédaction.
 */
export default function SubmitArticlePage() {
  const router = useRouter();

  const { data: user, isLoading: isAuthLoading } = useFetchApi('/v1/auth/me');
  const { data: categories } = useFetchApi<Categorie[]>('/v1/categorie');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);

  const [formData, setFormData] = useState({
    titre: "",
    contenu: "",
    categorieId: "",
    is_anonymous: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categorieId) {
      return setFeedback({ type: "error", message: "Veuillez sélectionner une catégorie." });
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      await fetchApi('/v1/article', {
        method: 'POST',
        body: JSON.stringify({
          titre: formData.titre,
          contenu: formData.contenu,
          categorieId: Number(formData.categorieId),
          is_anonymous: formData.is_anonymous,
        })
      });

      setFeedback({ type: "success", message: "Votre proposition a été envoyée." });
      setFormData({ titre: "", contenu: "", categorieId: "", is_anonymous: false });

      setTimeout(() => router.push('/profile'), 3000);
    } catch (error: unknown) {
      setFeedback({ type: "error", message: (error as Error).message || "Erreur lors de la soumission." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading) return <div className="min-h-screen bg-blanc" />;
  if (!user) {
    router.push('/');
    return null;
  }

  return (
    <div className="w-full bg-blanc min-h-screen pb-20">
      <header className="bg-linear-to-br from-vert to-noir pt-24 pb-16 px-6 text-center">
        <h1 className="font-poppins font-black text-4xl text-blanc mb-3">
          Proposer un <span className="text-or">Article</span>
        </h1>
        <p className="font-raleway text-blanc/70 text-lg">
          Participez à la vie de la commune en partageant une actualité
        </p>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link href="/articles" className="inline-flex items-center text-champagne hover:text-noir font-montserrat font-bold text-sm mb-8 transition-colors">
          <ArrowLeft size={16} className="mr-2" /> Retour aux articles
        </Link>

        <FeedbackAlert feedback={feedback} />

        <form onSubmit={handleSubmit} className="space-y-8 bg-champagne/5 border border-champagne/20 p-6 md:p-10 rounded-3xl shadow-sm">

          <div className="space-y-2">
            <Label className="font-montserrat font-bold text-xs text-vert tracking-wide uppercase">Titre de l&apos;actualité *</Label>
            <Input 
              required 
              value={formData.titre} 
              onChange={(e) => setFormData({...formData, titre: e.target.value})} 
              placeholder="Ex: Succès de la foire locale 2026..." 
              className="px-4 py-6 border-champagne/40 rounded-xl bg-blanc focus-visible:ring-or/30 focus-visible:border-or text-lg font-bold" 
            />
          </div>

          <div className="space-y-2">
            <Label className="font-montserrat font-bold text-xs text-vert tracking-wide uppercase">Thématique *</Label>
            <Select required value={formData.categorieId} onValueChange={(val) => setFormData({...formData, categorieId: val})}>
              <SelectTrigger className="px-4 py-6 border-champagne/40 rounded-xl bg-blanc focus:ring-or/30 focus:border-or font-montserrat text-sm w-full md:w-1/2">
                <SelectValue placeholder="Sélectionnez une catégorie..." />
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
            <Label className="font-montserrat font-bold text-xs text-vert tracking-wide uppercase">Contenu détaillé *</Label>
            <RichTextEditor 
              value={formData.contenu} 
              onChange={(html) => setFormData({...formData, contenu: html})} 
            />
          </div>

          <div className="bg-blanc border border-champagne/30 rounded-2xl p-5 flex items-center justify-between gap-4">
            <div>
              <Label className="font-poppins font-black text-sm text-noir flex items-center gap-2">
                <ShieldCheck size={18} className="text-vert" /> Anonymat de publication (RGPD)
              </Label>
              <p className="font-montserrat text-xs text-champagne mt-1">
                En activant cette option, votre identité sera masquée aux autres lecteurs. Le comité de rédaction y aura tout de même accès.
              </p>
            </div>
            <Switch 
              checked={formData.is_anonymous} 
              onCheckedChange={(val) => setFormData({...formData, is_anonymous: val})} 
              className="data-[state=checked]:bg-or"
            />
          </div>

          <Button 
            type="submit" 
            disabled={isSubmitting || !formData.titre || !formData.contenu} 
            className="w-full py-6 bg-noir text-blanc font-montserrat font-bold rounded-xl hover:bg-vert transition-all hover:-translate-y-0.5 shadow-lg text-base"
          >
            {isSubmitting ? "Envoi en cours..." : <><Send size={18} className="mr-2" /> Soumettre l&apos;article au comité</>}
          </Button>

        </form>
      </div>
    </div>
  );
}
