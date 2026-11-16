# UI Style Rules for Pegadaian Championship Hub

These rules are permanent project guidelines for all AI agents, engineers, and contributors.

See full specification in `UI_RULES.md` at project root.

## Core Directives
1. **Design System**: 100% Flat Dark Monochrome athletic design system (J.League tournament aesthetic).
2. **Container Cards**:
   - `background: #11141a`
   - `border: 1px solid #242934`
   - `border-radius: 6px` or `8px`
   - `box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25)`
3. **STRICT CONSTRAINT: ZERO Colored Left Borders**:
   - Absolutely NO `border-left: 4px solid ...` or `border-left: 3px solid ...` or colored side bars on cards, alert boxes, or reason badges.
   - All cards must use uniform `1px solid #242934` border on all 4 sides.
4. **STRICT CONSTRAINT: NO Emojis**:
   - Zero emojis anywhere in UI, headers, cards, tables, popups, or tooltips.
   - Use only monochrome SVG icons.
5. **STRICT CONSTRAINT: NO Rainbow Badges**:
   - Badges must use flat, low-saturation dark athletic styling (`#1e2430` / `#242934` or subtle muted tints `rgba(..., 0.12)`).
6. **Bilingual Support**:
   - All text must be supported in both Indonesian (`ID`) and English (`EN`) via `public/js/modules/i18n.js`.
