# @breeder-central/ui

A publishable React component library for Breeder Central, built with Vite (library mode), TypeScript, CSS Modules, Storybook, and Vitest.

> Library shell — components are added under `src/components/`, exported from `src/index.ts`, and picked up automatically by the build, Storybook, and Vitest.

## Install

```bash
npm install @breeder-central/ui
```

Requires `react` and `react-dom` (v18 or v19) as peer dependencies.

## Usage

Import from the package root. CSS Modules styles shipped with a component are injected automatically — no separate CSS import needed. If you need to import a stylesheet manually, use `import "@breeder-central/ui/styles.css";`.

```tsx
import { BreederCentralImage } from "@breeder-central/ui";
```

## Components

- `BreederCentralImage` — responsive image container (`src/components/BreederCentralImage/`). Takes a required `imageUrl` plus optional `center` focal point (`[x, y]` percentages, default `[50, 50]`), `objectFit` (`cover` | `contain`), and `alt` (required for accessibility).

## Hooks

- `useBreederCentral(apiUrl, apiKey)` — loads animals from `GET {apiUrl}/functions/v1/cdn_get_animals` and offspring groups from `GET {apiUrl}/functions/v1/cdn_get_offspring`, both with an `x-api-key` header, and returns `{ animals, animalImages, offspringGroups, loading, error, refetch }`. Results are cached in `localStorage` for 1 hour; `refetch()` clears both caches and reloads from the network. `animalImages` is the flattened list of images across all animals.
- `requestAnimals(apiUrl, apiKey)` and `requestOffspringGroups(apiUrl, apiKey)` — the underlying fetch helpers (throw on non-2xx responses or unexpected response shapes).
- For manual testing, the `Hooks/useBreederCentral` Storybook story renders a live harness where you can set `apiUrl`/`apiKey` via controls and exercise loading, error, data, and `refetch` without code changes.

## Utilities

- `cx` — small class-name joiner utility (`src/utils/cx.ts`)

## Development

```bash
npm install
npm run storybook        # component playground (http://localhost:6006)
npm run test             # Vitest suite
npm run build            # library build → dist/ (es + cjs + d.ts, CSS injected)
npm run typecheck        # TypeScript check
```

## Adding a component

Create a folder `src/components/<Name>/` with your component, a CSS Modules stylesheet, a `.stories.tsx` (for Storybook), and a `.test.tsx` (for Vitest). Export the component from `src/index.ts`.

## Publishing

```bash
npm run build
npm publish              # publishConfig.access = "public"
```