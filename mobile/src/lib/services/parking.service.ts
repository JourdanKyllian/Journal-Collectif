export type ParkingType = 'Souterrain' | 'Surface' | 'Gare' | 'Enclos';

export type AffluenceMediane = 'calme' | 'moderee' | 'forte' | 'saturee';

export interface ParkingSpot {
  id: string;
  name: string;
  type: ParkingType;
  total: number; // Capacité totale maximale
  available: number; // Places libres en temps réel (uniquement pour les parkings avec capteurs)
  hasSensors: boolean; // true = Équipé capteurs IoT (temps réel) | false = Non équipé (affluence médiane)
  affluenceMediane?: AffluenceMediane; // Estimée pour les parkings non équipés
  evSpots: number;
  freeGracePeriod: string;
  distance: string;
  isActive: boolean; // En service / visible des visiteurs
  statusNote?: string;
  address?: string;
  googleMapsUrl?: string;
}

export const INITIAL_PARKINGS: ParkingSpot[] = [
  {
    id: 'p1',
    name: 'Parking Hôtel de Ville',
    type: 'Souterrain',
    available: 168,
    total: 220,
    evSpots: 6,
    freeGracePeriod: '30 min gratuites',
    distance: '250 m',
    hasSensors: true,
    isActive: true,
    statusNote: 'Capteurs connectés • Circulation fluide',
    address: 'Place de la Mairie',
  },
  {
    id: 'p2',
    name: 'Parking Gare & Parvis',
    type: 'Gare',
    available: 48,
    total: 180,
    evSpots: 2,
    freeGracePeriod: '15 min dépose-minute',
    distance: '650 m',
    hasSensors: true,
    isActive: true,
    statusNote: 'Capteurs connectés • Forte affluence pendulaire',
    address: 'Avenue de la Gare',
  },
  {
    id: 'p3',
    name: 'Parking République - Marché',
    type: 'Surface',
    available: 0,
    total: 110,
    evSpots: 4,
    freeGracePeriod: 'Gratuit après 19h',
    distance: '400 m',
    hasSensors: false, // Non équipé de capteurs
    affluenceMediane: 'moderee',
    isActive: true,
    statusNote: 'Affluence habituelle • Marché le samedi',
    address: 'Place de la République',
  },
  {
    id: 'p4',
    name: 'Parking Esplanade des Fêtes',
    type: 'Enclos',
    available: 0,
    total: 90,
    evSpots: 0,
    freeGracePeriod: 'Gratuit',
    distance: '850 m',
    hasSensors: false, // Non équipé
    affluenceMediane: 'calme',
    isActive: false,
    statusNote: 'Fermé temporairement (travaux)',
    address: 'Esplanade du Stade',
  },
];

let localParkings: ParkingSpot[] = [...INITIAL_PARKINGS];
type ParkingListener = (parkings: ParkingSpot[]) => void;
const listeners: Set<ParkingListener> = new Set();

function notifyListeners() {
  const snapshot = [...localParkings];
  listeners.forEach((listener) => listener(snapshot));
}

export const ParkingService = {
  getParkings(): ParkingSpot[] {
    return [...localParkings];
  },

  subscribe(listener: ParkingListener): () => void {
    listeners.add(listener);
    listener([...localParkings]);
    return () => {
      listeners.delete(listener);
    };
  },

  // Définir l'affluence médiane pour un parking non équipé
  setAffluenceMediane(id: string, affluence: AffluenceMediane): ParkingSpot | null {
    const p = localParkings.find((item) => item.id === id);
    if (!p) return null;
    p.affluenceMediane = affluence;
    notifyListeners();
    return { ...p };
  },

  // Basculer l'état Actif / Inactif (visible des visiteurs ou non)
  toggleActive(id: string): ParkingSpot | null {
    const p = localParkings.find((item) => item.id === id);
    if (!p) return null;
    p.isActive = !p.isActive;
    notifyListeners();
    return { ...p };
  },

  // Basculer l'équipement capteurs (Capteurs IoT vs Non équipé)
  toggleSensors(id: string): ParkingSpot | null {
    const p = localParkings.find((item) => item.id === id);
    if (!p) return null;
    p.hasSensors = !p.hasSensors;
    if (!p.hasSensors && !p.affluenceMediane) {
      p.affluenceMediane = 'moderee';
    }
    notifyListeners();
    return { ...p };
  },

  // Mise à jour complète ou partielle des caractéristiques
  updateParking(id: string, updates: Partial<ParkingSpot>): ParkingSpot | null {
    const index = localParkings.findIndex((item) => item.id === id);
    if (index === -1) return null;
    localParkings[index] = {
      ...localParkings[index],
      ...updates,
      available: updates.hasSensors
        ? Math.min(
            updates.available !== undefined ? updates.available : localParkings[index].available,
            updates.total !== undefined ? updates.total : localParkings[index].total
          )
        : 0,
    };
    notifyListeners();
    return { ...localParkings[index] };
  },

  // Création d'un nouveau parking
  addParking(newSpot: Omit<ParkingSpot, 'id'>): ParkingSpot {
    const created: ParkingSpot = {
      ...newSpot,
      id: `p_${Date.now()}`,
      available: newSpot.hasSensors ? (newSpot.available ?? newSpot.total) : 0,
      affluenceMediane: newSpot.hasSensors ? undefined : (newSpot.affluenceMediane ?? 'moderee'),
    };
    localParkings.push(created);
    notifyListeners();
    return created;
  },

  // Suppression d'un parking
  deleteParking(id: string): void {
    localParkings = localParkings.filter((item) => item.id !== id);
    notifyListeners();
  },
};
