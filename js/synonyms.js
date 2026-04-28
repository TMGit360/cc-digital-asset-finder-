/* ─────────────────────────────────────────────────────────────────
   Query expansion: two-tier pipeline.

   Tier 1 — WIKIMEDIA_PATTERNS (regex, higher priority)
     Handles compound phrases and Wikimedia-specific formal naming
     (e.g. "bird song" → "bird vocalization", "rain sound" → "rainfall audio").
     Specific patterns must appear BEFORE generic ones.

   Tier 2 — SYNONYMS_DATA (data-driven, fallback)
     Single-word and exact-phrase lookups from js/synonyms-data.js,
     derived from Wiktionary Thesaurus (synonyms + hyponyms).
     Refresh with: node scripts/build-synonyms.js

   Only applied for "All Fields" and "Description" field searches.
   ───────────────────────────────────────────────────────────────── */

import { SYNONYMS_DATA } from "./synonyms-data.js";

/* ── Tier 1: Wikimedia-specific compound patterns ───────────────── */

const WIKIMEDIA_PATTERNS = [

  /* ── Bird / avian sounds ────────────────────────────────────── */
  [
    /\bbird\s?song(s)?\b|\bbird\s+call(s)?\b|\bbird\s+sound(s)?\b|\bbird\s+singing\b|\bbirdsong(s)?\b/i,
    ["bird vocalization", "birdsong", "bird call", "bird singing", "avian sound"]
  ],

  /* ── Weather & ambient environment sounds ───────────────────── */
  [/\brain\s+sound(s)?\b|\bsound\s+of\s+rain\b|\braining\b/i,
    ["rainfall audio", "rain recording", "rainstorm sound", "precipitation"]],

  [/\bthunder(storm)?\s*(sound(s)?|noise|audio)?\b/i,
    ["thunderstorm audio", "thunder recording", "storm sound", "lightning storm"]],

  [/\bocean\s+sound(s)?\b|\bsea\s+sound(s)?\b|\bwave(s)?\s+sound(s)?\b/i,
    ["ocean waves", "wave audio", "sea sound", "surf recording", "ocean", "waves", "surf", "maritime"]],

  [/\bwind\s+sound(s)?\b|\bbreeze\s+sound(s)?\b/i,
    ["wind audio", "wind recording", "breeze sound", "wind", "breeze", "gust"]],

  [/\bfire\s+sound(s)?\b|\bcrackling\s+fire\b|\bcampfire\s+sound(s)?\b/i,
    ["fire crackling", "campfire audio", "fire recording", "fire", "campfire", "crackling"]],

  [/\bwaterfall\s+sound(s)?\b|\bstream\s+sound(s)?\b|\bbrook\s+sound(s)?\b/i,
    ["waterfall audio", "stream sound", "brook audio", "flowing water", "waterfall", "cascade", "stream", "brook"]],

  /* ── Amphibians & insects ───────────────────────────────────── */
  [/\bfrog\s+sound(s)?\b|\bfrog\s+call(s)?\b|\bfrog\s+croak(s)?\b/i,
    ["frog call", "frog vocalization", "amphibian call", "anuran sound", "frog", "toad", "anuran", "amphibian"]],

  [/\binsect\s+sound(s)?\b|\bcricket\s+sound(s)?\b|\bcicada\s+sound(s)?\b/i,
    ["insect stridulation", "cricket sound", "cicada sound", "insect audio", "insect", "cricket", "cicada", "stridulation"]],

  /* ── Domestic animal sounds ─────────────────────────────────── */
  [/\bcat\s+(sound(s)?|meow(s)?|purr(s)?|noise)\b/i,
    ["cat vocalization", "domestic cat audio", "cat meow", "cat purring", "cat", "feline", "meow", "purring"]],

  [/\bdog\s+(sound(s)?|bark(s)?|howl(s)?|noise)\b/i,
    ["dog bark", "dog vocalization", "canine audio", "dog howling", "dog", "canine", "barking", "howling"]],

  /* ── Wildlife — specific before generic ─────────────────────── */
  [/\bpolar bear(s)?\b/i,
    ["ursus maritimus", "polar bear Arctic", "polar bear behavior", "ursus", "polar", "arctic"]],

  [/\bgrizzly\s*(bear)?(s)?\b/i,
    ["ursus arctos", "grizzly bear", "brown bear North America", "ursus", "grizzly", "ursidae"]],

  [/\bkiller whale(s)?\b|\borca(s)?\b/i,
    ["orca", "orcinus orca", "killer whale pod"]],

  [/\bhumpback whale(s)?\b/i,
    ["humpback whale", "megaptera novaeangliae", "whale song", "humpback", "cetacean", "megaptera"]],

  [/\bwolf\s+howl(s)?\b/i,
    ["wolf vocalization", "canis lupus howling", "wolf howl audio", "wolf", "howling", "lupus"]],

  [/\bwhale\s+(song|sound(s)?|call(s)?)\b/i,
    ["whale vocalization", "humpback song", "cetacean call", "whale audio", "whale", "cetacean", "megaptera"]],

  /* ── Wildlife — generic ─────────────────────────────────────── */
  [/\bbear(s)?\b/i,
    ["brown bear", "polar bear", "grizzly bear", "black bear", "ursidae"]],

  [/\bwol(f|ves)\b/i,
    ["canis lupus", "grey wolf", "wolf pack", "wolf behavior"]],

  [/\belephant(s)?\b/i,
    ["elephas maximus", "african elephant", "loxodonta", "elephant herd"]],

  [/\bdolphin(s)?\b/i,
    ["bottlenose dolphin", "tursiops", "dolphin pod", "cetacean"]],

  [/\bwhale(s)?\b/i,
    ["humpback whale", "blue whale", "cetacean", "whale migration"]],

  [/\blion(s)?\b/i,
    ["panthera leo", "african lion", "lion pride", "lion behavior"]],

  [/\btiger(s)?\b/i,
    ["panthera tigris", "bengal tiger", "tiger habitat"]],

  [/\beagle(s)?\b/i,
    ["bald eagle", "golden eagle", "raptor flight", "bird of prey"]],

  [/\bshark(s)?\b/i,
    ["great white shark", "shark behavior", "selachii"]],

  [/\bpenguin(s)?\b/i,
    ["penguin colony", "spheniscidae", "penguin Antarctica"]],

  [/\bgorilla(s)?\b/i,
    ["western gorilla", "mountain gorilla", "gorilla gorilla"]],

  [/\bchimpanzee(s)?\b|\bchimp(s)?\b/i,
    ["pan troglodytes", "common chimpanzee", "chimpanzee behavior"]],

  [/\bfox\b|\bfoxes\b/i,
    ["vulpes vulpes", "red fox", "fox behavior"]],

  [/\bdeer\b|\bdoe\b|\bbuck\b/i,
    ["white-tailed deer", "odocoileus", "deer grazing", "cervidae"]],

  [/\bmoose\b|\belk\b/i,
    ["alces alces", "moose habitat", "elk herd"]],

  [/\bcrocodile(s)?\b|\balligator(s)?\b/i,
    ["crocodylus", "saltwater crocodile", "alligator behavior"]],

  /* ── Natural phenomena ──────────────────────────────────────── */
  [/\baurora\b|\bnorthern lights\b|\bsouthern lights\b/i,
    ["aurora borealis", "aurora australis", "polar aurora", "aurora", "borealis", "polar"]],

  [/\bvolcano\b|\bvolcanic\b|\beruption\b/i,
    ["volcanic eruption", "lava flow", "eruption footage"]],

  [/\bearthquake\b|\bseism(ic)?\b/i,
    ["earthquake footage", "seismic activity", "earthquake damage"]],

  /* ── Historical abbreviations ───────────────────────────────── */
  [/\bwwi\b|\bworld war\s*(i|1|one)\b|\bfirst world war\b/i,
    ["World War I", "First World War", "Great War", "WWI", "wartime", "trench"]],

  [/\bwwii\b|\bworld war\s*(ii|2|two)\b|\bsecond world war\b/i,
    ["World War II", "Second World War", "WWII", "wartime", "soldiers"]],

  /* ── Music genres ───────────────────────────────────────────── */
  [/\bfolk\s+music\b|\bfolk\s+song(s)?\b/i,
    ["traditional music", "folk recording", "traditional song", "folk", "traditional", "ballad"]],

  [/\bclassical\s+music\b/i,
    ["classical music recording", "orchestra performance", "symphony"]],

  [/\bjazz\b/i,
    ["jazz music", "jazz recording", "jazz performance"]],

];

