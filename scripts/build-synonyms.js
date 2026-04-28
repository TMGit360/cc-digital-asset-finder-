#!/usr/bin/env node
/**
 * Regenerates js/synonyms-data.js from live Wiktionary Thesaurus pages.
 *
 * For each word in SEED_WORDS, fetches:
 *   https://en.wiktionary.org/wiki/Thesaurus:<word>
 *
 * Extracts Synonyms and Hyponyms sections, merges with any existing
 * data already in synonyms-data.js so hand-curated entries are preserved.
 *
 * Usage:
 *   node scripts/build-synonyms.js            # update all seed words
 *   node scripts/build-synonyms.js bird music # update specific words only
 *
 * Rate-limited to ~3 req/s (well under Wikimedia's 200 req/min limit).
 * Expect ~2–4 minutes for the full seed list.
 */

"use strict";

const https  = require("https");
const fs     = require("fs");
const path   = require("path");

const OUTPUT = path.resolve(__dirname, "../js/synonyms-data.js");
const DELAY_MS = 350; // ~3 req/s

/* ── Seed word list ─────────────────────────────────────────────────
   Covers all major Wikimedia Commons topic areas.
   Add words freely — the script handles missing Thesaurus pages
   gracefully (they stay as empty entries or are skipped).
   ─────────────────────────────────────────────────────────────── */
const SEED_WORDS = [
  // Birds
  "bird", "sparrow", "robin", "hawk", "eagle", "owl", "parrot", "duck",
  "heron", "crow", "flamingo", "pelican", "pigeon", "swallow", "woodpecker",
  "penguin", "vulture", "stork", "kingfisher", "crane", "albatross",
  "finch", "warbler", "thrush", "blackbird", "nightingale", "swift",
  // Mammals
  "dog", "cat", "horse", "rabbit", "squirrel", "bat", "seal", "otter",
  "beaver", "rat", "hedgehog", "elephant", "tiger", "lion", "bear",
  "wolf", "fox", "deer", "gorilla", "chimpanzee", "dolphin", "whale",
  "shark", "crocodile", "monkey", "giraffe", "zebra", "rhinoceros",
  "hippopotamus", "camel", "boar", "badger", "weasel", "mink",
  // Reptiles & Amphibians
  "snake", "lizard", "turtle", "frog", "salamander", "toad",
  // Insects & Invertebrates
  "butterfly", "bee", "beetle", "spider", "ant", "dragonfly",
  "grasshopper", "moth", "wasp", "fly", "mosquito", "snail", "worm",
  // Marine life
  "fish", "salmon", "coral", "jellyfish", "crab", "octopus", "starfish",
  "lobster", "shrimp", "oyster", "clam", "eel", "ray",
  // Plants
  "tree", "flower", "grass", "mushroom", "fern", "moss", "rose", "oak",
  "palm", "cactus", "bamboo", "seaweed", "sunflower", "lily", "orchid",
  "tulip", "wheat", "rice", "lavender", "pine", "maple", "willow",
  "ivy", "vine", "berry", "fir", "birch", "ash", "chestnut",
  // Geography & Landforms
  "mountain", "river", "lake", "ocean", "desert", "forest", "island",
  "glacier", "cave", "canyon", "waterfall", "coast", "valley", "swamp",
  "cliff", "dune", "tundra", "savanna", "reef", "fjord", "plateau",
  "peninsula", "delta", "estuary", "lagoon",
  // Weather
  "rain", "snow", "storm", "cloud", "fog", "lightning", "tornado",
  "hurricane", "rainbow", "aurora", "flood", "drought", "hail",
  "frost", "blizzard",
  // Music
  "song", "music", "guitar", "piano", "violin", "drum", "flute",
  "trumpet", "harp", "organ", "opera", "orchestra", "choir", "dance",
  "blues", "lute", "accordion", "bagpipe", "sitar", "tabla",
  "melody", "harmony", "rhythm", "instrument",
  // History & Architecture
  "castle", "church", "mosque", "temple", "pyramid", "ruins", "bridge",
  "lighthouse", "palace", "monument", "coin", "manuscript", "map",
  "sword", "armor", "aqueduct", "amphitheater", "colosseum", "acropolis",
  "fortress", "citadel", "tower", "arch", "column",
  // Science & Astronomy
  "star", "planet", "galaxy", "comet", "moon", "crystal", "fossil",
  "atom", "diamond", "nebula", "volcano", "cell", "dna", "microscope",
  "telescope", "eclipse", "meteor", "satellite", "orbit",
  // Art & Visual
  "painting", "sculpture", "drawing", "photograph", "mosaic", "mural",
  "tapestry", "print", "pottery", "textile", "fresco", "icon",
  // Human activities & transport
  "boat", "sailing", "fishing", "farming", "climbing", "cycling",
  "swimming", "market", "festival", "wedding", "prayer", "harvest",
  "pottery", "weaving", "archery", "wrestling",
];

