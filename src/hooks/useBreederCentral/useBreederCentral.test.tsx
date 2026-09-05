import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  requestAnimals,
  useBreederCentral,
  type AnimalImage,
  type BreederCentralAnimal,
} from "./useBreederCentral";

const API_URL = "https://api.example.com";
const API_KEY = "secret";

const ANIMALS: BreederCentralAnimal[] = [
  {
    id: 1,
    name: "Bella",
    images: [
      {
        animal_id: 1,
        image_id: "img-1",
        image_filename: "bella.jpg",
        center_x: 40,
        center_y: 60,
        alt: "Bella",
        signedUrl: "https://cdn.example.com/bella.jpg",
      },
    ],
  },
  {
    id: 2,
    name: "Max",
    images: [
      {
        animal_id: 2,
        image_id: "img-2",
        image_filename: "max.jpg",
        center_x: 50,
        center_y: 50,
        alt: "Max",
        signedUrl: "https://cdn.example.com/max.jpg",
      },
    ],
  },
];

const stubFetch = (json: unknown, ok = true, status = 200) => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok,
    status,
    json: () => Promise.resolve(json),
  }));
};

const fetchMock = () => vi.mocked(globalThis.fetch);

const writeExpiredCache = () => {
  localStorage.setItem(
    "breeder-central-animals",
    JSON.stringify({ data: [ANIMALS[0]], expiresAt: Date.now() - 1 }),
  );
};

describe("requestAnimals", () => {
  it("resolves with animals from a 2xx response", async () => {
    stubFetch(ANIMALS);
    await expect(requestAnimals(API_URL, API_KEY)).resolves.toEqual(ANIMALS);
    expect(fetchMock()).toHaveBeenCalledWith(`${API_URL}/functions/v1/cdn_get_animals`, {
      headers: { "x-api-key": API_KEY },
    });
  });

  it("throws on a non-2xx response", async () => {
    stubFetch({ message: "nope" }, false, 500);
    await expect(requestAnimals(API_URL, API_KEY)).rejects.toThrow(
      "Failed to load animals: 500",
    );
  });

  it("throws when the response is not an array", async () => {
    stubFetch({ animals: ANIMALS });
    await expect(requestAnimals(API_URL, API_KEY)).rejects.toThrow(
      "Failed to load animals: unexpected response shape",
    );
  });
});

describe("useBreederCentral", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches animals and flattens their images", async () => {
    stubFetch(ANIMALS);
    const { result } = renderHook(() => useBreederCentral(API_URL, API_KEY));

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.animals).toEqual(ANIMALS);
    expect(result.current.animalImages).toHaveLength(2);
    expect(result.current.animalImages.map((image) => image.image_id)).toEqual([
      "img-1",
      "img-2",
    ]);
    expect(fetchMock()).toHaveBeenCalledTimes(1);
  });

  it("serves a fresh cache without refetching", async () => {
    stubFetch(ANIMALS);
    const first = renderHook(() => useBreederCentral(API_URL, API_KEY));
    await waitFor(() => expect(first.result.current.loading).toBe(false));
    first.unmount();

    const second = renderHook(() => useBreederCentral(API_URL, API_KEY));
    await waitFor(() => expect(second.result.current.loading).toBe(false));

    expect(second.result.current.animals).toEqual(ANIMALS);
    expect(fetchMock()).toHaveBeenCalledTimes(1);
  });

  it("refetches when the cache is expired", async () => {
    stubFetch(ANIMALS);
    writeExpiredCache();

    const { result } = renderHook(() => useBreederCentral(API_URL, API_KEY));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(fetchMock()).toHaveBeenCalledTimes(1);
    expect(result.current.animals).toEqual(ANIMALS);
  });

  it("ignores a malformed cache and refetches", async () => {
    localStorage.setItem("breeder-central-animals", JSON.stringify({ data: { nope: true }, expiresAt: Date.now() + 100000 }));
    stubFetch(ANIMALS);

    const { result } = renderHook(() => useBreederCentral(API_URL, API_KEY));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(fetchMock()).toHaveBeenCalledTimes(1);
    expect(result.current.animals).toEqual(ANIMALS);
  });

  it("surfaces an error instead of animals when the fetch fails", async () => {
    stubFetch({ message: "nope" }, false, 500);

    const { result } = renderHook(() => useBreederCentral(API_URL, API_KEY));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe("Failed to load animals: 500");
    expect(result.current.animals).toEqual([]);
    expect(result.current.animalImages).toEqual([]);
    expect(localStorage.getItem("breeder-central-animals")).toBeNull();
  });

  it("refetch clears the cache and reloads from the network", async () => {
    stubFetch(ANIMALS);
    const { result } = renderHook(() => useBreederCentral(API_URL, API_KEY));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetchMock()).toHaveBeenCalledTimes(1);

    result.current.refetch();
    await waitFor(() => expect(fetchMock()).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.animals).toEqual(ANIMALS);
  });

  it("handles animals without images", async () => {
    const bare = [{ id: 3, name: "No Img" }];
    stubFetch(bare);

    const { result } = renderHook(() => useBreederCentral(API_URL, API_KEY));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.animals).toEqual(bare);
    expect(result.current.animalImages).toEqual([] as AnimalImage[]);
  });
});