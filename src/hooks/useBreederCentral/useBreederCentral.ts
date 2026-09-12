import { useEffect, useState } from 'react';

interface BreederCentralImage {
  id: string;
  filename: string;
  centerX: number;
  centerY: number;
  alt: string;
  signedUrl: string;
}

export interface AnimalImage extends BreederCentralImage {
  animalId: number;
}

export enum AnimalServiceType {
  AnimalPurchase = 'Animal Purchase',
  StudService = 'Stud Service',
}

export interface BreederCentralAnimal {
  id: number;
  description?: string;
  name?: string;
  gender?: 'M' | 'F';
  state?: string;
  serviceType?: AnimalServiceType;
  price?: number;
  purchaseConditions?: string;
  images?: AnimalImage[];
}

export interface OffspringImage extends BreederCentralImage {
  offspringGroupId: number;
}

export interface BreederCentralOffspringAnimal {
  animalId: number;
  role: string;
}

export interface BreederCentralOffspringEvent {
  name: string;
  date: string;
}

export interface BreederCentralOffspringGroup {
  id: number;
  name: string;
  description: string | null;
  animals: BreederCentralOffspringAnimal[];
  events: BreederCentralOffspringEvent[];
  images?: OffspringImage[];
}

export const requestAnimals = async (apiUrl: string, apiKey: string): Promise<BreederCentralAnimal[]> => {
  const url = `${apiUrl}/functions/v1/cdn_get_animals`;
  const response = await fetch(url, {
    headers: { 'x-api-key': apiKey },
  });
  if (!response.ok) {
    throw new Error(`Failed to load animals: ${response.status}`);
  }
  const animals = await response.json();
  if (!Array.isArray(animals)) {
    throw new Error('Failed to load animals: unexpected response shape');
  }
  return animals;
};

export const requestOffspringGroups = async (apiUrl: string, apiKey: string): Promise<BreederCentralOffspringGroup[]> => {
  const url = `${apiUrl}/functions/v1/cdn_get_offspring`;
  const response = await fetch(url, {
    headers: { 'x-api-key': apiKey },
  });
  if(!response.ok) {
    throw new Error(`Failed to load offspring groups: ${response.status}`);
  }
  const offspringGroups = await response.json();
  if(!Array.isArray(offspringGroups)) {
    throw new Error('Failed to load offspring groups: unexpected response shape');
  }
  return offspringGroups;
}

const CACHE_KEY = 'breeder-central-animals';
const CACHE_TTL_MS = 60 * 60 * 1000;

interface AnimalCache {
  data: BreederCentralAnimal[];
  expiresAt: number;
}

const readCachedAnimals = (): BreederCentralAnimal[] | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cache: AnimalCache = JSON.parse(raw);
    if (Array.isArray(cache.data) && cache.expiresAt > Date.now()) {
      return cache.data;
    }
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // ignore storage read errors
  }
  return null;
};

const writeCachedAnimals = (animals: BreederCentralAnimal[]) => {
  const cache: AnimalCache = {
    data: animals,
    expiresAt: Date.now() + CACHE_TTL_MS,
  };
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore storage write errors
  }
};

const clearCachedAnimals = () => {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // ignore storage write errors
  }
};

const OFFSPRING_CACHE_KEY = 'breeder-central-offspring-groups';

interface OffspringCache {
  data: BreederCentralOffspringGroup[];
  expiresAt: number;
}

const readCachedOffspring = (): BreederCentralOffspringGroup[] | null => {
  try {
    const raw = localStorage.getItem(OFFSPRING_CACHE_KEY);
    if (!raw) return null;
    const cache: OffspringCache = JSON.parse(raw);
    if (Array.isArray(cache.data) && cache.expiresAt > Date.now()) {
      return cache.data;
    }
    localStorage.removeItem(OFFSPRING_CACHE_KEY);
  } catch {
    // ignore storage read errors
  }
  return null;
};

const writeCachedOffspring = (offspringGroups: BreederCentralOffspringGroup[]) => {
  const cache: OffspringCache = {
    data: offspringGroups,
    expiresAt: Date.now() + CACHE_TTL_MS,
  };
  try {
    localStorage.setItem(OFFSPRING_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore storage write errors
  }
};

const clearCachedOffspring = () => {
  try {
    localStorage.removeItem(OFFSPRING_CACHE_KEY);
  } catch {
    // ignore storage write errors
  }
};

export const useBreederCentral = (apiUrl: string, apiKey: string) => {
  const [animals, setAnimals] = useState<BreederCentralAnimal[]>([]);
  const [animalImages, setAnimalImages] = useState<AnimalImage[]>([]);
  const [offspringGroups, setOffspringGroups] = useState<BreederCentralOffspringGroup[]>([]);
  const [offspringImages, setOffspringImages] = useState<OffspringImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const cachedAnimals = readCachedAnimals();
        const cachedOffspring = readCachedOffspring();

        const [fetchedAnimals, fetchedOffspring] = await Promise.all([
          cachedAnimals ?? requestAnimals(apiUrl, apiKey),
          cachedOffspring ?? requestOffspringGroups(apiUrl, apiKey),
        ]);
        if (!cachedAnimals) {
          writeCachedAnimals(fetchedAnimals);
        }
        if (!cachedOffspring) {
          writeCachedOffspring(fetchedOffspring);
        }
        if (cancelled) return;

        setAnimals(fetchedAnimals);
        setAnimalImages(fetchedAnimals.flatMap((animal) => animal.images ?? []));
        setOffspringGroups(fetchedOffspring);
        setOffspringImages(fetchedOffspring.flatMap((group) => group.images ?? []));
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load animals');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [apiUrl, apiKey, reloadKey]);

  const refetch = () => {
    clearCachedAnimals();
    clearCachedOffspring();
    setReloadKey((key) => key + 1);
  };

  return {
    animals,
    animalImages,
    offspringGroups,
    offspringImages,
    loading,
    error,
    refetch,
  };
};

export default useBreederCentral;