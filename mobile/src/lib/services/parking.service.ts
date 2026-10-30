import { apiClient } from '@/lib/api';

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
    id: '1',
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
    id: '2',
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
    id: '3',
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
    id: '4',
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

// Synchronisation initiale en arrière-plan avec le backend NestJS
let hasAttemptedInitialFetch = false;

async function syncWithBackend(): Promise<void> {
  try {
    const remote = await apiClient<
      (Omit<ParkingSpot, 'id'> & { id: number })[]
    >('/parking?all=true');

    if (Array.isArray(remote)) {
      localParkings = remote.map((item) => ({
        ...item,
        id: String(item.id),
      }));
      notifyListeners();
    }
  } catch {
    // Mode déconnecté : fallback silencieux sur le cache local
  }
}

export const ParkingService = {
  async refresh(): Promise<ParkingSpot[]> {
    await syncWithBackend();
    return [...localParkings];
  },

  getParkings(): ParkingSpot[] {
    if (!hasAttemptedInitialFetch) {
      hasAttemptedInitialFetch = true;
      syncWithBackend();
    }
    return [...localParkings];
  },

  subscribe(listener: ParkingListener): () => void {
    listeners.add(listener);
    listener([...localParkings]);
    if (!hasAttemptedInitialFetch) {
      hasAttemptedInitialFetch = true;
      syncWithBackend();
    }
    return () => {
      listeners.delete(listener);
    };
  },

  async setAffluenceMediane(id: string, affluence: AffluenceMediane): Promise<ParkingSpot | null> {
    const p = localParkings.find((item) => item.id === id);
    if (!p) return null;
    p.affluenceMediane = affluence;
    notifyListeners();

    // Persistance API NestJS
    const numericId = parseInt(id, 10);
    if (!isNaN(numericId)) {
      apiClient(`/parking/${numericId}/affluence`, {
        method: 'PATCH',
        body: JSON.stringify({ affluenceMediane: affluence }),
      }).catch(() => null);
    }

    return { ...p };
  },

  async toggleActive(id: string): Promise<ParkingSpot | null> {
    const p = localParkings.find((item) => item.id === id);
    if (!p) return null;
    p.isActive = !p.isActive;
    notifyListeners();

    // Persistance API NestJS
    const numericId = parseInt(id, 10);
    if (!isNaN(numericId)) {
      apiClient(`/parking/${numericId}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: p.isActive }),
      }).catch(() => null);
    }

    return { ...p };
  },

  async updateParking(id: string, updates: Partial<ParkingSpot>): Promise<ParkingSpot | null> {
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

    // Persistance API NestJS
    const numericId = parseInt(id, 10);
    if (!isNaN(numericId)) {
      apiClient(`/parking/${numericId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }).catch(() => null);
    }

    return { ...localParkings[index] };
  },

  async addParking(newSpot: Omit<ParkingSpot, 'id'>): Promise<ParkingSpot> {
    const tempId = `p_${Date.now()}`;
    const created: ParkingSpot = {
      ...newSpot,
      id: tempId,
      available: newSpot.hasSensors ? (newSpot.available ?? newSpot.total) : 0,
      affluenceMediane: newSpot.hasSensors ? undefined : (newSpot.affluenceMediane ?? 'moderee'),
    };
    localParkings.push(created);
    notifyListeners();

    // Persistance API NestJS
    try {
      const saved = await apiClient<Omit<ParkingSpot, 'id'> & { id: number }>('/parking', {
        method: 'POST',
        body: JSON.stringify(newSpot),
      });
      if (saved && saved.id) {
        created.id = String(saved.id);
        notifyListeners();
      }
    } catch {
      // Conserve l'ID temporaire si hors-ligne
    }

    return created;
  },

  async deleteParking(id: string): Promise<void> {
    localParkings = localParkings.filter((item) => item.id !== id);
    notifyListeners();

    // Persistance API NestJS
    const numericId = parseInt(id, 10);
    if (!isNaN(numericId)) {
      apiClient(`/parking/${numericId}`, {
        method: 'DELETE',
      }).catch(() => null);
    }
  },
};
