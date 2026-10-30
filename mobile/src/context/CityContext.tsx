import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  apiClient,
  TenantStorage,
  TerritoryStorage,
  StoredTerritoryPreferences,
} from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Toast from 'react-native-toast-message';

export interface City {
  slug: string;
  name: string;
  shortName: string;
  postalCode: string;
  department: string;
  tagline: string;
  isPopular?: boolean;
  typeJournal?: string;
  nomJournal?: string;
}

export const CITIES: City[] = [
  {
    slug: 'collectif-chalonnais',
    name: 'Châlons-en-Champagne',
    shortName: 'Châlons',
    postalCode: '51000',
    department: 'Marne (51)',
    tagline: 'Préfecture & Cité historique',
    isPopular: true,
    typeJournal: 'Journal associatif indépendant',
    nomJournal: 'Collectif Chalonnais',
  },
  {
    slug: 'chateau-thierry',
    name: 'Château-Thierry',
    shortName: 'Château-Thierry',
    postalCode: '02400',
    department: 'Aisne (02)',
    tagline: 'Cité des Fables & Portes de Champagne',
    isPopular: true,
    typeJournal: 'Journal territorial citoyen',
    nomJournal: 'Le Courrier Castel',
  },
  {
    slug: 'mairie-epernay',
    name: 'Épernay',
    shortName: 'Épernay',
    postalCode: '51200',
    department: 'Marne (51)',
    tagline: 'Capitale du Champagne',
    isPopular: true,
    typeJournal: 'Journal municipal & associatif',
    nomJournal: 'Épernay Actu',
  },
  {
    slug: 'vitry-le-francois',
    name: 'Vitry-le-François',
    shortName: 'Vitry',
    postalCode: '51300',
    department: 'Marne (51)',
    tagline: 'Porte du Lac du Der',
    typeJournal: 'Journal local participatif',
    nomJournal: 'Vitry Ensemble',
  },
];

interface ApiJournalCommune {
  id: number;
  nom: string;
  code_insee: string;
  code_postal: string;
}

interface ApiJournal {
  id: number;
  slug: string;
  nom_journal: string;
  type_journal: string;
  nom_ville: string;
  statut: string;
  communes?: ApiJournalCommune[];
}

interface ApiJournalDirectoryResponse {
  data: ApiJournal[];
}

export interface CityContextType {
  /** Ville / Journal actif (en-tête X-Journal pour les requêtes) */
  currentCity: City;
  /** Tous les journaux disponibles dans le réseau */
  cities: City[];
  /** Liste des journaux suivis par l'utilisateur */
  followedCities: City[];
  /** Slugs des journaux suivis */
  followedSlugs: string[];
  /** Slug du journal principal d'attache */
  primarySlug: string;
  /** Savoir si un journal est suivi */
  isFollowed: (slug: string) => boolean;
  /** Savoir si un journal est le principal */
  isPrimary: (slug: string) => boolean;
  /** Changer d'édition active dans l'application */
  selectCity: (slug: string) => Promise<void>;
  /** Ajouter / retirer un journal de ses préférences suivies */
  toggleFollowCity: (slug: string) => Promise<void>;
  /** Définir une édition comme journal principal */
  setPrimaryCity: (slug: string) => Promise<void>;
  /** Activer ou désactiver les alertes pour un journal */
  toggleAlertsForCity: (slug: string) => Promise<void>;
  /** Vérifier si les alertes sont actives pour un journal */
  hasAlertsEnabled: (slug: string) => boolean;
  /** Recherche multi-critères dans les éditions disponibles */
  searchCities: (query: string) => City[];
  /** Savoir si le compte connecté est un gestionnaire/staff rattaché à son journal */
  isProManager: boolean;
  /** Rafraîchir les journaux et le tenant */
  refreshTenant: () => Promise<void>;
  isLoading: boolean;
}

const CityContext = createContext<CityContextType | undefined>(undefined);

const DEFAULT_PREFS: StoredTerritoryPreferences = {
  followedSlugs: ['collectif-chalonnais'],
  primarySlug: 'collectif-chalonnais',
  alertsBySlug: { 'collectif-chalonnais': true },
};

