---
name: refinery-sop
description: Onboarding for Refinery work — the GitHub setup, the audit-trail discipline, and the end-to-end SOP for shipping a change. Trigger whenever the user starts a Refinery session, says "/refinery-sop", or asks "how does Refinery work / how do I ship a change / what's the audit trail rule".
---

# Refinery — Standard Operating Procedure

Refinery is a personal news reader: two Google Apps Script apps (Viewer + Ingestion) talking to Supabase. The full project state lives in three docs at the repo root; this skill teaches you the workflow around those docs.

## Machine note (dual-machine: Lenovo + Mac, synced via GitHub)

The repo is worked on from both a Lenovo (Windows) and a Mac. **Always refer to the working copy as `~/Refinery`** — through the Bash tool, `~` resolves to `C:\Users\ThomasCala\Refinery` on the Lenovo and `/Users/thomascala/Refinery` on the Mac. Use `~/Refinery` and forward slashes in every command; do not hardcode an absolute or `C:\` path.

## 0. Read these FIRST — every session, in this order

```
~/Refinery/CONTEXT.md       # durable state, version, gotchas, change log
~/Refinery/AUDIT_TRAIL.md   # running session log — read the top entries
~/Refinery/PROCESS.md       # current workflow (rewritten 2026-05-10)
```

Then read the relevant `Code.js` section before editing anything. Do not work from memory.

## 1. GitHub setup

- **Repo:** https://github.com/moltoboto/Refinery — **GitHub is the source of truth.** `~/Refinery` is the working copy on each machine.
- **Default branch:** `main`. **Do NOT use `master`** — it's been deleted from origin (was 13 months stale at ~v2.8). If you ever see v2.8/v2.8 and no 2026-05-09 HOLD marker in the audit trail, you're reading the wrong branch — stop and run `git checkout main`.
- **Auth:** gh CLI authenticated as `moltoboto` (HTTPS). If `git push` fails with auth errors on a new machine, install gh (`brew install gh` on Mac / `winget install --id GitHub.cli` on Windows) then `gh auth login` (GitHub.com / HTTPS / moltoboto).
- **Identity:** git's automatic committer name/email may not be `moltoboto` — that's fine. GitHub attributes the push to whoever gh is authenticated as. Do **not** amend commits just to fix the committer email.
- **Windows-only TLS:** on the Lenovo the corporate proxy needs `git config --global http.sslBackend schannel` and `http.schannelCheckRevoke false` (one-time). On the Mac, do not set these — git uses the macOS keychain.
- **Never put the working copy inside OneDrive.** OneDrive silently emptied the folder on 2026-05-23. Keep `~/Refinery` in the home dir, out of any synced cloud folder; GitHub is the sync mechanism between machines.
- **Branch hygiene:** `git -C ~/Refinery pull --rebase origin main` at the start of any session if another machine may have pushed. Never force-push to main.

## 2. The audit trail rule

`AUDIT_TRAIL.md` is the single most important durable artifact. If it's wrong or missing entries, future sessions rediscover bugs that were already fixed.

**Where new entries go:** at the **top** of the file, directly under the `## Entries` header, above the previous newest entry. Newest first.

**Format** — match the recent entries (last ~10 in the file):

```
### YYYY-MM-DD - Claude Code (Component vX.Y — short summary)
- Request: what the user asked for
- Root cause / context: why this needed to happen (skip if obvious)
- Fix: what you changed, specifically
- Files touched: comma-separated paths relative to repo root
- Deployment: clasp push DONE / Apps Script redeploy required / docs-only / etc.
- Follow-up: anything left open
```

For non-version-bump work (docs, refactors, infra), use a short tag in the header instead of `vX.Y`, e.g. `docs — machine migration` or `process docs + ship script + branch cleanup`.

**Date convention:** the file dates entries by calendar day, not commit time. Multiple entries on the same date are normal — list newest-first within the day.

**Never:** rewrite historical entries. Paths and details in old entries describe state at the time and are intentionally preserved even when the project moves (e.g. old `C:\Users\…` paths in pre-2026-05-10 entries stay as written).

## 3. The SOP loop — every meaningful change

In this order, no shortcuts:

1. **Bump the version** in the file header. Locations:
   - Ingestion: **1 place** — `Ingestion/Code.js` header comment `Version: X.Y`
   - Viewer: **5 places** — `Viewer/Code.js` header comment + `setTitle('Refinery V2.X')` (~line 26), AND `Viewer/index.html` `<title>` tag + 2 occurrences of `Refinery V2.X` in sidebar/header. Missing any one causes the visible version to be wrong.

2. **Add a row to `CONTEXT.md` Change Log** at the top of the table. Format: `| vX.Y | YYYY-MM-DD | Claude Code | one-line summary |`.

3. **Append a new entry to the top of `AUDIT_TRAIL.md`** using the format above. Be specific — these are read cold by future sessions.

4. **clasp push** the affected app(s):
   ```
   cd ~/Refinery/Ingestion && npx --yes @google/clasp push
   cd ~/Refinery/Viewer    && npx --yes @google/clasp push
   ```
   - **Ingestion: push-only.** Runs via time triggers; new code picked up next run automatically.
   - **Viewer: push + redeploy.** Must redeploy in Apps Script: Deploy → Manage deployments → pencil icon → **New version** → Deploy. Keeps the same URL. The pushed code is NOT live until redeploy.
   - First-time on a machine: `npx --yes @google/clasp login` as moltoboto@gmail.com.

5. **git commit + push:**
   ```
   git -C ~/Refinery add -A
   git -C ~/Refinery commit -m "vX.Y: short summary"
   git -C ~/Refinery push origin main
   ```

There's a cross-platform helper script at the repo root: `~/Refinery/ship.sh ingestion|viewer|both "message"` (bash; works on Mac + Lenovo). `ship.ps1` is the Windows-PowerShell equivalent. Both automate step 4 + step 5 but deliberately do NOT do steps 1–3 (those need judgment).

## 4. The "Do Not Touch" list

From CONTEXT.md, confirm before touching any of these:
- Supabase credentials in CONFIG
- `normalizeCategory()` pipeline (fragile)
- `cleanUrl()` tracking-param stripping (dedup-critical)
- `sanitizeRecord()` field limits
- Historical AUDIT_TRAIL.md entries

If any change touches these, surface it explicitly and confirm before editing.

## 5. Cross-machine handoff

This project is worked on from more than one machine (Lenovo + Mac). Before starting:
- `git -C ~/Refinery pull --rebase origin main` to absorb any commits from the other machine.
- If AUDIT_TRAIL.md conflicts on rebase (both sides inserted a new top entry): keep both, newest-first, both above the previous newest entry. Adjust dates if the user specifies.

After finishing:
- Always `git push` before closing. The other machine starts from origin/main.

## 6. Common pitfalls

- **Reading stale branch.** Symptom: docs say v2.8 / no recent audit entries. Fix: `git checkout main`.
- **Viewer changes don't appear in browser.** You pushed but didn't redeploy in Apps Script. Step 4 redeploy is mandatory for Viewer.
- **Version shows wrong in Viewer UI.** You only bumped some of the 5 Viewer locations. Grep for the old version string before declaring done.
- **Skipped audit entry.** If you bumped a version without writing an audit entry, the next session will not know why the change exists. The audit entry is more important than the commit message.
