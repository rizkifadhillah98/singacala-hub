# 🏆 Pegadaian Championship 2026/27 — Tournament Simulator & Data Hub

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-lightgrey.svg)](https://expressjs.com/)
[![Architecture](https://img.shields.io/badge/Architecture-ES%20Modules%20SPA-blue.svg)](ARCHITECTURE.md)
[![Design](https://img.shields.io/badge/Design-J.League%20Athletic%20System-orange.svg)](#)

A high-performance tournament simulator, analytics suite, and live data hub for **Pegadaian Championship (Liga 2) 2026/27**, built strictly according to official PSSI tournament regulations.

---

## ⚡ Tech Stack

- **Backend**: Node.js, Express 5.x
- **Data Scraping**: Axios, Cheerio (extracting official PT LIB standings and fixture data)
- **Frontend Architecture**: Vanilla JavaScript (Native ES Modules SPA, zero-bundler requirement)
- **Styling**: Modern CSS3 (CSS Custom Properties, CSS Grid, Flexbox, responsive design inspired by J.League official portal)
- **Testing**: Playwright (E2E & UI browser regression), Node.js native assert suites

---

## 🚀 Quick Start Guide

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) (v18 or higher) and [Python](https://www.python.org/) (3.10+ if running Playwright test suites) installed.

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/your-org/pegadaian-championship-hub.git
cd pegadaian-championship-hub
npm install
```

### 3. Environment Configuration
Copy the sample environment file:
```bash
# Windows PowerShell
Copy-Item .env.example .env

# Bash / Linux / macOS
cp .env.example .env
```
Default configuration values:
```ini
PORT=3000
HOST=0.0.0.0
ADMIN_TOKEN=admin123
```

### 4. Running the Application
Start the local server:
```bash
npm start
# or for local development
npm run dev
```
Open your browser and navigate to:
- **Local machine**: `http://localhost:3000`
- **Local Network (LAN / Mobile)**: `http://<YOUR_IP>:3000` (printed directly to console on boot)

### 5. Scraping Live Data
To update data directly from the official PT LIB portal:
```bash
# Scrape latest standings (Grup A & Grup B)
npm run scrape:standings

# Scrape all 27 matchweeks of fixtures and results
npm run scrape:fixtures

# Scrape both in sequence
npm run scrape:all
```

### 6. Running Test Suites
```bash
# Fast Node.js standings & trajectory verification
npm test

# Python Playwright deep edge-case browser tests
npm run test:python

# Full end-to-end simulation flow
python tests/test_simulator_e2e.py

# Round 3 dynamic generation verification
python tests/test_r3_gen.py
```

---

## 📂 Directory Structure Map

```
pegadaian-championship/
├── .env.example              # Example environment configuration template
├── .gitignore                # Git ignore patterns (node_modules, logs, .env)
├── ARCHITECTURE.md           # In-depth architectural guide for developers & AI agents
├── README.md                 # Project overview and developer onboarding
├── package.json              # Project metadata, dependencies, and execution scripts
├── server.js                 # Express server, REST endpoints, and security middleware
│
├── data/                     # Scraped static JSON data cache
│   ├── jadwal_dan_hasil.json # Complete 27-week fixtures, venues, scores, and status
│   └── klasemen.json         # Current official standings, statistics, and penalties
│
├── docs/                     # Official competition documentation & regulations
│   ├── regulasi-pegadaian-championship-202627.pdf # Official PDF rulebook
│   └── REGULASI_LENGKAP.md   # Markdown transcript of tournament rules
│
├── public/                   # Client-side web application (Zero-bundler SPA)
│   ├── index.html            # Main SPA entrypoint and responsive UI shell
│   ├── css/                  # Modular stylesheet architecture
│   │   ├── base.css          # CSS reset, design tokens, typography, dark palette
│   │   ├── components.css    # Cards, pills, badges, tabs, modals, buttons
│   │   ├── fixtures.css      # Match cards, week selector carousel, scoreboards
│   │   ├── simulation.css    # Simulator grid, interactive inputs, outcome cards
│   │   ├── standings.css     # Standings tables, promotion/relegation zones
│   │   ├── stats.css         # Analytics cards, team comparison, clean sheet charts
│   │   └── style.css         # Global imports & layout definitions
│   └── js/                   # Frontend ES Modules
│       ├── main.js           # SPA bootstrapper, API fetcher, and view coordinator
│       └── modules/
│           ├── fixtures.js   # Match schedule renderer & week filter logic
│           ├── progression-chart.js # Trajectory chart & rank evolution
│           ├── round3-regulasi.js   # PSSI Article 7 Round 3 matrices & Persiraja clause
│           ├── router.js     # Hash-based SPA client router (#standings, #fixtures, #simulation)
│           ├── simulation.js # Interactive 27-week tournament simulator engine
│           ├── standings.js  # Live standings table renderer & H2H tiebreaker
│           ├── state.js      # Global state store for live data
│           ├── stats.js      # Statistical aggregations and form guide
│           ├── ui.js         # Shared UI helpers, modals, and toasts
│           └── utils.js      # Club canonical name resolvers and number formatters
│
├── scrapers/                 # Web scraping scripts
│   ├── scraper-fixtures.js   # Cheerio scraper for 27-week fixture schedules
│   └── scraper-standings.js  # Cheerio scraper for multi-group league tables
│
├── tests/                    # Automated regression and verification test suite
│   ├── test_exact_matches.js        # Node.js standings math & H2H logic validator
│   ├── test_r3_gen.py               # Playwright test for Round 3 generation button
│   ├── test_simulator_e2e.py        # Comprehensive Playwright end-to-end user journey
│   └── test_simulator_edge_cases.py # Deep UI edge cases (tabindex, clear buttons, venues)
│
└── scratch/                  # Scratchpad for temporary visual captures and exploratory scripts
```

---

## ✨ Key Features

1. **Live Standings with Official PSSI Tie-Breakers (Article 7)**:
   - Full 6-tier tie-breaking algorithm: (1) Total Points, (2) Head-to-Head Points, (3) H2H Goal Difference, (4) H2H Goals Scored, (5) Overall Goal Difference, (6) Overall Goals Scored.
   - Distinct visual color coding for Grand Final / Direct Promotion (P1), Promotion Play-off (P2), Relegation Play-off (P9), and Direct Relegation (P10).

2. **Interactive 27-Week Tournament Simulator**:
   - Live interactive score entry with keyboard navigation (`Tab` cycle across match inputs).
   - Instant calculation: Standings table, goal differences, and qualification outcomes update reactively on every keystroke.
   - Quick Simulation controls: *Simulasikan Pekan Ini*, *Simulasikan s/d Pekan 18*, and *Simulasikan Semua (s/d Pekan 27)*.

3. **Putaran 3 Dynamic Scheduling Matrix**:
   - In accordance with PSSI Article 7 Section 3, top 5 teams from Putaran 2 receive **5 Home & 4 Away** matches; bottom 5 teams receive **4 Home & 5 Away** matches.
   - **Special Ramadhan Clause (PERSIRAJA Banda Aceh)**: Evaluates 10 exact scenarios (`a` through `j`) to guarantee PERSIRAJA plays strictly away during Matchweeks 19, 20, and 21 during the holy month of Ramadhan.
   - Real neutral venues mapped for non-home teams (e.g., Sultan Agung for PERSIKU Kudus, Batakan for PERSIBA Balikpapan).

4. **Client-Side Persistence & Portability**:
   - Complete simulation state (`simState`) persists automatically to browser `localStorage`.
   - Single-click **Reset Data Real** restores the baseline actual tournament fixtures and standings instantly.

5. **Production-Grade Security**:
   - Constant-time token comparison (`crypto.timingSafeEqual`) to prevent timing attacks on administrative endpoints.
   - Rate limiting and concurrent execution locks on scraping triggers.

---

## 📡 API Reference

| Endpoint | Method | Auth Required | Description |
| :--- | :---: | :---: | :--- |
| `/api/klasemen` or `/api/standings` | `GET` | No | Retrieves current standings data for Grup A and Grup B, including points, goal difference, and official rankings. Optional query param: `?group=Grup%20A`. |
| `/api/jadwal` or `/api/fixtures` | `GET` | No | Retrieves all 27 matchweeks of fixtures, including home/away teams, stadiums, match status (`FT`, `UPCOMING`), and scores. |
| `/api/verify-admin` | `GET` | Yes (`x-admin-token` or `Bearer`) | Verifies whether the provided administrative token is valid. |
| `/api/refresh-standings` | `POST` | Yes (`x-admin-token` or `Bearer`) | Triggers real-time web scraping of league standings from PT LIB and updates `data/klasemen.json`. |
| `/api/refresh-fixtures` | `POST` | Yes (`x-admin-token` or `Bearer`) | Triggers real-time web scraping of 27 fixture matchweeks from PT LIB and updates `data/jadwal_dan_hasil.json`. |

### Authenticating Administrative Requests
To trigger refresh endpoints, pass the admin token either via headers or query parameters:
```bash
# Via header
curl -X POST http://localhost:3000/api/refresh-standings \
  -H "x-admin-token: admin123"

# Via query parameter
curl -X POST "http://localhost:3000/api/refresh-standings?token=admin123"
```

---

## 📄 License & Regulations
- Pegadaian Championship is an official competition organized by PT Liga Indonesia Baru (LIB) and PSSI.
- All tournament rules and calculations adhere strictly to the **Regulasi Pegadaian Championship 2026/27**.

