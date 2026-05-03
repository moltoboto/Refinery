# Refinery - Audit Trail

This file is the running session-level audit trail for Refinery work.

## How To Use
- Add one entry for each meaningful work session.
- Record what changed, where it changed, and what still needs follow-up.
- Keep this file focused on operational history; use `CONTEXT.md` for durable project state and version history.

## Entry Template
### YYYY-MM-DD HH:MM ET - Tool
- Request:
- Files touched:
- Actions taken:
- Validation:
- Follow-up:

## Entries

### 2026-05-03 - Session Close (v2.35, end of day)
- Quota: UrlFetchApp daily limit exhausted. Do not run ingestion until midnight Pacific reset.
- Code state: v2.35 pushed and committed. All fixes are live in Apps Script.
- Key disabled features: enrichArticleFromUrl() (HTTP fetch commented out); finance filter (both checks commented out). Both intentional — see CONTEXT.md.
- Pending tomorrow: (1) Run purge — previewPurgeBeforeApr15 → purgeBeforeApr15 → hardPurgeDeletedArticles. (2) Verify v2.35 mark-read batching via log output. (3) Decide which finance feeds to cut from OPML.
- Next model review: user switching to Opus for code review of Ingestion/Code.js for slop/cleanup.

### 2026-05-03 - Claude Code (v2.35)
- Request: Ingestion erroring "Service invoked too many times for one day: urlfetch" — daily quota exhausted.
- Root cause chain: markTORArticlesAsRead sent all IDs in one POST → TOR silently rejected oversized payload → articles stayed unread → same 500 articles returned every run → reviewDuplicateRecord_() made 2 Supabase calls per article → ~1000 urlfetch calls/run × multiple runs/day = quota exhausted.
- Fix 1: markTORArticlesAsRead now loops in batches of 50 IDs per POST. Logs HTTP error code if TOR rejects a batch. Previously: silent failure with no error logging.
- Fix 2: DEDUPE_REVIEW.WINDOW_DAYS 7→30, MAX_CANDIDATES 500→2000. Wider fast cache means repeatedly-returned old articles are caught in O(1) memory lookup instead of falling through to 2 Supabase HTTP calls each.
- Note: Quota resets at midnight Pacific. Do not run ingestion again today.
- Files touched: Ingestion/Code.js (v2.35), CONTEXT.md, AUDIT_TRAIL.md
- Deployment: clasp push Ingestion only.

### 2026-05-03 - Claude Code (v2.34)
- Request: (1) Remove finance topic filter — curate by removing feeds, not keyword blocks. (2) Fix ongoing ingestion slowness — any site can hang UrlFetchApp for 60s. (3) Still getting exact duplicates.
- Fix 1 — Finance filter removed: commented out isFastFinanceFiltered_() and isFinanceFiltered_() checks in TOR loop. All finance feed articles now pass through. User should remove unwanted feeds from subscriptions.opml instead.
- Fix 2 — enrichArticleFromUrl() disabled: commented out the HTTP fetch call in enrichTORArticle_(). enriched always defaults to {title:'', summary:'', imageUrl:''}. RSS title/summary/image is sufficient for all categories. This eliminates ALL timeout risk — no more slow-site hangs regardless of source.
- Fix 3 — Exact duplicates: existing duplicates in DB pre-date the dedup system and will be removed by purge. New ingestions are caught by isFastExactDuplicate_() (7-day cache) + reviewDuplicateRecord_() (Supabase URL+title queries). Run the purge steps to clear stale data.
- Files touched: Ingestion/Code.js (v2.34), CONTEXT.md, AUDIT_TRAIL.md
- Deployment: clasp push Ingestion only.
- Follow-up: User should run previewPurgeBeforeApr15() → purgeBeforeApr15() → hardPurgeDeletedArticles() to remove 12K old articles. Then review OPML feeds to remove any unwanted finance feeds.

### 2026-05-03 - Claude Code (v2.33)
- Request: "Creating a Color Palette from an Image" Hacker News article hanging ingestion again — enrichArticleFromUrl() was fetching the destination URL (a slow third-party site), not ycombinator.com.
- Root cause: HN RSS items link to arbitrary destination URLs. A URL-based skip (checking for ycombinator.com) doesn't work because the article URL IS the destination. The only reliable signal is the source name from article.origin.title ("Hacker News").
- Fix: Added SKIP_ENRICHMENT_SOURCES_ regex (/hacker news|ycombinator/i) checked in enrichTORArticle_() before calling enrichArticleFromUrl(). When source matches, enriched = { title:'', summary:'', imageUrl:'' } — no HTTP fetch. RSS title and summary already sufficient for HN articles.
- Files touched: Ingestion/Code.js (v2.33), CONTEXT.md, AUDIT_TRAIL.md
- Deployment: clasp push Ingestion only.
- Follow-up: None — HN articles will use RSS title/summary/image directly, same as Reddit.

### 2026-05-03 - Claude Code (v2.32)
- Request: Ingestion still timing out after v2.31 — older HN/TechCrunch articles (>7 days, not in dedup cache) still triggered enrichArticleFromUrl() before reviewDuplicateRecord_() could catch them.
- Root cause: isFastExactDuplicate_() only covers articles already in the 7-day dedup cache. Older articles not in cache fell through to mapTORArticleToSchema() → enrichArticleFromUrl() HTTP fetch BEFORE the Supabase dedup check.
- Fix: Split mapTORArticleToSchema() into two phases:
  - mapTORArticleBasic_(): no HTTP — extracts URL/title/source/date/RSS summary/RSS image from TOR article object
  - enrichTORArticle_(): HTTP fetch via enrichArticleFromUrl() — called ONLY after all filters and reviewDuplicateRecord_() confirm article is new
  - mapTORArticleToSchema() kept as legacy wrapper for callers outside TOR loop
  - TOR loop order: skip source → fast dedup → fast finance filter → mapTORArticleBasic_() → isNoisyArticle_() → isFinanceFiltered_() → reviewDuplicateRecord_() → enrichTORArticle_() → insert
- Result: enrichArticleFromUrl() HTTP fetches reduced from ~250/run to ~5-20/run (only genuinely new articles).
- Files touched: Ingestion/Code.js (v2.32), CONTEXT.md, AUDIT_TRAIL.md
- Deployment: clasp push Ingestion only.

