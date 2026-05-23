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

`router.tsx` defines four top-level routes:

| Path | Component | Notes |
|---|---|---|
| `/` | `LandingLayout` → `LandingPage` | Navbar persists via layout |
| `/practice` | `PracticePage` | Main production app |
| `/learn-dashboard` | `PracticePage` | Same component, alias route |
| `/learn/:topicId/:wordOrder` | `LearnWordPage` | Word-level learn + Practice I cycle |

`LandingLayout` owns the `locale` state (`"vi" | "en"`) and passes it via `useOutletContext<LandingOutletContext>()`. Landing child pages must call `useOutletContext` to get the locale.

## Two-Component Architecture

**`App.tsx`** is a legacy debug/lab tool for raw API access. It renders `ControlPanel` + `StagePanel` and owns file upload, direct analyze calls, and the skeleton overlay playback loop. It is accessible at `/practice` only if you wire the router to it — currently the router points `/practice` to `PracticePage`.

**`PracticePage.tsx`** is the production app. It:
- Manages auth (JWT in `localStorage` as `signova_token`), user roles, and role-based tab visibility.
- Boots by calling `GET /app-config` and `GET /curriculum` in parallel.
- Renders a `Sidebar` (tab nav + curriculum overview) and a `<main>` that switches between tabs.
- Drives the full learning session state machine (see Session Flow below).

## Auth System

Token stored in `localStorage` under key `signova_token`. `createApiClient` in `client.ts` injects `Authorization: Bearer <token>` via an Axios request interceptor on every call. There is no shared singleton that needs resetting — a fresh client is created per `createApiClient(baseUrl)` call, each reading the token from localStorage at call time.

User roles: `learner` | `parent` | `school`. Role determines which tabs the Sidebar renders:
- **learner** — Học, Luyện tập, Tiến độ, Tài khoản
- **parent** — Dashboard Gia đình, Tiến độ con, Tài khoản
- **school** — Dashboard Trường học, Gói học tùy chỉnh, Tài khoản
- **guest** — Học, Đăng nhập

`AppTab` union: `"learn" | "review" | "progress" | "family" | "school" | "account" | "custom_package"`.

## LearnWordPage (`src/pages/LearnWordPage.tsx`)

Standalone page at `/learn/:topicId/:wordOrder` that handles the per-word learn → practice cycle outside of `PracticePage`. It:
- Loads curriculum independently via `loadCurriculum()` on mount.
- Has a local two-stage state machine: `"learn"` → `"practice"`.
- `learn` → renders `StudyStage`; user clicks "Start Practice" → transitions to `"practice"`.
- `practice` → renders `PracticeWorkspace` (mode `practice_i`); on complete → navigates to next word URL or back to `/learn-dashboard` when the topic is finished.
- Word navigation is URL-driven: `navigate(`/learn/${topic.id}/${index}`)`. A `useEffect` on `[topicId, wordOrder]` resets local stage back to `"learn"` on each URL change.
- Completion at the last word navigates to `/learn-dashboard`; "Back to topics" also navigates to `/learn-dashboard`.

`TopicGrid` triggers this flow by calling `navigate(`/learn/${topic.id}/${targetIndex}`)` when the user clicks "Bắt đầu học topic" or "Học lại topic này".

## Session Flow (`PracticeSession`)

`PracticeSession` is the state machine for a learner's in-progress topic inside `PracticePage`. Its intended stages (`SessionStage`):

```
learn → practice_i → (word 4) → quiz_intro (scope=5) → practice_ii → learn (word 5)
      → practice_i → ... → quiz_intro (scope=10) → practice_ii → summary
```

**Current state**: the `learn`, `practice_i`, `quiz_intro`, and `practice_ii` branches inside `LearnTab` are commented out. The per-word learn + Practice I cycle is now handled by `LearnWordPage` (URL navigation). `LearnTab` currently only renders:
- No session → `TopicGrid`
- `summary` stage → `TopicSummary`
- All other stages → `null`

`quizQueue`, `quizRoundIndex`, `practiceResults`, `quiz5Results`, `finalQuizResults` are still defined on the session object but not yet wired to any active UI.

## API Layer (`src/api/`)

All API calls go through the `apiClient` singleton defined in `client.ts`. The base URL is set once from `VITE_API_BASE_URL` (falls back to the HF Spaces backend) and exported as `BASE_URL`. No runtime `apiBase` state exists anywhere — components do not accept or pass a base URL.

The `createApiClient(baseUrl)` factory is still exported for cases where a one-off client with a different base is needed, but all production endpoints use the singleton.

All TypeScript interfaces for the backend contract are in `api/types.ts`. Import everything through the barrel `api/index.ts`. `handleAxiosError` is typed `never` — it always throws.

### Key API endpoints

