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

React 18 · TypeScript · Vite 5 · Tailwind CSS v3 · Axios · React Router v7 · lucide-react

## Routing

`router.tsx` defines four top-level routes via `createBrowserRouter`:

| Path | Component | Notes |
|---|---|---|
| `/` | `LandingLayout` → `LandingPage` | Navbar persists via layout |
| `/practice` | `App` | Standalone, no layout wrapper |
| `/learn` | `LearnDashboard` | 3-column gamified dashboard |
| `/learn/:unitId/:lessonId` | `LearnPage` | Flashcard word view |

`LandingLayout` owns the `locale` state (`"vi" | "en"`) and passes it down via `useOutletContext<LandingOutletContext>()`. All landing child pages must call `useOutletContext` to get the locale.

## Component & Data Conventions

### Component folders by feature
- `components/` — practice app components (`ControlPanel`, `StagePanel`, etc.)
- `components/landing/` — landing page section components
- `components/learn-dashboard/` — LearnDashboard sub-components
- `components/learn/` — LearnPage sub-components (`AvatarCard`, `VideoCard`, `MetaCard`)

Pages are flat files directly in `pages/` (`LearnDashboard.tsx`, `LearnPage.tsx`, etc.).

### Data files (`src/data/`)
- `learnDashboardData.ts` — exports `LEARN_UNITS: Unit[]` and types `Unit`, `Lesson`, `LessonType`. Single source of truth for the unit/lesson tree.
- `learnData.ts` — exports `words` array (Vietnamese vocabulary with images, descriptions, difficulty) used by `LearnPage` for flashcard content.
- `landingData.ts` — bilingual `vi`/`en` content for the landing page. `LandingData` type is in `types/landing.ts`.

## Practice App (`App.tsx`)

`App.tsx` is the single stateful root for the practice tool. It owns all state and refs, and renders two purely presentational subtrees:

- **`ControlPanel`** (aside, 360 px fixed) — `TaskCard` → `UploadCard` → `ResultStrip`
- **`StagePanel`** (main) — dual `VideoPanel` (user + reference), `TransportBar`, `FeedbackGrid`

**Video + overlay loop**: After analysis, `App.tsx` runs a `requestAnimationFrame` loop that calls `drawOverlay()` on every tick. Both `<video>` elements are seeked to their segment windows and their `playbackRate` is adjusted so they finish simultaneously regardless of differing segment lengths. The loop watches `playing` state to auto-pause at segment end.

**API base URL** is runtime user-controlled state in `App.tsx` (default `http://127.0.0.1:8014`). A fresh Axios instance is created per call via `createApiClient(baseUrl)` — there is no shared singleton client.

## Learn Dashboard (`LearnDashboard.tsx`)

Light-theme 3-column layout (`bg-gray-50`):
- **Left** — `LeftSidebar` (240 px, `bg-white`): logo, nav items, connected status pill.
- **Center** — `MainContent`: progress header, unit accordions. `expandedUnit` state lives here; only one unit open at a time.
- **Right** — `RightSidebar` (288 px): `StreakPanel`, `DailyGoalPanel`, `LevelPanel`, `StatsGrid`.

`UnitAccordion` receives a full `Unit` object from `LEARN_UNITS`. When expanded it shows the active lesson card (hardcoded Lesson 1 / A-E) plus `LessonRow` components for remaining lessons. `LessonRow` has local expand state showing a description + "Start" CTA that navigates to `/learn/:unitNumber/:lessonIndex`.

## Learn Page (`LearnPage.tsx`)

Dark-theme flashcard view (`bg-dark-bg` + `.bg-dot-grid` overlay). Uses `useParams` to read `unitId` and `lessonId`; maps `lessonId` to an index into `words` from `learnData.ts` (clamped, so any out-of-range value is safe).

Layout:
1. **Progress track** — label + `Từ N / total` fraction + slim `bg-brand-primary` fill bar.
2. **Word title** — `{word.vi}` (`text-text-main`) + `/` + `{word.en}` (`text-brand-primaryLight`).
3. **3-panel row** — `AvatarCard` (image or dim watermark) | `VideoCard` (placeholder with play button) | `MetaCard` (badges, description).
4. **Footer** — prev button + dot navigator + "Luyện tập từ này" practice CTA + "Từ tiếp theo →" next button. Navigation calls `useNavigate` to `/learn/:unitId/:newIndex`.

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

Practice app → hand-authored CSS classes. Landing page + Learn pages → Tailwind exclusively.

### Tailwind theme tokens (defined in `tailwind.config.js`)
| Token | Value | Usage |
|---|---|---|
| `dark-bg` | `#020617` | LearnPage viewport background |
| `dark-sidebar` | `#090d16` | Dark sidebar variant |
| `dark-card` | `rgba(255,255,255,0.04)` | Dark glassmorphism cards |
| `brand-primary` | `#0284c7` | Buttons, progress fills |
| `brand-primaryHover` | `#0ea5e9` | Hover state |
| `brand-primaryLight` | `#7dd3fc` | Accent text |
| `brand-teal` / `brand-tealLight` | `#0d9488` / `#2dd4bf` | Difficulty badges |
| `text-main` | `#ffffff` | Primary text |
| `text-muted` | `#94a3b8` | Secondary text |
| `text-hint` | `#64748b` | Labels, hints |

## Key Gotchas

**React 19 ref types** — `useRef<T>(null)` returns `RefObject<T | null>`. Props accepting refs must be typed as `RefObject<HTMLVideoElement | null>` (not `RefObject<HTMLVideoElement>`).

**`words` image field** — `words[i].image` is `string | null`. Words without images (Study, Water) have `null`; components must handle both.

**Page specs** — UI generation specs for new pages live in `guide/`. Read the relevant spec before implementing a new page.
