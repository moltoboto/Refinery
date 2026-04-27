# Refinery - Project Context

## What This Is
Two Google Apps Script apps that together form a personal news reader.
Newsletters and RSS feeds flow in through the Ingestion app -> Supabase -> displayed in the Viewer app.

## Operating Documents
- `CONTEXT.md` - durable project state, rules, gotchas, and change log
- `AUDIT_TRAIL.md` - session-by-session work log, validation notes, deployment status, and follow-up items
- `PROCESS.md` - workflow for pull/edit/push/deploy

## Current Version
Ingestion: v2.14 | Viewer: v2.10

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
- Deployment: always use pencil → New version → Deploy on the existing deployment (keeps URL). New Deployment creates a new URL — only use when the URL itself breaks
- `kept` field: use strict `=== true` comparison (nulls present alongside booleans). `kept=true` IS the user's permanent archive — never touch these in any purge
- `archived` field: dormant. Was repurposed as a soft-delete flag in v2.12 but dropped in v2.13. Soft delete now uses `status='deleted'` only. The `archived` column remains in the DB but is no longer written by any purge path
- Soft delete = `status='deleted'`. Hard delete runs only from Ingestion via `hardPurgeDeletedArticles()`
- URL dedup is canonical (tracking params stripped before comparison)
- Gmail MCP in Claude.ai uses Anthropic OAuth - separate from Apps Script auth
- `deriveSignal()` currently returns empty string - stubbed for OpenClaw Phase 2
- Source files live locally at `C:\Users\exact\Refinery\`; deployed to Apps Script via clasp
- All working docs consolidated to `C:\Users\exact\Refinery\` (previously split across OneDrive\Refinery and two separate clasp folders)

## On the Horizon
- **Duplicate removal** - needs improvement (current dedup misses some cases)
- **Substack ingestion** - confirm working end-to-end via TOR RSS
- **Subscription cleanup** - audit and clean up active TOR feeds
- **Add new subscriptions** - new feeds/newsletters to onboard
- **Direct URL input for artifacts** - UI to paste a URL and save as artifact manually
- OpenClaw Phase 2 - signal/category enrichment (stubbed, deriveSignal returns '')
- Raindrop / Reddit integration
- Yahoo/Google News RSS
- TipRanks alerts as separate category

## Change Log
| Version | Date | Tool | Changes |
|---------|------|------|---------|
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
