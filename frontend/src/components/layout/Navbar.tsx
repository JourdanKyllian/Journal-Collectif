"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Landmark, User, Settings, LogOut, Menu, LayoutGrid, Search, Home, Book } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
  SheetClose,
} from "@/components/ui/sheet";
import AuthModal from "@/components/features/AuthModal";
import { fetchApi } from "@/lib/api";

interface AuthUser {
  name: string;
  email: string;
  role: string;
}

interface NavbarSettings {
  nom_journal: string;
  type_journal: string;
}

export default function Navbar() {
  const pathname = usePathname();
  
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  
  // État pour contrôler l'ouverture/fermeture du menu mobile
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  // État initialisé à NULL sans valeur par défaut
  const [settings, setSettings] = useState<NavbarSettings | null>(null);
  
  useEffect(() => {
    Promise.all([
      fetchApi<AuthUser>('/v1/auth/me').catch(() => null),
      fetchApi<NavbarSettings>('/v1/settings').catch(() => ({ nom_journal: "Collectif", type_journal: "Journal" }))
    ]).then(([userData, settingsData]) => {
      setUser(userData);
      setSettings(settingsData);
      setIsCheckingSession(false);
    });
  }, []);
  
  const userRoleLower = user?.role ? user.role.toLowerCase() : '';
  const hasDashboardAccess = ['super_admin', 'admin', 'redacteur'].includes(userRoleLower);

  const getRoleBadge = (role: string) => {
    const r = role.toLowerCase();
    if (r === 'super_admin') return 'Gérant';
    if (r === 'admin') return 'Admin';
    if (r === 'redacteur') return 'Rédacteur';
    return '';
  };

  const handleLoginSuccess = (userData: AuthUser) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    try {
      await fetchApi('/v1/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error("Erreur lors de la déconnexion", error);
    } finally {
      setUser(null);
    }
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
          
          {/* LOGO DYNAMIQUE OU SKELETON */}
          <Link href="/" className="flex items-center gap-3 shrink-0 cursor-pointer" aria-label="Accueil">
            <div className="w-10 h-10 bg-linear-to-br from-vert to-noir rounded-xl flex items-center justify-center text-or border-2 border-or shadow-sm hover:scale-105 transition-transform shrink-0">
              <Landmark size={20} />
            </div>
            
            {settings ? (
              <div className="text-left hidden sm:block">
                <div className="font-poppins font-black text-sm text-noir leading-tight">{settings.nom_journal}</div>
                <div className="font-raleway text-xs text-champagne font-semibold tracking-wide">· {settings.type_journal}</div>
              </div>
            ) : (
              <div className="text-left hidden sm:block space-y-1.5">
                <Skeleton className="h-4 w-32 bg-champagne/20" />
                <Skeleton className="h-3 w-24 bg-champagne/20" />
              </div>
            )}
          </Link>

          {/* LIENS DE NAVIGATION (DESKTOP) */}
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

          {/* ACTIONS UTILISATEUR (DROITE) */}
          <div className="flex items-center gap-3 shrink-0">
            {isCheckingSession ? (
              <Skeleton className="hidden md:block w-35 h-13 rounded-xl bg-champagne/20" />
            ) : !user ? (
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
                    {hasDashboardAccess && (
                      <span className="mt-1.5 inline-block bg-or text-noir font-poppins font-black text-xs px-2.5 py-0.5 rounded-full">
                        {getRoleBadge(user.role)}
                      </span>
                    )}
                  </div>
                  <DropdownMenuItem asChild className="cursor-pointer font-semibold text-noir hover:bg-vert/8 rounded-xl px-3 py-2.5 mt-1 focus:bg-vert/8">
                    <Link href="/profile" className="flex items-center gap-2.5 w-full">
                      <User size={16} /> Mon Profil
                    </Link>
                  </DropdownMenuItem>
                  {hasDashboardAccess && (
                    <DropdownMenuItem asChild className="cursor-pointer font-semibold text-noir hover:bg-vert/8 rounded-xl px-3 py-2.5 focus:bg-vert/8">
                      <Link href="/dashboard" className="flex items-center gap-2.5 w-full">
                        <Settings size={16} /> Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-champagne/25 my-1" />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="cursor-pointer font-semibold text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl px-3 py-2.5 focus:bg-red-50 focus:text-red-600"
                  >
                    <LogOut size={16} className="mr-2" /> Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* MENU MOBILE (SHEET) */}
            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
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
                    <SheetClose asChild key={link.href}>
                      <Link 
                        href={link.href}
                        className="flex items-center gap-3 w-full text-left font-semibold text-sm text-noir px-4 py-4 rounded-xl hover:bg-or/10 transition-all"
                      >
                        <link.icon size={18} className="text-vert" /> {link.name}
                      </Link>
                    </SheetClose>
                  ))}
                  <div className="h-px bg-champagne/30 my-2"></div>
                  
                  {isCheckingSession ? (
                    <Skeleton className="w-full h-14 rounded-xl" />
                  ) : !user ? (
                    <SheetClose asChild>
                      <Button 
                        onClick={() => setIsAuthModalOpen(true)} 
                        className="w-full flex justify-start items-center gap-3 bg-noir text-blanc font-montserrat font-bold text-sm px-4 py-6 rounded-xl hover:bg-vert"
                      >
                        <User size={18} /> Connexion
                      </Button>
                    </SheetClose>
                  ) : (
                    <>
                      <SheetClose asChild>
                        <Link href="/profile" className="flex items-center gap-3 w-full text-left font-semibold text-sm text-noir px-4 py-4 rounded-xl hover:bg-or/10 transition-all">
                          <User size={18} className="text-vert" /> Mon Profil
                        </Link>
                      </SheetClose>
                      {hasDashboardAccess && (
                        <SheetClose asChild>
                          <Link href="/dashboard" className="flex items-center gap-3 w-full text-left font-semibold text-sm text-noir px-4 py-4 rounded-xl hover:bg-or/10 transition-all">
                            <Settings size={18} className="text-vert" /> Dashboard
                          </Link>
                        </SheetClose>
                      )}
                      <SheetClose asChild>
                        <button 
                          onClick={handleLogout}
                          className="flex items-center gap-3 w-full text-left font-semibold text-sm text-red-500 px-4 py-4 rounded-xl hover:bg-red-50 transition-all"
                        >
                          <LogOut size={18} /> Déconnexion
                        </button>
                      </SheetClose>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onLoginSuccess={handleLoginSuccess} 
      />
    </>
  );
}