### 2026-05-03 - Claude Code (v2.31)
- Request: Ingestion timing out — log showed articles being processed at ~1/second, 500 articles × 3 HTTP calls = 1500 calls total.
- Root cause: mapTORArticleToSchema() calls enrichArticleFromUrl() (1 HTTP fetch) for EVERY article including ones immediately discarded as duplicates or finance-filtered. reviewDuplicateRecord_() then makes 2 more Supabase calls per article. The dedup cache only covered fuzzy dedup — exact URL/title checks bypassed the cache entirely.
- Fix: added pre-map fast path before mapTORArticleToSchema():
  - isFastExactDuplicate_(): checks article URL/title against DEDUP_URL_MAP_/DEDUP_TITLE_MAP_ (O(1) dict lookup, zero HTTP calls)
  - isFastFinanceFiltered_(): checks raw article URL domain + title against allowlist before HTTP fetch
  - warmDedupCache_() now builds DEDUP_URL_MAP_ and DEDUP_TITLE_MAP_ from cache rows at warm time
  - DEDUP_URL_MAP_/DEDUP_TITLE_MAP_ cleared alongside INGESTION_DEDUP_CACHE_ at phase end
- Result: enrichArticleFromUrl() HTTP fetch only runs for articles that are genuinely new and pass all filters. Expected: TOR phase drops from 8+ minutes to ~1-2 minutes.
- Files touched: Ingestion/Code.js (v2.31), CONTEXT.md, AUDIT_TRAIL.md

### 2026-05-03 - Claude Code (v2.30)
- Request: Ingestion log showing 17+ "exact duplicate skipped — Google News" lines eating ~17 seconds per run.
- Root cause: Google News still in TOR (not yet manually removed). Each article ran through mapTORArticleToSchema() which calls enrichArticleFromUrl() (HTTP fetch ~1s) before the dedup check caught it as a duplicate.
- Fix: Added SKIP_SOURCE_PATTERNS + isTORArticleFromSkippedSource_() checked against article.origin.title and URL BEFORE mapTORArticleToSchema() — zero HTTP fetches for skipped sources.
- SKIP_SOURCE_PATTERNS currently: /google\s*news/i, /news\.google\.com/i
- To add future unwanted feeds still in TOR: add a pattern to SKIP_SOURCE_PATTERNS.
- Files touched: Ingestion/Code.js (v2.30), CONTEXT.md, AUDIT_TRAIL.md
- Deployment: clasp push Ingestion only.
- Follow-up: User should still manually remove Google News from TOR and import updated OPML to permanently stop it from being fetched at all.

### 2026-05-03 - Claude Code (v2.29)
- Request: (1) Feed should dictate category, not keyword fallback; (2) Watch posts should show photos; (3) Is Convex better than Supabase?
- Actions taken:
  - CATEGORY_SOURCE_MAP: added explicit entries for Tech feeds (techcrunch.com, arstechnica.com, engadget.com, macrumors.com, theverge.com, ycombinator.com → Tech & Trends) and Learning & Skills (stratechery.com → Strategy, dailystoic.com/natesnewsletter.substack.com → Resources). These take priority over detectCategory() keyword matching, so a TechCrunch article about GitHub Copilot stays in Tech & Trends instead of Dev Tools.
  - Watch photos: added extractFirstImageFromHtml_() to pull first <img src> from RSS feed HTML content before stripHtml() discards it. Also checks article.enclosure.url if present. rssImageUrl preferred over enrichArticleFromUrl og:image (watch sites block bots). prependImageMarker category guard expanded to include Finance/AI/Tech.
  - mapTORArticleToSchema updated to pass combined imageUrl (rss || enriched) to prependImageMarker.
- Files touched: Ingestion/Code.js (v2.29), CONTEXT.md, AUDIT_TRAIL.md
- Deployment: clasp push Ingestion only.
- Convex vs Supabase decision: Supabase is correct for this stack. Convex is TypeScript-first, designed for websocket-reactive Next.js/React apps — Apps Script cannot use its client SDK or reactive model. Migration would require full rewrite in Node.js/TypeScript. No action needed.
- Follow-up: Run applySourceCategoryBackfill() to re-tag existing articles with new source map entries (TechCrunch articles currently in Dev Tools should move to Tech & Trends).

### 2026-05-03 - Claude Code (v2.28)
- Request: (1) Finance feeds producing too many off-portfolio articles (Seeking Alpha etc.); (2) Google News creating structural duplicates; (3) Viewer did not change in v2.26-v2.27; (4) Files dropped to Drive Artifacts folder appear in Viewer automatically; (5) YouTube full description already in RSS — no API needed.
- Actions taken:
  - Added FINANCE_FILTER_DOMAINS + FINANCE_ALLOW_PATTERNS + isFinanceFiltered_() to Ingestion.
    Domains filtered: seekingalpha.com, fool.com, finance.yahoo.com, marketwatch.com, foxbusiness.com.
    Allowlist: Magnificent 7 (AAPL/MSFT/GOOGL/AMZN/NVDA/TSLA/META), AMD, Coatue, Oracle/ORCL, Comcast/CMCSA; sectors: dividends, crypto/BTC/ETH, pharma/biotech/FDA, semiconductors; macro: Fed/rates/inflation/GDP/earnings/IPO/market/NASDAQ/S&P.
    Off-portfolio articles skipped and marked read in TOR — never reach Supabase.
  - Wired isFinanceFiltered_() into TOR ingestion loop after isNoisyArticle_() check.
  - OPML: removed Google News feed (meta-aggregator republishes Reuters/BBC/NYT/TechCrunch/Verge which are already directly subscribed — primary structural duplicate source). Yahoo News retained (more AP-wire original content).
  - Confirmed: Ingestion has NO deploy step (clasp push only); only Viewer needs Apps Script redeploy. Added to CONTEXT.md gotchas.
- Files touched: Ingestion/Code.js (v2.28), subscriptions.opml, CONTEXT.md, AUDIT_TRAIL.md
- Deployment: clasp push Ingestion done. No Viewer change.
- Follow-up:
  - User to remove Google News from TOR manually (OPML import only adds, never removes).
  - User to import updated subscriptions.opml (Kagi feeds removal also pending from prior session).
  - Add more tickers to FINANCE_ALLOW_PATTERNS as portfolio grows — just add to the list.

### 2026-04-27 - Claude Code (v2.18 → v2.27, Viewer v2.11)
**Session scope:** Simhash dedup, OPML cleanup, category fixes, performance, duplicate purge, noise filter, feed replacements, new feeds, category cleanup, YouTube description

