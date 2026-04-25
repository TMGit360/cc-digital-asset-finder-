import { state, RESULTS_PER_PAGE } from "./state.js";
import { renderPage, renderPagination, updateStatus } from "./render.js";

/* ── Helpers ────────────────────────────────────────────────────── */

function val(id)  { return (document.getElementById(id)?.value || "").trim().toLowerCase(); }
function numVal(id) { const v = parseInt(document.getElementById(id)?.value); return isNaN(v) ? null : v; }
function checkedVals(name) {
  return [...document.querySelectorAll(`input[name="${name}"]:checked`)].map(el => el.value);
}

function yearOf(dc) {
  const m = (dc.date || "").match(/\b(1\d{3}|20\d{2})\b/);
  return m ? parseInt(m[1]) : null;
}

/* ── MIME maps ──────────────────────────────────────────────────── */

const IMG_FORMAT_MIME = {
  jpeg: ["image/jpeg", "image/jpg"],
  png:  ["image/png"],
  svg:  ["image/svg+xml"],
  tiff: ["image/tiff"],
  webp: ["image/webp"],
  gif:  ["image/gif"],
};

const AUDIO_FORMAT_MIME = {
  ogg:  ["audio/ogg"],
  mp3:  ["audio/mpeg"],
  wav:  ["audio/wav"],
  flac: ["audio/flac", "audio/x-flac"],
};

const VIDEO_FORMAT_MIME = {
  webm: ["video/webm"],
  mp4:  ["video/mp4"],
  ogv:  ["video/ogg"],
};

/* ── Shared predicates ──────────────────────────────────────────── */

function mediaTypePredicate() {
  const t = document.querySelector('input[name="mediaType"]:checked')?.value || "all";
  if (t === "all")   return null;
  if (t === "image") return p => p._dc._mimeType.startsWith("image/");
  if (t === "audio") return p => p._dc._mimeType.startsWith("audio/");
  if (t === "video") return p => p._dc._mimeType.startsWith("video/");
  return null;
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

function licensePredicate() {
  const v = val("licenseFilter");
  if (!v) return null;
  const boundaryMatch = s => s === v || (s.startsWith(v) && /[\s\d]/.test(s[v.length] ?? ""));
  return p =>
    boundaryMatch(p._dc._licenseShort.toLowerCase()) ||
    boundaryMatch(p._dc.rights.toLowerCase());
}

function locationPredicate() {
  const v = val("filterLocation");
  if (!v) return null;
  return p => {
    const hay = (p._dc.spatial + " " + p._dc.subject + " " + p._dc.description).toLowerCase();
    return hay.includes(v);
  };
}

/* ── Image predicates ───────────────────────────────────────────── */

function imgFormatPredicate() {
  const selected = checkedVals("imgFormat");
  if (!selected.length) return null;
  return p => {
    if (!p._dc._mimeType.startsWith("image/")) return true;
    const mime = p._dc._mimeType;
    return selected.some(fmt => (IMG_FORMAT_MIME[fmt] || []).includes(mime));
  };
}

function imgSubjectPredicate() {
  const v = val("filterImgSubject");
  if (!v) return null;
  return p => {
    if (!p._dc._mimeType.startsWith("image/")) return true;
    const hay = (p._dc.subject + " " + p._dc.description).toLowerCase();
    return hay.includes(v);
  };
}

function mediumPredicate() {
  const v = val("filterMedium");
  if (!v) return null;
  return p => {
    if (!p._dc._mimeType.startsWith("image/")) return true;
    const hay = (p._dc.medium + " " + p._dc.description + " " + p._dc.subject).toLowerCase();
    return hay.includes(v);
  };
}

/* ── Audio predicates ───────────────────────────────────────────── */

function audioSubjectPredicate() {
  const v = val("filterAudioSubject");
  if (!v) return null;
  return p => {
    if (!p._dc._mimeType.startsWith("audio/")) return true;
    const hay = (p._dc.subject + " " + p._dc.description).toLowerCase();
    return hay.includes(v);
  };
}

function audioDurationPredicate() {
  const selected = checkedVals("audioDuration");
  if (!selected.length) return null;
  return p => {
    if (!p._dc._mimeType.startsWith("audio/")) return true;
    const dur = p._dc._duration;
    if (dur === null) return true;
    const isShort  = dur < 30;
    const isMedium = dur >= 30  && dur < 300;
    const isLong   = dur >= 300;
    return (selected.includes("short")  && isShort)  ||
           (selected.includes("medium") && isMedium) ||
           (selected.includes("long")   && isLong);
  };
}

function audioFormatPredicate() {
  const selected = checkedVals("audioFormat");
  if (!selected.length) return null;
  return p => {
    if (!p._dc._mimeType.startsWith("audio/")) return true;
    const mime = p._dc._mimeType;
    return selected.some(fmt => (AUDIO_FORMAT_MIME[fmt] || []).includes(mime));
  };
}

/* ── Video predicates ───────────────────────────────────────────── */

function videoDurationPredicate() {
  const selected = checkedVals("videoDuration");
  if (!selected.length) return null;
  return p => {
    if (!p._dc._mimeType.startsWith("video/")) return true;
    const dur = p._dc._duration;
    if (dur === null) return true;
    const isShort  = dur < 120;
    const isMedium = dur >= 120  && dur < 1200;
    const isLong   = dur >= 1200;
    return (selected.includes("short")  && isShort)  ||
           (selected.includes("medium") && isMedium) ||
           (selected.includes("long")   && isLong);
  };
}

function videoFormatPredicate() {
  const selected = checkedVals("videoFormat");
  if (!selected.length) return null;
  return p => {
    if (!p._dc._mimeType.startsWith("video/")) return true;
    const mime = p._dc._mimeType;
    return selected.some(fmt => (VIDEO_FORMAT_MIME[fmt] || []).includes(mime));
  };
}

function videoResPredicate() {
  const selected = checkedVals("videoRes");
  if (!selected.length) return null;
  return p => {
    if (!p._dc._mimeType.startsWith("video/")) return true;
    const isHD = p._dc._width >= 1280;
    return (selected.includes("hd") && isHD) || (selected.includes("sd") && !isHD);
  };
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
  const predicates = [
    mediaTypePredicate(),
    yearRangePredicate(),
    licensePredicate(),
    locationPredicate(),
    imgFormatPredicate(),
    imgSubjectPredicate(),
    mediumPredicate(),
    audioSubjectPredicate(),
    audioDurationPredicate(),
    audioFormatPredicate(),
    videoDurationPredicate(),
    videoFormatPredicate(),
    videoResPredicate(),
  ].filter(Boolean);

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
  ["filterYearFrom", "filterYearTo", "filterLocation",
   "filterImgSubject", "filterMedium", "filterAudioSubject"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });

  ["imgFormat", "audioDuration", "audioFormat",
   "videoDuration", "videoFormat", "videoRes"].forEach(name => {
    document.querySelectorAll(`input[name="${name}"]`).forEach(el => { el.checked = false; });
  });

  const license = document.getElementById("licenseFilter");
  if (license) license.value = "";

  applyFilters();
}
