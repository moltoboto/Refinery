# Claude Design Brief — Refinery iPad Header & Layout

## How to use this document

Paste this content into a fresh Claude.ai (web) conversation along with screenshots of the current Viewer on iPad (11" and 12.9"). Ask for a design review of the header chip system and the iconized nav.

---

## What Refinery is

A personal news reader. Two Google Apps Script apps:
- **Ingestion** — pulls from The Old Reader (RSS) and Gmail newsletters, writes to Supabase, dedups, categorizes.
- **Viewer** — Feedly-style 3-pane web app served by Apps Script `HtmlService`. One reader (the project owner). Used heavily on **iPad** (11" and 12.9").

Visual: Lora + DM Sans, cream/orange accent palette, three columns (sidebar / list / reading pane).

## What this brief is asking for

Design recommendations for the **header chip system** and the **iconized nav rail**, with a strong iPad bias. The implementation will go back into Apps Script (single-file HTML, vanilla CSS/JS — no React, no Tailwind, no external icon library bundle).

## Current state

The header is a single horizontal row:

```
[ 🟢 3,022 total ]  [ Search... ]   [Unread only] [Nav] [Reading] [Compact] [Aa] [Refresh]
```

All chips are text labels. On 11" iPad with browser pinch-zoom enabled, the right-side chips drift off-screen and become unreachable. There's no compact / icon-only mode.

Three columns below the header:
- **Sidebar (nav)** — categories with unread counts, sources list. Toggle: NAV chip currently hides it entirely (no icon mode).
- **List pane** — article cards (title, source, snippet, ↗ open-original icon).
- **Reading pane** — full reading view of the selected article. Toggle: READING chip hides it.

There is no toggle to hide the **list pane** — meaning no "reading-only" focus mode.

## Goals

1. **Header survives iPad pinch-zoom.** All chips stay reachable at any practical zoom level. The current text-chip row is the biggest failure mode.
2. **Compact iconized header** — replace text labels with icons + accessible labels (tooltip / aria-label).
3. **Iconized nav rail** — 60px-wide collapsed mode with real glyphs for each category, so the user can navigate while the full sidebar is hidden. (A previous version had this but the icon spans were never populated and got deprecated; we're resurrecting it with real content.)
4. **Add a "hide list" toggle** — combined with hide-reading, this gives a focus mode that emphasizes one pane at a time.
5. **Visual coherence with Lora/DM Sans + cream/orange palette.** No icon-library look that fights the typography.

## Constraints

- **Apps Script web app.** Single-file `index.html`, served iframe-sandboxed. No build step, no React, no Tailwind, no external icon library at install time.
- **Inline SVG or Unicode/emoji acceptable.** SVG preferred for crispness on retina iPad. Emoji acceptable as a stopgap.
- **Existing CSS architecture** uses CSS custom properties (`--sidebar-w`, `--list-w`, `--accent`, etc.) and body classes for toggles (`body.no-reading-pane`, `body.nav-icons`).
- **iPad Safari iframe behavior** — `target="_blank"` from inside the iframe replaces the iframe rather than opening a new tab. Any "open in new view" affordance needs to account for this.
- **One reader** — no need for multi-user theming, dark mode, or i18n. Make it good for *this* user on *this* iPad.

## Specific questions I want a design opinion on

1. **Chip icon set** — which symbols (Unicode, emoji, or custom SVG) for: Unread filter, Nav toggle, Iconize nav, Reading toggle, Hide list, Compact density, Font size cycle, Refresh? Show me 2–3 candidate sets.
2. **Nav rail icons** — for the 10 categories (News, AI, Finance, Learning, Tech, Watches, YouTube, Reddit, Email, Duplicate), what icon style works best at 60px width? First-letter glyphs, category-specific emoji, custom monoline SVG? Trade-offs?
3. **Toggle state visibility** — how should an "active" chip look? Filled vs outlined? Color change vs background?
4. **Header collapse strategy at narrow widths** — if the iPad is portrait or zoomed, should chips wrap, scroll horizontally, collapse into a "more" menu, or move into the nav rail?
5. **Focus mode entry/exit** — what's the cleanest UX for the new "hide list" toggle? Should it auto-show again when the user selects a new article? Or stay hidden until manually re-enabled?
6. **Discoverability of icon-only mode** — first-time users won't know what icons mean. Tooltip-on-hover is fine on desktop but doesn't exist on iPad. Long-press? Initial labels-then-icons animation? Always-shown small text under each icon?

## What I'm NOT asking about

- Backend / Supabase / Apps Script architecture.
- The reading pane internals (typography, image handling, summary rendering).
- Categories or content strategy.
- Dedup algorithm.

## Reference

- GitHub: https://github.com/moltoboto/Refinery
- Relevant files: `Viewer/index.html` (single-file UI), `Viewer/Code.js` (Apps Script backend).
- Current header chip CSS lives in the `<style>` block of `index.html` around the `.header-right` and chip selectors.

## Deliverables I want from this review

1. A recommended icon set for the header chips (with rationale).
2. A recommended nav-rail icon style + glyphs for the 10 categories.
3. CSS direction (colors, active states, hover/touch behavior).
4. UX recommendations for the focus mode toggle and discoverability of icons.
5. Anything else you'd push back on in the proposed direction.
