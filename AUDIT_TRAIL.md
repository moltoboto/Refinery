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
