import { TOPICS } from "./topics-data.js";

const KEY_SEP = "|";
const keyOf = (catId, idx) => `${catId}${KEY_SEP}${idx}`;

const HEADINGS_BY_KEY = (() => {
  const map = new Map();
  TOPICS.forEach(cat => {
    cat.headings.forEach((h, idx) => {
      map.set(keyOf(cat.id, idx), { catId: cat.id, heading: h });
    });
  });
  return map;
})();

let triggerBtn, panelBodyEl, accordionEl, applyBtn, clearBtn, liveEl, triggerBadge;
let _onApply;

const committed = new Set();
const pending   = new Set();

let liveTimer = null;

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function buildAccordion() {
  accordionEl.innerHTML = TOPICS.map(cat => {
    const collapseId = `topic-pane-${cat.id}`;
    const headerId   = `topic-head-${cat.id}`;
    const rows = cat.headings.map((h, idx) => {
      const k = keyOf(cat.id, idx);
      return `<label class="topic-row" data-key="${k}">
  <input type="checkbox" class="topic-row-cb" value="${k}">
  <span class="topic-row-label">${escapeHtml(h.label)}</span>
</label>`;
    }).join("");

    return `<section class="accordion-item topic-accordion-item" data-cat="${cat.id}">
  <h3 class="accordion-header" id="${headerId}">
    <button class="accordion-button collapsed topic-accordion-btn" type="button"
      data-bs-toggle="collapse" data-bs-target="#${collapseId}"
      aria-expanded="false" aria-controls="${collapseId}">
      <span class="topic-accordion-icon" aria-hidden="true">${cat.icon}</span>
      <span class="topic-accordion-label">${escapeHtml(cat.label)}</span>
      <span class="topic-cat-badge" data-cat-badge="${cat.id}" hidden></span>
    </button>
  </h3>
  <div id="${collapseId}" class="accordion-collapse collapse" aria-labelledby="${headerId}">
    <div class="accordion-body topic-accordion-body">${rows}</div>
  </div>
</section>`;
  }).join("");
}

function syncCheckboxesFromPending() {
  accordionEl.querySelectorAll(".topic-row-cb").forEach(cb => {
    cb.checked = pending.has(cb.value);
  });
}

function updateCategoryBadges() {
  const counts = new Map();
  pending.forEach(k => {
    const catId = k.slice(0, k.indexOf(KEY_SEP));
    counts.set(catId, (counts.get(catId) || 0) + 1);
  });
  accordionEl.querySelectorAll("[data-cat-badge]").forEach(el => {
    const n = counts.get(el.dataset.catBadge) || 0;
    if (n > 0) {
      el.textContent = n;
      el.hidden = false;
    } else {
      el.textContent = "";
      el.hidden = true;
    }
  });
}

function updateFooter() {
  const n = pending.size;
  applyBtn.disabled = n === 0;
  applyBtn.textContent = n === 0 ? "Apply" : `Apply (${n})`;
  clearBtn.disabled = n === 0;
}

function announceLive() {
  if (liveTimer) return;
  liveTimer = setTimeout(() => {
    liveTimer = null;
    if (!liveEl) return;
    const n = pending.size;
    liveEl.textContent = n === 0 ? "" : `${n} ${n === 1 ? "topic" : "topics"} selected`;
  }, 300);
}

function refreshUi() {
  updateCategoryBadges();
  updateFooter();
  announceLive();
}

function onCheckboxChange(e) {
  const cb = e.target.closest(".topic-row-cb");
  if (!cb) return;
  if (cb.checked) pending.add(cb.value);
  else            pending.delete(cb.value);
  refreshUi();
}

function onClearAll() {
  pending.clear();
  syncCheckboxesFromPending();
  refreshUi();
}

function buildCombinedQuery() {
  const queries = [];
  committed.forEach(k => {
    const entry = HEADINGS_BY_KEY.get(k);
    if (entry) queries.push(entry.heading.query);
  });
  if (queries.length === 0) return "";
  if (queries.length === 1) return queries[0];
  return queries.map(q => `(${q})`).join(" OR ");
}

function updateTriggerBadge() {
  if (!triggerBadge) return;
  const n = committed.size;
  if (n > 0) {
    triggerBadge.textContent = `(${n})`;
    triggerBadge.hidden = false;
  } else {
    triggerBadge.textContent = "";
    triggerBadge.hidden = true;
  }
}

function isPanelOpen() {
  return panelBodyEl && !panelBodyEl.hidden;
}

function openPanel() {
  if (!panelBodyEl) return;
  panelBodyEl.hidden = false;
  triggerBtn.setAttribute("aria-expanded", "true");
  pending.clear();
  committed.forEach(k => pending.add(k));
  syncCheckboxesFromPending();
  refreshUi();
}

function closePanel({ returnFocus = false } = {}) {
  if (!panelBodyEl) return;
  panelBodyEl.hidden = true;
  triggerBtn.setAttribute("aria-expanded", "false");
  if (liveEl) liveEl.textContent = "";
  if (returnFocus) triggerBtn.focus();
}

function togglePanel() {
  if (isPanelOpen()) closePanel();
  else openPanel();
}

function handleApply() {
  if (pending.size === 0) return;
  committed.clear();
  pending.forEach(k => committed.add(k));

  const query = buildCombinedQuery();
  updateTriggerBadge();
  closePanel();

  if (typeof _onApply === "function") {
    _onApply({ query, count: committed.size });
  }
}

export function initTopicPanel(onApply) {
  triggerBtn  = document.getElementById("browseTopicsBtn");
  panelBodyEl = document.getElementById("topicPanelBody");
  accordionEl = document.getElementById("topicAccordion");
  applyBtn    = document.getElementById("topicPanelApplyBtn");
  clearBtn    = document.getElementById("topicPanelClearBtn");
  liveEl      = document.getElementById("topicPanelLive");

  if (!triggerBtn || !panelBodyEl || !accordionEl || !applyBtn || !clearBtn) return;

  triggerBadge = triggerBtn.querySelector(".topic-trigger-badge");
  _onApply = onApply;

  buildAccordion();

  triggerBtn.addEventListener("click", togglePanel);
  accordionEl.addEventListener("change", onCheckboxChange);
  applyBtn.addEventListener("click", handleApply);
  clearBtn.addEventListener("click", onClearAll);

  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && isPanelOpen()) {
      e.stopPropagation();
      closePanel({ returnFocus: true });
    }
  });

  document.addEventListener("click", e => {
    if (!isPanelOpen()) return;
    if (panelBodyEl.contains(e.target)) return;
    if (triggerBtn.contains(e.target))  return;
    closePanel();
  });

  refreshUi();
  updateTriggerBadge();
}

export function clearTopicSelections() {
  committed.clear();
  pending.clear();
  if (accordionEl) syncCheckboxesFromPending();
  refreshUi();
  updateTriggerBadge();
}
