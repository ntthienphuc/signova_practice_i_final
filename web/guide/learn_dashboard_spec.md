# Signova UI Generation Prompt: Learn Dashboard (`learn-dashboard`)

This document serves as a comprehensive visual spec and prompt for generating a React (TypeScript) component for the **Signova** web application. The layout is inspired by modern gamified e-learning platforms (like Duolingo/Signpost) and tailored to support our deaf/hard-of-hearing sign language learning platform.

---

## 🎨 Global Theme Configurations (Prerequisites)
Ensure the layout utilizes the following pre-defined `AppColors` tokens. Do not hardcode raw hex values outside of these mappings:
- **Primary / Buttons / Active Highlights:** `#0A80FB` (Xanh dương)
- **Primary Light:** `#1BA4FC`
- **Primary Dark:** `#0460F7`
- **Background:** `#000000` or a very dark premium slate/neutral (`#0D0E12`) matching the dark-mode dashboard in the reference image.
- **Surface / Card Fills:** `#16171D` (Dark cards)
- **Text Primary:** `#FFFFFF`
- **Text Secondary / Hints:** `#7A92A6` or `#8AACB8`
- **Borders / Dividers:** `#242631`
- **Accent Colors (For Units):**
  - Unit 1 Banner Fill: `#10B981` (Vibrant Green) or `#22C55E`
  - Unit 2 Banner Fill: `#0EA5E9` (Vibrant Blue/Cyan)
  - Unit 3 Banner Fill: `#F59E0B` (Vibrant Amber/Orange)

---

## 📐 Layout Architecture & Grid Structure
The screen is a 3-column layout embedded inside a global dashboard shell. 
Use a flat CSS grid or flexbox wrappers inside the view component layout (No `body` styles, self-contained within a main container div).

### 1. Left Sidebar (Navigation Layout)
- **Width:** Fixed width (`240px`).
- **Background:** Dark sidebar with an explicit right border separator (`1px solid var(--border)`).
- **Logo Area:** Text or logo styled as **Signova** (Top-left, bold, primary color `#0A80FB`).
- **Nav Menu Items (Vertical Stack):**
  - **Learn** (Active state with a subtle background highlight or left-side accent strip, Font color: `#FFFFFF`)
  - **Challenges**
  - **Quests**
  - **Progress**
  - **Plans**
  - **Changelog**
  - **Educators**
- **Bottom Status Indicator:** A small, pill-shaped indicator badge displaying "Compiling..." or "Connected" with an ambient pulsing dot.

### 2. Center Content Area (Main Learning Timeline)
- **Sizing:** Scrollable fluid flex column occupying the largest central portion.
- **Header Section:**
  - Label: `UNIT 1 • 0/7 LESSONS • IN PROGRESS` (Small uppercase muted typography).
  - Main Title: `The Alphabet` (Large `#FFFFFF` bold text, ~`28px`).
  - Action Button (Top Right alignment): A button labeled `GUIDEBOOK` with a book/document icon, styled with a transparent/outline dark border.
