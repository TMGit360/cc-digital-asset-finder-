import { state, RESULTS_PER_PAGE } from "./state.js";
import { renderPage, renderPagination, updateStatus } from "./render.js";

/* ── Helpers ────────────────────────────────────────────────────── */

function val(id)      { return (document.getElementById(id)?.value || "").trim().toLowerCase(); }
function checked(id)  { return !!document.getElementById(id)?.checked; }
function numVal(id)   { const v = parseInt(document.getElementById(id)?.value); return isNaN(v) ? null : v; }

function yearOf(dc) {
  const m = (dc.date || "").match(/\b(1\d{3}|20\d{2})\b/);
  return m ? parseInt(m[1]) : null;
}

/* ── Predicate builders ─────────────────────────────────────────── */
/* Each function returns null (inactive) or a predicate (p => bool).
   Adding a new filter = adding one entry here.                      */

function artistPredicate() {
  const v = val("filterArtist");
  if (!v) return null;
  return p => p._dc.creator.toLowerCase().includes(v);
}

function titlePredicate() {
  const v = val("filterTitle");
  if (!v) return null;
  return p =>
    p._dc.displayTitle.toLowerCase().includes(v) ||
    p._dc.title.toLowerCase().includes(v);
}

function stereoPredicate() {
  if (!checked("filter3D")) return null;
  const terms = ["3d", "stereoscop", "anaglyph", "stereoview"];
  return p => {
    const hay = (p._dc.displayTitle + " " + p._dc.subject + " " + p._dc.description).toLowerCase();
    return terms.some(t => hay.includes(t));
  };
}

function yearRangePredicate() {
  const from = numVal("filterYearFrom");
  const to   = numVal("filterYearTo");
  if (!from && !to) return null;
  return p => {
    const y = yearOf(p._dc);
    if (y === null) return false;
    if (from && y < from) return false;
    if (to   && y > to)   return false;
    return true;
  };
}

function dcTypePredicate() {
  const selected = [...document.querySelectorAll('input[name="dcType"]:checked')].map(el => el.value);
  if (!selected.length) return null;
  return p => selected.includes(p._dc.type);
}

function licensePredicate() {
  const v = val("licenseFilter");
  if (!v) return null;
  return p =>
    p._dc._licenseShort.toLowerCase().includes(v) ||
    p._dc.rights.toLowerCase().includes(v);
}

function locationPredicate() {
  const v = val("filterLocation");
  if (!v) return null;
  return p => {
    const hay = (p._dc.spatial + " " + p._dc.subject + " " + p._dc.description).toLowerCase();
    return hay.includes(v);
  };
}

function gpsPredicate() {
  const v = (document.getElementById("filterGps")?.value || "").trim();
  if (!v) return null;
  return p => p._dc.spatial.toLowerCase().includes(v.toLowerCase());
}

function mediaTypePredicate() {
  const t = document.querySelector('input[name="mediaType"]:checked')?.value || "all";
  if (t === "all")   return null;
  if (t === "image") return p => p._dc._mimeType.startsWith("image/");
  if (t === "audio") return p => p._dc._mimeType.startsWith("audio/");
  if (t === "video") return p => p._dc._mimeType.startsWith("video/");
  return null;
}

function buildPredicates() {
  return [
    mediaTypePredicate(),
    artistPredicate(),
    titlePredicate(),
    stereoPredicate(),
    yearRangePredicate(),
    dcTypePredicate(),
    licensePredicate(),
    locationPredicate(),
    gpsPredicate(),
  ].filter(Boolean);
}

/* ── Sort ───────────────────────────────────────────────────────── */

function sortResults(results) {
  const sort = document.getElementById("sortOrder")?.value || "relevance";
  if (sort !== "date_desc" && sort !== "date_asc") return results;

  return [...results].sort((a, b) => {
    const da = a._dc.date || "", db = b._dc.date || "";
    if (!da && !db) return 0;
    if (!da) return 1;
    if (!db) return -1;
    return sort === "date_desc" ? db.localeCompare(da) : da.localeCompare(db);
  });
}

/* ── Public ─────────────────────────────────────────────────────── */

export function applyFilters() {
  const predicates = buildPredicates();

  state.filteredResults = sortResults(
    state.allResults.filter(p => predicates.every(fn => fn(p)))
  );

  state.currentPage = 1;
  state.totalPages  = Math.ceil(state.filteredResults.length / RESULTS_PER_PAGE) || 1;

  renderPage(state.currentPage);
  renderPagination();
  updateStatus();
}

export function clearAllFilters() {
  const textIds = ["filterArtist", "filterTitle", "filterLocation", "filterGps",
                   "filterYearFrom", "filterYearTo"];
  textIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });

  const checkIds = ["filter3D"];
  checkIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.checked = false;
  });

  document.querySelectorAll('input[name="dcType"]').forEach(el => { el.checked = false; });

  const license = document.getElementById("licenseFilter");
  if (license) license.value = "";

  applyFilters();
}
