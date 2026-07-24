"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";

interface AuthUser {
  name: string;
  email: string;
  role: 'admin' | 'user';
}

/**
 * Composant de protection des routes (Guard) pour l'espace d'administration.
 * Vérifie l'authentification et les habilitations de l'utilisateur via le cookie HTTP-Only.
 * Redirige vers la page d'accueil si l'utilisateur n'est pas connecté ou n'a pas le rôle requis.
 * 
 * @param {Object} props - Les propriétés du composant.
 * @param {React.ReactNode} props.children - Les composants enfants à rendre si l'accès est autorisé.
 * @returns {JSX.Element} Les enfants si autorisé, sinon un écran de chargement pendant la vérification.
 */
export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        // L'API va lire le cookie HTTP-Only automatiquement
        const user = await fetchApi<AuthUser>('/v1/auth/me');

        // Vérification stricte du rôle retourné par le backend
        if (user.role !== 'admin') {
          router.push("/");
        } else {
          setIsAuthorized(true);
        }
      } catch {
        // Si erreur 401 (non connecté) ou autre, on éjecte
        router.push("/");
      }
    };

    checkAdminStatus();
  }, [router]);

  if (!isAuthorized) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-blanc">
        <div className="w-12 h-12 border-4 border-champagne/20 border-t-or rounded-full animate-spin"></div>
        <p className="mt-4 font-montserrat font-bold text-sm text-champagne uppercase tracking-widest">
          Vérification des habilitations...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}