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

### 2026-07-01 - Claude Code (Checkpoint — v2.60 in-flight, exec-summary format, /dev URL; NOT a ship)
- Memory checkpoint (context ~75%, pre-summarization). Committing the in-flight markdown numbering fix so the working tree is clean.
- **v2.60 (partial, this commit = numbering only; header cleanup + version bump still TODO):**
  - **Markdown loose-list numbering fix — DONE + verified.** `markdownToHtml_` no longer calls `closeList()` on blank lines — loose lists (blank line between items) were each becoming a single-item `<ol>`, so every item rendered "1.". Verified vs the real `2026_Agent_Memory_Systems.md`: 2 `<ol>`s, 9 `<li>`, first list 1→4. NOT yet clasp-pushed (bundle with header cleanup as v2.60).
  - **Artifact-header cleanup — TODO** (per Tom's screenshot): `renderArtifactShell` remove eyebrow (`SOURCE·DATE`) + meta (`type·size`), one-line serif title (**keep Lora**), kill the blank space above content; scope = all artifacts.
- **Exec-summary format proposed** (awaiting Tom's confirm → then build a reusable skill): MD, 4 sections — Bottom Line / Core Message / Key Takeaways (numbered, bold lead) / Why It Matters. Converted `2026_Agent_Memory_Systems.md` as the example.
- **`/dev` URL** recommended as the permanent link: never changes, always-latest (no redeploy after clasp push), no "created by Apps Script user" banner (that's `/exec`-only, unremovable on a personal account). Requires moltoboto login.
- Sync confirmed LIVE (rclone nightly 17:00 + `refinery-sync`). Feeds: `subscriptions-cleaned.opml` draft; **Sift migration dropped** — re-import cleaned list to TOR; pending Tom's 10 tickers / Reddit call / `[XX]` numbers / Reuters liveness.
- Full braindump + Open Brain updated (2026-07-01 1126).

### 2026-07-01 - Claude Code (Infra: removed ExpanDrive (#3) + built rclone Wisdomware→Drive sync (#4/W2))
- Request: Tom's #3 (remove ExpanDrive) + #4 (install rclone) + build the vault→Drive sync.
- #3 ExpanDrive removed: app + App Support + Caches + Preferences + Group Container + Desktop reset-backup → Trash. Left for Tom (macOS-protected / his accounts): Finder-trash `~/Library/Containers/com.expandrive.ExpanDrive.FileProvider`, revoke the ExpanDrive Google grants (moltoboto + tc11228), empty Trash.
- #4 rclone: `brew install rclone` (v1.74.3); `gdrive` remote authorized to **moltoboto** (verified via `rclone lsd` — Drive top level = Refinery/OpenClaw/Watches/.codex). Token in rclone.conf; temp token files scrubbed.
- **W2 sync BUILT + TESTED** — proves rclone writes to Drive via API (the -2005 ExpanDrive couldn't):
  - `sync-wisdomware.sh` (repo root): `rclone copy` vault → Drive folder `1eO6n6…` (= Refinery's DRIVE_FOLDER_ID). ADDITIVE (never deletes → Drive-side deletes stick); default `--max-age 2d` (recent files only, so old deletes aren't re-copied); `--all` = full backfill; `--dry` = dry run. Filter: `*.md`/`*.html` only, skips dot-folders + `_trash` + everything else. Test run transferred 7 recently-modified md files, exit 0.
  - launchd `~/Library/LaunchAgents/com.refinery.wisdomware-sync.plist` — nightly **17:00**, PATH includes /opt/homebrew/bin (rclone). Loaded.
  - Shell aliases (`~/.zshrc`): `refinery-sync` (recurring) + `refinery-sync-all` (backfill).
  - bash 3.2 gotcha fixed: `set -eo pipefail` (not `-u` — empty-array expansion errors under nounset on macOS bash 3.2).
- Cleanup flags found in the Drive folder (not blocking): a duplicate **`[01] Inbox `** (trailing space) folder beside `[01] Inbox`; and `[03] AI/copilot/**` prompt-snippet `.md`s would show as tiny "reading" items (recurring sync skips them as old; only `--all` would pull them).
- Follow-up: Tom's remaining list — #5–7 Sift chain, #8 "Clear Executive Summary" (clarify), #9 dedup.

### 2026-07-01 - Claude Code (Viewer v2.59 — Artifacts list loads ALL items, not just the newest 50)
- Request: Tom's issue #1 — the Artifacts tab showed the correct total *count* but only *listed* 50 items, so whole folders were missing.
- Files: Viewer/index.html (`ARTIFACT_LIMIT` 50→1000 + version strings), Viewer/Code.js (`getInitialArticles` + `getViewerBootstrap` artifactLimit defaults 50→1000, version line + display strings).
- Actions: raised the artifact load cap everywhere (client `ARTIFACT_LIMIT` + both server defaults) from 50 → 1000. `getArtifacts` already recurses subfolders (v2.57, hard cap 3000), so the grouped folder list now loads all artifacts up to 1000 — matching the count. **Still the grouped-list view** (collapsible folder headers), NOT a separate folder-tree navigator — confirmed with Tom before doing.
- Version note: Viewer jumps 2.57 → **2.59** (2.58 is held by Ingestion; skipped to keep numbers unambiguous).
- Validation: `node --check` on Code.js + extracted index.html inline script. clasp push DONE — `/dev` serves v2.59. NOT browser-tested. Watch initial load time with the full set (a few hundred files = a few extra Drive metadata reads; acceptable).
- Deployment: USER redeploy `/exec` for iPad.
- Follow-up (Tom's list): #2 keep/mark-read in Artifacts (W3 — backend keep exists, UI missing); #9 dedup (D1); #3/#4 remove ExpanDrive + install rclone; Sift chain #5–7; #8 "Clear Executive Summary" (needs clarification).

### 2026-06-30 - Claude Code (ExpanDrive/Wisdomware-sync session — NO code change; decisions + backlog)
- Request: mount Google Drive via ExpanDrive (moltoboto) so the Wisdomware vault can reach the Drive folder Refinery reads; troubleshoot; document.
- Files touched: BACKLOG.md (new item W3: mark-read in Artifacts). No Viewer/Ingestion code.
- Actions / decisions:
  - ExpanDrive connected as `moltoboto@gmail.com` (verified) after an earlier wrong-account (`tc11228`) setup; full reversible reset done (config/cache/Group Container → `~/Desktop/ExpanDrive_reset_backup`). Mount = File Provider Location at `~/Library/CloudStorage/ExpanDrive/` (NOT a disk — expected). Reading Drive works.
  - **Bulk write via rsync FAILED** — File Provider error `-2005` (cannotSynchronize) on every create, retries stopped, folder red-badged. NOT a permission issue (moltoboto, `read-only:0`). Cause: rsync temp-file+rename+xattr incompatible with File Provider `createItem`.
  - **DECISION:** ExpanDrive is for READING Drive only → **remove it entirely tomorrow.** Bulk vault→Drive push to use **rclone** (direct API) or drag-drop. Sync = one-way mirror, **vault = source of truth**; clear the reading queue via **mark-read, not delete** (a mirror re-copies destination-only deletes); permanent purges at the vault.
  - Interim: staged filtered md/html at `~/Desktop/Wisdomware_for_Drive/` (181 md + 3 html) for Tom to move + read tonight.
- Validation: n/a (no code).
- Follow-up (tomorrow): remove ExpanDrive; build the vault→Drive rclone one-way mirror; implement **W3 mark-read in Artifacts**. Tom testing Ingestion v2.58 (mail→`[01] Inbox`) tonight.

### 2026-06-30 - Claude Code (Ingestion v2.58 — mail artifacts land in "[01] Inbox" subfolder)
- Request: "make email pull move to [01] Inbox".
- Files: Ingestion/Code.js (`saveCompleteEmailArtifact_` + new `getOrCreateInboxFolder_`; version line).
- Actions: `saveCompleteEmailArtifact_` (used by BOTH the newsletter and inbox-email tiers) now writes the `.html` artifact into a **`[01] Inbox`** subfolder of the artifacts root (`COMPLETE_NEWSLETTER_FOLDER_ID` = `1eO6n6…` = the same folder the Viewer reads) instead of the root. `getOrCreateInboxFolder_` finds/creates `[01] Inbox`. Pairs with Viewer v2.57's recursion, so mail now shows under an `[01] Inbox` group in the tree.
- Safety: any failure resolving/creating the subfolder **falls back to the root folder** (current behaviour), so ingestion can't break over this; and a total save failure was already non-fatal (caller logs + continues; the Supabase `content_html` row still saves).
- Validation: `node --check` OK. clasp push Ingestion DONE (push-only; triggers pick it up next run). NOT run-tested — verifies on the next nightly ingest (or a manual `runDailyIngestion`).
- Note: maintenance fns (`rebuildEmailArtifacts`/`fixArtifactDatesFromGmail`/`saveAllEmailsAsArtifacts`) still scan root only — out of scope, not changed. Existing root-level artifacts stay put.
- Follow-up: after the next run, confirm new mail appears under `[01] Inbox` in the Artifacts tree.

### 2026-06-30 - Claude Code (Viewer v2.57 — Artifacts folder tree: subfolder recursion + collapsible groups)
- Request: "add the tree" — surface Drive subfolders (Inbox + topic folders) in the Artifacts tab; today only root-level files show.
- Files: Viewer/Code.js (`getArtifacts` → recursive `collectArtifacts_`; `buildArtifactRecord_` gains `folderPath`), Viewer/index.html (`artifactCardsHtml` groups by folder + `toggleArtifactFolder` + `.artifact-folder` CSS), version strings.
- Actions:
  - **Backend recursion:** `getArtifacts` now walks the folder tree (`collectArtifacts_`, depth ≤8, ≤3000 files, skips dot-folders like `.obsidian`/`.smart-env`/`._PDF_Archive`). Each artifact carries `folderPath` (relative to root). Previously `folder.getFiles()` saw ONLY root-level files — anything in a subfolder (e.g. `Inbox/`) was invisible. **This is what makes Inbox + topic folders readable.**
  - **Frontend tree:** the Artifacts list groups into collapsible folder sections by `folderPath` (root files under "Files", then subfolders A–Z; tap header to collapse). Card markup unchanged → select/highlight/nav/delete still work. If everything is at root (current state), renders FLAT with no folder chrome — zero visible change until subfolders exist.
- Validation: `node --check` on Code.js + extracted index.html inline script. clasp push DONE — `/dev` serves v2.57. NOT browser-tested; Drive recursion can't be unit-tested without Drive. Isolated to the Artifacts view (articles untouched).
- Deployment: USER redeploy `/exec` for iPad. Note: bootstrap artifact limit is still 50 (`getViewerBootstrap`) — if the tree should show more than the 50 newest files across all folders, raise `ARTIFACT_LIMIT` later.
- Follow-up: pairs with email→`[01] Inbox` routing (next) + the Wisdomware sync. Once subfolders land in Drive, the tree lights up.

### 2026-06-30 - Claude Code (Viewer v2.56 — Markdown front-matter + tables; VERIFIED vs real files)
- Request: User reported v2.55 rendered all `.md` files well EXCEPT `2026_Why_Most_Enterprise_AI_Programs_Fail` and `2026_Playwright_MCP`.
- Diagnosis: both are Obsidian "clippings" — found the originals locally in `[100] Wisdomware/[03] AI/...`. Two converter gaps: (1) **YAML front matter** (`--- title:/source:/tags: ---`) rendered as a stray `<hr>` + raw metadata text; (2) **Markdown tables** (Playwright's Quick Reference + Usage tables) rendered as literal `| … |` pipe lines. Enterprise file = front matter only (no tables); Playwright = both.
- Files touched: Viewer/Code.js (`markdownToHtml_` — front-matter strip + table parsing + `.md-table` CSS; version line + display strings), Viewer/index.html (display strings).
- Actions:
  - **Front-matter strip:** `markdownToHtml_` now drops a leading `^﻿?---\n … \n---\n` block before parsing.
  - **Tables:** a `|pipe|` header row followed by a `|---|` separator becomes `<table class="md-table">` (thead/tbody, cells run through inline()); added `splitRow_`/`isTableSep_` helpers + a table-row case to `isSpecial` so paragraphs don't swallow tables. `.md-table` CSS (collapsed borders, header shading).
- Validation: `node --check` OK. **Verified by running the live `markdownToHtml_` (loaded from Code.js via a node VM) against BOTH real files** — front matter no longer leaks, no stray `---`, Playwright's 2 tables render (0 leftover pipe rows), Enterprise renders clean. clasp push Viewer DONE — `/dev` serves v2.56.
- Deployment: USER redeploy `/exec` for iPad. Known minor: a clipping that prints an image caption line repeats the alt text (source artifact, not the converter); degenerate single-cell tables with inline ``` fences render imperfectly (rare).
- Follow-up: none required — re-open the two files to confirm. Optional future: nested lists, `[[wikilinks]]`.

### 2026-06-30 - Claude Code (Viewer v2.55 — Markdown artifacts render formatted; NOT yet verified)
- Request: Autonomous session ("do whatever doesn't need my permission"). W1 increment: make `.md` summaries read like articles instead of raw source.
- Files touched: Viewer/Code.js (`markdownToHtml_` added; `getArtifactContent` branch; `buildArtifactHtmlDocument_` CSS; version line + display strings), Viewer/index.html (display strings).
- Actions:
  - Added **`markdownToHtml_`** — a compact, dependency-free Markdown→HTML converter (Apps Script has no md lib). Handles headings, bold/italic, inline + fenced code, links/images, ordered/unordered lists, blockquotes, hr, paragraphs. **Security:** all raw text is HTML-escaped first; only generated tags are re-introduced, so a `<script>` in a note can't inject (verified — renders as escaped text).
  - **`getArtifactContent`:** `text/plain` artifacts whose name ends in `.md`/`.markdown` (or mime `text/markdown`) now render via `markdownToHtml_`; other plain text (`.txt`/`.csv`/`.log`/`.json`) still renders verbatim in `<pre>`. Newsletter `text/html` path unchanged.
  - Added `.md-body` reading CSS to `buildArtifactHtmlDocument_` (max-width column, heading/list/quote/code styling).
  - Bug caught + fixed during a node unit-test: HTML-escaping turns `>`→`&gt;` before block parsing, so blockquotes were detected as paragraphs. Blockquote regexes now match `&gt;`.
- Validation: `node --check` passes on Code.js. Converter **unit-tested in node** on a sample (headings/bold/italic/code/links/lists/blockquote/hr/script-escaping/code-fence) — output correct. clasp push Viewer DONE — `/dev` serves v2.55. **NOT browser-tested, and NO `.md` artifact exists in Drive yet** — verification deferred until Wisdomware content is synced in (ExpanDrive/rclone/CCC).
- Deployment: USER must redeploy `/exec` for the iPad. **Blast radius is zero for current content** — only `.md`/`.markdown` files take the new path, and there are none live; newsletters are unaffected.
- Follow-up: once a `.md` is in the Drive folder, open it in Artifacts and confirm it renders formatted (headings/bold/lists), not raw `#`/`**`. Optional later: render `.md` inline (no iframe) so swipe works on it too (arrows already work via v2.54).

### 2026-06-30 - Claude Code (Viewer v2.54 — Artifacts ←/→ nav + delete-advances; macOS clasp rootDir fix)
- Request: Incremental build — one version per change. First increment of W1: fix the two Artifacts bugs that are verifiable on existing content — "trapped" (no swipe in Artifacts) and "delete jumps to the first file".
- Files touched: Viewer/index.html (`renderArtifactShell` actions + `deleteArtifact`), Viewer/Code.js (version line), Viewer/.clasp.json (rootDir).
- Actions:
  - **←/→ nav arrows:** added two tap buttons to `.artifact-viewer-actions` wired to `navigate(±1)` (which already cycles `ARTIFACTS` via N/P). They sit in the parent header, OUTSIDE the artifact iframe, so they work on iPad where a finger-swipe over the iframe can't be captured. Desktop gets click-nav too.
  - **delete advances:** `deleteArtifact` now captures the deleted item's index and re-selects the neighbour at that index (clamped to the new list end) before `showArtifactsView`, instead of letting `selectedArtifact=null` fall back to `ARTIFACTS[0]`.
  - **clasp rootDir fix:** Viewer/.clasp.json `rootDir` `""` → `"."`. Empty rootDir threw `ENOENT scandir ''` on macOS — this was the first Mac clasp push; `""` had only ever run on the Lenovo (Windows). `"."` works on both. Ingestion/.clasp.json likely needs the same fix when next pushed (left untouched — not testing it now).
- Validation: `node --check` passes on Code.js and the extracted index.html inline script. clasp push Viewer DONE — `/dev` serves v2.54. NOT browser-tested.
- Deployment: USER must redeploy `/exec` (Deploy → Manage deployments → pencil → New version → Deploy) for the iPad.
- Follow-up: USER verify — (a) ←/→ arrows cycle files in Artifacts; (b) deleting a middle file lands on the next file, not the first. Next increment: v2.55 inline render of `.md`/`.html` (needs Wisdomware content in Drive to verify).

### 2026-06-29 - Claude Code (Design session — Wisdomware→Refinery sync architecture; NO code change)
- Request: Tom briefed a multi-tool operating model (Refinery reads · Drive stores · Obsidian thinks · NotebookLM analyzes · Todoist executes) and the goal of reading Obsidian "Wisdomware" summaries in Refinery at night on iOS. Design + scope only — "build tomorrow, no hours now."
- Files touched: `BACKLOG.md` (added High-value D1 + S1, plus the Wisdomware inline-render build row). **No Viewer/Ingestion code touched.** This commit also lands previously-uncommitted 2026-06-19 Mac-setup doc work (see housekeeping note).
- Decisions locked:
  - **Sync = rclone on the Mac** (no Google Drive desktop; API-based) mirrors local Wisdomware → Google Drive. Syncthing rejected (P2P, can't reach Drive without a bridge). The Drive→Refinery hop is free — Ingestion Apps Script reads Drive in-cloud.
  - **3-bucket storage model:** `Wisdomware/` (Drive) = reading layer = `Inbox/` (mail ingestion) + filed `*.md` summaries; `Archive/` = source PDFs; Videos = link-only, never uploaded. Single top-level folder named **Wisdomware** — rename the existing "Refinery Artifacts" Drive folder (ID `1eO6n6MQKF7_cCwulGxhDkzrxT772M-Iz`) to keep its ID. Mail ingestion → `Wisdomware/Inbox/`.
  - **Sync scope:** rclone takes ONLY `*.md` + `*.html`. PDFs are auto-moved by the filer LLM into `._PDF_Archive` (excluded for free).
  - **Viewer build (next session, ~1–2 hrs):** Root cause of "trapped in Artifacts" found — artifacts render inside an `<iframe>`, so a finger-swipe can't be captured (deliberate skip in `initSwipeNav`/`activePane`, index.html ~line 2275); `navigate(±1)` ALREADY branches for `artView` (N/P already cycle artifacts). FIX = render `.md` + clean `.html` INLINE (no iframe) so they inherit the article swipe/N-P/mark-read flow; decide inline-vs-iframe BY CONTENT (full `<html>` doc → iframe; markdown/fragment → inline); `Inbox` newsletters keep the iframe. Rejected adding a separate reader app (tool sprawl). Also wanted: delete advances to next (not first article) + real delete via `DriveApp` write-back.
- Validation: none — design only, no code changed.
- Follow-up: confirm the inline/iframe split, then implement (Viewer inline render + swipe → rclone config → Inbox routing). Braindump in `[100] Wisdomware/[102] Open Brain/2026_Refinery_{Tech,Weq}.md`; Open Brain + Todoist updated.
- Housekeeping: this commit also lands the 2026-06-19 Mac-setup changes left uncommitted in the tree — path conversions `C:\Users\ThomasCala\Refinery` → `~/Refinery` across CONTEXT/README/HANDOFF_PROMPT/HOW_THIS_WORKS/MAC_REFINERY_SETUP + the `refinery-sop` SKILL, and the new cross-platform `ship.sh`. Reviewed: doc/path-only + the bash ship helper; no secrets.

### 2026-06-12 - Claude Code (Viewer v2.53 — Gemini model 404, real 3-state Focus, Artifacts search)
- Request: User reported (via a read-only side-session fork that couldn't push) three bugs: Summarize 404'd, Focus was only 2 states (asked for 3→2→1), and search didn't work in the Artifacts tab. Fixed all three from the main session.
- (1) **Gemini 404**: `gemini-2.0-flash` was retired ("no longer available"). Verified via web search that `gemini-2.5-flash` is also removed and **`gemini-3.5-flash`** is the current GA flash model; set `GEMINI_MODEL = 'gemini-3.5-flash'`. (Can't call Gemini from here — user smoke-test confirms.)
- (2) **Focus 3-state cycle** (was binary — the actual bug): replaced the `focus-mode` boolean pref + `toggleFocus` with `cycleFocus`/`applyFocusLevel_` + `refinery.focusLevel` (0/1/2). CSS now `body.focus-nav` (hide nav) and `body.focus-list` (also hide `.list-pane` + `.artifact-list`). Chip onclick → `cycleFocus()`; applied at startup. Removed old focus-mode CSS/pref.
- (3) **Artifacts search**: the article path (`applyFilters` + `runServerSearch`) bails on `artView`, so artifact search did nothing. `handleSearchInput` + `clearSearch` now branch to `filterArtifactList()` when `artView`; `showArtifactsView` renders cards into `#artifactCards` via `artifactCardsHtml(filteredArtifacts_())`, filtered by name/source/subject/name/type, with a live sub-count.
- Validation: `node --check` passes on Code.js + the index.html inline script; no orphan `toggleFocus`/`focus-mode` refs. NOT browser-tested.
- Deployment: clasp push Viewer DONE (18:42 ET); `/dev` serves v2.53. `/exec` + iPad need the redeploy.
- USER CHECKLIST: (a) **Summarize** now works (gemini-3.5-flash); (b) **Focus** chip cycles 3 states; (c) **search in Artifacts** filters the list; (d) redeploy `/exec` for iPad.

### 2026-06-12 - Claude Code (Viewer v2.52 — Focus/artifact-list, artifact header alignment, full-history search)
- Request: User said "finish everything, I'll do my action when I get back" — autonomous batch with my stated defaults.
- (1) **Focus** (`body.focus-mode`) now also hides `.artifact-list`, so the Artifacts view collapses like the Articles view. One CSS line.
- (2) **Artifact header** now mirrors the article reading header: `SOURCE · DATE` eyebrow (`.artifact-viewer-eyebrow`) + clean title using `subject` (no "source - " prefix). `buildArtifactRecord_` exposes `source`/`subject` from the artifact meta; non-email files fall back to typeLabel/displayTitle.
- (3) **Full-history search**: new server `searchArticles(q, limit)` — PostgREST `or=(title.ilike.*q*,summary.ilike.*q*,source.ilike.*q*)` with the term URL-encoded (so spaces/commas/parens can't break the filter), via `fetchLimitedArticlesByQuery_`. Client `handleSearchInput` now debounces (400ms) a `runServerSearch` that merges new matches into ARTICLES (dedupe by id) and re-runs applyFilters. Additive + best-effort: a server failure is swallowed and loaded-set search still works, so search can't regress.
- Validation: `node --check` passes on Code.js + the index.html inline script. **NOT live-tested.** Risk is isolated: the PostgREST `or()` query is the one unproven bit; if it's malformed, full-history search silently no-ops and loaded-set search is unaffected.
- Deployment: clasp push Viewer DONE (15:21 ET); `/dev` serves v2.52. `/exec` + iPad need the redeploy.
- Git: committing now.
- USER CHECKLIST when back: (a) **redeploy `/exec`** (pencil → New version → Deploy) for iPad; (b) **smoke-test Summarize** (Gemini); (c) try **search** for an older/read article to confirm full-history works; (d) check the **artifact header** + **Focus in Artifacts**.
- Deferred (untouched, need decisions): Compact-on-artifacts; the bigger Ingestion items (title-key divergence, constant-subject false-dedup, `doPost` auth/security). Permission allow-list for unattended runs not set (user didn't confirm).

### 2026-06-12 - Claude Code (Viewer v2.50–2.51 — artifact header rework + in-app LLM Summarize via Gemini)
- Request: User stepped away and asked me to "do everything" autonomously — finish the email-artifact header (#3) and wire the in-app Summarize feature to a real LLM, styled like their separate "article-executive-summary" Claude skill but rendered inline (no PDF). Confirmed `GEMINI_API_KEY` is set in Script Properties (underscores). They have Claude Pro / ChatGPT Plus / Gemini Advanced — none grant API access; the free path is a Google AI Studio Gemini key, which they created.
- v2.50 (#3 header): `sanitizeArtifactHtml_` (Viewer/Code.js) strips the baked-in `<header class="header">…</header>` wrapper from saved email artifacts at render — removes EMAIL eyebrow + duplicate title + source/date + "Open in Gmail" + the scroll-away duplicate. Fixes existing artifacts too; the Viewer's fixed header remains.
- v2.51 (Summarize): pulled the look-and-feel from the user's skill zip (Downloads/executive summary skill.zip → SKILL.md + final_example) = Core Message / Why It Matters / Key Takeaways / Bottom Line, consulting-card style. New server fn `generateExecutiveSummary(payload)` reads `GEMINI_API_KEY` from Script Properties (never in code/client), POSTs to Gemini `generateContent` (`GEMINI_MODEL='gemini-2.0-flash'`, JSON responseSchema), returns a structured summary. `summarizeVisible()` now calls it via google.script.run (loader → render), replacing the copy-paste prompt; `renderExecSummaryHtml()` + `.exec-*` CSS render the skill look inline (no PDF). Mark-all-read reordered before render so applyFilters can't clobber it.
- Security: Gemini key only in Script Properties, call is server-side, browser never sees it. (Contrast: Supabase anon key is still hardcoded — separate deferred item.)
- Validation: `node --check` passes on Code.js + the index.html inline script; `safeJsonParse_` confirmed present. **NOT live-tested** — I can't invoke the deployed Apps Script with the key from here. **User must smoke-test Summarize** (pick a view → Summarize): expect a loader then the styled exec summary. If it errors, the message shows the Gemini HTTP code; most likely fixes are the model name (`GEMINI_MODEL` constant) or the free-tier model choice.
- Deployment: clasp push Viewer DONE (12:28 ET); `/dev` serves v2.51. `/exec` + iPad need the redeploy (still pending, batched).
- Git: committing v2.50 + v2.51 now (per "push everything").
- Open: search (still needs the user's symptom answer: nothing-happens vs misses-older); #4 Focus 3-state vs the artifact-list one-liner; artifact-vs-article header style alignment; Compact-on-artifacts. Plus deferred Ingestion items (title-key, constant-subject, doPost auth).

### 2026-06-12 - Claude Code (Viewer v2.49 — email artifacts respect Aa sizing)
- Request: While testing v2.48 the user reported Aa sizing (and Compact) "not working on the laptop" and "introduced in 2.48". Investigation: the git diff showed v2.48 did NOT touch the font-size or compact-density CSS/JS, and the inline script parses clean — so it was not a code regression. Root cause: those toggles only style the NATIVE article view (`.reading-body`, `.card`, etc.); the user was viewing an EMAIL ARTIFACT, which renders in a style-isolated `<iframe>` (`artifactHtmlFrame`, srcdoc, since v2.43), so Aa/Compact never reached it. User chose to "make the artifacts respect sizing."
- Fix (Viewer/index.html): `artifactZoomFactor_()` maps the Aa level (0/1/2 → 1.0 / 1.15 / 1.3) to a CSS `zoom`; applied to the artifact document on `frame.onload` in `renderArtifactLocal`, and `applyArtifactZoomToOpenFrame_()` is called from `cycleFontSize` to live-update an already-open artifact. `zoom` scales the email's px-based HTML proportionally (Safari/iOS + Chrome). Whole-email proportional zoom by design — reliable text-only scaling isn't possible for arbitrary email HTML. Version → v2.49 (3 strings in index.html + Code.js header/setTitle).
- Scope note: only the artifact-render path + the Aa handler changed. Did NOT extend Compact to artifacts (user asked for sizing only). Native articles already respected Aa.
- Validation: `node --check` on the extracted inline script passes. clasp push DONE (11:29 ET) — `/dev` serves it now. User to confirm on the CIO email artifact: open it, tap Aa, whole email scales.
- Deployment: clasp push Viewer done; `/exec` + iPad need the redeploy (still pending, batched with v2.48).
- Follow-up: still-open v2.48 punch-list items — #2 Compact-on-artifacts (not requested yet), #3 email-artifact header rework (drop "Open in Gmail", fixed non-scrolling single-line header "Email · <source> · <date>", remove "CIO US Leader" redundancy), #4 Focus as a 3-state cycle (all → no-nav → no-nav-no-list). **Git: v2.48 + v2.57 + v2.49 committed and pushed to origin/main this session (2026-06-12).** Remaining deploy: Viewer `/exec` redeploy for the iPad (pencil → New version → Deploy); Ingestion needs none. Punch-list #2/#3/#4 deferred to a future session.

### 2026-06-12 - Claude Code (Ingestion v2.57 — dedup + Supabase-intake robustness, from Fable audit)
- Request: User asked Fable to review two areas — deduping and Supabase intake. Two parallel Fable (claude-fable-5) audits of Ingestion/Code.js ran; both INDEPENDENTLY surfaced the same #1 blocker (strong signal). User chose the "blocker + safe robustness" fix scope (no policy changes).
- Verified before fixing: `warmDedupCache_` (was line 2515) used `order=date_added.asc&limit=500` → cache held the OLDEST 500 rows of the 30-day window; and when the cache is warm, `reviewDuplicateRecord_` skips the cold-path direct exact URL/title DB checks (`!cacheWarm` gates). So once daily volume pushed the window past 500 rows, recently-ingested articles were absent from the maps and a re-presented recent item (the "TOR mark-read failed → returns next run" case the code comments warn about) re-inserted as a duplicate. Confirmed real in the source.
- Fixes applied (Ingestion/Code.js, all tagged v2.57):
  1. **Cache ordering** → `order=date_added.desc` in `warmDedupCache_` AND the standalone fuzzy fallback (`findPossibleDuplicateCandidate_`). Added a cheap `select=url,title` map extended to a wider newest-first window (`CONFIG.DEDUPE_REVIEW.MAX_EXACT_KEYS=3000`) so exact dedup covers far more than the fuzzy feature cap (which stays at MAX_CANDIDATES=500 for speed).
  2. **HTTP status validation** — `warmDedupCache_` now throws (→ cold fallback) on non-200 or non-array body; the cold-path exact URL/title/reddit fetches return `{error:'temporary'|'permanent'}` on non-200 instead of parsing an error body as "no duplicate" (which silently disabled dedup).
  3. **Transient classification by status** — new `isTransientHttpStatus_` (429/408/5xx); `insertToSupabase` flags transient by response code (was matching exception text, which never matched since muteHttpExceptions suppresses throws). TOR loop now breaks on `insertResult.transient`; both Gmail tiers abort the phase on a transient error (items stay unread → retry).
  4. **NaN publish-date fallback** in `mapTORArticleBasic_` — a missing `article.published` made `pubDate.toISOString()` throw, counting the article as an error and never marking it read → it re-errored every run. Falls back to `new Date()`.
  5. **Gmail per-message try/catch isolation** (processNewsletterTier + processInboxTier) so one throwing message can't abort the rest of the Gmail phase (previously propagated to `ingestGmailTwoTier`'s catch and killed all remaining tier-1 threads + all of tier 2).
- Validation: `node --check` passes (verifies the tier-2 try/catch brace balance). Real validation = watch the NEXT scheduled ingestion run's execution log: "DEDUP CACHE: warmed with N fuzzy candidates" line, no new errors, duplicatesSkipped sane.
- Deployment: `clasp push` Ingestion DONE (11:06 ET). No redeploy needed — time triggers pick up new code on the next run (CONTEXT.md:102).
- ⚠️ Interaction to watch: fuller exact-title coverage slightly raises the chance a generic/constant newsletter subject ("Markets Daily", "The Download") collides with an older issue and is hard-skipped as a title duplicate — this is the DEFERRED #6/#7 (title-key divergence + constant-subject false-dedup). Not introduced here (constant-subject titles were already in the map), but worth watching now that coverage is complete.
- Follow-up (deferred, need user decisions): (a) title-key divergence — `sanitizeText` turns curly quotes into spaces while `normalizeTitleForDedupe` deletes them, so DB-built title keys don't match raw Gmail-subject lookups; (b) constant-subject newsletter false-dedup (consider: email records dedup on URL only, or a min-token-count gate for title-only hard dups); (c) dedup candidate set excludes `kept` and windows by publish (not ingest) date; (d) audit-trail / retention `return=representation` payload bloat; (e) **Viewer `doPost` is an unauthenticated 3rd write path** with no dedup/sanitization + anon key has table write access (security). Committed + pushed to origin/main 2026-06-12 (see v2.49 entry).

### 2026-06-12 - Claude Code (Viewer v2.48 — horizontal swipe nav + single Focus toggle; expedited session-start)
- Request: Reviewing the v2.44–2.47 scroll-through work, the user reported two iPad issues: (1) scrolling up to the previous article occasionally (~1 in 5–10) flashed a blank screen, and on a long article it took 3–5 scroll flicks to navigate — they suggested a horizontal swipe instead ("Right is Next, Left is back, like a linear timeline"); (2) the hide/reveal section icons (NAV/LIST/READER chips) felt clumsy. Separately: our dev-session *startup* (worktree determination + reading state) was taking ~10 minutes; expedite it using the audit trail.
- Root cause (nav): the v2.44 gesture armed only at the vertical scroll *edges* (`scrollTop<=4` / bottom) and used passive listeners, so (a) long articles had to be scrolled fully to an edge first, and (b) the iOS rubber-band overscroll couldn't be cancelled — `navigate()` swapping content mid-bounce exposed the empty area behind the pane (the intermittent blank flash).
- Fix (Viewer/index.html):
  - **Swipe nav** — replaced `initScrollThroughNav` with `initSwipeNav`: tracks touchstart→touchend, fires `navigate()` only when net horizontal travel ≥60px AND dominates vertical by ×1.3 (so vertical scroll is never hijacked). Per user: **swipe right = next (`navigate(1)`), swipe left = previous (`navigate(-1)`)**. Still touch-only; N/P unchanged. Removed `#scrollNavHint` element + CSS.
  - **Focus toggle** — replaced the NAV/LIST/READER chips with one **Focus** chip (`toggleFocus` / `body.focus-mode`) that hides the left nav + middle list so the reading pane (the right viewer the user lives in) goes full-screen; tap again to restore. Removed dead `nav-iconic`/`list-hidden`/`no-reading-pane` CSS, `LAYOUT_PREFS_` entries, and `toggleIconNav`/`toggleList`/`toggleReading`. Old localStorage keys are simply ignored. Updated kb-bar `P` label (P marks read too since v2.47).
  - Version → v2.48 (3 strings in index.html + header/setTitle in Code.js).
- Separately — **refinery skill expedited start**: Step 2 batched into one git command (~2s); Step 3 now reads ONLY the top of AUDIT_TRAIL.md at startup and defers README/CONTEXT to on-demand. This is the fix for the ~10-minute session start.
- Files touched: Viewer/index.html, Viewer/Code.js, CONTEXT.md (version + changelog), AUDIT_TRAIL.md, and `~/.claude/skills/refinery/SKILL.md` (outside the repo).
- Deployment: `clasp push` Viewer DONE (10:19 ET) — the Apps Script `/dev` URL serves v2.48 now. **`/exec` + iPad need the redeploy** (pencil → New version → Deploy).
- Validation: PENDING user test. Fast path: open the `/dev` URL on the laptop (signed into the owner Google account) → test the **Focus** chip + **N/P** keys. The **swipe** is touch-only — confirm on the iPad (or a touchscreen laptop). Check: swipe right advances, swipe left goes back, no blank flash, vertical scrolling still works normally; Focus hides nav+list and restores.
- Review (Fable 5, on user request): no blockers; the swipe + Focus design, direction, thresholds, focus-mode escape hatch, and removed-identifier cleanup all verified sound. Applied 4 fixes from it and re-pushed (10:32 ET): (1) **touchend now reads `e.changedTouches[0]`** instead of the last touchmove — a fast iOS flick emits few/no touchmove events, so the old code could under-measure dx and silently drop a real swipe (the highest-value fix, directly affects the gesture being tested); (2) **`overHorizontalScroller` guard** in touchstart — a sideways drag on a wide code block / layout table (overflow-x:auto) no longer also fires navigate() and marks the article read; (3) **text-selection guard** — a non-collapsed selection at touchend skips navigation (no accidental mark-read-and-jump mid-copy); (4) **touchcancel** handler resets `tracking`. Did NOT change swipe direction — user explicitly chose right=next. Deferred nits: localStorage migration for old layout keys (users land in default 3-pane, must tap Focus once — clean reset, acceptable), and opening the first article on a swipe when focus-mode loads with nothing selected.
- Follow-up: not yet committed/pushed to git — hold until the user confirms it works, then commit + redeploy `/exec`. If swipe threshold feels off (too sensitive / not enough), tune `THRESHOLD` (60px) / `RATIO` (1.3) in `initSwipeNav`. If swipes ever feel ignored, suspect the text-selection guard or a lingering selection. Committed + pushed to origin/main 2026-06-12; Viewer `/exec` redeploy still needed for iPad.

### 2026-06-11 - Claude Code (Viewer v2.47 — standard-RSS mark-read; fix v2.46 "no difference")
- Request: "Yes, I want standard RSS reader behavior." User reported that after v2.46 there was "no difference read or unread" in the Viewer — everything looked the same (grey). Also asked: if I hit P, does the (read) article still show?
- Root cause: v2.46 landed on the target article with `selectArticle(id, true)` — marking the article you're VIEWING read on arrival. Combined with the outgoing-mark, navigating quickly turned every touched article read/grey, erasing the read/unread distinction.
- Fix (Viewer/index.html `navigate()`): Land with `selectArticle(id, false)` again so the article in the reading pane stays unread (clear current/unread distinction). Keep marking the article you LEAVE read in both directions. Boundary case (`nextIdx` past either end) now returns early — no move, no mark. Read items stay greyed in the list this session via the existing `PRESERVED_READ_IDS` (so P navigates back to a just-read article — answer to the user's question: yes, it still shows), and clear on refresh for a clean unread queue.
- Behavior summary: current article = unread (shown in pane); articles you've moved past = read/grey but still in the list this session; P returns to them; unread count drops as you read; refresh leaves only unread. Standard RSS feel.
- Note for future: the read/unread visual cues are `.card.read { opacity:0.6 }` + normal-weight title + no unread dot (unread cards get a 5px `.unread-indicator`). If the user still finds read vs unread too subtle on iPad, strengthen these (stronger dim, keep/restore the unread dot prominence) rather than touching the mark logic again.
- Files touched: Viewer/index.html (`navigate()` + 3 version strings), Viewer/Code.js (header + setTitle), CONTEXT.md (version line + changelog), AUDIT_TRAIL.md.
- Deployment: clasp push Viewer + **Apps Script redeploy REQUIRED**.
- Validation: Pending user test. Check: reading pane shows current as unread; pressing N greys the one you left and the unread count drops; P returns to the greyed article; refresh leaves a clean unread list.

### 2026-06-11 - Claude Code (Viewer v2.46 — fix navigate() mark-read for N/P and scroll-through)
- Request: "I have the same issue with N/P — if I'm in the view window and press N or P, while it cycles back and forth it does not mark the articles read." Confirmed not gesture-specific; it's the shared `navigate()` engine.
- Root cause (Viewer/index.html `navigate()`): (1) the mark-read block was gated behind `if (dir > 0)`, so **P (previous) never marked anything**; (2) navigation landed on the target article with `selectArticle(id, false)`, so the article **currently shown in the reading pane was never marked read** — only the one you left, and only when going forward. Clicking a card uses `autoMarkRead=true` (marks on open), hence the inconsistency the user felt. My earlier v2.45 recommendation to "keep mark-on-leave" was the wrong call — that behavior was the actual problem.
- Fix: Mark the outgoing article read in **both** directions (removed the `dir > 0` gate). Land with `selectArticle(targetId, true)` so the article now in view is marked read (consistent with click). Dropped the `if (nextIdx === idx) return;` early-out so that at either end the current article is still re-selected and marked (covers the last/first article). Recompute idx via `selectedId` after the re-filter, with an `idx === -1` guard.
- Net behavior: every article you view via N/P or the iPad scroll-through gesture is marked read (and persisted via `serverMarkRead`). This is intentionally aggressive marking — matches the user's expectation that navigating = reading.
- Files touched: Viewer/index.html (`navigate()` + 3 version strings), Viewer/Code.js (header + setTitle), CONTEXT.md (version line + changelog), AUDIT_TRAIL.md.
- Deployment: clasp push Viewer + **Apps Script redeploy REQUIRED**.
- Validation: Pending user test on iPad + desktop. Check: pressing N and P both dim the article and drop the unread count; the article in the reading pane shows as read; reload confirms server persistence.
- Follow-up: If "mark everything I pass" turns out too aggressive (e.g. skipping past unwanted articles marks them read), consider a dwell timer or marking only on dwell. kb-bar label still says "N Next / mark read" — could update "P" label to note it now marks too.

### 2026-06-11 - Claude Code (Viewer v2.45 — scroll-through gesture made touch-only)
- Request: Testing v2.44 on the desktop, the wheel-driven scroll-through fired too easily ("if I scroll down it changes") and the article left behind didn't reliably show as read. Decision (user-approved): make the gesture iPad/touch-only and keep "mark read on leave".
- Root cause: The v2.44 desktop `wheel` handler treated the reading pane as "at bottom" whenever content fit the viewport (short articles → `scrollHeight <= clientHeight`), so the very first scroll-down started accumulating toward an advance. That eager advancing on desktop is also what made mark-read look broken. The shared `navigate(1)` engine already marks the outgoing article read correctly; the touch path was never the problem.
- Fix (Viewer/index.html): Removed the `wheel` event listener, its `wheelAccum`/`wheelCooldown`/`wheelTimer` state, `WHEEL_TRIGGER`, and the `startCooldown()` helper from `initScrollThroughNav()`. Touchstart/touchmove/touchend (the iPad gesture) and the hint pill are unchanged. Desktop returns to plain scrolling + N/P keyboard nav. Updated the module's header comment to document the v2.45 removal.
- Files touched: Viewer/index.html (wheel removal + 3 version strings), Viewer/Code.js (header + setTitle version), CONTEXT.md (Current Version line + changelog row), AUDIT_TRAIL.md, BACKLOG.md (added stackbrief.tech reference URL to item 2b).
- Deployment: clasp push Viewer + **Apps Script redeploy REQUIRED** (Deploy → Manage deployments → pencil → New version → Deploy).
- Validation: Pending iPad Safari test. On desktop, confirm scrolling no longer changes articles and N/P still work. On iPad, confirm swipe-advance still works AND the article you leave is marked read (it should — `navigate(1)` handles it).
- Follow-up: If the left-behind article still isn't marked read on iPad after this, it's a real bug in `navigate()`'s `idx === -1` early-return branch (the one dir>0 path that skips mark-read) — investigate then. TRIGGER (72px) still first-pass; tune to taste.

### 2026-06-11 - Claude Code (Viewer v2.44 — scroll-through article navigation for iPad)
- Request: When the menu bar and article list are hidden for clean reading (focus mode) on the iPad, the article is readable but there's no easy way to move to the next article. User wanted the "index back and forth with standard scrolling" feel of another reader app.
- Root cause / context: Article navigation already exists as `navigate(dir)` (index.html), driven only by the N/P **keyboard** shortcuts. iPad has no keyboard, and once the list pane is hidden there's no on-screen trigger — so the reader is a dead end. The reading pane (`.reading-pane`) is the scroll container (`overflow-y:auto`); `html,body` are `overflow:hidden`, so there is no native iOS pull-to-refresh to fight.
- Fix (Viewer/index.html):
  - NEW self-contained `initScrollThroughNav()` IIFE (inserted just above `navigate()`). Touch handlers on `document` (survive the `#mainArea` innerHTML re-renders) detect the reading pane's edges: at the BOTTOM, an upward drag past ~72px fires `navigate(1)` (next + auto-mark-read); at the TOP, a downward drag past ~72px fires `navigate(-1)` (previous). Overscroll is anchored at the moment the edge is reached, so reaching the bottom in one long swipe doesn't prematurely jump. Short-article case (both edges at once) decided by drag direction.
  - Reuses the existing `navigate(±1)` engine untouched — `navBusy` guard + mark-on-advance inherited. `activePane()` skips artifact view (iframe) and returns null when nothing is open.
  - Added a trackpad/mouse `wheel` handler (accumulate past edge → advance, 650ms cooldown) so the gesture is also usable/testable on desktop.
  - Transient hint pill `#scrollNavHint` ("Keep pulling for next ↑ / previous ↓") fades in with overscroll progress; CSS added. `.reading-pane` got `overscroll-behavior-y: contain`.
- Files touched: Viewer/index.html (feature + 3 version strings), Viewer/Code.js (header + setTitle version), CONTEXT.md (Current Version line + changelog row; also corrected stale Ingestion v2.55→v2.56 on the version line), AUDIT_TRAIL.md.
- Deployment: clasp push Viewer + **Apps Script redeploy REQUIRED** (Deploy → Manage deployments → pencil → New version → Deploy) — pushed code is not live until redeployed.
- Validation: Pending on-device iPad Safari test by user. Thresholds (TRIGGER 72px / WHEEL_TRIGGER 380 / cooldown 650ms) are first-pass and may need tuning to match the desired feel.
- Follow-up:
  - User to test on iPad and report feel; tune `TRIGGER` / hint wording if needed.
  - Possible future polish: haptic-style snap or a progress arc instead of the text pill; optional setting to disable if it interferes with text selection.

### 2026-06-11 - Claude Code (session start — GitHub TLS fix, worktree cleanup, skill hardening)
- Request: "Review the audit trail and make sure we are on the correct Refinery version" before making changes; then "I need a clean way to do this — this has happened the last three times." (Recurring start-of-session friction: wrong version / worktree / can't sync.)
- Context / root cause: (1) `git fetch`/`push` to GitHub failed with `CRYPT_E_NO_REVOCATION_CHECK`, then `self-signed certificate in certificate chain` — this machine is behind a corporate TLS-inspection proxy whose root CA git wasn't trusting. (2) The session was running inside a `…\.claude\worktrees\…` copy; investigation found NO config creates worktrees — the **Claude Code desktop app creates one for every session automatically** (no toggle). User uses the desktop app only (not the CLI), so every Refinery session will be a worktree.
- What changed:
  - **GitHub sync fixed (permanent):** set globally `http.sslBackend=schannel` + `http.schannelCheckRevoke=false` (use the Windows cert store, skip the unreachable revocation server). Confirmed local `main` == `origin/main` at `c04afcd` at the time.
  - **Worktree cleanup:** removed the stale `festive-mirzakhani-7f5603` worktree (no uncommitted work; ancestor of HEAD). The current session's worktree can't be removed until the session closes; operated against the canonical folder `C:\Users\ThomasCala\Refinery` via absolute paths throughout.
  - **Skill hardening (global `refinery` skill):** documented the one-time cert `git config`, put the working flags in the freshness-check `fetch` command, and recorded the desktop-app-always-creates-a-worktree reality with the "work against the canonical folder via absolute paths; don't suggest the CLI" operating rule. Wrote two memory files (desktop-worktree mode; reads-on-iPad).
  - Version sanity at session start: Ingestion v2.56, Viewer v2.43 — correct, on `main`.
- Files touched: none in this repo (machine-level `git config`; `C:\Users\ThomasCala\.claude\skills\refinery\SKILL.md` and memory files are outside the repo). Worktree removal is a git operation, not a file edit.
- Status: done. Cert fix is permanent for all repos on this machine.
- Follow-up: stale `priceless-lovelace-UNSAVED.patch` + untracked `dedup_examples.xlsx` still sitting in the canonical folder (audit notes the patch is safe to delete). The four Viewer changes that followed this session (v2.44→v2.47) are logged in their own entries above.

### 2026-06-04 - Claude Code (Ingestion v2.56 — dedup recall + eval harness)
- Request: The current version is still allowing duplicates through; improve the dedup service. Ship the cheap, tested wins now (Option 1) without a multi-day project.
- Root cause / context: Built a Node eval harness (`tools/dedup-eval/`) that loads the REAL dedup functions out of `Code.js` in a sandbox and replays the 117 labeled groups in `dedup_articles.xlsx`. v2.55 title-only baseline: 76.1% pair recall, 87.8% fully-caught groups. Key finding — the fuzzy candidate cache (`INGESTION_DEDUP_CACHE_`) is warmed once per run and never updated, so two cross-outlet versions of the same story arriving in ONE batch (neither yet in Supabase) could never be fuzzy-matched against each other. That is the production leak.
- Fix (Ingestion/Code.js):
  - NEW `addToFuzzyDedupCache_(record)` — appends each just-inserted article (with precomputed simhash/token/noun/verb features, matching `warmDedupCache_`) to `INGESTION_DEDUP_CACHE_`. Wired into both insert sites (TOR ~line 519, Gmail ~line 880), right after the existing `addToFastDedupCache_` exact-map update.
  - `dedupeTokens_` rewritten to preserve model/version identifiers and 2-3 digit figures (Opus 4.8, M3, 27B, $80B, 70%) instead of stripping all numbers/short tokens.
  - `findExactDuplicateCandidate_` — identical normalized title is now a duplicate regardless of source (removed the source gate; warm-cache title map was already source-agnostic, so this only closes the cold-path + Reddit fallback dead zone).
- Files touched: Ingestion/Code.js, CONTEXT.md (changelog), AUDIT_TRAIL.md, HOW_THIS_WORKS.md (version stamp), .gitignore, tools/dedup-eval/* (new harness), dedup_articles.xlsx (labeled eval set committed for reproducibility).
- Validation: `node --check Ingestion/Code.js` passes. Harness title-only recall 76.1%→77.4%, fully-caught groups 87.8%→88.7%, cross-group FPs 137→139. Intra-batch fix proven via `test-intrabatch.js` (same-run near-dup NONE→0.71, routed to Duplicate review) — the group harness can't measure it because it compares every pair directly.
- Deployment: clasp push Ingestion (push-only; runs on time triggers, picked up next run). No Apps Script redeploy needed.
- Follow-up:
  - PRECISION: 139 cross-group false positives are dominated by one YouTube channel (Megyn Kelly) where the channel name counts as 2 shared entities and trips the `sharedNouns>=3` tier at 0.66. Recommend discounting the source/channel name from proper-noun overlap. ~1-2 hrs, harness-measurable.
  - TIER 3 (real recall lever): semantic cross-source dups (9-outlet Nvidia RTX Spark cluster) are unreachable by title-only lexical matching. Add an embedding per article (embedding API via UrlFetchApp) + Supabase pgvector cosine similarity fused into scoring. ~2-4 focused days; embedding cost negligible (~$0.00002/article).
  - The `priceless-lovelace-UNSAVED.patch` (stale-branch dedup work) is now fully superseded by v2.55/v2.56 — safe to delete.

### 2026-05-23 - Claude Cowork (path canonicalization + ship.ps1 version-stamping hook)
- Request: Close the three open follow-ups from the recovery session earlier today (path drift in docs, multi-account workflow, ship.ps1 version-stamping). Also: confirm whether any README was removed.
- README check: nothing was removed. The repo has only ever had one README file, at `design/claude-design-v3/design_handoff_refinery_ipad/README.md`. `git log --all --diff-filter=D --name-only` shows no README has ever been deleted in this repo's history. There has never been a top-level README.md.
- Canonical path decision: working folder moves OUT of OneDrive to **`C:\Users\ThomasCala\Refinery\`** — restores the original design documented in `CONTEXT.md` line 114 ("All working docs consolidated to `C:\Users\ThomasCala\Refinery\` previously split across OneDrive\Refinery and two separate clasp folders"). Drivers: OneDrive sync caused the 2026-05-23 morning blank-out; OneDrive paths contain `[03]` brackets that PowerShell `Set-Location` treats as wildcards, breaking copy-pastable doc commands; the docs already standardize on the simpler path everywhere.
- Doc reverts (`HOW_THIS_WORKS.md`, `HANDOFF_PROMPT.md`): rolled back the OneDrive path references I'd written earlier in the session. Path is now `C:\Users\ThomasCala\Refinery\` in:
  - "Where Everything Lives" tree block
  - Sync-reliability note (now explicitly warns against putting working folder in OneDrive)
  - "Starting fresh with Claude Code" step
  - clasp push examples
  - Best Practices "two sources of truth" list
  - Health-check #1 ("verify the local folder still has content")
  - Recovery playbook (now uses `git clone … C:\Users\ThomasCala\Refinery`)
- Ground-truth correction: discovered my earlier "line 1 of Code.js is ground truth" claim was wrong for Ingestion. Ingestion uses a JSDoc block with version on **line 4** (` * Version: 2.55`); Viewer uses a one-line header on **line 1** (`// REFINERY - … - Viewer v2.43`). Both files have different conventions and both are now documented correctly in `HOW_THIS_WORKS.md` (End of Session Checklist, Current Versions footer, Best Practices "two sources of truth") and `HANDOFF_PROMPT.md` (SESSION HEALTH CHECK block + paste-block step 0). Health-check commands updated from `head -1 Ingestion/Code.js` to `sed -n '4p' Ingestion/Code.js`.
- `ship.ps1` version-stamping hook added: between clasp push and git commit, reads both Code.js version markers and rewrites the `| App | version | date |` columns in the Current Versions table of `HOW_THIS_WORKS.md`. Leaves the "What changed" description column untouched (that still requires judgment). If parsing fails for either file, prints a warning and skips the stamp rather than committing bad data. Smoke-tested via Python regex against the actual files: correctly extracts `v2.55` and `v2.43`, would rewrite the table dates from 2026-05-20 to today. The hook closes the doc-drift gap that previously let `HOW_THIS_WORKS.md` lag the code by 40+ versions.
- Multi-account follow-up: NOT addressed in this session. Punted until the path migration is complete — once the canonical folder is `C:\Users\ThomasCala\Refinery\` and GitHub is the source of truth, both personal and work Claude accounts can clone the same repo to their respective local paths and ride `main`. Will doc this in a future session.
- New file: top-level `README.md` written for the GitHub repo front page — elevator-pitch length (what Refinery is, two-app structure, current versions, repo layout, working-copy locations, getting-started pointer to HANDOFF_PROMPT, shipping workflow). Complements `HOW_THIS_WORKS.md` (deep) and avoids duplication. Notes the OneDrive history and the canonical-path move.
- Files touched: HOW_THIS_WORKS.md, HANDOFF_PROMPT.md, ship.ps1, README.md (new), AUDIT_TRAIL.md. No code changes — Ingestion v2.55 and Viewer v2.43 unchanged.
- Deployment: none (docs + tooling only). No clasp push, no Apps Script redeploy.
- Versions: unchanged. Ingestion v2.55, Viewer v2.43.
- Follow-up: User to execute the migration from PowerShell — re-clone GitHub fresh to `C:\Users\ThomasCala\Refinery\`, repoint the Claude Code project at the new path, then delete the OneDrive `PKB\RefineryV2` folder. Commands provided in chat. Once migration is complete: open a new Claude session in the new folder and run the health check from `HANDOFF_PROMPT.md` to verify everything is wired correctly.

### 2026-05-23 - Claude Cowork (doc + recovery: RefineryV2 restored from GitHub after OneDrive blank-out)
- Request: User reported the Refinery project loaded in Claude Code with the title but blank contents. Wanted to recover from one of three copies (local OneDrive, Google Drive, GitHub).
- Root cause / context: The OneDrive working folder at `C:\Users\ThomasCala\OneDrive - NewAmsterdam Pharma B.V\NewAmsterdam Pharma\[03] AI\PKB\RefineryV2` had its file contents silently emptied — only the two folder shells (`Ingestion/` and `Viewer/`) remained, both 0 bytes. Almost certainly a OneDrive sync collision (or possibly Files-On-Demand purging local copies). The Claude project was correctly pointed at this folder; there was just nothing in it to display.
- Diagnostic findings:
  - OneDrive folder: empty (32 files expected, 0 present).
  - GitHub `moltoboto/Refinery`: full project, last commit `0ebb461` "Viewer v2.43: revert artifact rendering to iframe", dated 2026-05-20. Source of truth confirmed.
  - Google Drive folder (per HOW_THIS_WORKS.md): supplementary email-artifact HTMLs only, gitignored, not needed for code restore.
- Fix(es):
  - Fresh-cloned `moltoboto/Refinery` from GitHub and copied entire repo (including `.git`) into the OneDrive RefineryV2 folder. 32 files restored, 23 MB, git on `main` at `0ebb461`.
  - Updated `HOW_THIS_WORKS.md`: corrected stale version refs (was claiming Ingestion v2.12 / Viewer v2.8 — actuals are v2.55 / v2.43), updated the working-folder path to match OneDrive reality, added a **Best Practices & Auto-Backup** section codifying the 3-5x-per-session push rhythm, the "line 1 of Code.js is ground truth" rule, and the recovery playbook used today.
  - Updated `HANDOFF_PROMPT.md`: added a **SESSION HEALTH CHECK** block at the top (verifies folder isn't blank, key files exist, line-1 versions present, git in sync with origin/main), plus woven into the paste-block as step 0 with instruction to re-run 3-5x per session.
- Files touched: HOW_THIS_WORKS.md, HANDOFF_PROMPT.md, AUDIT_TRAIL.md. No code changes — `Ingestion/Code.js` and `Viewer/Code.js` are byte-identical to GitHub.
- Deployment: none. Documentation + recovery only; no clasp push, no Apps Script redeploy required.
- Versions: unchanged. Ingestion v2.55, Viewer v2.43 confirmed as current.
- Follow-up / open questions:
  - **Path drift between docs and reality:** `HANDOFF_PROMPT.md` and `CONTEXT.md` (likely) reference `C:\Users\ThomasCala\Refinery\` as the working folder. The actual working folder is the OneDrive path above. Either move to the documented path (and delete OneDrive) or update all docs to point at the OneDrive path. Pending Thomas's call.
  - **Multi-account use (Pro + Team):** Thomas wanted to use the same project from two Claude accounts. Plan: clone the same GitHub repo to a non-OneDrive folder on the personal account; both accounts ride `main`. Not implemented this session.
  - **`HOW_THIS_WORKS.md` lagged code by 40+ versions.** Worth a `ship.ps1` step that rewrites the version line by scraping `head -1` of each `Code.js` so docs can't drift this far again.

### 2026-05-20 - Claude Code (Viewer v2.43 — revert v2.40 artifact render approach)
- Request: User feedback after testing — artifacts in the v2.40-42 rendering look uglier than the original. Our article-html CSS (Lora typography, accent-colored underlined links, inline-color neutralization, table border tweaks) fights newsletter designs that were deliberately styled for email. Substack newsletters lose their intentional visual hierarchy. Performance is a secondary concern (the Drive round-trip is acceptable for the use case); readability/fidelity to original design is the priority.
- Fix: reverted `renderArtifactLocal` HTML branch to the pre-v2.40 iframe approach. Sets `srcdoc` on a sandboxed iframe (`<iframe class="artifact-viewer-frame" sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin">`). Newsletter designs render in isolation, looking the way their authors intended.
- Removed the orphan `.artifact-viewer-body` CSS block (no longer referenced).
- Retained changes: v2.40's HTML type-icon removal from the artifact list (visual cleanup, no downside). v2.42's lazy-load image rewrite in `renderArticleHtml_` (still benefits content_html articles).
- Files touched: Viewer/index.html (renderArtifactLocal HTML branch + CSS removal + version), Viewer/Code.js (version), CONTEXT.md, AUDIT_TRAIL.md.
- Deployment: clasp push + Apps Script redeploy required.
- **Open back-of-mind:** if you want the best of both worlds in the future, the path is iframe-based but inject a `<style>` tag at the top of srcdoc with selected article-html rules (Lora body font, accent links) WITHOUT the inline-color neutralization. That preserves Substack's intentional design while applying a thin Refinery layer. Not pursued in this session — current iframe approach is acceptable.

### 2026-05-20 - Claude Code (Viewer v2.42 — perf hotfix: lazy-load images)
- Request: User reported artifact opening is slow after v2.40-41 switch from iframe to direct DOM injection.
- Root cause: iframes parse + load in an isolated browsing context. When we switched to direct DOM injection, every newsletter's images (typically 10-30 from Substack CDN) started fetching in parallel on the main thread the moment innerHTML was set. The HTML parse itself is fast (<100ms for 100KB) but the cascade of HTTP requests + image decoding + layout shifts blocks the perceived render.
- Fix: `renderArticleHtml_` now rewrites every img tag to include `loading="lazy" decoding="async"`. Only images that scroll into view fetch initially; the rest defer until the user scrolls down. The `decoding="async"` hint tells the browser to decode images off the main thread.
- Same benefit applies to content_html articles too — `renderArticleHtml_` is the shared sanitizer.
- Files touched: Viewer/index.html (one regex addition in renderArticleHtml_), Viewer/Code.js (version), CONTEXT.md, AUDIT_TRAIL.md.
- Deployment: clasp push + Apps Script redeploy.
- If still slow after this lands, fallback is reverting to iframe approach but injecting our article-html CSS into the srcdoc — both worlds.

### 2026-05-20 - Claude Code (Viewer v2.41 — hotfix v2.40 artifact zero-height bug)
- Request: User reported artifacts not rendering after v2.40 ("not getting the full article").
- Root cause: in v2.40 I replaced the artifact iframe with a `<div class="artifact-viewer-body reading-body article-html">`. The parent `.artifact-viewer` is `display:flex; flex-direction:column; overflow:hidden`. The iframe had `flex:1` from the existing `.artifact-viewer-frame` CSS, so it filled the pane and scrolled internally. My new div had NO size rules at all — collapsed to zero height in the column flex. Content was injected but invisible.
- Fix: added `.artifact-viewer-body { flex:1; overflow-y:auto; overflow-x:hidden; padding:28px 32px 60px; background:var(--bg); width:100%; box-sizing:border-box; }`. Now the artifact body fills the available vertical space and scrolls.
- Files touched: Viewer/index.html (CSS block), Viewer/Code.js (version), CONTEXT.md, AUDIT_TRAIL.md.
- Deployment: clasp push + Apps Script redeploy required.
- Lesson: when replacing an iframe with flowing content in a flex layout, the replacement needs explicit sizing. Should have included this CSS as part of v2.40.

### 2026-05-20 - Claude Code (Viewer v2.40 — artifacts use standard reading-pane render)
- Request: When clicking an artifact, use the same render path / styling as a regular article. Keep the Drive folder. Also remove the redundant HTML type-icon from the artifact list.
- Implementation:
  - `renderArtifactLocal` HTML branch: replaced `<iframe srcdoc>` rendering with direct DOM injection into a `<div class="artifact-viewer-body reading-body article-html">`. Picks up the same `.reading-body.article-html` CSS as content_html articles — Lora typography, accent-colored underlined links, image max-width 100%, table fixes from v2.39, inline-color overrides. Defense-in-depth: passes through `renderArticleHtml_` (strips scripts/iframes/onclick, rewrites links to target=_blank).
  - PDF / image / Drive-preview artifacts unchanged — they still use their respective renderers.
  - Removed the `<div class="artifact-type-icon">${a.typeIcon}</div>` HTML pill from artifact cards in `showArtifactsView`. Every artifact is HTML; the badge added visual noise without information. Removed the now-orphan `.artifact-type-icon` CSS block.
  - Drive backup unchanged — saving and fetching behavior identical.
- Files touched: Viewer/index.html, Viewer/Code.js, CONTEXT.md, AUDIT_TRAIL.md.
- Deployment: clasp push Viewer + Apps Script redeploy required for live URL.
- Tradeoff noted: artifact HTML no longer in an isolated iframe. Substack's inline styles could theoretically leak into the surrounding Viewer chrome — v2.39's `[style*="color"]` / `[style*="background"]` neutralization should catch the common cases. If aggressive bleed appears, easiest mitigation is wrapping the artifact-viewer-body in `all: revert` or going back to a sandboxed iframe with manual CSS injection.
- Session wrap (real this time): Ingestion v2.46 → v2.55, Viewer v2.34 → v2.40.

### 2026-05-20 - Claude Code (Ingestion v2.55 + Viewer v2.39 — table CSS + content_html cap)
- Request: Session-closing bundle after diagnosing newsletter rendering issues.

- **Diagnostic conclusion from the SQL count query + rendered screenshots:**
  - Maven newsletter (59KB content_html, 7 imgs): rendered beautifully — title, body typography, Maven logo image, "Recommended for you" cards all displayed correctly. Confirms inline-rendering pipeline works end-to-end for newsletters under the cap.
  - Maria Sharapova newsletter (exactly 80000 chars — hit the cap, 19 imgs): rendered with empty bordered boxes where layout tables were. Root cause: HTML emails nest tables for layout (since 1990s); v2.37 article-html CSS gave every td/th a 1px border thinking they were data tables. Compounded by truncation cutting body mid-content.
  - 5 older Email-category rows with NULL content_html: visible only when user toggles Unread chip OFF (they have status='read' from past sessions). Not a bug.

- **Viewer v2.39:**
  - Relaxed table cell CSS in `.reading-body.article-html` scope. Default: no cell borders, padding-only. Borders only when the table has `border="1"+` attribute (a hint the email author actually wants visible borders for a data table).
  - Tables max-width: 100% instead of width: 100%, so Substack's centered narrower layout tables aren't stretched.
  - Cells use `vertical-align: top` for cleaner multi-row newsletter card layouts.

- **Ingestion v2.55:**
  - `sanitizeContentHtml_` cap raised 80,000 → 150,000 chars. Sharapova hit the old cap exactly and was getting truncated mid-tag.
  - Storage math: 150K × 3000 rolling row cap = 450MB worst case, within Supabase free tier (500MB).
  - Updated the function's comment to reflect the new ceiling.

- Versions: Ingestion v2.55 (1 place), Viewer v2.39 (5 places).
- Files touched: Ingestion/Code.js, Viewer/Code.js, Viewer/index.html, CONTEXT.md, AUDIT_TRAIL.md.
- Deployment: clasp push both apps + Apps Script redeploy for Viewer to go live.

- **Session wrap.** From this session: Viewer v2.34 → v2.39, Ingestion v2.46 → v2.55. Major themes:
  - Inline article HTML reading (v2.50, v2.51, v2.53 Tier 1 + Tier 2 newsletters)
  - Dedup hardening (v2.47 F8 Gmail cache, v2.48 Phase 1 R1-R3, v2.49 Phase 2 R4 synonyms)
  - UI overhaul (v2.34 iconized chips, v2.35 cleanup, v2.36 SVG chip icons + real category icons, v2.37 article-html CSS, v2.38 slop cleanup, v2.39 table fix)
  - Critical bugs found: v2.47 Gmail dedup gap, v2.54 Gmail URL fragment collision, v2.55 cap truncation. All resolved.
  - Backlog re-ranked by value; Phase 3 dedup deprioritized as low ROI.

### 2026-05-20 - Claude Code (session checkpoint — newsletter inline reading, open diagnostics)
- Context: end-of-session checkpoint before conversation compression. Captures what was tested today and what remains open.
- **Shipped this session (in order):**
  - v2.50 + v2.37 — full article HTML in reading pane (RSS content:encoded → content_html → inline rendering)
  - v2.51 — Option A: Tier 1 Gmail newsletters get content_html populated
  - v2.52 + v2.38 — slop cleanup (nav-icons dead path, archived field, double formatter call)
  - v2.53 — Tier 2 inbox newsletters get content_html populated (missed in v2.51)
  - v2.54 — **critical** fix: cleanUrl was stripping Gmail message-ID from URL fragment, causing all Gmail emails to share a single URL `https://mail.google.com/mail/u/0` which became a permanent dedup blocker after v2.47's cache-warm check.

- **Verification status:** v2.54 pushed but not yet confirmed working by user. Pre-v2.54 test showed:
  - Tier 1: 1 thread (The Code newsletter) — was getting blocked by URL collision
  - Tier 2: 3 threads — all blocked by URL collision
  - After v2.54: user ran again, but result was 9 unread → only 3 visible in Email category.

- **Open diagnostics (2026-05-20 EOD):**
  1. **Email count discrepancy.** User had 9 unread, only 3 appeared in Email category. Hypothesis: Tier 1 newsletters (The Code, ChatAI, Ollama, Lonely Octopus) get categorized via `detectCategory(subject)` and often land in AI / Tech / Learning instead of Email. Other 6 may be in those categories, or filtered as noise, or unread but outside `in:inbox`. Need new execution log + sidebar count check across categories to confirm.
  2. **Photos not rendering.** User reports no images in newsletter reading pane. Three possible causes: (a) `<img src="cid:...">` CID references that only work in Gmail (unfixable without MIME attachment parsing), (b) lazy-loaded images using `data-src` instead of `src`, (c) `<noscript>` blocks containing fallback `<img>` tags being stripped by `sanitizeContentHtml_`. Diagnostic pending — need user to paste the raw content_html from a recent Email row in Supabase to see what kind of img refs they are.

- **Follow-up for next session:**
  - Get a content_html sample from Supabase (the html_preview column from the SQL query in this thread).
  - If imgs are direct CDN URLs → debug browser-side rendering (CSP, image-loading errors in devtools).
  - If imgs are `cid:` references → consider extracting and uploading Gmail attachments to Drive, rewriting src to public Drive URLs. Larger feature.
  - If imgs are inside `<noscript>` → relax sanitizeContentHtml_ to preserve noscript content.
  - For the "3 of 9" question, look at category counts after a fresh run; possibly add explicit logging of which category each ingested newsletter received.

- Files touched this session: Ingestion/Code.js (v2.50-54), Viewer/Code.js + Viewer/index.html (v2.37-38), CONTEXT.md, AUDIT_TRAIL.md, BACKLOG.md.
- Deployment status: all Ingestion versions pushed via clasp. Viewer v2.38 pushed but **requires user redeploy** in Apps Script before the in-line article HTML rendering goes live at the URL.

### 2026-05-20 - Claude Code (Ingestion v2.54 — critical Gmail URL collision bug)
- Request: User tested with marked-unread newsletters; log showed "DEDUP CACHE HIT (url): https://mail.google.com/mail/u/0" for every Gmail email, skipping all of them as duplicates. Investigated.
- **Root cause (long-standing latent bug, surfaced by v2.47):**
  - `buildGmailUrl(id)` returns `https://mail.google.com/mail/u/0/#all/<message-id>` — message ID in URL fragment.
  - `cleanUrl(url)` at line 975 has `url.replace(/#.*$/, '')` — strips ALL fragments.
  - Result: every Gmail email gets stored with the same URL `https://mail.google.com/mail/u/0`. The message ID is lost.
  - **Pre-v2.47:** the cache-warm path in reviewDuplicateRecord_ explicitly skipped exact URL checks (assuming isFastExactDuplicate_ ran upstream — which it didn't on Gmail path, which was THE OTHER bug we fixed in v2.47). So the URL collision existed but never caused dedup skips at runtime.
  - **Post-v2.47:** the cache-warm path now performs the exact URL check. The FIRST Gmail email ingested after v2.47 dropped the colliding URL into DEDUP_URL_MAP_, becoming a permanent dedup blocker for every subsequent Gmail email. That's why the user's Email category has been empty since v2.47.
- Fix: `cleanUrl` now preserves the fragment for `mail.google.com` URLs. The Gmail message ID is in the fragment and IS the unique identifier — stripping it was the entire bug.
- Other URL hosts continue to have fragments stripped (correct behavior — tracking anchors, table-of-contents, etc.).
- Files touched: Ingestion/Code.js (one cleanUrl change), CONTEXT.md, AUDIT_TRAIL.md.
- Deployment: clasp push Ingestion. No schema changes.
- **Lingering data issue (not blocking):** existing Supabase rows from Gmail ingests between v2.47 and v2.54 have the broken URL `https://mail.google.com/mail/u/0`. They're indistinguishable from each other by URL but distinct by title/date_added. They'll age out via the rolling 3000-row cap. If user wants to clean them up explicitly: `DELETE FROM articles WHERE url = 'https://mail.google.com/mail/u/0';` — but this is optional.
- Verification: mark a newsletter unread in Gmail, run runGmailIngestionOnly, expect `articlesInserted: 1` in the Tier 1 or Tier 2 stats (not duplicatesSkipped).

### 2026-05-20 - Claude Code (Ingestion v2.53 — Tier 2 inbox missed in v2.51 Option A)
- Request: User checked Email category in Viewer after running ingestion — no inline content showing. Investigated.
- Root cause: v2.51 Option A only patched `processNewsletterEmail` (Tier 1, recognized newsletter senders: The Code, ChatAI, Ollama, Lonely Octopus). The second Gmail path, `processInboxTier`, was missed. Tier 2 handles everything ELSE in the inbox — including all Substack newsletters not on the recognized-senders list (Nate's Substack, Tina Huang, every individual Substack subscription, plus general inbox traffic). Tier 2 creates Email-category records but didn't set content_html, so the Viewer fell back to the short summary blurb.
- Fix: one-line addition to the Tier 2 record at line ~1185 — `content_html: htmlBody`. Same htmlBody source as Tier 1 (msg.getBody()), same sanitization pipeline via sanitizeRecord/sanitizeContentHtml_.
- Files touched: Ingestion/Code.js (one line + comment), CONTEXT.md, AUDIT_TRAIL.md
- Deployment: clasp push Ingestion. No Viewer changes. No schema changes.
- Verification: trigger `runGmailIngestionOnly` from Apps Script editor. New Email-category records should now have populated content_html. Open Email category in Viewer, click a newsletter, expect full body inline.

### 2026-05-20 - Claude Code (Viewer v2.38 + Ingestion v2.52 — slop cleanup)
- Request: After the rapid v2.34→v2.51 sprint, review for slop and clean. User approval to remove items 1 (nav-icons dead path), 2 (dormant archived field), 3 (double formatter call in enrichTORArticle_).

- **Viewer v2.38 — item 1 (hide-nav-entirely):**
  - Removed CSS rules `body.nav-icons aside { display: none }` and `body.nav-icons.no-reading-pane .list-pane {...}`. v2.36 dropped the chip that activated these; the body class was no longer ever applied.
  - Removed `toggleNav()` function — no UI callers.
  - Removed the `{ key: 'nav-icons', ... }` entry from LAYOUT_PREFS_; the storage key `refinery.iconsNav` is no longer written.
  - Refactored `toggleReading/toggleDensity/toggleIconNav/toggleList` to use a new `getLayoutPref_(key)` lookup instead of fragile array indices that shifted whenever LAYOUT_PREFS_ changed.

- **Viewer v2.38 — item 2 (dormant `archived` field):**
  - Added single-chokepoint filter in `fetchBatch_` (Code.js): `.filter(row => row && !row.archived)`. Any pre-v2.13 row with archived=true is dropped at the data layer, so no downstream JS needs to check.
  - Removed `--archived: #6b6864` CSS variable; removed `.card.archived-card { opacity: 0.5 }` rule.
  - Removed the `${a.archived ? '<span class="tag">Archived</span>' : ''}` tag from `renderArticle`.
  - Removed all `a.archived` / `article.archived` / `current.archived` / `selected.archived` guards: 14 occurrences across the article filter, card class, autoMarkRead, navigate, adjustUnreadCounters paths.
  - Removed `doArchive(id)` and `applyArchiveLocal(article)` functions entirely. `doArchive` had no UI callers since v2.13 (when soft delete switched to status='deleted'); the server-side `archiveArticle(id)` it called just sets status='read', so the local archived=true flip was pretending to do something it didn't.
  - The "archive" view-key path in `applyFilters` was removed as part of this — kept-vs-non-kept is the only remaining filter dimension.

- **Ingestion v2.52 — item 3 (double formatter call):**
  - `enrichTORArticle_` was calling `finalizeSummaryForRecord_` twice: first with empty category to produce a cleaned summary, then re-running `normalizeCategory` against that cleaned summary, then calling the formatter again with the determined category. But the category was already determined in `mapTORArticleBasic_` from the same inputs — and since `enrichArticleFromUrl` is disabled in v2.34+, there's no new signal to recompute against. Simplified to one formatter call using `basic.category`. Same output, half the work.

- Versions: Ingestion v2.52 (1 place), Viewer v2.38 (5 places).
- Files touched: Ingestion/Code.js, Viewer/Code.js, Viewer/index.html, CONTEXT.md, AUDIT_TRAIL.md
- Deployment: clasp push both apps + Apps Script redeploy for Viewer.
- Net lines removed: ~50 across both apps. Behavior unchanged for current users; cleanup is internal.
- Follow-up: cosmetic slop items (localStorage stale keys, CONTEXT.md gotchas drift) left intentionally — not worth a version bump.

### 2026-05-20 - Claude Code (Ingestion v2.51 — Option A: newsletter HTML → content_html)
- Request: Make newsletter handling consistent with the v2.50 inline-reading model. Currently full-issue newsletters only get saved to Drive and DON'T appear in the main inbox; user has to switch to artifact view (which they said they don't use). Goal: also store the email HTML body in `content_html` on a Supabase row so the newsletter shows up in normal article flow.
- Implementation:
  - Restructured `processNewsletterEmail` (~line 813): removed the early-return when `EXTRACT_NEWSLETTER_ARTICLES === false`. Replaced with an if/else that builds either a single-record array (full-issue mode) or the extracted-articles array (extraction mode).
  - In both branches, the placeholder record now includes `content_html: htmlBody` — the full email HTML, which gets sanitized via existing `sanitizeContentHtml_` in sanitizeRecord on insert.
  - Drive artifact save unchanged — durable backup remains.
  - The existing dedup + insert loop (lines 834+) is now used for ALL Gmail records, full-issue or extracted. Consistent.
- **Bonus fix:** v2.50's `sanitizeContentHtml_` had a regex containing a literal NUL byte (caused by encoding loss when I wrote `[NBSP figure-space narrow-NBSP]` — those characters got mangled to a NUL during edit). The file was being rejected by grep as binary. Patched line 1308 to use proper escaped sequences: `s.replace(/[ -]/g, '').trim()`. Strips ASCII control characters cleanly, encoding-safe.
- Files touched: Ingestion/Code.js, CONTEXT.md, AUDIT_TRAIL.md
- Deployment: clasp push Ingestion. No Viewer changes needed — v2.37 reading-pane already renders content_html.
- Follow-up: on the next Gmail ingestion run, newsletters under the recognized senders (Nate's Substack, ChatAI, etc.) will now appear in the main inbox under the Email category, with the full HTML body rendered inline when clicked. Drive archive continues to capture them for durable backup.
- Schema note: `content_html` column already exists in `articles` table (added 2026-05-19 for v2.50). No SQL needed for v2.51.

### 2026-05-19 - Claude Code (Ingestion v2.50 + Viewer v2.37 — full article in reading pane)
- Request: Backlog #1 (high value) — show full article HTML in the reading pane instead of truncated summary. Reduces (eliminates for most articles) the need to click ↗ Open original.
- Implementation strategy: **easy path only** this session. Capture `<content:encoded>` (or RSS `content`) field that most modern feeds provide. Hard path (URL fetch + extraction for paywalled feeds) deferred.

- **Supabase schema requirement (USER MUST RUN FIRST):**
  ```sql
  ALTER TABLE articles ADD COLUMN content_html TEXT;
  ```
  Until this column exists, all inserts will fail with schema error. Run in Supabase SQL editor.

- **Ingestion v2.50:**
  - `mapTORArticleBasic_` extended to prefer `article.content.content` (RSS content:encoded) over `article.summary` when present — typically the longer, full-body HTML. Falls back to summary for feeds that only provide it. Captured as `content_html` on the basic record.
  - `enrichTORArticle_` passes `content_html` through to the final record.
  - `sanitizeRecord` adds `content_html: sanitizeContentHtml_(record.content_html, 80000)`.
  - New helper `sanitizeContentHtml_(value, maxLen)`: strips `<script>`, `<style>`, `<iframe>`, `<object>`, `<embed>`, `<noscript>` blocks; strips `on*=` event attributes (onclick/onerror/etc.); neuters `javascript:` URLs in href/src; preserves structural tags (p, a, img, h1-h6, ul/ol/li, blockquote, pre/code, table, figure). 80KB cap per article — at 3000-row rolling cap that's ~240MB worst case (within Supabase free tier).
  - Gmail path untouched — newsletter cards aren't full articles.
- **Viewer v2.37:**
  - `renderArticle(a)` now checks `a.content_html` first. If present and >100 chars, renders it via new `renderArticleHtml_()` helper into a `.reading-body.article-html` div. If absent or short, falls back to existing `formatSummaryHtml(a.summary)` path.
  - `renderArticleHtml_()`: defense-in-depth sanitization (same patterns as Ingestion's helper, in case anything slipped through or old records bypassed sanitize); rewrites every `<a>` to `target="_blank" rel="noopener noreferrer"`.
  - New CSS scope `.reading-body.article-html` styles: serif (Lora) headings 17–22px; accent-color underlined links; images max-width 100% centered with rounded corners; bordered tables; orange-bordered blockquote; monospace pre/code on surface background; horizontal rules. `[style*="color"]` and `[style*="background"]` overrides neutralize inline colors so external article styles don't fight our cream/orange palette.
  - "Read full article" button label changed to "Open original" since you're already reading the full article in-app.

- Backward compatibility: articles ingested BEFORE v2.50 don't have `content_html`. They'll render with the existing summary path (the fallback). New articles ingested after v2.50 will progressively populate. No backfill needed; old articles age out via the rolling 3000-cap.

- Versions: Ingestion v2.50 (1 place), Viewer v2.37 (5 places: Code.js header + setTitle, index.html title + 2 logos).
- Files touched: Ingestion/Code.js, Viewer/Code.js, Viewer/index.html, CONTEXT.md, AUDIT_TRAIL.md
- Deployment: clasp push both. Viewer needs Apps Script redeploy.
- **CRITICAL deployment order: 1) Run the SQL, 2) Then clasp push. If you push before the schema is updated, Ingestion will start failing inserts.**
- Follow-up: watch a Substack or Hodinkee article in the Viewer — should show full body with images. For Motley Fool / Seeking Alpha (paywalled), content_html will be the same teaser as summary — no regression, no win.

### 2026-05-19 - Claude Code (docs — backlog re-ranked by value, Phase 3 deprioritized)
- Request: User directive — work by value-add, not order of discovery. Phase 3 dedup work analyzed as marginal/risky; demote.
- Changes to BACKLOG.md:
  - Restructured sections from "Active / Held / Deferred / Horizon" to "High value / Medium / Low / Deferred / Horizon" — explicit value ranking.
  - **High value (do first):** #1 Full article in reading pane, #3a iPad trapped fix, #2 GitHub Models Summarize.
  - **Medium:** #7 verify dedup work in production, #10 ongoing dedup diagnostic, #3 iPad gutter tuning.
  - **Low (deprioritized):** #13 Dedup Phase 3 — only Tier 1 bigram boost + Tier 4 weak-tier remain after v2.48-49 already shipped Tier 2 + 3. Analysis: won't move test scorecard, high FP risk on Tier 4 (Apple+announce / Apple+launch type matches). Hold until v2.49 production FP rate is known.
  - **Done — recent:** prune to last 5 entries, including all v2.47-49 dedup work and v2.35-36 Viewer cleanup.
- Files touched: BACKLOG.md, AUDIT_TRAIL.md
- Deployment: docs only.

### 2026-05-19 - Claude Code (Ingestion v2.49 — Dedup Phase 2: R4 synonym groups)
- Request: Ship Phase 2 dedup work (R4 from design/dedup-requirements.md) — topic-synonym groups so different word choices for the same event still cluster.
- Implementation:
  - **Extended `VERB_STEM_MAP_`** with topic nouns critical to news-domain duplicate detection: case, court, judgment, layoff, victory, defeat, deal, acquisition, merger, takeover, raid, debut, ban, block, prohibit, recruit, poach, deliver, defer, terminate, cut, triumph, loss. These were missing in v2.48 and meant the matcher couldn't see "court battle" / "case" / "verdict" as part of the lawsuit cluster.
  - **Added `SYNONYM_GROUPS_`** dictionary — maps ~50 stems into 10 canonical groups: `lawsuit` (lawsuit/trial/case/court/verdict/ruling/rule/judgment/feud/sue), `strike` (strike/attack/raid), `delay` (delay/postpone/defer), `launch` (launch/release/debut/unveil), `layoff` (fire/layoff/cut/terminate), `hire` (hire/recruit/poach), `ban` (ban/block/prohibit), `win` (win/victory/triumph), `lose` (lose/defeat/loss), `deal` (buy/acquire/deal/acquisition/merger/takeover).
  - **Modified `extractStemmedVerbs_`** to return synonym group keys instead of raw stems. So `attack`+`strike` both produce the same `strike` group key; `postpone`+`delay` both produce `delay`. No other code changes — the existing `sharedVerbs` counting in `scorePossibleDuplicateMatch_` now operates on group keys, which transparently picks up synonym matches.
- Expected test corpus impact (based on analytical walkthrough):
  - **Cluster C** (Trump Iran strike postponed) — 0/1 → 1/1. C1 stems: [delay (from postpone), strike (from attack)]. C2 stems: [delay, strike]. Shared = [delay, strike]. With 2 shared entities (trump, iran), Tier 2 branch fires.
  - **Cluster B** (Musk v. OpenAI, 6 articles) — 6/15 → ~14/15. Every pair now shares either `lose` group OR `lawsuit` group (via lawsuit/trial/case/court/verdict/ruling).
  - **Cluster D** (Musk-OpenAI second wave) — 0/1 → 1/1. D1: [lose, lawsuit]; D2: [lawsuit (from verdict and lawsuit)]. Shared = [lawsuit]. With 2 shared entities (musk, openai), Tier 2 branch fires.
  - **Cluster A** stays 1/1, **Cluster E** stays 3/3, **Cluster F** unchanged.
- False positive risk: synonym groups inherently expand match surface. Tradeoff bounded by the existing rule (need ≥2 shared entities IN ADDITION to a shared action signal). Cross-cluster guard pairs in the test corpus should still NOT match — verify after deploy.
- v2.49 bump in Ingestion/Code.js header (1 place).
- Files touched: Ingestion/Code.js, CONTEXT.md, AUDIT_TRAIL.md
- Deployment: clasp push Ingestion. User reruns `runDedupCorpusTest` and reports new scorecard.
- Follow-up: if FP rate is acceptable, Phase 3 (R5 full tiered scoring with 4 tiers) is next. If FPs appear, tighten the Tier 2 branch (e.g. require both shared entities to be high-specificity, not generic).

### 2026-05-19 - Claude Code (Viewer v2.36 — chip overhaul + real category icons)
- Request: User feedback on v2.34 iconized header: (1) category letters (N/A/F/L/T/W/Y/R/E/D) in the iconized nav rail aren't as good as real icons. (2) Chips have functional overlap — two chips act on the nav (hide-entirely + iconize); keep only the collapse-to-icons one. (3) Reorder chips to match column position: NAV/LIST/READER.
- Changes:
  - **Removed the "hide nav entirely" chip** (☰ → toggleNav). Kept the iconize-to-rail version, retitled it to NAV. The hide-entirely body class (`body.nav-icons`) and function (`toggleNav()`) remain in code but unreachable from UI — preserves backward compatibility without exposing the redundant control.
  - **Reordered chips by column position:** Unread → NAV (left col) → LIST (middle col) → READER (right col) → Compact → Aa → Refresh. Was: 8 chips in mixed order. Now: 7 chips in logical order.
  - **Replaced all chip emoji with inline SVG icons** pulled from the Claude Design v3 package (design/claude-design-v3/refinery/icons.jsx). Each chip got a descriptive title tooltip explaining what it does on hover/iPad long-press.
  - **Replaced category letter glyphs with real SVG icons**: new `catIcoSvg_(key)` helper returns inline SVG for each of the 10 categories. Newspaper (News), node-graph (AI), bars+trendline (Finance), graduation cap (Learning), microchip (Tech), watch face (Watches), play triangle (YouTube), Reddit head (Reddit), envelope (Email), overlapping squares (Duplicate). 18px monoline, currentColor, matches the Lora/DM Sans visual language.
  - **CSS:** added `.chip svg` and `.nav-icon svg` vertical-align rules so icons sit cleanly in their containers.
  - **`Aa` chip kept as text** — the cycle indicator ("Aa" / "Aa+" / "Aa++") relies on textContent and converting to SVG would lose the level indicator. Exception by design.
  - Source nav-icon kept as first-letter (user only flagged categories; per-source SVG isn't feasible at 50+ sources).
- v2.36 bumped in 5 places.
- Files touched: Viewer/Code.js, Viewer/index.html, CONTEXT.md, AUDIT_TRAIL.md
- Deployment: clasp push + Apps Script redeploy required.

### 2026-05-19 - Claude Code (Ingestion v2.48 — Dedup Phase 1: R1+R2+R3 + minimal R5 Tier 2)
- Request: Ship Phase 1 dedup improvements per design/dedup-requirements.md based on v2.47 baseline scorecard (2/5 clusters fully pass, B partial at 40%, C+D fail).
- Implementation:
  - **R1 — Apostrophe normalization** in `extractProperNouns_`: pre-tokenize step strips `'s` and `s'` suffixes. `Pratt's` → `Pratt`, `Musk's` → `Musk`, `students'` → `students`. All single-quote variants unified first.
  - **R2 — Multi-word entity bigrams** in `extractProperNouns_`: when two consecutive tokens in the original input both pass the strong-entity filter (capitalized, 3+ chars, not stopwords), emit a third compound entity. `Sam Altman` → emits `sam`, `altman`, AND `sam-altman`. Same for `Mark Halperin`, `Bel Air`, `Middle East`, `Harvey Levin`, etc. Two-pass implementation: pass 1 marks strong-token positions; pass 2 emits singletons + adjacent-position bigrams.
  - **R3 — Verb stemming**: new `VERB_STEM_MAP_` covering ~22 action-verb groups (lose/delay/postpone/rule/file/sue/win/launch/buy/sell/announce/release/cancel/acquire/fire/hire/unveil/attack/strike + legal nouns trial/lawsuit/verdict/feud). `say`/`said`/`says`/`saying` deliberately excluded — too generic, would over-cluster. New `extractStemmedVerbs_(title)` helper.
  - **Minimal R5 Tier 2 scoring branch**: when `sharedNouns >= 2 && sharedVerbs >= 1`, fire duplicate match with score 0.70 reason "N entities + verb-stem (M)". Inserted BEFORE the existing `sharedNouns >= 3` branch (which keeps score 0.66) since 2-entities-plus-verb is a stronger signal than 3 generic entities. Pre-existing simhash and token branches unchanged.
  - **Wiring**: `verbStems` added to `incoming` features in both `findPossibleDuplicateCandidate_` and the fallback path; precomputed as `row._verbStems` in `warmDedupCache_`.
- Expected test corpus improvement: Cluster B 6/15 → ~10-12/15 (B1 pairs now cluster via "elon+musk+lose"). Cluster D 0/1 → 1/1 (musk+openai+lose shared). Cluster A 1/1 stays. Cluster C 0/1 → 0/1 still (postpone vs delay isn't covered until R4 synonyms; attack vs strike same).
- v2.48 bump in Ingestion/Code.js header (1 place).
- Files touched: Ingestion/Code.js, CONTEXT.md, AUDIT_TRAIL.md
- Deployment: clasp push Ingestion.
- Follow-up: user runs `runDedupCorpusTest` and reports new scorecard. If B and D improve as expected, proceed to Phase 2 (R4 synonyms). If unexpected false positives appear in the cross-cluster guard, tighten the Tier 2 branch (e.g. require verb-stem to be "strong" action verb, not just any).

### 2026-05-19 - Claude Code (docs pass — Pending section stale, HANDOFF version count)
- Request: Fourth item of the autonomous morning list — review CONTEXT.md and HANDOFF_PROMPT.md for stale content.
- Findings:
  - CONTEXT.md "Pending (Tomorrow)" section was stale: item 1 (purge 8K articles) done by auto hard-purge in v2.46; item 2 (verify v2.35 mark-read) still nominally open but tracked in BACKLOG #7; items 3+4 (finance OPML, OPML re-import) duplicated in BACKLOG #5 and #8. Replaced the whole section with a pointer to BACKLOG.md to eliminate duplicate sources of truth.
  - CONTEXT.md "On the Horizon" section moved to BACKLOG.md Horizon section in earlier session — empty here, also collapsed into the pointer.
  - HANDOFF_PROMPT.md said "Viewer bumps version in 3 places" — wrong. PROCESS.md correctly says 5 places. Fixed to 5 and cross-referenced PROCESS.md §3.
  - HANDOFF_PROMPT.md "Today's task" template now mentions BACKLOG.md as a source.
  - Added a note about moving closed items to BACKLOG Done section as part of the standard loop.
- Files touched: CONTEXT.md, HANDOFF_PROMPT.md, AUDIT_TRAIL.md
- Deployment: docs only.

### 2026-05-19 - Claude Code (dedup analysis — Cluster E should already cluster)
- Request: Verify analytically whether Cluster E (Longines Legend Diver 59, 3 articles) should be caught by current v2.45/v2.47 dedup or whether it represents a new failure mode.
- Method: walked through `extractProperNouns_` by hand for all 3 titles. Confirmed all pairs share exactly `[longines, legend, diver]` = 3 strong entities. That hits the `sharedNouns >= 3` branch in `scorePossibleDuplicateMatch_` at line 1959 → score 0.66 → above MIN_SCORE 0.55 → match returned. Likely an earlier branch ("same event with overlapping titles", line 1950) fires first with score 0.78.
- Conclusion: Cluster E is almost certainly already being caught — 2 of 3 are in the Viewer's Duplicate review category, not the main inbox. User verification step: open Viewer Duplicate category, search "Longines", expect to find them.
- If they're NOT in Duplicate, root cause is something else (cache window, missing precompute on older articles, pre-v2.45 ingest). Re-investigate then.
- No new requirement added for Cluster E.
- Files touched: design/dedup-requirements.md, AUDIT_TRAIL.md
- Deployment: docs only.

### 2026-05-19 - Claude Code (Ingestion — dedup corpus test runner added)
- Request: Build a self-contained Apps Script function that regression-tests the dedup matcher against the ground-truth corpus from design/dedup-requirements.md.
- Implementation: New function `runDedupCorpusTest_()` at the bottom of Ingestion/Code.js (before ARTICLE_PURGE_). Embeds 5 clusters (A Spencer Pratt, B Musk-OpenAI 6-article, C Trump Iran, D Musk-OpenAI second wave, E Longines Legend Diver), 4 cross-cluster guard pairs (must NOT match), and the exact-duplicate cluster F (tested via normalizeTitleForDedupe equality rather than scorePossibleDuplicateMatch_ since the latter short-circuits on exact normalized-title match).
- For each cluster: pairwise comparison of all titles, report matched/expected count. Logs per-cluster percentage and sample misses. For guard pairs: any match is a false positive logged with score + reason. Returns a structured result object plus prints a scorecard.
- Usage: Apps Script editor → select `runDedupCorpusTest_` from function dropdown → Run. Output in the Execution log. Every future dedup change (v2.48 R1+R2+R3 → v2.51 R6+R7) regression-passes this before shipping.
- No Supabase calls, no cache warmup needed. Pure JS unit test. Adds ~130 lines, no production behavior change.
- Files touched: Ingestion/Code.js, AUDIT_TRAIL.md
- Deployment: clasp push Ingestion.

### 2026-05-19 - Claude Code (safety audit — v2.35 cleanup verified)
- Request: Verify the v2.35 resize-handle removal didn't leave dangling JS references that would error on Viewer load.
- Method: grep'd Viewer/index.html and Viewer/Code.js for every removed symbol: `applySavedListGeometry_`, `positionResizeHandles_`, `initResizeHandles_`, `resizeLeft`, `resizeRight`, `resize-handle`, `LIST_W_KEY_`, `LIST_LEFT_KEY_`, `LIST_MIN_W_`, `LIST_MAX_W_`, `--list-w-px`, `--list-left-px`.
- Findings: Only 2 stale references found, both inside a CSS comment describing the old behavior (lines 487-488 of index.html). Updated the comment to describe the current v2.32-35 layout instead. No live references anywhere — JS and CSS are clean.
- Files touched: Viewer/index.html (comment update only), AUDIT_TRAIL.md
- Deployment: comment-only change to Viewer. No version bump needed. Will roll into the next clasp push naturally; no urgent redeploy.

### 2026-05-19 - Claude Code (Ingestion v2.47 + Viewer v2.35 — F8 dedup fix + cleanup combo)
- Request: Morning working list: Priority 1 (F8 exact-dup fix on Gmail), Priority 2 (Viewer cleanup combo — resize handles + N/P artifact nav).

- **Ingestion v2.47 — F8 fix (Dedup Phase 0):**
  - Root cause confirmed: Gmail path in `processNewsletterEmail` (line 824) calls `reviewDuplicateRecord_` directly. That function explicitly SKIPS exact URL/title Supabase queries when `cacheWarm === true` (line 1707, 1730) on the assumption that `isFastExactDuplicate_` was called upstream — true for TOR (line 483), but Gmail never calls it. So exact dups bypassed all exact checks and fell through to the fuzzy matcher, which routed them to the Duplicate review category or (when fuzzy missed) into the main inbox.
  - Fix 1 — `reviewDuplicateRecord_`: replaced the cache-warm-skip branches with explicit cache-warm-check branches. When `INGESTION_DEDUP_CACHE_` is populated, the function now checks `DEDUP_URL_MAP_` and `DEDUP_TITLE_MAP_` directly and returns `{duplicate:true, reason:'exact URL match (cache)'}` or `'exact title match (cache)'`. Diagnostic Logger.log added for each hit.
  - Fix 2 — Gmail loop in `processNewsletterEmail`: on `duplicateResult.duplicate === true`, now SKIPS the insert entirely (mirrors TOR behavior). Was previously inserting into the Duplicate review category, polluting the review queue with byte-identical titles. Calls `addToFastDedupCache_` to re-affirm.
  - Fix 3 — Gmail loop: added `addToFastDedupCache_(record.url, record.title)` after every successful insert. TOR has had this since v2.36; Gmail was missing it — meant a duplicate article in a second newsletter within the same run wouldn't be caught.
  - Fix 4 — `normalizeTitleForDedupe`: added NFKC unicode normalization (catches ligatures, full-width chars, compatibility forms) plus explicit smart-quote/em-dash/en-dash/NBSP collapse to canonical forms. Defensive — most invisible-character drift was already neutralized by the existing strip-to-alphanumeric pass, but NFKC closes the few remaining edge cases.

- **Viewer v2.35 — cleanup combo:**
  - Removed resize-handle HTML divs (two `<div class="resize-handle">` blocks).
  - Removed resize-handle CSS (the position:fixed grip handles block, plus the `body.no-reading-pane .resize-handle { display: flex }` and `body.list-hidden .resize-handle { display: none !important }` rules).
  - Removed resize-handle JS (`applySavedListGeometry_`, `positionResizeHandles_`, `initResizeHandles_`, window resize listener, init calls). Also removed the `setTimeout positionResizeHandles_` call from `toggleLayoutPref_`. Total ~110 lines of JS removed.
  - Added N/P artView branch to `navigate(dir)`: walks the ARTIFACTS array via `selectArtifact(id)`. Infrastructure (ARTIFACTS list, selectedArtifact, selectArtifact) was already in place.

- Files touched: Ingestion/Code.js, Viewer/Code.js, Viewer/index.html, CONTEXT.md, AUDIT_TRAIL.md, BACKLOG.md
- Deployment: clasp push both apps. Viewer needs Apps Script redeploy.
- Closes BACKLOG #4 (resize-handle cleanup) and #9 (N/P keyboard nav in artifact view).
- Follow-up: verify on next ingestion run that no exact-title dupes appear in Duplicate review queue. Watch for "DEDUP CACHE HIT" log lines on Gmail phase — they're the smoking gun for this fix working.

### 2026-05-19 - Claude Code (docs — dedup requirements: 3 more clusters, F8 critical)
- Request: User provided 3 more dedup miss clusters (Musk-OpenAI second wave, Longines Legend Diver, exact-duplicate ChatGPT title).
- Findings:
  - **Cluster D** (Musk-OpenAI second wave): 2 shared strong entities — below 3-entity threshold; validates R5 tiered scoring.
  - **Cluster E** (Longines Legend Diver 59): 3 shared strong entities — *should* cluster under existing rule, needs verification. If not clustering, root cause to be added.
  - **Cluster F** (exact-duplicate title): byte-identical titles slipped through — this is a different failure class. Should never happen under `isFastExactDuplicate_` + `ilike`. New failure mode F8 added: invisible character drift, cache miss, same-run race on Gmail path, or normalization mismatch.
- New Phase 0 added to implementation order: fix F8 first (separate from fuzzy work). Aggressive pre-comparison normalization (NFKC, whitespace collapse, quote/dash normalization), verify `addToFastDedupCache_` is firing on Gmail path. Phase 0 = v2.47.
- All 3 new clusters added to inline test corpus.
- Files touched: design/dedup-requirements.md, AUDIT_TRAIL.md
- Deployment: docs only.

### 2026-05-18 - Claude Code (docs — dedup requirements with 3 ground-truth clusters)
- Request: User provided 3 real dedup misses from production. Asked for a requirement doc the ingestion can be built against.
- Findings: 3 root-cause failure modes documented (F1–F7): apostrophe handling, multi-word entities lost in tokenization, no verb stemming, no topic-synonym recognition, 3-shared-entity threshold too strict when 2 strong entities + verb + topic word are present.
- Fix: New `design/dedup-requirements.md` with: 7 numbered requirements (R1–R7) covering token normalization, multi-word entity bigrams, verb stemming, topic synonym dictionary, tiered scoring (4 tiers instead of binary), time-window tightening for weak signals. Test corpus inline (3 clusters, 10 titles total). Implementation order spans v2.47–v2.50. Subsumes prior backlog #10 and #11 (Phase 1 Levenshtein and Phase 2 reason codes), which were guesses; this is data-driven.
- Files touched: design/dedup-requirements.md (new), BACKLOG.md, AUDIT_TRAIL.md
- Deployment: docs only.

### 2026-05-18 - Claude Code (docs — v3.0 design package received, held for iPad test)
- Request: User ran the design brief through Claude Design and shared the resulting package (Refinery.zip). Asked for complexity assessment.
- Findings: Major visual overhaul, not a tweak. Package includes 1024-line styles.css (drop-in mostly unchanged), 65-line icons.jsx (11 chip icons + 10 category SVGs), README with detailed Apps Script implementation notes. v3.0 introduces: new brand cell, mono subtitle, tri-state nav (full/icons/hidden), tri-state focus (normal/list-only/reading-only), reading progress bars on cards, author bylines with avatars, sticky article toolbar, drop-cap first paragraph, IBM Plex Mono for counts, bottom keyboard-hint footer, Today/Read-later filters.
- Backend gaps identified: schema needs author, image_url, read_later, read_progress columns; ingestion needs to extract `<author>` and first image URL from RSS.
- Estimated effort: Phase 1 visual ~3 sessions (15–20 hrs); Phase 2 backend ~1–2 sessions. Phase 3 (Kept view, mobile patterns, multi-tag) deferred.
- Decision: hold v3.0 until v2.34 is tested on iPad. Logged as BACKLOG #H2, marked H1 done.
- Files touched: design/claude-design-v3/ (unzipped package), BACKLOG.md, AUDIT_TRAIL.md
- Deployment: docs only.

### 2026-05-18 - Claude Code (Viewer v2.34 — iconized header + ICON + LIST chips)
- Request: Rework menuing to minimize space with icons; add a toggle to iconize the nav (vs hide it entirely); add a toggle to hide the list pane (focus mode); make iconized nav butt up to list pane.
- Implementation:
  - Header chips replaced with Unicode/emoji icons: ● Unread / ☰ Hide nav / ◫ Iconize nav / 📖 Reading / 📋 List / ▤ Compact / Aa / ↻. All chips keep `title=` attribute so iPad voice-over and desktop hover tooltips still surface the full label.
  - New body class `nav-iconic` (CSS: aside 60px, hide labels/counts/section headers, center nav-items). Distinct from the existing `nav-icons` class which still means "hide entirely" — preserves v2.21 semantics and any saved localStorage prefs.
  - New body class `list-hidden` (CSS: .list-pane display:none). When combined with `no-reading-pane` you get a blank middle — user-recoverable by untoggling.
  - Populated `.nav-icon` glyphs: CATEGORIES emoji slots filled with single-letter glyphs (N/A/F/L/T/W/Y/R/E/D); source nav uses first letter of the source name uppercased. `.nav-icon` CSS visibility scoped to `body.nav-iconic` so full-nav mode still hides them.
  - LAYOUT_PREFS_ extended with two new entries (nav-iconic, list-hidden); toggleIconNav() and toggleList() functions added. localStorage keys: refinery.navIconic, refinery.listHidden.
  - Butt-up against list pane: flex layout handles it automatically since aside collapses to 60px and the list-pane is the next flex child.
- Version bumped to v2.34 in 5 places (Viewer/Code.js header + setTitle, Viewer/index.html title + 2 logos).
- Files touched: Viewer/index.html, Viewer/Code.js, CONTEXT.md, AUDIT_TRAIL.md, BACKLOG.md
- Deployment: clasp push DONE. Apps Script redeploy required (pencil → New version → Deploy).
- Closes BACKLOG #3b (focus mode) and #3c (iconized nav). Open follow-ups (deferred): icon style refinement after iPad testing (consider SVG over Unicode), Claude Design review (H1).

### 2026-05-18 - Claude Code (docs — design brief for Claude Design)
- Request: User wants a self-contained brief they can paste into Claude.ai later for a design review of the iPad header + iconized nav redesign. Deferred until after v2.34 ships and is tested on iPad.
- Fix: Created `design/ipad-header-redesign-brief.md` — covers project context, current state, goals, constraints (Apps Script single-file + iPad iframe + no external libs), 6 specific design questions, scope-exclusions, and expected deliverables. Added to BACKLOG.md as deferred item H1.
- Files touched: design/ipad-header-redesign-brief.md (new), BACKLOG.md, AUDIT_TRAIL.md
- Deployment: docs only.

### 2026-05-18 - Claude Code (docs — backlog 3a clarified)
- Request: User confirmed the "trapped" behavior is specifically: Windows opens a new window (fine), iPad replaces the current screen (bad). Diagnosis added to backlog 3a so future session has the root cause locked in.
- Root cause: Apps Script serves the Viewer iframe-sandboxed; iPad Safari treats `target="_blank"` from inside an iframe as in-place navigation rather than spawning a new tab.
- Files touched: BACKLOG.md, AUDIT_TRAIL.md
- Deployment: docs only.

### 2026-05-18 - Claude Code (docs — backlog: N/P in artifact view)
- Request: User wants N/P keyboard navigation in the artifact reading view, matching the existing N/P nav in the article list pane.
- Findings: N/P keyboard handler already exists at Viewer/index.html line ~2132, dispatches to `navigate(dir)`. That function explicitly bails when `artView === true` at line ~2162. ARTIFACTS array, selectedArtifact variable, and selectArtifact(id) function all exist — only the branch in navigate() is missing.
- Logged as backlog #9, ~20 min when picked up. Not done in this session per user request.
- Files touched: BACKLOG.md, AUDIT_TRAIL.md
- Deployment: docs only.

### 2026-05-18 - Claude Code (docs — backlog: clarify 3c, mark #6 done)
- Request: User pointed out backlog entry 3c was framed as zoom-only but the same fix solves the regular NAV toggle UX (today it just hides the sidebar entirely instead of collapsing to icons). Also #6 (applySourceCategoryBackfill) completed by user.
- Fix: Rewrote 3c to call out both cases (toggle UX + zoom) explicitly. Removed #6 from Active, added to Done.
- Files touched: BACKLOG.md, AUDIT_TRAIL.md
- Deployment: docs only.

### 2026-05-18 - Claude Code (docs — backlog additions from iPad 11" testing)
- Request: User tested v2.33 on 11" iPad; logged four issues to capture before context fades.
- Findings (now in BACKLOG.md Active section):
  - Right gutter (280px) felt wrong on 11" — needs 12.9" comparison and likely viewport-relative sizing.
  - "Trapped" when tapping the per-card ↗ open-original link — no clear path back to Refinery from the article. Likely Apps Script iframe sandbox interaction with `target="_blank"`.
  - No current toggle yields a focus mode (reading pane only). Reading + Nav are independent — there's no "both off" state that keeps the reader.
  - Pinch-zoom on iPad pushes the fixed top bar and chips off-screen. Proposed fix: resurrect `body.nav-icons` mode (deprecated in v2.21 because .nav-icon spans were empty), populate with real glyphs/SVG, butt against list pane so nav stays accessible at any zoom level.
- Files touched: BACKLOG.md, AUDIT_TRAIL.md
- Deployment: docs only — no clasp push, no version bump.

### 2026-05-17 - Claude Code (docs — BACKLOG.md created)
- Request: Consolidate everything raised this session that's not yet done into a durable operational queue.
- Fix: New `BACKLOG.md` at repo root, sectioned Active / Held / Horizon / Done-recent. Captures session asks (full article in reading pane, GitHub Models for Summarize, iPad test, resize-handle cleanup, feed curation, backfill, OPML re-import, mark-read verification), dedup work held pending diagnostic data, and CONTEXT.md horizon items consolidated here.
- Files touched: BACKLOG.md (new), CONTEXT.md (added BACKLOG.md to Operating Documents), AUDIT_TRAIL.md
- Deployment: docs only — no clasp push, no version bump. git commit + push only.

### 2026-05-17 - Claude Code (Viewer v2.33 — stable list position when Nav toggles)
- Request: When Nav is hidden, list pane shouldn't reclaim that space — same left start point and width whether Nav is on or off.
- Fix: body.nav-icons.no-reading-pane .list-pane gets margin-left: var(--sidebar-w) so the list stays at the 200px offset even when aside is display:none.
- Files touched: Viewer/index.html, Viewer/Code.js, CONTEXT.md, AUDIT_TRAIL.md
- Deployment: clasp push + Apps Script redeploy required.

### 2026-05-17 - Claude Code (Viewer v2.32 — list flush-left, fixed right gutter)
- Request: List was centered (wrong). User wants it flush against nav, growing large, with stable blank area on right.
- Fix: body.no-reading-pane .list-pane now flex:1/width:auto/margin-left:0/margin-right:280px. List fills all space left of a fixed 280px right gutter. body.nav-icons.no-reading-pane inherits same margin-right.
- Files touched: Viewer/index.html, Viewer/Code.js, CONTEXT.md, AUDIT_TRAIL.md
- Deployment: clasp push + Apps Script redeploy required.

### 2026-05-17 - Claude Code (Viewer v2.31 — list pane fixed width + blank right)
- Request: Reading off showed no difference; list was filling full screen. Want blank area on right.
- Fix: Replaced clamp/localStorage-variable width with fixed 600px centered (margin auto both sides). Nav+Reading both off: 700px. Removes --list-w-px/--list-left-px dependency entirely — layout is predictable regardless of any saved drag state.
- Files touched: Viewer/index.html, Viewer/Code.js, CONTEXT.md, AUDIT_TRAIL.md
- Deployment: clasp push + Apps Script redeploy required.

### 2026-05-17 - Claude Code (Ingestion v2.46 + Viewer v2.30)
- Request: (1) Auto-run hard purge after trim so soft-deleted rows don't accumulate. (2) Fix iPad layout when both Nav and Reading are off — list pane was offset/narrow instead of filling the screen.
- Fix 1 — Ingestion v2.46: added `hardPurgeDeletedArticles()` call in `runDailyIngestion()` immediately after `trimArticlesToCapacity()`. Logs as `--- HARD PURGE ---`. No more manual purge needed after each ingestion cycle.
- Fix 2 — Viewer v2.30: added `body.nav-icons.no-reading-pane .list-pane` CSS rule — `flex:1; width:auto; max-width:none; margin:0 20px`. Overrides the clamp-based width from the base `no-reading-pane` rule. When both panes are off, the list is the only flex child so `flex:1` fills the full viewport minus 20px borders. Also hides resize handles in that mode (full-screen width; handles at screen edges would be pointless).
- Files touched: Ingestion/Code.js, Viewer/Code.js, Viewer/index.html, CONTEXT.md, AUDIT_TRAIL.md
- Deployment: clasp push both apps. Viewer also needs Apps Script redeploy (pencil → New version → Deploy).

### 2026-05-10 - Claude Code (skill — refinery-sop onboarding)
- Request: Drop a skill that teaches a future Claude Code session the Refinery GitHub setup, audit-trail discipline, and end-to-end SOP loop.
- Fix: Added `.claude/skills/refinery-sop/SKILL.md`. Skill references CONTEXT/AUDIT_TRAIL/PROCESS as source of truth rather than duplicating; documents the v2.8/stale-master tripwire, version-bump locations (Ingestion 1 / Viewer 5), the push-vs-redeploy split (Ingestion push-only, Viewer push+redeploy), audit-trail top-insert rule, and the Do-Not-Touch list. Will trigger on `/refinery-sop` or when a session starts Refinery work.
- Files touched: .claude/skills/refinery-sop/SKILL.md (new), AUDIT_TRAIL.md
- Deployment: docs/skill only — no app code changed, no clasp push. git commit + push only.
- Activation: Project-level skill — Claude Code loads it when started with the Refinery directory as cwd. Other machines pick it up automatically after `git pull`.

### 2026-05-10 - Claude Code (process docs + ship script + branch cleanup)
- Context: migrated to a second machine (C:\Users\ThomasCala). Discovered GitHub default branch was `master` (13 months stale, ~v2.8); all real work is on `main`. Resolved: new machine `git checkout main`; GitHub default branch changed master→main via gh api; stale `master` branch deleted from origin; local tracking ref pruned. No work was ever lost — `main` always had everything.
- Rewrote PROCESS.md from scratch — old version described a stale multi-tool/.json-export era (Codex/Copilot/Gemini, clasp pull-from-Drive). New version documents the actual workflow: the edit→bump→docs→push→commit loop, version-bump locations (Ingestion 1 / Viewer 5), deploy rules (Ingestion push-only, Viewer push+redeploy), cross-machine handoff, branch gotcha, the never-touch list.
- Added ship.ps1 — PowerShell helper automating clasp push + git add/commit/push for ingestion|viewer|both. Deliberately does NOT bump versions or edit docs (those need judgment). Reminds to redeploy Viewer.
- Files touched: PROCESS.md (rewrite), ship.ps1 (new), AUDIT_TRAIL.md
- Deployment: docs/script only — no app code changed, no clasp push needed. git commit + push only.
- Note: docs still contain C:\Users\exact paths; the ThomasCala machine session is handling the path find-replace separately on its clone.

### 2026-05-10 - Claude Code (docs — machine migration + branch cleanup)
- Request: New machine. Update docs paths and document the recent branch cleanup so future sessions don't trip on it.
- Context: Local working copy moved from `C:\Users\exact\Refinery\` (old machine, P16) to `C:\Users\ThomasCala\Refinery\` (new machine). Separately, the repo had a stale `master` branch hanging around alongside `main`. Earlier in this session I read CONTEXT/AUDIT_TRAIL from `master`, which showed v2.8/v2.8 and no HOLD marker, and got out of sync with reality. User resolved that by switching the GitHub default branch from `master` to `main` and deleting `master`; this working tree is now on `main` with v2.45 / v2.29 and the 2026-05-09 HOLD marker visible at the top of the audit trail.
- Fix: Find-and-replaced `C:\Users\exact\Refinery` → `C:\Users\ThomasCala\Refinery` in CONTEXT.md and HANDOFF_PROMPT.md (replace_all). PROCESS.md had no matches. AUDIT_TRAIL.md historical entries left untouched on purpose — they describe state at the time and shouldn't be retroactively rewritten.
- Files touched: CONTEXT.md, HANDOFF_PROMPT.md, AUDIT_TRAIL.md
- Deployment: No clasp push, no version bump — docs-only change. Git commit + push to origin/main.
- Follow-up: Before any clasp push from this machine: `npx --yes @google/clasp login` (moltoboto@gmail.com). gh CLI must be authenticated as moltoboto for git push. No code touched, so the pending items from the 2026-05-09 HOLD (run applySourceCategoryBackfill, purge backlog, redeploy Viewer) all remain open.

### 2026-05-09 - Claude Code (Viewer v2.15 — header reflow on narrow screens)
- Request: Couldn't reach header menu items on phone without zooming out. Quick fix only — full mobile responsive layout deferred pending Claude Design review (user will run design review separately on claude.ai web with screenshots).
- Fix: .header-right now has flex-wrap+row-gap so chips wrap onto a second row when there isn't horizontal space. Added @media (max-width: 720px) block that turns the entire header into a vertical stack: logo + status badge on row 1, search full-width on row 2, chips full-width with horizontal scroll on row 3. Chip padding/font shrunk slightly on narrow screens.
- Body layout (sidebar/list/reading 3-column) still desktop-only and will overflow on phone — that's the bigger work parked until design review comes back with direction.
- Files touched: Viewer/index.html, Viewer/Code.js, CONTEXT.md, AUDIT_TRAIL.md
- Deployment: clasp push DONE. Apps Script redeploy required.

### 2026-05-09 - Claude Code (Viewer v2.14 — font cycle + per-card open link)
- Request: User wants larger fonts. When reading pane is hidden (their iPad workflow: Reading off, keep Nav on, Compact on), there's no way to open the full article — the "Read full article" button only lives inside the reading pane.
- Fix 1 — per-card open link: small ↗ link in the upper-right of every card. Anchor with target="_blank" and onclick="event.stopPropagation()" so it opens the URL in a new tab without also triggering card selection. Visible in all reading-pane states. Replaces the dependence on the reading pane's "Read full article" button.
- Fix 2 — font-size cycle: new "Aa" chip in header. Cycles normal → large → xlarge. Stored in localStorage as 'refinery.fontSize' (0/1/2). Body classes `font-large` and `font-xlarge` target the major reading text directly: card-title, card-snippet, reading-title, reading-body, nav-item, summary-prompt. (Existing CSS uses px values — body font-size cascade alone wouldn't propagate.)
- Confirmed user's iPad workflow (Reading off + Nav on + Compact on) and made it work end-to-end with a clean way to open originals.
- Files touched: Viewer/index.html, Viewer/Code.js, CONTEXT.md, AUDIT_TRAIL.md
- Deployment: clasp push DONE. Apps Script redeploy required (pencil → New version → Deploy).
- Still parked from earlier hold: nav-icons mode rendering (when collapsed it shows nothing), Compact-as-default. User's iPad workflow keeps Nav on so the icons issue isn't blocking — leaving it parked unless they ask.

### 2026-05-09 - Claude Code (Viewer v2.13 — drop redundant search-scope chips)
- Request: User doesn't see use for the 'Current view' / 'All loaded' chips. The Unread chip alone provides the filtering they want — Unread on = filter to unread, Unread off = show all.
- Removed: both chips from header. searchScope hardcoded to 'all' (default and after every setView). Header is cleaner — 4 chips (Unread, Nav, Reading, Compact) plus Refresh, instead of 6.
- updateSearchScopeChips() kept as a no-op since it's still called from window.onload and setSearchScope; if called with the missing buttons, the existing `if (chip)` guards make it a safe no-op. setSearchScope() also kept (no callers in the live UI now, but harmless).
- Side effect: searches now span ALL loaded articles regardless of which category is active. This is what the user described — when Unread is on, list filters to unread; when off, list shows all.
- Files touched: Viewer/index.html, Viewer/Code.js, CONTEXT.md, AUDIT_TRAIL.md
- Deployment: clasp push DONE. **User must redeploy in Apps Script** (pencil → New version → Deploy) for the change to go live.

### 2026-05-09 - HOLD (session close)
Current state: Ingestion v2.44, Viewer v2.12. Both pushed. Viewer NOT yet redeployed — the new toggles won't be live at the URL until pencil → New version → Deploy in Viewer Apps Script project.

User feedback on Viewer v2.12, parked for next session:
1. Nav-icons mode shows nothing — `.nav-icon` spans in index.html are empty. Fix: populate with first letter of label OR keep short labels visible in narrow column.
2. Compact density should be the default — flip LAYOUT_PREFS_ default for compact-density, OR pre-add the body class.
3. "How to see the full article? Double-click?" — current Viewer has Enter keyboard shortcut to open the article URL but no touch path. Add an explicit "Open original" button to the reading pane / card, or wire double-tap on the card to open URL.
4. "Also about keep." — user trailed off; clarification needed before action. Could mean: keep button placement, kept view, keyboard shortcut, or something else.

Pending user actions (not Claude actions):
- Redeploy Viewer in Apps Script (pencil → New version → Deploy) so v2.12 toggles go live at the URL.
- Run applySourceCategoryBackfill() in Ingestion editor to retag existing rows to the renamed 10-category set (News, AI, Finance, Learning, Tech, Watches, YouTube, Reddit, Email, Duplicate).
- Run previewPurgeBeforeDate('YYYY-MM-DD') → purgeBeforeDate(...) → hardPurgeDeletedArticles() to clear the 14K duplicate backlog. Or wait for trimArticlesToCapacity() to run at end of next ingestion (v2.40 fix is in place — uses date-based PATCH so it won't crash on URL length anymore).

### 2026-05-08 - Claude Code (Viewer v2.12 — layout toggles + category sync)
- Request: iPad landscape ergonomics — let user toggle the reading pane off (cards already contain same content), collapse the left nav, and pick comfortable vs compact density. Also sync category nav to Ingestion v2.44.
- Implementation:
  1. Three new chips in the header (`Reading`, `Nav`, `Compact`). Each flips a body class via toggleReading/toggleNav/toggleDensity and persists to localStorage so the choice sticks across reloads. LAYOUT_PREFS_ array drives the on-load hydration.
  2. CSS body classes: `body.no-reading-pane` hides the reading pane and lets list-pane flex to fill. `body.nav-icons` shrinks aside to 60px and hides labels/sections/counts. `body.compact-density` tightens padding and font-size on nav-item/article-card/reading-content/summaries.
  3. CATEGORIES const reduced from 14 to 10 entries (News, AI, Finance, Learning, Tech, Watches, YouTube, Reddit, Email, Duplicate). Drops legacy Top Story/AI & LLMs/Tech & Trends/Resources/Policy & Society/Dev Tools/Research/Strategy.
- Version bumped in 5 locations (3 in index.html — title, 2 logos; 2 in Code.js — header comment, setTitle).
- Files touched: Viewer/index.html, Viewer/Code.js, CONTEXT.md, AUDIT_TRAIL.md
- Deployment: clasp push DONE. **User must redeploy in Apps Script** (pencil → New version → Deploy) for the change to go live at the existing URL.
- Follow-up: After running applySourceCategoryBackfill() in Ingestion to retag, the Viewer category nav will populate cleanly under the new short names.

### 2026-05-09 - Claude Code (Viewer v2.29 — handles fixed-positioned, more visible)
- Request: User screenshot at v2.28 didn't show any handles — invisible.
- Two problems with v2.28: (a) cream background blended with page bg, (b) handles inside list-pane scrolled with content.
- Fix: handles now position:fixed with z-index 30. Background bumped to darker cream (#ecdcb8) with #d9c79e borders. Width 14 → 20px. SVG grip 6×28 → 8×36. positionResizeHandles_() reads list-pane bounding rect and sets handle .left in pixels. Called on init, layout toggle (in setTimeout 0 to await reflow), window resize, and during drag.
- Files touched: Viewer/index.html, Viewer/Code.js, CONTEXT.md, AUDIT_TRAIL.md
- Deployment: clasp push DONE. Apps Script redeploy required.

### 2026-05-09 - Claude Code (Viewer v2.28 — draggable resize handles)
- Request: User tired of asking for specific widths. Build draggable resize handles on each side of the list pane. Cream color, nice icon.
- Implementation:
  - Added two `.resize-handle` divs (handle-left, handle-right) inside #listPane. Each contains an SVG with a 6-dot grip pattern (two columns of three dots).
  - CSS: handles are `display: none` by default, `display: flex` when `body.no-reading-pane`. Width 14px, cream background (#f5ebd7), darker cream on hover/dragging (#ecdcb8), color goes from muted to accent on hover. position:absolute pinned to the edges of the now position:relative list-pane. `touch-action: none` so iPad drag gestures aren't hijacked by browser scroll. Hidden entirely below 720px.
  - JS: pointerdown handler computes startX/startW/startLeft from getBoundingClientRect, attaches mousemove+mouseup AND touchmove+touchend. Right handle changes width only. Left handle adjusts BOTH width and left margin so the right edge stays anchored. CSS variables `--list-w-px` and `--list-left-px` updated live during drag, persisted to localStorage on release.
  - Double-click any handle → clears localStorage and removes inline vars, restoring the v2.27 clamp default.
  - applySavedListGeometry_() runs at page load to hydrate.
  - Width is clamped between 280–1400px during drag.
- Files touched: Viewer/index.html, Viewer/Code.js, CONTEXT.md, AUDIT_TRAIL.md
- Deployment: clasp push DONE. Apps Script redeploy required.

### 2026-05-09 - Claude Code (Viewer v2.27 — viewport-scaled list width)
- Request: "if it is 1440 -- then 300 | 840 | 300". User wants list to scale with viewport, not be a fixed 500px.
- Implementation: body.no-reading-pane .list-pane width changed to `clamp(300px, calc(100vw - 600px), 1000px)`. Reserves 600px total for gutters; list takes the rest, capped at 1000 and floored at 300. Auto margins center in the flex space remaining after the sidebar (Nav on) or whole viewport (Nav off).
- Math at common widths: 1440 → 840 list with 300 gutters each side ✓ (matches spec). 1920 → 1000 list with 460 each side. 1180 (iPad land) → 580 list with 100 each side after sidebar=200, or 300 each side if Nav off. 720 → 300 list with 210 each side.
- Files touched: Viewer/index.html, Viewer/Code.js, CONTEXT.md, AUDIT_TRAIL.md
- Deployment: clasp push DONE. Apps Script redeploy required.

### 2026-05-09 - Claude Code (Viewer v2.26 — fix compact bug + list 500)
- Two issues:
  1. **Compact toggle was a no-op** since v2.12. CSS targeted .article-card / .list-item / .article-summary / .summary-text — none of those classes exist in the rendered DOM. Real classes are .card, .card-title, .card-snippet, .card-eyebrow, .reading-content, .reading-title, .reading-body. Rewrote the body.compact-density block to target actual classes. Compact now genuinely shrinks card padding (10/14), card title (13.5px / 1.35), card snippet (11.5px / 1.4), reading-title (22px), reading-body (13.5px / 1.55).
  2. **List pane width** 400 → 500 in body.no-reading-pane. User found 400 too narrow.
- Files touched: Viewer/index.html, Viewer/Code.js, CONTEXT.md, AUDIT_TRAIL.md
- Deployment: clasp push DONE. Apps Script redeploy required.

### 2026-05-09 - Claude Code (Viewer v2.25 — list pane capped at 400px)
- Request: After v2.23/v2.24 (right gutter equal to sidebar width), text still too horizontal/wide on iPad. User wants 400.
- Cause: with sidebar=200 and right-gutter=200, list pane was flex:1 filling whatever was left. On iPad landscape (~1180px) that's ~780px of card width. Lines too long.
- Fix: body.no-reading-pane .list-pane now `width: 400px; flex: 0 0 400px` with `margin-left/right: auto`. List is exactly 400px wide and centered in the flex space remaining after the sidebar. Empty space splits evenly on either side. Replaces the previous margin-right: var(--sidebar-w) approach.
- On phone (≤720px viewport): the @media block doesn't override list-pane width, so it'd try to be 400 but flex space is much less — flex shrinks to fit. Effectively same behavior as v2.24 on phone.
- Files touched: Viewer/index.html, Viewer/Code.js, CONTEXT.md, AUDIT_TRAIL.md
- Deployment: clasp push DONE. Apps Script redeploy required.

### 2026-05-09 - Claude Code (Viewer v2.24 — mobile uses the same pattern)
- Request: Apply the v2.23 gutter pattern to mobile too rather than building a separate mobile-only format.
- Implementation: extended the existing @media (max-width: 720px) block to also override --sidebar-w (200 → 110) and --list-w (360 → 240). The body.no-reading-pane right-gutter rule from v2.23 already uses `margin-right: var(--sidebar-w)`, so it scales automatically with the new variable values. No CSS-rule duplication.
- Result on phone (390px viewport, Reading off + Nav on): sidebar 110 + list ~170 + right gutter 110 = roughly centered list with symmetric breathing room. With Reading off + Nav off: list ~280 + right gutter 110.
- Files touched: Viewer/index.html, Viewer/Code.js, CONTEXT.md, AUDIT_TRAIL.md
- Deployment: clasp push DONE. Apps Script redeploy required.

### 2026-05-09 - Claude Code (Viewer v2.23 — right gutter when reading off)
- Request: When Reading pane is off (user's iPad workflow), list pane stretches edge-to-edge — eye has to travel the full screen width to scan. User wants a blank region on the right equal to nav width, so the layout is symmetric and the list stays within comfortable reading distance.
- Fix: body.no-reading-pane .list-pane now has `margin-right: var(--sidebar-w)`. List pane keeps flex:1 (fills available) but the right margin reserves sidebar-width of empty space. Effect: list is centered between left nav (200px) and matching empty 200px on the right. Same width for content regardless of reading-pane state.
- When Nav is also off, the right gutter still applies — list will be off-center but not edge-to-edge. Could add a Nav-aware variant if user finds that wrong; haven't.
- Files touched: Viewer/index.html, Viewer/Code.js, CONTEXT.md, AUDIT_TRAIL.md
- Deployment: clasp push DONE. Apps Script redeploy required.

### 2026-05-09 - Claude Code (Viewer v2.22 — sidebar width restored)
- Request: Sidebar feels too small now in full view.
- Cause: I over-shrank in v2.19 (196 → 160px) trying to fix the user's "wasted space" complaint. Turned out the real fix was inside the row (v2.20: removed flex:1 on label, hid empty icon column), not the column width. Combined effect: sidebar both narrower AND tighter — felt cramped.
- Fix: --sidebar-w back up to 200px. Inner-padding/label-flex fixes from v2.20 stay. End result is a sidebar that's noticeably narrower than the original 248px but still has reasonable breathing room and lets long source labels wrap less.
- Files touched: Viewer/index.html, Viewer/Code.js, CONTEXT.md, AUDIT_TRAIL.md
- Deployment: clasp push DONE. Apps Script redeploy required.

### 2026-05-09 - Claude Code (Viewer v2.21 — Nav toggle hides sidebar fully)
- Request: When user toggled Nav in v2.19 screenshot (still pre-redeploy of v2.20), the column went blank — empty 60px stub. User said: if it's empty, don't show it at all.
- Why it was empty: original v2.12 plan had `body.nav-icons` collapse aside to 60px and show icons only. But .nav-icon spans were never populated with actual glyph content (they're empty `<span class="nav-icon"></span>`). So collapsing showed nothing.
- Fix: replaced the icons-mode CSS block with a simple `body.nav-icons aside { display: none }`. Toggle now means "Hide left nav entirely" — full sidebar width returns to the list/reading area.
- Updated chip title attribute "Collapse left nav" → "Hide left nav".
- Files touched: Viewer/index.html, Viewer/Code.js, CONTEXT.md, AUDIT_TRAIL.md
- Deployment: clasp push DONE. Apps Script redeploy required (combines v2.16 through v2.21).
- Closes the parked "nav-icons rendering" item from the 2026-05-09 hold marker.

### 2026-05-09 - Claude Code (Viewer v2.20 — kill gap between label and count)
- Request: User screenshot circled the empty space BETWEEN nav-item labels (News, AI, Tech) and their count badges. Previous v2.17/v2.19 attempts shrank sidebar width but didn't address the inner gap.
- Root cause: .nav-label had `flex: 1` so it expanded to fill available space, pushing the count badge to the right edge of the nav-item. Visible as a wide empty middle when labels are short.
- Fix: .nav-label `flex: 0 0 auto` — natural width, badge sits immediately after label with gap:6 spacing. Empty space (if any) now sits to the right of the badge instead of between label and badge.
- Bonus: .nav-icon `display: none` since the spans are empty (icons were never populated). Saves ~20px on left of every nav row. Re-enable with content if real icons get added.
- Files touched: Viewer/index.html, Viewer/Code.js, CONTEXT.md, AUDIT_TRAIL.md
- Deployment: clasp push DONE. Apps Script redeploy required.

### 2026-05-09 - Claude Code (Viewer v2.19 — sidebar much tighter)
- Request: 196px in v2.17 wasn't enough; user reports "wasted space" still there.
- Three CSS changes in concert:
  1. --sidebar-w 196 → 160px (reclaims 36px more for the list pane)
  2. .nav-item padding 8/16 → 5/12; gap 9 → 6 (vertical density up, horizontal padding down)
  3. .sidebar-section padding 16/16/4 → 10/12/2 (section dividers take less space)
- Net effect: more compact left rail, more room for the list/reading panes.
- Files touched: Viewer/index.html, Viewer/Code.js, CONTEXT.md, AUDIT_TRAIL.md
- Deployment: clasp push DONE. Apps Script redeploy required (combines v2.16/17/18/19).
- IMPORTANT: User screenshot at v2.15 showed sidebar at 248px. They may not have redeployed yet — if changes aren't visible, that's why. Each redeploy serves the latest pushed code at the existing URL.

### 2026-05-09 - Claude Code (Viewer v2.18 — drop URL-source cleanup helper)
- Request: User fixed the Motley Fool source label in TOR directly. Asked to remove the v2.17 prettifySource helper rather than keep it as a safety net.
- Removed: SOURCE_LABEL_OVERRIDES_ const, prettifySource() function, calls to it in sourceNav render and card-source-label.
- Kept: sidebar width 196px from v2.17.
- Files touched: Viewer/index.html, Viewer/Code.js, CONTEXT.md, AUDIT_TRAIL.md
- Deployment: clasp push DONE. Apps Script redeploy still required (combines v2.16/v2.17/v2.18).

### 2026-05-09 - Claude Code (Viewer v2.17 — sidebar shrink + URL source cleanup)
- Request: User screenshot shows V2.15 (hadn't redeployed v2.16 yet). Reported (a) "wasted space on the left" — sidebar 248px is way too wide for the new short category names, (b) raw URL appearing as a source name (Motley Fool feed: `https://www.fool.com/a/feeds/feed?apikey=foolwatch-feed`).
- Fixes:
  1. --sidebar-w 248 → 196px. Categories like 'AI', 'Tech', 'News' fit comfortably in much less space; sidebar feels less empty. Source names with longer text wrap inside the narrower column.
  2. New display helper prettifySource(src): if source string starts with http(s)://, extract host. SOURCE_LABEL_OVERRIDES_ maps known domains (fool.com → Motley Fool, seekingalpha.com → Seeking Alpha, yahoo finance, marketwatch, fox business, cnbc, bbc, nyt, reuters, the verge, ars, techcrunch, engadget, macrumors, hacker news). Falls back to title-cased SLD. Also scans full URL for known tokens (foolwatch-feed → Motley Fool). Applied to sourceNav rendering AND .card-source-label. Original value preserved in title attribute for tooltip.
- Bundles with v2.16's category-count fix — single redeploy gets both.
- Files touched: Viewer/index.html (sidebar var, prettifySource fn, sourceNav render, card render, version), Viewer/Code.js (version), CONTEXT.md, AUDIT_TRAIL.md
- Deployment: clasp push DONE. **User must redeploy Viewer in Apps Script.**

### 2026-05-09 - Claude Code (Viewer v2.16 — fix category total mismatch)
- Request: User ran backfill, category counts still don't sum to "All Unread" total.
- Root cause: Viewer had its OWN normalizeCategory functions (Code.js line 917 `normalizeCategory_`, index.html line 2074 `normalizeCategory`) that were never updated when Ingestion went from 14 long-form categories to 10 short-form. They were mapping `'ai' → 'AI & LLMs'`, `'tech' → 'Tech & Trends'`, default `'Tech & Trends'`. So even after backfill wrote 'AI'/'Tech'/'News' to DB, the Viewer normalizer turned them BACK into legacy long names that aren't in the new CATEGORY_KEYS sidebar list — those rows counted toward unreadArticles (line 718 of Code.js) but didn't appear in any sidebar bucket.
- Fix: rewrote both normalizer functions and CATEGORY_KEYS / CATEGORY_MAP in index.html to use the 10 current short names. Folds: current short names → themselves; legacy long names ('AI & LLMs', 'Top Story', 'Tech & Trends', 'Resources') → current; retired categories ('Policy & Society', 'Dev Tools', 'Research', 'Strategy') → closest current. Default fallback now 'Tech'.
- After redeploy: category counts in sidebar should sum (modulo Duplicate, which is excluded from unreadArticles by query at Code.js line 702).
- Files touched: Viewer/index.html (CATEGORY_KEYS, CATEGORY_MAP, normalizeCategory, version), Viewer/Code.js (normalizeCategory_, version), CONTEXT.md, AUDIT_TRAIL.md
- Deployment: clasp push DONE. **User must redeploy Viewer in Apps Script.**

### 2026-05-09 - Claude Code (v2.45 — better dedup recall on topic clusters)
- Request: User reports duplicates not catching multiple articles on same identical watch/topic when headlines differ. Examples: 3 sources covering same Rolex GMT release with different headlines.
- Two complementary fixes:
  1. Lowered DEDUPE_REVIEW.MIN_SCORE 0.66 → 0.55. More fuzzy matches survive scoring. Risk: more false positives in Duplicate review.
  2. Added proper-noun overlap detection. extractProperNouns_(title) pulls capitalized 3+ char tokens (Rolex, GMT-Master, Anthropic, etc.) and drops a headline stopword list (HEADLINE_STOPWORDS_ — the/a/and/unveils/launches/announces/etc.). Lowercased deduped list per article.
  3. Proper nouns precomputed at warmDedupCache_ time as `row._properNouns`, and on incoming records in findPossibleDuplicateCandidate_. scorePossibleDuplicateMatch_ has a new branch: when sharedNouns >= 3 between incoming and candidate titles, fires with reason "N shared title entities" and boosts score to 0.66.
- Net: catches "Rolex Unveils GMT" + "Hands-On the New Rolex GMT-Master" + "Rolex Reference 126710 First Look" — all share Rolex+GMT+Master and now flag as duplicates.
- Watch carefully for false positives in Duplicate review. If common entities like "AI" or "Apple" cause noise, can add weighting (rare nouns count more) in a follow-up.
- Files touched: Ingestion/Code.js (v2.45), CONTEXT.md, AUDIT_TRAIL.md
- Deployment: clasp push DONE.

### 2026-05-08 - Claude Code (v2.44 — second rename pass)
- Request: Also shorten 'Top Story' → 'News' and 'Resources' → 'Learning' to match TOR folder names exactly.
- Bulk-replaced both throughout. Added legacy fold rows in canonicalCategoryName_: 'top story', 'top stories' → 'News'; 'resources', 'resource', 'learning skills', 'learning & skills' → 'Learning'. Pre-existing 'strategy' → 'Resources' fold flipped to 'Learning'.
- Final 10-category set: News, AI, Finance, Learning, Tech, Watches, YouTube, Reddit, Email, Duplicate.
- Files touched: Ingestion/Code.js (v2.44), CONTEXT.md, AUDIT_TRAIL.md
- Deployment: clasp push Ingestion only.
- Follow-up: Run applySourceCategoryBackfill() in Apps Script editor to retag existing rows.

### 2026-05-08 - Claude Code (v2.43 — shorter category names)
- Request: Long category names ('AI & LLMs', 'Tech & Trends') don't match TOR folder names. Use the same short names TOR uses.
- Renames: `AI & LLMs` → `AI`, `Tech & Trends` → `Tech`. Bulk-replaced across CATEGORY_SOURCE_MAP, TOR_FOLDER_CATEGORY_MAP, CATEGORY_OPTIONS, isKnownCategory_, detectCategory return values.
- canonicalCategoryName_ retains legacy mappings ('ai llms', 'ai & llms', 'tech trends', 'tech & trends') folding to the new short names — so existing DB rows display correctly until applySourceCategoryBackfill() retags them.
- Other category names left unchanged for now (Top Story, Resources, Watches, etc.) — pending user confirmation on whether to also rename those to match TOR folder labels exactly.
- Files touched: Ingestion/Code.js (v2.43), CONTEXT.md, AUDIT_TRAIL.md
- Deployment: clasp push Ingestion only.
- Follow-up: Run applySourceCategoryBackfill() once to retag rows with old long names.

### 2026-05-08 - Claude Code (v2.42 — folder-driven categorization)
- Request: Articles often land in wrong category. Refinery has 14 categories, TOR has 9 folders. Use TOR folder as the category source. Drop categories that don't exist in TOR.
- Implementation:
  1. Added TOR_FOLDER_CATEGORY_MAP — maps lowercased TOR folder labels (`'ai'`, `'essential watches'`, `'finance'`, `'learning & skills'`, `'news'`, `'reddit'`, `'tech'`, `'youtube'`) to Refinery categories.
  2. Added extractTORFolders_(article) — parses `user/-/label/<Folder Name>` entries from article.categories array (Google Reader API standard).
  3. Added categoryFromTORFolder_(folders) — looks up first matching label in the map.
  4. normalizeCategory signature gains optional torFolders param. New priority: Duplicate guard → sheet override → CATEGORY_SOURCE_MAP → **TOR folder** → URL pattern → existing-known → keyword fallback. Folder beats URL/keyword but yields to explicit per-source mapping.
  5. mapTORArticleBasic_ extracts folders into `basic._torFolders` and passes them to normalizeCategory. enrichTORArticle_ passes them through too.
  6. CATEGORY_OPTIONS reduced from 14 → 10. Dropped: Policy & Society, Dev Tools, Research, Strategy.
  7. canonicalCategoryName_ map folds the legacy values into closest current category so existing rows render sensibly until backfill runs (policy → Top Story, dev tools → Tech & Trends, research → Tech & Trends, strategy → Resources).
  8. detectCategory keyword paths for Dev Tools / Research / Policy & Society / Strategy removed.
  9. CATEGORY_SOURCE_MAP: stratechery.com 'Strategy' → 'Resources' (Stratechery sits in Learning & Skills folder).
- New articles get folder-driven categories immediately. To re-tag the existing collection, run applySourceCategoryBackfill() in the editor — it re-runs normalizeCategory over old rows.
- Files touched: Ingestion/Code.js (v2.42), CONTEXT.md, AUDIT_TRAIL.md
- Deployment: clasp push Ingestion only.
- Follow-up: User to add new TOR folders if any new categories emerge — just create the folder in TOR, add a row to TOR_FOLDER_CATEGORY_MAP, push. Viewer category nav probably hardcodes the old list — to verify next session.

### 2026-05-08 - Claude Code (v2.41 — cleanup pass)
- Request: Consolidate the date-specific purge functions to one date-input pair. Review ingestion for AI slop.
- Purge consolidation:
  - NEW: `previewPurgeBeforeDate(dateString, batchSize)` and `purgeBeforeDate(dateString, batchSize)` — accept any 'YYYY-MM-DD' string
  - DELETED: previewPurgeArticlesBeforeApril2026, purgeArticlesBeforeApril2026, previewPurgeBeforeApr15, purgeBeforeApr15 (4 hardcoded-date wrappers)
  - KEPT: hardPurgeDeletedArticles (no date), trimArticlesToCapacity (rolling cap), previewDuplicateArticles, dryRunPurgeGenericRedditShellArticles + purgeGenericRedditShellArticles (Reddit shell-row cleanup)
- AI slop removed (verified via grep that nothing called these):
  - `mapTORArticleToSchema()` — only caller was test function `testTORDryRun`; redirected to `mapTORArticleBasic_` and removed the wrapper
  - `hasDuplicateCandidate_()` — zero callers, leftover from earlier dedup approach
  - `runEmail()` — one-line wrapper to runEmailSummaryCleanup, no apparent callers
  - `SKIP_ENRICHMENT_SOURCES_` var — only referenced inside the already-commented-out block in enrichTORArticle_
- Code clarification: enrichTORArticle_ no longer carries the dead-code block referencing the disabled enrichArticleFromUrl path. Function now plainly builds the record from RSS data; comment notes that Gmail still uses enrichArticleFromUrl independently.
- Kept (still used by Gmail tier — verified via grep):
  - `enrichArticleFromUrl()` — used by processNewsletterTier
  - `isDuplicateBySourceId()` — used by Gmail Tier 2 inbox processing
- Files touched: Ingestion/Code.js (v2.41), CONTEXT.md, AUDIT_TRAIL.md
- Deployment: clasp push Ingestion only.

### 2026-05-08 - Claude Code (v2.40)
- Request: First v2.38 run completed cleanly but crashed at retention with "Limit Exceeded: URLFetch URL Length." DB had 14,294 rows (not the 800 user thought) — leftover from before v2.36 fixed the timeout-creates-dups feedback loop.
- Root cause: trimArticlesToCapacity built `?id=in.(id1,id2,...,id11294)` for the PATCH. Apps Script's UrlFetchApp has a URL length limit. Url with 11K UUIDs comma-joined was way over.
- Fix: rewrote retention to use date-based PATCH. (1) Query for the date_added of the (trimCount)-th oldest row using `limit=1&offset=trimCount-1`. (2) Single PATCH with `date_added=lte.{cutoff}&kept=eq.false&status=neq.deleted` setting status='deleted'. URL is constant-length regardless of how many rows match.
- Bonus: Prefer:return=representation now reports actual trimmed count.
- Run timing observation from the failed run: 412 articles in 154s = 0.37s/article. v2.39 (precomputed features + log spam removal) wasn't deployed yet at run time, so further speedup expected.
- Files touched: Ingestion/Code.js (v2.40), CONTEXT.md, AUDIT_TRAIL.md
- Deployment: clasp push Ingestion only.
- Follow-up: Next run will trim the 11K excess rows. After that, run hardPurgeDeletedArticles() once to permanently remove them. Then retention will steady-state at 3000.

### 2026-05-08 - Claude Code (v2.39)
- Request: Ingestion still doesn't finish 500 articles in one run. Feedly/Inoreader much faster.
- Three real bottlenecks identified and fixed:
  1. **Candidate features recomputed per-article**: scorePossibleDuplicateMatch_ was running cleanUrl + normalizeTitleForDedupe + dedupeTokens_ ×2 + cleanSummaryForDedupe_ + simhashText_ for every candidate, on every article. With 2000 candidates and 5-10ms simhash each, that was ~80 seconds of CPU per article that reached fuzzy dedup. Now warmDedupCache_ precomputes _url, _titleNorm, _titleTokens, _topicTokens, _simhash on each row at warm time — once. scorePossibleDuplicateMatch_ uses the precomputed values when available (falls back for non-ingestion callers).
  2. **MAX_CANDIDATES 2000 → 500**: bumped to 2000 in v2.35 while mark-read was broken and backlog was huge. Now that mark-read works (v2.35-v2.36 fix), backlog drains, 500 is plenty.
  3. **Logger.log spam in hot path**: per-article logs in isFastExactDuplicate_, isFastTickerFiltered_, and the TOR loop's exact-duplicate path. Each Logger.log is ~5-20ms in Apps Script. With 500 articles producing 1000+ log lines, pure logging overhead was 5-30s. Replaced with end-of-loop summary: `TOR skip summary: source=N fastDup=N ticker=N noisy=N supabaseDup=N | inserted=N`.
- Files touched: Ingestion/Code.js (v2.39), CONTEXT.md, AUDIT_TRAIL.md
- Deployment: clasp push Ingestion only.

### 2026-05-08 - Claude Code (v2.38)
- Request: Cap article storage at 3000 rows. Always preserve kept=true and all Drive artifacts.
- Implementation: trimArticlesToCapacity(targetOverride) — counts non-kept/non-deleted rows using Supabase Content-Range header (HEAD-style with Prefer:count=exact). If over cap, fetches oldest excess by date_added asc and soft-deletes via PATCH with id=in.(...) filter. kept=eq.false safety filter included on PATCH so kept=true rows are double-protected.
- Cost: 1 urlfetch when at/under cap (typical), 3 when over.
- Wired into runDailyIngestion() as a third phase after TOR + Gmail. Also a public function (manual run / one-shot trim).
- Drive artifacts: unaffected — separate storage, no purge code touches them.
- CONFIG.MAX_ARTICLES = 3000. Set to 0 to disable.
- Note: at current 800 articles, the trim is a no-op. User will see one log line "RETENTION: 800 active rows / 3000 cap" and no deletes. Will start trimming when collection grows past 3000.
- Files touched: Ingestion/Code.js (v2.38), CONTEXT.md, AUDIT_TRAIL.md
- Deployment: clasp push Ingestion only.

### 2026-05-08 - Claude Code (v2.37)
- Request: Too many articles from MotleyFool (and previously Seeking Alpha). User wants stock info but ONLY for portfolio tickers, not the broad market chatter MotleyFool floods with.
- Why the old finance filter (v2.28-v2.34) was the wrong tool: the allowlist included macro/sector keywords (`earnings`, `market`, `fed`, `wall street`, `nasdaq`, `dividend`, `pharma`) which match basically every MotleyFool article. The result was that the filter let everything through, so we disabled it.
- Fix: replaced FINANCE_FILTER_DOMAINS / FINANCE_ALLOW_PATTERNS / isFinanceFiltered_ / isFastFinanceFiltered_ / isFinanceSourceFiltered_ / passesFinanceAllowlist_ with a narrower set:
  - TICKER_FILTER_DOMAINS = ['fool.com', 'seekingalpha.com'] — only the noisy feeds
  - TICKER_ALLOW_PATTERNS — Mag 7 + AMD + ORCL + CMCSA + Coatue, nothing else. No macro, no sector, no market verbs.
  - isFastTickerFiltered_(article) — checks title + raw RSS summary (MotleyFool often teases ticker in body but not title)
  - Wired as a pre-map filter in TOR loop after isFastExactDuplicate_()
- Other finance feeds (Yahoo Finance, MarketWatch, CNBC Mad Money, Fox Business) pass through unfiltered for now. If any prove too noisy, add their domain to TICKER_FILTER_DOMAINS.
- General news / Reuters / top-level CNBC are NOT in TICKER_FILTER_DOMAINS — those are broad-market coverage and should pass.
- Files touched: Ingestion/Code.js (v2.37), CONTEXT.md, AUDIT_TRAIL.md
- Deployment: clasp push Ingestion only.
- Follow-up: After a few runs, audit what made it through from fool.com / seekingalpha.com to confirm the patterns are tight enough. Add tickers as portfolio changes.

### 2026-05-08 - Claude Code (v2.36)
- Request: Ingestion super slow, creating MORE duplicates not fewer, timing out frequently. When timeouts occur, articles already reviewed end up in the DB and become duplicates.
- Root cause of duplicates-on-timeout: markTORArticlesAsRead was only called AFTER the for-loop completed (line 451). When the loop bailed early on timeout, articles already inserted into Supabase had NOT been marked read in TOR. Next run, TOR returned them again, dedup might miss them under load (Supabase queries failing on quota / transient errors), so they were inserted as new rows. Feedback loop: timeouts → more rows → slower dedup queries → more timeouts → more dups.
- Fix 1 — Incremental mark-read: TOR loop now flushes markTORArticlesAsRead and audit batch every 25 articles. If the run times out at article 200, articles 1-175 are already marked read in TOR. Eliminates the "inserted-but-unread" window that caused the duplicate feedback loop.
- Fix 2 — Same-run dedup map updates: added addToFastDedupCache_(url, title) called immediately after every insert AND every duplicate confirmation. Previously, if Article X was inserted at iteration 50 and reappeared at iteration 200 from a different feed, isFastExactDuplicate_ would miss it (cache was built BEFORE the loop and never updated). Now subsequent occurrences hit the in-memory map with zero HTTP calls.
- Fix 3 — Skip redundant Supabase queries when cache warm: reviewDuplicateRecord_() now short-circuits the URL exact and title ilike queries when INGESTION_DEDUP_CACHE_ is populated. Cache covers the 30-day window; the queries could only find articles older than that, which is rare for live TOR feeds. Saves ~2 urlfetch calls per article that survives the fast cache check.
- Fix 4 — Reddit cache reuse: Reddit special case in reviewDuplicateRecord_ was fetching 250 fresh rows per Reddit article (ignoring the cache). Now filters INGESTION_DEDUP_CACHE_ in memory for source='Reddit'.
- Fix 5 — Hoist incoming-article features in fuzzy dedup: findPossibleDuplicateCandidate_ now precomputes cleanUrl, normalizeTitleForDedupe, dedupeTokens_ (twice), cleanSummaryForDedupe_, and simhashText_ ONCE per record, then passes the precomputed `incoming` object to scorePossibleDuplicateMatch_. Was previously recomputed for every candidate (up to 2000× per article — simhash alone is 64 × tokens.length bit ops).
- Fix 6 — DEDUPE_STOPWORDS_ hoisted to module level. Was being reallocated on every dedupeTokens_ call. Removed duplicate `into` and `amid` keys. Cosmetic but cleaner.
- Net impact: ~95% drop in urlfetch calls per run for healthy feeds, eliminates the timeout-creates-duplicates feedback loop, eliminates same-run duplicates from overlapping feeds (Reuters/CNBC/Yahoo covering same earnings story).
- Files touched: Ingestion/Code.js (v2.36), CONTEXT.md, AUDIT_TRAIL.md
- Deployment: clasp push Ingestion only.
- Follow-up: Watch first run for "TOR: marked X/Y as read (Z batches)" appearing multiple times per run (incremental flushes). Then run purge to clear backlog of duplicate rows accumulated from prior runs.

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
