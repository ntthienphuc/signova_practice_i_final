# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Vite dev server (default http://localhost:5173)
npm run build        # TypeScript check + Vite production bundle
npm run preview      # Preview the production build locally
npx tsc --noEmit     # Type-check only, no output
```

No test runner is configured. Type checking and build are the verification path.

## Tech Stack

React 19 · TypeScript · Vite 5 · Tailwind CSS v3 · Axios

## Architecture

### Two apps share one `main.tsx`

Currently `main.tsx` renders only `<App />` (the practice app). The landing page (`pages/LandingPage.tsx`) exists but routing is not yet wired — React Router integration is pending.

### Practice app (`App.tsx` + `components/`)

`App.tsx` owns all state and event handlers; it renders two purely presentational subtrees:

- **`ControlPanel`** (aside) — `TaskCard` → `UploadCard` → `ResultStrip`
- **`StagePanel`** (main) — `VideoPanel` (×2, user + reference), `TransportBar`, `FeedbackGrid`

Video playback is synchronized manually: the API response includes `segment.start_ms` / `segment.end_ms` for the user clip and `reference.segment` for the reference clip. `App.tsx` seeks both `<video>` elements to those windows and redraws canvas overlays on each `timeupdate` event.

### API layer (`src/api/`)

The API base URL is user-controlled state in `App.tsx`, so every call creates a fresh Axios instance:

```ts
// client.ts
createApiClient(baseUrl)   // returns AxiosInstance with trailing-slash normalized base
handleAxiosError(error)    // never return — always throws; mirrors original fetch behavior
```

Endpoints live in `api/endpoints/`. All TypeScript interfaces for the API contract are in `api/types.ts`. Import everything through the barrel `api/index.ts`.

### Landing page (`pages/LandingPage.tsx` + `components/landing/`)

Nine data-driven sections assembled in `LandingPage`. Each section component accepts a typed `data` prop — no API calls, pure render. Sample data lives in `data/landingData.ts` as a `vi` (Vietnamese) locale object; the `LandingData` type is in `types/landing.ts`.

The `Navbar` component is intentionally excluded from `LandingPage` — it is meant to be rendered by the router layout so it persists across page transitions.

### CSS strategy

`styles.css` contains both the existing practice-app custom CSS and the Tailwind directives (`@tailwind base/components/utilities`). Tailwind is configured with `corePlugins: { preflight: false }` — this is critical to prevent Tailwind's CSS reset from breaking the practice-app styles (`.app-shell`, `.control-panel`, etc.).

## Key Gotchas

**React 19 ref types** — `useRef<T>(null)` returns `RefObject<T | null>`, not `RefObject<T>`. Props that accept refs must be typed as `RefObject<HTMLVideoElement | null>` or `RefObject<HTMLCanvasElement | null>`.

**`FrameData` union** — `type FrameData = { points: FramePoints } | FramePoints`. The API can return frames as either a wrapped object or a bare array; `overlay.ts` normalizes both before drawing.

**`handleAxiosError` is typed `never`** — it always throws, which lets async functions satisfy TypeScript's return-type check without a trailing `return undefined`.
