import { state, RESULTS_PER_PAGE } from "./state.js";
import { safeHtml, sanitizeMime, sanitizeUrl, formatDate } from "./api.js";

const resultsEl      = document.getElementById("results");
const statusEl       = document.getElementById("status");
const paginationWrap = document.getElementById("paginationWrap");
const pageIndicator  = document.getElementById("pageIndicator");
const paginationEl   = document.getElementById("pagination");

const resultMap = new Map(); // pageid → result, for modal lookup

/* ── Card click: open record modal ──────────────────────────────── */

resultsEl.addEventListener("click", e => {
  const btn = e.target.closest(".metadata-toggle");
  if (!btn) return;
  const card = btn.closest(".asset-card");
  if (card?.dataset.pageid) openRecordModal(card.dataset.pageid);
});

/* ── Media element (card thumbnail) ────────────────────────────── */

function renderMediaElement(info, displayTitle) {
  const mimeType = sanitizeMime(info.mime);
  const mediaUrl = sanitizeUrl(info.url);
  const thumbUrl = sanitizeUrl(info.thumburl) || mediaUrl;
  const altText  = safeHtml(displayTitle || "Media asset");

  if (!mimeType) {
    return `<div class="asset-audio-wrap">
      <span style="color:var(--color-text-muted);font-size:.875rem">Unsupported format</span>
    </div>`;
  }

  if (mimeType.startsWith("audio/")) {
    return `<div class="asset-audio-wrap">
      <audio controls aria-label="${altText}">
        <source src="${safeHtml(mediaUrl)}" type="${safeHtml(mimeType)}">
        Your browser does not support audio. <a href="${safeHtml(sanitizeUrl(info.descriptionurl || ""))}" target="_blank" rel="noopener noreferrer">View on Wikimedia</a>.
      </audio>
    </div>`;
  }

  if (mimeType.startsWith("video/")) {
    return `<video controls class="asset-thumb" aria-label="${altText}">
      <source src="${safeHtml(mediaUrl)}" type="${safeHtml(mimeType)}">
      Your browser does not support video. <a href="${safeHtml(sanitizeUrl(info.descriptionurl || ""))}" target="_blank" rel="noopener noreferrer">View on Wikimedia</a>.
    </video>`;
  }

  return `<img src="${safeHtml(thumbUrl)}" class="asset-thumb" alt="${altText}" loading="lazy">`;
}

/* ── Media element (modal — uses original URL where possible) ───── */

function renderModalMedia(info, displayTitle) {
  const mimeType = sanitizeMime(info.mime);
  const mediaUrl = sanitizeUrl(info.url);
  const thumbUrl = sanitizeUrl(info.thumburl) || mediaUrl;
  const altText  = safeHtml(displayTitle || "Media asset");

  if (!mimeType) return "";

  if (mimeType.startsWith("audio/")) {
    return `<div class="asset-audio-wrap">
      <audio controls aria-label="${altText}">
        <source src="${safeHtml(mediaUrl)}" type="${safeHtml(mimeType)}">
      </audio>
    </div>`;
  }

  if (mimeType.startsWith("video/")) {
    return `<video controls aria-label="${altText}">
      <source src="${safeHtml(mediaUrl)}" type="${safeHtml(mimeType)}">
    </video>`;
  }

  return `<img src="${safeHtml(thumbUrl)}" alt="${altText}" loading="lazy">`;
}

/* ── Dublin Core metadata rows ──────────────────────────────────── */

