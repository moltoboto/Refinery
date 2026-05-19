# Refinery - Project Context

## What This Is
Two Google Apps Script apps that together form a personal news reader.
Newsletters and RSS feeds flow in through the Ingestion app -> Supabase -> displayed in the Viewer app.

## Operating Documents
- `CONTEXT.md` - durable project state, rules, gotchas, and change log
- `AUDIT_TRAIL.md` - session-by-session work log, validation notes, deployment status, and follow-up items
- `PROCESS.md` - workflow for pull/edit/push/deploy
- `BACKLOG.md` - operational queue of unscheduled work, held items, and horizon ideas

## Current Version
Ingestion: v2.47 | Viewer: v2.35

## Tech Stack
- **Runtime:** Google Apps Script (V8), JavaScript ES5 style
- **Database:** Supabase (PostgreSQL REST API via UrlFetchApp)
- **Frontend:** HTML/CSS/JS served via Apps Script doGet()
- **Fonts:** Lora + DM Sans (Google Fonts)
- **Storage:** Google Drive (newsletter artifact HTML files)

## Local File Structure
```
C:\Users\ThomasCala\Refinery\          ← git repo, tracked on origin/main
  ├── Viewer\          (Code.js, index.html, appsscript.json, .clasp.json)
  ├── Ingestion\       (Code.js, appsscript.json, .clasp.json)
  ├── CONTEXT.md
  ├── AUDIT_TRAIL.md
  ├── HANDOFF_PROMPT.md
  ├── PROCESS.md
  ├── RefineryV2 Viewer.json
  └── RefineryV2 Ingestion.json
```

## GitHub
- **Repo:** https://github.com/moltoboto/Refinery
- **Default branch:** `main`
- **Auth:** gh CLI authenticated as moltoboto (keyring, HTTPS)
- **Rule:** After every version bump, commit and push to main. Commit message = version + one-line summary.
- `master` branch is legacy — do not use.

## File Map
| File | App | Purpose |
|------|-----|---------|
| `Ingestion/Code.js` | Ingestion | TOR fetch, Gmail parse, Supabase write, dedup, backfills |
| `Ingestion/appsscript.json` | Ingestion | OAuth scopes: Gmail, Drive, external requests |
| `Viewer/Code.js` | Viewer | doGet(), doPost(), Supabase read/write, artifact tab |
| `Viewer/index.html` | Viewer | Feedly-style 3-pane UI - sidebar, article list, reading pane |
| `Viewer/appsscript.json` | Viewer | OAuth scopes: external requests, spreadsheets, Drive (full) |

## Google Drive
- **Refinery folder:** `1Ue36DjRLySHJ4jQvsSYQuRmtoor9BkJL` (My Drive > Refinery)
- **Artifacts folder:** `1eO6n6MQKF7_cCwulGxhDkzrxT772M-Iz` (My Drive > Refinery > Refinery Artifacts)
- Working docs live here: CONTEXT.md, AUDIT_TRAIL.md, HANDOFF_PROMPT.md, PROCESS.md, RefineryV2 Viewer.json, RefineryV2 Ingestion.json

## Supabase
- **Project:** hwropcciwxzzukfcjlsr
- **Tables:** `articles`, `audit_trail`
- **Article schema:** `id, source, issue, category, status, title, summary, signal, url, archived, kept, date_added`
- **Page size:** 250 rows per fetch (viewer), 1000 rows per fetch (ingestion pagination)
- **Key rule:** Never pass `id` on insert - Supabase auto-increments

## Ingestion Sources
| Source | Type | Notes |
|--------|------|-------|
| The Old Reader (TOR) | RSS | Phase 1 - fetches unread, marks read after ingest |
| Gmail newsletters | Email | Phase 3 - Tier 1: known senders extract articles; Tier 2: inbox email cards |
| Newsletter senders | Config | thecode@, newsletter@chatai.com, news@ollama.ai, hello@lonelyoctopus.com |

## Categories (fixed)
Top Story, AI & LLMs, Finance, Resources, Tech & Trends, Policy & Society,
Dev Tools, Research, Strategy, Watches, YouTube, Reddit, Email, Duplicate

## Key Config (Ingestion)
- `EXTRACT_NEWSLETTER_ARTICLES: false` - full issue mode (saves complete HTML to Drive, no article extraction)
- `SAVE_COMPLETE_NEWSLETTERS: true` - archives full email HTML to Drive folder
- `PROCESSED_LABEL: 'Refinery/Processed'` - Gmail label applied after ingestion
- Drive folder ID for newsletter artifacts is set in CONFIG

## Do Not Touch
- Supabase credentials in CONFIG - stable, do not rotate
- `normalizeCategory()` pipeline - fragile, test before changing
- `cleanUrl()` tracking param stripping - canonical URL logic is dedup-critical
- `sanitizeRecord()` - called on every insert, field length limits enforced here

