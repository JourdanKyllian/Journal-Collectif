"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Landmark, User, Settings, LogOut, Menu, LayoutGrid, Search, Home, Book } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import AuthModal from "@/components/features/AuthModal";

export default function Navbar() {
  const pathname = usePathname();
  
  // Nouveaux états pour gérer la modale et l'utilisateur connecté
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null); // null = personne n'est connecté
  
  const isAdmin = user?.role === "admin";

  // Fonction appelée quand la modale réussit la connexion
  const handleLoginSuccess = (userData: any) => {
    setUser(userData);
  };

  const navLinks = [
    { name: "Accueil", href: "/", icon: Home },
    { name: "Articles", href: "/articles", icon: Book },
    { name: "Catégories", href: "/categories", icon: LayoutGrid },
    { name: "Objets perdus", href: "/lost", icon: Search },
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-blanc/90 backdrop-blur-xl border-b border-champagne/30 h-17.5 flex items-center">
        <div className="max-w-7xl mx-auto w-full px-6 flex items-center justify-between gap-8">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0 cursor-pointer">
            <div className="w-10 h-10 bg-linear-to-br from-vert to-noir rounded-xl flex items-center justify-center text-or border-2 border-or shadow-sm">
              <Landmark size={20} />
            </div>
            <div className="text-left">
              <div className="font-poppins font-black text-sm text-noir leading-tight">Collectif Chalonnais</div>
              <div className="font-raleway text-xs text-champagne font-semibold tracking-wide">06 · Journal Municipal</div>
            </div>
          </Link>

          {/* Navigation Desktop */}
          <ul className="hidden md:flex items-center gap-1 list-none">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`font-montserrat font-semibold text-sm px-4 py-2 rounded-lg transition-all hover:bg-or/10 hover:text-vert ${
                      isActive ? "text-vert bg-or/10" : "text-noir"
                    }`}
                  >
                    {link.name}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Côté Droit : Auth & Menu Mobile */}
          <div className="flex items-center gap-3 shrink-0">
            {!user ? (
              <Button 
                onClick={() => setIsAuthModalOpen(true)} 
                className="hidden md:flex items-center gap-2 bg-noir text-blanc font-montserrat font-bold text-sm px-5 py-5 rounded-xl transition-all hover:bg-vert hover:-translate-y-px hover:shadow-lg"
              >
                <User size={16} /> Connexion
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="hidden md:flex w-11 h-11 rounded-full bg-linear-to-br from-vert to-noir border-2 border-or items-center justify-center text-or transition-all hover:scale-105 hover:shadow-or/30 hover:shadow-md outline-none">
                    <User size={20} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-55 bg-blanc border-champagne/40 rounded-2xl p-2 shadow-2xl animate-slide-up">
                  <div className="px-3 py-3 border-b border-champagne/25 mb-1">
                    <div className="font-montserrat font-bold text-sm text-noir">{user.name}</div>
                    <div className="font-montserrat text-xs text-champagne mt-0.5">{user.email}</div>
                    {isAdmin && (
                      <span className="mt-1.5 inline-block bg-or text-noir font-poppins font-black text-xs px-2.5 py-0.5 rounded-full">Admin</span>
                    )}
                  </div>
                  <DropdownMenuItem asChild className="cursor-pointer font-semibold text-noir hover:bg-vert/8 rounded-xl px-3 py-2.5 mt-1 focus:bg-vert/8">
                    <Link href="/profile" className="flex items-center gap-2.5 w-full">
                      <User size={16} /> Mon Profil
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild className="cursor-pointer font-semibold text-noir hover:bg-vert/8 rounded-xl px-3 py-2.5 focus:bg-vert/8">
                      <Link href="/dashboard" className="flex items-center gap-2.5 w-full">
                        <Settings size={16} /> Dashboard Admin
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-champagne/25 my-1" />
                  <DropdownMenuItem 
                    onClick={() => setUser(null)}
                    className="cursor-pointer font-semibold text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl px-3 py-2.5 focus:bg-red-50 focus:text-red-600"
                  >
                    <LogOut size={16} className="mr-2" /> Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Menu Mobile via shadcn Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden flex flex-col gap-1.5 p-2 rounded-lg hover:bg-or/10 h-auto">
                  <Menu size={24} className="text-noir" />
                </Button>
              </SheetTrigger>
              <SheetContent side="top" className="bg-blanc border-b border-champagne/30 pt-20 px-6">
                <SheetHeader className="hidden">
                  <SheetTitle>Menu de navigation</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-2 mt-4">
                  {navLinks.map((link) => (
                    <Link 
                      key={link.href} 
                      href={link.href}
                      className="flex items-center gap-3 w-full text-left font-semibold text-sm text-noir px-4 py-4 rounded-xl hover:bg-or/10 transition-all"
                    >
                      <link.icon size={18} className="text-vert" /> {link.name}
                    </Link>
                  ))}
                  <div className="h-px bg-champagne/30 my-2"></div>
                  {!user ? (
                    <Button 
                      onClick={() => setIsAuthModalOpen(true)} 
                      className="w-full flex justify-start items-center gap-3 bg-noir text-blanc font-montserrat font-bold text-sm px-4 py-6 rounded-xl hover:bg-vert"
                    >
                      <User size={18} /> Connexion
                    </Button>
                  ) : (
                    <>
                      <Link href="/profile" className="flex items-center gap-3 w-full text-left font-semibold text-sm text-noir px-4 py-4 rounded-xl hover:bg-or/10 transition-all">
                        <User size={18} className="text-vert" /> Mon Profil
                      </Link>
                      {isAdmin && (
                        <Link href="/dashboard" className="flex items-center gap-3 w-full text-left font-semibold text-sm text-noir px-4 py-4 rounded-xl hover:bg-or/10 transition-all">
                          <Settings size={18} className="text-vert" /> Dashboard Admin
                        </Link>
                      )}
                      <button 
                        onClick={() => setUser(null)}
                        className="flex items-center gap-3 w-full text-left font-semibold text-sm text-red-500 px-4 py-4 rounded-xl hover:bg-red-50 transition-all"
                      >
                        <LogOut size={18} /> Déconnexion
                      </button>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      {/* La Modale d'Authentification est rendue ici ! */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onLoginSuccess={handleLoginSuccess} 
      />
    </>
  );
}