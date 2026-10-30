import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient, TenantStorage } from '@/lib/api';

export interface City {
  slug: string;
  name: string;
  shortName: string;
  postalCode: string;
  department: string;
  tagline: string;
  isPopular?: boolean;
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
  },
  {
    slug: 'chateau-thierry',
    name: 'Château-Thierry',
    shortName: 'Château-Thierry',
    postalCode: '02400',
    department: 'Aisne (02)',
    tagline: 'Cité des Fables & Portes de Champagne',
    isPopular: true,
  },
  {
    slug: 'mairie-epernay',
    name: 'Épernay',
    shortName: 'Épernay',
    postalCode: '51200',
    department: 'Marne (51)',
    tagline: 'Capitale du Champagne',
  },
  {
    slug: 'vitry-le-francois',
    name: 'Vitry-le-François',
    shortName: 'Vitry',
    postalCode: '51300',
    department: 'Marne (51)',
    tagline: 'Porte du Lac du Der',
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

interface CityContextType {
  currentCity: City;
  cities: City[];
  selectCity: (slug: string) => Promise<void>;
  refreshTenant: () => Promise<void>;
  isLoading: boolean;
}

const CityContext = createContext<CityContextType | undefined>(undefined);

export function CityProvider({ children }: { children: ReactNode }) {
  const [citiesList, setCitiesList] = useState<City[]>(CITIES);
  const [currentCity, setCurrentCity] = useState<City>(CITIES[0]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    async function initCityAndJournals() {
      try {
        const savedSlug = await TenantStorage.getTenant();
        if (!isMounted) return;
        const matched = CITIES.find((c) => c.slug === savedSlug);
        if (matched) {
          setCurrentCity(matched);
        }

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
            };
          });

          const merged = [...remoteCities];
          for (const local of CITIES) {
            if (!merged.some((m) => m.slug === local.slug)) {
              merged.push(local);
            }
          }
          setCitiesList(merged);
        }
      } catch {
        // Fallback silencieux sur villes locales
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initCityAndJournals();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectCity = async (slug: string) => {
    const matched = citiesList.find((c) => c.slug === slug);
    if (!matched) return;
    setCurrentCity(matched);
    await TenantStorage.setTenant(slug);
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
        selectCity,
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