## Known Patterns & Gotchas
- Supabase REST silently caps at 1000 rows - use offset pagination
- Apps Script deployment: always create a New Deployment when the URL breaks - "New version" on existing deployment is unreliable; new deployment changes the URL, update any bookmarks
- Codex versioning unreliable - verify file state in Apps Script editor after Codex edits; do not trust it saved correctly without checking
- Version number lives in THREE places — all must match on every bump: Ingestion/Code.js header, Viewer/Code.js header + setTitle() line, Viewer/index.html title + 2 sidebar strings
- Deployment — Viewer only: pencil → New version → Deploy on the existing deployment (keeps URL). New Deployment creates a new URL — only use when the URL itself breaks
- Deployment — Ingestion: NO deploy step needed. Ingestion runs via time triggers that call functions directly (not a web app). clasp push is sufficient — triggers pick up new code on the next run automatically
- `kept` field: use strict `=== true` comparison (nulls present alongside booleans). `kept=true` IS the user's permanent archive — never touch these in any purge
- `archived` field: dormant. Was repurposed as a soft-delete flag in v2.12 but dropped in v2.13. Soft delete now uses `status='deleted'` only. The `archived` column remains in the DB but is no longer written by any purge path
- Soft delete = `status='deleted'`. Hard delete runs only from Ingestion via `hardPurgeDeletedArticles()`
- URL dedup is canonical (tracking params stripped before comparison)
- Gmail MCP in Claude.ai uses Anthropic OAuth - separate from Apps Script auth
- `deriveSignal()` currently returns empty string - stubbed for OpenClaw Phase 2
- `enrichArticleFromUrl()` is currently disabled — HTTP fetch commented out in `enrichTORArticle_()`. Re-enable by uncommenting the if/call block. See v2.34 in changelog.
- Finance filter (`isFastFinanceFiltered_`, `isFinanceFiltered_`) is disabled — checks commented out in TOR loop. Re-enable by uncommenting both lines. See v2.34 in changelog.
- UrlFetchApp daily quota: ~20,000 calls/day. Exhausted 2026-05-03 due to markTORArticlesAsRead batch bug (v2.35 fixed). Resets at midnight Pacific. Do not run ingestion multiple times/hour.
- Kagi feeds in TOR use `allorigins.win` as a CORS proxy (e.g. `api.allorigins.win/raw?url=https://news.kagi.com/...`). This 3rd-party proxy can go down silently — if Kagi content disappears from the Viewer, check allorigins.win first
- Source files live locally at `C:\Users\ThomasCala\Refinery\`; deployed to Apps Script via clasp
- All working docs consolidated to `C:\Users\ThomasCala\Refinery\` (previously split across OneDrive\Refinery and two separate clasp folders)

## Current Disabled Features (intentional, easy to re-enable)
- **enrichArticleFromUrl()** — HTTP fetch commented out in enrichTORArticle_(). Any slow destination URL could hang UrlFetchApp indefinitely. RSS title/summary/image is sufficient. Re-enable selectively if richer summaries are needed.
- **Finance filter** — isFastFinanceFiltered_() and isFinanceFiltered_() checks commented out in TOR loop. Decision: curate by removing feeds from OPML rather than keyword-blocking topics.

## Pending (Tomorrow)
1. **Purge 8K old articles**: run in Ingestion editor in order:
   - `previewPurgeBeforeApr15()` — dry run, shows count + sample
   - `purgeBeforeApr15()` — soft-deletes everything before April 15 (kept=true rows safe)
   - `hardPurgeDeletedArticles()` — permanently removes soft-deleted rows
2. **Verify v2.35 fixes**: first run after quota reset (midnight Pacific) should show:
   - `DEDUP CACHE: warmed with ~2000 candidates`
   - `TOR: marked X/500 as read (10 batches)` — confirms batched mark-read is working
   - Subsequent run should return far fewer articles (TOR actually marks them read now)
3. **Finance feed curation**: decide which feeds to remove from subscriptions.opml (currently: Yahoo Finance, MarketWatch, CNBC Mad Money, Seeking Alpha, Motley Fool, Fox Business). Remove unwanted ones, import updated OPML into TOR.
4. **Import OPML into TOR**: Google News was removed from subscriptions.opml but TOR still has it. Import the OPML to drop it from the live reader.

## On the Horizon
- **Substack ingestion** - confirm working end-to-end via TOR RSS
- **Direct URL input for artifacts** - UI to paste a URL and save as artifact manually
- OpenClaw Phase 2 - signal/category enrichment (stubbed, deriveSignal returns '')
- Raindrop / Reddit integration
- TipRanks alerts as separate category
- Per-ticker Yahoo Finance feeds (AAPL/MSFT/GOOGL/AMZN/NVDA/TSLA/META/AMD/ORCL/CMCSA) as alternative to broad Yahoo Finance feed

## Change Log
| Version | Date | Tool | Changes |
|---------|------|------|---------|
| Viewer v2.35 | 2026-05-19 | Claude Code | Removed v2.28 resize handles (cosmetic clutter after v2.32-33 fixed-gutter layout); N/P keyboard nav now works in artifact view via new branch in navigate(). Closes BACKLOG #4 + #9 |
| v2.47 | 2026-05-19 | Claude Code | Dedup Phase 0 (F8 fix): exact-duplicate titles slipping through on Gmail path. Root cause — Gmail never called isFastExactDuplicate_; reviewDuplicateRecord_ skipped exact URL/title checks when cache was warm because it assumed the fast-path ran upstream. Fix: reviewDuplicateRecord_ now performs the cache check itself when warm (works for both Gmail and TOR); Gmail loop skips insert on exact dup and re-affirms cache; new addToFastDedupCache_ call after successful Gmail insert (TOR had it since v2.36). normalizeTitleForDedupe gains NFKC unicode + smart-quote/dash/NBSP normalization for defensive coverage |
| Viewer v2.34 | 2026-05-18 | Claude Code | Header chips → icons (●/☰/◫/📖/📋/▤/Aa/↻). New ICON chip iconizes the nav to a 60px letter-glyph rail (resurrects body.nav-icons mode from v2.21 with populated icons; new class body.nav-iconic to avoid collision with old hide-entirely behavior). New LIST chip (body.list-hidden) hides the list pane for reading-only focus mode. Category icons = first letter (N/A/F/L/T/W/Y/R/E/D); source icons = first letter of source name. Five tooltips via title= attribute for accessibility |
| Viewer v2.33 | 2026-05-17 | Claude Code | When Nav is hidden, list pane keeps sidebar-width left margin so it doesn't shift left — same start position and width whether Nav is on or off |
| Viewer v2.32 | 2026-05-17 | Claude Code | List pane flush-left against nav, flex:1 minus 280px fixed right gutter — grows to fill available width with stable blank area on the right |
| Viewer v2.31 | 2026-05-17 | Claude Code | List pane fixed 600px centered (700px when Nav also off) — removes localStorage drag variable dependency; blank space on right regardless of nav state |
| Viewer v2.30 | 2026-05-17 | Claude Code | When Nav+Reading both off: list fills viewport with 20px margin each side (flex:1, no clamp math, resize handles hidden). Fixes off-center layout on iPad when both panes are dismissed |
| v2.46 | 2026-05-17 | Claude Code | hardPurgeDeletedArticles() now runs automatically at end of runDailyIngestion(), after trimArticlesToCapacity() — no more manual purge needed to clear soft-deleted rows |
| Viewer v2.29 | 2026-05-09 | Claude Code | Resize handle visibility/scroll fix. v2.28 used position:absolute inside list-pane → handles scrolled with content (and were too pale to see). Switched to position:fixed with darker cream (#ecdcb8) + light borders. positionResizeHandles_() aligns left/right of fixed handles to current list-pane bounding rect; called on init, layout toggle, window resize, and during drag |
| Viewer v2.28 | 2026-05-09 | Claude Code | Draggable resize handles on each side of the list pane (when Reading is off). Cream-colored vertical strips with a 6-dot grip SVG icon. Drag right handle = grow/shrink width; drag left handle = move left edge while keeping right edge fixed. Width and left margin saved to localStorage (refinery.listWidthPx / refinery.listLeftPx). Mouse + touch events, touch-action:none for iPad. Double-click any handle = reset to clamp default. Hidden on phone (<720px). Replaces the "tell me a number, I'll edit CSS" iteration loop |
| Viewer v2.27 | 2026-05-09 | Claude Code | List pane width now scales with viewport: `clamp(300px, calc(100vw - 600px), 1000px)`. On 1440 → 840px list with 300px gutter each side (matches user spec). On 1920 → 1000 capped. On smaller viewports shrinks down to 300 floor. Auto margins center it within the flex space remaining after the sidebar |
| Viewer v2.26 | 2026-05-09 | Claude Code | (1) Fixed Compact toggle that was a no-op since v2.12 — CSS targeted classes that don't exist (.article-card, .list-item, .article-summary). Real classes are .card, .card-snippet, etc. Compact now actually shrinks card padding, font sizes, and reading-pane padding when the toggle is on. (2) Bumped no-reading-pane list-pane width 400 → 500px |
| Viewer v2.25 | 2026-05-09 | Claude Code | List pane capped at 400px when Reading is off (was flex-grown filling everything except a sidebar-width right gutter). User reported summary text still too wide after v2.23. body.no-reading-pane .list-pane now `width: 400px; flex: 0 0 400px` with `margin-left/right: auto` so it centers in available flex space. Empty space falls equally to the left and right of the list (after the sidebar) |
| Viewer v2.24 | 2026-05-09 | Claude Code | Mobile reuses the same layout pattern instead of getting a separate format. @media (max-width: 720px) sets --sidebar-w 200 → 110 and --list-w 360 → 240. The `body.no-reading-pane` right-gutter automatically scales because it uses var(--sidebar-w). On phone with Reading off + Nav on: sidebar 110 + list 170+ + right gutter 110 = symmetric layout that fits a 390px viewport |
| Viewer v2.23 | 2026-05-09 | Claude Code | Right-side gutter when Reading is off. body.no-reading-pane .list-pane gets `margin-right: var(--sidebar-w)` so the list is symmetric with the left nav and stays at a comfortable line length instead of stretching edge-to-edge — eyes don't have to traverse the full screen width |
| Viewer v2.22 | 2026-05-09 | Claude Code | Sidebar width 160 → 200px. Was over-shrunk in v2.19 chasing the wasted-space complaint that v2.20 actually fixed (the gap was inside the row, not the column width). 200px gives source labels room to wrap less |
| Viewer v2.21 | 2026-05-09 | Claude Code | Nav toggle now fully hides the sidebar instead of collapsing to a 60px empty stub. The original "icons-only" mode was useless because the .nav-icon spans were never populated with glyphs. body.nav-icons aside { display: none } reclaims the full sidebar width for the list pane. Button title attr updated to "Hide left nav" |
| Viewer v2.20 | 2026-05-09 | Claude Code | Eliminated the gap between nav-item label and count badge. Was caused by `.nav-label { flex: 1 }` which spread label across all available space and pushed the count to the right edge — visible as empty middle when label was short ("AI", "Tech"). Changed to `flex: 0 0 auto` so label takes natural width and badge sits right next to it. Also hid empty `.nav-icon` spans (display: none) since they were never populated and were eating ~20px on the left of every nav row |
| Viewer v2.19 | 2026-05-09 | Claude Code | Sidebar tightened further: --sidebar-w 196 → 160px, .nav-item padding 8/16 → 5/12 with gap 9 → 6, .sidebar-section padding 16/16/4 → 10/12/2. Reclaims significant horizontal space; more vertical density in nav |
| Viewer v2.18 | 2026-05-09 | Claude Code | Removed prettifySource and SOURCE_LABEL_OVERRIDES_ — user fixed the Motley Fool source name in TOR directly so the display-side cleanup is no longer needed. Reverted sourceNav and card-source-label to use raw `src` value. Sidebar width 196px from v2.17 retained |
| Viewer v2.17 | 2026-05-09 | Claude Code | (1) Sidebar width 248 → 196px — short category names ('AI', 'Tech', 'News') were leaving lots of dead space. (2) prettifySource(src) display helper: if source name was stored as a URL (TOR fell back to feed URL because feed title wasn't set), extract host and map to a friendly label via SOURCE_LABEL_OVERRIDES_ (Motley Fool / Seeking Alpha / Yahoo Finance / etc.) — falls back to title-cased domain slug. Applied to source nav AND card source labels. Original raw value kept in title attr for hover |
| Viewer v2.16 | 2026-05-09 | Claude Code | Fix category counts not summing to total. Viewer's normalizeCategory_ (Code.js) and normalizeCategory (index.html) were still mapping to old long-form names (`'ai' → 'AI & LLMs'`, `'tech' → 'Tech & Trends'`, default `'Tech & Trends'`). After Ingestion v2.42-44 renamed categories to short forms in DB, the Viewer's normalizer was UN-renaming them to legacy values not in CATEGORY_KEYS — invisible in the sidebar. Updated both normalizer functions to fold to the current 10 short names (News/AI/Finance/Learning/Tech/Watches/YouTube/Reddit/Email/Duplicate). CATEGORY_KEYS and CATEGORY_MAP rewritten to match. Default fallback now 'Tech' |
| Viewer v2.15 | 2026-05-09 | Claude Code | Header chips wrap on narrow screens. .header-right got flex-wrap + row-gap so chips wrap onto multiple rows instead of overflowing. Added @media (max-width: 720px) block: header becomes vertical stack (logo/status, search full-width, chips full-width with horizontal scroll), chip padding/font shrunk slightly. Body layout still desktop-only — proper mobile breakpoint (sidebar hamburger, slide-over reading) deferred pending design review |
| Viewer v2.14 | 2026-05-09 | Claude Code | (1) Per-card "↗" open-original link in upper-right of every card — works regardless of reading-pane state, opens article URL in new tab. event.stopPropagation prevents triggering card select. (2) Font-size cycle chip "Aa" in header — cycles normal → large → xlarge via body class, persists in localStorage. Targets card-title, card-snippet, reading-title, reading-body, nav-item, summary-prompt directly (CSS doesn't use rem-relative sizing) |
| Viewer v2.13 | 2026-05-09 | Claude Code | Removed the 'Current view' / 'All loaded' search scope chips from the header — redundant with Unread filtering. Search now always spans all loaded articles (searchScope hardcoded to 'all'). updateSearchScopeChips kept as no-op so existing call sites remain safe. Header is cleaner: 4 chips instead of 6 (Unread / Nav / Reading / Compact + Refresh) |
| Viewer v2.12 | 2026-05-08 | Claude Code | Three header toggles (Reading / Nav / Compact) — each flips a body class and persists in localStorage. body.no-reading-pane hides reading pane and lets list-pane fill the space. body.nav-icons collapses left nav to icons (~190px recovered). body.compact-density tightens padding/line-height. CATEGORIES list updated to match Ingestion v2.44 (10 entries: News, AI, Finance, Learning, Tech, Watches, YouTube, Reddit, Email, Duplicate). Bumped version strings in 5 places (3 in index.html, 2 in Code.js). Requires Apps Script redeploy |
| v2.45 | 2026-05-09 | Claude Code | Better dedup recall on same-topic articles with different headlines: (1) DEDUPE_REVIEW.MIN_SCORE 0.66 → 0.55. (2) New extractProperNouns_(title) helper extracts capitalized 3+ char tokens, drops headline stopwords (the/a/unveils/launches/etc), returns lowercased deduped list. (3) HEADLINE_STOPWORDS_ const at module level. (4) Proper nouns precomputed at warm time as row._properNouns and on incoming features in findPossibleDuplicateCandidate_. (5) New branch in scorePossibleDuplicateMatch_: when sharedNouns >= 3 → score boost to 0.66 with reason "N shared title entities". Catches "Rolex Unveils GMT" + "Hands-On the New Rolex GMT-Master" pattern |
| v2.44 | 2026-05-08 | Claude Code | Renamed remaining long category names: 'Top Story' → 'News', 'Resources' → 'Learning'. canonicalCategoryName_ legacy folds added so existing rows display correctly until backfill (top story/top stories → News, resources/resource → Learning, learning skills/learning & skills → Learning). Run applySourceCategoryBackfill() to retag |
| v2.43 | 2026-05-08 | Claude Code | Renamed long category names to match TOR folders: 'AI & LLMs' → 'AI', 'Tech & Trends' → 'Tech'. Updated CATEGORY_OPTIONS, CATEGORY_SOURCE_MAP, TOR_FOLDER_CATEGORY_MAP, isKnownCategory_, detectCategory return values. canonicalCategoryName_ keeps legacy mappings ('ai llms'/'ai & llms' → 'AI', 'tech trends'/'tech & trends' → 'Tech') so existing DB rows fold correctly when backfill runs. Run applySourceCategoryBackfill() to retag |
| v2.42 | 2026-05-08 | Claude Code | Folder-driven categorization. Added TOR_FOLDER_CATEGORY_MAP (TOR folder label → Refinery category). extractTORFolders_(article) parses 'user/-/label/<Folder>' from article.categories. categoryFromTORFolder_() consults the map. normalizeCategory now takes optional torFolders param checked AFTER per-source mapping but BEFORE URL pattern and keyword detection. mapTORArticleBasic_ extracts folders into basic._torFolders; enrichTORArticle_ passes them through. Also dropped categories not in TOR: removed 'Policy & Society', 'Dev Tools', 'Research', 'Strategy' from CATEGORY_OPTIONS and isKnownCategory_. canonicalCategoryName_ folds legacy values into closest current category (policy→Top Story, dev tools→Tech & Trends, research→Tech & Trends, strategy→Resources). detectCategory simplified to drop the 4 retired keyword paths. CATEGORY_SOURCE_MAP: stratechery.com 'Strategy' → 'Resources'. Run applySourceCategoryBackfill() to retag existing articles |
| v2.41 | 2026-05-08 | Claude Code | Cleanup pass: (1) Consolidated 4 date-specific purge functions into 2 generic ones — `previewPurgeBeforeDate(dateString)` and `purgeBeforeDate(dateString)`. Deleted previewPurgeArticlesBeforeApril2026, purgeArticlesBeforeApril2026, previewPurgeBeforeApr15, purgeBeforeApr15. (2) Removed dead code: mapTORArticleToSchema (only caller was testTORDryRun, redirected to mapTORArticleBasic_), hasDuplicateCandidate_ (zero callers), runEmail (one-line wrapper), SKIP_ENRICHMENT_SOURCES_ var (only referenced in commented-out block). (3) Simplified enrichTORArticle_ — removed the dead-code block referencing the disabled enrichArticleFromUrl path; function now just builds the final record from RSS data. (4) Fixed stale comment referencing deleted mapTORArticleToSchema |
| v2.40 | 2026-05-08 | Claude Code | trimArticlesToCapacity URL-length crash fix: was building `?id=in.(id1,id2,...)` with thousands of IDs — exceeded Apps Script URLFetch URL length limit when 14K rows existed. Rewrote to use a date-based PATCH: find the date_added of the (trimCount)-th oldest row, then PATCH `?date_added=lte.cutoff&kept=eq.false&status=neq.deleted` with status='deleted'. One short PATCH regardless of row count. Returns actual count of trimmed rows via Prefer:return=representation |
| v2.39 | 2026-05-08 | Claude Code | Speed pass — three sources of slowness eliminated: (1) Candidate features (simhash, tokens, normalized title, cleanUrl) are now precomputed ONCE in warmDedupCache_ and stored on each row as `_simhash`/`_titleTokens`/etc. scorePossibleDuplicateMatch_ uses the precomputed values. Was previously recomputing per-article × per-candidate (N×M simhashes, each ~5-10ms). (2) MAX_CANDIDATES restored to 500 (was 2000 during the broken-mark-read backlog) — mark-read now works so backlog clears naturally. (3) Removed Logger.log spam from the per-article hot path: isFastExactDuplicate_, isFastTickerFiltered_, and the TOR loop's per-duplicate logs replaced with end-of-loop summary line. Logger.log costs 5-30s when called 1000+ times per run. Net: TOR ingestion should now finish 500 articles within the 6-minute Apps Script window |
| v2.38 | 2026-05-08 | Claude Code | Rolling retention cap: CONFIG.MAX_ARTICLES = 3000. trimArticlesToCapacity() runs at end of runDailyIngestion — counts non-kept/non-deleted rows via Content-Range header, soft-deletes oldest excess. kept=true rows excluded from count and protected. Drive artifacts untouched. Costs 1 query when at/under cap, 3 when over. Manual entry point also exposed. Hard-purge remains separate (existing hardPurgeDeletedArticles) |
| v2.37 | 2026-05-08 | Claude Code | Replaced the broad finance allowlist (v2.28-v2.34, since-disabled) with a strict ticker-only filter scoped to fool.com and seekingalpha.com. TICKER_ALLOW_PATTERNS contains only portfolio companies — Mag 7 (AAPL/MSFT/GOOGL/AMZN/NVDA/TSLA/META), AMD, ORCL, CMCSA, Coatue. No macro/sector/market keywords (those were too permissive — "earnings"/"market"/"fed" matched everything). Filter checks title AND RSS summary (MotleyFool teases tickers in body, not always title). Wired as isFastTickerFiltered_() pre-map check after isFastExactDuplicate_(). To add a ticker: append a regex to TICKER_ALLOW_PATTERNS. To filter another noisy feed: add its domain to TICKER_FILTER_DOMAINS |
| v2.36 | 2026-05-08 | Claude Code | Root-cause fix for "timeout creates duplicates" bug: (1) Incremental mark-read every 25 articles inside the TOR loop — previously mark-read only ran after loop completion, so timeouts left articles inserted-but-unread, causing them to come back next run. (2) addToFastDedupCache_() updates DEDUP_URL_MAP_/DEDUP_TITLE_MAP_ as articles are inserted/skipped, catching same-run duplicates from overlapping feeds. (3) reviewDuplicateRecord_() now skips the URL+title Supabase queries when cache is warm (the 30-day cache already covered them; queries could only find older articles). (4) Reddit special case reuses INGESTION_DEDUP_CACHE_ instead of fetching 250 fresh rows per Reddit article. (5) findPossibleDuplicateCandidate_ hoists incoming-article features (cleanUrl, normalizeTitleForDedupe, dedupeTokens_, simhashText_) out of the per-candidate loop — was being recomputed up to 2000× per article. (6) DEDUPE_STOPWORDS_ moved to module level. Net: ~95% drop in urlfetch calls per run, eliminates same-run dup creation, eliminates timeout-creates-dups feedback loop |
| v2.35 | 2026-05-03 | Claude Code | Root cause of urlfetch quota exhaustion: markTORArticlesAsRead was sending 500 IDs in one POST → TOR silently rejected it → articles stayed unread → same 500 articles returned every run → 1000 Supabase calls/run burned the daily quota. Fix 1: markTORArticlesAsRead now batches 50 IDs per POST with HTTP error logging. Fix 2: DEDUPE_REVIEW.WINDOW_DAYS 7→30 and MAX_CANDIDATES 500→2000 so the fast in-memory cache catches repeatedly-returned old articles instead of falling through to reviewDuplicateRecord_() |
| v2.34 | 2026-05-03 | Claude Code | (1) Finance filter disabled — isFastFinanceFiltered_() and isFinanceFiltered_() checks commented out in TOR loop; user curates by removing feeds from OPML instead of keyword filtering. (2) enrichArticleFromUrl() disabled for all sources — HTTP fetch commented out in enrichTORArticle_(); RSS title/summary/image is sufficient and eliminates all timeout risk from slow destination URLs. Both changes are commented-out (not deleted) for easy re-enable |
| v2.33 | 2026-05-03 | Claude Code | HN enrichment hang fix: added SKIP_ENRICHMENT_SOURCES_ (/hacker news|ycombinator/i) checked in enrichTORArticle_() — when source matches, enrichArticleFromUrl() is skipped entirely and enriched defaults to empty (RSS title/summary used directly). Root cause: HN RSS links to destination URLs (not ycombinator.com) so URL-pattern check doesn't work; source name is the only reliable signal |
| v2.32 | 2026-05-03 | Claude Code | Two-phase TOR mapping: mapTORArticleBasic_() (no HTTP) + enrichTORArticle_() (HTTP). Basic mapping used for all filtering and dedup — enrichArticleFromUrl() only called for articles that pass everything and will actually be inserted. Eliminates HTTP fetch for ~95% of articles (duplicates, filtered). Root cause of persistent timeout: v2.31 fast cache only caught recent dupes; older dupes still triggered enrichArticleFromUrl before reviewDuplicateRecord_ caught them |
| v2.31 | 2026-05-03 | Claude Code | Pre-map fast path: isFastExactDuplicate_() + isFastFinanceFiltered_() run before mapTORArticleToSchema() — eliminates enrichArticleFromUrl() HTTP fetch and 2 Supabase calls for articles that will be discarded. warmDedupCache_() now builds DEDUP_URL_MAP_ and DEDUP_TITLE_MAP_ for O(1) exact dedup lookup. Root cause: 500 articles × 3 HTTP calls each = 1500 calls → timeout. New path: only truly new articles get the HTTP fetch |
| v2.30 | 2026-05-03 | Claude Code | Source-level skip list: SKIP_SOURCE_PATTERNS + isTORArticleFromSkippedSource_() checked before mapTORArticleToSchema() — Google News articles now skipped with zero HTTP fetches (was burning ~1s each for enrichArticleFromUrl before exact-dupe check caught them). Add any future unwanted-but-still-in-TOR feeds here |
| v2.29 | 2026-05-03 | Claude Code | Feed-driven categorization: added explicit CATEGORY_SOURCE_MAP entries for all Tech feeds (techcrunch/ars/engadget/macrumors/theverge/ycombinator → Tech & Trends) and Learning & Skills (stratechery → Strategy, dailystoic/natesnewsletter → Resources) so keyword fallback never overrides feed intent. Watch photos: extractFirstImageFromHtml_() pulls featured image from RSS HTML content before stripping tags — avoids bot-blocked HTTP fetch; also checks TOR enclosure field; prependImageMarker now includes Finance/AI/Tech categories |
| v2.28 | 2026-05-03 | Claude Code | Finance allowlist filter: high-volume finance feeds (Seeking Alpha, Motley Fool, Yahoo Finance, MarketWatch, Fox Business) now gated by FINANCE_ALLOW_PATTERNS — only articles matching portfolio (Mag 7, AMD, Coatue, Oracle, Comcast), sectors (IT/dividends/crypto/pharma/semiconductors), or macro market keywords pass through; others skipped and TOR marked read. OPML: removed Google News (meta-aggregator, structural duplicate source); added comment explaining why |
| v2.27 | 2026-04-27 | Claude Code | YouTube full description: finalizeSummaryForRecord_ now stores up to 20 sentences / 3500 chars for YouTube articles (was 5/850) — the RSS feed already includes the complete video description via media:description, it was just being truncated |
| v2.26 | 2026-04-27 | Claude Code | Category cleanup: added simonwillison.net→AI & LLMs and venturebeat.com→AI & LLMs to CATEGORY_SOURCE_MAP; tightened Dev Tools keyword regex (removed overbroad open.?source, repo, framework, library — now matches only specific dev tooling terms); removed launches|announces from Top Story regex (matched every product announcement, bloating Tech & Trends); OPML: added Finance folder (Yahoo Finance, MarketWatch, CNBC Mad Money, Seeking Alpha, Motley Fool, Fox Business) and expanded News folder (Google News, Yahoo News, Fox News); removed 3 Open-* feeds; CATEGORY_SOURCE_MAP: added foxnews.com, news.google.com, news.yahoo.com→Top Story and foxbusiness.com, marketwatch.com, finance.yahoo.com, seekingalpha.com, fool.com→Finance |
| v2.25 | 2026-04-27 | Claude Code | Added NOISE_TITLE_PATTERNS filter (isNoisyArticle_) wired into TOR and Gmail loops — skips celebrity gossip, AI art spam, clickbait on title match, marks TOR read; OPML: removed 4 broken Kagi proxy feeds, replaced with Reuters Business + Reuters Technology + CNBC; swapped BBC World + NYT Homepage for BBC Technology + NYT Technology to cut celebrity noise; added reuters.com→Top Story, cnbc.com→Finance to source map |
| v2.24 | 2026-04-27 | Claude Code | Exact title dedup now uses ilike (case-insensitive) instead of eq — catches "I've Built" vs "I VE BUILT" vs "i've built" mismatches caused by apostrophe stripping and capitalization differences across RSS feeds; % and _ escaped to prevent wildcard interpretation |
| v2.23 | 2026-04-27 | Claude Code | Fixed normalizeCategory() overwriting Duplicate category: possible duplicates were being re-categorized at insert time by sanitizeRecord() calling normalizeCategory(), stripping the Duplicate flag and causing them to appear in All Unread with wrong categories; now Duplicate is checked first and returned immediately |
| v2.22 | 2026-04-27 | Claude Code | Fixed hardPurgeDeletedArticles: CONFIG.PURGE_DAYS was undefined causing RangeError on toISOString(); replaced with tomorrow-date upper bound to purge all soft-deleted rows unconditionally |
| v2.21 | 2026-04-27 | Claude Code | Ingestion: exact duplicates now skipped entirely (no insert, TOR marked read) instead of being inserted as Duplicate category; Viewer v2.11: Duplicate category excluded from All Unread, read-fill, and stats queries via category=neq.Duplicate |
| v2.20 | 2026-04-27 | Claude Code | Performance: dedup candidate pool now pre-fetched once per phase (INGESTION_DEDUP_CACHE_) instead of per-article — eliminates ~100-200 Supabase HTTP calls per run; audit trail writes batched (AUDIT_TRAIL_BATCH_ + flushAuditTrailBatch_()) into one call per phase; added runTORIngestionOnly() and runGmailIngestionOnly() for separate time triggers; MAX_EMAILS_PER_RUN 100→40 |
| v2.19 | 2026-04-27 | Claude Code | Fixed category assignment: (1) AI & LLMs now checked before Finance/Research/Policy in detectCategory() so "AI funding" and "AI regulation" land correctly; (2) expanded CATEGORY_SOURCE_MAP with all watch sites, AI-only feed domains (AWS ML, Google AI, MIT AI, NVIDIA, OpenAI, Anthropic, HuggingFace, deeplearning.ai), and BBC/NYT→Top Story |
| v2.18 | 2026-04-27 | Claude Code | Added simhash 64-bit fingerprinting to fuzzy dedup (computeSimhash_, hammingDistance_, SIMHASH_THRESHOLD=8); simhash now scores alongside Jaccard/token-overlap in scorePossibleDuplicateMatch_ — hdist<=4 raises score to 0.90, hdist<=8 raises to 0.80; fixed OPML: removed duplicate TechCrunch+Verge AI feeds from AI folder (covered by main feeds in Tech), moved OpenClaw feeds from YouTube to Learning & Skills, added Kagi allorigins.win proxy warning comment |
| v2.17 | 2026-04-20 | Claude Code | Fixed fuzzy dedup: WINDOW_DAYS 2→7, MAX_CANDIDATES 250→500, removed status=neq.read filter from candidate pool so already-read articles are still checked against incoming articles |
| v2.15 | 2026-04-20 | Claude Code | Added previewDuplicateArticles() and softDeleteDuplicateArticles() to Ingestion — fetches all articles, groups by cleaned URL, keeps oldest record, soft-deletes dupes; never touches kept=true |
| v2.14 | 2026-04-20 | Claude Code | Bug fixes from v2.13: replaced status=not.in.(read,deleted) with safe neq chaining; fixed archivedArticles ref in applyArchiveLocal; archiveArticle() no longer sets archived:true; dedup candidate filter uses status=neq.deleted |
| v2.13 | 2026-04-20 | Claude Code | Soft delete now uses status='deleted' only (dropped archived=true); all Viewer fetch queries use status=neq.deleted instead of archived=eq.false; hardPurgeDeletedArticles() moved to Ingestion; purgeStaleArticles/purgeOldArchived removed from Viewer; archivedArticles stat renamed deletedArticles |
| v2.12 | 2026-04-20 | Codex | Converted article cleanup to soft delete by default: pre-cutoff cleanup now moves rows out of the main reader with `archived=true` and `status='deleted'`, protects kept rows, and repurposes the stale purge path to physically remove only rows already marked deleted |
| v2.11 | 2026-04-20 | Codex | Refactored article purge into a single internal `ARTICLE_PURGE_` module with only two public April cleanup entrypoints, removed redundant TOR listing helpers, and switched destructive purge deletes to a Supabase service-role Script Property (`SUPABASE_SERVICE_ROLE_KEY`) so old articles can be deleted without touching Drive artifacts |
| v2.10 | 2026-04-20 | Codex | Added safe article-only purge helpers for rows before a cutoff date while preserving Drive artifacts, plus TOR subscription listing helpers including a Kagi-specific filter to support feed replacement cleanup |
| v2.9 | 2026-04-19 | Codex | Added a TOR source-category review sheet (`rss_source_map`) with category dropdowns and first-pass suggestions based on feed/source patterns plus recent TOR article titles; source overrides now apply during ingestion and category backfill, and generic uses of the word "watch" no longer auto-map articles to Watches |
| v2.8 | 2026-04-19 | Codex | Added ingestion-time duplicate review: exact duplicates and possible duplicates now route into a Duplicate category for manual review in the Viewer, using the earliest matching article as the original reference and preserving review context in the summary |
| v2.7 | 2026-04-13 | Claude Code | Date format changed to yyyy-MM-dd for sortability; artifact metadata line removed from list; Archive removed from sidebar; open-in-window opens popup (1000x800); email date used for artifact date label (not file creation date); double-date stripped from display title; Drive scope upgraded from readonly to full; renameArtifactsToDateTitle() added; MAX_EMAILS_PER_RUN bumped to 100; all files consolidated to C:\Users\ThomasCala\Refinery\ |
| v2.6 | 2026-04-12 | Codex | Removed Archive button from article right-pane; removed Artifacts from category nav; artifact list titles formatted as Date -- Title; added pop-out and delete buttons on artifact header; backend artifact deletion; stronger mime normalization for TXT/MD/JSON/CSV |
| v2.5 | 2026-04-11 | Codex | Email injection improvements; artifacts changed from text to HTML; fixed artifact viewer for PNG and TXT; cleaned up artifact naming; removed Keep and Open in Drive buttons |
| v2.4 | - | - | Baseline version when CONTEXT.md was created |

**Rule:** Update this log on every version bump, not every session.
Bump the version number in Code.gs and add one row here before closing out.

## Audit Rule
- After every substantive session, append an entry to `AUDIT_TRAIL.md`
- The audit trail should capture the request, files touched, actions taken, validation, deployment status, and follow-up
- Use `CONTEXT.md` for stable state and version history; use `AUDIT_TRAIL.md` for chronological work history