function buildMetadataRows(dc) {
  const rows = [
    { term: "dc:title",             label: "Title",            value: dc.title },
    { term: "dc:creator",           label: "Creator",          value: dc.creator },
    { term: "dc:contributor",       label: "Contributor",      value: dc.contributor },
    { term: "dc:description",       label: "Description",      value: dc.description },
    { term: "dc:subject",           label: "Subject",          value: dc.subject },
    { term: "dc:date",              label: "Date",             value: dc.date },
    { term: "dcterms:modified",     label: "Modified",         value: dc.dateModified },
    { term: "dc:type",              label: "Type",             value: dc.type },
    { term: "dc:format",            label: "Format",           value: dc.format },
    { term: "dcterms:medium",       label: "Medium",           value: dc.medium },
    { term: "dcterms:extent",       label: "Extent",           value: dc.extent },
    { term: "dc:publisher",         label: "Publisher",        value: dc.publisher },
    { term: "dc:source",            label: "Source",           value: dc.source,      isUrl: true },
    { term: "dc:identifier",        label: "Identifier",       value: dc.identifier },
    { term: "dc:language",          label: "Language",         value: dc.language },
    { term: "dcterms:spatial",      label: "Spatial Coverage", value: dc.spatial },
    { term: "dc:rights",            label: "Rights",           value: dc.rights },
    { term: "dcterms:license",      label: "License",          value: dc.licenseUrl,  isUrl: true },
    { term: "dcterms:accessRights", label: "Access Rights",    value: dc.accessRights },
    { term: "—",                    label: "Asset Page",       value: dc.assetPage,   isUrl: true },
  ];

  return rows
    .filter(r => r.value && String(r.value).trim())
    .map(r => {
      const isUrl = r.isUrl || /^https?:\/\//i.test(r.value);
      let displayVal;
      if (isUrl) {
        const safe  = safeHtml(r.value);
        const label = r.value.length > 60 ? safeHtml(r.value.slice(0, 60) + "…") : safe;
        displayVal  = `<a href="${safe}" target="_blank" rel="noopener noreferrer">${label}</a>`;
      } else {
        displayVal = safeHtml(r.value);
      }
      return `<div class="dc-row">
        <span class="dc-term" title="${safeHtml(r.term)}">${safeHtml(r.label)}</span>
        <span class="dc-value">${displayVal}</span>
      </div>`;
    })
    .join("");
}

/* ── Results page ───────────────────────────────────────────────── */

export function renderPage(page) {
  resultsEl.innerHTML = "";

  const start = (page - 1) * RESULTS_PER_PAGE;
  const slice = state.filteredResults.slice(start, start + RESULTS_PER_PAGE);

  if (!slice.length) {
    statusEl.textContent  = "No results match the current filters.";
    paginationWrap.hidden = true;
    return;
  }

  const badgeLabel = { Image: "IMAGE", Sound: "AUDIO", MovingImage: "VIDEO" };

  slice.forEach((p) => {
    const dc      = p._dc;
    const info    = p.imageinfo[0];
    const badge   = badgeLabel[dc.type] || dc.type.toUpperCase();
    const dateStr = formatDate(dc.date);

    resultMap.set(String(p.pageid), p);

    const col = document.createElement("article");
    col.className = "asset-card";
    col.setAttribute("data-pageid", String(p.pageid));

    col.innerHTML = `
      ${renderMediaElement(info, dc.displayTitle)}
      <div class="asset-body">
        <span class="asset-badge" aria-hidden="true">${safeHtml(badge)}</span>
        <h3 class="asset-title">${safeHtml(dc.displayTitle || "Untitled")}</h3>
        ${dateStr ? `<p class="asset-date">${safeHtml(dateStr)}</p>` : ""}
        <button class="metadata-toggle" type="button" aria-haspopup="dialog">
          <span class="toggle-arrow" aria-hidden="true">&#9654;</span>
          View Record
        </button>
      </div>
    `;

    resultsEl.appendChild(col);
  });
}

/* ── Record modal ────────────────────────────────────────────────── */

const recordDialog = document.getElementById("recordDialog");

