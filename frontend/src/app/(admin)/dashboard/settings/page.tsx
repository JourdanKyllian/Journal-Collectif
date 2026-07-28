"use client";

import { useState, useEffect } from "react";
import { Settings, Save, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import AdminGuard from "@/components/layout/AdminGuard";
import { fetchApi } from "@/lib/api";

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * @interface SettingsFormData
 * @description Représente l'état du formulaire des paramètres globaux.
 */
interface SettingsFormData {
  /** Nom officiel du journal */
  nom_journal: string;
  /** Sous-titre ou type de publication (ex: "Journal Municipal") */
  type_journal: string;
  /** Nom de la commune concernée */
  nom_ville: string;
  /** Adresse email de contact générique */
  email_contact: string;
  /** Numéro de téléphone d'accueil au public */
  tel_contact: string;
  /** Texte descriptif affiché en pied de page */
  description_footer: string;
}

/**
 * @interface FeedbackMessage
 * @description Structure des messages de notification utilisateur (succès/erreur).
 */
interface FeedbackMessage {
  /** Niveau de sévérité du message */
  type: "success" | "error";
  /** Contenu du message à afficher */
  message: string;
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

/**
 * @component SettingsDashboard
 * @description Interface d'administration permettant au Gérant de modifier
 * l'identité visuelle et textuelle de la plateforme (nom, ville, contact, footer).
 * Ce composant est protégé et réservé au rôle 'super_admin'.
 * 
 * @returns {JSX.Element} L'interface de configuration.
 */
export default function SettingsDashboard() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);

  const [formData, setFormData] = useState<SettingsFormData>({
    nom_journal: "",
    type_journal: "",
    nom_ville: "",
    email_contact: "",
    tel_contact: "",
    description_footer: ""
  });

  useEffect(() => {
    /**
     * Récupère la configuration existante depuis l'API au montage du composant.
     */
    const loadSettings = async () => {
      try {
        const data = await fetchApi<SettingsFormData>('/v1/settings');
        setFormData(data);
      } catch (error) {
        console.error("Erreur de chargement des paramètres:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSettings();
  }, []);

  /**
   * Intercepte la soumission du formulaire, applique les modifications en base
   * de données et gère le retour utilisateur visuel (toast feedback).
   * 
   * @param {React.FormEvent} e - L'événement de soumission du formulaire.
   */
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
      // Auto-masquage du message après 5 secondes
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  return (
    <AdminGuard allowedRoles={['super_admin']}>
      <div className="space-y-6 animate-slide-up">
        {/* En-tête de la page */}
        <div>
          <h1 className="font-poppins font-black text-2xl text-noir mb-1 flex items-center gap-2">
            <Settings className="text-champagne" /> Paramètres
          </h1>
          <p className="font-raleway text-champagne text-sm">Configuration générale de la plateforme</p>
        </div>

        {/* Bannière de notification */}
        {feedback && (
          <div 
            className={`p-4 rounded-xl flex items-center gap-3 font-montserrat font-bold text-sm shadow-sm max-w-2xl animate-in fade-in duration-300 ${
              feedback.type === 'success' 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-600 border border-red-200'
            }`}
            role="alert"
          >
            {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            {feedback.message}
          </div>
        )}

        {/* Chargement Skeleton vs Formulaire de configuration */}
        {isLoading ? (
          <div className="bg-blanc rounded-2xl border border-champagne/20 p-6 sm:p-8 max-w-2xl space-y-6 mt-6">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <form 
            onSubmit={handleSubmit} 
            autoComplete="off" 
            className="bg-blanc rounded-2xl border border-champagne/20 p-6 sm:p-8 max-w-2xl space-y-6 mt-6"
          >
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="font-montserrat font-bold text-xs text-vert uppercase tracking-wide">
                  Nom de la plateforme
                </Label>
                <Input 
                  value={formData.nom_journal}
                  onChange={(e) => setFormData({ ...formData, nom_journal: e.target.value })}
                  autoComplete="off"
                  data-1p-ignore
                  className="px-4 py-6 border-champagne/40 rounded-xl bg-blanc focus-visible:ring-or/30 focus-visible:border-or font-montserrat text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label className="font-montserrat font-bold text-xs text-vert uppercase tracking-wide">
                  Type de média
                </Label>
                <Input 
                  value={formData.type_journal}
                  onChange={(e) => setFormData({ ...formData, type_journal: e.target.value })}
                  placeholder="Ex: Journal Associatif"
                  autoComplete="off"
                  data-1p-ignore
                  className="px-4 py-6 border-champagne/40 rounded-xl bg-blanc focus-visible:ring-or/30 focus-visible:border-or font-montserrat text-sm"
                />
              </div>
            </div>

            {/* Ajout du champ dynamique : Ville / Commune */}
            <div className="space-y-2">
              <Label className="font-montserrat font-bold text-xs text-vert uppercase tracking-wide">
                Nom de la ville / commune
              </Label>
              <Input 
                value={formData.nom_ville}
                onChange={(e) => setFormData({ ...formData, nom_ville: e.target.value })}
                placeholder="Ex: Châlons"
                autoComplete="off"
                data-1p-ignore
                className="px-4 py-6 border-champagne/40 rounded-xl bg-blanc focus-visible:ring-or/30 focus-visible:border-or font-montserrat text-sm"
              />
            </div>
            
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="font-montserrat font-bold text-xs text-vert uppercase tracking-wide">
                  Email de contact
                </Label>
                <Input 
                  type="email" 
                  value={formData.email_contact}
                  onChange={(e) => setFormData({ ...formData, email_contact: e.target.value })}
                  autoComplete="off"
                  data-1p-ignore
                  className="px-4 py-6 border-champagne/40 rounded-xl bg-blanc focus-visible:ring-or/30 focus-visible:border-or font-montserrat text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-montserrat font-bold text-xs text-vert uppercase tracking-wide">
                  Téléphone public
                </Label>
                <Input 
                  type="tel" 
                  value={formData.tel_contact}
                  onChange={(e) => setFormData({ ...formData, tel_contact: e.target.value })}
                  placeholder="Sera formaté automatiquement"
                  autoComplete="off"
                  data-1p-ignore
                  className="px-4 py-6 border-champagne/40 rounded-xl bg-blanc focus-visible:ring-or/30 focus-visible:border-or font-montserrat text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-montserrat font-bold text-xs text-vert uppercase tracking-wide">
                Description du Footer
              </Label>
              <Textarea 
                rows={3}
                value={formData.description_footer}
                onChange={(e) => setFormData({ ...formData, description_footer: e.target.value })}
                autoComplete="off"
                data-1p-ignore
                className="px-4 py-3 border-champagne/40 rounded-xl bg-blanc focus-visible:ring-or/30 focus-visible:border-or resize-none font-montserrat text-sm" 
              />
            </div>

            <Button 
              type="submit" 
              disabled={isSaving} 
              className="w-full py-6 bg-noir text-blanc font-montserrat font-bold rounded-xl hover:bg-vert transition-all hover:-translate-y-0.5 mt-4"
            >
              {isSaving ? "Sauvegarde en cours..." : <><Save size={16} className="mr-2" /> Sauvegarder les modifications</>}
            </Button>
          </form>
        )}
      </div>
    </AdminGuard>
  );
}
