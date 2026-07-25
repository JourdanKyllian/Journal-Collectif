"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { 
  LayoutDashboard, Newspaper, Search, Bell, 
  Users, Settings, ArrowLeft 
} from "lucide-react";
import AdminGuard from "@/components/layout/AdminGuard";
import { fetchApi } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    fetchApi<{ role: string }>('/v1/auth/me')
      .then(user => setRole(user.role))
      .catch(() => {});
  }, []);

  // Définition centralisée des droits d'accès au menu
  const allMenuItems = [
    { name: "Vue d'ensemble", href: "/dashboard", icon: LayoutDashboard, roles: ['super_admin', 'admin', 'redacteur'] },
    { name: "Articles", href: "/dashboard/articles", icon: Newspaper, roles: ['super_admin', 'admin', 'redacteur'] },
    { name: "Objets perdus", href: "/dashboard/lost", icon: Search, roles: ['super_admin', 'admin'] },
    { name: "Alertes", href: "/dashboard/alerts", icon: Bell, roles: ['super_admin', 'admin', 'redacteur'] },
    { name: "Utilisateurs", href: "/dashboard/users", icon: Users, roles: ['super_admin', 'admin'] },
    { name: "Paramètres", href: "/dashboard/settings", icon: Settings, roles: ['super_admin'] },
  ];

  const menuItems = allMenuItems.filter(item => role && item.roles.includes(role));

  return (
    <AdminGuard>
      <div className="flex h-screen w-full bg-[#F2EDE4] overflow-hidden">
        
        <aside className="hidden md:flex w-64 flex-col bg-linear-to-b from-noir to-vert px-4 py-8 shrink-0 h-full border-r border-white/5">
          <div className="px-3 mb-8">
            <div className="text-[10px] font-montserrat font-bold text-or tracking-[0.2em] uppercase opacity-70">
              Administration
            </div>
          </div>
          
          <nav className="space-y-1.5 flex-1">
            {!role ? (
              // Animation fluide d'attente
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-11 w-full rounded-xl bg-white/5" />
                ))}
              </div>
            ) : (
              menuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-montserrat font-bold transition-all duration-200 ${
                      isActive 
                        ? "bg-or text-noir shadow-lg shadow-or/10" 
                        : "text-blanc/60 hover:text-blanc hover:bg-white/5"
                    }`}
                  >
                    <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                    {item.name}
                  </Link>
                );
              })
            )}
          </nav>

          <div className="pt-6 border-t border-white/10 mt-auto">
            <Link 
              href="/" 
              className="flex items-center gap-2 px-4 py-3 text-or font-montserrat font-bold text-sm hover:bg-or/10 rounded-xl transition-all group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
              Retour au site
            </Link>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto bg-[#F5F2EA] relative">
          <div className="p-8 md:p-12 min-h-full">
            {children}
          </div>
        </main>
      </div>
    </AdminGuard>
  );
}
