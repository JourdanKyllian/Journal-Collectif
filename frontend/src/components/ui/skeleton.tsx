import { cn } from "@/lib/utils"

/**
 * Composant de base générant une animation de pulsation pour simuler un chargement.
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("animate-pulse rounded-md bg-champagne/20", className)} {...props} />
  )
}

/**
 * Génère un tableau de composants Skeleton pour faciliter l'affichage en grille.
 * 
 * @param {number} count - Nombre d'éléments factices à générer.
 * @param {React.ElementType} Component - Le composant Skeleton spécifique à instancier.
 */
function SkeletonGrid({ count = 3, Component }: { count?: number, Component: React.ElementType }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Component key={i} />
      ))}
    </>
  );
}

/**
 * Template de chargement standard pour les cartes d'articles.
 */
function SkeletonArticleCard() {
  return (
    <div className="bg-blanc border border-champagne/30 rounded-2xl overflow-hidden shadow-sm">
      <Skeleton className="h-44 w-full rounded-none" />
      <div className="p-5 space-y-4">
        <Skeleton className="h-5 w-3/4" />
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-5/6" />
        </div>
        <div className="flex justify-between items-center pt-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}

/**
 * Template de chargement standard pour les lignes de tableaux administratifs.
 */
function SkeletonTableRow() {
  return (
    <div className="p-4 border-b border-champagne/10">
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

export { Skeleton, SkeletonGrid, SkeletonArticleCard, SkeletonTableRow }