/* ── Wikitext parsers ───────────────────────────────────────────── */

/**
 * Extract all [[word]] and {{l|en|word}} link targets from a wikitext string.
 * Filters to plain English words/phrases (no file:, template:, etc.)
 */
function extractLinks(wikitext) {
  const terms = new Set();
  // {{l|en|word}} or {{l|en|word|display}}
  for (const m of wikitext.matchAll(/\{\{l\|en\|([^|}]+)(?:\|[^}]*)?\}\}/gi)) {
    const t = m[1].trim();
    if (t && !/[{}[\]|<>]/.test(t)) terms.add(t.toLowerCase());
  }
  // [[word]] or [[word|display]]
  for (const m of wikitext.matchAll(/\[\[([^\]|#]+)(?:\|[^\]]+)?\]\]/g)) {
    const t = m[1].trim();
    if (t && !/[:{}]/.test(t) && !/^(file|image|category|wiktionary):/i.test(t))
      terms.add(t.toLowerCase());
  }
  return [...terms];
}

/**
 * Parse a Thesaurus wikitext page and return { synonyms, hyponyms }.
 * Only reads the English noun section.
 */
function parseThesaurusPage(wikitext, word) {
  const results = { synonyms: [], hyponyms: [] };
  if (!wikitext) return results;

  // Find the English section
  const englishMatch = wikitext.match(/== English ==([\s\S]*?)(?=\n== [A-Z]|\n==\s*[A-Z]|$)/);
  const section = englishMatch ? englishMatch[1] : wikitext;

  // Extract Synonyms section
  const synMatch = section.match(/==== Synonyms? ====\n([\s\S]*?)(?=\n====|\n===|$)/i);
  if (synMatch) {
    const links = extractLinks(synMatch[1]);
    results.synonyms = links.filter(t => t !== word.toLowerCase()).slice(0, 20);
  }

  // Extract Hyponyms section
  const hypoMatch = section.match(/==== Hyponyms? ====\n([\s\S]*?)(?=\n====|\n===|$)/i);
  if (hypoMatch) {
    const links = extractLinks(hypoMatch[1]);
    results.hyponyms = links.filter(t => t !== word.toLowerCase()).slice(0, 25);
  }

  // Also check Coordinate terms as a supplement to hyponyms
  const coordMatch = section.match(/==== Coordinate terms? ====\n([\s\S]*?)(?=\n====|\n===|$)/i);
  if (coordMatch) {
    const links = extractLinks(coordMatch[1]);
    const extra = links.filter(t => t !== word.toLowerCase() && !results.hyponyms.includes(t));
    results.hyponyms.push(...extra.slice(0, 8));
  }

  return results;
}

/* ── HTTP helpers ────────────────────────────────────────────────── */

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "digital-asset-finder/1.0 build-synonyms.js" } }, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return resolve(httpsGet(res.headers.location));
      }
      let body = "";
      res.on("data", chunk => { body += chunk; });
      res.on("end", () => resolve({ status: res.statusCode, body }));
    }).on("error", reject);
  });
}

