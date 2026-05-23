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

React 18 · TypeScript · Vite 5 · Tailwind CSS v3 · Axios · React Router v7

## Routing

`router.tsx` defines two top-level routes via `createBrowserRouter`:

- `/` — `LandingLayout` (wraps `Navbar` + `<Outlet>`), renders `LandingPage` as the index child.
- `/practice` — `App` (the sign-language practice tool), rendered standalone with no layout wrapper.

`LandingLayout` owns the `locale` state (`"vi" | "en"`) and passes it down via `useOutletContext<LandingOutletContext>()`. All landing child pages must call `useOutletContext` to get the locale.

## Practice App (`App.tsx`)

`App.tsx` is the single stateful root for the practice tool. It owns all state and refs, and renders two purely presentational subtrees:

- **`ControlPanel`** (aside, 360 px fixed) — `TaskCard` → `UploadCard` → `ResultStrip`
- **`StagePanel`** (main) — dual `VideoPanel` (user + reference), `TransportBar`, `FeedbackGrid`

**Video + overlay loop**: After analysis, `App.tsx` runs a `requestAnimationFrame` loop that calls `drawOverlay()` on every tick. Both `<video>` elements are seeked to their segment windows and their `playbackRate` is adjusted so they finish simultaneously regardless of differing segment lengths. The loop watches `playing` state to auto-pause at segment end.

**API base URL** is runtime user-controlled state in `App.tsx` (default `http://127.0.0.1:8014`). A fresh Axios instance is created per call via `createApiClient(baseUrl)` — there is no shared singleton client.

## Landing Page (`LandingPage.tsx`)

Nine section components assembled in order: `Hero`, `ProblemStatement`, `Features`, `Products`, `TargetUsers`, `Pricing`, `ValueProps` (in `<main>`), then `CTAFooter`. Each accepts a typed `data` prop — no API calls, pure render.

Sample data lives in `data/landingData.ts` as a bilingual object keyed `vi` / `en`. The `LandingData` type is in `types/landing.ts`. `Navbar` is excluded from `LandingPage` — it lives in `LandingLayout` so it persists across future child routes.

## API Layer (`src/api/`)

All TypeScript interfaces for the backend contract are in `api/types.ts`. Import everything through the barrel `api/index.ts`.

`handleAxiosError` is typed `never` — it always throws, so async functions satisfy TypeScript's return type without a trailing `return undefined`.

Key API endpoints:
- `GET /practice-i/task/random` — returns `RandomTask`
- `GET /practice-ii/task/random?lesson_size=N` — returns `RandomTask` with a lesson set
- `POST /practice-i/analyze-video` (multipart) — returns `AnalyzeResponse`
- `POST /practice-ii/analyze-video` (multipart) — same shape, adds classifier decision

Fixed form params sent with every analyze call: `frame_stride=2`, `auto_segment=true`, `segment_min_frames=12`, `segment_pad_frames=8`, `overlay_frame_count=32`, `return_visualization=false`.

## Overlay System (`overlay.ts`)

`normalizeAnalysis(raw, apiBase)` converts the raw `AnalyzeResponse` into `NormalizedAnalysis`:
- Resolves relative video URLs against `apiBase`
- Normalizes `segment_start_ms` / `segment_end_ms` from either field name variant
- Builds `badByFrame: Set<number>[]` — one Set per frame, containing bad joint indices
- Falls back to `visualization.joint_status` when `bad_joint_indices` is absent

`drawOverlay()` maps normalized `[0,1]` joint coordinates to canvas pixels using letterbox math (`getVideoContentBox`). Bad joints/edges render in `focusEdge`/`focusJoint` colors; good ones use `baseEdge`/`baseJoint`. DPR scaling is applied on each draw.

`FrameData` union: frames can arrive as `{ points: FramePoints }` or bare `FramePoints`. `drawOverlay` normalizes both.

## CSS Strategy

`styles.css` contains both the practice-app custom CSS classes (`.app-shell`, `.control-panel`, `.video-shell`, etc.) and the Tailwind directives. Tailwind is configured with `corePlugins: { preflight: false }` — **do not remove this** or Tailwind's reset will break the practice-app styles.

Custom utility classes defined in `@layer utilities`: `.bg-dot-grid`, `.custom-scrollbar`.

Landing page components use Tailwind exclusively. Practice app components use the hand-authored CSS classes in `styles.css`.

## Key Gotchas

**React 19 ref types** — `useRef<T>(null)` returns `RefObject<T | null>`. Props accepting refs must be typed as `RefObject<HTMLVideoElement | null>` (not `RefObject<HTMLVideoElement>`).

**No icon library installed** — `lucide-react` is not in `package.json`. Install it before using icon components: `npm install lucide-react`.

**Page specs** — UI generation specs for new dashboard pages live in `guide/`. Read the relevant spec before implementing a new page.
