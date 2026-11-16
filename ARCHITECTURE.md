# 🏛️ Architecture Guide — Pegadaian Championship Hub

> **Target Audience**: Junior Software Engineers, Full-Stack Contributors, and Autonomous AI Agents.  
> **Last Updated**: November 2026

---

## 1. System Overview

Pegadaian Championship Hub is a **zero-bundler, native ES Modules Single Page Application (SPA)** backed by a **Node.js Express REST API** and an **Axios/Cheerio Web Scraping Engine**.

It serves two primary purposes:
1. **Official Data Hub**: Visualizes live tournament standings, 27 matchweeks of fixtures, match statistics, team form trajectories, and head-to-head records.
2. **Interactive Tournament Simulator**: Allows users and analysts to forecast match outcomes across Putaran 2 and Putaran 3, computing real-time standings and qualification outcomes according to official **PSSI 2026/27 Tournament Regulations (Pasal 7)**.

```
┌─────────────────────────────────┐
│     PT Liga Indonesia Baru      │ (ligaindonesiabaru.com)
└────────────────┬────────────────┘
                 │ HTTP GET (Cheerio Scraping)
                 ▼
┌─────────────────────────────────┐
│    scrapers/scraper-*.js        │ (Standings & Fixtures Extractor)
└────────────────┬────────────────┘
                 │ Atomic File Write
                 ▼
┌─────────────────────────────────┐
│       data/*.json               │ (klasemen.json & jadwal_dan_hasil.json)
└────────────────┬────────────────┘
                 │ File Read / Cache
                 ▼
┌─────────────────────────────────┐
│          server.js              │ (Express 5 REST API + Static Server)
└────────────────┬────────────────┘
                 │ JSON HTTP Responses
                 ▼
┌─────────────────────────────────┐
│       public/js/main.js         │ (SPA Orchestrator)
└───────┬─────────────────────────┘
        ├───────────────┬──────────────────────────┐
        ▼               ▼                          ▼
 ┌──────────────┐ ┌──────────────┐          ┌──────────────┐
 │   state.js   │ │  router.js   │          │simulation.js │
 └──────┬───────┘ └──────┬───────┘          └──────┬───────┘
        │                │                         │ LocalStorage
        ▼                ▼                         ▼
 ┌──────────────┐ ┌──────────────┐          ┌──────────────┐
 │ standings.js │ │ fixtures.js  │          │ localStorage │
 │ stats.js     │ │ progression- │          └──────────────┘
 │              │ │ chart.js     │
 └──────────────┘ └──────────────┘
```

---

## 2. End-to-End Data Flow

### Step 1: Ingestion (Scrapers)
- **`scrapers/scraper-standings.js`**: Fetches the official league standings page via Axios. Cheerio parses the table structure, team names, official logos, points, goal difference, and point penalties. Output written to `data/klasemen.json`.
- **`scrapers/scraper-fixtures.js`**: Iterates through matchweeks (Pekan 1 through 27) on the PT LIB website. Extracts match dates, kickoff times, venue/stadium names, home/away clubs, scores, and match statuses (`FT`, `UPCOMING`). Output written to `data/jadwal_dan_hasil.json`.

### Step 2: Storage Layer (`data/*.json`)
- Simple, versionable flat JSON files act as the single source of truth for the baseline actual data.
- Read synchronously with graceful fallback objects if files are missing or uninitialized.

### Step 3: API Layer (`server.js`)
- Exposes read-only JSON endpoints for the frontend:
  - `/api/standings` & `/api/klasemen`: Serves group standings.
  - `/api/fixtures` & `/api/jadwal`: Serves all matchweeks.
- Exposes administrative endpoints protected with `crypto.timingSafeEqual`:
  - `/api/refresh-standings`: Executes standings scraper on demand.
  - `/api/refresh-fixtures`: Executes fixtures scraper on demand.

### Step 4: Client State Hydration (`main.js` & `state.js`)
- On application boot (`DOMContentLoaded`), `main.js` issues concurrent `fetch()` requests to the standings and fixtures APIs.
- The raw responses hydrate the read-only global `state` in `public/js/modules/state.js`.
- The hash router (`public/js/modules/router.js`) resolves the active URL hash (`#standings`, `#fixtures`, `#stats`, or `#simulation`) and triggers the corresponding module renderer.

### Step 5: DOM Rendering & Reactive UI
- Modules render clean, semantic HTML directly into container divs using ES6 template literals.
- Event listeners are attached post-render using event delegation or scoped query selectors.

