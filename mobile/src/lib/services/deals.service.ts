import { apiClient } from '@/lib/api';

export type DealCategory = 'billetterie' | 'concours' | 'code_promo' | 'restauration';

export interface BonPlan {
  id: number;
  titre: string;
  description: string;
  categorie: DealCategory;
  partenaire: string;
  valeur: string; // Ex: "-20%", "1 Offert", "Jeu Concours"
  codePromo?: string;
  lienUrl?: string;
  image?: string;
  dateDebut?: string; // Ex: "05 nov. 2026 à 09:00"
  dateFin: string; // Ex: "30 nov. 2026 à 23:59"
  estExclusif?: boolean;
  statut: 'actif' | 'programme' | 'expire' | 'en_attente';
  conditions?: string;
}

export const MOCK_DEALS: BonPlan[] = [
  {
    id: 1,
    titre: '20% sur le Festival des Lumières',
    description: 'Bénéficiez d’un tarif préférentiel sur la billetterie du festival d’automne en réservant avec le code résident.',
    categorie: 'billetterie',
    partenaire: 'Service Culturel Municipal',
    valeur: '-20%',
    codePromo: 'FESTIVAL26',
    lienUrl: 'https://billetterie.culture.fr',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1000&q=80',
    dateDebut: '01 nov. 2026 à 09:00',
    dateFin: '30 nov. 2026 à 23:59',
    estExclusif: true,
    statut: 'actif',
    conditions: 'Valable sur présentation d’un justificatif de domicile ou avec le code promo.',
  },
  {
    id: 2,
    titre: 'Gagnez 2 places pour le Cinéma Capitole',
    description: 'Participez au grand tirage au sort mensuel de la commune et tentez de remporter vos entrées pour le film de votre choix.',
    categorie: 'concours',
    partenaire: 'Cinéma Le Capitole',
    valeur: 'Jeu Concours',
    lienUrl: 'https://cinema-capitole.fr/concours',
    image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1000&q=80',
    dateDebut: '28 oct. 2026 à 08:00',
    dateFin: '15 nov. 2026 à 20:00',
    estExclusif: true,
    statut: 'actif',
    conditions: 'Tirage au sort parmi les résidents inscrits. Résultat par notification.',
  },
  {
    id: 3,
    titre: 'Café gourmand offert dès 15 € d’addition',
    description: 'Les artisans torréfacteurs du centre historique vous accueillent pour une pause détente privilégiée.',
    categorie: 'restauration',
    partenaire: 'Torréfaction Saint-Pierre',
    valeur: '1 Café Offert',
    codePromo: 'COLLECTIF-CAFE',
    image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1000&q=80',
    dateFin: '31 déc. 2026 à 19:00',
    estExclusif: false,
    statut: 'actif',
    conditions: 'Sur présentation de l’application Journal Collectif en caisse.',
  },
  {
    id: 4,
    titre: '1 entrée achetée = 1 entrée offerte à la piscine',
    description: 'Profitez de l’espace aquatique et bien-être municipal avec un proche tous les mercredis et samedis.',
    categorie: 'restauration',
    partenaire: 'Centre Aquatique Municipal',
    valeur: '1 Achetée = 1 Offerte',
    codePromo: 'PASS-NAUTIQUE',
    image: 'https://images.unsplash.com/photo-1576610616656-d3aa5d1f4534?auto=format&fit=crop&w=1000&q=80',
    dateDebut: '01 nov. 2026 à 09:00',
    dateFin: '20 déc. 2026 à 18:00',
    estExclusif: true,
    statut: 'actif',
    conditions: 'Non cumulable avec les abonnements trimestriels.',
  },
  {
    id: 5,
    titre: '15% de réduction chez votre maraîcher bio',
    description: 'Encouragez le circuit court et consommez les légumes de saison récoltés à moins de 15 km de votre commune.',
    categorie: 'code_promo',
    partenaire: 'Les Maraîchers du Val',
    valeur: '-15%',
    codePromo: 'BIO15LOCAL',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1000&q=80',
    dateFin: '10 nov. 2026 à 23:59',
    estExclusif: false,
    statut: 'actif',
    conditions: 'Dès 20 € d’achats en magasin.',
  },
  {
    id: 6,
    titre: 'Tarif réduit sur la saison théâtrale',
    description: 'Découvrez la nouvelle programmation contemporaine à prix préférentiel citoyen.',
    categorie: 'billetterie',
    partenaire: 'Théâtre de la Ville',
    valeur: '-30%',
    codePromo: 'THEATRE-CITOYEN',
    image: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=1000&q=80',
    dateDebut: '15 nov. 2026 à 10:00',
    dateFin: '15 janv. 2027 à 22:30',
    estExclusif: true,
    statut: 'actif',
    conditions: 'Réservations ouvertes en ligne et au guichet.',
  },
];

let localDealsState: BonPlan[] = [...MOCK_DEALS];

export const DealsService = {
  async getDeals(category?: DealCategory | 'all', includeAll = false): Promise<BonPlan[]> {
    try {
      const url = includeAll ? '/bon-plan?all=true' : '/bon-plan';
      const remote = await apiClient<BonPlan[]>(url);
      if (Array.isArray(remote)) {
        localDealsState = remote;
      }
    } catch {
      // Fallback hors-ligne silencieux sur le cache local
    }

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

    // Persistance API NestJS
    apiClient<BonPlan>(`/bon-plan/${id}/toggle`, {
      method: 'PATCH',
    }).catch(() => null);

    return deal;
  },

  async addDeal(deal: Omit<BonPlan, 'id'>): Promise<BonPlan> {
    const tempId = Date.now();
    const newDeal: BonPlan = {
      ...deal,
      id: tempId,
    };
    localDealsState.unshift(newDeal);

    // Persistance API NestJS
    try {
      const saved = await apiClient<BonPlan>('/bon-plan', {
        method: 'POST',
        body: JSON.stringify(deal),
      });
      if (saved && saved.id) {
        newDeal.id = saved.id;
      }
    } catch {
      // Conserve l'ID temporaire si hors-ligne
    }

    return newDeal;
  },

  async deleteDeal(id: number): Promise<void> {
    localDealsState = localDealsState.filter((d) => d.id !== id);

    // Persistance API NestJS
    apiClient(`/bon-plan/${id}`, {
      method: 'DELETE',
    }).catch(() => null);
  },

  async participerConcours(
    id: number,
    participant: { nom: string; email: string; telephone?: string }
  ): Promise<{ message: string }> {
    try {
      return await apiClient<{ message: string }>(`/bon-plan/${id}/participer`, {
        method: 'POST',
        body: JSON.stringify(participant),
      });
    } catch {
      // Fallback local
      return { message: 'Participation bien enregistrée !' };
    }
  },
};
