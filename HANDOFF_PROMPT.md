# Refinery - Session Handoff Prompt

Use this at the start of any session with any LLM (Claude Code, Codex, Copilot, Gemini, etc.)

---

## WHERE EVERYTHING LIVES

### Local files (P16 — ~/Refinery/)
```
~/Refinery/
  ├── Viewer\          → Apps Script Viewer app (Code.js, index.html, appsscript.json, .clasp.json)
  ├── Ingestion\       → Apps Script Ingestion app (Code.js, appsscript.json, .clasp.json)
  ├── CONTEXT.md       → Project brain — read first every session
  ├── AUDIT_TRAIL.md   → Session log — read recent entries before starting
  ├── HANDOFF_PROMPT.md → This file
  ├── PROCESS.md       → Workflow and deployment rules
  ├── RefineryV2 Viewer.json    → Snapshot of Viewer for Codex uploads
  └── RefineryV2 Ingestion.json → Snapshot of Ingestion for Codex uploads
```

### GitHub (moltoboto)
- Repo: https://github.com/moltoboto/Refinery
- Default branch: `main` (use this — `master` is legacy)
- Auth: gh CLI authenticated as moltoboto (HTTPS, keyring) on P16
- Push after every version bump: `git add -A && git commit -m "vX.Y - summary" && git push`
- Pull before starting if another tool was used last: `git pull`

### Google Drive (moltoboto@gmail.com)
- Refinery folder: `1Ue36DjRLySHJ4jQvsSYQuRmtoor9BkJL`
- Artifacts folder: `1eO6n6MQKF7_cCwulGxhDkzrxT772M-Iz`
- Working docs live here (manually uploaded after edits): CONTEXT.md, AUDIT_TRAIL.md, HANDOFF_PROMPT.md, PROCESS.md, RefineryV2 Viewer.json, RefineryV2 Ingestion.json

### Apps Script (script.google.com — moltoboto@gmail.com)
- Viewer script ID: `1Na5c5jrQuul76Fx91o2mUmhar4qc-gDKL9a1hxYuW4xaOYaNFm5AFz8e`
- Ingestion script ID: `1qgbbj4bE00dNGLYbJdAZ32JrXg3H1QVSkieTFjVn4WKXYkWphfLO80jU`

### Push commands
```bash
cd ~/Refinery/Ingestion && npx --yes @google/clasp push
cd ~/Refinery/Viewer    && npx --yes @google/clasp push
```
Viewer changes also need an Apps Script redeploy (pencil → New version → Deploy).
Ingestion is push-only, no redeploy needed.

**Note: Codex cannot push directly to Apps Script or edit Google Drive files.
Claude Code (this tool) pushes via clasp. Working docs must be manually uploaded to Google Drive.**

---

## SESSION HEALTH CHECK (run first — established 2026-05-23)

Before any work, verify the working folder hasn't been silently emptied (this happened
on 2026-05-23, while the working folder still lived in OneDrive — OneDrive kept the
folder shells but the file contents were gone, so the Claude project loaded blank.
The project was moved out of OneDrive on 2026-05-23; this check guards against any
repeat). Three quick checks:

```bash
# 1. File count and key files present
ls Ingestion/Code.js Viewer/Code.js Viewer/index.html CONTEXT.md AUDIT_TRAIL.md

# 2. Versions from each Code.js header — this is ground truth
sed -n '4p' Ingestion/Code.js    # should say   * Version: 2.XX
head -1 Viewer/Code.js           # should say   // REFINERY - ... - Viewer v2.XX

# 3. Git in sync with origin/main
git fetch origin && git status -sb
```

Expected: all five files exist, the version markers report current values (Ingestion
line 4 ` * Version: 2.XX`, Viewer line 1 `// ... Viewer v2.XX`), and `git status` shows
`## main...origin/main` with no `behind` count.

If anything fails: do NOT start editing. Restore from GitHub first:

```powershell
# If working folder is blank/missing files — re-clone fresh:
git clone https://github.com/moltoboto/Refinery.git ~/Refinery
# If just behind origin:
cd ~/Refinery && git pull origin main
```

Then re-run the three checks before continuing.

**Also re-run these checks 3-5x per session** — on the same cadence as your commits
to GitHub. They're 10 seconds and they catch corruption early.

---

## HOW TO START A SESSION

1. Read `CONTEXT.md` fully — current version, file map, gotchas, change log
2. Read the 2 most recent entries in `AUDIT_TRAIL.md`
3. Read the relevant local code file(s) before making any changes
4. State what you are changing and in which app before writing any code

---

## PASTE THIS TO START ANY CLAUDE SESSION