/* ── Tier 2: data-driven lookup ─────────────────────────────────── */

function lookupTerms(word) {
  const w = word.toLowerCase().trim();
  if (SYNONYMS_DATA[w]) return SYNONYMS_DATA[w].slice(0, 12);
  // Simple plural normalisation: try without trailing -s / -es
  if (w.endsWith("ies")) {
    const stem = w.slice(0, -3) + "y";
    if (SYNONYMS_DATA[stem]) return SYNONYMS_DATA[stem].slice(0, 12);
  }
  if (w.endsWith("es") && SYNONYMS_DATA[w.slice(0, -2)])
    return SYNONYMS_DATA[w.slice(0, -2)].slice(0, 12);
  if (w.endsWith("s") && SYNONYMS_DATA[w.slice(0, -1)])
    return SYNONYMS_DATA[w.slice(0, -1)].slice(0, 12);
  return [];
}

/* ── Public API ─────────────────────────────────────────────────── */

/**
 * Expand a raw user query with synonyms / Wikimedia-relevant terms.
 *
 * Builds a CirrusSearch OR expression so the Wikimedia API returns
 * files matching any related term. Multi-word terms are quoted for
 * exact-phrase matching. Returns the original query unchanged when
 * no pattern or data entry matches.
 *
 * @param {string} rawQuery
 * @returns {{ query: string, hints: string[] }}
 */
export function expandQuery(rawQuery) {
  const q = (rawQuery || "").trim();
  if (!q) return { query: q, hints: [] };

  // Tier 1 — Wikimedia compound patterns (highest priority)
  for (const [pattern, terms] of WIKIMEDIA_PATTERNS) {
    if (pattern.test(q)) {
      const allTerms = [q, ...terms];
      const parts    = allTerms.map(t => (t.includes(" ") ? `"${t}"` : t));
      return { query: parts.join(" OR "), hints: terms };
    }
  }

  // Tier 2 — data-driven single-word expansion
  const terms = lookupTerms(q);
  if (terms.length) {
    const allTerms = [q, ...terms];
    const parts    = allTerms.map(t => (t.includes(" ") ? `"${t}"` : t));
    return { query: parts.join(" OR "), hints: terms };
  }

  return { query: q, hints: [] };
}
