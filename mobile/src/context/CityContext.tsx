import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TenantStorage } from '@/lib/api';

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

interface CityContextType {
  currentCity: City;
  cities: City[];
  selectCity: (slug: string) => Promise<void>;
  isLoading: boolean;
}

const CityContext = createContext<CityContextType | undefined>(undefined);

export function CityProvider({ children }: { children: ReactNode }) {
  const [currentCity, setCurrentCity] = useState<City>(CITIES[0]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadSavedCity() {
      try {
        const savedSlug = await TenantStorage.getTenant();
        const matched = CITIES.find((c) => c.slug === savedSlug);
        if (matched) {
          setCurrentCity(matched);
        }
      } catch {
        // Fallback silently to default city
      } finally {
        setIsLoading(false);
      }
    }
    loadSavedCity();
  }, []);

  const selectCity = async (slug: string) => {
    const matched = CITIES.find((c) => c.slug === slug);
    if (!matched) return;
    setCurrentCity(matched);
    await TenantStorage.setTenant(slug);
  };

  return (
    <CityContext.Provider
      value={{
        currentCity,
        cities: CITIES,
        selectCity,
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

