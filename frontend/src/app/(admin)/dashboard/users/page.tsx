"use client";

import { useState, useEffect } from "react";
import { User as UserIcon, Shield, PenSquare, Trash2, ShieldCheck, Pen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import AdminGuard from "@/components/layout/AdminGuard";
import { fetchApi } from "@/lib/api";

// --- TYPES ---
interface Role {
  id: number;
  libelle: string;
}

interface Profile {
  firstname: string;
  lastname: string;
  tel?: string;
}

interface DashboardUser {
  id: number;
  name?: string; // Renvoyé par /auth/me selon comment est fait ton JWT
  profile?: Profile; // Renvoyé par la route /users
  email: string;
  role: string | Role; 
  created_at: string;
}

export default function UsersDashboard() {
  const [users, setUsers] = useState<DashboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<DashboardUser | null>(null);

  // --- UTILITAIRES ---
  
  // Extrait le nom complet depuis le profil imbriqué ou le JWT
  const getDisplayName = (user: DashboardUser | null): string => {
    if (!user) return "";
    if (user.profile?.firstname && user.profile?.lastname) {
      return `${user.profile.firstname} ${user.profile.lastname}`;
    }
    return user.name || "Utilisateur inconnu";
  };

  // Extrait le nom du rôle proprement
  const getRoleName = (roleData: string | Role | undefined): string => {
    if (!roleData) return "";
    if (typeof roleData === 'string') return roleData.toLowerCase();
    return (roleData.libelle || "").toLowerCase();
  };

  useEffect(() => {
    const initData = async () => {
      try {
        const me = await fetchApi<DashboardUser>('/v1/auth/me').catch(() => null);
        setCurrentUser(me);

        const allUsers = await fetchApi<DashboardUser[]>('/v1/users');
        
        // Rôles autorisés pour le dashboard (ajusté avec la casse de ta BDD)
        const authorizedRoles = ['super_admin', 'admin', 'redacteur', 'journaliste'];
        
        const dashboardUsers = allUsers.filter(user => {
          const roleName = getRoleName(user.role);
          return authorizedRoles.includes(roleName);
        });

        setUsers(dashboardUsers);
      } catch (error) {
        console.error("Erreur lors du chargement des utilisateurs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initData();
  }, []);

  const formatDate = (isoDate: string) => {
    if (!isoDate) return "Date inconnue";
    const date = new Date(isoDate);
    const day = date.getDate();
    const month = date.toLocaleDateString('fr-FR', { month: 'short' });
    const year = date.getFullYear();
    const dayString = day === 1 ? "1er" : day;
    return `${dayString} ${month}. ${year}`;
  };

  const getRoleBadge = (roleData: string | Role) => {
    const r = getRoleName(roleData);
    
    if (r === 'super_admin' || r === 'admin' || r === 'admin chalonnais') {
      return (
        <span className="inline-flex items-center gap-1.5 bg-or text-noir font-poppins font-black text-xs px-3 py-1 rounded-full">
          <ShieldCheck size={14} />
          {r === 'super_admin' ? 'Super Admin' : 'Admin'}
        </span>
      );
    }
    
    if (r === 'redacteur' || r === 'journaliste') {
      return (
        <span className="inline-flex items-center gap-1.5 bg-vert/10 text-vert border border-vert/20 font-poppins font-black text-xs px-3 py-1 rounded-full">
          <Pen size={14} />
          {r === 'journaliste' ? 'Journaliste' : 'Rédacteur'}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 bg-champagne/20 text-noir font-poppins font-black text-xs px-3 py-1 rounded-full capitalize">
        <UserIcon size={14} />
        {r || "Utilisateur"}
      </span>
    );
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir retirer les accès de ${name} ?`)) return;
    
    try {
      await fetchApi(`/v1/users/${id}`, { method: 'DELETE' });
      setUsers(users.filter(u => u.id !== id));
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      alert("Impossible de supprimer cet utilisateur.");
    }
  };

  return (
    <AdminGuard allowedRoles={['admin', 'super_admin']}>
      <div className="space-y-8 animate-slide-up max-w-5xl">
        
        <div>
          <h1 className="font-poppins font-black text-2xl text-noir mb-1 flex items-center gap-2">
            <UserIcon className="text-noir" size={28} /> Utilisateurs
          </h1>
          <p className="font-raleway text-champagne text-sm">
            Gérez les accès et les rôles de la plateforme
          </p>
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
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 p-4 items-center">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <div><Skeleton className="h-6 w-24 rounded-full" /></div>
                  <div><Skeleton className="h-4 w-24" /></div>
                  <div className="flex gap-2 justify-end">
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                </div>
              ))
            ) : users.length === 0 ? (
              <div className="p-8 text-center text-champagne font-montserrat text-sm italic">
                Aucun utilisateur autorisé trouvé.
              </div>
            ) : (
              users.map((user) => {
                const userRole = getRoleName(user.role);
                const displayName = getDisplayName(user);
                
                // Règle de sécurité : un admin ne peut pas supprimer un super_admin, ni se supprimer lui-même
                const canDelete = currentUser?.id !== user.id && userRole !== 'super_admin';

                return (
                  <div key={user.id} className="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 p-4 items-center hover:bg-champagne/5 transition-colors">
                    
                    <div className="flex flex-col min-w-0 pr-4">
                      <span className="font-montserrat font-bold text-noir text-sm truncate capitalize">
                        {displayName} {currentUser?.id === user.id && "(Vous)"}
                      </span>
                      <span className="font-montserrat text-xs text-champagne truncate">
                        {user.email}
                      </span>
                    </div>

                    <div className="flex items-center">
                      {getRoleBadge(user.role)}
                    </div>

                    <div className="font-montserrat text-sm text-champagne">
                      {formatDate(user.created_at)}
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 bg-champagne/10 text-noir hover:bg-champagne/20 rounded-md"
                        title="Modifier l'utilisateur"
                      >
                        <PenSquare size={14} />
                      </Button>
                      
                      {canDelete && (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDelete(user.id, displayName)}
                          className="h-8 w-8 bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 rounded-md"
                          title="Révoquer les accès"
                        >
                          <Trash2 size={14} />
                        </Button>
                      )}
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}
