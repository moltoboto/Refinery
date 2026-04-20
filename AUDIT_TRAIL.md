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
