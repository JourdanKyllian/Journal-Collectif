"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { User, LogOut, Star, Bell, Save, ShieldAlert, CheckCircle2, AlertTriangle, Key, Shield, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchApi } from "@/lib/api";

interface UserProfileData {
  id: number;
  email: string;
  role: "admin" | "user";
  firstname: string | null;
  lastname: string | null;
  avatar_ref: string;
  bio: string | null;
  tel: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"public" | "security" | "preferences">("public");
  const [user, setUser] = useState<UserProfileData | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [profileForm, setProfileForm] = useState({ firstname: "", lastname: "", tel: "", bio: "", avatar_ref: "default_01" });
  const [securityForm, setSecurityForm] = useState({ currentPassword: "", newEmail: "", newPassword: "", confirmPassword: "" });
  
  const [notifImportant, setNotifImportant] = useState(true);
  const [notifCategories, setNotifCategories] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const data = await fetchApi<UserProfileData>("/v1/auth/me");
        setUser(data);
        setProfileForm({
          firstname: data.firstname || "",
          lastname: data.lastname || "",
          tel: data.tel || "",
          bio: data.bio || "",
          avatar_ref: data.avatar_ref || "default_01",
        });
      } catch (error) {
        console.error("Session invalide, redirection.", error);
        router.push("/");
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserData();
  }, [router]);

  const showFeedback = useCallback((type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  }, []);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);
    try {
      await fetchApi("/v1/profile/me", {
        method: "PATCH",
        body: JSON.stringify(profileForm),
      });
      setUser((prev) => prev ? { ...prev, ...profileForm } : null);
      showFeedback("success", "Profil public mis à jour avec succès.");
    } catch (error: any) {
      showFeedback("error", error.message || "Erreur lors de la mise à jour du profil.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (securityForm.newPassword && securityForm.newPassword !== securityForm.confirmPassword) {
      return showFeedback("error", "Les nouveaux mots de passe ne correspondent pas.");
    }

    setIsSaving(true);
    try {
      const payload: any = { currentPassword: securityForm.currentPassword };
      if (securityForm.newEmail) payload.newEmail = securityForm.newEmail;
      if (securityForm.newPassword) payload.newPassword = securityForm.newPassword;

      await fetchApi("/v1/auth/security", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      
      if (securityForm.newEmail) {
        setUser((prev) => prev ? { ...prev, email: securityForm.newEmail } : null);
      }
      setSecurityForm({ currentPassword: "", newEmail: "", newPassword: "", confirmPassword: "" });
      showFeedback("success", "Paramètres de sécurité mis à jour.");
    } catch (error: any) {
      showFeedback("error", error.message || "Erreur lors de la mise à jour de sécurité.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetchApi("/v1/auth/logout", { method: "POST" });
    } finally {
      router.push("/");
    }
  };

  const avatars = [
    { id: "default_01", color: "bg-vert", label: "Vert" },
    { id: "default_02", color: "bg-or", label: "Or" },
    { id: "default_03", color: "bg-noir", label: "Noir" },
    { id: "default_04", color: "bg-champagne", label: "Champagne" },
  ];

  if (isLoading || !user) {
    return (
      <div className="w-full min-h-[calc(100vh-70px)] bg-blanc py-12 px-6 flex justify-center">
        <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-4 gap-8">
          <Skeleton className="h-62.5 md:h-87.5 rounded-2xl md:col-span-1" />
          <Skeleton className="h-112.5 rounded-2xl md:col-span-3" />
        </div>
      </div>
    );
  }

  const userFullName = user.firstname && user.lastname ? `${user.firstname} ${user.lastname}` : "Citoyen Anonyme";
  const activeAvatar = avatars.find(a => a.id === user.avatar_ref)?.color || "bg-vert";

  return (
    <div className="w-full min-h-[calc(100vh-70px)] bg-blanc py-8 md:py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto animate-slide-up">
        
        {/* --- MESSAGES DE RETOUR --- */}
        {feedback && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 font-montserrat font-bold text-sm shadow-sm animate-in fade-in duration-300 ${feedback.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
            {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            {feedback.message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8 items-start">
          
          {/* ================= COLONNE DE GAUCHE : IDENTITÉ & NAVIGATION ================= */}
          <div className="md:col-span-1 bg-blanc border border-champagne/30 rounded-2xl p-5 sm:p-6 shadow-sm md:sticky md:top-24 space-y-5">
            <div className="flex md:flex-col items-center md:text-center gap-4 md:gap-0">
              <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full border-3 border-or flex items-center justify-center text-blanc shrink-0 md:mx-auto md:mb-3 shadow-md ${activeAvatar}`}>
                <User size={28} />
              </div>
              <div className="min-w-0 flex-1 md:w-full">
                <h2 className="font-poppins font-black text-sm md:text-base text-noir truncate">{userFullName}</h2>
                <p className="font-montserrat text-xs text-champagne mt-0.5 truncate">{user.email}</p>
                
                {user.role === "admin" && (
                  <Badge className="mt-2 bg-or text-noir font-poppins font-black text-[10px] px-2 py-0.5 border-0 inline-block">
                    Admin
                  </Badge>
                )}
              </div>
            </div>

            <div className="hidden md:block h-px bg-champagne/25 w-full"></div>

            {/* Navigation interne responsive : Horizontale sur mobile, Verticale sur desktop */}
            <nav className="flex md:flex-col gap-1.5 overflow-x-auto pb-1 md:pb-0">
              <button
                onClick={() => setActiveTab("public")}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-montserrat font-bold text-xs transition-all text-left whitespace-nowrap shrink-0 md:shrink md:w-full ${activeTab === "public" ? "bg-or text-noir shadow-sm" : "text-champagne hover:text-noir hover:bg-champagne/10"}`}
              >
                <UserCog size={15} /> Identité
              </button>
              <button
                onClick={() => setActiveTab("security")}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-montserrat font-bold text-xs transition-all text-left whitespace-nowrap shrink-0 md:shrink md:w-full ${activeTab === "security" ? "bg-or text-noir shadow-sm" : "text-champagne hover:text-noir hover:bg-champagne/10"}`}
              >
                <Shield size={15} /> Sécurité
              </button>
              <button
                onClick={() => setActiveTab("preferences")}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-montserrat font-bold text-xs transition-all text-left whitespace-nowrap shrink-0 md:shrink md:w-full ${activeTab === "preferences" ? "bg-or text-noir shadow-sm" : "text-champagne hover:text-noir hover:bg-champagne/10"}`}
              >
                <Star size={15} /> Abonnements
              </button>
            </nav>

            <div className="hidden md:block h-px bg-champagne/25 w-full"></div>

            <Button onClick={handleLogout} variant="ghost" className="hidden md:flex w-full justify-start py-3 text-red-500 hover:bg-red-50 font-montserrat font-bold text-xs rounded-xl transition-all">
              <LogOut size={15} className="mr-2" /> Déconnexion
            </Button>
          </div>

          {/* ================= COLONNE DE DROITE : CONTENU ACTIF ================= */}
          <div className="md:col-span-3">
            
            {/* === 1. IDENTITÉ PUBLIQUE === */}
            {activeTab === "public" && (
              <form onSubmit={handleProfileSubmit} className="bg-blanc border border-champagne/30 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-champagne/20 pb-4 gap-4">
                  <div>
                    <h3 className="font-poppins font-black text-lg text-noir">Profil Public</h3>
                    <p className="font-raleway text-xs text-champagne">Ces informations sont visibles sur vos articles et contributions</p>
                  </div>
                  <Button type="submit" disabled={isSaving} className="w-full sm:w-auto bg-noir text-blanc font-montserrat font-bold rounded-xl hover:bg-vert transition-all px-5 py-2.5 h-auto text-xs">
                    <Save size={14} className="mr-1.5" /> Enregistrer
                  </Button>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="font-montserrat font-bold text-xs text-champagne uppercase">Prénom</Label>
                    <Input value={profileForm.firstname} onChange={(e) => setProfileForm({ ...profileForm, firstname: e.target.value })} placeholder="Jean" className="border-champagne/40 rounded-xl bg-blanc focus-visible:ring-or/30 focus-visible:border-or text-sm py-5" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-montserrat font-bold text-xs text-champagne uppercase">Nom</Label>
                    <Input value={profileForm.lastname} onChange={(e) => setProfileForm({ ...profileForm, lastname: e.target.value })} placeholder="Dupont" className="border-champagne/40 rounded-xl bg-blanc focus-visible:ring-or/30 focus-visible:border-or text-sm py-5" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-montserrat font-bold text-xs text-champagne uppercase">Numéro de téléphone</Label>
                  <Input value={profileForm.tel} onChange={(e) => setProfileForm({ ...profileForm, tel: e.target.value })} placeholder="06 12 34 56 78" className="border-champagne/40 rounded-xl bg-blanc focus-visible:ring-or/30 focus-visible:border-or text-sm py-5" />
                </div>

                <div className="space-y-2">
                  <Label className="font-montserrat font-bold text-xs text-champagne uppercase flex justify-between">
                    <span>Biographie (Auteurs)</span>
                    <span className="font-normal opacity-70">{profileForm.bio.length}/250</span>
                  </Label>
                  <Textarea maxLength={250} rows={3} value={profileForm.bio} onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })} placeholder="Décrivez votre activité ou vos centres d'intérêts dans la commune..." className="border-champagne/40 rounded-xl bg-blanc focus-visible:ring-or/30 focus-visible:border-or resize-none text-sm" />
                </div>

                <div className="space-y-3">
                  <Label className="font-montserrat font-bold text-xs text-champagne uppercase">Couleur d&apos;Avatar</Label>
                  <div className="flex gap-4">
                    {avatars.map((avatar) => (
                      <button
                        key={avatar.id}
                        type="button"
                        onClick={() => setProfileForm({ ...profileForm, avatar_ref: avatar.id })}
                        className={`w-10 h-10 rounded-full border-2 transition-all ${avatar.color} ${profileForm.avatar_ref === avatar.id ? "border-or scale-110 shadow-md" : "border-transparent opacity-60 hover:opacity-100"}`}
                        aria-label={`Sélectionner l'avatar ${avatar.label}`}
                      />
                    ))}
                  </div>
                </div>
              </form>
            )}

            {/* === 2. SÉCURITÉ === */}
            {activeTab === "security" && (
              <form onSubmit={handleSecuritySubmit} className="bg-blanc border border-red-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 relative overflow-hidden animate-in fade-in duration-300">
                <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-champagne/20 pb-4 gap-4">
                  <div>
                    <h3 className="font-poppins font-black text-lg text-noir">Sécurité du Compte</h3>
                    <p className="font-raleway text-xs text-champagne">Modifiez vos identifiants de connexion sensibles</p>
                  </div>
                  <Button type="submit" disabled={isSaving} className="w-full sm:w-auto bg-red-500 text-blanc font-montserrat font-bold rounded-xl hover:bg-red-600 transition-all px-5 py-2.5 h-auto text-xs">
                    <Key size={14} className="mr-1.5" /> Mettre à jour
                  </Button>
                </div>
                
                <div className="space-y-2 bg-champagne/10 p-4 rounded-xl border border-champagne/20">
                  <Label className="font-montserrat font-bold text-xs text-noir uppercase">Mot de passe actuel *</Label>
                  <Input required type="password" value={securityForm.currentPassword} onChange={(e) => setSecurityForm({ ...securityForm, currentPassword: e.target.value })} placeholder="Obligatoire pour appliquer les modifications" className="border-champagne/40 rounded-xl bg-blanc focus-visible:ring-or/30 focus-visible:border-or text-sm py-5" />
                </div>

                <div className="space-y-2">
                  <Label className="font-montserrat font-bold text-xs text-champagne uppercase">Nouvelle adresse email</Label>
                  <Input type="email" value={securityForm.newEmail} onChange={(e) => setSecurityForm({ ...securityForm, newEmail: e.target.value })} placeholder={user.email} className="border-champagne/40 rounded-xl bg-blanc focus-visible:ring-or/30 focus-visible:border-or text-sm py-5" />
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="font-montserrat font-bold text-xs text-champagne uppercase">Nouveau mot de passe</Label>
                    <Input type="password" value={securityForm.newPassword} onChange={(e) => setSecurityForm({ ...securityForm, newPassword: e.target.value })} placeholder="Min. 14 caractères, 1 maj, 1 min, 1 car. spé" className="border-champagne/40 rounded-xl bg-blanc focus-visible:ring-or/30 focus-visible:border-or text-sm py-5" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-montserrat font-bold text-xs text-champagne uppercase">Confirmer le mot de passe</Label>
                    <Input type="password" value={securityForm.confirmPassword} onChange={(e) => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })} placeholder="Répétez le mot de passe" className="border-champagne/40 rounded-xl bg-blanc focus-visible:ring-or/30 focus-visible:border-or text-sm py-5" />
                  </div>
                </div>
              </form>
            )}

            {/* === 3. PRÉFÉRENCES === */}
            {activeTab === "preferences" && (
              <div className="bg-blanc border border-champagne/30 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in duration-300">
                <div className="border-b border-champagne/20 pb-4">
                  <h3 className="font-poppins font-black text-lg text-noir">Abonnements &amp; Notifications</h3>
                  <p className="font-raleway text-xs text-champagne">Gérez vos préférences de suivi des thématiques municipales</p>
                </div>
                
                <div className="flex flex-wrap gap-2 py-2">
                  <Badge className="bg-or text-noir hover:bg-or/90 font-montserrat font-bold text-sm px-4 py-2 rounded-full cursor-pointer border-0">🎭 Culture</Badge>
                  <Badge className="bg-or text-noir hover:bg-or/90 font-montserrat font-bold text-sm px-4 py-2 rounded-full cursor-pointer border-0">🏗️ Travaux</Badge>
                  <Badge variant="outline" className="bg-champagne/10 text-noir hover:bg-or hover:border-or font-montserrat font-bold text-sm px-4 py-2 rounded-full cursor-pointer border-champagne/30 transition-colors">⚽ Sport</Badge>
                  <Badge variant="outline" className="bg-champagne/10 text-noir hover:bg-or hover:border-or font-montserrat font-bold text-sm px-4 py-2 rounded-full cursor-pointer border-champagne/30 transition-colors">🎉 Événements</Badge>
                </div>

                <div className="h-px bg-champagne/20 w-full my-4"></div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-champagne/10">
                    <span className="font-montserrat font-semibold text-sm text-noir flex items-center gap-2"><Bell size={16} className="text-champagne"/> Alertes &amp; Articles importants</span>
                    <Switch checked={notifImportant} onCheckedChange={setNotifImportant} className="data-[state=checked]:bg-or" />
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="font-montserrat font-semibold text-sm text-noir flex items-center gap-2"><Star size={16} className="text-champagne"/> Nouvelles catégories suivies</span>
                    <Switch checked={notifCategories} onCheckedChange={setNotifCategories} className="data-[state=checked]:bg-or" />
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* --- BOUTON DÉCONNEXION (Mobile uniquement) --- */}
        <div className="mt-8 pt-6 border-t border-champagne/20 md:hidden">
          <Button onClick={handleLogout} variant="ghost" className="w-full py-6 text-red-500 hover:bg-red-50 font-montserrat font-bold rounded-xl transition-all text-base">
            <LogOut size={18} className="mr-2" /> Fermer la session
          </Button>
        </div>
      </div>
    </div>
  );
}