---

## 3. Tournament Regulation Rules Implemented

All standings and tournament logic strictly follow the **Regulasi Pegadaian Championship 2026/27 (Pasal 7)**.

### A. 6-Tier Head-to-Head Tie-Breaker Hierarchy
When two or more teams have identical total points, rank resolution executes the following order:
1. **Total Points** (`poin`)
2. **Head-to-Head Points** among the tied teams (`h2hPts`)
3. **Head-to-Head Goal Difference** among the tied teams (`h2hGD`)
4. **Head-to-Head Goals Scored** among the tied teams (`h2hGF`)
5. **Overall Goal Difference** (`selisihGol`)
6. **Overall Goals Scored** (`golMemasukkan`)
7. **Disciplinary Points / Fair Play** (fewer yellow/red cards)
8. **Drawing of Lots** (Undian PSSI)

*Implementation location*: `public/js/modules/simulation.js` (`resolveOfficialStandingsTies` & `resolveTieCohort`) and `tests/test_exact_matches.js`.

### B. Round 3 (Putaran 3) Scheduling Principles
Based on **Pasal 7 Ayat 3 Bagian III & IV**:
- Matches in Putaran 1 and Putaran 2 are a double round-robin (Home & Away, 18 weeks total).
- Putaran 3 is a single round-robin (9 weeks, Pekan 19 through 27).
- **Home Advantage Privilege**:
  - Teams finishing **Rank 1 to 5** at the end of Putaran 2 receive **5 Home matches and 4 Away matches**.
  - Teams finishing **Rank 6 to 10** receive **4 Home matches and 5 Away matches**.

### C. Grup A Special Clause: Ramadhan PERSIRAJA Banda Aceh
According to **Pasal 7 Ayat 3 Bagian IV & Lampiran Regulasi**:
- Because the holy month of Ramadhan coincides with the start of Putaran 3, **PERSIRAJA Banda Aceh is granted a regulatory exemption to play AWAY in the first 3 matchweeks: Pekan 19, Pekan 20, and Pekan 21**.
- There are **10 exact, deterministic schedules (Skenario `a` through `j`)** depending on PERSIRAJA's exact finish rank (1st through 10th) at the conclusion of Putaran 2.
- For **Grup B**, the competition uses the standard regulatory matrix (`STANDARD_MATRIX`).

*Implementation location*: `public/js/modules/round3-regulasi.js`.

---

## 4. Module Map

### Frontend JavaScript (`public/js/`)

| File | Purpose | Key Exports / Responsibilities |
| :--- | :--- | :--- |
| `main.js` | SPA Entrypoint | Bootstraps app, fetches `/api/standings` and `/api/fixtures`, attaches global header/footer listeners, initializes router. |
| `modules/state.js` | Global Read-Only State | Stores official standings, fixtures, active filters (`selectedGroup`, `currentWeek`), and user view preferences. |
| `modules/router.js` | Hash Router | Manages `#standings`, `#fixtures`, `#stats`, and `#simulation` navigation, updates active navbar pills, handles browser history. |
| `modules/standings.js` | Standings View | Renders multi-group standings tables, promotion/relegation cutoff highlights, form badges, and H2H resolution. |
| `modules/fixtures.js` | Fixtures View | Renders matchweek carousel (Weeks 1–27), match cards, scores, venue information, and live match indicators. |
| `modules/stats.js` | Statistics View | Computes team attack/defense ratings, clean sheet rankings, home/away splits, and comparative analytics. |
| `modules/progression-chart.js` | Trajectory Chart | Visualizes weekly rank progression across weeks 1–9 using interactive SVG/Canvas-like UI. |
| `modules/round3-regulasi.js` | Regulation Engine | Contains `STANDARD_MATRIX` and `PERSIRAJA_SCENARIOS` (10 scenarios). Generates Putaran 3 fixtures based on Putaran 2 standings. |
| `modules/simulation.js` | Simulator View & Engine | Manages interactive score editing, live standings calculation, auto-simulation heuristics, and `localStorage` persistence. |
| `modules/ui.js` | Shared UI Helpers | Renders modal dialogues, toast notifications, club logos with fallbacks, and mobile navigation toggles. |
| `modules/utils.js` | Utility Helpers | Resolves canonical club names (handling aliases like Persiku Kudus vs Persiku), date formatters, and score parsers. |

### Modular CSS Architecture (`public/css/`)

