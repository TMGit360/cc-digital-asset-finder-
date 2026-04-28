# Browse by Topic Panel — Interaction Spec

Replaces the current two-state explore panel (`#explorePanel` → topic tiles → subtopic chips → fires single search) with a unified, faceted multi-select query builder. All 12 LCSH-aligned categories are presented as collapsible accordions; users multi-select LCSH headings across categories; one Apply button fires a single combined Wikimedia Commons search.

This document is interaction/behavior only. Visual styling (color, type scale, spacing tokens, iconography) is owned by the visual design spec — references below to "the visual design spec" mark the seams.

---

## 1. Trigger placement

### Decision
A single primary trigger button labeled **"Browse by topic"** sits **immediately below the search input** (where `#explorePanel` currently lives), inside `.search-form-wrap` in `browse.html`. It does **not** sit beside the input — that real estate is reserved for the search field selector and the Search submit button, both of which are critical. A button below keeps visual hierarchy clean (search bar is primary, browse is secondary entry point) and matches museum-archive precedent (the Met "Search the collection" / "Browse" pairing).

### Pre-search state
- The trigger is the only thing that occupies the former `#explorePanel` slot. The current 12-tile grid is **gone** from that slot — it lives inside the panel now.
- The trigger may be paired with a one-line affordance copy underneath (e.g., "Pick subjects from 12 collections"). Final copy lives in the visual design spec.

### Post-search state
- The trigger **persists** as a small secondary button in the filter sidebar, at the top of the sidebar above "Media Type" — labeled **"Browse by topic"** with a count badge if any topics are currently encoded into the active query (e.g., `Browse by topic (4)`). Selections survive across the session until cleared or until a new search is fired without going through the panel.
- Rationale: the panel is a query builder, not a post-search filter — re-opening it always means firing a new API call (same as typing a fresh keyword). The sidebar entry point makes the refinement workflow legible without conflating it with client-side filters.
- Tapping it post-search re-opens the panel pre-populated with the prior selections so users can refine.

### IDs / hooks (suggested for the implementer)
- Pre-search trigger: `#browseTopicsBtn`
- Post-search trigger (sidebar): `#browseTopicsBtnSidebar`
- Panel root: `#topicPanel`
- The existing `#explorePanel` element should be **removed** from `browse.html`. `js/explore.js` and `js/topics-data.js` are superseded by the new module (developer should delete or rename and delete after confirming no other consumers).

---

## 2. Panel structure

### Decision: full-screen modal overlay (Bootstrap 5.3 `modal` component, `modal-fullscreen-md-down` + custom large size on desktop)

