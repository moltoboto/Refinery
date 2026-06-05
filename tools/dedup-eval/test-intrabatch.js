// Targeted proof of the v2.56 intra-batch fuzzy fix.
// The group harness compares every pair directly, so it can't show this fix —
// the bug is that a same-run, not-yet-in-Supabase article was never a fuzzy
// candidate. This simulates that exact scenario.
const fs = require('fs'); const path = require('path'); const vm = require('vm');
const universal = new Proxy(function(){}, { get:()=>universal, apply:()=>universal, construct:()=>universal });
const real = { Math, JSON, Date, String, Number, Boolean, Array, Object, RegExp, parseInt, parseFloat, isNaN, encodeURIComponent, decodeURIComponent, console };
const sb = new Proxy({}, { has:()=>true, get:(t,k)=> k in t ? t[k] : (real[k]!==undefined?real[k]:universal), set:(t,k,v)=>{t[k]=v;return true;} });
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','..','Ingestion','Code.js'),'utf8'), vm.createContext(sb));

const A = { id: 1, title: 'OpenAI launches GPT-5 with major reasoning upgrades', url: 'https://openai.com/a', source: 'OpenAI Blog', summary: '', date_added: '2026-01-01T00:00:00Z' };
const B = { id: 2, title: 'OpenAI launches GPT-5 reasoning model upgrade',      url: 'https://techcrunch.com/b', source: 'TechCrunch', summary: '', date_added: '2026-01-01T01:00:00Z' };

// Simulate an ingestion run: cache warmed empty (neither article in Supabase yet).
sb.INGESTION_DEDUP_CACHE_ = [];
sb.DEDUP_URL_MAP_ = {}; sb.DEDUP_TITLE_MAP_ = {};

const before = sb.findPossibleDuplicateCandidate_(B, {});
console.log('B arrives, A inserted earlier this run but NOT in fuzzy cache (old behavior):');
console.log('  match for B:', before ? `${before.reason} (${before.score.toFixed(2)})` : 'NONE  ← duplicate leaks through');

// A is inserted -> v2.56 appends it to the fuzzy candidate pool.
sb.addToFuzzyDedupCache_(A);
const after = sb.findPossibleDuplicateCandidate_(B, {});
console.log('\nAfter v2.56 addToFuzzyDedupCache_(A):');
console.log('  match for B:', after ? `${after.reason} (${after.score.toFixed(2)}) → routed to Duplicate review` : 'NONE');
console.log('\nRESULT:', (!before && after) ? 'PASS — intra-batch near-dup now caught' : 'no change');
