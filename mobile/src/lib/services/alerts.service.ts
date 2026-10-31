import { apiClient } from '@/lib/api';

export type AlertType = 'urgent' | 'warning' | 'info' | 'event';

export interface AlertItem {
  id: number;
  type: AlertType;
  title: string;
  message: string;
  startDate?: string | null;
  endDate?: string | null;
  journalId?: number;
  isActive?: boolean;
}

export const INITIAL_ALERTS: AlertItem[] = [
  {
    id: 1,
    type: 'warning',
    title: 'Vigilance Météo Orange • Vents violents',
    message: 'Rafales attendues jusqu’à 90 km/h ce soir. Évitez les parcs municipaux et sécurisez vos extérieurs.',
    startDate: '2026-10-31',
    endDate: '2026-11-01',
    isActive: true,
  },
  {
    id: 2,
    type: 'urgent',
    title: 'Fermeture exceptionnelle du Pont Wilson',
    message: 'Travaux d’urgence sur les canalisations. Déviation mise en place par le quai nord jusqu’à demain 18h.',
    startDate: '2026-10-30',
    endDate: '2026-11-02',
    isActive: true,
  },
  {
    id: 3,
    type: 'info',
    title: 'Collecte des encombrants ce mercredi',
    message: 'Dépôt des objets encombrants autorisé sur le trottoir à partir de mardi 20h pour le secteur Centre.',
    startDate: '2026-11-03',
    endDate: '2026-11-05',
    isActive: false,
  },
];

let localAlerts: AlertItem[] = [...INITIAL_ALERTS];

type AlertListener = (alerts: AlertItem[]) => void;
const listeners: Set<AlertListener> = new Set();

function notifyListeners() {
  const snapshot = [...localAlerts];
  listeners.forEach((listener) => listener(snapshot));
}

export const AlertsService = {
  subscribe(listener: AlertListener): () => void {
    listeners.add(listener);
    listener([...localAlerts]);
    this.refresh();
    return () => {
      listeners.delete(listener);
    };
  },

  async refresh(): Promise<AlertItem[]> {
    try {
      const remote = await apiClient<AlertItem[]>('/alerts');
      if (Array.isArray(remote)) {
        localAlerts = remote.map((item) => ({
          ...item,
          isActive: item.isActive !== undefined ? item.isActive : true,
        }));
        notifyListeners();
      }
    } catch {
      // Fallback silencieux en mode déconnecté
    }
    return [...localAlerts];
  },

  getAlerts(): AlertItem[] {
    return [...localAlerts];
  },

  async createAlert(data: Omit<AlertItem, 'id'>): Promise<AlertItem> {
    const tempId = Date.now();
    const newAlert: AlertItem = {
      ...data,
      id: tempId,
      isActive: data.isActive !== undefined ? data.isActive : true,
    };

    localAlerts.unshift(newAlert);
    notifyListeners();

    try {
      const saved = await apiClient<AlertItem>('/alerts', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (saved && saved.id) {
        newAlert.id = saved.id;
        notifyListeners();
      }
    } catch {
      // Conserve l'ID local si hors-ligne
    }

    return newAlert;
  },

  async updateAlert(id: number, data: Partial<AlertItem>): Promise<AlertItem | null> {
    const index = localAlerts.findIndex((a) => a.id === id);
    if (index === -1) return null;

    localAlerts[index] = { ...localAlerts[index], ...data };
    notifyListeners();

    try {
      await apiClient<AlertItem>(`/alerts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    } catch {
      // Sauvegarde locale conservée
    }

    return localAlerts[index];
  },

  async toggleActive(id: number): Promise<AlertItem | null> {
    const alert = localAlerts.find((a) => a.id === id);
    if (!alert) return null;

    const newStatus = !alert.isActive;
    return this.updateAlert(id, { isActive: newStatus });
  },

  async deleteAlert(id: number): Promise<boolean> {
    localAlerts = localAlerts.filter((a) => a.id !== id);
    notifyListeners();

    try {
      await apiClient(`/alerts/${id}`, {
        method: 'DELETE',
      });
      return true;
    } catch {
      return true;
    }
  },
};

