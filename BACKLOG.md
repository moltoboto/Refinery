# Refinery - Backlog

Operational queue of work not yet scheduled. **Ranked by value-add, not order of discovery.** Promote items from High to a session; deprioritize anything that doesn't move the needle.

## How to use this file
- **High value** = visible to user, blocks current workflow, or unlocks new capability
- **Medium value** = nice-to-have, polish, observation
- **Low value** = marginal gain, high FP risk, or already covered indirectly
- **Deferred** = planned but gated on something else
- **Horizon** = directional, no near-term plan

When something is done, delete the row and write the audit entry.

---

## 🔴 High value (do these first)

| # | Item | Est. | Why high value |
|---|------|------|----------------|
| W1 | **Wisdomware reading in Artifacts** — mostly SHIPPED, pending verify | done core | v2.54: ←/→ nav buttons (fix "trapped"; real swipe-over-iframe isn't possible) + delete-advances-to-next (real delete already existed). v2.55: `.md`/`.markdown` render formatted (markdownToHtml_), other plain text stays `<pre>`, newsletters unchanged. **Remaining:** (a) USER verify on iPad once a `.md` is in Drive (none live yet) — redeploy `/exec`; (b) OPTIONAL: render `.md` truly inline (no iframe) so finger-swipe works on summaries too (arrows already cover cycling); (c) the Wisdomware→Drive sync itself (see W2). See AUDIT 2026-06-30 + CONTEXT "Wisdomware integration". |
| W2 | **Wisdomware→Drive sync (Hop 1)** | 1 session | Get the local Wisdomware vault's `*.md`/`*.html` into the Google Drive `Refinery Artifacts` (→ rename to `Wisdomware`) folder so Refinery reads them. Options now: **ExpanDrive** (installed — mounts Drive as a local drive; then plain copy / Syncthing / Carbon Copy Cloner), or rclone (API, no mount). PDFs auto-archived to `._PDF_Archive` (excluded). Pick the simplest once ExpanDrive is connected to moltoboto@gmail.com. Then drop a `.md` to verify W1. Gated on the dual-sync decision (OneDrive+GitHub on one folder). |
| D1 | **Dedup regression — broke in production (night of 2026-06-28)** | 1 session | User reports dedup "did not work last night" — duplicates came through in the live nightly ingest. Core ingestion feature regressed after the v2.47–2.49 dedup work; Ingestion now at v2.57 (verify nothing since then disabled/altered the dedup path). First step: pull recent ingestion logs, look for missing `DEDUP CACHE HIT` lines and any errors in the dedup stage; reproduce against the corpus via `runDedupCorpusTest`. Likely suspects: cache key/title-key divergence, constant-subject handling, or a change between v2.49→v2.57. **Important — blocks clean nightly reading.** |
| S1 | **RSS-style compact summary format for fast thumb-through** | 1 session | User thumbs through 100s of articles a night; the current executive-summary format (Core Message / Why It Matters / Key Takeaways / Bottom Line consulting card) is too heavy for that flow. Reshape the summary toward an RSS-input feel — tighter, headline + 1–2 line gist — to facilitate fast scanning. Touches `generateExecutiveSummary` output schema + `renderExecSummaryHtml`/`.exec-*` CSS. Open Q: compact for the list/thumb view vs full card on open. |
| 1a | **Full article in reading pane — hard path (paywalled / teaser feeds)** | 1 session | Easy path DONE 2026-05-19 (v2.50+v2.37). For feeds that only give a teaser in RSS (Motley Fool, Seeking Alpha, NYT), would need to re-enable `enrichArticleFromUrl()` on-demand — risk: slow URLs hanging UrlFetchApp. Deferred until easy path observed in production. |
| 3a | **iPad "trapped" fix** | 1–2 hrs | Functional iPad blocker. Per-card ↗ icon uses `<a target="_blank">`; iPad Safari treats it as in-place navigation from the iframe sandbox. Combined with #1 above, this becomes less critical (you'd read in-app) but it's still a real escape hatch needed. Possible fixes: JS `window.open()`, persistent "← Refinery" floating badge, or Apps Script sandbox tweaks. |
| 2 | **GitHub Models API for Summarize** | 1–2 sessions | Quality boost — better summaries could replace per-article reading for many items. Wire `UrlFetchApp` to GH Models endpoint with your token. Watch rate limits (~50 req/day personal). |
| 2c | **Summarize newsletters in the Artifacts tab** | 1 session | User-wanted (added 2026-06-12) — "never worked reliably." Today `summarizeVisible()` only summarizes the article LIST; the Artifacts tab has no summarize action. Add one that runs the same Gemini executive-summary on a selected newsletter artifact (or all visible artifacts), pulling the email text via a server fn (the artifact HTML is already fetched by `getArtifactContent` — strip to text and feed Gemini, reuse `generateExecutiveSummary`). LLM wiring is now DONE (Gemini, v2.51–2.53), so this is unblocked. Open Q: per-artifact summary vs summarize-the-filtered-list. |
| 2b | **Daily AI "brief" — themed digest of unread stories** | 1–2 sessions (after #2) | User-wanted (added 2026-06-11). Auto-generate a scannable daily brief that clusters the day's unread items into named themes, each with a one-line headline + 2–4 bullet takeaways and a per-theme story count (e.g. header "What's going on in AI · 7 stories"). Extends `summarizeVisible()` (already dumps filtered articles to a prompt) but with **structured theme-grouping + per-story bullets** instead of today's freeform narrative. Gated on the LLM wiring from #2 (GitHub Models API). Target-format example supplied by user 2026-06-11: themed groups like "Anthropic Fable 5 backlash", "DeepMind agent-behavior fund", "OpenAI × Oracle/Visa", each 2–4 terse bullets. **Reference implementation the user likes: https://stackbrief.tech/brief** (dated header + "N stories", per-theme headline + bullet takeaways). Open Qs: scope (per-category vs all-unread), trigger (on-demand button vs scheduled daily), and whether the brief renders in the reading pane or as a saved artifact. |

## 🟡 Medium value

| # | Item | Est. | Notes |
|---|------|------|-------|
| 7 | **Verify v2.47 / v2.48 / v2.49 dedup work in production** | observation | Run `runDedupCorpusTest` for the regression scorecard; watch real ingestion logs for `DEDUP CACHE HIT` lines (v2.47 F8 fix) and false-positive rate in the Duplicate review queue (v2.48–49 fuzzy improvements). |
| 10 | **Dedup diagnostic — ongoing miss capture** | as observed | Feed new miss clusters into [design/dedup-requirements.md](design/dedup-requirements.md). Cluster F addressed by v2.47; Clusters A/B/C/D/E addressed by v2.48–49. |
| 3 | **iPad 11" right gutter tuning** | <30 min | Cosmetic. Tested 11" 2026-05-18 — 280px felt off. Test on 12.9" iPad then settle on viewport-relative sizing (clamp or per-width). |

## 🟢 Low value (deprioritized — only if nothing better to do)

| # | Item | Why low |
|---|------|---------|
| 13 | **Dedup Phase 3 (R5 Tier 1 bigram + Tier 4 weakest tier)** | Analysis shows won't move test scorecard. Tier 2+3 already shipped in v2.48–49. Tier 4 (1 entity + 2 actions) is permissive and will likely add false positives (Apple+announce / Apple+launch type matches). Hold until v2.49 FP rate is known, then re-evaluate. |
| 5 | **Finance OPML curation** | User action, easy anytime — decide which Finance feeds to drop in `subscriptions.opml` |
| 8 | **Re-import OPML into TOR** | User action — drop Google News from live reader |

## 🔵 Deferred (gated)

| # | Item | Trigger |
|---|------|---------|
| H2 | **v3.0 visual rewrite (Claude Design package)** | After v2.36+ tested on iPad. Package at [design/claude-design-v3/](design/claude-design-v3/). 1024-line styles.css drop-in, all icons in icons.jsx, Apps Script implementation notes in README. **Phase 1 (visual only):** ~3 sessions — paste CSS, inline SVG, rewrite components, add bottom keyboard footer, IBM Plex Mono. **Phase 2 (backend):** ~1–2 sessions — Supabase columns for author/image_url/read_later/read_progress; Ingestion captures from RSS. **Phase 3 (defer):** Kept view, mobile patterns, multi-tag. |

## 🔵 Horizon (directional)

- **PIM evolution / semantic layer** — pgvector + embedding on insert + semantic search. Strategic direction. 1–2 sessions MVP.
- **OpenClaw Phase 2** — `deriveSignal()` enrichment (stubbed)
- **Substack ingestion** — end-to-end confirm
- **Direct URL input for artifacts**
- **Raindrop integration**
- **Reddit native integration**
- **TipRanks alerts category**
- **Per-ticker Yahoo Finance feeds** (Mag 7 + AMD/ORCL/CMCSA)

---

## Done — recent (last 5 entries, then prune)

- 2026-05-19 — Full article HTML in reading pane (Ingestion v2.50 + Viewer v2.37) — closes #1 easy path
- 2026-05-19 — Dedup Phase 2: R4 topic-synonym groups (Ingestion v2.49)
- 2026-05-19 — Dedup Phase 1: R1+R2+R3 + minimal R5 Tier 2 (Ingestion v2.48)
- 2026-05-19 — F8 dedup fix on Gmail path (Ingestion v2.47); dedup corpus test runner; safety audit
- 2026-05-19 — Chip overhaul + real category icons (Viewer v2.36)
