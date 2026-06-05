# How Refinery Works — Plain English

## What Is Refinery?

Refinery is your personal news reader. It pulls articles from RSS feeds and Gmail newsletters,
stores them in a database, and displays them in a clean 3-pane reader you open in a browser.

There are two separate mini-apps that run on Google's servers:

| App | What it does |
|-----|-------------|
| **Ingestion** | Fetches new articles from RSS and Gmail, saves them to the database |
| **Viewer** | Serves the reader UI — the thing you actually read in your browser |

---

## Where Everything Lives

```
Your laptop (working folder)
└── C:\Users\ThomasCala\Refinery\        ← all source code lives here (moved out of OneDrive 2026-05-23)
    ├── Ingestion\                     ← the fetcher app
    │   └── Code.js                    ← the actual code (v2.55)
    ├── Viewer\                        ← the reader app
    │   ├── Code.js                    ← backend code (v2.43)
    │   └── index.html                 ← the UI you see in the browser
    ├── CONTEXT.md                     ← project brain — full state and history
    ├── AUDIT_TRAIL.md                 ← log of every session
    ├── HANDOFF_PROMPT.md              ← how to start any AI session
    └── PROCESS.md                     ← step-by-step workflow

GitHub (cloud backup + sync point — source of truth)
└── github.com/moltoboto/Refinery      ← copy of everything above, always in sync
    └── branch: main                   ← always use this one

Google Apps Script (where the code actually runs)
└── script.google.com (moltoboto account)
    ├── Refinery Ingestion             ← live running ingestion app
    └── Refinery Viewer                ← live running viewer app

Supabase (the database)
└── project: hwropcciwxzzukfcjlsr
    └── table: articles                ← every article you've ever ingested

Google Drive (moltoboto account)
└── My Drive > Refinery                ← doc backups + email artifact HTML files
```

**Note on sync reliability:** GitHub is the source of truth; your local working copy at `C:\Users\ThomasCala\Refinery\` is the working surface. Avoid putting the working folder inside OneDrive — sync collisions there caused a complete blank-out on 2026-05-23. `clasp push` to Google Apps Script has been flaky; when it fails the live app drifts behind the source. Treat Apps Script as a separate "live deployment" step, not part of the sync chain.

---

## The Three AI Tools and What Each One Does

### Claude Code (that's me — what you're using right now)
- I can read and edit your files **directly on your laptop**
- I can run commands (clasp push, git, etc.)
- I commit and push changes to GitHub automatically
- Best for: making code changes, reading logs, managing git

### Codex (ChatGPT)
- You upload files to it, it edits them, you download the result
- It cannot touch your laptop or GitHub directly
- Best for: focused code changes when you give it one file at a time

### Claude.ai (browser)
- Good for thinking through design and logic
- You upload files, it advises, you implement the changes yourself
- Best for: planning and architecture discussions

---

## How to Switch Between Claude Code and Codex

### Starting fresh with Claude Code (after Codex was last used)
1. Open Claude Code in `C:\Users\ThomasCala\Refinery\`
2. Run: `git pull` — gets the latest from GitHub
3. Start your session — I read the files directly, no uploads needed

### Handing off to Codex (after Claude Code session)
1. I commit and push to GitHub before closing
2. In Codex: download `Ingestion/Code.js` or `Viewer/Code.js` from GitHub
3. Upload to Codex along with `CONTEXT.md` and `AUDIT_TRAIL.md`
4. After Codex is done: download the result and push back to GitHub manually

---

## How a Change Gets from Your Laptop to Your Browser

```
You edit code here          Claude Code / Codex
       ↓
C:\Users\exact\Refinery\   (local source)
       ↓  git push
github.com/moltoboto/Refinery   (cloud backup)
       ↓  clasp push
Google Apps Script              (where it runs)
       ↓  deploy
Your browser URL                (what you actually use)
```

Every step matters. A change isn't live until it's been clasp-pushed AND deployed in Apps Script.

---

## What clasp Is

`clasp` is a command-line tool that syncs your local `.js` files up to Google Apps Script.
Think of it like "git push, but for Google's servers instead of GitHub."

```bash
# From the Ingestion folder:
cd C:\Users\ThomasCala\Refinery\Ingestion
clasp push --force   # NOTE: clasp has been flaky lately — if it errors, retry or push from another shell

