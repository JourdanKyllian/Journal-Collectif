"use client";

import { useState, useEffect } from "react";
import { 
  AlertTriangle, Trash2, Info, CalendarDays, Megaphone, PartyPopper, CheckCircle2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import AdminGuard from "@/components/layout/AdminGuard";
import { fetchApi } from "@/lib/api";

// --- TYPES ---
interface AlertItem {
  id: number;
  type: "urgent" | "info" | "event";
  title: string;
  message: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

// --- MAPPING DES STYLES SELON LE TYPE ---
const TYPE_STYLES = {
  urgent: {
    wrapper: "border-red-500", bgIcon: "bg-red-100", textIcon: "text-red-500",
    badgeBg: "bg-red-500", badgeText: "URGENT", Icon: Megaphone
  },
  info: {
    wrapper: "border-orange-400", bgIcon: "bg-orange-100", textIcon: "text-orange-500",
    badgeBg: "bg-orange-400", badgeText: "INFO", Icon: Info
  },
  event: {
    wrapper: "border-vert", bgIcon: "bg-vert/10", textIcon: "text-vert",
    badgeBg: "bg-vert", badgeText: "ÉVÉNEMENT", Icon: PartyPopper
  }
};

/**
 * @component AlertsDashboard
 * @description Tableau de bord pour la gestion dynamique des alertes et bannières d'urgence.
 */
export default function AlertsDashboard() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [formData, setFormData] = useState({
    type: "urgent",
    title: "",
    message: "",
    startDate: "",
    endDate: ""
  });

  // 1. Charger les alertes
  const loadAlerts = async () => {
    try {
      const data = await fetchApi<AlertItem[]>('/v1/alerts');
      setAlerts(data);
    } catch (error) {
      console.error("Erreur lors du chargement des alertes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  // 2. Créer une alerte
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);
    try {
      await fetchApi('/v1/alerts', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          startDate: formData.startDate || undefined,
          endDate: formData.endDate || undefined,
        }),
      });
      setFeedback({ type: "success", message: "Alerte publiée avec succès !" });
      setFormData({ type: "urgent", title: "", message: "", startDate: "", endDate: "" });
      loadAlerts(); // Recharger la liste
    } catch (error: unknown) {
      setFeedback({ type: "error", message: (error as Error).message || "Erreur de création" });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  // 3. Supprimer une alerte
  const handleDelete = async (id: number) => {
    if (!confirm("Voulez-vous vraiment retirer cette alerte ?")) return;
    try {
      await fetchApi(`/v1/alerts/${id}`, { method: 'DELETE' });
      setAlerts(alerts.filter(a => a.id !== id));
    } catch (error) {
      console.error("Erreur de suppression:", error);
      alert("Impossible de supprimer l'alerte.");
    }
  };

  // Utilitaire pour formater les dates ("Du 15 au 18 mars" etc.)
  const formatDates = (start: string | null, end: string | null) => {
    if (!start && !end) return "Dates non spécifiées";
    const opt: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    const s = start ? new Date(start).toLocaleDateString('fr-FR', opt) : null;
    const e = end ? new Date(end).toLocaleDateString('fr-FR', opt) : null;
    if (s && e) return `Du ${s} au ${e}`;
    if (s) return `À partir du ${s}`;
    if (e) return `Jusqu'au ${e}`;
    return "";
  };

  return (
    <AdminGuard allowedRoles={['admin', 'super_admin']}>
      <div className="space-y-8 animate-slide-up max-w-4xl">
        <div>
          <h1 className="font-poppins font-black text-2xl text-noir mb-1 flex items-center gap-2">
            <AlertTriangle className="text-red-500" /> Alertes Importantes
          </h1>
          <p className="font-raleway text-champagne text-sm">Gérez les bannières d&apos;urgence affichées en tête du site</p>
        </div>

        {/* --- LISTE DES ALERTES ACTIVES --- */}
        <div className="space-y-4">
          <h2 className="font-montserrat font-bold text-base flex items-center gap-2">
            Alertes actives 
            <span className="bg-red-100 text-red-600 font-poppins font-black text-xs px-2.5 py-1 rounded-full">
              {isLoading ? "..." : alerts.length}
            </span>
          </h2>
          
          <div className="space-y-3">
            {isLoading ? (
              <Skeleton className="w-full h-24 rounded-xl" />
            ) : alerts.length === 0 ? (
              <p className="text-champagne font-montserrat text-sm italic">Aucune alerte active pour le moment.</p>
            ) : (
              alerts.map((alert) => {
                const style = TYPE_STYLES[alert.type];
                return (
                  <div key={alert.id} className={`bg-blanc border-l-4 ${style.wrapper} rounded-xl p-5 flex flex-col sm:flex-row items-start gap-4 hover:shadow-md transition-all`}>
                    <div className={`w-10 h-10 ${style.bgIcon} rounded-xl flex items-center justify-center ${style.textIcon} shrink-0 mt-1`}>
                      <style.Icon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`${style.badgeBg} text-blanc font-poppins font-black text-xs px-2.5 py-0.5 rounded-full`}>
                          {style.badgeText}
                        </span>
                        <h3 className="font-montserrat font-bold text-sm">{alert.title}</h3>
                      </div>
                      <p className="font-montserrat text-xs text-champagne mb-2 whitespace-pre-wrap">{alert.message}</p>
                      <div className="font-montserrat text-xs text-champagne flex items-center gap-1.5">
                        <CalendarDays size={12} /> {formatDates(alert.startDate, alert.endDate)}
                      </div>
                    </div>
                    <Button onClick={() => handleDelete(alert.id)} variant="ghost" size="sm" className="bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 font-montserrat font-bold text-xs rounded-lg mt-2 sm:mt-0">
                      <Trash2 size={14} className="mr-1.5" /> Retirer
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* --- CRÉER UNE ALERTE --- */}
        <div className="bg-blanc rounded-2xl border border-champagne/20 p-6 sm:p-8 mt-8">
          <h2 className="font-poppins font-black text-lg text-noir mb-6 flex items-center gap-2">
            ＋ Créer une nouvelle alerte
          </h2>

          {feedback && (
            <div className={`p-4 mb-6 rounded-xl flex items-center gap-3 font-montserrat font-bold text-sm ${feedback.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
              {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              {feedback.message}
            </div>
          )}
          
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="space-y-3">
              <Label className="font-montserrat font-bold text-xs text-vert tracking-wide uppercase">Niveau d&apos;urgence</Label>
              <RadioGroup value={formData.type} onValueChange={(val) => setFormData({ ...formData, type: val })} className="flex flex-wrap gap-4">
                <div onClick={() => setFormData({ ...formData, type: 'urgent' })} className={`flex items-center space-x-2 border-2 px-4 py-3 rounded-xl cursor-pointer transition-colors ${formData.type === 'urgent' ? 'border-red-300 bg-red-50' : 'border-champagne/40 bg-blanc hover:bg-champagne/10'}`}>
                  <RadioGroupItem value="urgent" id="urgent" className="border-red-500 text-red-500" />
                  <Label htmlFor="urgent" className="font-montserrat font-bold text-sm text-red-600 cursor-pointer">🚨 URGENT</Label>
                </div>
                <div onClick={() => setFormData({ ...formData, type: 'info' })} className={`flex items-center space-x-2 border-2 px-4 py-3 rounded-xl cursor-pointer transition-colors ${formData.type === 'info' ? 'border-orange-300 bg-orange-50' : 'border-champagne/40 bg-blanc hover:bg-champagne/10'}`}>
                  <RadioGroupItem value="info" id="info" className="border-orange-400 text-orange-400" />
                  <Label htmlFor="info" className="font-montserrat font-bold text-sm text-orange-500 cursor-pointer">ℹ️ INFO</Label>
                </div>
                <div onClick={() => setFormData({ ...formData, type: 'event' })} className={`flex items-center space-x-2 border-2 px-4 py-3 rounded-xl cursor-pointer transition-colors ${formData.type === 'event' ? 'border-vert/30 bg-vert/5' : 'border-champagne/40 bg-blanc hover:bg-champagne/10'}`}>
                  <RadioGroupItem value="event" id="event" className="border-vert text-vert" />
                  <Label htmlFor="event" className="font-montserrat font-bold text-sm text-vert cursor-pointer">🎪 ÉVÉNEMENT</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label className="font-montserrat font-bold text-xs text-vert tracking-wide uppercase">Titre de l&apos;alerte *</Label>
              <Input required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Ex: Grande Foire de Chalon — Fermeture du centre-ville" className="px-4 py-6 border-champagne/40 rounded-xl bg-blanc focus-visible:ring-or/30 focus-visible:border-or" />
            </div>

            <div className="space-y-2">
              <Label className="font-montserrat font-bold text-xs text-vert tracking-wide uppercase">Message court (affiché dans la bannière) *</Label>
              <Textarea required value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} rows={2} placeholder="Message affiché directement sur la bannière du site..." className="px-4 py-3 border-champagne/40 rounded-xl bg-blanc focus-visible:ring-or/30 focus-visible:border-or resize-none" />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-montserrat font-bold text-xs text-vert tracking-wide uppercase">Date de début</Label>
                <Input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="px-4 py-6 border-champagne/40 rounded-xl bg-blanc focus-visible:ring-or/30 focus-visible:border-or" />
              </div>
              <div className="space-y-2">
                <Label className="font-montserrat font-bold text-xs text-vert tracking-wide uppercase">Date de fin</Label>
                <Input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className="px-4 py-6 border-champagne/40 rounded-xl bg-blanc focus-visible:ring-or/30 focus-visible:border-or" />
              </div>
            </div>

            <Button disabled={isSubmitting} type="submit" className="w-full py-6 bg-noir text-blanc font-montserrat font-bold text-sm rounded-xl hover:bg-vert transition-all hover:-translate-y-0.5 mt-2">
              {isSubmitting ? "Création en cours..." : <><Megaphone size={16} className="mr-2" /> Publier l&apos;alerte sur le site</>}
            </Button>
          </form>
        </div>
      </div>
    </AdminGuard>
  );
}
