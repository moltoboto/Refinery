# Refinery - Backlog

Operational queue of work not yet scheduled. Promote items to a session by moving them out of here and into a Code.js change with audit trail entry.

## How to use this file
- New items get added to **Active** at the top.
- When started, leave the item here until done — then delete the row and write the audit entry.
- **Held** = waiting on something (data, user decision, etc.).
- **Horizon** = directional, no near-term plan.

---

## Active (raised this session, 2026-05-17)

| # | Item | Est. | Notes |
|---|------|------|-------|
| 1 | **Full article in reading pane** | 1–2 sessions | Easy path: capture `<content:encoded>` from RSS into new `content_html` column, render in reading pane. Hard path: on-demand fetch+extract for paywalled/teaser feeds (Motley Fool, Seeking Alpha, NYT). Re-uses `enrichArticleFromUrl()` infrastructure (currently disabled in v2.34). |
| 2 | **GitHub Models API for Summarize** | 1–2 sessions | Replace current Summarize button logic with GH Models API call (gpt-4o or Claude). Wire `UrlFetchApp` to GH Models endpoint with user's token. Watch rate limits (~50 req/day personal). |
| 3 | **iPad 11" — tune right gutter** | <30 min | Tested 2026-05-18 on 11" iPad. 280px right gutter felt off. Need to test on 12.9" iPad (user has one at current location) then settle on viewport-relative sizing — possibly `clamp()` or different value for narrow vs wide iPad. |
| 3a | **iPad — "trapped" when clicking ↗ View** | 1–2 hrs | Per-card ↗ icon (from v2.14) uses `<a target="_blank">`. Confirmed behavior: on Windows it opens a new window (fine — Alt-Tab back). **On iPad it replaces the current screen** — no new tab spawns, and there's no obvious way back to Refinery without re-navigating to the bookmarked URL. Root cause: Apps Script serves the Viewer in an iframe sandbox; iPad Safari handles `target="_blank"` from inside an iframe by navigating in-place rather than opening a new tab. Possible fixes: (a) JS click handler using `window.open(url, '_blank')` from a user gesture (sometimes bypasses the iframe constraint on Safari), (b) detect iPad and show an explicit modal with "Open in new tab" intent, (c) add a persistent floating "← Refinery" badge so users always have a way back, (d) Apps Script `setSandboxMode` adjustments. Test each on iPad before committing. |
| 4 | **Resize-handle cleanup** | <30 min | Drag handles from v2.28 still show when Reading is off. They conflict with the fixed-gutter layout from v2.32–33. Likely just remove them. |
| 5 | **Finance feed curation in `subscriptions.opml`** | <1 hour | Decide which Finance feeds to keep: Yahoo Finance, MarketWatch, CNBC Mad Money, Seeking Alpha, Motley Fool, Fox Business. Remove unwanted ones, re-import OPML into TOR. |
| 7 | **Verify v2.35 mark-read fixes** | observation | First post-quota-reset run should log `DEDUP CACHE: warmed ~2000` and `TOR: marked X/500 as read (10 batches)`. Subsequent run should return far fewer articles. |
| 8 | **Re-import OPML into TOR** | user action | Google News removed from subscriptions.opml but TOR still has it. Import to drop. |
| 9 | **N/P keyboard nav in artifact view** | ~20 min | N/P already navigate articles in the list pane but explicitly bail when `artView === true` (Viewer/index.html line ~2162). Fix: branch in `navigate(dir)` — when in artifact view, walk the ARTIFACTS array and call `selectArtifact(id)` instead. Infrastructure (ARTIFACTS list, selectedArtifact, selectArtifact) all already exists. |

## Deferred (planned, but waiting on a follow-up)

