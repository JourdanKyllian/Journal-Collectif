"use client";

import { useState, useEffect } from "react";
import { User as UserIcon, PenSquare, Trash2, ShieldCheck, Pen, Plus, CheckCircle2, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import AdminGuard from "@/components/layout/AdminGuard";
import { fetchApi } from "@/lib/api";
import { PERMISSIONS } from "@/lib/permissions";

interface Role { id: number; libelle: string; }
interface Profile { firstname: string; lastname: string; tel?: string; }
interface DashboardUser {
  id: number;
  name?: string;
  profile?: Profile;
  email: string;
  role: string | Role; 
  created_at: string;
}

export default function UsersDashboard() {
  const [users, setUsers] = useState<DashboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<DashboardUser | null>(null);
  
  // États de la Modale d'édition / création
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  
  const [formData, setFormData] = useState({ firstname: "", lastname: "", email: "", password: "", role: "redacteur" });

  const getDisplayName = (user: DashboardUser | null): string => {
    if (!user) return "";
    if (user.profile?.firstname && user.profile?.lastname) return `${user.profile.firstname} ${user.profile.lastname}`;
    return user.name || "Utilisateur inconnu";
  };

  const getRoleName = (roleData: string | Role | undefined): string => {
    if (!roleData) return "";
    if (typeof roleData === 'string') return roleData.toLowerCase();
    return (roleData.libelle || "").toLowerCase();
  };

  const loadData = async () => {
    try {
      const me = await fetchApi<DashboardUser>('/v1/auth/me').catch(() => null);
      setCurrentUser(me);
      const allUsers = await fetchApi<DashboardUser[]>('/v1/users/all');
      const authorizedRoles = ['super_admin', 'admin', 'redacteur', 'journaliste'];
      
      // 1. On filtre les rôles autorisés
      const filteredUsers = allUsers.filter(u => authorizedRoles.includes(getRoleName(u.role)));

      // 2. On place l'utilisateur connecté tout en haut
      if (me) {
        const currentUserData = filteredUsers.find(u => u.id === me.id);
        const otherUsers = filteredUsers.filter(u => u.id !== me.id);
        
        if (currentUserData) {
          setUsers([currentUserData, ...otherUsers]);
        } else {
          setUsers(filteredUsers);
        }
      } else {
        setUsers(filteredUsers);
      }

    } catch (error) {
      console.error("Erreur de chargement", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const openModal = (user?: DashboardUser) => {
    setFeedback(null);
    if (user) {
      setEditingUserId(user.id);
      setFormData({
        firstname: user.profile?.firstname || "",
        lastname: user.profile?.lastname || "",
        email: user.email,
        password: "", // On le laisse vide, la BDD ne le modifiera pas si vide
        role: getRoleName(user.role)
      });
    } else {
      setEditingUserId(null);
      setFormData({ firstname: "", lastname: "", email: "", password: "", role: "redacteur" });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      // Nettoyage du mot de passe vide en cas d'édition
      const payload = { ...formData };
      if (editingUserId && !payload.password) delete (payload as any).password;

      if (editingUserId) {
        await fetchApi(`/v1/users/${editingUserId}`, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        await fetchApi('/v1/users/create', { method: 'POST', body: JSON.stringify(payload) });
      }
      setIsModalOpen(false);
      loadData(); // On rafraîchit le tableau
    } catch (error: unknown) {
      setFeedback({ type: "error", message: (error as Error).message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Voulez-vous retirer les accès de ${name} ?`)) return;
    try {
      await fetchApi(`/v1/users/${id}`, { method: 'DELETE' });
      setUsers(users.filter(u => u.id !== id));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      alert(error.message || "Erreur lors de la suppression");
    }
  };

  const getRoleBadge = (roleData: string | Role) => {
    const r = getRoleName(roleData);
    if (['super_admin', 'admin'].includes(r)) return <span className="inline-flex items-center gap-1.5 bg-or text-noir font-poppins font-black text-xs px-3 py-1 rounded-full"><ShieldCheck size={14} />{r === 'super_admin' ? 'Super Admin' : 'Admin'}</span>;
    if (['redacteur', 'journaliste'].includes(r)) return <span className="inline-flex items-center gap-1.5 bg-vert/10 text-vert border border-vert/20 font-poppins font-black text-xs px-3 py-1 rounded-full"><Pen size={14} />Rédacteur</span>;
    return <span className="inline-flex items-center gap-1.5 bg-champagne/20 text-noir font-poppins font-black text-xs px-3 py-1 rounded-full capitalize"><UserIcon size={14} />{r}</span>;
  };

  const currentRole = getRoleName(currentUser?.role);

  return (
    <AdminGuard allowedRoles={PERMISSIONS.manageAlerts}>
      <div className="space-y-8 animate-slide-up max-w-5xl">
        
        <div className="flex justify-between items-end flex-wrap gap-4">
          <div>
            <h1 className="font-poppins font-black text-2xl text-noir mb-1 flex items-center gap-2">
              <UserIcon className="text-noir" size={28} /> Utilisateurs
            </h1>
            <p className="font-raleway text-champagne text-sm">Gérez les accès et les rôles de la plateforme</p>
          </div>
          <Button onClick={() => openModal()} className="bg-noir text-blanc font-montserrat font-bold rounded-xl hover:bg-vert transition-all">
            <Plus size={16} className="mr-2" /> Nouvel utilisateur
          </Button>
        </div>

        <div className="bg-blanc border border-champagne/20 rounded-2xl overflow-hidden shadow-sm">
          <div className="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 p-4 border-b border-champagne/20 bg-blanc/50">
            <div className="font-montserrat font-bold text-xs text-champagne tracking-widest uppercase">Utilisateur</div>
            <div className="font-montserrat font-bold text-xs text-champagne tracking-widest uppercase">Rôle</div>
            <div className="font-montserrat font-bold text-xs text-champagne tracking-widest uppercase">Inscription</div>
            <div className="font-montserrat font-bold text-xs text-champagne tracking-widest uppercase text-right">Actions</div>
          </div>

          <div className="divide-y divide-champagne/10">
            {isLoading ? (
              <div className="p-4"><Skeleton className="h-10 w-full" /></div>
            ) : (
              users.map((user) => {
                const targetRole = getRoleName(user.role);
                const isSelf = currentUser?.id === user.id;
                const canManage = currentRole === 'super_admin' || isSelf || (currentRole === 'admin' && !['super_admin', 'admin'].includes(targetRole));
                const canDelete = canManage && !isSelf;

                return (
                  <div key={user.id} className="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 p-4 items-center hover:bg-champagne/5 transition-colors">
                    <div className="flex flex-col min-w-0 pr-4">
                      <span className="font-montserrat font-bold text-noir text-sm truncate capitalize">
                        {getDisplayName(user)} {currentUser?.id === user.id && "(Vous)"}
                      </span>
                      <span className="font-montserrat text-xs text-champagne truncate">{user.email}</span>
                    </div>
                    <div className="flex items-center">{getRoleBadge(user.role)}</div>
                    <div className="font-montserrat text-sm text-champagne">{new Date(user.created_at).toLocaleDateString('fr-FR')}</div>
                    
                    <div className="flex items-center justify-end gap-2">
                      {canManage && (
                        <Button onClick={() => openModal(user)} variant="ghost" size="icon" className="h-8 w-8 bg-champagne/10 text-noir hover:bg-champagne/20 rounded-md"><PenSquare size={14} /></Button>
                      )}
                      {canDelete && (
                        <Button onClick={() => handleDelete(user.id, getDisplayName(user))} variant="ghost" size="icon" className="h-8 w-8 bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 rounded-md"><Trash2 size={14} /></Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* --- MODALE CRÉATION / MODIFICATION --- */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-125 bg-blanc rounded-2xl border-champagne/30 p-6" showCloseButton={true}>
            <DialogHeader>
              <DialogTitle className="font-poppins font-black text-xl text-noir">
                {editingUserId ? "Modifier l'utilisateur" : "Ajouter un membre"}
              </DialogTitle>
            </DialogHeader>

            {feedback && (
              <div className={`p-3 rounded-lg text-xs font-bold font-montserrat flex items-center gap-2 ${feedback.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                {feedback.type === 'error' ? <AlertTriangle size={14}/> : <CheckCircle2 size={14}/>} {feedback.message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-montserrat font-bold text-xs text-champagne uppercase">Prénom</Label>
                  <Input required value={formData.firstname} onChange={(e) => setFormData({...formData, firstname: e.target.value})} className="border-champagne/40 bg-blanc font-montserrat" />
                </div>
                <div className="space-y-2">
                  <Label className="font-montserrat font-bold text-xs text-champagne uppercase">Nom</Label>
                  <Input required value={formData.lastname} onChange={(e) => setFormData({...formData, lastname: e.target.value})} className="border-champagne/40 bg-blanc font-montserrat" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-montserrat font-bold text-xs text-champagne uppercase">Email</Label>
                <Input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="border-champagne/40 bg-blanc font-montserrat" />
              </div>

              <div className="space-y-2">
                <Label className="font-montserrat font-bold text-xs text-champagne uppercase">Rôle</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(val) => setFormData({...formData, role: val})}
                  disabled={editingUserId === currentUser?.id && currentRole !== 'super_admin'}
                >
                  <SelectTrigger className="border-champagne/40 bg-blanc font-montserrat h-10">
                    <SelectValue placeholder="Sélectionnez un rôle" />
                  </SelectTrigger>
                  <SelectContent className="bg-blanc font-montserrat">
                    {(currentRole === 'super_admin' || (editingUserId === currentUser?.id && currentRole === 'admin')) && (
                      <SelectItem value="admin">Administrateur</SelectItem>
                    )}
                    <SelectItem value="redacteur">Rédacteur / Journaliste</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="font-montserrat font-bold text-xs text-champagne uppercase">
                  Mot de passe {editingUserId && <span className="opacity-60 lowercase font-normal">(Laissez vide pour conserver l&apos;actuel)</span>}
                </Label>
                <Input required={!editingUserId} type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="border-champagne/40 bg-blanc font-montserrat" />
              </div>

              <DialogFooter className="pt-4 sm:justify-end">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="border-champagne/40 font-montserrat font-bold rounded-xl">Annuler</Button>
                <Button type="submit" disabled={isSubmitting} className="bg-noir text-blanc hover:bg-vert font-montserrat font-bold rounded-xl">
                  {isSubmitting ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

      </div>
    </AdminGuard>
  );
}
