# UI Design System Rules — Pegadaian Championship Hub

> **STRICT PERMANENT DIRECTIVE**: All software engineers, designers, and autonomous AI agents MUST strictly comply with this design specification across all views, components, modals, and future extensions. Never diverge from these constraints.

---

## 1. Visual Philosophy: Flat Dark Athletic Monochrome
- **Design Inspiration**: J.League official tournament aesthetic — sharp, clean, high-density data, matte monochrome athletic finish.
- **Tone**: Professional sports data hub. No decorative clutter, no radioactive neon glows, no toy-like graphics.
- **Primary Color Palette**:
  - Background Body: `#08090b`
  - Background Surface: `#0d0f14`
  - Container Cards: `#11141a` (or `#111318`)
  - Elevated / Inner Boxes: `#161a22`
  - Primary Border: `#242934`
  - Subtle Border: `#191c24`
  - Primary Text: `#f1f5f9`
  - Numeric Emphasis: Bold pure white `#ffffff`
  - Muted Text: `#94a3b8`
  - Dimmed Text: `#64748b` / `#cbd5e1`

---

## 2. Container Card Specifications
Every information container or section card MUST follow this uniform pattern:
- **Background**: `#11141a`
- **Border**: Uniform `1px solid #242934` (on all four sides)
- **Border Radius**: `6px` or `8px`
- **Padding**: `1.25rem 1.5rem` (or `1rem 1.25rem` for sub-boxes)
- **Box Shadow**: `0 1px 4px rgba(0, 0, 0, 0.25)`

---

## 3. Strict Negative Constraints (ZERO EXCEPTIONS)

### ⛔ 1. ZERO Colored Left Borders
- **NEVER** apply colored side/left borders to cards, reason boxes, table rows, or list items:
  - ❌ `border-left: 4px solid ...`
  - ❌ `border-left: 3px solid ...`
  - ❌ `border-left-color: ...`
- All cards, panels, and alert boxes MUST maintain a uniform `1px solid #242934` border across all 4 edges.

### ⛔ 2. NO Emojis Anywhere in UI
- **NEVER** insert emojis into titles, headers, descriptions, tables, chips, tooltips, or modal popups:
  - ❌ No 📊, 🏆, 🎮, 📌, ⚖️, 🌙, ✈️, 🗓️, ⏰, 📍, 📄, 🎲, ⚽, 🔥, ⚡, 🎯, etc.
- Use only crisp monochrome SVG icons (`viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, `stroke-width="2"` or `2.2`).

### ⛔ 3. NO Rainbow Badges or Neon Glows
- **NEVER** use bright multicolored gradients, neon glows, or high-saturation rainbow tags.
- Badges must use flat, low-saturation athletic palettes:
  - Default: `#1e2430` background, `#2e3646` border, `#cbd5e1` text.
  - Calculated Win / Success: `rgba(16, 185, 129, 0.12)` background, `#34d399` text, `1px solid rgba(16, 185, 129, 0.25)`.
  - Tight / Warning: `rgba(245, 158, 11, 0.12)` background, `#fbbf24` text, `1px solid rgba(245, 158, 11, 0.25)`.
  - Tough / Danger: `rgba(239, 68, 68, 0.12)` background, `#f87171` text, `1px solid rgba(239, 68, 68, 0.25)`.
  - Rivalry / Six-Pointer: `#242934` background, `#ffffff` text, `1px solid #3b4455`.

---

## 4. Typography & Stats Hierarchy
- **Primary Numeric Values**: Bold pure white `#ffffff`, `font-family: var(--font-display, 'Plus Jakarta Sans', sans-serif)`, `font-weight: 700` or `800`, `font-variant-numeric: tabular-nums`.
- **Primary Text**: `#f1f5f9`.
- **Secondary / Subtitle Text**: `#94a3b8` / `#cbd5e1`.
- **Section / Metric Labels**: `#94a3b8`, font size `11px` to `12.5px`, uppercase tracking `0.05em`.

---

## 5. Bilingual Support (i18n)
- Every user-facing string must have identical entries in `translations.id` and `translations.en` in `public/js/modules/i18n.js`.
- Renders must dynamically bind `t(key, params, lang)` or check `getLanguage()`.
- When the language switch button is clicked, all active panels must re-render or re-translate immediately.

---

## 6. Automated Verification Guard
- Every build/test must run `npm.cmd test`, `node tests/test_round3_popup.js`, `node tests/test_i18n_visual.js`, and dedicated module tests.
- Automated test assertions enforce zero emojis and zero colored left borders. Any violation will fail the build immediately.