async function fetchThesaurusPage(word) {
  const title = `Thesaurus:${encodeURIComponent(word)}`;
  const url   = `https://en.wiktionary.org/w/api.php?action=query&titles=${title}&prop=revisions&rvprop=content&rvslots=main&format=json&formatversion=2`;
  const { status, body } = await httpsGet(url);
  if (status !== 200) return null;

  let data;
  try { data = JSON.parse(body); } catch { return null; }

  const pages = data?.query?.pages;
  if (!pages?.length) return null;
  const page = pages[0];
  if (page.missing) return null;

  return page?.revisions?.[0]?.slots?.main?.content || null;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

/* ── Merge helpers ───────────────────────────────────────────────── */

/**
 * Build a merged expansion list: synonyms first, then hyponyms, deduped.
 * Removes stopwords and terms that are too long or contain brackets.
 */
const STOPWORDS = new Set(["the", "a", "an", "of", "or", "and", "in", "on", "at", "to", "for", "is", "are"]);

function buildExpansion(word, synonyms, hyponyms) {
  const seen = new Set([word.toLowerCase()]);
  const out  = [];
  for (const t of [...synonyms, ...hyponyms]) {
    const clean = t.trim().toLowerCase();
    if (!clean || seen.has(clean)) continue;
    if (STOPWORDS.has(clean)) continue;
    if (clean.length < 2 || clean.length > 60) continue;
    if (/[{}[\]<>]/.test(clean)) continue;
    seen.add(clean);
    out.push(clean);
  }
  return out.slice(0, 15);
}

/* ── Load existing data ──────────────────────────────────────────── */

function loadExistingData() {
  if (!fs.existsSync(OUTPUT)) return {};
  const src = fs.readFileSync(OUTPUT, "utf8");
  const match = src.match(/export const SYNONYMS_DATA = (\{[\s\S]*?\n\});/);
  if (!match) return {};
  try {
    // Safe parse: convert JS object literal to JSON
    const json = match[1]
      .replace(/\/\/[^\n]*/g, "")           // strip line comments
      .replace(/,(\s*[}\]])/g, "$1")        // trailing commas
      .replace(/(['"])?(\w[\w\s]*)(['"])?\s*:/g, '"$2":') // unquoted keys
      .replace(/'/g, '"');                   // single → double quotes
    return JSON.parse(json);
  } catch {
    return {};
  }
}

/* ── Write output ────────────────────────────────────────────────── */

function writeOutput(data) {
  const lines = ["/* ─────────────────────────────────────────────────────────────────"];
  lines.push("   Semantic relation data for query expansion.");
  lines.push("   Source: Wiktionary Thesaurus (synonyms + hyponyms), curated for");
  lines.push("   Wikimedia Commons terminology.");
  lines.push("");
  lines.push(`   Last updated: ${new Date().toISOString().slice(0, 10)}`);
  lines.push("   Refresh with:  node scripts/build-synonyms.js");
  lines.push("   ───────────────────────────────────────────────────────────────── */");
  lines.push("");
  lines.push("export const SYNONYMS_DATA = {");

  const sorted = Object.keys(data).sort();
  for (const word of sorted) {
    const terms = data[word];
    if (!terms || !terms.length) continue;
    const vals = terms.map(t => JSON.stringify(t)).join(", ");
    lines.push(`  ${JSON.stringify(word)}: [${vals}],`);
  }

  lines.push("};", "");
  fs.writeFileSync(OUTPUT, lines.join("\n"), "utf8");
}

/* ── Main ────────────────────────────────────────────────────────── */

async function main() {
  const targets = process.argv.slice(2).length
    ? process.argv.slice(2)
    : SEED_WORDS;

  console.log(`Fetching Thesaurus data for ${targets.length} words…`);

  const existing = loadExistingData();
  const results  = { ...existing };
  let   fetched  = 0;
  let   found    = 0;
  let   missing  = 0;

  for (const word of targets) {
    process.stdout.write(`  ${word.padEnd(20)}`);
    try {
      const wikitext = await fetchThesaurusPage(word);
      if (!wikitext) {
        process.stdout.write("(no Thesaurus page)\n");
        missing++;
        // Keep existing data for this word if we have it
        await sleep(DELAY_MS);
        continue;
      }

      const { synonyms, hyponyms } = parseThesaurusPage(wikitext, word);
      const expansion = buildExpansion(word, synonyms, hyponyms);

      if (expansion.length) {
        results[word] = expansion;
        process.stdout.write(`${expansion.length} terms\n`);
        found++;
      } else {
        process.stdout.write("(no terms extracted)\n");
        missing++;
      }
    } catch (err) {
      process.stdout.write(`ERROR: ${err.message}\n`);
    }

    fetched++;
    await sleep(DELAY_MS);
  }

  writeOutput(results);

  console.log(`\nDone. ${found} words enriched, ${missing} with no Thesaurus data.`);
  console.log(`Output: ${OUTPUT}`);
}

main().catch(err => { console.error(err); process.exit(1); });
