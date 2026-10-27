export interface MobileArticleCredit {
  role: string;
  name: string;
  anonymous?: boolean;
}

export interface MobileArticle {
  id: number;
  titre: string;
  excerpt: string;
  contenu: string;
  image_couverture: string | null;
  published_at: string;
  readTime: string;
  categorie: {
    id: number;
    libelle: string;
    icon: string;
  };
  credits: MobileArticleCredit[];
}

export interface MobileAlert {
  id: number;
  type: 'urgent' | 'info' | 'event';
  title: string;
  message: string;
}

export interface MobileLostObject {
  id: number;
  reference: string;
  title: string;
  location: string;
  date: string;
  status: 'perdu' | 'trouve' | 'reclame';
  image_url?: string;
}

export const MOCK_ALERTS: MobileAlert[] = [
  {
    id: 1,
    type: 'urgent',
    title: 'Fermeture du centre-ville',
    message: 'Circulation interrompue Place Foch ce samedi de 8h à 18h pour travaux de voirie.',
  },
];

export const MOCK_CATEGORIES = [
  { id: 0, libelle: 'Tous', icon: '✨', description: 'Toutes les actualités' },
  { id: 1, libelle: 'Vie Locale', icon: '🏘️', description: 'Ce qui se passe près de chez vous au quotidien.' },
  { id: 2, libelle: 'Culture', icon: '🎭', description: 'Actualités culturelles de la ville et ses environs.' },
  { id: 3, libelle: 'Environnement', icon: '🌱', description: 'Écologie, nature et développement durable.' },
  { id: 4, libelle: 'Travaux', icon: '🏗️', description: 'Aménagements urbains et voirie.' },
];

export const MOCK_ARTICLES: MobileArticle[] = [
  {
    id: 1,
    titre: 'Lancement du nouveau marché bio au centre-ville',
    excerpt: "Le centre-ville s'anime avec l'arrivée d'un nouveau marché bio tous les samedis matin.",
    contenu:
      "Le centre-ville s'anime avec l'arrivée d'un nouveau marché bio tous les samedis matin. Producteurs locaux et habitants se sont réunis en nombre pour cette première édition sous les halles.\n\nPlus de vingt maraîchers, apiculteurs et artisans de la région proposent désormais des produits en circuit court. La municipalité souhaite ainsi dynamiser le commerce de proximité tout en valorisant l'agriculture biologique.",
    image_couverture: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1000&q=80',
    published_at: '24 oct. 2026',
    readTime: '2 min',
    categorie: { id: 1, libelle: 'Vie Locale', icon: '🏘️' },
    credits: [
      { role: 'Auteur', name: 'Citoyen Engagé' },
      { role: 'Éditeur', name: 'Plume Alerte' },
    ],
  },
  {
    id: 2,
    titre: "Nouveau plan vélo : les pistes cyclables s'agrandissent",
    excerpt: 'Création de 5 kilomètres de pistes cyclables supplémentaires pour sécuriser les mobilités douces.',
    contenu:
      "La municipalité annonce la création de 5 kilomètres de pistes cyclables supplémentaires pour encourager les mobilités douces et sécuriser les déplacements urbains.\n\nLes travaux débuteront le mois prochain sur l'axe principal reliant la gare au campus universitaire, avec une séparation végétalisée complète entre les voies automobiles et la piste bidirectionnelle.",
    image_couverture: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1000&q=80',
    published_at: '22 oct. 2026',
    readTime: '3 min',
    categorie: { id: 3, libelle: 'Environnement', icon: '🌱' },
    credits: [{ role: 'Auteur', name: 'Citoyen Anonyme', anonymous: true }],
  },
  {
    id: 3,
    titre: 'Exposition de peintures modernes à la bibliothèque',
    excerpt: 'Une rétrospective exceptionnelle des œuvres de peintres de la région à découvrir gratuitement.',
    contenu:
      "Une rétrospective exceptionnelle des œuvres de peintres de la région est à découvrir gratuitement tout au long du mois dans le grand hall de la bibliothèque municipale.\n\nDes visites guidées ainsi que des ateliers d'initiation pour les enfants sont organisés chaque mercredi après-midi sur inscription.",
    image_couverture: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1000&q=80',
    published_at: '19 oct. 2026',
    readTime: '2 min',
    categorie: { id: 2, libelle: 'Culture', icon: '🎭' },
    credits: [{ role: 'Auteur', name: 'Directeur Publication' }],
  },
];

export const MOCK_LOST_OBJECTS: MobileLostObject[] = [
  { id: 1, reference: '#OBJ-0042', title: 'Sac à dos noir Nike', location: 'Place du marché', date: '25 oct. 2026', status: 'perdu' },
  { id: 2, reference: '#OBJ-0041', title: 'Trousseau de clés (badge vert)', location: 'Rue de la République', date: '23 oct. 2026', status: 'trouve' },
  { id: 3, reference: '#OBJ-0040', title: 'Lunettes de vue écaille', location: 'Bibliothèque municipale', date: '20 oct. 2026', status: 'reclame' },
];
