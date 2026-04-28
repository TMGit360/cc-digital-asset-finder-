import { FETCH_BATCH } from "./state.js";

/* ── Security utilities ─────────────────────────────────────────── */

export function sanitizeUrl(url) {
  if (!url) return "";
  const s = String(url).trim();
  return /^https?:\/\//i.test(s) ? s : "";
}

export function sanitizeMime(mime) {
  if (!mime) return "";
  const s = String(mime).toLowerCase().trim();
  return /^(image|audio|video)\//.test(s) ? s : "";
}

export function stripHtml(html) {
  if (!html) return "";
  const div = document.createElement("div");
  div.innerHTML = html;
  return (div.textContent || div.innerText || "").trim();
}

export function safeText(s) { return (s || "").replace(/\s+/g, " ").trim(); }

export function safeHtml(s) {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function getExt(meta, key) {
  return meta && meta[key] ? stripHtml(meta[key].value) : "";
}

export function formatDate(d) {
  const match = (d || "").match(/\b(1\d{3}|20\d{2})\b/);
  return match ? match[1] : "";
}

/* ── MIME mappings ──────────────────────────────────────────────── */

export const MIME_MEDIUM = {
  "image/jpeg":    "JPEG image",
  "image/jpg":     "JPEG image",
  "image/png":     "PNG image",
  "image/gif":     "GIF image",
  "image/svg+xml": "SVG graphic",
  "image/tiff":    "TIFF image",
  "image/webp":    "WebP image",
  "audio/ogg":     "OGG audio",
  "audio/mpeg":    "MP3 audio",
  "audio/wav":     "WAV audio",
  "audio/flac":    "FLAC audio",
  "audio/x-flac":  "FLAC audio",
  "video/webm":    "WebM video",
  "video/mp4":     "MP4 video",
  "video/ogg":     "OGG video",
};

export const MIME_DCTYPE = {
  "image/": "Image",
  "audio/": "Sound",
  "video/": "MovingImage",
};

/* ── API fetch ──────────────────────────────────────────────────── */

export async function fetchBatch(query, cont = null, gsrfiletype = null) {
  const url = new URL("https://commons.wikimedia.org/w/api.php");
  url.searchParams.set("origin",       "*");
  url.searchParams.set("format",       "json");
  url.searchParams.set("action",       "query");
  url.searchParams.set("generator",    "search");
  url.searchParams.set("gsrnamespace", "6");
  url.searchParams.set("gsrlimit",     String(FETCH_BATCH));
  url.searchParams.set("gsrsort",      "relevance");
  url.searchParams.set("prop",         "imageinfo|categories|info");
  url.searchParams.set("iiprop",       "url|extmetadata|mime|size");
  url.searchParams.set("cllimit",      "15");
  url.searchParams.set("inprop",       "url");

  // filetype: must be injected into the CirrusSearch query string (outside a
  // parenthesized OR group) — gsrfiletype as a URL parameter is broken on Commons.
  // Quoted multi-word phrases inside the OR group hit a complexity limit, so we
  // strip them and cap at 8 single-word terms for audio/video queries.
  let searchQuery = query;
  if (gsrfiletype === "audio" || gsrfiletype === "video") {
    const parts = query
      .split(/\s+OR\s+/i)
      .map(t => t.trim().replace(/^["']|["']$/g, ""))
      .filter(t => t && !t.includes(" "))
      .slice(0, 8);
    const safeTerms = parts.length ? parts.join(" OR ") : query;
    searchQuery = `(${safeTerms}) filetype:${gsrfiletype}`;
  }
  url.searchParams.set("gsrsearch", searchQuery);

  if (gsrfiletype !== "audio") url.searchParams.set("iiurlwidth", "520");
  if (cont) Object.entries(cont).forEach(([k, v]) => url.searchParams.set(k, String(v)));

  const resp = await fetch(url.toString());
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return resp.json();
}

export function apiFilterFor(type) {
  if (type === "audio") return "audio";
  if (type === "video") return "video";
  return null;
}

/* ── Dublin Core extraction ─────────────────────────────────────── */

export function extractDC(page) {
  const info = page.imageinfo[0];
  const meta = info.extmetadata || {};

  const categories = (page.categories || []).map(c =>
    safeText(c.title.replace(/^Category:/, ""))
  );

  const fileName = safeText(page.title || "")
    .replace(/^File:/, "")
    .replace(/\.[^/.]+$/, "")
    .replace(/_/g, " ");

  const rawTitle       = safeText(getExt(meta, "ObjectName"));
  const rawDescription = safeText(getExt(meta, "ImageDescription"));
  const title          = rawTitle;
  const displayTitle   = rawTitle || rawDescription || fileName;

  const creator     = safeText(getExt(meta, "Artist"));
  const contributor = safeText(getExt(meta, "Credit"));
  const description = rawDescription;

  const dateCreated  = safeText(getExt(meta, "DateTimeOriginal"));
  const dateModified = safeText(getExt(meta, "DateTime"));
  const date         = dateCreated || dateModified;

  const licenseShort = safeText(getExt(meta, "LicenseShortName"));
  const licenseUrl   = sanitizeUrl(safeText(getExt(meta, "LicenseUrl")));
  const usageTerms   = safeText(getExt(meta, "UsageTerms"));

  const attrRequired = safeText(getExt(meta, "AttributionRequired"));
  const permissions  = safeText(getExt(meta, "Permission"));
  const restrictions = safeText(getExt(meta, "Restrictions"));
  const accessRights = [
    attrRequired === "true" ? "Attribution required" : "",
    permissions,
    restrictions,
  ].filter(Boolean).join("; ");

  const language = safeText(getExt(meta, "Language"));

  const gpsLat = safeText(getExt(meta, "GPSLatitude"));
  const gpsLon = safeText(getExt(meta, "GPSLongitude"));
  const spatial = (gpsLat && gpsLon) ? `${gpsLat}, ${gpsLon}` : "";

  const mimeType   = sanitizeMime(info.mime);
  const fileSizeKb = info.size ? `${(info.size / 1024).toFixed(1)} KB` : "";
  const dims       = (info.width && info.height) ? `${info.width} × ${info.height} px` : "";
  const extent     = [dims, fileSizeKb].filter(Boolean).join("; ");

  const dcType = Object.entries(MIME_DCTYPE).find(([k]) => mimeType.startsWith(k))?.[1] || "Dataset";
  const medium = MIME_MEDIUM[mimeType] || mimeType;

  const pageUrl    = sanitizeUrl(page.fullurl || "");
  const fileUrl    = sanitizeUrl(info.url || "");
  const subject    = categories.length ? categories.join("; ") : "";
  const rights     = usageTerms || licenseShort;
  const identifier = page.pageid ? String(page.pageid) : "";

  return {
    title, displayTitle,
    creator, contributor, description, subject,
    date, dateModified: (dateModified && dateModified !== date) ? dateModified : "",
    type: dcType, format: mimeType, medium, extent,
    publisher: "Wikimedia Commons",
    source: pageUrl || fileUrl,
    identifier, language, spatial, rights, licenseUrl, accessRights,
    assetPage: pageUrl,
    _mimeType:     mimeType,
    _licenseShort: licenseShort,
    _width:        info.width  || 0,
    _duration:     typeof info.duration === "number" ? info.duration : null,
  };
}

/* ── Renderable check ───────────────────────────────────────────── */

export function isRenderable(page) {
  if (!page?.imageinfo?.[0]) return false;
  const info     = page.imageinfo[0];
  const mime     = sanitizeMime(info.mime);
  const mediaUrl = sanitizeUrl(info.url);
  const thumbUrl = sanitizeUrl(info.thumburl);
  if (mime.startsWith("audio/")) return !!mediaUrl;
  if (mime.startsWith("video/")) return !!mediaUrl;
  if (mime.startsWith("image/")) return !!(thumbUrl || mediaUrl);
  return false;
}