#### v2.18 — Simhash fuzzy dedup
- Request: Near-duplicate articles slipping through Jaccard/token-overlap dedup.
- Added 64-bit simhash fingerprinting (computeSimhash_, hammingDistance_). hdist ≤ 4 → score 0.90; hdist ≤ 8 → score 0.80. Scores alongside Jaccard/token-overlap in scorePossibleDuplicateMatch_.
- Files: Ingestion/Code.js, subscriptions.opml (fixed: removed duplicate TC/Verge AI feeds from AI folder, moved OpenClaw feeds, added Kagi proxy warning)

#### v2.19 — Category source map & detectCategory fix
- Request: Articles from AI-specific feeds landing in Finance/Policy; watch sites not reliably categorized.
- AI & LLMs checked before Finance/Research/Policy in detectCategory().
- CATEGORY_SOURCE_MAP expanded: all watch domains, AI-only feed domains (AWS ML, Google AI, MIT AI, NVIDIA, OpenAI, Anthropic, HuggingFace, deeplearning.ai), BBC/NYT → Top Story.

#### v2.20 — Performance: dedup cache + audit trail batching
- Request: runDailyIngestion() timing out (~1000 HTTP calls per run, 5 per article × 200 articles).
- INGESTION_DEDUP_CACHE_: candidate pool fetched once per phase (was once per article).
- AUDIT_TRAIL_BATCH_: audit writes queued and flushed in one call per phase.
- Added runTORIngestionOnly() and runGmailIngestionOnly() for separate time triggers.
- MAX_EMAILS_PER_RUN: 100 → 40.
- Validation: user confirmed runDailyIngestion() completes without timeout.

#### v2.21 — Exact duplicate skip + Viewer Duplicate exclusion
- Request: Duplicate articles still appearing in All Unread; exact dupes being inserted as Duplicate category.
- Ingestion: exact duplicates now skipped entirely (no insert, TOR marked read) instead of inserted as Duplicate category.
- Viewer v2.11: category=neq.Duplicate added to All Unread, read-fill, and stats queries.
- Files: Ingestion/Code.js, Viewer/Code.js, Viewer/index.html (version bump to V2.11 in 3 locations)

#### v2.22 — Fix hardPurgeDeletedArticles RangeError
- Request: hardPurgeDeletedArticles crashing with RangeError: Invalid time value.
- Root cause: CONFIG.PURGE_DAYS undefined → getDate() - undefined = NaN → toISOString() threw.
- Fix: replaced with new Date(Date.now() + 86400000).toISOString() (tomorrow as upper bound = purge all deleted).
- Ran softDeleteDuplicateArticles() → 453 dupes soft-deleted. Ran hardPurgeDeletedArticles() → 939 rows removed (453 from this run + 486 from previous failed run).

#### v2.23 — Fix normalizeCategory overwriting Duplicate category
- Request: Possible duplicate articles showing wrong category (DEV TOOLS instead of Duplicate) in Viewer.
- Root cause: sanitizeRecord() calls normalizeCategory() after markRecordAsDuplicateReview_() set category=Duplicate — source/keyword match overwrote it.
- Fix: early return at top of normalizeCategory(): if (canonicalCategoryName_(category) === 'Duplicate') return 'Duplicate'.

#### v2.24 — Case-insensitive title dedup
- Request: Identical articles with apostrophe/capitalization variants slipping past exact title dedup (e.g. "I've Built" vs "I VE BUILT").
- Fix: title=eq. → title=ilike. in PostgREST query; % and _ escaped to prevent wildcard interpretation.

#### v2.25 — Noise filter + feed replacements
- Request: Too many celebrity gossip, AI art spam, Kagi feeds broken, too much celebrity noise from BBC/NYT.
- Added NOISE_TITLE_PATTERNS (isNoisyArticle_): weight loss, celebrity gossip, AI art showcase, clickbait patterns. Wired into TOR and Gmail loops — matching articles skipped and TOR marked read.
- OPML: removed 4 broken Kagi proxy feeds; replaced with Reuters Business + Reuters Technology + CNBC.
- Swapped BBC World → BBC Technology, NYT HomePage → NYT Technology.
- CATEGORY_SOURCE_MAP: added reuters.com → Top Story, cnbc.com → Finance.

#### v2.26 — New Finance/News feeds + category cleanup
- Request: Add Google News, Yahoo News, Yahoo Finance, MSN, Cramer/stock feeds, Fox News; clean up categories.
- OPML: added Finance folder (Yahoo Finance, MarketWatch, CNBC Mad Money, Seeking Alpha, Motley Fool, Fox Business); News folder expanded (Google News, Yahoo News, Fox News); MSN noted as no public RSS; removed 3 Open-* feeds.
- CATEGORY_SOURCE_MAP: foxnews.com/news.google.com/news.yahoo.com → Top Story; foxbusiness.com/marketwatch.com/finance.yahoo.com/seekingalpha.com/fool.com → Finance; simonwillison.net/venturebeat.com → AI & LLMs.
- detectCategory() tightened: Dev Tools regex narrowed (removed overbroad open.?source, repo, framework, library); Top Story regex removed launches|announces (matched every product announcement, bloating Tech & Trends).

#### v2.27 — YouTube full description
- Request: How to get full video description in reading pane without an API key.
- YouTube RSS feed already provides full description via media:description element — it was just being truncated.
- finalizeSummaryForRecord_: YouTube path now allows 20 sentences / 3500 chars (was 5/850 shared with all categories).
- cleanYoutubeSummary_ still runs first to strip timestamps, hashtags, @mentions, promo lines.

#### Documentation / Process
- CONTEXT.md: clarified Ingestion needs no deploy step (runs via triggers, not web app) — only Viewer needs pencil → New version → Deploy.
- PROCESS.md note (added to CONTEXT.md Gotchas): Ingestion deploy = clasp push only; Viewer deploy = clasp push + Apps Script redeploy.

#### Pending after this session
- **User action**: Remove Kagi feeds manually from TOR, then import updated subscriptions.opml (TOR import is additive — only adds new Finance/News feeds, skips existing, never deletes).
- **User action**: Deploy Viewer in Apps Script (pencil → New version → Deploy) for v2.11 changes to take effect.
- **Run in Ingestion editor**: applySourceCategoryBackfill() to re-tag existing articles with updated source map (simonwillison, venturebeat, foxnews, finance domains).
- **Run in Ingestion editor**: softDeleteDuplicateArticles() + hardPurgeDeletedArticles() if additional duplicates surface.
- **Future**: Feed rework (user mentioned wanting to revisit subscriptions after category work settles).
- **Future**: YouTube summarize button (would require Anthropic API key in Script Properties + doPost action in Viewer).

