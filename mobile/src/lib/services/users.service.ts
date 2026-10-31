import { apiClient } from '@/lib/api';

export type UserRole = 'super_admin' | 'admin' | 'redacteur' | 'utilisateur';

export interface UserProfile {
  firstname?: string | null;
  lastname?: string | null;
  tel?: string | null;
  avatar_ref?: string | null;
}

export interface ManagedUser {
  id: number;
  email: string;
  role: UserRole;
  is_phone_verified?: boolean;
  profile?: UserProfile | null;
  created_at?: string;
}

export const INITIAL_USERS: ManagedUser[] = [
  {
    id: 1,
    email: 'superadmin@journal.fr',
    role: 'super_admin',
    is_phone_verified: true,
    profile: {
      firstname: 'Alexandre',
      lastname: 'Gautier',
      tel: '06 12 34 56 78',
      avatar_ref: 'avatar_superadmin',
    },
    created_at: '2026-01-15T10:00:00Z',
  },
  {
    id: 2,
    email: 'admin@journal.fr',
    role: 'admin',
    is_phone_verified: true,
    profile: {
      firstname: 'Claire',
      lastname: 'Dumont',
      tel: '06 98 76 54 32',
      avatar_ref: 'avatar_admin',
    },
    created_at: '2026-02-01T14:30:00Z',
  },
  {
    id: 3,
    email: 'redacteur@journal.fr',
    role: 'redacteur',
    is_phone_verified: true,
    profile: {
      firstname: 'Marc',
      lastname: 'Lemoine',
      tel: '06 55 44 33 22',
      avatar_ref: 'avatar_redac',
    },
    created_at: '2026-03-10T09:15:00Z',
  },
  {
    id: 4,
    email: 'visiteur.complet@exemple.fr',
    role: 'utilisateur',
    is_phone_verified: true,
    profile: {
      firstname: 'Sophie',
      lastname: 'Bernard',
      tel: '07 11 22 33 44',
      avatar_ref: 'default_01',
    },
    created_at: '2026-04-12T16:45:00Z',
  },
  {
    id: 5,
    email: 'citoyen.engage@exemple.fr',
    role: 'utilisateur',
    is_phone_verified: false,
    profile: {
      firstname: 'Julien',
      lastname: 'Faure',
      tel: null,
      avatar_ref: 'default_02',
    },
    created_at: '2026-05-20T11:20:00Z',
  },
];

let localUsers: ManagedUser[] = [...INITIAL_USERS];

type UsersListener = (users: ManagedUser[]) => void;
const listeners: Set<UsersListener> = new Set();

function notifyListeners() {
  const snapshot = [...localUsers];
  listeners.forEach((listener) => listener(snapshot));
}

export const UsersService = {
  subscribe(listener: UsersListener): () => void {
    listeners.add(listener);
    listener([...localUsers]);
    this.refresh();
    return () => {
      listeners.delete(listener);
    };
  },

  async refresh(): Promise<ManagedUser[]> {
    try {
      const response = await apiClient<{ data?: ManagedUser[]; users?: ManagedUser[] } | ManagedUser[]>('/users/all');
      let items: ManagedUser[] = [];
      if (Array.isArray(response)) {
        items = response;
      } else if (response && Array.isArray(response.data)) {
        items = response.data;
      } else if (response && Array.isArray(response.users)) {
        items = response.users;
      }

      if (items.length > 0) {
        localUsers = items;
        notifyListeners();
      }
    } catch {
      // Fallback local silencieux
    }
    return [...localUsers];
  },

  getUsers(): ManagedUser[] {
    return [...localUsers];
  },

  async createUser(data: {
    email: string;
    password?: string;
    role: UserRole;
    firstname?: string;
    lastname?: string;
    tel?: string;
  }): Promise<ManagedUser> {
    const tempId = Date.now();
    const newUser: ManagedUser = {
      id: tempId,
      email: data.email,
      role: data.role,
      is_phone_verified: !!data.tel,
      profile: {
        firstname: data.firstname ?? '',
        lastname: data.lastname ?? '',
        tel: data.tel ?? null,
      },
      created_at: new Date().toISOString(),
    };

    localUsers.unshift(newUser);
    notifyListeners();

    try {
      const saved = await apiClient<ManagedUser>('/users/create', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (saved && saved.id) {
        newUser.id = saved.id;
        notifyListeners();
      }
    } catch {
      // Conserve l'ID local
    }

    return newUser;
  },

  async updateUserRole(id: number, newRole: UserRole): Promise<ManagedUser | null> {
    const index = localUsers.findIndex((u) => u.id === id);
    if (index === -1) return null;

    localUsers[index] = { ...localUsers[index], role: newRole };
    notifyListeners();

    try {
      await apiClient(`/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole }),
      });
    } catch {
      // Sauvegarde locale conservée
    }

    return localUsers[index];
  },

  async deleteUser(id: number): Promise<boolean> {
    localUsers = localUsers.filter((u) => u.id !== id);
    notifyListeners();

    try {
      await apiClient(`/users/${id}`, {
        method: 'DELETE',
      });
      return true;
    } catch {
      return true;
    }
  },
};

