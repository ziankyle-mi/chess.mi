# chess.mi — Design System

> Source of truth for all UI decisions. Every component and future change reads from here.

---

## THEME (locked — do not change)

- Dark background and the existing board colors stay **exactly as they are**.
- Do not touch these in any future pass.
- Board themes (Classic Green, Wood, Ice, Walnut, Tournament, Midnight, Coral, Emerald) are final.
- App themes (Dark, OLED, Light) base colors are locked.

---

## COLOR

- **One accent color only**, used sparingly:
  - ✅ The CTA button
  - ✅ The eval bar fill
  - ❌ Nowhere else. No icon should carry its own separate color.
- Current accent: `#81b64c` (green) — a single, muted green that anchors interaction.
- **Zero-value stats recede** (dim / gray / `--text-muted`).
- **Nonzero stats get full contrast** (`--text` / `--text-primary`).
- Move classification colors (brilliant, great, good, inaccuracy, mistake, blunder) are functional, not decorative — these are the only exception to the one-accent rule.

---

## TYPOGRAPHY & HIERARCHY

- **Accuracy and rating numbers** are the largest, boldest elements on any screen that shows them.
- Everything else is secondary to those numbers.
- No icon badge per label. Differentiate rows with **weight and color value**, not icons.
- Font stack:
  - UI: `Inter`, system fallbacks
  - Numbers / Monospace: `JetBrains Mono` with `font-feature-settings: "tnum" 1`
- Rating / Accuracy display: `font-size: 2rem+`, `font-weight: 700–900`
- Section headers: `font-size: 0.75rem`, `font-weight: 600`, `text-transform: uppercase`, `letter-spacing: 0.08em`, `color: var(--text-muted)`
- Body text: `font-size: 0.875rem`, `font-weight: 400`

---

## LAYOUT

- **Not every section is a rounded card with a border.**
- Vary container treatments to avoid "identical boxes stacked together":
  - Some sections: full-bleed with a subtle top border only
  - Some sections: inset with `padding` and a soft background (`--bg-panel`)
  - Some sections: floating card with `border-radius: 8px` and `border: 1px solid var(--border-subtle)`
  - Some sections: no container at all — just content with generous spacing
- **Consolidate secondary controls** (sound, counters, settings) instead of listing them as loose icons.
- Navigation bar: icon-only on mobile, icon + label on wider viewports.
- Maximum content width: `1400px`, centered.

---

## SPACING

- Base unit: `4px`
- Component internal padding: `12px–16px`
- Section gaps: `24px–32px`
- Dense lists (move list, game history): `2px–4px` row gap
- Generous whitespace between major sections

---

## INTERACTION

- Hover states: subtle background shift (`var(--bg-hover)`), no color change on text.
- Active/selected state: accent left-border (`3px solid var(--accent)`) or accent background tint.
- Transitions: `150ms ease` for backgrounds, `200ms ease` for transforms.
- No decorative animations. Micro-animations only for state feedback (button press, tab switch, loading).

---

## COMPONENT PATTERNS

### Eval Bar
- Vertical, slim (`20px` wide)
- White fill from bottom, black fill from top
- Accent color (`--accent`) for the fill — this is one of the two allowed accent uses
- Numeric eval badge centered on the bar

### Move List
- Compact two-column layout (move number | white move | black move)
- Current move: accent left-border highlight
- Classification dots: small (`6px`) inline circles, colored per classification

### Stats Dashboard
- Big numbers first, labels underneath (not beside)
- Zero values: `color: var(--text-muted)`, `opacity: 0.5`
- Nonzero values: `color: var(--text)`, full opacity
- No decorative icons next to stat labels

### Board
- No outer border or shadow — the board is the hero element
- Player cards above/below with name, rating, clock
- Coordinates: subtle, inside the board edge

---

## ANTI-PATTERNS (avoid these)

- ❌ Rainbow icon sets where each icon has its own color
- ❌ Every section wrapped in an identical rounded card
- ❌ Gradients for decoration (gradients only for data visualization like eval graphs)
- ❌ Multiple accent colors competing for attention
- ❌ Placeholder images or lorem ipsum
- ❌ Generic "AI slop" patterns: pill-shaped everything, excessive border-radius, gratuitous glassmorphism
- ❌ Stats showing "0" with the same visual weight as meaningful values
