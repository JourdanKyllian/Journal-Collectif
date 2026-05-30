"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Newspaper, 
  Search, 
  Bell, 
  Users, 
  Settings, 
  ArrowLeft 
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const menuItems = [
    { name: "Vue d'ensemble", href: "/dashboard", icon: LayoutDashboard },
    { name: "Articles", href: "/dashboard/articles", icon: Newspaper },
    { name: "Objets perdus", href: "/dashboard/lost", icon: Search },
    { name: "Alertes", href: "/dashboard/alerts", icon: Bell },
    { name: "Utilisateurs", href: "/dashboard/users", icon: Users },
    { name: "Paramètres", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    /* h-screen force le layout à prendre 100% de la fenêtre sans déborder */
    <div className="flex h-screen w-full bg-[#F2EDE4] overflow-hidden">
      
      {/* Sidebar Desktop : h-full assure qu'elle descend jusqu'en bas */}
      <aside className="hidden md:flex w-64 flex-col bg-linear-to-b from-noir to-vert px-4 py-8 shrink-0 h-full border-r border-white/5">
        
        {/* En-tête Sidebar */}
        <div className="px-3 mb-8">
          <div className="text-[10px] font-montserrat font-bold text-or tracking-[0.2em] uppercase opacity-70">
            Administration
          </div>
        </div>
        
        {/* Navigation : flex-1 prend tout l'espace disponible */}
        <nav className="space-y-1.5 flex-1">
          {menuItems.map((item) => {
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
          })}
        </nav>

        {/* Pied de Sidebar */}
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

      {/* Zone de contenu principale : scrollable indépendamment */}
      <main className="flex-1 overflow-y-auto bg-[#F5F2EA] relative">
        {/* Le padding est ici pour que le contenu ne colle pas aux bords */}
        <div className="p-8 md:p-12 min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}