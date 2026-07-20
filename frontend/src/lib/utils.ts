import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Fusionne et combine des classes CSS conditionnelles avec Tailwind CSS.
 * Utilise `clsx` pour la gestion conditionnelle et `tailwind-merge` pour résoudre les conflits de classes.
 *
 * @param {...ClassValue} inputs - Les classes ou objets de classes à fusionner.
 * @returns {string} La chaîne de classes CSS fusionnée et optimisée.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}