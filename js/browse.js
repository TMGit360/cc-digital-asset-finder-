import { state } from "./state.js";
import { fetchBatch, apiFilterFor, extractDC, isRenderable, safeHtml } from "./api.js";
import { applyFilters, clearAllFilters } from "./filters.js";
import { renderPage, renderPagination, updateStatus } from "./render.js";

/* ── DOM refs ───────────────────────────────────────────────────── */

const form           = document.getElementById("searchForm");
const resultsEl      = document.getElementById("results");
const statusEl       = document.getElementById("status");
const paginationWrap = document.getElementById("paginationWrap");
const paginationEl   = document.getElementById("pagination");
const loadMoreWrap   = document.getElementById("loadMoreWrap");
const loadMoreBtn    = document.getElementById("loadMoreBtn");

/* ── Utilities ──────────────────────────────────────────────────── */

function debounce(fn, ms = 320) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

/* ── Sidebar (mobile) ───────────────────────────────────────────── */

const filterToggleBtn = document.getElementById("filterToggleBtn");
const filterSidebar   = document.getElementById("filterSidebar");
const sidebarOverlay  = document.getElementById("sidebarOverlay");
const sidebarClose    = document.getElementById("sidebarClose");

function openSidebar() {
  filterSidebar.classList.add("open");
  sidebarOverlay.classList.add("active");
  sidebarOverlay.removeAttribute("aria-hidden");
  filterToggleBtn?.setAttribute("aria-expanded", "true");
  document.body.style.overflow = "hidden";
}

function closeSidebar() {
  filterSidebar.classList.remove("open");
  sidebarOverlay.classList.remove("active");
  sidebarOverlay.setAttribute("aria-hidden", "true");
  filterToggleBtn?.setAttribute("aria-expanded", "false");
  document.body.style.overflow = "";
}

filterToggleBtn?.addEventListener("click", openSidebar);
sidebarClose?.addEventListener("click", closeSidebar);
sidebarOverlay?.addEventListener("click", closeSidebar);

document.addEventListener("keydown", e => {
  if (e.key === "Escape" && filterSidebar.classList.contains("open")) closeSidebar();
});

/* ── Filter accordion ───────────────────────────────────────────── */

document.querySelectorAll(".filter-section-toggle").forEach(btn => {
  btn.addEventListener("click", () => {
    const section  = btn.closest(".filter-section");
    const body     = document.getElementById(btn.getAttribute("aria-controls"));
    const isOpen   = btn.getAttribute("aria-expanded") === "true";

    btn.setAttribute("aria-expanded", String(!isOpen));
    body.hidden = isOpen;
    section.classList.toggle("open", !isOpen);
  });
});

/* ── Filter wiring ──────────────────────────────────────────────── */

const debouncedApply = debounce(applyFilters);

["filterArtist", "filterTitle", "filterLocation", "filterGps"].forEach(id =>
  document.getElementById(id)?.addEventListener("input", debouncedApply)
);

["filterYearFrom", "filterYearTo"].forEach(id =>
  document.getElementById(id)?.addEventListener("input", debouncedApply)
);

document.getElementById("filter3D")?.addEventListener("change", applyFilters);
document.querySelectorAll('input[name="dcType"]').forEach(cb =>
  cb.addEventListener("change", applyFilters)
);

document.getElementById("licenseFilter")?.addEventListener("change", applyFilters);
document.getElementById("sortOrder")?.addEventListener("change", applyFilters);

document.getElementById("clearFiltersBtn")?.addEventListener("click", clearAllFilters);

/* ── Type filter — re-fetches server-side for audio / video ─────── */

document.querySelectorAll('input[name="mediaType"]').forEach(r =>
  r.addEventListener("change", () => {
    const newType = document.querySelector('input[name="mediaType"]:checked')?.value || "all";
    refetchForType(newType);
  })
);