Why modal over drawer or inline:
- **Inline expansion** would push the entire results region down and create a janky, very tall page when 12 accordions are stacked. Killed.
- **Side drawer** competes spatially with the post-search filter sidebar (left side) and with the main results region (right). Awkward.
- **Modal** gives the panel its own focused canvas, matches the museum-archive aesthetic (Met's "Advanced Search" overlay), and Bootstrap 5.3 already ships `modal` with backdrop, scroll-lock, focus-trap, and Esc-to-close — no new code surface for accessibility scaffolding.

### Desktop (>768px)
- Bootstrap `modal-dialog modal-lg modal-dialog-scrollable modal-dialog-centered`.
- Width: 720–860px (visual design spec to specify exact). Max-height 88vh. Body scrolls.
- Three-region composition:
  - **Header:** title `Browse by topic`, short description sentence, a live "Selected: N" counter, top-right close (`×`) button.
  - **Body:** vertical stack of 12 accordion sections (Bootstrap `.accordion`, `.accordion-item`, `.accordion-button`).
  - **Footer:** sticky inside dialog. Left: `Clear all selections` (text button, disabled when 0 selected). Right: `Cancel` (secondary) and `Apply` (primary, disabled when 0 selected, label updates to `Apply (N)` when N≥1).

### Mobile (≤768px)
- Bootstrap `modal-fullscreen` — fills viewport edge-to-edge.
- Header collapses to a single row: back-arrow / `×` on the left, `Browse by topic` centered, Apply mini-button on the right (also disabled when 0 selected). The full-width primary Apply still appears in the sticky footer for thumb reach.
- Body scrolls vertically; footer is `position: sticky; bottom: 0` so the Apply button is always reachable while scrolling long accordions.

### Body-scroll lock
- Bootstrap modal handles `document.body` overflow automatically; do **not** layer the manual lock pattern used by the record dialog.

---

## 3. Accordion behavior

### Default state
- **All 12 accordions collapsed** on first open. With 12 categories at 8–15 headings each, opening anything by default would either bias the user toward the opened one or create an enormous initial scroll. Collapsed-default also shows the 12 LCSH category names as a complete table-of-contents on entry — this *is* the discovery surface.

### Expansion model
- **Multi-open** (Bootstrap accordion `data-bs-parent` is **omitted**). Users routinely cross-faceted-select (e.g., open Fine Arts and Geography simultaneously to combine "Painting" + "United States"). Single-open would force constant re-expansion and is hostile to the multi-select intent.

### Accordion header composition (collapsed)
- Left: chevron icon (Bootstrap default), category label (e.g., `Fine Arts`).
- Right: a selected-count badge — format `(N)` appended to the label, **only when N≥1**, e.g., `Fine Arts (3)`. Bracketed integer (no `selected` word) keeps the row scannable. The badge is part of the accessible name so screen readers announce `Fine Arts, 3 selected, collapsed`.
- A category with 0 selections shows no badge; the row is still interactive.

### Accordion body
- A vertical list of LCSH-heading checkbox rows (data shape and contents owned by the data agent — do not enumerate here).
- If a category exceeds ~12 rows, the body scrolls within itself only on desktop **only when the body would otherwise overflow the modal viewport** — otherwise let it expand inline. Mobile: always inline (the modal itself scrolls).

### Open/close on header click
- Standard Bootstrap behavior: click toggles. `aria-expanded` flips. Animation is Bootstrap's default collapse transition.

### "Expand all / Collapse all" controls
- **Out of scope for v1.** Reassess after usage data. With 12 sections, expand-all produces a wall; the multi-open default already supports the cross-category workflow.

---

## 4. Checkbox rows

### Visual hierarchy of label + LCSH canonical form

Each LCSH heading carries: a user-friendly `label`, a canonical LCSH `heading` (the controlled-vocabulary string), and a tuned `query` string for the API.

**Decision: show the user-friendly label as the primary line; show the canonical LCSH heading as a secondary line below, smaller, muted.** Rationale: the museum-archive aesthetic the project targets is built on visible authority records — showing the LCSH form is part of the trust signal and helps researchers verify they're hitting the right concept. Hover-only would hide it from touch users entirely. Tooltip-only would make it inaccessible to screen readers without extra ARIA work.

If `label` and `heading` are identical, render only the single line (no redundant duplicate).

### Row structure
- Native `<input type="checkbox">` + `<label>` association (no custom toggle widget).
- Hit target wraps the entire row, not just the box (per the visual design spec for sizing).
- Layout: checkbox left, label-stack center, no right-side affordance.

### States (behavior only — visual styling owned by the visual design spec)
- **Unselected:** default row.
- **Hovered / focus-visible:** subtle background shift, full row indicates clickability.
- **Selected:** checkbox checked; row gets a persistent selected-state treatment (the visual spec defines this — likely a left accent rule and/or background tint, consistent with the existing `.filter-checkbox-label` selected pattern in `styles.css`).
- **Disabled:** not used in v1. All headings are always selectable.

---

## 5. Apply behavior — query construction

This is the load-bearing section. Get this right and the rest is mechanical.

### Selection data model
While the panel is open, maintain an in-memory `Set` (or array) of selected entries keyed by a stable id. Each selected entry retains a reference to its source object: `{ categoryId, headingId, query }`. The `query` field is the tuned Wikimedia search string already authored in the LCSH data file. The `categoryId` is retained for the badge counts and for the post-search persistence model (see §6).

### Combined query construction

**N selections produce one combined query string** that is then handed to the existing search-firing path in `js/browse.js`.

Format: each selection's `query` string is wrapped in parentheses and the N parenthesized groups are joined with the literal token ` OR ` (uppercase, spaces around it — CirrusSearch boolean OR). Result:

```
(query1) OR (query2) OR (query3)
```

For N=1: emit `query1` without the wrapping parens (avoids unnecessary grouping).

**Why parens around each:** individual `query` strings authored in the LCSH data may themselves contain spaces, phrase quotes, or boolean tokens. Without grouping, OR precedence would silently mis-parse multi-token queries. Parens make grouping explicit.

**No category metadata is encoded into the API query.** The LCSH category that a heading lives under is a UI grouping affordance; it has no equivalent in CirrusSearch and conflating "category" with `incategory:` would be wrong (Wikimedia categories are not LCSH classes). Category metadata stays purely client-side for badge counts and panel state.

### Hooking into `js/browse.js`

The current explore wiring (lines 25–36 of `js/browse.js`):

```js
initExplore((query, filetype) => {
  // sets #q value, sets preMediaType radio, dispatches form submit
});
```

The new wiring follows the same contract — the panel module exports an `initTopicPanel(onApply)` function. `onApply` is called with `({ query, selections })` where `query` is the combined string described above and `selections` is the array of `{ categoryId, headingId }` for state restoration. The handler:

1. Sets `#q` (the search input) value to the combined `query`. (The user can see what was assembled; they can edit it.)
2. Sets `#searchField` to `"all"` — combined queries are full-text, never field-scoped. Persist the user's prior `searchField` value into a closure if you want to restore it on Cancel; do not surface a UI option for it inside the panel in v1.
3. Resets `preMediaType` to `"all"` (selections are media-type-agnostic — the post-search Type pill in the sidebar lets the user narrow). Skip this step if a future `mediaType` field is added to LCSH headings.
4. Stashes `selections` on a module-scoped variable that the post-search sidebar trigger reads to repopulate the panel on re-open.
5. Dispatches `form.submit` exactly as the current explore wiring does — this re-uses the entire existing search path including `expandQuery`, `apiFilterFor`, status updates, sidebar reveal, etc.

### Interaction with `expandQuery` (synonyms)

`expandQuery` runs only when `searchField === "all" || "description"` (per `js/browse.js` line 321). The combined query above is intentionally injected as `searchField === "all"`, which means **it will pass through `expandQuery`**. This is desirable for casual labels but potentially noisy for already-tuned LCSH-derived queries.

**Decision for v1:** let it pass through. The expansion hint banner ("Also searching: …") gives the user visibility and they can re-submit a tweaked query. If empirical noise is high, a follow-up can add an opt-out flag to `expandQuery(rawQuery, { skipExpansion: true })`. Flag this in the implementation PR so the user can evaluate.

### Apply triggers a new search

`Apply` always closes the panel and fires a fresh API call. There is no "preview" or "live update" mode in v1.

---

## 6. Reset / Clear / Cancel / Close

Three distinct actions, three distinct semantics:

| Action | Trigger | Pending selections | Panel state | Active search |
|---|---|---|---|---|
| **Apply** | Apply button | Committed | Closes | New search fires |
| **Cancel** | Cancel button or backdrop click or Esc | **Discarded** — selections revert to whatever was committed before this open | Closes | Unchanged |
| **Close (×)** | × button in header | **Discarded** (same as Cancel) | Closes | Unchanged |
| **Clear all selections** | Footer text button | All checkboxes uncheck immediately; counter goes to 0 | Stays open | Unchanged |

### Rationale
- Backdrop/Esc/× all map to Cancel-semantics because that is the universal modal expectation; treating them as commit-on-close would surprise users.
- Clear-all is *intentionally not* the same as Cancel — Clear lets a user wipe and rebuild without leaving the panel.
- Pending state is held in module memory only while the modal is open. On Cancel, restore from the last-Applied snapshot. On first-ever open, the snapshot is empty.

### Confirm-before-discard?
- **No confirmation dialog.** With explicit Cancel and Clear buttons, an "are you sure" on backdrop click would over-engineer a low-stakes action (selecting checkboxes again is cheap). Defer unless usability testing surfaces accidental loss.

### Sidebar "Clear all filters" button
- The existing sidebar `#clearFiltersBtn` clears client-side filters only. It does **not** touch the topic-panel selections, since those are encoded into the active API query, not into client-side filter state. The sidebar `Browse by topic (N)` trigger is the way users see and revisit those selections.
- The existing `#newSearchBtn` ("New Search") **does** clear topic-panel selections, because it resets the entire search session. Add a single line to `resetSearch()` in `js/browse.js` to clear the module-scoped selections snapshot.

---

## 7. Accessibility

### ARIA pattern
- The panel container is a **dialog** (`role="dialog"` or native `<dialog>` is fine — Bootstrap modal applies `role="dialog"` and `aria-modal="true"` automatically). `aria-labelledby` points at the header title element. `aria-describedby` (optional) points at the description sentence.
- Each accordion section uses the WAI-ARIA Accordion pattern: header is a `<button>` with `aria-expanded`, `aria-controls` pointing at the `id` of the panel region, and the region has `role="region"` (Bootstrap's default markup already does this).
- Checkbox rows are native `<input type="checkbox">` + `<label>`. No `role="checkbox"` overrides.
- The panel has an `aria-live="polite"` region in the header that announces selection-count changes (e.g., `"3 topics selected"`). Throttle announcements to one per ~750ms to avoid spam during rapid clicking.

### Keyboard navigation
- **Open panel:** trigger button (Enter/Space) opens; focus moves to the first focusable element inside (the close `×` button — Bootstrap default). Optionally move focus to the modal title for screen reader context.
- **Tab order:** close button → (skip past header description) → accordion header 1 → (if expanded, its checkboxes) → accordion header 2 → … → footer Clear → Cancel → Apply. Bootstrap modal traps focus inside the dialog.
- **Accordion headers:** `Enter` or `Space` toggle expansion. `↑` / `↓` arrow keys move focus between accordion headers (WAI-ARIA Accordion authoring practice; Bootstrap doesn't ship this — implementer adds a small key handler). `Home` / `End` jump to first/last header.
- **Within an expanded accordion body:** standard Tab behavior between checkboxes. `Space` toggles the focused checkbox (native).
- **Esc:** closes the panel with Cancel-semantics. Focus returns to the trigger button that opened it.
- **Apply:** Enter on the Apply button, or `Ctrl/Cmd + Enter` from anywhere inside the panel as a power-user shortcut (optional, nice-to-have — flag for implementation if scope allows).

### Focus management
- On open: focus moves into the dialog (per Bootstrap default).
- On close (any path): focus returns to the trigger element that opened the dialog. Bootstrap modal handles this when `data-bs-toggle="modal"` is the opener; if opening programmatically, the implementer must store the opener reference and restore focus in the `hidden.bs.modal` event.
- After Apply: focus moves to `#status` (or the search input) — same as current search-submit behavior. Implementer's choice; the relevant event is `hidden.bs.modal` after a successful Apply.

### Screen reader announcements
- Selection-count changes: announced via the `aria-live="polite"` region in the header.
- Apply outcome: the existing `#status` aria-live region in `.results-topbar` already announces "Searching…" → result count, which is reused as-is.
- Each accordion row's accessible name includes the LCSH heading on the secondary line — use `aria-describedby` on the checkbox pointing at the LCSH heading element so it's read after the primary label, not concatenated.

---

## 8. Mobile spec

### Touch targets
- All interactive elements (accordion headers, checkbox rows, footer buttons) have a minimum hit area of **44×44 CSS pixels** (visual design spec to define exact padding to achieve this).
- Checkbox rows extend their tap area to the full row width and a comfortable height — the user should never need to hit the small native checkbox glyph.

### Scroll behavior
- The modal body scrolls vertically as a single region. Individual accordion bodies do **not** have inner scroll on mobile (avoids nested-scroll trap on touch).
- Footer is `position: sticky; bottom: 0` so Apply remains visible while scrolling long accordion lists.
- Use `overscroll-behavior: contain` on the modal body to prevent the page underneath from rubber-banding.

### Virtual keyboard interaction
- v1 has no text input inside the panel — checkbox-only interface — so the on-screen keyboard does not appear. If a future iteration adds a search-within-topics input (post-v1, see open questions), the Apply footer must shift to a non-sticky position when the visual viewport shrinks (use the `VisualViewport` API or `:has(:focus-within)` with `--keyboard-open` height adjustment).

### Modal-fullscreen specifics
- `modal-fullscreen-md-down` per Bootstrap 5.3 (full-screen below md breakpoint). At ≥768px, switches to centered modal-lg.
- Backdrop is irrelevant on mobile (modal fills viewport); on desktop, backdrop click triggers Cancel-semantics.
- Lock body scroll while open (Bootstrap default).

---

## File-touch summary for the implementer

- `browse.html`: remove `#explorePanel` block; add `#browseTopicsBtn` trigger below the search form; add the modal markup (Bootstrap 5.3 `.modal` scaffold) before `</main>` near the existing `#recordDialog`; add `#browseTopicsBtnSidebar` inside `#filterSidebar` above the Media Type section.
- `js/browse.js`: replace the `initExplore(...)` block (lines 25–36, 6) with `initTopicPanel(...)`; extend `resetSearch()` to clear topic-panel selections; the post-search sidebar trigger wires to a `openTopicPanel()` export.
- New module `js/topic-panel.js`: owns rendering, selection state, query construction, and Bootstrap modal lifecycle.
- `js/explore.js` and `js/topics-data.js`: deletable once the new panel ships and the implementer confirms no other module imports them.
- LCSH data file: separate concern, owned by the data agent. The panel module imports it by name.
- `styles.css`: visual styling per the visual design spec.

---

## Open questions for the developer / user

1. **Synonym expansion on combined queries.** §5 calls out that `expandQuery` will fire on the OR'd combined query because it routes through `searchField === "all"`. Author intent: allowed, may produce noise. **Decision needed** before implementation: keep as-is, or add a `skipExpansion` opt-out and pass it from the panel? Recommend keeping as-is for v1 and revisiting empirically.

2. **Pre-existing keyword text in `#q` when the trigger is opened.** If the user has already typed "renaissance" and then opens Browse by topic and applies 3 selections, do we (a) discard their typed text and replace with the OR'd query, (b) AND the typed text with the OR'd group `(renaissance) AND ((q1) OR (q2) OR (q3))`, or (c) prepend it as another OR term? Spec assumes (a) — replace — for simplicity and predictability. (b) is more powerful but introduces an AND/OR mental model the rest of the UI doesn't expose. **Decision needed.**

3. **Per-category `Select all` shortcut.** Useful for "everything in Music" power moves, but adds a control row to every accordion body and complicates the count-badge math (selecting "all 12" should it show `(12)` or `(all)`?). v1 spec says **no**. Confirm.

4. **Persistence across page reloads.** Spec keeps selections in module memory only — they survive within a session but not across reloads or tab closes. URL-encoding selections (`?topics=fine-arts.painting,geography.usa`) would enable shareable topic-search links. Out of scope for v1 but worth flagging as a v2 enhancement.

5. **The post-search sidebar trigger's count badge** (§1) shows the number of topic *selections*, which can differ from the visible result count. Confirm the badge represents selections, not results — spec assumes selections.

6. **Empty-state copy inside the panel** if the LCSH data fails to load — out of scope for the UX spec, but the implementer should add a graceful fallback ("Topics unavailable. Try the search bar.") rather than a blank modal. Defer to implementer judgment.
