---
name: football-terminology
description: >-
  Authoritative bilingual (Indonesian & English) football terminology glossary
  and copywriting audit workflow for Pegadaian Championship Hub. Use this skill
  whenever adding, editing, or reviewing UI copy, match classifications, stats
  labels, tournament rules, or entries in public/js/modules/i18n.js.
---

# Football Terminology & Bilingual Copywriting Skill

Use this skill to ensure authentic, accurate, and consistent football (sepak bola)
terminology across both Indonesian (`id`) and English (`en`) views.

## Workflow

1. Consult the bilingual glossary in [references/glossary-id-en.md](./references/glossary-id-en.md) before authoring or editing keys in `public/js/modules/i18n.js`.
2. Check for common pitfalls:
   - **False friends**: `uji coba` means friendly/trial match, never `play-off`; `odds` in sports usually implies betting odds rather than league probability (`peluang`).
   - **Mixed-language Indonesian strings**: never put raw English fragments like `GD`, `(Home)`, `(Away)`, or `(Calculated Win)` inside `translations.id`.
   - **Static venue leaks**: never hardcode `(Away)` or `(Home)` in tactical classification labels shared across home and away fixtures.
   - **Cross-view label drift**: keep view titles, status badges, and table headers aligned across Standings, Fixtures, Stats, and Simulator (e.g., `Team Statistics`, not `League Statistics` on one page and `Team Statistics` in nav).
3. Verify parity: every key in `translations.id` must have an idiomatic, domain-accurate counterpart in `translations.en` with matching placeholders.
4. After updating `public/js/modules/i18n.js`, run `npm.cmd test`, `node tests/test_psgc_calculations.js`, and `node tests/test_psgc_visual.js` to confirm no test assertions or layouts break.