async function refetchForType(newType) {
  if (state.isFetching || !state.currentQuery) return;

  const needed = apiFilterFor(newType);

  if (needed === state.activeApiFilter) {
    applyFilters();
    return;
  }

  state.isFetching      = true;
  state.activeApiFilter = needed;
  state.allResults      = [];
  state.filteredResults = [];
  state.continueParams  = null;
  state.currentPage     = 1;

  resultsEl.innerHTML   = "";
  paginationWrap.hidden = true;
  loadMoreWrap.hidden   = true;
  statusEl.textContent  = "Searching…";

  try {
    const data     = await fetchBatch(state.currentQuery, null, needed);
    const pagesObj = data?.query?.pages;

    if (pagesObj) {
      const batch = Object.values(pagesObj).filter(isRenderable);
      batch.forEach(p => { p._dc = extractDC(p); });
      state.allResults = batch;
    }

    state.continueParams = data?.continue || null;
    loadMoreWrap.hidden  = !state.continueParams;

    if (!state.allResults.length) {
      const label = newType === "all" ? "media" : newType;
      statusEl.textContent = `No ${label} assets found for "${state.currentQuery}".`;
      return;
    }

    applyFilters();
  } catch (err) {
    statusEl.textContent = `Error: ${safeHtml(err.message)}`;
  } finally {
    state.isFetching = false;
  }
}

/* ── Load more ──────────────────────────────────────────────────── */

async function loadMore() {
  if (state.isFetching || !state.continueParams) return;
  state.isFetching        = true;
  loadMoreBtn.disabled    = true;
  loadMoreBtn.textContent = "Loading…";
  loadMoreBtn.setAttribute("aria-busy", "true");

  try {
    const data     = await fetchBatch(state.currentQuery, state.continueParams, state.activeApiFilter);
    const pagesObj = data?.query?.pages;

    if (pagesObj) {
      const batch = Object.values(pagesObj).filter(isRenderable);
      batch.forEach(p => { p._dc = extractDC(p); });
      state.allResults = [...state.allResults, ...batch];
    }

    state.continueParams = data?.continue || null;
    loadMoreWrap.hidden  = !state.continueParams;

    applyFilters();
  } catch (err) {
    statusEl.textContent = `Error loading more results: ${safeHtml(err.message)}`;
  } finally {
    state.isFetching = false;
    if (state.continueParams) {
      loadMoreBtn.disabled    = false;
      loadMoreBtn.textContent = "Load more results";
      loadMoreBtn.removeAttribute("aria-busy");
    }
  }
}

loadMoreBtn.addEventListener("click", loadMore);

/* ── Search submit ──────────────────────────────────────────────── */

/* Build the API query string based on the selected field scope */
function buildApiQuery(rawQuery, field) {
  switch (field) {
    case "title":    return `intitle:${rawQuery}`;
    case "location": return `${rawQuery} hastemplate:Location`;
    default:         return rawQuery;
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const rawQuery    = document.getElementById("q").value.trim();
  const searchField = document.getElementById("searchField")?.value || "all";
  if (!rawQuery) return;

  const apiQuery = buildApiQuery(rawQuery, searchField);

  state.currentQuery    = apiQuery;
  state.allResults      = [];
  state.filteredResults = [];
  state.continueParams  = null;
  state.isFetching      = false;
  state.currentPage     = 1;
  state.totalPages      = 1;

  const selectedType    = document.querySelector('input[name="mediaType"]:checked')?.value || "all";
  state.activeApiFilter = apiFilterFor(selectedType);

  resultsEl.innerHTML    = "";
  paginationWrap.hidden  = true;
  loadMoreWrap.hidden    = true;
  paginationEl.innerHTML = "";
  statusEl.textContent   = "Searching…";

  try {
    const data     = await fetchBatch(apiQuery, null, state.activeApiFilter);
    const pagesObj = data?.query?.pages;

    if (!pagesObj) {
      statusEl.textContent = "No results found.";
      return;
    }

    const batch = Object.values(pagesObj).filter(isRenderable);
    batch.forEach(p => { p._dc = extractDC(p); });
    state.allResults = batch;

    state.continueParams = data?.continue || null;
    loadMoreWrap.hidden  = !state.continueParams;

    if (!state.allResults.length) {
      statusEl.textContent = "No usable media assets found for that query.";
      return;
    }

    applyFilters();
  } catch (err) {
    statusEl.textContent = `Search error: ${safeHtml(err.message)}`;
  }
});
