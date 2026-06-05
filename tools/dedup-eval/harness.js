// Dedup evaluation harness.
//
// Loads the REAL dedup functions out of Ingestion/Code.js (no copy-paste) by
// running the file in a sandbox with Google-Apps-Script globals stubbed, then
// replays the labeled duplicate groups from dedup_articles.xlsx.
//
// Metrics (TITLE-ONLY — the xlsx has no summary column, so production's summary
// signal will add further recall on top of these numbers):
//   • Pair recall          — within-group duplicate pairs the dedup links.
//   • Fully-caught groups   — groups whose members form one connected component
//                             under the "caught" relation (every dup reachable).
//   • Cross-group FPs       — pairs from DIFFERENT labeled groups that get linked
//                             (human said different stories ⇒ a real false positive).
//
// Usage: node harness.js            (uses ../../Ingestion/Code.js from main clone)
//        node harness.js <path-to-Code.js>

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const XLSX = require('xlsx');

const CODE_PATH = process.argv[2] || path.join(__dirname, '..', '..', 'Ingestion', 'Code.js');
const XLSX_PATH = path.join(__dirname, '..', '..', 'dedup_articles.xlsx');

// ── Load Code.js with GAS globals shimmed ────────────────────────────────────
function loadCode(codePath) {
  // Universal stub: callable, and any property access returns itself. Covers
  // UrlFetchApp.fetch(...).getContentText() etc. without enumerating every API.
  const universal = new Proxy(function () {}, {
    get: () => universal,
    apply: () => universal,
    construct: () => universal,
  });
  const real = { Math, JSON, Date, String, Number, Boolean, Array, Object, RegExp, parseInt, parseFloat, isNaN, encodeURIComponent, decodeURIComponent, console };
  const sandbox = new Proxy({}, {
    has: () => true, // make every bare identifier "defined" so no ReferenceError at load
    get: (target, key) => (key in target ? target[key] : (real[key] !== undefined ? real[key] : universal)),
    set: (target, key, val) => { target[key] = val; return true; },
  });
  const ctx = vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(codePath, 'utf8'), ctx, { filename: codePath });
  return sandbox;
}

const code = loadCode(CODE_PATH);
const MIN_SCORE = (code.CONFIG && code.CONFIG.DEDUPE_REVIEW && code.CONFIG.DEDUPE_REVIEW.MIN_SCORE) || 0.55;

// ── The production "are these two duplicates?" decision, at pair level ────────
// Mirrors reviewDuplicateRecord_'s warm path: exact URL OR exact normalized
// title (source-agnostic, via DEDUP_TITLE_MAP_) → duplicate; else fuzzy scorer.
function caught(a, b) {
  const ua = code.cleanUrl(a.url || '');
  const ub = code.cleanUrl(b.url || '');
  if (ua && ub && ua === ub) return 'url';
  const ta = code.normalizeTitleForDedupe(a.title || '');
  const tb = code.normalizeTitleForDedupe(b.title || '');
  if (ta && tb && ta === tb) return 'title';
  const r = code.scorePossibleDuplicateMatch_(a, b); // returns null if < MIN_SCORE
  if (r && r.score >= MIN_SCORE) return 'fuzzy:' + r.reason + '(' + r.score.toFixed(2) + ')';
  return null;
}

// ── Load labeled data ────────────────────────────────────────────────────────
const rows = XLSX.utils.sheet_to_json(XLSX.readFile(XLSX_PATH).Sheets['Articles'], { defval: '' })
  .filter(r => String(r['Group #']).trim() !== '')
  .map(r => ({ id: r.id, title: String(r['Article Title'] || ''), url: String(r['URL'] || ''), source: String(r['Source / Feed'] || ''), group: String(r['Group #']).trim() }));

const groups = {};
rows.forEach(r => (groups[r.group] = groups[r.group] || []).push(r));
const multi = Object.entries(groups).filter(([, g]) => g.length >= 2);

// ── Pair recall + fully-caught groups ────────────────────────────────────────
let totalPairs = 0, caughtPairs = 0, fullyCaught = 0;
const misses = [];
for (const [gid, g] of multi) {
  // union-find over caught pairs to test connectivity
  const parent = g.map((_, i) => i);
  const find = x => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  for (let i = 0; i < g.length; i++) for (let j = i + 1; j < g.length; j++) {
    totalPairs++;
    const how = caught(g[i], g[j]);
    if (how) { caughtPairs++; parent[find(i)] = find(j); }
    else misses.push({ gid, a: g[i].title.slice(0, 55), b: g[j].title.slice(0, 55) });
  }
  const roots = new Set(g.map((_, i) => find(i)));
  if (roots.size === 1) fullyCaught++;
}

// ── Cross-group false positives (human-validated different stories) ──────────
let fp = 0; const fpSamples = [];
for (let i = 0; i < rows.length; i++) for (let j = i + 1; j < rows.length; j++) {
  if (rows[i].group === rows[j].group) continue;
  const how = caught(rows[i], rows[j]);
  if (how) { fp++; if (fpSamples.length < 12) fpSamples.push(how + ' :: ' + rows[i].title.slice(0,45) + ' || ' + rows[j].title.slice(0,45)); }
}

console.log('CODE:', path.relative(process.cwd(), CODE_PATH), '| MIN_SCORE', MIN_SCORE);
console.log('groups (size>=2):', multi.length, '| labeled rows:', rows.length);
console.log('PAIR RECALL:      ', caughtPairs + '/' + totalPairs, '=', (100*caughtPairs/totalPairs).toFixed(1) + '%');
console.log('FULLY-CAUGHT GRPS:', fullyCaught + '/' + multi.length, '=', (100*fullyCaught/multi.length).toFixed(1) + '%');
console.log('CROSS-GROUP FPs:  ', fp);
if (process.env.SHOW_FP) { console.log('\n-- FP samples --'); fpSamples.forEach(s => console.log('  ' + s)); }
if (process.env.SHOW_MISS) { console.log('\n-- misses (first 25) --'); misses.slice(0,25).forEach(m => console.log('  g'+m.gid+': '+m.a+'  ✗  '+m.b)); }
