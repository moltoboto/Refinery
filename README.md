# Refinery

A personal news reader built on Google Apps Script and Supabase. Refinery pulls
articles from RSS feeds and Gmail newsletters into a database and serves them
through a clean 3-pane web reader.

## Two apps, one repo

| App | Folder | What it does |
|-----|--------|--------------|
| **Ingestion** | [`Ingestion/`](Ingestion/) | Fetches RSS + Gmail content, dedupes, sanitizes, writes to Supabase |
| **Viewer** | [`Viewer/`](Viewer/) | Renders the 3-pane reader UI; serves articles + email "artifacts" |

Both run as separate projects in Google Apps Script and share a single Supabase
`articles` table.

## Current versions

| App | Version |
|-----|---------|
| Ingestion | v2.55 |
| Viewer | v2.43 |

Versions live in each `Code.js` header — Viewer on line 1, Ingestion on line 4
(`* Version: X.YY`). The `ship.ps1` script keeps the version table in
[`HOW_THIS_WORKS.md`](HOW_THIS_WORKS.md) auto-stamped from those markers.

## Repository layout

```
Refinery/
├── Ingestion/                  Apps Script project: RSS + Gmail ingest
│   ├── Code.js                 main logic (v2.55)
│   ├── appsscript.json
│   └── .clasp.json
├── Viewer/                     Apps Script project: reader UI
│   ├── Code.js                 backend (v2.43)
│   ├── index.html              UI
│   ├── appsscript.json
│   └── .clasp.json
├── design/                     UI redesign work, mockups, briefs
├── CONTEXT.md                  durable project state, gotchas, change log
├── AUDIT_TRAIL.md              session-by-session log of every change
├── HOW_THIS_WORKS.md           plain-English architecture + workflows
├── HANDOFF_PROMPT.md           kickoff prompt + session health check
├── PROCESS.md                  step-by-step workflow rules
├── BACKLOG.md                  open items + backlog
├── ship.sh                     clasp push + version stamp + git push (Mac + Lenovo, bash)
└── ship.ps1                    same, Windows PowerShell
```

## Working copy & sync

| Location | Role |
|----------|------|
| **`~/Refinery/`** | Local working folder (the canonical path) |
| **`github.com/moltoboto/Refinery`** | Cloud backup + source of truth, branch `main` |
| **Google Apps Script** (moltoboto account) | Where the code actually runs |
| **Supabase** (`hwropcciwxzzukfcjlsr`) | The `articles` table |
| **Google Drive** (moltoboto) | Doc backups + email-artifact HTML files (gitignored locally) |

History note: the working folder lived in OneDrive briefly. OneDrive silently
emptied the folder on 2026-05-23. The working copy was moved out of OneDrive
into `~/Refinery/` the same day. Do not put the working folder
back in OneDrive.

## Getting started in a new session

Open the working folder in any AI coding tool (Claude Code, Codex, etc.) and
paste the kickoff prompt from [`HANDOFF_PROMPT.md`](HANDOFF_PROMPT.md). It runs
a health check first (verifies the folder isn't blank and git is current) and
then reads `CONTEXT.md` + recent `AUDIT_TRAIL.md` entries to come up to speed.

Full plain-English walkthrough: [`HOW_THIS_WORKS.md`](HOW_THIS_WORKS.md).

## Shipping changes

```powershell
# Bump version in Code.js, update CONTEXT.md change log + AUDIT_TRAIL.md FIRST, then:
.\ship.ps1 -App ingestion -Message "Ingestion v2.56: short summary"
.\ship.ps1 -App viewer    -Message "Viewer v2.44: short summary"
.\ship.ps1 -App both      -Message "short summary"
```

`ship.ps1` runs clasp push for the chosen app(s), auto-stamps the version table
in `HOW_THIS_WORKS.md`, then commits and pushes to GitHub. Viewer changes also
need an Apps Script redeploy (pencil → New version → Deploy). Ingestion is
push-only.

## Status

Active personal project. Not licensed for redistribution.
