import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  requestAnimals,
  requestOffspringGroups,
  useBreederCentral,
  type AnimalImage,
  type BreederCentralAnimal,
  type BreederCentralOffspringGroup,
  type OffspringImage,
} from "./useBreederCentral";

const API_URL = "https://api.example.com";
const API_KEY = "secret";

const ANIMALS: BreederCentralAnimal[] = [
  {
    id: 1,
    name: "Bella",
    images: [
      {
        id: "img-1",
        animalId: 1,
        filename: "bella.jpg",
        centerX: 40,
        centerY: 60,
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
        id: "img-2",
        animalId: 2,
        filename: "max.jpg",
        centerX: 50,
        centerY: 50,
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

const OFFSPRING_GROUPS: BreederCentralOffspringGroup[] = [
  {
    id: 1,
    name: "Litter A",
    description: "First litter",
    animals: [
      { animalId: 1, role: "sire" },
      { animalId: 2, role: "dam" },
    ],
    events: [
      { name: "Born", date: "2025-01-01" },
    ],
    images: [
      {
        id: "img-3",
        offspringGroupId: 1,
        filename: "litter-a.jpg",
        centerX: 30,
        centerY: 70,
        alt: "Litter A",
        signedUrl: "https://cdn.example.com/litter-a.jpg",
      },
      {
        id: "img-4",
        offspringGroupId: 1,
        filename: "litter-a-2.jpg",
        centerX: 50,
        centerY: 50,
        alt: "Litter A second",
        signedUrl: "https://cdn.example.com/litter-a-2.jpg",
      },
    ],
  },
];

const writeExpiredOffspringCache = () => {
  localStorage.setItem(
    "breeder-central-offspring-groups",
    JSON.stringify({ data: [OFFSPRING_GROUPS[0]], expiresAt: Date.now() - 1 }),
  );
};

const stubFetchMulti = (responses: Array<{ ok?: boolean; status?: number; json: unknown }>) => {
  const order = [...responses];
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation(() => {
      const next = order.shift();
      if (!next) throw new Error("unexpected fetch call");
      const { ok = true, status = 200, json } = next;
      return Promise.resolve({
        ok,
        status,
        json: () => Promise.resolve(json),
      });
    }),
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

describe("requestOffspringGroups", () => {
  it("resolves with offspring groups from a 2xx response", async () => {
    stubFetch(OFFSPRING_GROUPS);
    await expect(requestOffspringGroups(API_URL, API_KEY)).resolves.toEqual(OFFSPRING_GROUPS);
    expect(fetchMock()).toHaveBeenCalledWith(`${API_URL}/functions/v1/cdn_get_offspring`, {
      headers: { "x-api-key": API_KEY },
    });
  });

  it("throws on a non-2xx response", async () => {
    stubFetch({ message: "nope" }, false, 500);
    await expect(requestOffspringGroups(API_URL, API_KEY)).rejects.toThrow(
      "Failed to load offspring groups: 500",
    );
  });

  it("throws when the response is not an array", async () => {
    stubFetch({ groups: OFFSPRING_GROUPS });
    await expect(requestOffspringGroups(API_URL, API_KEY)).rejects.toThrow(
      "Failed to load offspring groups: unexpected response shape",
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

  it("fetches animals, flattens their images, and exposes offspring groups", async () => {
    stubFetchMulti([
      { json: ANIMALS },
      { json: OFFSPRING_GROUPS },
    ]);
    const { result } = renderHook(() => useBreederCentral(API_URL, API_KEY));

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.animals).toEqual(ANIMALS);
    expect(result.current.animalImages).toHaveLength(2);
    expect(result.current.animalImages.map((image) => image.id)).toEqual([
      "img-1",
      "img-2",
    ]);
    expect(result.current.offspringGroups).toEqual(OFFSPRING_GROUPS);
    expect(result.current.offspringImages).toHaveLength(2);
    expect(result.current.offspringImages.map((image) => image.id)).toEqual([
      "img-3",
      "img-4",
    ]);
    expect(fetchMock()).toHaveBeenCalledTimes(2);
  });

  it("serves a fresh cache without refetching", async () => {
    stubFetchMulti([
      { json: ANIMALS },
      { json: OFFSPRING_GROUPS },
    ]);
    const first = renderHook(() => useBreederCentral(API_URL, API_KEY));
    await waitFor(() => expect(first.result.current.loading).toBe(false));
    first.unmount();

    const second = renderHook(() => useBreederCentral(API_URL, API_KEY));
    await waitFor(() => expect(second.result.current.loading).toBe(false));

    expect(second.result.current.animals).toEqual(ANIMALS);
    expect(second.result.current.offspringGroups).toEqual(OFFSPRING_GROUPS);
    expect(fetchMock()).toHaveBeenCalledTimes(2);
  });

  it("refetches a fresh cache and serves cached offspring without refetching", async () => {
    writeExpiredCache();
    const freshOffspring = [OFFSPRING_GROUPS[0]];
    localStorage.setItem(
      "breeder-central-offspring-groups",
      JSON.stringify({ data: freshOffspring, expiresAt: Date.now() + 100000 }),
    );
    stubFetchMulti([{ json: ANIMALS }]);

    const { result } = renderHook(() => useBreederCentral(API_URL, API_KEY));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(fetchMock()).toHaveBeenCalledTimes(1);
    expect(fetchMock()).toHaveBeenCalledWith(`${API_URL}/functions/v1/cdn_get_animals`, expect.any(Object));
    expect(result.current.animals).toEqual(ANIMALS);
    expect(result.current.offspringGroups).toEqual(freshOffspring);
  });

  it("refetches an expired offspring cache and serves cached animals", async () => {
    stubFetchMulti([{ json: OFFSPRING_GROUPS }]);
    localStorage.setItem(
      "breeder-central-animals",
      JSON.stringify({ data: ANIMALS, expiresAt: Date.now() + 100000 }),
    );
    writeExpiredOffspringCache();

    const { result } = renderHook(() => useBreederCentral(API_URL, API_KEY));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(fetchMock()).toHaveBeenCalledTimes(1);
    expect(fetchMock()).toHaveBeenCalledWith(`${API_URL}/functions/v1/cdn_get_offspring`, expect.any(Object));
    expect(result.current.animals).toEqual(ANIMALS);
    expect(result.current.offspringGroups).toEqual(OFFSPRING_GROUPS);
  });

  it("ignores a malformed cache and refetches", async () => {
    localStorage.setItem("breeder-central-animals", JSON.stringify({ data: { nope: true }, expiresAt: Date.now() + 100000 }));
    const freshOffspring = [OFFSPRING_GROUPS[0]];
    localStorage.setItem(
      "breeder-central-offspring-groups",
      JSON.stringify({ data: freshOffspring, expiresAt: Date.now() + 100000 }),
    );
    stubFetchMulti([{ json: ANIMALS }]);

    const { result } = renderHook(() => useBreederCentral(API_URL, API_KEY));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(fetchMock()).toHaveBeenCalledTimes(1);
    expect(result.current.animals).toEqual(ANIMALS);
  });

  it("surfaces an error instead of animals when the fetch fails", async () => {
    stubFetchMulti([
      { json: { message: "nope" }, ok: false, status: 500 },
      { json: { message: "nope" }, ok: false, status: 500 },
    ]);

    const { result } = renderHook(() => useBreederCentral(API_URL, API_KEY));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe("Failed to load animals: 500");
    expect(result.current.animals).toEqual([]);
    expect(result.current.animalImages).toEqual([]);
    expect(result.current.offspringGroups).toEqual([]);
    expect(result.current.offspringImages).toEqual([]);
    expect(localStorage.getItem("breeder-central-animals")).toBeNull();
    expect(localStorage.getItem("breeder-central-offspring-groups")).toBeNull();
  });

  it("refetch clears the cache and reloads from the network", async () => {
    stubFetchMulti([
      { json: ANIMALS },
      { json: OFFSPRING_GROUPS },
      { json: ANIMALS },
      { json: OFFSPRING_GROUPS },
    ]);
    const { result } = renderHook(() => useBreederCentral(API_URL, API_KEY));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetchMock()).toHaveBeenCalledTimes(2);

    result.current.refetch();
    await waitFor(() => expect(fetchMock()).toHaveBeenCalledTimes(4));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.animals).toEqual(ANIMALS);
    expect(result.current.offspringGroups).toEqual(OFFSPRING_GROUPS);
  });

  it("handles animals without images", async () => {
    const bare = [{ id: 3, name: "No Img" }];
    stubFetchMulti([
      { json: bare },
      { json: OFFSPRING_GROUPS },
    ]);

    const { result } = renderHook(() => useBreederCentral(API_URL, API_KEY));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.animals).toEqual(bare);
    expect(result.current.animalImages).toEqual([] as AnimalImage[]);
  });

  it("handles offspring groups without images", async () => {
    const bare = [{
      id: 9,
      name: "No Pics",
      description: null,
      animals: [],
      events: [],
    }];
    stubFetchMulti([
      { json: ANIMALS },
      { json: bare },
    ]);

    const { result } = renderHook(() => useBreederCentral(API_URL, API_KEY));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.offspringGroups).toEqual(bare);
    expect(result.current.offspringImages).toEqual([] as OffspringImage[]);
  });
});