- **Unit Dropdowns & Lesson Accordions:**
  - **Unit 1 Accordion Header:** Full-width rounded card (`border-radius: 12px`) with a bright solid green background (`#22C55E`). Displays `UNIT 1 / The Alphabet / 0/7 lessons`. Includes an arrow icon on the far right indicating its toggle state.
  - **Active Lesson Details (Expanded Sub-Card):**
    - Under the active lesson item, an expanded container opens up displaying detailed descriptions.
    - Title: `Letters A-E (PRACTICE • LESSON 1)`. On the right, a gold star icon and a persistent `CONTINUE` link.
    - Content Text: *"In this unit, you will learn the letters of the alphabet in ASL format. Watch the handshape carefully and try to mirror it as best as possible. While these letters can be helpful for signing things such as names, addresses, or places, you will learn the entirety of the language as you progress through the curriculum."*
    - Call-To-Action Button: `Continue lesson →` (Solid Primary Blue fill `#0A80FB`, bold text, rounded corners).
  - **Subsequent Lesson List Stack (Inactive/Collapsed Rows):**
    - Render dark list cards with very subtle borders (`#242631`). Each item features a play/quiz icon, title text, and subtitle metadata:
      - `Letters F-J (PRACTICE • LESSON 2)`
      - `Letters K-O (PRACTICE • LESSON 3)`
      - `Letters P-T (PRACTICE • LESSON 4)`
      - `Letters U-Z (PRACTICE • LESSON 5)`
      - `Practice: Short Words (PRACTICE • LESSON 6)`
      - `Quiz: A-J (QUIZ • LESSON 7)` (Uses a question-mark/help icon instead of play).
  - **Upcoming Units (Collapsed Bottom Stacks):**
    - **Unit 2 Card Header:** Cyan/Blue header block (`#0EA5E9`), labeled `UNIT 2 / Numbers / 0/4 lessons`.
    - **Unit 3 Card Header:** Orange/Amber header block (`#F59E0B`), labeled `UNIT 3 / Real World Spelling / 0/4 lessons`.

### 3. Right Sidebar (Analytics & Progress Panels)
- **Width:** Fixed width (`300px` to `320px`).
- **Composition:** A vertical stack of individual modular dash-cards (`#16171D`) with subtle spacing:
  - **Panel 1: Streak Tracker**
    - Header: Flame icon + `STREAK`
    - Main Number: `0` (Large bold font) with subtitle text `days in a row`.
    - Weekdays Indicator Grid: Single-letter day buttons `[M] [T] [W] [T] [F] [S] [S]` displayed horizontally with dark unselected indicators.
  - **Panel 2: Daily Goal Progress**
    - Header: Lightning bolt icon + `DAILY GOAL`
    - Metric text: `0 / 50 XP` alongside a `0%` tracker.
    - Progress Bar: A clean, horizontal tracking bar component (dark grey background, 0% filled state).
    - Footer Text: *"Keep practicing to hit today's goal."*
  - **Panel 3: Level Metrics**
    - Header: Star icon + `LEVEL 1`
    - Metric text: `0 total XP`
    - Subtitle Text: `1,000 XP to Level 2` underneath a matching full-width empty progress bar.
  - **Panel 4: Horizontal Grid Split**
    - Two smaller sub-cards placed side-by-side:
      - Card Left: Header `LESSONS DONE`, value `0` (centered, bold text).
      - Card Right: Header `UNITS`, value `18` (centered, bold text).

---

## 🛠️ Engineering & Implementation Constraints
- **Framework & Language:** React, TypeScript (`.tsx`).
- **Styling Method:** Use custom CSS modules or Tailwind CSS classes. Adhere to a modular flex/block system. **Do not use Flex or Grid at the root body tag level** to preserve structure predictability.
- **Icon Assets:** Utilize a reliable icon library like `lucide-react` or `react-icons` to stand in for all icons (Play, Book, Flame, Bolt, Star, Chevron, Help, etc.).
- **State Structure:** - Provide a dynamic `useState` hook toggle for handling the collapse/expansion transitions of the Unit and Lesson accordions.
  - Ensure individual sections use isolated component files or clear sectioned sub-components following our Page-Driven structural architecture rules.
- **Component Isolation:** Place this dashboard layout component within `src/pages/LearnDashboard/LearnDashboard.tsx`. Any internal child structures (e.g., `StreakPanel`, `LessonRow`) should live cleanly inside `src/pages/LearnDashboard/components/`.

---

## 🎯 Final Prompt Instruction for Claude
*"Please read this markdown specification file along with my existing color tokens, and generate a fully responsive, pixel-perfect, clean React TypeScript page component for `LearnDashboard`. Organize the code structure with embedded section sub-components to ensure zero overlapping conflicts. Ensure all typography alignments, layout margins, and dark-mode surface balances closely match the modular UI guidelines described above."*
