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
| 3 | **iPad test of v2.33 layout** | user action | Test stable list-pane position with Nav on/off, Reading off. Tune 280px right gutter if too much/little. |
| 4 | **Resize-handle cleanup** | <30 min | Drag handles from v2.28 still show when Reading is off. They conflict with the fixed-gutter layout from v2.32–33. Likely just remove them. |
| 5 | **Finance feed curation in `subscriptions.opml`** | <1 hour | Decide which Finance feeds to keep: Yahoo Finance, MarketWatch, CNBC Mad Money, Seeking Alpha, Motley Fool, Fox Business. Remove unwanted ones, re-import OPML into TOR. |
| 6 | **Run `applySourceCategoryBackfill()`** | user action | Retag existing rows to current 10-category set (News/AI/Finance/Learning/Tech/Watches/YouTube/Reddit/Email/Duplicate). Run from Ingestion Apps Script editor. |
| 7 | **Verify v2.35 mark-read fixes** | observation | First post-quota-reset run should log `DEDUP CACHE: warmed ~2000` and `TOR: marked X/500 as read (10 batches)`. Subsequent run should return far fewer articles. |
| 8 | **Re-import OPML into TOR** | user action | Google News removed from subscriptions.opml but TOR still has it. Import to drop. |

## Held (waiting on data or decisions)

| # | Item | Waiting on |
|---|------|------------|
| 9 | **Dedup diagnostic — manual cluster review** | User screenshots of "search by entity" results to identify dedup misses. Approach: search known recurring topics in Viewer, screenshot the result list, evaluate whether dedup should have collapsed any of them. |
| 10 | **Dedup Phase 1 — Levenshtein + two-tier auto-suppress** | Diagnostic data from #9. Without data we're guessing. Per Claude's recommendation, hold off on adding more matching techniques until we know what's actually being missed. |
| 11 | **Dedup Phase 2 — standardized reason codes, override metrics** | Phase 1 outcome. |

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

- 2026-05-17 — Auto hard-purge wired into `runDailyIngestion` (Ingestion v2.46)
- 2026-05-17 — iPad layout stability when Nav toggles (Viewer v2.30→v2.33 series)
- 2026-05-10 — Process docs rewrite, ship.ps1, branch cleanup, machine migration