# From the Viewer folder:
cd C:\Users\ThomasCala\Refinery\Viewer
clasp push --force
```

After clasp push, you still need to go into Apps Script and create a new deployment
(or add a new version) before the live URL picks up the change.

---

## End of Session Checklist

After any meaningful change:

- [ ] Bump the version number in the file header — for Viewer this is **line 1** (`// REFINERY - Google Apps Script Backend - Viewer v2.XX`); for Ingestion it's **line 4** of the JSDoc block (` * Version: 2.XX`). These are the ground-truth version references.
- [ ] Add a row to the Change Log in CONTEXT.md
- [ ] Append an entry to AUDIT_TRAIL.md
- [ ] `clasp push` in the relevant app folder
- [ ] Deploy in Apps Script (new version or new deployment)
- [ ] `git add -A && git commit -m "<App> v2.XX - what changed" && git push`
- [ ] Upload updated docs to Google Drive manually

---

## Current Versions

| App | Version | Last changed | What changed |
|-----|---------|-------------|--------------|
| Ingestion | v2.56 | 2026-06-04 | Dedup recall: in-run fuzzy cache append (catches same-run cross-feed near-dups); tokenizer keeps model/version IDs; identical-title match is source-agnostic |
| Viewer | v2.43 | 2026-05-20 | Revert artifact rendering to iframe — fidelity over our styling |

**Ground truth:** the version markers in each Code.js header — line 1 of `Viewer/Code.js` (`// ... Viewer v2.XX`) and line 4 of `Ingestion/Code.js` (` * Version: 2.XX`). If this table disagrees with those markers, the code wins. The `ship.ps1` script auto-stamps this table from the code on every ship.

---

## Best Practices & Auto-Backup

**The 3-5x-per-session rhythm.** Within any working session, the AI should commit + push to GitHub 3-5 times — after each meaningful change, not just at the end. This is your insurance against the kind of OneDrive blank-out that happened on 2026-05-23. If GitHub has it, you can always recover. If only OneDrive has it and OneDrive eats it, the work is gone.

**Two sources of truth, in priority order.**

1. **Header of each `Code.js`** — Viewer's version is on line 1 (`// ... Viewer v2.XX`); Ingestion's is on line 4 (` * Version: 2.XX`). Whatever those say is the version.
2. **GitHub `main`** — file contents are whatever the latest commit on main says.

Your local `C:\Users\ThomasCala\Refinery\` is a working copy, not a source of truth. `HOW_THIS_WORKS.md` and `CONTEXT.md` are narrative; if they disagree with the code or with GitHub, the code/GitHub wins.

**Auto-backup health check.** A scheduled task runs daily to:

1. Verify the local `C:\Users\ThomasCala\Refinery\` folder still has content (catches the blank-out case)
2. Verify the local git is in sync with `origin/main` (catches drift)
3. Verify line-1 versions in both `Code.js` files match what GitHub has
4. Surface anything wrong as a quick chat report you can act on

If the health check fails, you'll get a clear message in Cowork telling you exactly what to fix.

**Recovery playbook (if the working folder goes blank or is lost):**

```powershell
# Re-clone fresh from GitHub
git clone https://github.com/moltoboto/Refinery.git C:\Users\ThomasCala\Refinery
```

Or just ask Claude in Cowork: "Restore Refinery from GitHub." It's the recipe we used on 2026-05-23, when the working copy lived in OneDrive and OneDrive silently emptied the folder. The move to `C:\Users\ThomasCala\Refinery\` (out of OneDrive) on 2026-05-23 is the long-term fix; this playbook is for the day GitHub-cloud rather than OneDrive becomes the failure mode.

---

## Things That Must Never Be Changed Without Care

- **Supabase credentials** in CONFIG — if these break, nothing works
- **`normalizeCategory()`** — fragile pipeline, test before touching
- **`cleanUrl()`** — how duplicates are detected; changing this can cause re-ingestion of everything
- **`sanitizeRecord()`** — enforces field length limits on every database write

If any AI tool touches these without being asked, reject the change.
