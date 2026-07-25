"use client";

import { useState } from "react";
import { Landmark, Crown, Shield, User, ArrowRight, PenTool } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { fetchApi } from "@/lib/api";

interface AuthUser {
  name: string;
  email: string;
  role: 'admin' | 'user';
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: AuthUser) => void;
}

export default function AuthModal({ isOpen, onClose, onLoginSuccess }: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // 1. Authentification (le backend pose les cookies HTTP-Only)
      await fetchApi('/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      // 2. Récupération de l'identité en base de données
      const userData = await fetchApi<{ firstname: string | null; lastname: string | null; email: string; role: 'admin' | 'user' }>('/v1/auth/me');
      
      // 3. Formatage pour la Navbar
      const fullName = userData.firstname && userData.lastname 
        ? `${userData.firstname} ${userData.lastname}` 
        : "Citoyen Anonyme";

      onLoginSuccess({
        name: fullName,
        email: userData.email,
        role: userData.role
      });

      onClose();
    } catch (err: unknown) {
      const errObj = err as Error;
      setError(errObj.message || "Erreur de connexion. Vérifiez vos identifiants.");
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemo = (demoEmail: string, demoPass: string): void => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-105 bg-blanc border-champagne/30 rounded-3xl p-8 shadow-2xl overflow-hidden flex flex-col gap-0">
        
        <DialogHeader className="mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-linear-to-br from-vert to-noir rounded-2xl border-2 border-or flex items-center justify-center text-or shrink-0 shadow-md">
              <Landmark size={24} />
            </div>
            <div className="text-left">
              <DialogTitle className="font-poppins font-black text-base text-noir leading-tight">
                Collectif Chalonnais
              </DialogTitle>
              <DialogDescription className="font-raleway text-xs text-champagne font-bold tracking-wide">
                06 · Journal Municipal
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="login" className="w-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2 bg-champagne/15 rounded-xl p-1 h-auto mb-8 border border-champagne/10 shrink-0">
            <TabsTrigger 
              value="login" 
              className="py-3 rounded-lg font-montserrat font-bold text-sm transition-all data-[state=active]:bg-blanc data-[state=active]:text-noir data-[state=active]:shadow-sm text-champagne"
            >
              Connexion
            </TabsTrigger>
            <TabsTrigger 
              value="register" 
              className="py-3 rounded-lg font-montserrat font-bold text-sm transition-all data-[state=active]:bg-blanc data-[state=active]:text-noir data-[state=active]:shadow-sm text-champagne"
            >
              Inscription
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="w-full m-0 focus-visible:outline-none space-y-6">
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label className="font-montserrat font-bold text-[10px] text-vert tracking-widest uppercase ml-1">Email</Label>
                <Input 
                  type="email" 
                  placeholder="votre@email.fr" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-14 px-5 border-champagne/40 rounded-xl font-montserrat text-sm bg-blanc focus-visible:ring-or/30 focus-visible:border-or shadow-xs"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-montserrat font-bold text-[10px] text-vert tracking-widest uppercase ml-1">Mot de passe</Label>
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-14 px-5 border-champagne/40 rounded-xl font-montserrat text-sm bg-blanc focus-visible:ring-or/30 focus-visible:border-or shadow-xs"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-500 font-montserrat text-xs font-bold rounded-xl border border-red-200">
                  {error}
                </div>
              )}

              <Button type="submit" disabled={isLoading} className="w-full h-14 bg-noir text-blanc font-montserrat font-black text-sm rounded-xl hover:bg-vert transition-all hover:-translate-y-0.5 shadow-lg">
                {isLoading ? "Connexion..." : "Se connecter"} <ArrowRight size={18} className="ml-2" />
              </Button>
            </form>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-champagne/20"></span></div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-blanc px-3 text-champagne font-bold font-montserrat">Comptes de démo</span>
              </div>
            </div>

            {/* --- NOUVELLE GRILLE 2x2 --- */}
            <div className="bg-or/10 border border-or/20 rounded-2xl p-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              
              {/* Super Admin */}
              <button 
                type="button"
                onClick={() => fillDemo('superadmin@journal.fr', 'superadmin123')}
                className="flex items-center justify-between p-3 bg-blanc border border-champagne/20 rounded-xl hover:border-or transition-all group"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <Crown size={15} className="text-or shrink-0" />
                  <span className="font-montserrat font-bold text-noir text-[11px] truncate">
                    superadmin@journal.fr
                  </span>
                </div>
                <Badge className="bg-or text-noir font-poppins font-black text-[9px] px-1.5 py-0 border-0 shrink-0 ml-2">Gérant</Badge>
              </button>

              {/* Admin */}
              <button 
                type="button"
                onClick={() => fillDemo('admin@journal.fr', 'admin123')}
                className="flex items-center justify-between p-3 bg-blanc border border-champagne/20 rounded-xl hover:border-or transition-all group"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <Shield size={15} className="text-or shrink-0" />
                  <span className="font-montserrat font-bold text-noir text-[11px] truncate">
                    admin@journal.fr
                  </span>
                </div>
                <Badge className="bg-or/30 text-noir font-poppins font-black text-[9px] px-1.5 py-0 border-0 shrink-0 ml-2">Admin</Badge>
              </button>

              {/* Rédacteur */}
              <button 
                type="button"
                onClick={() => fillDemo('redacteur@journal.fr', 'redacteur123')}
                className="flex items-center justify-between p-3 bg-blanc border border-champagne/20 rounded-xl hover:border-or transition-all group"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <PenTool size={15} className="text-vert shrink-0" />
                  <span className="font-montserrat font-bold text-noir text-[11px] truncate">
                    redacteur@journal.fr
                  </span>
                </div>
                <Badge className="bg-champagne/30 text-vert font-poppins font-black text-[9px] px-1.5 py-0 border-0 shrink-0 ml-2">Auteur</Badge>
              </button>

              {/* Visiteur Complet (Celui qui a un vrai profil dans la base) */}
              <button 
                type="button"
                onClick={() => fillDemo('visiteur.complet@exemple.fr', 'user123')}
                className="flex items-center justify-between p-3 bg-blanc border border-champagne/20 rounded-xl hover:border-or transition-all group"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <User size={15} className="text-champagne shrink-0" />
                  <span className="font-montserrat font-bold text-noir text-[11px] truncate">
                    visiteur.complet@exemple.fr
                  </span>
                </div>
                <Badge className="bg-champagne/10 text-champagne font-poppins font-black text-[9px] px-1.5 py-0 border-0 shrink-0 ml-2">Citoyen</Badge>
              </button>

            </div>
          </TabsContent>

          <TabsContent value="register" className="w-full m-0 focus-visible:outline-none space-y-4">
             <Input placeholder="Nom complet" className="h-14 px-5 border-champagne/40 rounded-xl" />
             <Input type="email" placeholder="Email" className="h-14 px-5 border-champagne/40 rounded-xl" />
             <Input type="password" placeholder="Mot de passe" className="h-14 px-5 border-champagne/40 rounded-xl" />
             <Button className="w-full h-14 bg-noir text-blanc font-montserrat font-black rounded-xl">
               Créer un compte
             </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