| # | Item | Trigger |
|---|------|---------|
| H1 | **Claude Design review of header + nav rail** | DONE 2026-05-18 — Claude Design delivered the v3.0 redesign package (see H2). Original brief at [design/ipad-header-redesign-brief.md](design/ipad-header-redesign-brief.md). |
| H2 | **v3.0 visual rewrite (Claude Design package)** | After v2.34 has been tested on iPad and we're confident the chip system / iconized nav approach works. Package delivered at [design/claude-design-v3/](design/claude-design-v3/) with 1024-line styles.css (drop-in mostly unchanged), all 11 chip icons + 10 category SVGs in icons.jsx, detailed Apps Script implementation notes in README.md. **Phase 1 (visual only):** ~3 sessions / 15–20 hrs — paste CSS, inline SVG icons, rewrite header/rail/list/reading-pane HTML, add bottom keyboard-hint footer, single state object with localStorage, add IBM Plex Mono via Google Fonts. Use placeholder data for fields not in schema (author, image_url, read_progress). **Phase 2 (backend gaps):** ~1–2 sessions — new Supabase columns (author, image_url, read_later, read_progress), Ingestion captures from RSS, Viewer endpoints to toggle. **Phase 3 (defer):** Kept view grid, mobile patterns, add-source buttons, multi-tag display. Risk: uses `oklch()` colors — use the README's sRGB hex fallbacks as primary values for safety on older Safari. |

## Held (waiting on data or decisions)

| # | Item | Waiting on |
|---|------|------------|
| 9 | **Dedup diagnostic — manual cluster review** | User screenshots of "search by entity" results to identify dedup misses. Approach: search known recurring topics in Viewer, screenshot the result list, evaluate whether dedup should have collapsed any of them. |
| 10 | **Dedup Phase 1 — Levenshtein + two-tier auto-suppress** | Diagnostic data from #9. Without data we're guessing. Per Claude's recommendation, hold off on adding more matching techniques until we know what's actually being missed. |
| 11 | **Dedup Phase 2 — standardized reason codes, override metrics** | Phase 1 outcome. |
| 12 | **Dedup improvements — apostrophe / multi-word entities / verb stems / topic synonyms / tiered scoring** | Ground-truth requirements doc at [design/dedup-requirements.md](design/dedup-requirements.md). Captures 3 observed miss clusters (Spencer Pratt, Musk v. OpenAI, Trump Iran strike) with failure-mode analysis (F1–F7) and 7 numbered requirements (R1–R7). Implementation order: R1+R2+R3 (token fixes) → R4 (synonyms) → R5 (tiered scoring) → R6 (time windows). Spans v2.47 → v2.50. Test corpus inline — every implementation must regression-pass it. This subsumes #10 and #11. |

## Horizon (directional, no near-term plan)

- **PIM evolution / semantic layer** — turn Refinery from RSS reader into a personal information manager. Concrete tech path: Supabase `pgvector`, embed title+summary on insert, add semantic search and cross-article summarization. See the 2026-05-17 "knowledge base for AI" article review (PDF in Downloads). 1–2 sessions for MVP semantic search; more for "ask my news" RAG.
- **OpenClaw Phase 2** — `deriveSignal()` currently stubbed (returns ''). Per CONTEXT.md, intended for signal/category enrichment.
- **Substack ingestion** — confirm end-to-end via TOR RSS.
- **Direct URL input for artifacts** — UI to paste a URL and save as artifact manually.
- **Raindrop integration** — pull bookmarks as a source.
- **Reddit native integration** — beyond current TOR routing.
- **TipRanks alerts** — separate category.
- **Per-ticker Yahoo Finance feeds** — replace broad Yahoo Finance with AAPL/MSFT/GOOGL/AMZN/NVDA/TSLA/META/AMD/ORCL/CMCSA-specific feeds. Less noise, more signal.

---

## Done — recent (last 3 entries, then prune)

- 2026-05-18 — Iconized header + ICON chip + LIST chip (Viewer v2.34); closes #3b focus mode + #3c iconized nav
- 2026-05-18 — `applySourceCategoryBackfill()` run (user) — existing rows retagged to 10-category set
- 2026-05-17 — Auto hard-purge wired into `runDailyIngestion` (Ingestion v2.46)
