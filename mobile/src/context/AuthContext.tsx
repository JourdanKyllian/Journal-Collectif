import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';

import { apiClient, MobileAuthApi, TokenStorage } from '@/lib/api';

export interface UserProfile {
  id: number;
  email: string;
  role: string;
  is_platform_admin?: boolean;
  must_change_password?: boolean;
  journal?: {
    slug: string;
    statut: string;
  };
  firstname: string | null;
  lastname: string | null;
  avatar_ref: string;
  bio: string | null;
  tel: string | null;
}

interface AuthContextType {
  user: UserProfile | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = useCallback(async (): Promise<UserProfile | null> => {
    try {
      const token = await TokenStorage.getAccessToken();
      if (!token) return null;

      const profile = await apiClient<UserProfile>('/auth/me');
      setUser(profile);
      return profile;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    async function initAuth() {
      try {
        await fetchProfile();
      } finally {
        setIsLoading(false);
      }
    }
    initAuth();
  }, [fetchProfile]);

  const login = async (email: string, pass: string): Promise<boolean> => {
    try {
      await MobileAuthApi.login(email, pass);
      const profile = await fetchProfile();

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Toast.show({
        type: 'success',
        text1: 'Connexion réussie',
        text2: profile?.firstname
          ? `Bienvenue, ${profile.firstname} !`
          : 'Session active.',
      });
      return true;
    } catch (err: unknown) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      const message = err instanceof Error ? err.message : 'Identifiants incorrects';
      Toast.show({
        type: 'error',
        text1: 'Échec de connexion',
        text2: message,
      });
      return false;
    }
  };

  const logout = async () => {
    try {
      await MobileAuthApi.logout();
    } catch {
      // Ignorer l'erreur réseau au logout
    } finally {
      setUser(null);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Toast.show({
        type: 'info',
        text1: 'Déconnexion',
        text2: 'À bientôt sur Journal Collectif !',
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        isLoading,
        login,
        logout,
        refreshProfile: async () => {
          await fetchProfile();
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