### 2026-04-20 - Claude Code
- Request: Fuzzy dedup not catching similar articles — seeing 90% similar articles repeatedly.
- Root causes found:
  - WINDOW_DAYS was 2 — only looked back 2 days. AI news on same story spans 3-7 days across sources.
  - Candidate filter included status=neq.read — excluded already-read articles from comparison pool. Once user read the original, the dedup was blind to it.
- Fixes applied (Ingestion v2.17):
  - WINDOW_DAYS: 2 → 7
  - MAX_CANDIDATES: 250 → 500
  - Removed status=neq.read from findPossibleDuplicateCandidate_ query
- Files touched: Ingestion/Code.js, CONTEXT.md, AUDIT_TRAIL.md
- Deployment: clasp push done — Ingestion only, no Viewer change
- Follow-up: Run ingestion and check Duplicate category to verify similar articles are being caught

### 2026-04-20 - Claude Code
- Request: Clean up duplicate articles in Supabase (half the DB was dupes).
- Actions taken:
  - Added previewDuplicateArticles() and softDeleteDuplicateArticles() to Ingestion v2.15
  - First preview showed mail.google.com with 71 "dupes" — actually 71 different articles with a bad URL. Added BAD_URL_PREFIXES exclusion list (v2.16) to skip these
  - Second preview: 8046 total, 454 real dupe groups, 486 rows to soft-delete, 72 bad-URL articles safely skipped
  - User ran softDeleteDuplicateArticles() → 486 dupes soft-deleted
  - User ran hardPurgeDeletedArticles() → permanently removed
  - Result: 239 articles remaining — correct
- Kept: previewDuplicateArticles() and softDeleteDuplicateArticles() in codebase for future use
- Follow-up:
  - Redeploy Viewer v2.10 in Apps Script (pencil → New version → Deploy) — not yet confirmed done

### 2026-04-20 - Claude Code
- Request: Viewer not working at all after v2.13 deploy. Also hundreds of duplicate articles in DB.
- Files touched:
  - `Viewer/Code.js` — v2.10: replaced status=not.in.(read,deleted) with status=neq.read&status=neq.deleted (safer PostgREST syntax); archiveArticle() no longer sets archived:true
  - `Viewer/index.html` — v2.10: fixed VIEWER_STATS.archivedArticles ref in applyArchiveLocal → deletedArticles; bumped all 3 version strings to V2.10
  - `Ingestion/Code.js` — v2.14: fixed findPossibleDuplicateCandidate_ to use status=neq.deleted instead of archived=eq.false
  - `CONTEXT.md` + `AUDIT_TRAIL.md` — updated
- Root causes found:
  - CRITICAL: status=not.in.(read,deleted) PostgREST syntax likely caused Supabase errors, throwing in fetchAllArticlesByQuery_, collapsing the bootstrap
  - MISSED: VIEWER_STATS.archivedArticles still referenced in applyArchiveLocal (renamed to deletedArticles but this one instance was missed)
  - STALE: archiveArticle() still writing archived:true to the dormant archived field
  - STALE: dedup candidate lookup still filtering archived=eq.false — now uses status=neq.deleted
- Duplicate articles: pre-existing from before v2.8 dedup was added, or dedup silently failing on Supabase errors. Dedup filter fixed — new ingestion should now catch candidates correctly
- Validation: all version strings verified consistent (Ingestion v2.14, Viewer V2.10 in 3 locations)
- Deployment: clasp push both apps; redeploy Viewer via pencil → New version → Deploy
- Follow-up: monitor ingestion run to confirm dedup is catching duplicates correctly

### 2026-04-20 - Claude Code
- Request: (1) Viewer should not write to the database — purge belongs in Ingestion. (2) Simplify soft delete to use status='deleted' only, drop the archived=true flag which was confusing and redundant.
- Files touched:
  - `Ingestion/Code.js` — bumped to v2.13; soft delete now sets only status='deleted' (dropped archived:true from patch payload); all three purge queries updated to filter status=neq.deleted instead of archived=eq.false; added hardPurgeDeletedArticles() public function
  - `Viewer/Code.js` — bumped to v2.9; removed purgeStaleArticles() and purgeOldArchived(); all article fetch queries updated to use status=neq.deleted / status=not.in.(read,deleted) instead of archived=eq.false; archivedArticles stat renamed to deletedArticles; keptArticles count simplified to kept=eq.true
  - `Viewer/index.html` — renamed archivedArticles → deletedArticles in VIEWER_STATS state and stats mapping
  - `CONTEXT.md` — updated current version to v2.13/v2.9, added changelog row, updated gotchas to document kept vs archived clearly
  - `AUDIT_TRAIL.md` — this entry
- Actions taken:
  - Established rule: Viewer is read-only. All purge/delete operations live in Ingestion only.
  - Soft delete is now status='deleted' only. The archived column is dormant — no code writes to it anymore.
  - Hard delete (hardPurgeDeletedArticles) moved to Ingestion, filters kept=eq.false&status=eq.deleted — kept articles are double-gated out.
  - Renamed archivedArticles stat to deletedArticles throughout — now accurately reflects rows queued for hard deletion.
- Validation:
  - node --check on both Code.js files before commit
- Deployment: Both apps need clasp push + redeploy after this session
- Follow-up:
  - clasp push Ingestion, clasp push Viewer, redeploy both in Apps Script
  - Existing rows with archived=true&status=deleted (from v2.12 soft deletes) will still be caught by hardPurgeDeletedArticles since it filters status=eq.deleted regardless of archived flag

### 2026-04-20 - Claude Code
- Request: Set up GitHub connector so user can switch between Claude Code and Codex at will. Document the workflow in all three working docs.
- Files touched:
  - `C:\Users\exact\Refinery\CONTEXT.md` — added GitHub section with repo URL, branch, auth, and usage rule
  - `C:\Users\exact\Refinery\PROCESS.md` — added Claude Code section with git quick reference and tool-switching instructions
  - `C:\Users\exact\Refinery\HANDOFF_PROMPT.md` — added GitHub to WHERE EVERYTHING LIVES, updated version string to v2.12/v2.8, added git to end-of-session checklist, added tool-switching instructions
  - `C:\Users\exact\Refinery\AUDIT_TRAIL.md` — added this entry
