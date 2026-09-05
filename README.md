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
import { ImageDisplay } from "@breeder-central/ui";
```

## Components

- `ImageDisplay` — responsive image container (`src/components/ImageDisplay/`). Takes a required `imageUrl` plus optional `center` focal point (`[x, y]` percentages, default `[50, 50]`), `objectFit` (`cover` | `contain`), and `alt` (required for accessibility).

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