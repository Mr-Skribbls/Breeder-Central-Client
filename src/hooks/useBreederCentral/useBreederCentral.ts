import { useEffect, useState } from "react";

export interface AnimalImage {
  animal_id: number;
  image_id: string;
  image_filename: string;
  center_x: number;
  center_y: number;
  alt: string;
  signedUrl: string;
}

export interface BreederCentralAnimal {
  id: number;
  description?: string;
  name?: string;
  gender?: "M" | "F";
  state?: string;
  images?: AnimalImage[];
}

export const requestAnimals = async (apiUrl: string, apiKey: string): Promise<BreederCentralAnimal[]> => {
  const url = `${apiUrl}/functions/v1/cdn_get_animals`;
  const response = await fetch(url, {
    headers: { "x-api-key": apiKey },
  });
  if (!response.ok) {
    throw new Error(`Failed to load animals: ${response.status}`);
  }
  const animals = await response.json();
  if (!Array.isArray(animals)) {
    throw new Error("Failed to load animals: unexpected response shape");
  }
  return animals;
};

const CACHE_KEY = "breeder-central-animals";
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

export const useBreederCentral = (apiUrl: string, apiKey: string) => {
  const [animals, setAnimals] = useState<BreederCentralAnimal[]>([]);
  const [animalImages, setAnimalImages] = useState<AnimalImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const cached = readCachedAnimals();
        const fetchedAnimals = cached ?? (await requestAnimals(apiUrl, apiKey));
        if (!cached) {
          writeCachedAnimals(fetchedAnimals);
        }
        if (cancelled) return;

        setAnimals(fetchedAnimals);
        setAnimalImages(fetchedAnimals.flatMap((animal) => animal.images ?? []));
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load animals");
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
    setReloadKey((key) => key + 1);
  };

  return {
    animals,
    animalImages,
    loading,
    error,
    refetch,
  };
};

export default useBreederCentral;