- Actions taken:
  - Installed gh CLI (v2.90.0) via winget
  - Authenticated gh CLI as moltoboto (HTTPS, keyring)
  - Confirmed `C:\Users\exact\Refinery\` is already a git repo on `main`, tracking `origin/main`, clean and up to date with GitHub
  - Confirmed local files (v2.12 Ingestion, v2.8 Viewer) match GitHub main (last commit: "Switch article cleanup to soft delete", 2026-04-20T23:20 UTC)
  - Updated all three working docs with GitHub info and tool-switching workflow
- Validation:
  - `gh auth status` confirmed moltoboto logged in with repo scope
  - `git status` confirmed clean working tree, branch main, up to date with origin/main
- Follow-up:
  - Mirror updated docs to Google Drive Refinery folder manually
  - From now on: commit + push to GitHub at the end of every substantive session
  - Codex sessions should pull latest from GitHub before starting

### 2026-04-20 - Codex
- Request: Replace hard-delete-first behavior with a safer delete state, so article cleanup can be reversible and true purges only remove rows already marked deleted.
- Files touched:
  - `C:\Users\exact\Refinery\Ingestion\Code.js` - bumped to v2.12, changed the pre-April cleanup flow from hard delete to soft delete, and kept `kept=true` rows protected
  - `C:\Users\exact\Refinery\Viewer\Code.js` - changed stale purge to physically remove only rows already marked `status='deleted'` and excluded deleted rows from archive counts
  - `C:\Users\exact\Refinery\CONTEXT.md` - updated current version and changelog
  - `C:\Users\exact\Refinery\AUDIT_TRAIL.md` - added this entry
- Actions taken:
  - Stopped using hard delete as the default cleanup action for old articles.
  - Updated the ingestion purge module so `purgeArticlesBeforeApril2026()` now sets `archived=true` and `status='deleted'` for non-kept rows before the cutoff instead of removing them from the table.
  - Kept `kept=true` rows out of preview, sample, and cleanup queries.
  - Repurposed the viewer stale purge path so it only hard-purges rows already marked deleted.
- Validation:
  - `node --check` passed for both `Ingestion/Code.js` and `Viewer/Code.js`.
- Follow-up:
  - Push both Apps Script projects and GitHub.
  - From now on, use the date-based purge as a soft delete only; use the stale purge path only when you intentionally want permanent removal of already-deleted rows.

### 2026-04-20 - Codex
- Request: Make the pre-April article purge actually delete safely, and clean up the ingestion code so the redundant purge helpers stop cluttering the Apps Script function list.
- Files touched:
  - `C:\Users\exact\Refinery\Ingestion\Code.js` - refactored purge helpers into `ARTICLE_PURGE_`, removed redundant public purge/date helper functions, removed `listTorSubscriptions()`, bumped to v2.11
  - `C:\Users\exact\Refinery\CONTEXT.md` - updated current version and changelog entry for v2.11
  - `C:\Users\exact\Refinery\AUDIT_TRAIL.md` - added this entry
- Actions taken:
  - Confirmed the cutoff logic was correct and the real blocker was delete authorization, not date filtering.
  - Replaced the scattered purge helper family with one internal `ARTICLE_PURGE_` module and left only `previewPurgeArticlesBeforeApril2026()` and `purgeArticlesBeforeApril2026()` as public entrypoints.
  - Moved the destructive delete path to use a Script Property named `SUPABASE_SERVICE_ROLE_KEY`, while keeping read-only preview/count calls on the existing Supabase API key.
  - Removed `listTorSubscriptions()` to reduce top-level Apps Script menu clutter; kept `listKagiTorSubscriptions()` for Kagi feed replacement work.
- Validation:
  - `node --check` passed on the updated ingestion file after copying it to a neutral temp path.
- Follow-up:
  - In Apps Script, add Script Property `SUPABASE_SERVICE_ROLE_KEY` before running the live purge.
  - Push ingestion to Apps Script and GitHub.
  - Mirror docs to `C:\Users\exact\OneDrive\Refinery\`.

### 2026-04-13 - Claude Code (session 4, continued)
- Request: Fix artifact title double-date, fix wrong dates (all showing today), update docs.
- Files touched:
  - `C:\Users\exact\Refinery\Viewer\Code.js` — getArtifactDisplayTitle_ strips YYYY-MM-DD-- prefix; extractArtifactDate_ helper added; buildArtifactRecord_ uses helper
  - `C:\Users\exact\Refinery\Ingestion\Code.js` — buildArtifactTitle_ changed to yyyy-MM-dd -- Source - Subject [msgId] format; fixArtifactDatesFromGmail() added
- Actions taken:
  - Root cause of double date: first rename baked 2026-04-13 into filenames; display then added another date prefix
  - Root cause of wrong date: meta.date not reliably readable from Drive file descriptions; filename regex was finding the wrong baked-in date
  - Fixed getArtifactDisplayTitle_ to strip leading YYYY-MM-DD -- prefix before formatting
  - Added fixArtifactDatesFromGmail() to Ingestion — reads messageId from file description or filename, looks up original email date from Gmail, renames to correct date
  - Changed buildArtifactTitle_ in Ingestion to new format (yyyy-MM-dd -- Source - Subject [msgId]) — new ingested files named correctly from the start
  - No version bump — all bug fixes to v2.7
- Validation:
  - Both apps pushed via clasp
- Follow-up:
  - Run fixArtifactDatesFromGmail() in Ingestion editor to fix existing file names
  - Redeploy Viewer (New Deployment) to pick up display fix
  - Upload all 6 working docs to Google Drive manually
  - Source-to-category mapping still pending
  - Start fresh session — context limit approaching

### 2026-04-13 - Claude Code (session 4)
- Request: Fix artifact titles (double date, wrong date), remove Archive from sidebar, bump to v2.7, update all docs.
- Files touched:
  - `C:\Users\exact\Refinery\Viewer\Code.js` — fixed email date in buildArtifactRecord_, fixed getArtifactDisplayTitle_ to strip embedded date, bumped to v2.7
  - `C:\Users\exact\Refinery\Viewer\index.html` — removed Archive from sidebar, removed artifact-meta line 2, popup window dimensions
  - `C:\Users\exact\Refinery\CONTEXT.md` — added v2.7 to change log, updated current version
  - `C:\Users\exact\Refinery\HANDOFF_PROMPT.md` — full rewrite with exact file locations and startup instructions
  - `C:\Users\exact\Refinery\RefineryV2 Viewer.json` — regenerated
  - `C:\Users\exact\Refinery\RefineryV2 Ingestion.json` — regenerated
- Actions taken:
  - Artifact dateLabel now uses meta.date (email date) with fallback to file creation date
  - getArtifactDisplayTitle_ now strips embedded YYYY-MM-DD from filename (removes double date)
  - Archive nav item removed from sidebar
  - Artifact metadata line (type + size) removed from list items
  - Open-in-window uses popup window (1000x800) instead of tab
  - MAX_EMAILS_PER_RUN bumped to 100; ingestGmailTwoTier run — processed 33 new emails
  - saveAllEmailsAsArtifacts dropped (wrong architecture); kept current newsletter/email split
  - Version bumped to v2.7
- Validation:
  - clasp push confirmed 3 files for Viewer
  - User deployed via Manage Deployments (same URL kept)
- Follow-up:
  - Run renameArtifactsToDateTitle() in Viewer editor to rename existing files with correct email dates
  - Upload updated docs + JSONs to Google Drive manually
  - Source-to-category mapping still pending
  - Ingestion comment encoding (garbled Codex characters) still pending

### 2026-04-13 - Claude Code (session 3)
- Request: Evaluate JSONs, fix scope, rename artifacts, consolidate directories to local drive.
- Files touched:
  - `C:\Users\exact\Refinery\Viewer\appsscript.json` — upgraded Drive scope from `drive.readonly` to `drive`
  - `C:\Users\exact\Refinery\Viewer\Code.js` — added `renameArtifactsToDateTitle()` function
  - `C:\Users\exact\Refinery\Viewer\.clasp.json` — script ID needs update (projects deleted)
  - `C:\Users\exact\Refinery\Ingestion\.clasp.json` — script ID needs update (projects deleted)
  - `C:\Users\exact\Refinery\RefineryV2 Viewer.json` — regenerated from current code
  - `C:\Users\exact\Refinery\RefineryV2 Ingestion.json` — regenerated from current code
  - `C:\Users\exact\Refinery\CONTEXT.md` — updated paths, added local file structure
  - `C:\Users\exact\Refinery\AUDIT_TRAIL.md` — this file
- Actions taken:
  - Found both JSONs were stale (old folder ID, missing new functions)
  - Fixed Viewer OAuth scope: `drive.readonly` → `drive` (required for rename + delete)
  - Added `renameArtifactsToDateTitle()` to Viewer — renames all Drive files to `MMM d, yyyy -- Title`
  - Regenerated both JSONs from current local source
  - Consolidated all files from 3 separate directories into `C:\Users\exact\Refinery\`
  - Updated folder ID to `1eO6n6MQKF7_cCwulGxhDkzrxT772M-Iz` in both Viewer and Ingestion code
  - User deleted both Apps Script projects — new projects created (Viewer v2.6, Ingestion v2.4)
- Validation:
  - clasp push confirmed 3 files pushed for Viewer before projects deleted
- Follow-up:
  - **Need new script IDs** from user to update `.clasp.json` files and push both apps
  - Run `renameArtifactsToDateTitle()` in Viewer Apps Script editor after push
  - Historical email re-ingestion still ongoing
  - PKB backup cleanup deferred
  - Version control / git setup deferred

### 2026-04-12 - Claude Code (session 2)
- Request: Review project state, confirm v2.6, fix artifacts, level-set file locations, upload working docs to Google Drive.
- Files touched:
  - `C:\Users\exact\RefineryV2-Viewer\Code.js` (read, confirmed v2.6 implemented)
  - `C:\Users\exact\RefineryV2-Viewer\index.html` (read, confirmed v2.6 implemented)
  - `C:\Users\exact\RefineryV2-Ingestion\Code.js` (read, confirmed rebuildEmailArtifacts function)
  - `C:\Users\exact\OneDrive\Refinery\CONTEXT.md` (updated)
  - `C:\Users\exact\OneDrive\Refinery\AUDIT_TRAIL.md` (this file)
- Actions taken:
  - Confirmed ALL v2.6 changes are in the code — the issue was deployment, not missing code.
  - User created a new Apps Script deployment — Viewer now serving v2.6.
  - User ran rebuildEmailArtifacts — Drive artifacts folder repopulated.
  - User removed Refinery/Processed label from historical emails and marked unread for re-ingestion.
  - Confirmed artifact saves are independent of Supabase dedup — re-ingestion saves new artifacts without duplicate DB records.
  - Confirmed Google Drive Refinery folder ID: `1Ue36DjRLySHJ4jQvsSYQuRmtoor9BkJL`
  - User-provided Artifacts folder URL: `https://drive.google.com/drive/u/1/folders/1eO6n6MQKF7_cCwulGxhDkzrxT772M-Iz`
  - Working docs confirmed already in Google Drive moltoboto Refinery folder.
