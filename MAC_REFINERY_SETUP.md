# Working on Refinery from a Mac

Everything Refinery touches is an **internet service** (GitHub, Google Apps Script, Supabase). Nothing depends on the NAP corporate network — so an off-NAP Mac with internet works fine, and it's actually simpler (no corporate TLS proxy to fight, unlike the Windows machine).

You do **not** need to copy the project files from the Windows machine — they all live on GitHub. You only re-authenticate two services and (optionally) bring the Claude skills.

---

## What Refinery is (the moving parts)

- **Two Google Apps Script apps**, each a folder in the repo:
  - `Viewer/` — the reading app (the web app you open on laptop/iPad). scriptId in `Viewer/.clasp.json` → `1Na5c5jrQuul76Fx91o2mUmhar4qc-gDKL9a1hxYuW4xaOYaNFm5AFz8e`
  - `Ingestion/` — pulls articles/email into the database on a schedule. scriptId in `Ingestion/.clasp.json` → `1qgbbj4bE00dNGLYbJdAZ32JrXg3H1QVSkieTFjVn4WKXYkWphfLO80jU`
- **Supabase** — the database (Postgres). Keys are already in the repo code (anon key).
- **GitHub** — `https://github.com/moltoboto/Refinery.git` — source of truth.
- Tooling: **git**, **clasp** (pushes code to Apps Script), **node** (for quick syntax checks).

---

## One-time Mac setup

### 1. Install prerequisites
```bash
# Node (includes npm) — via Homebrew
brew install node
# clasp (Google Apps Script CLI)
npm install -g @google/clasp
# GitHub CLI (easiest auth) — optional but recommended
brew install gh
```

### 2. Authenticate the two services (these are logins, not file copies)
```bash
clasp login        # opens a browser — sign in as the Google account that OWNS the Viewer + Ingestion Apps Script projects
gh auth login      # GitHub auth (or use a Personal Access Token)
```

### 3. Clone the repo
```bash
cd ~
git clone https://github.com/moltoboto/Refinery.git
cd Refinery
```
That's it — the `.clasp.json` files (scriptIds), Supabase keys, and all docs come with the clone.

### 4. Sanity check
```bash
node --check Viewer/Code.js          # should print nothing (= OK)
git -C ~/Refinery status             # clean
```

---

## Daily workflow

**Canonical folder on the Mac:** `~/Refinery` (run all git/clasp against it).

- **Edit** files in `~/Refinery/Viewer` or `~/Refinery/Ingestion`.
- **Push code to Apps Script:**
  ```bash
  cd ~/Refinery/Viewer && clasp push --force      # or Ingestion/
  ```
- **Test the Viewer:**
  - **`/dev` URL** — serves the latest pushed code instantly **while signed into the owner Google account** (use this on the Mac to iterate fast, no redeploy).
  - **`/exec` URL** (published, what the iPad uses) — only updates after a **redeploy**: Apps Script editor → Deploy → Manage deployments → pencil → **New version → Deploy** (keeps the URL).
- **Ingestion** needs **no deploy step** — it runs on time triggers that pick up new code on the next run after `clasp push`.
- **Commit + push to git** when a change is good:
  ```bash
  git -C ~/Refinery add -A && git -C ~/Refinery commit -m "..." && git -C ~/Refinery push origin main
  ```
  (No `http.sslBackend schannel` hack here — that was a Windows/NAP-proxy workaround.)

---

## Secrets — nothing to move

- **Gemini API key** (powers Summarize) lives in **Apps Script → Project Settings → Script Properties** as `GEMINI_API_KEY`. That's stored in the cloud project, not the repo — so it's already there, no transfer needed.
- **Supabase keys** are in the repo code (anon key) — present after clone.
- Do **not** copy `~/.clasprc.json` from Windows; just run `clasp login` fresh on the Mac.

---

## Claude Code on the Mac (optional, makes the assistant consistent)

The Refinery playbook lives in two places, both already set up:

- The **`refinery`** skill is in your **shared Claude config** — `CLAUDE_CONFIG_DIR` points at `…/[03] AI/claude-config/.claude/skills/refinery/`, which syncs to **both** the Lenovo and the Mac via OneDrive. It is now **OS-aware**: it refers to the repo as `~/Refinery`, which resolves to `/Users/thomascala/Refinery` on the Mac and `C:\Users\ThomasCala\Refinery` on the Lenovo. No per-machine edit needed.
- The **`refinery-sop`** skill lives **inside this repo** at `.claude/skills/refinery-sop/`, so it travels with GitHub. It uses the same `~/Refinery` convention.
- **Worktree note:** the Claude Code **desktop app** creates a git worktree per session (same on Mac as Windows) — so work against the canonical `~/Refinery` via absolute paths. The **CLI** does not create worktrees, so it's simpler if you use it.
- Project memory (under the config dir's `projects/...`) syncs via OneDrive too; nothing to copy.

---

## Shipping discipline (unchanged from Windows)

Follow the **`refinery-sop`** skill for any real change: bump the version strings, `clasp push`, redeploy the Viewer, add an `AUDIT_TRAIL.md` entry, update `CONTEXT.md`, and `git push`. Never ship without the audit-trail entry.

---

## Quick reference

| Need | Command / location |
|------|--------------------|
| Clone | `git clone https://github.com/moltoboto/Refinery.git` |
| Push Viewer | `cd ~/Refinery/Viewer && clasp push --force` |
| Push Ingestion | `cd ~/Refinery/Ingestion && clasp push --force` |
| Redeploy Viewer (`/exec`) | Apps Script → Deploy → Manage deployments → pencil → New version → Deploy |
| Gemini key | Apps Script → Project Settings → Script Properties → `GEMINI_API_KEY` |
| Versions | `Viewer/Code.js` line 1; `Ingestion/Code.js` line 4 |
| Logbook | `AUDIT_TRAIL.md` (newest at top), `CONTEXT.md` (state + changelog) |
