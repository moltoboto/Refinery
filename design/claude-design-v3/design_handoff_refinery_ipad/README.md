# Handoff: Refinery iPad Header & Layout Redesign

## Overview
This handoff covers a visual redesign of Refinery — a personal Feedly-style RSS reader implemented as a Google Apps Script web app (single-file `index.html` served by `HtmlService`). The redesign focuses on:

1. A new **header chip system** that survives iPad pinch-zoom and narrow widths (the brief's #1 failure mode).
2. An **iconized nav rail** with bespoke glyphs for all 10 categories (News, AI, Finance, Learning, Tech, Watches, YouTube, Reddit, Email, Duplicate).
3. A new **focus mode** that hides either the list pane or the reading pane.
4. Refined typography (Lora + DM Sans + IBM Plex Mono), cream + warm-orange palette.
5. Mobile patterns to handle the existing 3-column layout collapsing on phone.

---

## About the Design Files

**The HTML files in this bundle are design references, not production code.** They are React + Babel prototypes that show the intended visual design, interaction model, and component composition — they are *not* meant to be dropped into your Apps Script project as-is.

Your task: **recreate this design inside the existing single-file Apps Script `Viewer/index.html`** using its established constraints (vanilla JS, vanilla CSS, inline SVG, no build step, no React, no Tailwind, no external icon library). The existing CSS architecture uses CSS custom properties (`--sidebar-w`, `--list-w`, `--accent`, etc.) and body classes (`body.no-reading-pane`, `body.nav-icons`) for toggles — keep that pattern; just extend it.

If you find anything in the prototype that requires React behaviour you can't easily reproduce in vanilla JS, simplify it. State management here is trivial (a handful of toggles), so plain event listeners + classList mutations + `localStorage` are enough.

---

## Fidelity

**High-fidelity.** Colors, spacing, type scale, icon shapes, and active states are all final. Copy them precisely. Where this design differs from the current Refinery palette, prefer this design — it was iterated against the brief.

---

## Screens / Views

### 1. Main reader (iPad landscape, 1180×820 target)

**Purpose:** Read the RSS inbox. Three-column layout: nav rail / article list / reading pane.

**Layout grid:**
```
┌────────────── topbar (60px) ──────────────┐
│ brand cell (rail-w)│ search • stats • chips │
├──────────┬───────────────┬──────────────────┤
│  rail    │  list         │  article         │
│ (220px / │ (360px)       │  (1fr)           │
│  76px)   │               │                  │
├──────────┴───────────────┴──────────────────┤
│ footer keyboard hints (30px)                │
└─────────────────────────────────────────────┘
```

CSS grid: `grid-template-rows: 60px 1fr 30px` on `.app`; `grid-template-columns: var(--rail-w) var(--list-w) 1fr` on `.body`.

### 2. Header chip system (the main piece)

The header has three parts in a row:

1. **Brand cell** — left, fixed at `--rail-w`. 28px square mark (ink-9 background, orange inner square), brand wordmark in Lora 500 / 20px, subtitle in mono uppercase ("v3.0 · iPad").
2. **Stats badge** — `● 3,022 total` in a pill, 34px tall, hairline border, mono numerals.
3. **Search** — 36px tall, max-width 360px, IBM Plex Mono `⌘K` hint chip on the right.
4. **Chip row** — 8 toggle chips with monoline SVG icon + DM Sans label.

**Chip dimensions:**
- Labeled: 34px tall, icon (14px) + 8px gap + label, padding `0 13px 0 11px`, border-radius 999px.
- Icon-only: 34px square.

**Chip states:**
- Default: `var(--paper-edge)` background, `var(--rule)` border, `var(--ink-8)` text, icon in `var(--ink-7)`.
- Hover: `var(--paper)` background, `var(--rule-strong)` border, `var(--ink-9)` text/icon.
- **Active (pressed)**: `var(--ink-9)` background, `var(--paper-edge)` text, icon in `var(--accent)`. This is the recommended treatment — high contrast, survives iPad pinch-zoom, clearly distinguishable from hover.

**The 8 chips, in order:**
| # | Chip      | Active state means              | Brief mapping |
|---|-----------|---------------------------------|----------------|
| 1 | Unread    | filter list to unread only      | unreadOnly     |
| 2 | Nav       | rail visible (not hidden)       | sidebar toggle |
| 3 | Icons     | rail in 76px icon-only mode     | nav-icons mode |
| 4 | Reading   | reading pane visible            | no-reading-pane (inverse) |
| 5 | Focus     | list pane HIDDEN (reading-first)| **NEW** — brief's "hide list" |
| 6 | Compact   | tight density                   | compact density |
| 7 | Aa        | larger reading body type        | font-size cycle |
| 8 | Refresh   | (action, not toggle)            | refresh        |

**Critical: pinch-zoom survival.**
The chip row uses a 3-tier collapse strategy:

1. **≥ 1281px viewport** — labeled mode, all chips visible.
2. **≤ 1280px viewport** (iPad portrait / pinch-zoom 1) — `@media` collapses labels: `chip-label { display: none; }` + chip width 34px square. The stats badge also drops its `total` word.
3. **Worst case** (heavy pinch-zoom, narrow portrait) — `.tb-chips` has `overflow-x: auto` with an edge-fade mask. Chips scroll horizontally; none ever become unreachable.

Search also shrinks: `@media (max-width: 1024px) { .tb-search { max-width: 200px; } .tb-search .key { display: none; } }`.

### 3. Nav rail

Three modes controlled by `[data-rail="full" | "icons" | "hidden"]` on `<html>` (or body — match your existing pattern).

**Full mode (220px wide):**
- Sections: Inbox · Categories · Sources.
- Each item is a button: `grid-template-columns: 26px 1fr auto` — icon, label, count.
- Active item: orange-tinted background (`var(--accent-soft)`), bold label, **3px orange bar** stuck to the left edge (positioned `left: -14px` relative to the item's padding box — adjust to your shell).
- Counts in IBM Plex Mono 11px; "hot" counts (the brief's loud feeds) shown in `var(--accent)`.

**Icons mode (76px wide):**
- Same items, but `grid-template-columns: 1fr`, content centered, with the label rendered tiny (9.5px DM Sans) below the icon.
- Count badge moves to top-right of each cell.
- This is the "60px collapsed rail with real glyphs" the brief asked for — slightly wider (76px) because tiny text labels really help discoverability.

**Hidden mode:** `--rail-w: 0` and `.rail` gets `display: none`.

### 4. Category icons (the 10 glyphs)

Custom monoline SVGs at 1.5 stroke, rounded joins. Each has a distinctive silhouette so they read at both 18px (full rail) and 32px (icon-only rail). View them in the icon-set spec view of the prototype (Tweaks → Section → "Icon set · spec") — every glyph has its full SVG markup in `refinery/icons.jsx`.

| Category   | Glyph                                    |
|------------|------------------------------------------|
| News       | Folded newspaper w/ masthead lines       |
| AI         | Central node + 4 orbital nodes           |
| Finance    | Bars + a small jagged trendline          |
| Learning   | Graduation cap with tassel               |
| Tech       | Microchip — square + 4 legs each side    |
| Watches    | Round watch face + lugs + hands at 2:00  |
| YouTube    | Rounded rect with a filled play triangle |
| Reddit     | Circle head + antenna + smile + dots     |
| Email      | Envelope with seam                       |
| Duplicate  | Two overlapping squares                  |

Copy the inline SVG from `refinery/icons.jsx` — case `'cat-news'` through `'cat-dup'`.

### 5. Header chip icons

Also defined in `refinery/icons.jsx`:

| Chip      | Icon name (in file) | Shape                                          |
|-----------|---------------------|------------------------------------------------|
| Unread    | `unread`            | Hollow circle with filled inner dot            |
| Nav       | `nav`               | Panel left + 2 dots inside                     |
| Icons     | `rail`              | Panel left + 3 dots inside (denser → icon mode)|
| Reading   | `reading`           | Panel with 3 horizontal lines on the right     |
| Focus     | `hideList`          | Panel with dashed middle column                |
| Compact   | `compact`           | 4 tight horizontal bars                        |
| Aa        | `aaa`               | Small serif A + bigger serif A                 |
| Refresh   | `refresh`           | Curved arrow                                   |

All at 14px in chips, 1.5 stroke, `var(--ink-7)` default / `var(--accent)` when chip is active.

### 6. List column (article list)

- Header: 22px Lora title ("All Unread"), mono meta line below ("{n} shown · {total} total" with the total in orange), and 3 action buttons on the right (Summarize, Mark all, Filter — icon-led).
- Each row: `padding: 16px 22px 16px 30px`, hairline divider, hover background `var(--paper-2)`.
  - Unread dot: 7×7 orange circle absolutely positioned at `left: 12px`.
  - Meta line: 10px mono uppercase — source favicon (14×14 colored square with letter) + source name + dot + category + (optional) tag + time on the right.
  - Title: Lora 500, 16px, line-height 1.28, balanced wrapping.
  - Snippet: 12.5px DM Sans, 2-line clamp (hidden in compact density).
  - Hero image (if `imagery=true`): full-width 16:8 aspect, `var(--paper-3)` with diagonal stripe pattern + accent gradient overlay.
  - Progress bar (if in-progress): 32px wide × 3px tall, mono "{n}% · {x} min left".
- Selected row: `var(--accent-tint)` background + 3px orange bar at left.
- Read row: `opacity: 0.72` + lighter title.

### 7. Reading pane

- **Sticky toolbar** at top: Back / Forward / Keep (primary, ink button with orange bookmark) / Mark read / Share / Open original / More. 30px tall buttons with icon + label.
- **Sticky progress bar** below toolbar: 2px tall, orange, fills as the article scrolls.
- **Article inner**: max-width 640px, 36px 44px 100px padding.
- **Kicker** (above title): mono uppercase — orange source name, hairline separator, category, optional rounded tag pill, separator, date.
- **Title**: Lora 500, 38px, line-height 1.1, letter-spacing -0.018em, `text-wrap: balance`.
- **Deck**: Lora italic 400, 18px, `var(--ink-7)`.
- **Byline**: hairline-bordered row top + bottom — 22px orange avatar with initials, byline text, mono time on the right.
- **Hero**: 16:9, same diagonal-stripe + orange gradient as list hero.
- **Body**: Lora, 17.5px (or 19.5px when "Aa" chip active), line-height 1.65, `var(--ink-8)`.
  - **Drop cap on first paragraph**: 4em first letter, Lora 500, `var(--accent-deep)`, float left.
  - H2: Lora 600, 22px.
  - Blockquote: 20px italic, 3px orange left border.

### 8. Kept (saved) view

Replaces the list + reading panes when active.

- Header: 32px Lora "Kept" + mono meta "{n} items · 3 in progress · 8 unread", plus a segmented filter on the right (all / unread / reading / finished / this month).
- Grid: `repeat(auto-fill, minmax(260px, 1fr))`, 14px gap.
- Card: 10px radius, hairline border, `var(--paper-edge)` background, 18px padding. Tag line (source favicon + name + category) + Lora 500 title + 3-line snippet + foot with time, progress bar, percent.

### 9. Footer

30px tall, hairline top, padding 0 18px. Mono 10px keyboard hints (J/K/↵/M/S/F) using small kbd elements with `var(--paper-edge)` background and hairline border. On the right: `● Synced 2 min ago · 3,022 unread`.

### 10. Mobile patterns (three options)

These are alternative collapse strategies for phone widths. Pick one for Refinery — the brief leans iPad-heavy, but if you ever need a phone mode, **Pattern B (bottom tab bar)** is the most familiar.

- **A · Stacked drill-down**: 3 levels (Feeds → List → Article), back button moves you up.
- **B · Bottom tab bar**: 4 tabs (Inbox / Feeds / Kept / Me), no back navigation needed.
- **C · Swipeable pages**: horizontal pager with dot indicator, all 3 panes accessible by swipe.

Phone frame is 354×720 with 42px rounded corner, status bar at top.

---

## Interactions & Behavior

### Toggle chips
- Single click flips the toggle.
- Persist state in `localStorage['refinery.<key>']`.
- Apply via `document.documentElement.dataset.<key> = value` (or `body.classList.toggle('...')` — match your existing pattern).

### Rail tri-state
The "Nav" + "Icons" chips together control a tri-state:
- Nav off → rail hidden.
- Nav on + Icons off → rail full (220px).
- Nav on + Icons on → rail icons-only (76px).

### Focus mode tri-state
The "Reading" + "Focus" chips control another tri-state:
- Reading on + Focus off → normal (all 3 columns).
- Reading off + Focus off → list-only (reading pane hidden).
- Reading on + Focus on → reading-first (list pane hidden). **New** — the brief's "hide list" toggle.

**Brief Q5 — should Focus auto-exit on article change?** Recommendation: **no, stay hidden**. Reading-first is a *mode*, not an accident. Provide a clear chip to exit; don't fight the user.

### Discoverability (brief Q6)
- `title="..."` attribute on every chip (covers desktop hover + iPad long-press, which iOS Safari renders as a contextual menu after ~500ms).
- Footer always shows keyboard hints; consider an in-app "?" overlay listing them.
- Initial onboarding: a one-time toast under the header on first run ("These icons toggle nav, reading, and focus modes. Long-press for labels.") — easy to dismiss, never returns.

### Tooltips on iPad
iPad has no hover, so `title=""` is a fallback. The brief asks for an "always-shown small text under each icon" alternative — that's exactly what the icon-mode rail does (tiny labels below glyphs). For the header chips, the labeled-mode IS the always-shown-label version; the icon-only mode is what activates at narrow widths.

### Header collapse strategy (brief Q4)
The chosen approach: **automatic CSS-driven collapse + horizontal scroll fallback**. No "more" menu — every chip stays one tap away. Wrapping was rejected because it makes header height variable and shifts content below.

---

## Design Tokens

### Colors (light / cream theme)
```css
--paper:      oklch(96.5% 0.022 84);   /* main surface */
--paper-2:    oklch(94%   0.024 84);   /* hover */
--paper-3:    oklch(91%   0.025 82);   /* inset */
--paper-edge: oklch(99%   0.012 84);   /* near-white edges */
--rule:       oklch(85%   0.025 75);   /* hairline */
--rule-soft:  oklch(89%   0.022 80);
--rule-strong:oklch(78%   0.028 70);

--ink-9: oklch(22% 0.020 60);  /* near-black warm */
--ink-8: oklch(32% 0.020 60);
--ink-7: oklch(42% 0.018 62);
--ink-6: oklch(54% 0.016 65);
--ink-5: oklch(64% 0.014 68);
--ink-4: oklch(74% 0.014 72);
--ink-3: oklch(83% 0.018 75);

--accent:      oklch(63% 0.165 47);            /* warm orange */
--accent-deep: oklch(54% 0.18  42);
--accent-soft: oklch(63% 0.165 47 / 0.13);     /* tinted bg */
--accent-tint: oklch(63% 0.165 47 / 0.07);     /* fainter */
```

If your build target doesn't support `oklch`, the rough sRGB equivalents are:
- `--paper` ≈ `#f5f0e8`
- `--paper-2` ≈ `#ede6da`
- `--accent` ≈ `#d97444`
- `--accent-deep` ≈ `#c25a2a`
- `--ink-9` ≈ `#2a221c`
- `--ink-7` ≈ `#5a4d40`

### Type
- `--ff-display: "Lora", Georgia, serif` — titles, body text, decks, drop caps, brand.
- `--ff-ui: "DM Sans", system-ui, sans-serif` — chips, buttons, labels, list snippets.
- `--ff-mono: "IBM Plex Mono", ui-monospace, monospace` — counts, timestamps, meta, kbd.

### Spacing / dimensions
- Topbar: 60px tall.
- Footer: 30px tall.
- Chip: 34px tall, border-radius 999.
- Rail full: 220px. Rail icons: 76px.
- List: 360px.
- Row padding (comfortable): 16px vertical, 22px horizontal. Add 8px left for the unread dot rail.

### Borders / radii
- Hairline: 1px solid `--rule`.
- Soft hairline: 1px solid `--rule-soft`.
- Chips: `border-radius: 999px`.
- Cards (kept): `border-radius: 10px`.
- Buttons in toolbar: `border-radius: 6px`.
- Hero images: `border-radius: 5px`.

### Shadows
Almost none by design. The single shadow used:
- Active chip: `box-shadow: 0 1px 0 oklch(22% 0.020 60 / 0.08)` (subtle inset)
- Phone frame (mobile previews): `0 25px 60px -25px rgba(50,30,15,0.35)`

---

## Assets

No raster assets needed. Everything is:
- **Inline SVG** for icons (see `refinery/icons.jsx`)
- **CSS-only** placeholders for hero images (diagonal stripes + accent gradient). When you wire real article images, replace `.row-hero` and `.article-hero` ::after content with `<img>` tags or `background-image: url(...)`.
- **Google Fonts**: Lora, DM Sans, IBM Plex Mono — load via `<link>` tag (already in `Refinery Redesign.html`). For Apps Script, including the Google Fonts `<link>` in `<head>` works fine inside the `HtmlService` iframe.

---

## Implementation Notes for Apps Script

Since this needs to live in single-file `Viewer/index.html`:

1. **Strip the React + Babel script tags.** Keep one `<style>` block and one `<script>` block.
2. **Move the inline-SVG icons into a JS function** that takes a name and returns an SVG string — call it where the prototype uses `<Icon name="..." />`. Or paste the SVG markup directly into your HTML where it's used.
3. **Component composition** becomes templating: build the header, rail, list, and article as four functions that return HTML strings, mount them into named root divs.
4. **State** is 5–6 booleans/enums. Use a single `state` object, persist to `localStorage`, and on every change call `applyState(state)` which sets `document.documentElement.dataset.*` and `body.classList.*`.
5. **The CSS in `refinery/styles.css`** is the spec — it should drop in mostly unchanged. Trim the `.mobile`, `.iconset`, `.kept` blocks if you're not implementing those pages yet.
6. **Categories and their icon names** are listed in `refinery/data.js` (just the structure — your data comes from Supabase).

---

## Files in this bundle

```
design_handoff_refinery_ipad/
├── README.md                  (this file)
├── Refinery Redesign.html     (entry — open this in a browser)
├── BRIEF.md                   (original brief from the user)
└── refinery/
    ├── styles.css             (★ the design spec — copy values from here)
    ├── icons.jsx              (★ inline SVG markup for every icon)
    ├── data.js                (mock data structure + category list)
    ├── components.jsx         (Topbar, Rail, ListColumn, Article, ArticleEmpty, KeptView)
    ├── mobile.jsx             (3 mobile patterns + icon-set spec view)
    ├── app.jsx                (top-level state, tweak panel wiring)
    └── tweaks-panel.jsx       (the prototype's tweak UI — ignore for production)
```

The two files you actually need to lift from are `refinery/styles.css` (CSS spec) and `refinery/icons.jsx` (SVG paths). Everything else is prototype scaffolding.

---

## Open questions worth confirming with the user

1. **Apps Script font loading** — Google Fonts via `<link>` works in the `HtmlService` iframe, but if the iframe is strict-sandboxed in some contexts, you may need to either embed the fonts as base64 or accept a system-font fallback (Georgia / sans-serif). Confirm before implementation.
2. **Open-in-new-view affordance** — the brief notes `target="_blank"` replaces the iframe on iPad Safari. The prototype's "Open original" button doesn't handle this; recommend `window.open(url, '_blank')` from a click handler, which works around the iframe replacement issue.
3. **Long-press behaviour on iPad** for the icon-only chips — verify that `title="..."` triggers the contextual menu, or implement a custom long-press handler that toggles a label tooltip.
4. **Compact + Aa as separate vs combined** — current design keeps them separate (per brief). If you want fewer chips, they could combine into one "Density" menu that cycles through 4 states.