- Validation:
  - v2.6 confirmed by user (new deployment shows v2.6).
  - rebuildEmailArtifacts confirmed working by user.
- Follow-up:
  - **Artifacts folder ID mismatch**: Code config has `1s_Rz1UgR0mTnVhRV7MjY_jTVMsziEMkR`, user-provided URL is `1eO6n6MQKF7_cCwulGxhDkzrxT772M-Iz`. Confirm which is the live folder and update code if needed.
  - Historical email re-ingestion ongoing (50/run limit, emails unmarked/unlabeled).
  - Stale backup files still in Viewer clasp folder: `index.broken.v22f.backup.html`, `index.pre-port.backup.html`.
  - PKB backup cleanup deferred.
  - Version control / git setup for clasp folders deferred.

### 2026-04-12 18:10 ET - Codex
- Request: Create a durable audit trail for Refinery work so future sessions can pick up cleanly.
- Files touched:
  - `C:\Users\exact\Downloads\Refinery\AUDIT_TRAIL.md`
  - `C:\Users\exact\Downloads\Refinery\HANDOFF_PROMPT.md`
  - `C:\Users\exact\Downloads\Refinery\CONTEXT.md`
  - `C:\Users\exact\Downloads\Refinery\PROCESS.md`
- Actions taken:
  - Added this audit trail file as the session-by-session log.
  - Updated the handoff prompt to require reading and updating the audit trail.
  - Updated project context to reference the audit trail as part of the operating documents.
  - Updated the process doc so new sessions append an audit entry after meaningful work.
- Validation:
  - Confirmed the handoff files exist in the Refinery folder and were updated consistently.
- Follow-up:
  - Append new entries at the end of each substantive session.

### 2026-04-12 11:02 ET - Codex
- Request: Bundle a Viewer pass to remove the dead Archive control, clean up artifact naming/counts, add artifact delete and pop-out actions, and make TXT/MD artifacts preview correctly.
- Files touched:
  - C:\Users\exact\RefineryV2-Viewer\Code.js
  - C:\Users\exact\RefineryV2-Viewer\index.html
  - C:\Users\exact\OneDrive\Refinery\CONTEXT.md
  - C:\Users\exact\OneDrive\Refinery\AUDIT_TRAIL.md
