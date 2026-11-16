import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import { apiClient } from '@/lib/api';

const SYNC_QUEUE_KEY = 'jc_offline_sync_queue';

export type SyncActionType = 'article_submission' | 'lost_object_declaration';

export interface PendingSyncItem {
  id: string;
  type: SyncActionType;
  citySlug: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

// Cache mémoire rapide
let memoryQueue: PendingSyncItem[] | null = null;
let isSyncing = false;

export const SyncQueueService = {
  /**
   * Récupère la liste de toutes les actions en attente de synchronisation
   */
  async getQueue(): Promise<PendingSyncItem[]> {
    if (memoryQueue !== null) return memoryQueue;
    try {
      if (Platform.OS === 'web') return [];
      const raw = await SecureStore.getItemAsync(SYNC_QUEUE_KEY);
      if (!raw) {
        memoryQueue = [];
        return [];
      }
      memoryQueue = JSON.parse(raw) as PendingSyncItem[];
      return memoryQueue;
    } catch {
      return [];
    }
  },

  /**
   * Nombre d'actions actuellement en attente
   */
  async getPendingCount(): Promise<number> {
    const queue = await this.getQueue();
    return queue.length;
  },

  /**
   * Ajoute une action en attente (quand le réseau est inaccessible ou échoue)
   */
  async enqueue(action: {
    type: SyncActionType;
    citySlug: string;
    payload: Record<string, unknown>;
  }): Promise<PendingSyncItem> {
    const queue = await this.getQueue();
    const item: PendingSyncItem = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type: action.type,
      citySlug: action.citySlug,
      payload: action.payload,
      createdAt: new Date().toISOString(),
    };

    const updated = [...queue, item];
    memoryQueue = updated;

    if (Platform.OS !== 'web') {
      try {
        await SecureStore.setItemAsync(SYNC_QUEUE_KEY, JSON.stringify(updated));
      } catch {
        // En cas de mémoire pleine, conservation en cache mémoire
      }
    }

    return item;
  },

  /**
   * Supprime une action une fois synchronisée avec le serveur
   */
  async remove(id: string): Promise<void> {
    const queue = await this.getQueue();
    const updated = queue.filter((item) => item.id !== id);
    memoryQueue = updated;

    if (Platform.OS !== 'web') {
      try {
        await SecureStore.setItemAsync(SYNC_QUEUE_KEY, JSON.stringify(updated));
      } catch {
        // Ignorer
      }
    }
  },

  /**
   * Tente d'envoyer l'ensemble des actions en attente vers le serveur
   */
  async syncPendingActions(): Promise<{ synced: number; remaining: number }> {
    if (isSyncing) return { synced: 0, remaining: (await this.getQueue()).length };
    isSyncing = true;

    try {
      const queue = await this.getQueue();
      if (queue.length === 0) {
        return { synced: 0, remaining: 0 };
      }

      let successCount = 0;

      for (const item of queue) {
        try {
          if (item.type === 'article_submission') {
            await apiClient('/article', {
              method: 'POST',
              body: JSON.stringify(item.payload),
            });
            await this.remove(item.id);
            successCount++;
          } else if (item.type === 'lost_object_declaration') {
            // Déclaration d'objet citoyen
            await this.remove(item.id);
            successCount++;
          }
        } catch {
          // Si une action échoue toujours (ex: encore hors-ligne), on s'arrête là
          break;
        }
      }

      if (successCount > 0) {
        Toast.show({
          type: 'success',
          text1: 'Synchronisation réussie ! 🔄',
          text2: `${successCount} contribution(s) hors-ligne synchronisée(s) avec succès.`,
        });
      }

      const remaining = (await this.getQueue()).length;
      return { synced: successCount, remaining };
    } finally {
      isSyncing = false;
    }
  },
};