| Method | Path | Notes |
|---|---|---|
| `GET` | `/app-config` | `AppConfig` with gloss list + curriculum topic summaries |
| `GET` | `/curriculum` | `DashboardPayload { topics: Topic[] }` |
| `GET` | `/practice-i/task/random` | `RandomTask` |
| `GET` | `/practice-ii/task/random?lesson_size=N` | `RandomTask` with lesson set |
| `POST` | `/practice-i/analyze-video` | multipart, returns `AnalyzeResponse` |
| `POST` | `/practice-ii/analyze-video` | same shape + classifier |
| `GET` | `/vocabulary/:gloss` | `StudyMetadata` for a single gloss |
| `POST` | `/auth/register` | `{ username, password, role }` |
| `POST` | `/auth/login` | form-encoded, returns `{ access_token }` |
| `GET` | `/auth/me` | current user object |
| `POST` | `/auth/update-profile` | role-specific profile fields |
| `GET` | `/progress/review-words` | words learner has practiced, sorted by fail count |
| `GET` | `/dashboard/learner/:id` | XP, streak, badges, topic progress, recent attempts |
| `GET` | `/dashboard/parent` | linked learners with their stats |
| `GET` | `/dashboard/school` | linked students with class/code info |
| `GET` | `/links/search-learner?query=` | learner autocomplete |
| `POST` | `/links/parent/request` | parent sends link request to learner |
| `POST` | `/links/school/request` | school sends link request to learner |
| `GET` | `/links/pending` | learner sees pending approval requests |
| `POST` | `/links/parent/:id/approve` | learner approves parent link |
| `POST` | `/links/school/:id/approve` | learner approves school link |

Fixed form params sent with every analyze call: `frame_stride=2`, `auto_segment=true`, `segment_min_frames=12`, `segment_pad_frames=8`, `overlay_frame_count=32`, `return_visualization=false`.

## Overlay System (`overlay.ts`)

`normalizeAnalysis(raw)` converts the raw `AnalyzeResponse` into `NormalizedAnalysis`:
- Resolves relative video URLs against `apiClient.defaults.baseURL`
- Normalizes `segment_start_ms` / `segment_end_ms` from either field name variant
- Builds `badByFrame: Set<number>[]` — one Set per frame, containing bad joint indices
- Falls back to `visualization.joint_status` when `bad_joint_indices` is absent

`drawOverlay()` maps normalized `[0,1]` joint coordinates to canvas pixels using letterbox math (`getVideoContentBox`). Bad joints/edges render in `focusEdge`/`focusJoint` colors; good ones use `baseEdge`/`baseJoint`. DPR scaling is applied on each draw.

`FrameData` union: frames can arrive as `{ points: FramePoints }` or bare `FramePoints`. `drawOverlay` normalizes both.

## CSS Strategy

`styles.css` contains both the practice-app custom CSS classes and the Tailwind directives. Tailwind is configured with `corePlugins: { preflight: false }` — **do not remove this** or Tailwind's reset will break the practice-app styles.

Practice app → hand-authored CSS classes (`.app-shell`, `.sidebar`, `.flow-shell`, `.flow-main`, `.card-surface`, `.hero-panel`, `.eyebrow`, `.muted`, `.field`, `.primary-button`, `.ghost-button`, `.nav-tab`, `.learn-immersive-main`, etc.).

Landing page + original Learn pages → Tailwind exclusively.

`PracticePage` uses two layout modes toggled by `immersiveStage`:
- `false` → `flow-shell` with `Sidebar` + `flow-main`
- `true` (during word learn/practice stages) → `app-shell app-shell-learn-immersive` + `learn-immersive-main` (no sidebar)

Custom utility classes defined in `@layer utilities`: `.bg-dot-grid`, `.custom-scrollbar`.

### Tailwind theme tokens (`tailwind.config.js`)

| Token | Value | Usage |
|---|---|---|
| `dark-bg` | `#020617` | Dark page backgrounds |
| `brand-primary` | `#0284c7` | Buttons, progress fills |
| `brand-primaryHover` | `#0ea5e9` | Hover state |
| `brand-primaryLight` | `#7dd3fc` | Accent text |
| `brand-teal` / `brand-tealLight` | `#0d9488` / `#2dd4bf` | Difficulty badges |
| `text-main` | `#ffffff` | Primary text on dark |
| `text-muted` | `#94a3b8` | Secondary text |
| `text-hint` | `#64748b` | Labels, hints |

## Data Files (`src/data/`)

- `learnDashboardData.ts` — `LEARN_UNITS: Unit[]` for the old static LearnDashboard (not the main learning flow)
- `learnData.ts` — `words` array for the old static LearnPage
- `practiceData.ts` — static reference data for the practice tool
- `familyDashboardData.ts`, `schoolDashboardData.ts` — placeholder/mock data

The live curriculum comes from `GET /curriculum` at runtime, not from these files. The old static pages (`LearnDashboard.tsx`, `LearnPage.tsx`) are no longer in the router and are effectively unused.

## Key Gotchas

**React 19 ref types** — `useRef<T>(null)` returns `RefObject<T | null>`. Props accepting refs must be typed as `RefObject<HTMLVideoElement | null>`.

**Single API client** — all endpoints (`loadAppConfig`, `loadCurriculum`, `createRandomTask`, `analyzeAttempt`) and auth functions use the `apiClient` singleton from `client.ts`. The base URL is set once at module load time from `VITE_API_BASE_URL`. Do not pass `apiBase` as a prop or parameter — read `apiClient.defaults.baseURL` directly if a component needs the URL for resolving relative paths.

**Auth token** — `createApiClient` reads `localStorage.getItem("signova_token")` at request time via interceptor, so creating the client before login is safe — the token will be present by the time the request fires.

**Page specs** — UI generation specs for new pages live in `guide/`. Read the relevant spec before implementing a new page.

**`.jsx` legacy components** — some older components use `.jsx` not `.tsx`. Do not convert them unless also updating all their imports and type annotations.
