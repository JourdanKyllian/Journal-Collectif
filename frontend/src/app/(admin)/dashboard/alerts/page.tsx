"use client";

import { useState, useRef } from "react";
import { AlertTriangle, Trash2, Info, CalendarDays, Megaphone, PartyPopper, CheckCircle2, PenSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { FeedbackAlert, FeedbackMessage } from "@/components/ui/feedback-alert";
import AdminGuard from "@/components/layout/AdminGuard";
import { fetchApi } from "@/lib/api";
import { useFetchApi } from "@/hooks/useFetchApi";
import { formatDateToFrench } from "@/lib/formatters";
import { PERMISSIONS } from "@/lib/permissions";

interface AlertItem {
  id: number;
  type: "urgent" | "info" | "event";
  title: string;
  message: string;
  startDate: string | null;
  endDate: string | null;
  created_at: string;
}

const TYPE_STYLES = {
  urgent: { wrapper: "border-red-500", bgIcon: "bg-red-100", textIcon: "text-red-500", badgeBg: "bg-red-500", badgeText: "URGENT", Icon: Megaphone },
  info: { wrapper: "border-orange-400", bgIcon: "bg-orange-100", textIcon: "text-orange-500", badgeBg: "bg-orange-400", badgeText: "INFO", Icon: Info },
  event: { wrapper: "border-vert", bgIcon: "bg-vert/10", textIcon: "text-vert", badgeBg: "bg-vert", badgeText: "ÉVÉNEMENT", Icon: PartyPopper }
};

/**
 * Tableau de bord d'administration gérant les bannières d'urgence du site.
 */
export default function AlertsDashboard() {
  const { data: alertsData, isLoading, refetch } = useFetchApi<AlertItem[]>('/v1/alerts');
  const alerts = alertsData || [];

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);

  const [editingAlertId, setEditingAlertId] = useState<number | null>(null);
  const [hasEndDate, setHasEndDate] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({ type: "urgent", title: "", message: "", startDate: "", endDate: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);
    try {
      const payload = {
        ...formData,
        startDate: formData.startDate ? formData.startDate : null,
        endDate: (hasEndDate && formData.endDate) ? formData.endDate : null,
      };

      if (editingAlertId) {
        await fetchApi(`/v1/alerts/${editingAlertId}`, { method: 'PATCH', body: JSON.stringify(payload) });
        setFeedback({ type: "success", message: "Alerte modifiée avec succès !" });
      } else {
        await fetchApi('/v1/alerts', { method: 'POST', body: JSON.stringify(payload) });
        setFeedback({ type: "success", message: "Alerte publiée avec succès !" });
      }
      
      handleCancelEdit();
      await refetch();
    } catch (error: unknown) {
      setFeedback({ type: "error", message: (error as Error).message || "Erreur de sauvegarde" });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Voulez-vous vraiment retirer cette alerte ?")) return;
    try {
      await fetchApi(`/v1/alerts/${id}`, { method: 'DELETE' });
      if (editingAlertId === id) handleCancelEdit();
      await refetch();
    } catch (error: unknown) {
      alert((error as Error).message || "Impossible de supprimer l'alerte.");
    }
  };

  const handleEditClick = (alert: AlertItem) => {
    setEditingAlertId(alert.id);
    setFormData({ type: alert.type, title: alert.title, message: alert.message, startDate: alert.startDate || "", endDate: alert.endDate || "" });
    setHasEndDate(!!alert.endDate);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  const handleCancelEdit = () => {
    setEditingAlertId(null);
    setFormData({ type: "urgent", title: "", message: "", startDate: "", endDate: "" });
    setHasEndDate(false);
  };

  return (
    <AdminGuard allowedRoles={PERMISSIONS.manageAlerts}>
      <div className="space-y-8 animate-slide-up max-w-4xl">
        <div>
          <h1 className="font-poppins font-black text-2xl text-noir mb-1 flex items-center gap-2">
            <AlertTriangle className="text-red-500" /> Alertes Importantes
          </h1>
          <p className="font-raleway text-champagne text-sm">Gérez les bannières d&apos;urgence affichées en tête du site</p>
        </div>

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
                  <div key={alert.id} className={`bg-blanc border-l-4 ${style.wrapper} rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:shadow-md transition-all`}>
                    <div className={`w-10 h-10 ${style.bgIcon} rounded-xl flex items-center justify-center ${style.textIcon} shrink-0`}>
                      <style.Icon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`${style.badgeBg} text-blanc font-poppins font-black text-xs px-2.5 py-0.5 rounded-full`}>{style.badgeText}</span>
                        <h3 className="font-montserrat font-bold text-sm">{alert.title}</h3>
                      </div>
                      <p className="font-montserrat text-xs text-champagne mb-2 whitespace-pre-wrap line-clamp-2">{alert.message}</p>
                      <div className="font-montserrat text-xs text-champagne flex items-center gap-1.5">
                        <CalendarDays size={12} /> {alert.startDate ? `Du ${formatDateToFrench(alert.startDate)}` : "Alerte permanente"} {alert.endDate && `au ${formatDateToFrench(alert.endDate)}`}
                      </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto justify-end shrink-0 border-t border-champagne/10 sm:border-0 pt-3 sm:pt-0 mt-1 sm:mt-0">
                      <Button onClick={() => handleEditClick(alert)} variant="ghost" size="sm" className="bg-champagne/15 text-vert hover:bg-champagne/30 font-montserrat font-bold text-xs rounded-lg flex-1 sm:flex-none">
                        <PenSquare size={14} className="mr-1.5" /> Éditer
                      </Button>
                      <Button onClick={() => handleDelete(alert.id)} variant="ghost" size="sm" className="bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 font-montserrat font-bold text-xs rounded-lg flex-1 sm:flex-none">
                        <Trash2 size={14} className="mr-1.5" /> Retirer
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div ref={formRef} className={`bg-blanc rounded-2xl border ${editingAlertId ? 'border-or shadow-lg shadow-or/10' : 'border-champagne/20'} p-6 sm:p-8 mt-8 transition-all duration-300`}>
          <h2 className="font-poppins font-black text-lg text-noir mb-6 flex items-center gap-2">
            {editingAlertId ? <><PenSquare size={20} className="text-or" /> Modifier l&apos;alerte</> : <>＋ Créer une nouvelle alerte</>}
          </h2>

          <FeedbackAlert feedback={feedback} />
          
          <form onSubmit={handleSubmit} className="space-y-6">
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
                <div className="flex items-center justify-between mb-1">
                  <Label className="font-montserrat font-bold text-xs text-vert tracking-wide uppercase">Date de fin</Label>
                  <div className="flex items-center gap-2">
                    <Label className="text-[10px] font-montserrat text-champagne cursor-pointer uppercase tracking-wider" onClick={() => { setHasEndDate(!hasEndDate); if(hasEndDate) setFormData({ ...formData, endDate: "" }); }}>
                      Définir une fin
                    </Label>
                    <Switch checked={hasEndDate} onCheckedChange={(val) => { setHasEndDate(val); if (!val) setFormData({ ...formData, endDate: "" }); }} className="data-[state=checked]:bg-or" />
                  </div>
                </div>
                <Input type="date" disabled={!hasEndDate} value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className="px-4 py-6 border-champagne/40 rounded-xl bg-blanc focus-visible:ring-or/30 focus-visible:border-or disabled:opacity-50 disabled:bg-champagne/10 disabled:cursor-not-allowed transition-all" />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {editingAlertId && <Button type="button" onClick={handleCancelEdit} variant="outline" className="py-6 border-champagne/40 text-noir font-montserrat font-bold rounded-xl hover:bg-champagne/10 transition-all sm:w-1/3">Annuler</Button>}
              <Button disabled={isSubmitting} type="submit" className={`py-6 bg-noir text-blanc font-montserrat font-bold text-sm rounded-xl hover:bg-vert transition-all hover:-translate-y-0.5 ${editingAlertId ? 'sm:w-2/3' : 'w-full'}`}>
                {isSubmitting ? "Traitement en cours..." : (editingAlertId ? <><CheckCircle2 size={16} className="mr-2" /> Enregistrer les modifications</> : <><Megaphone size={16} className="mr-2" /> Publier l&apos;alerte sur le site</>)}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AdminGuard>
  );
}
