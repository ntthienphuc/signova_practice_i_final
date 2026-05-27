# Signova UI Generation Prompt: Learn Flashcard Page (`learn-page`)

This document outlines the visual specifications and structural requirements for generating a React (TypeScript) component for the **Signova** flashcard/word learning sub-view (`/learn/:unitId/:lessonId` or `/learn/:wordId`). 

This view is directly linked to the `LearnDashboard.tsx` timelines. When a user selects a lesson or a specific vocabulary item from `LEARN_UNITS`, they are redirected here to practice.

---

## 🎨 Global Theme Configurations (Prerequisites)
The layout must strictly adhere to our global dark-tech palette. Do not inject raw light themes. **Transform the white layout in the reference image into our dark theme tokens**:

- **Viewport Background:** `bg-dark-bg`
- **Main Interaction Cards:** `bg-dark-card border border-white/10 rounded-2xl`
- **Primary Highlights & Buttons:** `bg-brand-primary hover:bg-brand-primaryHover text-text-main`
- **Accent Text Elements:** `text-brand-primaryLight`
- **Typography:**
  - Standard Headers & Word Titles: `text-text-main`
  - Explanations & Labels: `text-text-muted`
  - Progress markers: `text-text-hint`
- **Utility Layers:** Overlay a global `.bg-dot-grid` layer across the viewport container.

---

## 📐 Layout Architecture & Data Architecture

### 1. Header Removal & Progress Track Area
- **No Global Header Layout:** Completely omit the navbar from the top of this viewport.
- **Top Linear Progress Bar:** - Render a clean, subtle row containing a tracking label on the left: `Học từ ký hiệu` and a fractional pagination token on the right: `Từ 6 / 6` (use `text-text-hint text-xs`).
  - Below this, render a full-width slim linear tracker tracking step completeness (`w-full bg-white/5 h-1`). The filled indicator must use `bg-brand-primary`.

### 2. Central Active Vocabulary Display
- **Main Heading Label:** Below the track line, display the active target words dynamically: `{VietnameseWord} / {EnglishWord}` in a split layout format. Example: `Nước / Water`. 
  - Style the Vietnamese word with `text-text-main font-bold text-4xl`.
  - Style the English word with `text-brand-primaryLight font-bold text-4xl ml-2`.

- **3-Panel Dashboard Content Layout (Flex Grid Setup):**
  - Arrange three horizontal primary cards with uniform height and matching padding (`p-6`):
    
    1. **Left Card: Dynamic Visual Placeholder / 2D Avatar**
       - Background container mimicking a canvas box (`bg-white/5 border border-white/10 rounded-2xl w-[320px] aspect-square flex items-center justify-center`).
       - Center a subtle, watermark-like textual backdrop placeholder printing the vocabulary title in big dim text (`text-text-hint/20 font-bold text-5xl`).
    
    2. **Middle Card: Demonstration Video Player Container**
       - The core center unit (`w-[400px] rounded-2xl overflow-hidden border border-white/10 relative bg-black`).
       - Display a simulated video frame hosting a sign language interpreter gesture.
       - Center a translucent circle button layer enclosing a video play triangle icon button asset (`bg-black/40 hover:bg-black/60 backdrop-blur-sm text-text-main rounded-full p-4 transition-all scale-110 cursor-pointer`).
       - Add absolute overlay micro-labels at the bottom center: `"Video mẫu"` and `"{Vietnamese} — {English}"`.
    
    3. **Right Card: Contextual Vocabulary Information Metadata Panel**
       - Structural textual element container (`w-[320px] bg-dark-card border border-white/10 rounded-2xl flex flex-col gap-4 text-left`).
       - Display category subtitles: `TỪ TIẾNG VIỆT` followed by the main string (`text-text-main font-bold text-xl`).
       - Display subtitle category: `TIẾNG ANH` followed by the mapped target token (`text-brand-primaryLight font-bold text-xl`).
       - **Metadata Badge Rows:** Render horizontal status badges side-by-side using minimal layouts:
         - Food/Category Badge: `Thực phẩm` (`bg-brand-primary/10 border border-brand-primary/20 text-brand-primaryLight text-xs px-2.5 py-1 rounded-full`).
         - Skill Level Badge: `Sơ cấp` (`bg-brand-teal/10 border border-brand-teal/20 text-brand-tealLight text-xs px-2.5 py-1 rounded-full`).
       - **Instruction Description Area:**
         - Label Header: `MÔ TẢ` (`text-text-hint text-xs font-semibold`).
         - Content Description String: Display movement execution advice dynamically. Example: *"Chữ W (3 ngón) chạm vào cằm hai lần."* using `text-text-muted text-sm leading-relaxed`.

### 3. Footer Control Navigation Triggers
- Below the 3-panel component stack, arrange navigation elements smoothly across a row block:
  - **Left Navigation Trigger:** A secondary back-link layout button (`border border-white/10 hover:bg-white/5 text-text-muted rounded-full px-5 py-2.5 text-sm flex items-center gap-2`). Text format: `← Từ trước`.
  - **Center Paginator Dots Indicator:** Center-align an inline grid tracking carousel progress using standard tracking dots. Ensure the active indicator dot element glows cleanly with `bg-brand-primary`.
  - **Right Direct Link Action Button:** A call-to-action component to instantly enter camera practice mode (`bg-[#00B092] hover:opacity-90 text-white font-bold px-6 py-3 rounded-full text-sm flex items-center gap-2 shadow-lg shadow-[#00B092]/20`). Label format: `🤸 Luyện tập từ này`.
- **Bottom Nav Center Action Trigger:** Positioned centered below the indicator dot array, render a primary stepping button: `Từ tiếp theo →` styled dynamically with standard call-to-action formats (`bg-brand-primary hover:bg-brand-primaryHover text-text-main font-semibold px-8 py-3.5 rounded-full text-sm mt-4 shadow-md shadow-brand-primary/20`).

---

## ⛓️ Routing & State Integration Architecture
- **Source Context Isolation:** Map parameters using data elements hosted in `src/data/learnDashboard.ts` using `LEARN_UNITS`.
- **Dynamic Active Tracking State:** Use React Router hooks (`useParams`) to grab the state of the active selected unit and specific active lesson dynamically. 
- **Navigation Hook Setup:**
  - Inside `LearnDashboard.tsx`, each `Lesson` mapping item row must wrap into a router trigger link pointing directly into the workspace:
    ```tsx
    import { useNavigate } from "react-router-dom";
    // Trigger mapping inside component list triggers:
    const navigate = useNavigate();
    <div onClick={() => navigate(`/learn/${unit.unitNumber}/${index}`)} className="cursor-pointer">
    ```
  - Ensure mock fallbacks are available if a selected lesson index doesn't have words populated inside `LEARN_UNITS` yet so that it pulls a robust placeholder word data structure safely (e.g., fallback to "Nước / Water" mockup object structure if array is empty).

---

## 🎯 Final Prompt Instruction for Claude
*"Please ingest this specification markdown file and build out a clean, pixel-perfect React TypeScript layout for `LearnPage.tsx`. Completely exclude the global navbar header context from this screen view. Ensure the raw white layout from the source visual reference is fully refactored into our custom Tailwind design tokens (`bg-dark-bg`, `bg-dark-card`, `text-text-main`, etc.). Set up safe data integrations linking back to our `LEARN_UNITS` data array maps to support dynamic lesson navigation."*