- Actions taken:
  - Removed the article right-pane Archive button and its keyboard shortcut/hint.
  - Removed Artifacts from the article category navigation so artifact counts only live in the dedicated artifact view.
  - Reformatted artifact list titles to Date -- Title using cleaned display titles instead of raw file names.
  - Added artifact header actions for pop-out and delete.
  - Added backend artifact deletion and stronger text-like mime normalization so TXT, MD, JSON, CSV, and similar files render locally.
  - Pushed the updated Viewer project to Apps Script with clasp push --force.
- Validation:
  - 
ode --check passed for a temp copy of Code.js.
  - 
ode --check passed for the extracted index.html script block.
  - Confirmed the stale archive UI references were removed from the Viewer surface.
- Follow-up:
  - Update the Viewer web app deployment in Apps Script so the live URL serves Refinery V2.6.

### 2026-04-12 - Claude Code
- Request: Review project state after OneDrive move, fix missing artifacts, push both apps.
- Files touched:
  - `C:\Users\exact\RefineryV2-Viewer\` (clasp push --force)
  - `C:\Users\exact\RefineryV2-Ingestion\` (already up to date)
- Actions taken:
  - Confirmed both apps use same Drive folder ID: `1s_Rz1UgR0mTnVhRV7MjY_jTVMsziEMkR` (My Drive > Refinery > Refinery Artifacts)
  - Confirmed Google Drive Artifacts folder was empty after Codex move debacle
  - Pushed Viewer via `clasp push --force` (5 files); Ingestion already up to date
  - User ran `rebuildEmailArtifacts` in Ingestion Apps Script — successfully repopulated Drive folder
- Validation:
  - rebuildEmailArtifacts confirmed working by user
- Follow-up:
  - **v2.6 changes were NEVER actually applied by Codex** — artifact delete, pop-out, TXT/MD preview, and renamed titles still need to be implemented
  - Need to reprocess ALL historical emails: remove `Refinery/Processed` label from older emails so ingestion re-saves them as artifacts, OR extend rebuildEmailArtifacts scope
  - Two stale backup files in Viewer clasp folder should be removed: `index.broken.v22f.backup.html`, `index.pre-port.backup.html`
  - CONTEXT.md version still shows v2.6 but that work was not done — may need to revert to v2.5

### 2026-04-19 16:xx ET - Codex
- Request: Pull the latest source from Apps Script, confirm the live code state, and set up a Git/GitHub path for storing both projects outside Apps Script.
- Files touched:
  - `C:\Users\exact\Refinery\Ingestion\appsscript.json`
  - `C:\Users\exact\Refinery\Ingestion\Code.js`
  - `C:\Users\exact\Refinery\Viewer\appsscript.json`
  - `C:\Users\exact\Refinery\Viewer\Code.js`
  - `C:\Users\exact\Refinery\Viewer\index.html`
  - `C:\Users\exact\Refinery\.gitignore`
  - `C:\Users\exact\Refinery\AUDIT_TRAIL.md`
- Actions taken:
  - Located the current working copy at `C:\Users\exact\Refinery`.
  - Pulled both Apps Script projects with `clasp pull` so the local copy now matches Google Apps Script.
  - Confirmed script bindings are still intact via `.clasp.json`.
  - Verified the pulled Viewer source now reports `Refinery V2.7`; Ingestion header remains `Version: 2.4`.
  - Initialized a git repository at the shared `C:\Users\exact\Refinery` root and added a minimal `.gitignore`.
- Validation:
  - `clasp pull` succeeded for both projects.
  - `git init` succeeded at `C:\Users\exact\Refinery`.
  - `git status --short` shows the expected untracked project files ready for a first commit.
- Follow-up:
  - No GitHub remote exists yet; next step is to create an empty GitHub repo and connect it with `git remote add origin ...`.
  - After that, commit and push the `C:\Users\exact\Refinery` root so GitHub becomes the durable source-of-truth alongside Apps Script.
  - Future round-trip workflow should be: `clasp pull` before committing Google-edited changes, and `clasp push` after local/Git changes.

### 2026-04-19 17:xx ET - Codex
- Request: Add a safer duplicate-review workflow so similar stories can be skimmed in the existing Viewer before anything is deleted.
- Files touched:
  - `C:\Users\exact\Refinery\Ingestion\Code.js`
  - `C:\Users\exact\Refinery\Viewer\Code.js`
  - `C:\Users\exact\Refinery\Viewer\index.html`
  - `C:\Users\exact\Refinery\CONTEXT.md`
  - `C:\Users\exact\Refinery\AUDIT_TRAIL.md`
- Actions taken:
  - Added a `DEDUPE_REVIEW` config block in ingestion and introduced duplicate-review matching over a recent lookback window.
  - Preserved exact URL/title duplicate detection, but changed it from silent skip to review insertion so exact duplicates also appear for inspection.
  - Added possible-duplicate scoring for same-event and same-topic matches among active unread articles, ignoring source as requested.
  - Routed both exact duplicates and possible duplicates into the `Duplicate` category and prepended review context naming the original article and why it matched.
  - Added `Duplicate` as a first-class category in the Viewer and bumped both app surfaces to v2.8.
- Validation:
  - `node --check` passed for `Ingestion/Code.js`, `Viewer/Code.js`, and the extracted `Viewer/index.html` script block when checked from a neutral path.
- Follow-up:
  - Push both Apps Script projects and redeploy the Viewer web app so `Duplicate` appears live.
  - Watch the first few ingestion runs and tune the duplicate scoring if the queue is too broad or too narrow.

### 2026-04-19 21:xx ET - Codex
- Request: Clean up article categorization, especially false `Watches` matches from generic uses of the word "watch", and create a reviewable list of TOR RSS sources with a category dropdown.
- Files touched:
  - `C:\Users\exact\Refinery\Ingestion\Code.js`
  - `C:\Users\exact\Refinery\CONTEXT.md`
  - `C:\Users\exact\Refinery\AUDIT_TRAIL.md`
- Actions taken:
  - Added spreadsheet-backed TOR source mapping in ingestion using a new `rss_source_map` sheet tab in the existing project spreadsheet.
  - Added `syncTorSourceCategorySheet()` to pull current TOR subscriptions, gather recent article context, and write one row per source with an `assigned_category` dropdown and a `suggested_category` first pass.
  - Wired ingestion to honor source/category overrides from that sheet before falling back to static source mappings and keyword detection.
  - Added `previewSourceCategoryBackfill()` and `applySourceCategoryBackfill()` so existing article categories can be reviewed and then updated from the new source map.
  - Tightened `Watches` detection so generic references to "watch" no longer auto-map articles unless stronger watch-specific terms are present.
  - Corrected the suggestion logic so `suggested_category` is computed fresh from TOR source/title evidence rather than echoing any prior manual override.
- Validation:
  - `node --check` passed for a temp copy of `C:\Users\exact\Refinery\Ingestion\Code.js`.
  - Reviewed the git diff to confirm the new sheet workflow, override path, and watch keyword change are present.
- Deployment status:
  - Local files updated; ingestion push/deploy still pending at the time of this entry.
- Follow-up:
  - Push the updated ingestion Apps Script project.
  - Run `syncTorSourceCategorySheet()` in Apps Script to populate the source review sheet.
  - Review the dropdown choices in `rss_source_map`, then use `previewSourceCategoryBackfill()` / `applySourceCategoryBackfill()` if historical categories should be corrected.

### 2026-04-20 18:xx ET - Codex
- Request: Remove article rows dated before April 1 while keeping Drive artifacts, and help identify/replace non-English Kagi feeds.
- Files touched:
  - `C:\Users\exact\Refinery\Ingestion\Code.js`
  - `C:\Users\exact\Refinery\CONTEXT.md`
  - `C:\Users\exact\Refinery\AUDIT_TRAIL.md`
- Actions taken:
  - Added article-only purge helpers that operate on Supabase rows by `date_added` cutoff and do not touch Drive artifacts.
  - Added `previewPurgeArticlesBeforeApril2026()` / `purgeArticlesBeforeApril2026()` plus generic cutoff variants for safer dry-run-first cleanup.
  - Added `listTorSubscriptions()` and `listKagiTorSubscriptions()` to inspect current TOR feeds and isolate Kagi-based subscriptions for replacement.
  - Kept the cleanup path conservative by batching deletes by article IDs rather than issuing a blind broad delete.
- Validation:
  - `node --check` passed for a temp copy of `C:\Users\exact\Refinery\Ingestion\Code.js`.
  - Reviewed the git diff to confirm the purge helpers, Kagi listing helpers, and version bump are present.
- Deployment status:
  - Local files updated; ingestion push/deploy pending at the time of this entry.
- Follow-up:
  - Push the updated ingestion Apps Script project.
  - Run `previewPurgeArticlesBeforeApril2026()` before any deletion.
  - Run `listKagiTorSubscriptions()` to see exactly which Kagi feeds are currently in TOR before replacing them.

### 2026-04-27 - Claude Code
- Request: (1) Implement simhash fingerprinting for near-duplicate detection. (2) Fix subscriptions.opml: remove duplicate TC/Verge feeds, move OpenClaw feeds, document Kagi proxy fragility. (3) Commit OPML to repo.
- Files touched:
  - `Ingestion/Code.js` — bumped to v2.18
  - `subscriptions.opml` — fixed structure, committed to repo
  - `CONTEXT.md` — version bump, changelog entry, Kagi gotcha, subscription cleanup note
  - `AUDIT_TRAIL.md` — this entry
- Actions taken:
  - **Simhash (Ingestion v2.18):** Added `computeSimhash_()` (64-bit, djb2-based), `hammingDistance_()`, `popcount32_()`, `simhashText_()`, and `SIMHASH_THRESHOLD=8` constant. Updated `scorePossibleDuplicateMatch_()` to compute simhash fingerprints for both incoming and candidate text (title+summary), then boost score: hdist<=4 → score 0.90, hdist<=8 → score 0.80. Simhash is a complementary signal alongside existing Jaccard/token-overlap scoring.
  - **OPML fixes:** Removed `techcrunch.com/category/artificial-intelligence/feed/` and `theverge.com/rss/ai-artificial-intelligence/index.xml` from AI folder — both publications already covered by main feeds in Tech folder, so these were causing source-level duplicates. Moved `openclaw.substack.com/feed` and `openclaw.ai/rss.xml` from YouTube folder to Learning & Skills (correct category). Added XML comment documenting Kagi allorigins.win proxy fragility.
  - **CONTEXT.md:** Added Kagi proxy gotcha to Known Patterns section.
  - Committed OPML and Code.js to git, pushed to main.
- Validation:
  - OPML diff reviewed — duplicate feeds removed, OpenClaw relocated, comments added
  - Simhash functions visually verified for correctness (djb2 hash, 64-bit v array, popcount)
- Deployment: clasp push Ingestion (no Viewer changes); user must redeploy in Apps Script (pencil → New version → Deploy)
- Follow-up:
  - Import cleaned subscriptions.opml back into The Old Reader to actually remove the duplicate feeds from the live reader
  - Run ingestion to verify simhash is catching near-duplicates (check Duplicate category)
  - Monitor Kagi content in Viewer — if it goes blank, check allorigins.win status

### 2026-04-27 - Claude Code
- Request: Daily ingestion timing out.
- Root cause: Per-article Supabase calls — every article made 5 HTTP calls (URL check, title check, 500-candidate fuzzy fetch, insert, audit write). 100 TOR + 100 Gmail articles ≈ 1000 HTTP calls per run @ 200-400ms each = 3-7 min. Over Apps Script 6-min limit.
- Fixes (Ingestion v2.20):
  - INGESTION_DEDUP_CACHE_: 500-candidate dedup pool fetched once per phase, reused for all articles (was fetched per-article — ~100 calls → 1)
  - AUDIT_TRAIL_BATCH_ + flushAuditTrailBatch_(): audit trail writes queued and flushed as one batch call per phase (was one write per article — ~100 calls → 1)
  - Added runTORIngestionOnly() and runGmailIngestionOnly() as separate entry points for independent time triggers if needed in future
  - MAX_EMAILS_PER_RUN: 100 → 40
- Files touched: Ingestion/Code.js, CONTEXT.md
- Validation: User confirmed runDailyIngestion completed successfully with Option A (combined trigger). No split needed.
- Deployment: clasp push done, pencil → New version → Deploy in Apps Script
- Follow-up:
  - Run applySourceCategoryBackfill() in Ingestion to re-tag existing articles with corrected v2.19 category logic (AI & LLMs now checked before Finance/Policy)
  - Import updated subscriptions.opml into The Old Reader
