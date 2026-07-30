"use client";

import { useState, useEffect } from "react";
import { Settings, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { FeedbackAlert, FeedbackMessage } from "@/components/ui/feedback-alert";
import AdminGuard from "@/components/layout/AdminGuard";
import { fetchApi } from "@/lib/api";
import { useFetchApi } from "@/hooks/useFetchApi";
import { PERMISSIONS } from "@/lib/permissions";

interface SettingsFormData {
  nom_journal: string;
  type_journal: string;
  nom_ville: string;
  email_contact: string;
  tel_contact: string;
  description_footer: string;
}

/**
 * Interface d'administration dédiée à la configuration globale de la plateforme.
 */
export default function SettingsDashboard() {
  const { data: initialData, isLoading } = useFetchApi<SettingsFormData>('/v1/settings');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);

  const [formData, setFormData] = useState<SettingsFormData>({
    nom_journal: "", type_journal: "", nom_ville: "",
    email_contact: "", tel_contact: "", description_footer: ""
  });

  useEffect(() => {
    if (initialData) {
      const timer = setTimeout(() => setFormData(initialData), 0);
      return () => clearTimeout(timer);
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    try {
      await fetchApi('/v1/settings', {
        method: 'PATCH',
        body: JSON.stringify(formData),
      });
      setFeedback({ type: "success", message: "Paramètres sauvegardés avec succès." });
    } catch (error: unknown) {
      setFeedback({ type: "error", message: (error as Error).message || "Erreur lors de la sauvegarde." });
    } finally {
      setIsSaving(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  return (
    <AdminGuard allowedRoles={PERMISSIONS.manageSettings}>
      <div className="space-y-6 animate-slide-up">
        <div>
          <h1 className="font-poppins font-black text-2xl text-noir mb-1 flex items-center gap-2">
            <Settings className="text-champagne" /> Paramètres
          </h1>
          <p className="font-raleway text-champagne text-sm">Configuration générale de la plateforme</p>
        </div>

        <FeedbackAlert feedback={feedback} />

        {isLoading ? (
          <div className="bg-blanc rounded-2xl border border-champagne/20 p-6 sm:p-8 max-w-2xl space-y-6 mt-6">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} autoComplete="off" className="bg-blanc rounded-2xl border border-champagne/20 p-6 sm:p-8 max-w-2xl space-y-6 mt-6">
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="font-montserrat font-bold text-xs text-vert uppercase tracking-wide">Nom de la plateforme</Label>
                <Input value={formData.nom_journal} onChange={(e) => setFormData({ ...formData, nom_journal: e.target.value })} autoComplete="off" data-1p-ignore className="px-4 py-6 border-champagne/40 rounded-xl bg-blanc focus-visible:ring-or/30 focus-visible:border-or font-montserrat text-sm" />
              </div>

              <div className="space-y-2">
                <Label className="font-montserrat font-bold text-xs text-vert uppercase tracking-wide">Type de média</Label>
                <Input value={formData.type_journal} onChange={(e) => setFormData({ ...formData, type_journal: e.target.value })} placeholder="Ex: Journal Associatif" autoComplete="off" data-1p-ignore className="px-4 py-6 border-champagne/40 rounded-xl bg-blanc focus-visible:ring-or/30 focus-visible:border-or font-montserrat text-sm" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-montserrat font-bold text-xs text-vert uppercase tracking-wide">Nom de la ville / commune</Label>
              <Input value={formData.nom_ville} onChange={(e) => setFormData({ ...formData, nom_ville: e.target.value })} placeholder="Ex: Châlons" autoComplete="off" data-1p-ignore className="px-4 py-6 border-champagne/40 rounded-xl bg-blanc focus-visible:ring-or/30 focus-visible:border-or font-montserrat text-sm" />
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="font-montserrat font-bold text-xs text-vert uppercase tracking-wide">Email de contact</Label>
                <Input type="email" value={formData.email_contact} onChange={(e) => setFormData({ ...formData, email_contact: e.target.value })} autoComplete="off" data-1p-ignore className="px-4 py-6 border-champagne/40 rounded-xl bg-blanc focus-visible:ring-or/30 focus-visible:border-or font-montserrat text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="font-montserrat font-bold text-xs text-vert uppercase tracking-wide">Téléphone public</Label>
                <Input type="tel" value={formData.tel_contact} onChange={(e) => setFormData({ ...formData, tel_contact: e.target.value })} placeholder="Sera formaté automatiquement" autoComplete="off" data-1p-ignore className="px-4 py-6 border-champagne/40 rounded-xl bg-blanc focus-visible:ring-or/30 focus-visible:border-or font-montserrat text-sm" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-montserrat font-bold text-xs text-vert uppercase tracking-wide">Description du Footer</Label>
              <Textarea rows={3} value={formData.description_footer} onChange={(e) => setFormData({ ...formData, description_footer: e.target.value })} autoComplete="off" data-1p-ignore className="px-4 py-3 border-champagne/40 rounded-xl bg-blanc focus-visible:ring-or/30 focus-visible:border-or resize-none font-montserrat text-sm" />
            </div>

            <Button type="submit" disabled={isSaving} className="w-full py-6 bg-noir text-blanc font-montserrat font-bold rounded-xl hover:bg-vert transition-all hover:-translate-y-0.5 mt-4">
              {isSaving ? "Sauvegarde en cours..." : <><Save size={16} className="mr-2" /> Sauvegarder les modifications</>}
            </Button>
          </form>
        )}
      </div>
    </AdminGuard>
  );
}