function openRecordModal(pageid) {
  const p = resultMap.get(pageid);
  if (!p || !recordDialog) return;

  const dc   = p._dc;
  const info = p.imageinfo[0];
  const badgeLabel = { Image: "IMAGE", Sound: "AUDIO", MovingImage: "VIDEO" };

  document.getElementById("recordDialogBadge").textContent = badgeLabel[dc.type] || dc.type.toUpperCase();
  document.getElementById("recordDialogTitle").textContent = dc.displayTitle || "Untitled";
  document.getElementById("recordDialogMedia").innerHTML   = renderModalMedia(info, dc.displayTitle);
  document.getElementById("recordDialogMeta").innerHTML    = buildMetadataRows(dc);

  const link = document.getElementById("recordDialogLink");
  if (link) {
    link.hidden = !dc.assetPage;
    if (dc.assetPage) link.href = dc.assetPage;
  }

  document.body.style.overflow = "hidden";
  recordDialog.showModal();
}

if (recordDialog) {
  document.getElementById("recordDialogClose")?.addEventListener("click", () => recordDialog.close());
  recordDialog.addEventListener("click", e => { if (e.target === recordDialog) recordDialog.close(); });
  recordDialog.addEventListener("close", () => { document.body.style.overflow = ""; });
}

/* ── Status text ────────────────────────────────────────────────── */

export function updateStatus() {
  const total = state.filteredResults.length;
  if (!total) return;
  const start     = (state.currentPage - 1) * RESULTS_PER_PAGE + 1;
  const end       = Math.min(start + RESULTS_PER_PAGE - 1, total);
  const moreAvail = state.continueParams ? " — more results available" : "";
  statusEl.textContent = `Showing ${start}–${end} of ${total} results${moreAvail}`;
}

/* ── Pagination ─────────────────────────────────────────────────── */

function createPageItem(label, page, disabled = false, active = false) {
  const li  = document.createElement("li");
  li.className = `page-item${disabled ? " disabled" : ""}${active ? " active" : ""}`;

  const btn = document.createElement("button");
  btn.className   = "page-link";
  btn.type        = "button";
  btn.textContent = label;

  if (active)               btn.setAttribute("aria-current",  "page");
  if (disabled)             btn.setAttribute("aria-disabled", "true");
  if (label === "Previous") btn.setAttribute("aria-label",    "Go to previous page");
  if (label === "Next")     btn.setAttribute("aria-label",    "Go to next page");

  if (!disabled && !active) btn.addEventListener("click", () => goToPage(page));

  li.appendChild(btn);
  return li;
}

function createEllipsis() {
  const li = document.createElement("li");
  li.className = "page-item disabled";
  li.setAttribute("aria-hidden", "true");
  li.innerHTML = `<span class="page-link">…</span>`;
  return li;
}

export function renderPagination() {
  paginationEl.innerHTML = "";

  if (state.totalPages <= 1) { paginationWrap.hidden = true; return; }

  paginationWrap.hidden = false;
  pageIndicator.textContent = `Page ${state.currentPage} of ${state.totalPages}`;

  paginationEl.appendChild(createPageItem("Previous", state.currentPage - 1, state.currentPage === 1));

  let s = Math.max(1, state.currentPage - 2);
  let e = Math.min(state.totalPages, state.currentPage + 2);
  if (state.currentPage <= 3)                    e = Math.min(state.totalPages, 5);
  if (state.currentPage >= state.totalPages - 2) s = Math.max(1, state.totalPages - 4);

  if (s > 1) {
    paginationEl.appendChild(createPageItem("1", 1, false, state.currentPage === 1));
    if (s > 2) paginationEl.appendChild(createEllipsis());
  }

  for (let i = s; i <= e; i++) {
    paginationEl.appendChild(createPageItem(String(i), i, false, i === state.currentPage));
  }

  if (e < state.totalPages) {
    if (e < state.totalPages - 1) paginationEl.appendChild(createEllipsis());
    paginationEl.appendChild(createPageItem(String(state.totalPages), state.totalPages, false, state.currentPage === state.totalPages));
  }

  paginationEl.appendChild(createPageItem("Next", state.currentPage + 1, state.currentPage === state.totalPages));
}

export function goToPage(page) {
  if (page < 1 || page > state.totalPages) return;
  state.currentPage = page;
  renderPage(state.currentPage);
  renderPagination();
  updateStatus();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