export function CityProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [citiesList, setCitiesList] = useState<City[]>(CITIES);
  const [currentCity, setCurrentCity] = useState<City>(CITIES[0]);
  const [followedSlugs, setFollowedSlugs] = useState<string[]>(DEFAULT_PREFS.followedSlugs);
  const [primarySlug, setPrimarySlug] = useState<string>(DEFAULT_PREFS.primarySlug);
  const [alertsBySlug, setAlertsBySlug] = useState<Record<string, boolean>>(DEFAULT_PREFS.alertsBySlug);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const isProManager = Boolean(
    user?.journal?.slug &&
    ['super_admin', 'admin', 'redacteur'].includes((user.role || '').toLowerCase())
  );

  // 1. Initialisation des journaux distants + préférences utilisateur
  useEffect(() => {
    let isMounted = true;

    async function initTerritory() {
      try {
        // A. Chargement des préférences utilisateur spécifiques (ou invité)
        const userPrefs = await TerritoryStorage.getPreferences(user?.id);
        const prefs = userPrefs ?? DEFAULT_PREFS;

        let activeFollowed = prefs.followedSlugs.length > 0 ? prefs.followedSlugs : ['collectif-chalonnais'];
        let activePrimary = prefs.primarySlug || activeFollowed[0];
        const activeAlerts = prefs.alertsBySlug || {};

        // Règle métier Compte Pro : STRICTEMENT verrouillé sur son journal d'attache
        if (isProManager && user?.journal?.slug) {
          activeFollowed = [user.journal.slug];
          activePrimary = user.journal.slug;
        } else if (user?.journal?.slug) {
          if (!activeFollowed.includes(user.journal.slug)) {
            activeFollowed = [user.journal.slug, ...activeFollowed];
          }
          activePrimary = user.journal.slug;
        }

        if (isMounted) {
          setFollowedSlugs(activeFollowed);
          setPrimarySlug(activePrimary);
          setAlertsBySlug(activeAlerts);
        }

        // B. Résolution du tenant actif sauvegardé (ou repli sur l'édition principale)
        const savedSlug = await TenantStorage.getTenant();
        const initialSlug = savedSlug || activePrimary;
        const initialMatch = CITIES.find((c) => c.slug === initialSlug) || CITIES[0];
        if (isMounted) {
          setCurrentCity(initialMatch);
        }

        // C. Récupération de l'annuaire complet des journaux depuis l'API
        const response = await apiClient<ApiJournalDirectoryResponse | ApiJournal[]>('/journals');
        if (!isMounted) return;

        const journals = Array.isArray(response)
          ? response
          : response?.data && Array.isArray(response.data)
          ? response.data
          : [];

        if (journals.length > 0) {
          const remoteCities: City[] = journals.map((j) => {
            const mainCommune = j.communes?.[0];
            const localMatch = CITIES.find((c) => c.slug === j.slug);
            return {
              slug: j.slug,
              name: j.nom_ville || j.nom_journal,
              shortName: j.nom_ville || j.nom_journal,
              postalCode: mainCommune?.code_postal || localMatch?.postalCode || '51000',
              department: localMatch?.department || 'Région Grand Est',
              tagline: localMatch?.tagline || `${j.type_journal || 'Journal'} d'information locale`,
              isPopular: localMatch?.isPopular ?? false,
              typeJournal: j.type_journal || localMatch?.typeJournal || 'Édition locale',
              nomJournal: j.nom_journal || localMatch?.nomJournal || j.nom_ville,
            };
          });

          // Fusion avec les villes locales
          const merged = [...remoteCities];
          for (const local of CITIES) {
            if (!merged.some((m) => m.slug === local.slug)) {
              merged.push(local);
            }
          }
          setCitiesList(merged);

          // Actualisation de l'objet ville active avec les métadonnées distantes
          const updatedActive = merged.find((c) => c.slug === initialSlug);
          if (updatedActive) {
            setCurrentCity(updatedActive);
          }
        }
      } catch {
        // Fallback silencieux sur les données locales
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initTerritory();

    return () => {
      isMounted = false;
    };
  }, [user?.id, user?.journal?.slug, isProManager]);

  // Sauvegarde persistante des préférences
  const persistPreferences = async (
    nextFollowed: string[],
    nextPrimary: string,
    nextAlerts: Record<string, boolean>
  ) => {
    await TerritoryStorage.savePreferences(
      {
        followedSlugs: nextFollowed,
        primarySlug: nextPrimary,
        alertsBySlug: nextAlerts,
      },
      user?.id
    );
  };

  // Liste ordonnée des objets City suivis par l'utilisateur
  const followedCities = useMemo(() => {
    return followedSlugs
      .map((slug) => citiesList.find((c) => c.slug === slug))
      .filter((c): c is City => Boolean(c));
  }, [followedSlugs, citiesList]);

  const isFollowed = (slug: string) => followedSlugs.includes(slug);
  const isPrimary = (slug: string) => primarySlug === slug;
  const hasAlertsEnabled = (slug: string) => alertsBySlug[slug] !== false;

  // Sélectionner un journal comme édition active
  const selectCity = async (slug: string) => {
    if (isProManager && user?.journal?.slug && slug !== user.journal.slug) {
      Toast.show({
        type: 'info',
        text1: 'Compte Pro Rédactionnel',
        text2: 'Votre compte est exclusivement rattaché à votre journal local.',
      });
      return;
    }

    const matched = citiesList.find((c) => c.slug === slug);
    if (!matched) return;
    setCurrentCity(matched);
    await TenantStorage.setTenant(slug);

    Toast.show({
      type: 'info',
      text1: 'Édition territoriale active',
      text2: matched.name,
    });
  };

  // Ajouter / retirer un journal de ses préférences suivies
  const toggleFollowCity = async (slug: string) => {
    if (isProManager) {
      Toast.show({
        type: 'info',
        text1: 'Compte Pro Rédactionnel',
        text2: 'Votre compte est exclusivement rattaché à votre journal local.',
      });
      return;
    }

    const matched = citiesList.find((c) => c.slug === slug);
    if (!matched) return;

    if (followedSlugs.includes(slug)) {
      // Impossible de tout désélectionner (garder au moins 1 journal)
      if (followedSlugs.length <= 1) {
        Toast.show({
          type: 'error',
          text1: 'Action impossible',
          text2: 'Vous devez suivre au moins une édition territoriale.',
        });
        return;
      }

      const nextFollowed = followedSlugs.filter((s) => s !== slug);
      let nextPrimary = primarySlug;
      if (primarySlug === slug) {
        nextPrimary = nextFollowed[0];
        setPrimarySlug(nextPrimary);
      }

      setFollowedSlugs(nextFollowed);

      // Si le journal retiré était le journal actif, basculer sur le principal restant
      if (currentCity.slug === slug) {
        const fallbackCity = citiesList.find((c) => c.slug === nextPrimary);
        if (fallbackCity) {
          setCurrentCity(fallbackCity);
          await TenantStorage.setTenant(nextPrimary);
        }
      }

      await persistPreferences(nextFollowed, nextPrimary, alertsBySlug);

      Toast.show({
        type: 'info',
        text1: 'Édition retirée',
        text2: `${matched.name} ne fait plus partie de vos éditions suivies.`,
      });
    } else {
      const nextFollowed = [...followedSlugs, slug];
      const nextAlerts = { ...alertsBySlug, [slug]: true };

      setFollowedSlugs(nextFollowed);
      setAlertsBySlug(nextAlerts);

      await persistPreferences(nextFollowed, primarySlug, nextAlerts);

      Toast.show({
        type: 'success',
        text1: 'Édition ajoutée',
        text2: `${matched.name} a été ajoutée à vos éditions suivies.`,
      });
    }
  };

  // Définir un journal comme édition principale
  const setPrimaryCity = async (slug: string) => {
    const matched = citiesList.find((c) => c.slug === slug);
    if (!matched) return;

    let nextFollowed = followedSlugs;
    if (!followedSlugs.includes(slug)) {
      nextFollowed = [...followedSlugs, slug];
      setFollowedSlugs(nextFollowed);
    }

    setPrimarySlug(slug);
    await persistPreferences(nextFollowed, slug, alertsBySlug);

    Toast.show({
      type: 'success',
      text1: 'Édition principale définie',
      text2: `${matched.name} est désormais votre journal par défaut.`,
    });
  };

  // Activer / désactiver les notifications push locales d'un journal
  const toggleAlertsForCity = async (slug: string) => {
    const currentStatus = hasAlertsEnabled(slug);
    const nextAlerts = {
      ...alertsBySlug,
      [slug]: !currentStatus,
    };
    setAlertsBySlug(nextAlerts);
    await persistPreferences(followedSlugs, primarySlug, nextAlerts);

    const matched = citiesList.find((c) => c.slug === slug);
    Toast.show({
      type: !currentStatus ? 'success' : 'info',
      text1: !currentStatus ? 'Alertes activées' : 'Alertes désactivées',
      text2: `${!currentStatus ? 'Notifications actives pour' : 'Plus de notifications pour'} ${matched?.name || slug}.`,
    });
  };

  // Recherche textuelle d'éditions
  const searchCities = (query: string): City[] => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return citiesList;
    return citiesList.filter(
      (c) =>
        c.name.toLowerCase().includes(trimmed) ||
        c.shortName.toLowerCase().includes(trimmed) ||
        c.postalCode.includes(trimmed) ||
        c.department.toLowerCase().includes(trimmed) ||
        (c.nomJournal && c.nomJournal.toLowerCase().includes(trimmed))
    );
  };

  const refreshTenant = async () => {
    const savedSlug = await TenantStorage.getTenant();
    const matched = citiesList.find((c) => c.slug === savedSlug);
    if (matched) {
      setCurrentCity(matched);
    }
  };

  return (
    <CityContext.Provider
      value={{
        currentCity,
        cities: citiesList,
        followedCities,
        followedSlugs,
        primarySlug,
        isFollowed,
        isPrimary,
        selectCity,
        toggleFollowCity,
        setPrimaryCity,
        toggleAlertsForCity,
        hasAlertsEnabled,
        searchCities,
        isProManager,
        refreshTenant,
        isLoading,
      }}
    >
      {children}
    </CityContext.Provider>
  );
}

export function useCity(): CityContextType {
  const context = useContext(CityContext);
  if (!context) {
    throw new Error('useCity must be used within a CityProvider');
  }
  return context;
}
