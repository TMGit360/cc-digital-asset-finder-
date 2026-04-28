# Creative Commons Digital Asset Finder

Static, client-side web app for searching openly licensed media (images, audio, video) from Wikimedia Commons. Target users: educators, designers, researchers.

## Stack

Vanilla JS (ES modules), Bootstrap 5.3, HTML/CSS. **No build step, no framework.** All files are served as-is. Do not introduce a bundler, transpiler, or package manager unless explicitly asked.

## Data Source

Wikimedia Commons API (`https://commons.wikimedia.org/w/api.php`) via `generator=search` in namespace 6 (File:). Dublin Core metadata is extracted from `extmetadata`. `gsrfiletype` drives broad image/audio/video switching server-side.

---

## Key Files

| File | Purpose |
|---|---|
| `browse.html` | Main search/browse page shell |
| `js/browse.js` | Search orchestration — wires API, filters, render, state, expansion |
| `js/api.js` | Fetch layer, Dublin Core extraction, MIME helpers |
| `js/filters.js` | Client-side filter predicates (run against `state.allResults`) |
| `js/render.js` | Card rendering + record modal (`<dialog>`) logic |
| `js/state.js` | Shared state: `allResults`, `filteredResults`, pagination |
| `js/synonyms.js` | Query expansion: maps casual terms to Wikimedia terminology |
| `js/synonyms-data.js` | Generated expansion data (built by `scripts/build-synonyms.js`) |
| `js/topics-data.js` | Browse-by-topic taxonomy: 12 LCSH-aligned categories with `headings: [{label, lcsh, query}]` |
| `js/topic-panel.js` | Browse-by-Topic modal panel: builds Bootstrap accordion, manages multi-select state, builds combined OR'd query on Apply |
| `styles.css` | All custom styles |
| `index.html` | Landing page |
| `about.html` | About page |

---

## Browse Page Architecture

### Search bar
- `<select>` dropdown left of keyword input.
- Fields: **All Fields**, Title, Subject, Description, Creator.

### Pre-search state
- Filter sidebar is **invisible** until results load.
- Below the search bar: inline quick-filter row — Type pills (All / Images / Video / Audio), Date, Geographic location.

### Post-search sidebar
- Sidebar appears after results load.
- Type pills move into sidebar as top-level filter group.
- Sidebar sections are type-aware; sub-filters change based on active type.
- License filter is always visible regardless of type.
- "Clear all filters" in sidebar footer.

### Sub-filters per type (all client-side, filtering `state.allResults`)
- **Images:** Format (JPEG/PNG/SVG/TIFF/WebP/GIF from `_mimeType`), Subject/Category (`_dc.subject`), Medium (`_dc.medium`)
- **Audio:** Subject/Category, Format (OGG/FLAC/WAV/MP3), Duration range (if derivable)
- **Video:** Format (WebM/MP4/OGG video), Resolution SD/HD (`info.width`/`info.height`), Duration (if derivable)

---

## Record Modal

Implemented as a native `<dialog>` element (in `browse.html` before `</main>`). Logic in `render.js`.

- `resultMap` (module-level Map) stores pageid → result for lookup.
- `data-pageid` on each `.asset-card` article.
- Click delegation on `.metadata-toggle` calls `openRecordModal(pageid)`.
- `document.body.style.overflow = "hidden"` set on open, cleared on `dialog close` event.
- Desktop: 700px wide, 88vh max-height, centered.
- Mobile (≤768px): `position: fixed; inset: 0` — full-screen.

---

## Mobile Layout (≤768px)

- **Quick filters:** wrapped in a card (border + shadow). Each group stacks vertically with full-width controls.
- **Results topbar:** `flex-direction: column; align-items: flex-start` — count on line 1, sort on line 2.
- **Results grid:** `1fr 1fr` two-column, `gap: .75rem`. Cards have 130px thumbs, tighter padding, 0.875rem titles.

---

## Query Expansion (`js/synonyms.js`)

`expandQuery(rawQuery)` returns `{ query: string, hints: string[] }`.

Matching rewrites the query as a CirrusSearch OR expression inside the existing API call — no extra latency.

- Applied **only for "All Fields" and "Description"** field selections. Title/Subject/Creator/Category are left exact.
- `showExpansionHint(hints)` renders "Also searching: X, Y, Z" below the results topbar.
- **Pattern ordering is critical:** specific patterns (e.g. `polar bear`) must come before generic ones (`bear`) in the `EXPANSIONS` array.

High-value gaps to fill: musical instruments, geological/weather terms, historical places, cultural events, mood/ambient terms, more domestic animals.

---

## Conventions

- No comments unless the WHY is non-obvious to a future reader.
- No build artifacts — `scripts/build-synonyms.js` is the only build script; run it manually when synonym data changes.
- All filtering is client-side against `state.allResults`. The API is only called for new searches, not filter changes.
