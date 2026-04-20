# Refinery - Development Process

## The Core Files You Always Need
| File | Where it lives | Purpose |
|------|---------------|---------|
| `CONTEXT.md` | Google Drive / Claude Project | Project brain - read before every session |
| `AUDIT_TRAIL.md` | Google Drive / Claude Project | Session log - read recent entries before every session |
| `RefineryV2 Ingestion.json` | Google Drive | Current ingestion app (clasp export) |
| `RefineryV2 Viewer.json` | Google Drive | Current viewer app (clasp export) |

**Rule: Always work from the latest exported .json files. Never edit from memory.**

---

## Before You Start Any Session

1. Export current code from Apps Script to Drive via clasp:
   ```
   clasp pull   (run in each app folder)
   ```
2. Open CONTEXT.md - read On the Horizon and Change Log
3. Open AUDIT_TRAIL.md - read the most recent entries
4. Know exactly what you are changing and in which app before opening any LLM

---

## Process by Platform

---

### Claude Code (CLI) - Full local editing + git push
**Best for:** Multi-file changes, git operations, reading/writing local files directly

1. Open Claude Code in `C:\Users\exact\Refinery\`
2. Claude reads CONTEXT.md and AUDIT_TRAIL.md automatically from the working directory
3. State the task — Claude reads the relevant files before changing anything
4. Review changes in the terminal diff before committing
5. Claude commits and pushes to `origin/main` via `gh`-authenticated git
6. On version bump: Claude updates CONTEXT.md and AUDIT_TRAIL.md before the commit

**Git quick reference (run from `C:\Users\exact\Refinery\`):**
```bash
git status                    # what changed
git diff                      # see changes
git pull                      # sync from GitHub before starting
git add -p                    # stage selectively
git commit -m "v2.X - summary"
git push                      # push to origin/main
```

**Switching from Codex to Claude Code:**
- Make sure Codex pushed to GitHub first
- Run `git pull` in `C:\Users\exact\Refinery\` to get latest
- Then start your Claude Code session

**Switching from Claude Code to Codex:**
- Claude Code will commit and push before closing
- In Codex, download the latest files from GitHub before starting

---

### Claude (claude.ai) - Planning, Architecture, Debugging Logic
**Best for:** Designing changes, debugging tricky logic, updating CONTEXT.md

1. Open the Personal Knowledge-base Project from the sidebar
2. Upload the relevant .json file (Ingestion or Viewer - not both unless needed)
3. State the task clearly: "I want to fix X in the Ingestion app"
4. Review the proposed change before accepting it
5. Download the updated file
6. On version bump: update CONTEXT.md change log here before closing
7. Append an AUDIT_TRAIL.md entry before closing any substantive session

---

### Codex (chatgpt.com) - Code Changes
**Best for:** Writing and editing .gs and .html code

1. Start a new Codex session
2. Upload `CONTEXT.md` first - always
3. Upload `AUDIT_TRAIL.md`
4. Upload only the specific .json file you are changing
5. Paste this at the top:
   > "You are working on Refinery. Read CONTEXT.md and AUDIT_TRAIL.md before touching anything.
   > Do not modify anything in the Do Not Touch section.
   > Today's task: [YOUR TASK HERE]"
6. Review every change before accepting - check the diff
7. Ask Codex: "What exactly did you change?" before downloading
8. Download the updated file

**Codex-specific rules:**
- Never let Codex push directly to Apps Script
- Always download, review, then push manually via clasp
- If Codex makes unexpected changes, reject and start over with a narrower prompt
- Append an AUDIT_TRAIL.md entry after every substantive session

---

### GitHub Copilot (VS Code) - Inline Editing
**Best for:** Small targeted edits when you have the code open locally

1. Save `CONTEXT.md` as `.github/copilot-instructions.md` in the repo - Copilot reads it automatically
2. Open only the file you are editing
3. Use Copilot Edits panel (not Chat) for multi-line changes
4. Use `#file` to scope context: "Looking at #Code.gs, fix the dedup logic"
5. Review the diff before accepting
6. Push via clasp after accepting
7. Append an AUDIT_TRAIL.md entry before closing any substantive session

---

### Gemini - Review and Cross-App Analysis
**Best for:** Reviewing logic across both apps, spotting inconsistencies

1. Upload both .json files + CONTEXT.md + AUDIT_TRAIL.md
2. Good for: "Does the category logic in the ingestion app match what the viewer expects?"
3. Do not use for direct code edits - use for review only, then hand off to Codex or Claude

---

## After Making Changes

### If it is a minor fix (no version bump):
- Push via clasp
- Test in Apps Script editor (run the relevant function, check logs)
- Append an entry to AUDIT_TRAIL.md
- No CONTEXT.md version update needed

### If it is a real change (version bump):
1. Bump version number in the comment header of Code.gs
   - Example: `Version: 2.5` -> `Version: 2.6`
2. Export via clasp: `clasp push` -> verify in Apps Script editor
3. Deploy:
   - **If existing deployment works:** Deploy -> Manage -> pencil -> New version -> Deploy
   - **If deployment is broken:** Deploy -> New Deployment -> Web App -> copy new URL -> update bookmark
4. Test the live URL
5. Update CONTEXT.md change log: version, date, tool, one-line summary
6. Append an entry to AUDIT_TRAIL.md with files touched, validation, and deployment status
7. Save updated CONTEXT.md and AUDIT_TRAIL.md to Drive

---

## Deployment Decision Tree

```
Did the change break the live URL?
|- No -> Add new version to existing deployment
\- Yes -> Create New Deployment -> update bookmark -> note new URL in CONTEXT.md
```

---

## Clasp Quick Reference

```bash
# Pull latest from Apps Script to local
clasp pull

# Push local changes to Apps Script
clasp push

# Open the script in browser
clasp open
```

Each app needs its own folder with its own `.clasp.json` pointing to the correct Script ID.
Never run clasp commands from the wrong folder.

---

## What Never Changes
- Supabase credentials
- `normalizeCategory()` logic
- `cleanUrl()` logic
- `sanitizeRecord()` field limits
- The article schema column order

If any LLM touches these without being asked, reject the change.
