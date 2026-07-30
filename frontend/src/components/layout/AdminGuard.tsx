"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";

/**
 * Interface décrivant les données de l'utilisateur renvoyées par l'API.
 * Le rôle peut être une simple chaîne de caractères ou un objet relationnel TypeORM.
 */
interface AuthUser {
  name: string;
  email: string;
  role: string | { libelle: string };
}

/**
 * Interface des propriétés attendues par le composant AdminGuard.
 */
interface AdminGuardProps {
  /** Les composants enfants à afficher si l'utilisateur est autorisé */
  children: React.ReactNode;
  /** La liste des rôles autorisés à accéder à la route (ex: ['super_admin', 'admin']) */
  allowedRoles?: string[];
}

/**
 * Composant de protection des routes d'administration (Guard).
 * Interroge le backend pour vérifier l'authentification et les habilitations de l'utilisateur.
 * Bloque le rendu des composants enfants tant que l'autorisation n'est pas confirmée.
 * 
 * @param {AdminGuardProps} props - Les propriétés du composant.
 * @returns {JSX.Element} Le contenu protégé ou un indicateur de chargement.
 */
export default function AdminGuard({ 
  children, 
  allowedRoles = ['super_admin', 'admin', 'redacteur'] 
}: AdminGuardProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  // On transforme le tableau en chaîne de caractères pour l'injecter proprement dans les dépendances du useEffect
  const rolesStr = allowedRoles.join(',');

  useEffect(() => {
    /**
     * Vérifie le statut et le rôle de l'utilisateur actuel via l'API.
     * Applique une redirection de sécurité en cas de droits insuffisants.
     */
    const checkAdminStatus = async () => {
      try {
        // Appel à l'API pour récupérer l'identité de la session en cours
        const user = await fetchApi<AuthUser>('/v1/auth/me');
        
        // On normalise les rôles cibles en minuscules
        const targetRoles = rolesStr.toLowerCase().split(',');
        
        // Extraction sécurisée du rôle (qu'il soit une string ou un objet) et normalisation
        const roleStr = typeof user.role === 'string' 
          ? user.role 
          : user.role?.libelle || '';
        const userRole = roleStr.toLowerCase();

        // Vérification stricte des droits d'accès
        if (!targetRoles.includes(userRole)) {
          // Si l'utilisateur est sur une sous-page du dashboard sans les droits, retour à l'accueil du dashboard
          if (window.location.pathname !== '/dashboard' && window.location.pathname.startsWith('/dashboard')) {
             router.push("/dashboard");
          } else {
             // Redirection vers le site public si l'accès global à l'administration est interdit
             router.push("/");
          }
        } else {
          // Validation accordée, on déclenche l'affichage des enfants
          setIsAuthorized(true);
        }
      } catch {
        // En cas d'erreur réseau, de non-authentification ou de token invalide
        router.push("/");
      }
    };

    checkAdminStatus();
  }, [router, rolesStr]);

  // Écran d'attente (Loader) affiché pendant la résolution de la promesse réseau
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

  // Rendu du composant encapsulé si toutes les vérifications sont au vert
  return <>{children}</>;
}
