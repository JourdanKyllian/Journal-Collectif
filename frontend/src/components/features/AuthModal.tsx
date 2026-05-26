"use client";

import { useState } from "react";
import { Landmark, Crown, User, ArrowRight } from "lucide-react";
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

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: any) => void;
}

export default function AuthModal({ isOpen, onClose, onLoginSuccess }: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const isFakeAdmin = email.includes("admin");
    onLoginSuccess({
      name: isFakeAdmin ? "Admin Chalonnais" : "Jean Dupont",
      email: email || "jean@exemple.fr",
      role: isFakeAdmin ? "admin" : "user"
    });
    onClose();
  };

  const fillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {/* sm:max-w-105 = 420px en Tailwind v4 */}
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

        {/* FIX CRUCIAL : On ajoute 'flex flex-col w-full' ici pour forcer l'empilement */}
        <Tabs defaultValue="login" className="w-full flex flex-col">
          
          {/* TabsList en grid pour forcer les 2 colonnes horizontales */}
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

          {/* Formulaire de Connexion */}
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
              <Button type="submit" className="w-full h-14 bg-noir text-blanc font-montserrat font-black text-sm rounded-xl hover:bg-vert transition-all hover:-translate-y-0.5 shadow-lg">
                Se connecter <ArrowRight size={18} className="ml-2" />
              </Button>
            </form>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-champagne/20"></span></div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-blanc px-3 text-champagne font-bold font-montserrat">Comptes de démo</span>
              </div>
            </div>

            <div className="bg-or/10 border border-or/20 rounded-2xl p-4 space-y-2">
              <button 
                type="button"
                onClick={() => fillDemo('admin@chalonnais.fr', 'admin123')}
                className="w-full flex items-center justify-between px-4 py-3 bg-blanc border border-champagne/20 rounded-xl hover:border-or transition-all group"
              >
                <span className="font-montserrat font-bold flex items-center gap-2.5 text-noir text-sm">
                  <Crown size={16} className="text-or" /> admin@chalonnais.fr
                </span>
                <Badge className="bg-or text-noir font-poppins font-black text-[10px] border-0">Admin</Badge>
              </button>
              <button 
                type="button"
                onClick={() => fillDemo('jean@exemple.fr', 'user123')}
                className="w-full flex items-center justify-between px-4 py-3 bg-blanc border border-champagne/20 rounded-xl hover:border-or transition-all group"
              >
                <span className="font-montserrat font-bold flex items-center gap-2.5 text-noir text-sm">
                  <User size={16} className="text-vert" /> jean@exemple.fr
                </span>
                <Badge className="bg-champagne/30 text-vert font-poppins font-black text-[10px] border-0">Citoyen</Badge>
              </button>
            </div>
          </TabsContent>

          {/* Formulaire d'Inscription (Simplifié) */}
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