| File | Scope | Responsibilities |
| :--- | :--- | :--- |
| `base.css` | Global Foundation | CSS variables (colors, typography, shadows, borders), CSS reset, scrollbar styles, container rules. |
| `components.css` | Reusable Atoms & Molecules | Navbar, pills, buttons, segmented controls, status badges, modals, tooltips, toasts. |
| `standings.css` | Standings Presentation | League table layout, rank badges (P1 gold, P2 green, P9 amber, P10 red), sticky headers, mobile responsiveness. |
| `fixtures.css` | Fixtures Presentation | Match card layouts, team vs team rows, kickoff time badges, stadium badges, week navigation arrows. |
| `stats.css` | Analytics Presentation | Grid cards for top attack, top defense, clean sheets, and club performance radar. |
| `simulation.css` | Simulator Presentation | 2-column desktop layout (Sticky Standings vs Fixtures), interactive score inputs, outcome projection cards. |
| `style.css` | Aggregator | Central `@import` stylesheet loaded by `index.html`. |

---

## 5. State Management & Simulation Architecture

The application separates **Official Real Data** from **User Simulation State**:

### 1. Baseline Data (`state.js`)
Read-only data loaded directly from the backend API. Kept pristine so the user can compare simulation results against real-world standings.

### 2. Simulation State (`simulation.js` - `simState`)
```typescript
interface SimState {
  activeGroup: 'Grup A' | 'Grup B';
  selectedWeek: number; // 1 to 27
  simMatches: {
    'Grup A': MatchWeek[];
    'Grup B': MatchWeek[];
  };
  round3Meta: {
    'Grup A': { scenarioKey: string; title: string; generatedAt: string; generated: boolean } | null;
    'Grup B': { scenarioKey: string; title: string; generatedAt: string; generated: boolean } | null;
  };
  baselineStandings: {
    'Grup A': StandingRow[];
    'Grup B': StandingRow[];
  };
  highlightClub: string | null;
  activeMobileTab: 'standings' | 'fixtures';
}
```

### 3. Persistence Lifecycle
1. **Load**: On page load, `initSimulationState()` attempts to read `localStorage.getItem('pc_simulation_state_v2')`.
2. **Merge**: Saved user scores are merged over the real baseline fixtures. Real completed matches (`FT` in official data) cannot be accidentally overwritten.
3. **Save**: Every user score input immediately triggers `saveSimulationState()`.
4. **Flicker-Free Reactive Sync**:
   - When a user types a score, instead of re-rendering the whole page, targeted renderers are invoked:
     - `renderStandingsOnly()`: Re-sorts and updates the table body `#sim-table-body`.
     - `renderPayoffCardOnly()`: Re-calculates and updates `#sim-payoff-wrapper`.
     - `updateToolbarProgress()`: Updates completed match counts, putaran status chips, and finish state.
     - Card visual feedback (`.winner` class, `✕ Hapus` button) is managed reactively in `attachSimulationEvents()`.
5. **Reset**: Clicking **Reset Data Real** clears `localStorage` and restores the original fixtures and table instantly.

---

## 6. Testing Philosophy & Automated Suites

Tests reside in the `tests/` directory:

1. **`tests/test_exact_matches.js`** (Node.js):
   - Mathematically verifies that replaying all completed matches in `data/jadwal_dan_hasil.json` yields the exact point totals, goal differences, and ranks in `data/klasemen.json`.
   - Validates the canonical name matching and penalty point calculations.

2. **`tests/test_simulator_edge_cases.py`** (Python Playwright):
   - Tests `tabindex` consecutive progression (1 through 10) on match score inputs.
   - Tests immediate visual reactivity: home/away `.winner` highlight on score change.
   - Tests dynamic appearance and functionality of the match **✕ Hapus** button.
   - Tests venue mappings for neutral teams (Sultan Agung for PERSIKU Kudus, Batakan for PERSIBA Balikpapan).

3. **`tests/test_simulator_e2e.py`** (Python Playwright):
   - Complete end-to-end user journey: navigation, interactive score entry, quick simulations (Pekan, R2, Season).
   - Verifies **Ramadhan Clause**: asserts PERSIRAJA Banda Aceh is strictly **Away** in Weeks 19, 20, and 21.
   - Tests `localStorage` state retention across full browser reload.
   - Tests responsive mobile viewport (375x667).

4. **`tests/test_r3_gen.py`** (Python Playwright):
   - Tests the standalone generation trigger for Round 3 and subsequent reset.