```
You are working on Refinery, a personal news reader built on Google Apps Script + Supabase.

Source files at ~/Refinery/
- Viewer app:    ~/Refinery/Viewer
- Ingestion app: ~/Refinery/Ingestion
- Working docs:  ~/Refinery/

Before doing anything:
  0. HEALTH CHECK — verify the folder isn't blank and git is current:
       ls Ingestion/Code.js Viewer/Code.js Viewer/index.html CONTEXT.md AUDIT_TRAIL.md
       sed -n '4p' Ingestion/Code.js   # should say   * Version: 2.XX
       head -1 Viewer/Code.js          # should say   // ... Viewer v2.XX
       git fetch origin && git status -sb
     If anything's missing or git is behind, restore from GitHub before editing.
     Re-run this check 3-5x per session on the same cadence as your commits.
  1. Read CONTEXT.md (current version + change log)
  2. Read the 2 most recent entries in AUDIT_TRAIL.md — this is the running
     project journal. Recent entries show why decisions were made, not just
     what changed. Skim further back if a topic isn't obvious.
  3. Read the relevant Code.js section before editing

Push commands:
  cd ~/Refinery/Ingestion && npx --yes @google/clasp push
  cd ~/Refinery/Viewer    && npx --yes @google/clasp push
  Viewer ALSO needs Apps Script redeploy (pencil → New version → Deploy).
  Ingestion is push-only, no deploy step.

After every meaningful change — IN THIS ORDER:
  1. Bump version in the file header (Ingestion `Version: X.Y` line, Viewer
     bumps version in 5 places — see CONTEXT.md gotchas, or PROCESS.md §3).
  2. Add a row to the CONTEXT.md Change Log (top of the table).
  3. Append a new entry to the TOP of AUDIT_TRAIL.md (above the previous
     entry). Match the format of the 2-3 most recent entries: header line
     `### YYYY-MM-DD - Claude Code (vX.Y)`, then bullets covering Request,
     Root cause / context, Fix(es), Files touched, Deployment, Follow-up.
     Be specific — these entries are read by future sessions to understand
     why something is the way it is.
  4. clasp push (Viewer also needs redeploy).
  5. git add -A && git commit -m "vX.Y: short summary" && git push

If the change closes a BACKLOG.md item, move it to the Done section.

The audit trail is the single most important durable artifact. If the trail
is wrong or missing, future sessions will rediscover bugs that were already
fixed and intent that was already decided.

Today's task: [DESCRIBE TASK HERE — or pick from BACKLOG.md]
```

---

## SWITCHING BETWEEN CLAUDE ACCOUNTS (Pro ↔ Team)

Both accounts share this machine's filesystem, git config, clasp auth, and browser
sessions — no setup needed. Just:

1. In claude.ai sidebar, switch from one account to the other.
2. Open a fresh Claude Code chat in the new account.
3. Paste the block above as the first message.

The new chat will read CONTEXT.md and the latest AUDIT_TRAIL.md entries and pick
up exactly where the previous account left off. Both accounts can edit files,
run clasp, and push to GitHub on this same project — the only thing that changes
is which Claude conversation is remembering it.

**Avoid:** running edits from both accounts simultaneously on the same file. The
last writer wins and the other account won't know its read was stale.

---

## END OF SESSION CHECKLIST

### Every session:
- [ ] Append entry to AUDIT_TRAIL.md (request, files touched, actions, validation, follow-up)
- [ ] Commit and push to GitHub: `git add -A && git commit -m "vX.Y - summary" && git push`
- [ ] Regenerate JSONs if code changed: `node` script combining local files into JSON format
- [ ] Manually upload changed docs + JSONs to Google Drive Refinery folder

### On version bump — update ALL THREE locations or the viewer shows the wrong version:
- [ ] `Ingestion/Code.js` — header comment: `Version: 2.X`
- [ ] `Viewer/Code.js` — header comment AND `setTitle('Refinery V2.X')` (~line 26)
- [ ] `Viewer/index.html` — `<title>` tag + 2 occurrences of `Refinery V2.X` in sidebar/header
- [ ] Add row to CONTEXT.md Change Log
- [ ] Deploy → Manage Deployments → pencil icon → **New version** → Deploy (keeps same URL, no bookmark change)

### Switching tools:
- **Codex → Claude Code:** make sure Codex pushed to GitHub, then `git pull` in `~/Refinery/`
- **Claude Code → Codex:** Claude Code pushes to GitHub; download latest files from GitHub in Codex

---

## TOOL-SPECIFIC NOTES

**Claude Code (claude.ai/claude-code):**
- Can read/edit local files directly, run clasp push, and push to GitHub via gh CLI (moltoboto)
- Cannot edit Google Drive files directly — upload manually after session
- Has browser automation (MCP) but click/screenshot tools are unreliable on P16
- Always run `git pull` at session start if Codex was used last

**Codex (chatgpt.com):**
- Upload CONTEXT.md + AUDIT_TRAIL.md + the relevant JSON file
- Cannot push to Apps Script — download output and push manually via clasp
- Cannot update Google Drive files — do it manually
- Always ask "What exactly did you change?" before accepting output
- Verify changes in Apps Script editor after every Codex session

**GitHub Copilot (VS Code):**
- Save CONTEXT.md as `.github/copilot-instructions.md` — Copilot reads it automatically
- Use Copilot Edits panel (not Chat) for multi-line changes

**Gemini:**
- Good for reviewing logic across both apps — upload both JSONs + CONTEXT.md
- Do not use for direct edits — review only, then hand off to Codex or Claude Code
