# Refinery — Development Process

This is the actual workflow as practiced. Claude Code does everything end to end:
edit → version bump → docs → clasp push → git commit/push → (Viewer only) redeploy.
The **audit trail is the memory** — the chat is disposable.

---

## 1. Architecture (what you're working on)

| Piece | Where | Notes |
|-------|-------|-------|
| **Ingestion** app | `Ingestion/Code.js` (Apps Script) | Pulls The Old Reader RSS + Gmail → Supabase. Runs on time triggers. **Push-only, no deploy step.** |
| **Viewer** app | `Viewer/Code.js` + `Viewer/index.html` (Apps Script web app) | Reads Supabase, renders the reader UI. **Push AND redeploy.** |
| Supabase | cloud Postgres + REST | `articles` table. Anon key is in the code (RLS-gated). |
| The Old Reader | cloud RSS | Auth token in the code. Folders → categories. |
| Google Drive | cloud | Email artifacts. Untouched by article purges. |
| GitHub | `github.com/moltoboto/Refinery` | Branch: **`main`** (default). `master` deleted 2026-05-10. |

Everything except the local working copy is cloud-side. Moving machines = `git clone` + re-auth clasp/gh. Nothing else.

---

## 2. The Loop (every change)

1. **Read first.** CONTEXT.md (current versions + change log), then the most recent AUDIT_TRAIL.md entries (why decisions were made). Then the relevant Code.js section before editing.
2. **Edit** the code.
3. **Bump the version** (see §3 — Viewer needs it in 5 places, Ingestion 1).
4. **Update CONTEXT.md** — add a row to the top of the Change Log table.
5. **Append AUDIT_TRAIL.md** — new entry at the TOP, matching the format of recent entries: Request / Root cause / Fix / Files touched / Deployment / Follow-up. Be specific; future sessions read this to avoid re-discovering solved problems.
6. **clasp push** the app(s) touched.
7. **git commit + push.**
8. **Viewer only:** redeploy in Apps Script (pencil → New version → Deploy). Ingestion has no deploy step — push is live on next trigger.

Order matters: docs before commit so the commit captures them.

---

## 3. Version Bump Locations

**Ingestion** — 1 place:
- `Ingestion/Code.js` header: ` * Version: 2.XX`

**Viewer** — 5 places (all must match or the UI shows the wrong version):
- `Viewer/Code.js` header comment: `Viewer v2.XX`
- `Viewer/Code.js` `setTitle('Refinery V2.XX')`
- `Viewer/index.html` `<title>Refinery V2.XX</title>`
- `Viewer/index.html` logo text (×2 occurrences of `Refinery V2.XX`)

Bulk replace `V2.XX` in index.html catches all three there.

---

## 4. Deploy Rules

- **Ingestion:** `clasp push` only. It runs via time triggers, not as a web app. No deploy step. Ever.
- **Viewer:** `clasp push` **then** Apps Script → pencil icon on the active deployment → **New version** → Deploy. Same URL is preserved (no bookmark change). Until you redeploy, the live URL serves the OLD version even though clasp pushed.

Quota note: Apps Script UrlFetchApp ≈ 20,000 calls/day. Resets midnight Pacific. Don't run ingestion many times/hour.

---

## 5. Cross-Machine / Session Handoff

The audit trail makes the conversation disposable. To continue on any machine:

```
git clone https://github.com/moltoboto/Refinery.git
cd Refinery
npx --yes @google/clasp login    # sign in as moltoboto@gmail.com
gh auth login                    # as moltoboto
```

Then launch Claude Code in the folder and paste the block from HANDOFF_PROMPT.md.
It reads CONTEXT.md + AUDIT_TRAIL.md and is fully oriented — same as the previous session.

**Branch gotcha (resolved 2026-05-10):** GitHub default was `master` (13 months stale). All work is on `main`, now the default. `master` deleted. If a clone ever looks ancient, check `git branch` — you want `main`.

**Two machines rule:** never edit the same file from two machines/accounts at once. Last writer wins; the other's read goes stale silently. Commit + push before switching.

---

## 6. Session-Start Prompt

Canonical copy lives at the top of `HANDOFF_PROMPT.md`. Paste it into a fresh Claude Code session. It instructs: read CONTEXT.md, read recent AUDIT_TRAIL.md, read code before editing, the push/deploy commands, and the doc-update order.

---

## 7. The Ship Script

`ship.ps1` automates steps 6–7 of the loop (clasp push + git add/commit/push) so they're one command instead of many. It does NOT bump versions or write docs — that's deliberate, those require judgment. Usage:

```powershell
.\ship.ps1 -App ingestion -Message "v2.46: <summary>"
.\ship.ps1 -App viewer    -Message "Viewer v2.30: <summary>"
.\ship.ps1 -App both      -Message "<summary>"
```

After `ship.ps1` for the Viewer, you still must redeploy in Apps Script manually.

---

## 8. What Never Changes Without Explicit Instruction

- Supabase / TOR credentials
- `normalizeCategory()` precedence (Duplicate guard → sheet override → source map → TOR folder → URL → keyword)
- `cleanUrl()` logic
- `sanitizeRecord()` field limits / article schema column order
- The dedup pipeline order in the TOR loop

If a change touches these and wasn't asked for, stop and confirm.
