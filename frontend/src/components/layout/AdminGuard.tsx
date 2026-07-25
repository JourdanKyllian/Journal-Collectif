"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";

interface AuthUser {
  name: string;
  email: string;
  role: string;
}

interface AdminGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

/**
 * Composant de protection des routes d'administration (Guard) .
 * Valide les habilitations de l'utilisateur connecté .
 */
export default function AdminGuard({ 
  children, 
  allowedRoles = ['super_admin', 'admin', 'redacteur'] 
}: AdminGuardProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  const rolesStr = allowedRoles.join(',');

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const user = await fetchApi<AuthUser>('/v1/auth/me');
        const targetRoles = rolesStr.toLowerCase().split(',');
        const userRole = user.role ? user.role.toLowerCase() : '';

        if (!targetRoles.includes(userRole)) {
          if (window.location.pathname !== '/dashboard' && window.location.pathname.startsWith('/dashboard')) {
             router.push("/dashboard");
          } else {
             router.push("/");
          }
        } else {
          setIsAuthorized(true);
        }
      } catch {
        router.push("/");
      }
    };

    checkAdminStatus();
  }, [router, rolesStr]);

  if (!isAuthorized) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-transparent min-h-[40vh]">
        <div className="w-10 h-10 border-4 border-champagne/20 border-t-or rounded-full animate-spin"></div>
        <p className="mt-4 font-montserrat font-bold text-xs text-champagne uppercase tracking-widest">
          Vérification des accès...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
