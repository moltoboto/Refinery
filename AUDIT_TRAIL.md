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
