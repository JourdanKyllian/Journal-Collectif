import {
  Palette,
  Trophy,
  HardHat,
  Siren,
  PartyPopper,
  Building2,
  BookOpen,
  Megaphone,
  LucideIcon,
} from "lucide-react";

/**
 * Transforme une chaîne de caractères en slug URL-friendly.
 *
 * @param {string} text - Le texte brut à transformer.
 * @returns {string} Le slug généré, sans accents ni caractères spéciaux.
 */
export const generateSlug = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
};

export interface CategoryUI {
  slug: string;
  icon: LucideIcon;
  gradient: string;
}

/**
 * Résout les propriétés visuelles (icône, couleur, slug) en fonction du libellé d'une catégorie.
 *
 * @param {string} categoryName - Le libellé brut de la catégorie.
 * @returns {CategoryUI} Un objet contenant les classes CSS, l'icône et le slug associés.
 */
export const getCategoryUI = (categoryName: string): CategoryUI => {
  const normalized = categoryName?.toLowerCase().trim() || "";

  if (normalized.includes("culture")) return { slug: "culture", icon: Palette, gradient: "bg-linear-to-br from-vert to-noir" };
  if (normalized.includes("travaux")) return { slug: "travaux", icon: HardHat, gradient: "bg-linear-to-br from-vert/80 to-vert" };
  if (normalized.includes("sport")) return { slug: "sport", icon: Trophy, gradient: "bg-linear-to-br from-noir to-vert" };
  if (normalized.includes("annonce")) return { slug: "annonces", icon: Megaphone, gradient: "bg-linear-to-br from-noir/90 to-vert/60" };
  if (normalized.includes("divers") || normalized.includes("alerte")) return { slug: "faits-divers", icon: Siren, gradient: "bg-linear-to-br from-vert to-noir/90" };
  if (normalized.includes("evénement") || normalized.includes("evenement")) return { slug: "evenements", icon: PartyPopper, gradient: "bg-linear-to-br from-noir to-vert/80" };
  if (normalized.includes("politique") || normalized.includes("mairie")) return { slug: "politique", icon: Building2, gradient: "bg-linear-to-br from-vert/70 to-noir" };

  return { slug: generateSlug(categoryName), icon: BookOpen, gradient: "bg-linear-to-br from-champagne/80 to-noir" };
};

/**
 * Attribue un dégradé de fond basé sur l'index d'un élément dans une liste.
 * Utilisé principalement pour varier l'affichage des cartes d'articles.
 *
 * @param {number} index - L'index de l'élément dans son tableau.
 * @returns {string} La classe utilitaire Tailwind correspondante.
 */
export const getGradientClassByIndex = (index: number): string => {
  const gradients = [
    "bg-linear-to-br from-vert to-noir",
    "bg-linear-to-br from-vert/80 to-vert",
    "bg-linear-to-br from-noir to-vert",
    "bg-linear-to-br from-noir/90 to-vert/60",
    "bg-linear-to-br from-vert to-noir/90",
    "bg-linear-to-br from-noir to-vert/80",
  ];
  return gradients[index % gradients.length];
};

/**
 * Estime le temps de lecture d'un contenu textuel (basé sur 225 mots par minute).
 *
 * @param {string} text - Le contenu brut de l'article.
 * @returns {string} Le temps de lecture estimé formaté.
 */
export const calculateReadTime = (text: string): string => {
  if (!text) return "1 min";
  const wordCount = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(wordCount / 225);
  return `${minutes} min`;
};

/**
 * Formate une date ISO ou un objet Date au format standard français.
 *
 * @param {string | Date | null | undefined} dateValue - La valeur temporelle à formater.
 * @returns {string} La date localisée (ex: 15 fév. 2026).
 */
export const formatDateToFrench = (dateValue: string | Date | null | undefined): string => {
  if (!dateValue) return "Date inconnue";
  const date = new Date(dateValue);
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
};
