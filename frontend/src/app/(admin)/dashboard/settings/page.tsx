"use client";

import { useState, useEffect } from "react";
import { Settings, Save, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import AdminGuard from "@/components/layout/AdminGuard";
import { fetchApi } from "@/lib/api";

export default function SettingsDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [formData, setFormData] = useState({
    nom_journal: "",
    type_journal: "",
    email_contact: "",
    tel_contact: "",
    description_footer: ""
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await fetchApi<typeof formData>('/v1/settings');
        setFormData(data);
      } catch (error) {
        console.error("Erreur de chargement des paramètres:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);
    try {
      await fetchApi('/v1/settings', {
        method: 'PATCH',
        body: JSON.stringify(formData),
      });
      setFeedback({ type: "success", message: "Paramètres sauvegardés avec succès !" });
    } catch (error: unknown) {
      setFeedback({ type: "error", message: (error as Error).message || "Erreur de sauvegarde" });
    } finally {
      setIsSaving(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  return (
    <AdminGuard allowedRoles={['super_admin']}>
      <div className="space-y-6 animate-slide-up">
        <div>
          <h1 className="font-poppins font-black text-2xl text-noir mb-1 flex items-center gap-2">
            <Settings className="text-champagne" /> Paramètres
          </h1>
          <p className="font-raleway text-champagne text-sm">Configuration générale de la plateforme</p>
        </div>

        {feedback && (
          <div className={`p-4 rounded-xl flex items-center gap-3 font-montserrat font-bold text-sm shadow-sm max-w-2xl animate-in fade-in duration-300 ${feedback.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
            {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            {feedback.message}
          </div>
        )}

        {isLoading ? (
          <div className="bg-blanc rounded-2xl border border-champagne/20 p-6 sm:p-8 max-w-2xl space-y-6 mt-6">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-blanc rounded-2xl border border-champagne/20 p-6 sm:p-8 max-w-2xl space-y-6 mt-6">
            
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="font-montserrat font-bold text-xs text-vert uppercase tracking-wide">Nom de la plateforme</Label>
                <Input 
                  value={formData.nom_journal}
                  onChange={(e) => setFormData({ ...formData, nom_journal: e.target.value })}
                  className="px-4 py-6 border-champagne/40 rounded-xl bg-blanc focus-visible:ring-or/30 focus-visible:border-or font-montserrat text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label className="font-montserrat font-bold text-xs text-vert uppercase tracking-wide">Type de média</Label>
                <Select value={formData.type_journal} onValueChange={(val) => setFormData({ ...formData, type_journal: val })}>
                  <SelectTrigger className="px-4 py-6 border-champagne/40 rounded-xl bg-blanc focus:ring-or/30 focus:border-or font-montserrat text-sm">
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent className="bg-blanc border-champagne/40 rounded-xl font-montserrat">
                    <SelectItem value="Journal Municipal">🏛️ Journal Municipal</SelectItem>
                    <SelectItem value="Journal Associatif">🤝 Journal Associatif</SelectItem>
                    <SelectItem value="Média Indépendant">📰 Média Indépendant</SelectItem>
                    <SelectItem value="Web TV Locale">📺 Web TV Locale</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="font-montserrat font-bold text-xs text-vert uppercase tracking-wide">Email de contact</Label>
                <Input 
                  type="email" 
                  value={formData.email_contact}
                  onChange={(e) => setFormData({ ...formData, email_contact: e.target.value })}
                  className="px-4 py-6 border-champagne/40 rounded-xl bg-blanc focus-visible:ring-or/30 focus-visible:border-or font-montserrat text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-montserrat font-bold text-xs text-vert uppercase tracking-wide">Téléphone public</Label>
                <Input 
                  type="text" 
                  value={formData.tel_contact}
                  onChange={(e) => setFormData({ ...formData, tel_contact: e.target.value })}
                  className="px-4 py-6 border-champagne/40 rounded-xl bg-blanc focus-visible:ring-or/30 focus-visible:border-or font-montserrat text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-montserrat font-bold text-xs text-vert uppercase tracking-wide">Description du Footer</Label>
              <Textarea 
                rows={3}
                value={formData.description_footer}
                onChange={(e) => setFormData({ ...formData, description_footer: e.target.value })}
                className="px-4 py-3 border-champagne/40 rounded-xl bg-blanc focus-visible:ring-or/30 focus-visible:border-or resize-none font-montserrat text-sm" 
              />
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
