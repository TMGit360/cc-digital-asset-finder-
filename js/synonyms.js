/* ─────────────────────────────────────────────────────────────────
   Query expansion: maps casual user language to Wikimedia Commons
   terminology so that broad natural-language queries find more of
   the relevant files that formal/scientific naming would otherwise
   hide. Only applied for "All Fields" and "Description" searches.

   Each entry: [regex, [synonyms...]]
   Rules are tested in order — put specific patterns BEFORE generic
   ones so "polar bear" matches before the generic "bear" rule.
   ───────────────────────────────────────────────────────────────── */

const EXPANSIONS = [

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
    ["ocean waves", "wave audio", "sea sound", "surf recording"]],

  [/\bwind\s+sound(s)?\b|\bbreeze\s+sound(s)?\b/i,
    ["wind audio", "wind recording", "breeze sound"]],

  [/\bfire\s+sound(s)?\b|\bcrackling\s+fire\b|\bcampfire\s+sound(s)?\b/i,
    ["fire crackling", "campfire audio", "fire recording"]],

  [/\bwaterfall\s+sound(s)?\b|\bstream\s+sound(s)?\b|\bbrook\s+sound(s)?\b/i,
    ["waterfall audio", "stream sound", "brook audio", "flowing water"]],

  /* ── Amphibians & insects ───────────────────────────────────── */
  [/\bfrog\s+sound(s)?\b|\bfrog\s+call(s)?\b|\bfrog\s+croak(s)?\b/i,
    ["frog call", "frog vocalization", "amphibian call", "anuran sound"]],

  [/\binsect\s+sound(s)?\b|\bcricket\s+sound(s)?\b|\bcicada\s+sound(s)?\b/i,
    ["insect stridulation", "cricket sound", "cicada sound", "insect audio"]],

  /* ── Domestic animal sounds ─────────────────────────────────── */
  [/\bcat\s+(sound(s)?|meow(s)?|purr(s)?|noise)\b/i,
    ["cat vocalization", "domestic cat audio", "cat meow", "cat purring"]],

  [/\bdog\s+(sound(s)?|bark(s)?|howl(s)?|noise)\b/i,
    ["dog bark", "dog vocalization", "canine audio", "dog howling"]],

  /* ── Wildlife — specific before generic ─────────────────────── */
  [/\bpolar bear(s)?\b/i,
    ["ursus maritimus", "polar bear Arctic", "polar bear behavior"]],

  [/\bgrizzly\s*(bear)?(s)?\b/i,
    ["ursus arctos", "grizzly bear", "brown bear North America"]],

  [/\bkiller whale(s)?\b|\borca(s)?\b/i,
    ["orca", "orcinus orca", "killer whale pod"]],

  [/\bhumpback whale(s)?\b/i,
    ["humpback whale", "megaptera novaeangliae", "whale song"]],

  [/\bwolf\s+howl(s)?\b/i,
    ["wolf vocalization", "canis lupus howling", "wolf howl audio"]],

  [/\bwhale\s+(song|sound(s)?|call(s)?)\b/i,
    ["whale vocalization", "humpback song", "cetacean call", "whale audio"]],

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
    ["aurora borealis", "aurora australis", "polar aurora"]],

  [/\bvolcano\b|\bvolcanic\b|\beruption\b/i,
    ["volcanic eruption", "lava flow", "eruption footage"]],

  [/\bearthquake\b|\bseism(ic)?\b/i,
    ["earthquake footage", "seismic activity", "earthquake damage"]],

  /* ── Historical abbreviations ───────────────────────────────── */
  [/\bwwi\b|\bworld war\s*(i|1|one)\b|\bfirst world war\b/i,
    ["World War I", "First World War", "Great War"]],

  [/\bwwii\b|\bworld war\s*(ii|2|two)\b|\bsecond world war\b/i,
    ["World War II", "Second World War"]],

  /* ── Music genres ───────────────────────────────────────────── */
  [/\bfolk\s+music\b|\bfolk\s+song(s)?\b/i,
    ["traditional music", "folk recording", "traditional song"]],

  [/\bclassical\s+music\b/i,
    ["classical music recording", "orchestra performance", "symphony"]],

  [/\bjazz\b/i,
    ["jazz music", "jazz recording", "jazz performance"]],

];

/**
 * Expand a raw user query with synonyms / Wikimedia-relevant terms.
 *
 * For recognised patterns, builds a CirrusSearch OR query so that
 * the Wikimedia API returns files matching any of the related terms.
 * Multi-word terms are quoted for exact-phrase matching.
 * Returns the original query unchanged when no pattern matches.
 *
 * @param {string} rawQuery
 * @returns {{ query: string, hints: string[] }}
 */
export function expandQuery(rawQuery) {
  const q = (rawQuery || "").trim();
  if (!q) return { query: q, hints: [] };

  for (const [pattern, synonyms] of EXPANSIONS) {
    if (pattern.test(q)) {
      const allTerms = [q, ...synonyms];
      const parts    = allTerms.map(t => (t.includes(" ") ? `"${t}"` : t));
      return { query: parts.join(" OR "), hints: synonyms };
    }
  }

  return { query: q, hints: [] };
}
