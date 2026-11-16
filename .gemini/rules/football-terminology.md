# Football Terminology Rules (ID & EN) — Pegadaian Championship Hub

These rules govern all user-facing copy, labels, badges, tooltips, and translations in `public/js/modules/i18n.js` and UI templates.

## Core Directives
1. **No Language Mixing**:
   - Indonesian (`id`) copy must use natural Indonesian football terminology (e.g., `SG` for Selisih Gol, `Kandang/Tandang`, `Nirbobol`, `Rekor Pertemuan`, `Terjadwal`)—never mix raw English abbreviations like `GD`, `(Home)`, `(Away)`, or `(Calculated Win)` into Indonesian labels unless an explicit bilingual glossary exception applies (`Head-to-Head`, `Play-off`, `Grand Final`).
2. **Accurate Football Semantics**:
   - Never translate `play-off` as `uji coba` (`uji coba` means friendly/trial match). Use `Babak Play-off`.
   - Never embed venue assumptions (`(Away)`, `(Home)`) inside venue-agnostic tactical tier labels (`Laga Berat` / `Tough Fixture`).
   - Use standard football hyphenation in English: `Head-to-Head` (or `H2H`), `Play-off`, `Kick-off`, `Clean Sheets`, `Goal Difference (GD)`.
   - Reserve `Odds` for betting contexts or pair it explicitly with statistical probability framing (`Peluang` / `Probability`), never confusing league probabilities with wagering odds.
3. **Consistent Cross-View Naming**:
   - Keep identical concepts identical across Standings, Fixtures, Team Stats, and League Simulator (e.g., `Team Statistics` / `Statistik Tim`, `Upcoming` / `Terjadwal`, `Form` / `Performa (5 Laga)`).
4. **Reference Skill**:
   - Before adding or modifying football copy in `i18n.js`, activate the `football-terminology` skill (`.agents/skills/football-terminology/SKILL.md`) and consult its bilingual glossary.
