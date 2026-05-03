# Refinery - Project Context

## What This Is
Two Google Apps Script apps that together form a personal news reader.
Newsletters and RSS feeds flow in through the Ingestion app -> Supabase -> displayed in the Viewer app.

## Operating Documents
- `CONTEXT.md` - durable project state, rules, gotchas, and change log
- `AUDIT_TRAIL.md` - session-by-session work log, validation notes, deployment status, and follow-up items
- `PROCESS.md` - workflow for pull/edit/push/deploy

## Current Version
Ingestion: v2.28 | Viewer: v2.11

## Tech Stack
- **Runtime:** Google Apps Script (V8), JavaScript ES5 style
- **Database:** Supabase (PostgreSQL REST API via UrlFetchApp)
- **Frontend:** HTML/CSS/JS served via Apps Script doGet()
- **Fonts:** Lora + DM Sans (Google Fonts)
- **Storage:** Google Drive (newsletter artifact HTML files)

## Local File Structure
```
C:\Users\exact\Refinery\          ← git repo, tracked on origin/main
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
- Kagi feeds in TOR use `allorigins.win` as a CORS proxy (e.g. `api.allorigins.win/raw?url=https://news.kagi.com/...`). This 3rd-party proxy can go down silently — if Kagi content disappears from the Viewer, check allorigins.win first
- Source files live locally at `C:\Users\exact\Refinery\`; deployed to Apps Script via clasp
- All working docs consolidated to `C:\Users\exact\Refinery\` (previously split across OneDrive\Refinery and two separate clasp folders)

## On the Horizon
- **Duplicate removal** - needs improvement (current dedup misses some cases)
- **Substack ingestion** - confirm working end-to-end via TOR RSS
- **Subscription cleanup** - subscriptions.opml committed; duplicate TC/Verge feeds removed; OpenClaw moved; Kagi proxy documented. Still TODO: import cleaned OPML back into TOR to actually remove the duplicate feeds from the live reader
- **Add new subscriptions** - new feeds/newsletters to onboard
- **Direct URL input for artifacts** - UI to paste a URL and save as artifact manually
- OpenClaw Phase 2 - signal/category enrichment (stubbed, deriveSignal returns '')
- Raindrop / Reddit integration
- Yahoo/Google News RSS
- TipRanks alerts as separate category

## Change Log
| Version | Date | Tool | Changes |
|---------|------|------|---------|
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
| v2.7 | 2026-04-13 | Claude Code | Date format changed to yyyy-MM-dd for sortability; artifact metadata line removed from list; Archive removed from sidebar; open-in-window opens popup (1000x800); email date used for artifact date label (not file creation date); double-date stripped from display title; Drive scope upgraded from readonly to full; renameArtifactsToDateTitle() added; MAX_EMAILS_PER_RUN bumped to 100; all files consolidated to C:\Users\exact\Refinery\ |
| v2.6 | 2026-04-12 | Codex | Removed Archive button from article right-pane; removed Artifacts from category nav; artifact list titles formatted as Date -- Title; added pop-out and delete buttons on artifact header; backend artifact deletion; stronger mime normalization for TXT/MD/JSON/CSV |
| v2.5 | 2026-04-11 | Codex | Email injection improvements; artifacts changed from text to HTML; fixed artifact viewer for PNG and TXT; cleaned up artifact naming; removed Keep and Open in Drive buttons |
| v2.4 | - | - | Baseline version when CONTEXT.md was created |

**Rule:** Update this log on every version bump, not every session.
Bump the version number in Code.gs and add one row here before closing out.

## Audit Rule
- After every substantive session, append an entry to `AUDIT_TRAIL.md`
- The audit trail should capture the request, files touched, actions taken, validation, deployment status, and follow-up
- Use `CONTEXT.md` for stable state and version history; use `AUDIT_TRAIL.md` for chronological work history
