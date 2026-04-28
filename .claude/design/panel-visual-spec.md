# Browse-by-Topic Panel — Visual Specification

Scope: a self-contained visual spec for (a) the 12 replacement category icons and (b) the styling of the unified "Browse by Topic" panel. Interaction logic, taxonomy content, and query construction are out of scope and owned by sibling agents.

---

## Section A — Icon Library Decision

**Chosen library: Lucide** — https://lucide.dev
**License: ISC** (permissive; allows redistribution as inline SVG with the source notice carried in the project repo's third-party notices, not in each SVG).

### Why Lucide over the alternatives

1. **Stroke-based aesthetic with even visual weight.** Lucide is a maintained fork of Feather, designed on a strict 24px grid with `stroke-width="2"` round caps and round joins. The line quality reads as quiet, drafted, archival — the same register as a museum wayfinding system. Phosphor's regular weight is heavier and more decorative; Heroicons' outline set has a thinner, web-app feel; Tabler is close to Lucide but its cultural-heritage coverage (e.g. amphora, columns, scroll, compass-rose) is sparser.
2. **Cultural-heritage coverage.** Lucide ships dedicated glyphs for `landmark` (classical pediment), `palette`, `music`, `compass`, `globe`, `church`, `flask-conical`, `scroll`, `users`, `mountain`, `telescope`, `feather` — every one of the 12 category slots maps to a single existing Lucide glyph without compromise.
3. **Paste-ready inline SVG.** Each Lucide icon is a single `<svg viewBox="0 0 24 24">` with paths only (no `<defs>`, no gradients, no clip-paths). It drops directly into a JS template literal with no transformation, no font loading, no JS dependency — satisfies the `CLAUDE.md` "no build step" rule.

### Required attribution
The Lucide ISC license text must appear once in the repo (e.g. `LICENSES/lucide.txt` or a `THIRD_PARTY.md`). It does not need to be embedded in each SVG.

---

## Section B — Twelve Inline SVG Icons

### Shared attribute contract (applied to all 12)

| Attribute       | Value                              |
|---             |---                                 |
| `xmlns`         | `http://www.w3.org/2000/svg`       |
| `viewBox`       | `0 0 24 24`                        |
| `width`         | `40`                               |
| `height`        | `40`                               |
| `fill`          | `none`                             |
| `stroke`        | `currentColor`                     |
| `stroke-width`  | `1.75`                             |
| `stroke-linecap`| `round`                            |
| `stroke-linejoin`| `round`                           |
| `aria-hidden`   | `true`                             |

Style decision: **outline / stroked**, not filled. Outline icons read as restrained at the 40px tile size used in `.explore-tile-icon`, and they tint cleanly with `color: var(--color-accent)` (already applied in `styles.css:1543`). Lucide's native stroke-width is `2`; reducing to `1.75` softens the visual weight to better match the EB Garamond / Source Sans 3 type pairing without losing crispness on retina.

### Paste-ready strings

Each string is a single line, ready for direct substitution into the `icon: \`...\`` field of `js/topics-data.js`.

#### 1. Natural History — Lucide `leaf`
```
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19.2 2.96a1 1 0 0 1 1.8.66c0 1.93-.16 5.32-1.38 8.27-1.45 3.55-4.49 5.91-8.62 6.11Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6"/></svg>
```

#### 2. Landscapes & Earth — Lucide `mountain-snow`
```
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/><path d="M4.14 15.08c2.62-1.57 5.24-1.43 7.86.42 2.74 1.94 5.49 2 8.23.19"/></svg>
```

#### 3. Astronomy — Lucide `telescope`
```
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m10.065 12.493-6.18 1.318a.934.934 0 0 1-1.108-.702l-.537-2.15a1.07 1.07 0 0 1 .691-1.265l13.504-4.44"/><path d="m13.56 11.747 4.332-.924"/><path d="m16 21-3.105-6.21"/><path d="M16.485 5.94a2 2 0 0 1 1.455-2.425l1.09-.272a1 1 0 0 1 1.212.727l1.515 6.06a1 1 0 0 1-.727 1.213l-1.09.272a2 2 0 0 1-2.425-1.455z"/><path d="m6.158 8.633 1.114 4.456"/><path d="m8 21 3.105-6.21"/><circle cx="12" cy="13" r="2"/></svg>
```

#### 4. Fine Arts — Lucide `palette`
```
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>
```

#### 5. Architecture — Lucide `landmark`
```
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/></svg>
```

#### 6. Decorative Arts — Lucide `gem`
```
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/></svg>
```

#### 7. Music — Lucide `music`
```
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
```

#### 8. History — Lucide `scroll-text`
```
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 12h-5"/><path d="M15 8h-5"/><path d="M19 17V5a2 2 0 0 0-2-2H4"/><path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3"/></svg>
```

#### 9. Maps & Cartography — Lucide `compass`
```
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z"/><circle cx="12" cy="12" r="10"/></svg>
```

#### 10. People & Society — Lucide `users`
```
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
```

#### 11. Religion & Mythology — Lucide `church`
```
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 9h4"/><path d="M12 7v5"/><path d="M14 22v-4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v4"/><path d="M18 22V5.618a1 1 0 0 0-.553-.894l-4.553-2.277a2 2 0 0 0-1.788 0L6.553 4.724A1 1 0 0 0 6 5.618V22"/><path d="m18 7 3.447 1.724a1 1 0 0 1 .553.894V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.618a1 1 0 0 1 .553-.894L6 7"/></svg>
```

#### 12. Science & Technology — Lucide `flask-conical`
```
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2"/><path d="M6.453 15h11.094"/><path d="M8.5 2h7"/></svg>
```

### Auditing checklist
- [x] All 12 share `viewBox="0 0 24 24"`
- [x] All 12 share `stroke-width="1.75"`
- [x] All 12 share `aria-hidden="true"`
- [x] All 12 share `width="40" height="40"`
- [x] All 12 are outline-only (`fill="none"`); the only `fill="currentColor"` exceptions are the four interior dots inside the Fine Arts palette glyph, which are part of the Lucide source and read as paint-dabs on the palette — keeping them preserves the icon's literal meaning.

---

## Section C — Panel Visual Styling

All values reuse existing tokens from `styles.css:5-29`. No new palette values are introduced.

### C.1 — Color palette (extracted, reused)

| Token                | Value      | Use in this panel                                                                 |
|---                   |---         |---                                                                                |
| `--color-bg`         | `#FDFCF8`  | Panel page-context background (do not paint the panel itself this color)         |
| `--color-bg-card`    | `#FFFFFF`  | Panel surface; collapsed accordion-row background                                |
| `--color-bg-alt`     | `#F5F2EB`  | Hovered accordion-header background; expanded-section body tint; selected-row bg |
| `--color-text`       | `#1A1916`  | Category labels, subtopic-checkbox labels                                         |
| `--color-text-muted` | `#6B6760`  | LCSH canonical-form secondary text; counts; "Apply" idle label                   |
| `--color-text-light` | `#A09C95`  | Disabled Apply state; placeholder treatments                                     |
| `--color-accent`     | `#7C5C2A`  | Icon color, selected checkbox accent, primary button bg, selected-count badge bg |
| `--color-accent-lt`  | `#A07840`  | Hover lift for accent surfaces; primary-button hover bg                          |
| `--color-border`     | `#D8D3CA`  | Panel outer border; control borders                                              |
| `--color-border-lt`  | `#EAE6DF`  | Internal accordion-row dividers                                                  |

### C.2 — Typography

| Element                              | Family                  | Size      | Weight | Letter-spacing | Color                  |
|---                                  |---                      |---        |---     |---             |---                     |
| Panel header (`Browse by Topic`)     | `var(--font-serif)`     | `1rem`    | 400    | `.01em`        | `--color-text`         |
| Category accordion label             | `var(--font-sans)`      | `.875rem` | 600    | `.01em`        | `--color-text`         |
| Selected-count badge                 | `var(--font-sans)`      | `.625rem` | 700    | `.08em`        | `#fff` on accent       |
| Subtopic checkbox label (primary)    | `var(--font-sans)`      | `.8125rem`| 400    | normal         | `--color-text`         |
| LCSH canonical form (secondary)      | `var(--font-sans)`      | `.6875rem`| 400    | `.02em`        | `--color-text-muted`   |
| Apply button label                   | `var(--font-sans)`      | `.6875rem`| 700    | `.1em`, UPPER  | `#fff`                 |
| Clear button label                   | `var(--font-sans)`      | `.6875rem`| 700    | `.08em`, UPPER | `--color-text-muted`   |

The LCSH canonical form, when shown beneath a friendly label, sits on its own line at the smaller `.6875rem` size in `--color-text-muted`. It is not italic — italic is reserved for `.expansion-hint` (`styles.css:1218`) and would conflict.

### C.3 — Spacing

| Region                                             | Value                                           |
|---                                                 |---                                              |
| Panel outer padding (desktop)                      | `0` (sections own their padding, like `.filter-section`) |
| Panel outer border / radius                        | `1px solid var(--color-border-lt)` / `--radius-lg` |
| Accordion header row vertical padding              | `.8125rem 1.125rem` (matches `.filter-section-toggle`) |
| Accordion section body padding                     | `.625rem 1.125rem .875rem`                      |
| Vertical gap between checkbox rows                 | `.5rem`                                         |
| Checkbox-row internal gap (box → label → LCSH)     | `.5rem` between box and label; `.125rem` between primary label and LCSH line below |
| Icon → category-label gap (in accordion header)    | `.625rem`                                       |
| Icon size (in accordion header)                    | `20px × 20px` (smaller than the 40px tile size — see C.6) |
| Selected-count badge gap (label → badge)           | `.5rem`                                         |
| Panel footer padding (Apply / Clear)               | `.875rem 1.125rem` (matches `.sidebar-footer`)  |
| Footer button stack gap                            | `.5rem` (Apply on top, Clear below)             |

### C.4 — States

#### Accordion header row
- **Idle:** transparent background, `--color-text` label, `--color-accent` icon. Bottom border `1px solid var(--color-border-lt)`.
- **Hover:** background `var(--color-bg-alt)`. Icon shifts to `var(--color-accent-lt)` (mirrors `.explore-tile:hover` on `styles.css:1547`).
- **Focus-visible:** existing global ring `outline: 3px solid var(--color-accent); outline-offset: 2px;` (inherited from `styles.css:1017`) — do not redefine.
- **Active (mousedown):** background `var(--color-bg-alt)`, no transform.
- **Expanded:** chevron icon rotates 180° via `transform: rotate(180deg)` (matches `.toggle-icon` pattern in `styles.css:799`).

#### Checkbox row
- **Idle:** transparent. Native checkbox uses `accent-color: var(--color-accent)` (matches `.filter-checkbox-label input` at `styles.css:897`).
- **Hover:** background `var(--color-bg-alt)`, full-width to row edge. Cursor pointer on entire row (clicking the label toggles the box).
- **Focus-visible:** the `:focus-visible` ring is on the `<input>` itself, not the label.
- **Selected:** primary label remains `--color-text` (not bolded — selection state lives in the checkbox). Optional: subtle left-edge accent `box-shadow: inset 3px 0 0 var(--color-accent)` to scan-read selected items in a long list. Use only when ≥ 6 items per accordion.

#### Apply button (primary)
- **Idle:** `background: var(--color-accent); color: #fff; border: none; border-radius: var(--radius-md); padding: .5rem 1rem; font-size: .6875rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;` — same recipe as `.search-btn` (`styles.css:252`).
- **Hover:** `background: var(--color-accent-lt)` (`styles.css:268`).
- **Active:** `background: var(--color-accent); transform: translateY(1px);`
- **Focus-visible:** `outline: 3px solid var(--color-text); outline-offset: 2px;` (matches `.search-btn:focus-visible` at `styles.css:1029`).
- **Disabled (no selections):** `opacity: .5; cursor: not-allowed;` (mirrors `.btn-load-more:disabled`).

#### Clear button (secondary)
- Use the existing `.btn-clear-filters` recipe verbatim (`styles.css:909`). Idle is bordered transparent; hover swaps border + label to accent. No re-design needed.

### C.5 — Selected-count badge

Used inline beside a collapsed accordion header to indicate `Fine Arts (3)` style state.

```
display: inline-flex;
align-items: center;
justify-content: center;
min-width: 1.25rem;
height: 1.125rem;
padding: 0 .375rem;
font-family: var(--font-sans);
font-size: .625rem;
font-weight: 700;
letter-spacing: .04em;
color: #fff;
background: var(--color-accent);
border-radius: 999px;
```

When the count is zero, the badge is **omitted from the DOM** (not just hidden) — empty state should show no badge. The badge sits to the right of the label, before the chevron, separated by `.5rem`.

### C.6 — Icon sizing in two contexts

The 40×40 SVG attributes shipped in Section B are the **maximum render size** (used in the existing `.explore-tile-icon` tile grid at `styles.css:1539`). Inside the new accordion-header rows, the icon is rendered smaller:

```
.topic-accordion-icon {
  width: 20px;
  height: 20px;
  color: var(--color-accent);
  flex-shrink: 0;
}
```

Because the SVGs use `stroke="currentColor"` and the inline `width="40"` is overridden by the CSS rule above, the same icon string serves both contexts.

---

## Section D — Mobile (≤768px)

### D.1 — Layout reflow

- The panel collapses to **full content width** (no inner side margin), matching how `.filter-sidebar` becomes a fixed-position drawer at ≤1024px (`styles.css:1194`).
- Accordion-header rows expand vertical padding from `.8125rem` → `.9375rem` to clear a 44px touch target.
- Checkbox rows expand vertical padding to `.625rem` top and bottom (effective row height ≥ 44px including the label line-box). The 14px native checkbox already meets WCAG 2.5.5 because the entire row is the click target.
- Footer buttons stack full-width with `.5rem` gap. Apply uses `width: 100%; padding: .75rem 1rem;` to maintain a 44px+ touch target.

### D.2 — Icon behaviour at narrow widths

Icons **persist at all viewport widths**. They are part of the recognition pattern (museum-wayfinding aesthetic) and removing them would cost more than they save: at 20px in the accordion header they consume `20 + .625 = ~30px` of horizontal space, which is acceptable down to a 320px viewport.

The 40px tile-grid variant (used in `#exploreTopics` at `styles.css:1511`) reduces to `minmax(96px, 1fr)` at ≤768px so three columns fit comfortably on a 360px-wide phone:

```
@media (max-width: 768px) {
  #exploreTopics {
    grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
    gap: .5rem;
  }
  .explore-tile-icon { width: 32px; height: 32px; }
}
```

### D.3 — LCSH secondary line on mobile

The `.6875rem` LCSH canonical form **stays visible** on mobile but wraps under the primary label (it is already on its own line in the desktop spec). Do not truncate with ellipsis — the LCSH form is the authoritative reference and a user scanning on mobile needs to see it whole. Allow it to wrap to two lines if necessary; rows are not fixed-height.

### D.4 — Selected-count badge on mobile

Badge size is unchanged. It already fits comfortably in the right-justified slot before the chevron at all widths.

---

## Out of scope (not specified here)

- Open/close behaviour, single-vs-multi accordion, animation timing curves.
- Multi-select rules across accordions; query construction; URL hash sync.
- Keyboard navigation (arrow-key traversal, type-ahead, Escape semantics).
- The list of LCSH headings or category labels themselves.
- Any source-file edits — this document is spec-only.
