export type DealCategory = 'billetterie' | 'concours' | 'code_promo' | 'restauration';

export interface BonPlan {
  id: number;
  titre: string;
  description: string;
  categorie: DealCategory;
  partenaire: string;
  valeur: string; // Ex: "-20%", "2 places à gagner", "1 offert"
  codePromo?: string;
  lienUrl?: string;
  image?: string;
  dateFin: string;
  estExclusif?: boolean;
  statut: 'actif' | 'expire' | 'en_attente';
  conditions?: string;
}

export const MOCK_DEALS: BonPlan[] = [
  {
    id: 1,
    titre: 'Festival des Arts & Musiques',
    description: 'Bénéficiez du tarif riverain exclusif sur tous les concerts sous le chapiteau.',
    categorie: 'billetterie',
    partenaire: 'Office Culturel Municipal',
    valeur: '-25%',
    codePromo: 'FESTIVAL26',
    lienUrl: 'https://billetterie.culture.fr',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1000&q=80',
    dateFin: '30 nov. 2026',
    estExclusif: true,
    statut: 'actif',
    conditions: 'Valable sur présentation d’un justificatif de domicile ou avec le code promo.',
  },
  {
    id: 2,
    titre: 'Grand Jeu : Gagnez vos places de cinéma VIP',
    description: 'Tentez de remporter 2 fauteuils VIP pour la grande avant-première du mois.',
    categorie: 'concours',
    partenaire: 'Cinéma Le Capitole',
    valeur: 'Jeu Concours',
    lienUrl: 'https://cinema-capitole.fr/concours',
    image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1000&q=80',
    dateFin: '15 nov. 2026',
    estExclusif: true,
    statut: 'actif',
    conditions: 'Tirage au sort parmi les résidents inscrits. Résultat par notification.',
  },
  {
    id: 3,
    titre: 'Brûlerie Centrale & Café Solidaire',
    description: 'Un expresso ou thé bio de dégustation offert pour toute commande déjeuner.',
    categorie: 'restauration',
    partenaire: 'La Brûlerie Centrale',
    valeur: '1 Café Offert',
    codePromo: 'COLLECTIF-CAFE',
    image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1000&q=80',
    dateFin: '31 déc. 2026',
    estExclusif: false,
    statut: 'actif',
    conditions: 'Sur présentation de l’application Journal Collectif en caisse.',
  },
  {
    id: 4,
    titre: 'Espace Aquatique & Piscine Olympique',
    description: 'Une entrée piscine achetée = la deuxième offerte le mercredi et samedi matin.',
    categorie: 'billetterie',
    partenaire: 'Centre Nautique Municipal',
    valeur: '1 Achetée = 1 Offerte',
    codePromo: 'PASS-NAUTIQUE',
    image: 'https://images.unsplash.com/photo-1576610616656-d3aa5d1f4534?auto=format&fit=crop&w=1000&q=80',
    dateFin: '20 déc. 2026',
    estExclusif: true,
    statut: 'actif',
    conditions: 'Non cumulable avec les abonnements trimestriels.',
  },
  {
    id: 5,
    titre: 'Épicerie Vrac & Produits du Terroir',
    description: 'Remise immédiate sur votre panier de fruits, légumes et produits locaux.',
    categorie: 'code_promo',
    partenaire: 'Le Marché Éco-Citoyen',
    valeur: '-15%',
    codePromo: 'BIO15LOCAL',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1000&q=80',
    dateFin: '10 nov. 2026',
    estExclusif: false,
    statut: 'actif',
    conditions: 'Dès 20 € d’achats en magasin.',
  },
  {
    id: 6,
    titre: 'Saison Théâtrale d’Hiver',
    description: 'Tarif réduit garanti sur toutes les pièces d’auteurs de la saison.',
    categorie: 'billetterie',
    partenaire: 'Théâtre de la Ville',
    valeur: '-30%',
    codePromo: 'THEATRE-CITOYEN',
    image: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=1000&q=80',
    dateFin: '15 janv. 2027',
    estExclusif: true,
    statut: 'actif',
    conditions: 'Réservations ouvertes en ligne et au guichet.',
  },
];

let localDealsState: BonPlan[] = [...MOCK_DEALS];

export const DealsService = {
  async getDeals(category?: DealCategory | 'all'): Promise<BonPlan[]> {
    if (!category || category === 'all') {
      return [...localDealsState];
    }
    return localDealsState.filter((d) => d.categorie === category);
  },

  async toggleDealStatus(id: number): Promise<BonPlan | undefined> {
    const deal = localDealsState.find((d) => d.id === id);
    if (deal) {
      deal.statut = deal.statut === 'actif' ? 'expire' : 'actif';
    }
    return deal;
  },

  async addDeal(deal: Omit<BonPlan, 'id'>): Promise<BonPlan> {
    const newDeal: BonPlan = {
      ...deal,
      id: Date.now(),
    };
    localDealsState.unshift(newDeal);
    return newDeal;
  },

  async deleteDeal(id: number): Promise<void> {
    localDealsState = localDealsState.filter((d) => d.id !== id);
  },
};
