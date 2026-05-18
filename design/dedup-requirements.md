# Dedup Engine — Requirements & Failure Analysis

## Purpose

Document specific dedup misses observed in production and turn each into a testable requirement. This file is the ground truth for tuning the Ingestion dedup engine. Each new fix must regression-pass these examples.

---

## Observed misses (2026-05-18)

### Cluster A — Spencer Pratt LA Mayor (2 articles, same event, different angle)
```
A1: Spencer Pratt's Brilliant New Ad Shows Why He Can WIN in LA Mayor Race, with Mark Halperin
A2: Watch Spencer Pratt's BRILLIANT New "Fresh Prince of Bel Air" Ad Firing Back at Harvey Levin
```

**Why current v2.45 missed it:**
- Proper-noun extractor wants capitalized 3+ char tokens.
- `Pratt's` likely tokenizes as `Pratt's` (with apostrophe) or splits to `Pratt` + `s` — depends on regex.
- `Bel Air` is two tokens; the multi-word entity is lost.
- Shared distinct entities = `Spencer`, `Pratt`, maybe `Brilliant`, `New`. The 3-noun rule may match, but `New` and `Brilliant` are weak (stopword-adjacent).
- After stopword filtering, likely only `Spencer` + `Pratt` survive as strong entities = 2 shared. Below the 3-shared threshold.

### Cluster B — Elon Musk v. OpenAI verdict (6 articles, same event)
```
B1: Elon Musk just lost another lawsuit. Will he keep fighting?
B2: What to Know About Elon Musk's Trial Against OpenAI
B3: Jury rules against Elon Musk in his feud with OpenAI, saying he filed his lawsuit too late
B4: The jury in the OpenAI case has ruled against Elon Musk
B5: Elon Musk loses court battle against Sam Altman and OpenAI after 3-week trial
B6: Elon Musk lost his case against Sam Altman
```

**Why current v2.45 partially missed it:**
- Pairs sharing `Elon` + `Musk` + `OpenAI` (3 entities) probably caught — B2/B3/B4/B5 should cluster.
- B1 only has `Elon` + `Musk` — 2 strong entities, below threshold.
- B6 has `Elon` + `Musk` + `Sam` + `Altman` — 4 strong entities, would match B5, but may have missed B1–B4 if the matcher didn't catch `Sam Altman` as cross-equivalent to `OpenAI`.
- Verb forms `lost`/`loses`/`losing` are different tokens → no signal that they're the same action.
- The unifying topic word `lawsuit`/`trial`/`case`/`court battle`/`ruling`/`feud` is rich semantic signal but our matcher uses none of it (it's lowercase, not a proper noun).

### Cluster C — Trump Iran strike postponed (2 articles, identical event)
```
C1: Trump says he's postponing 'scheduled attack of Iran tomorrow' at Middle East leaders' request
C2: Trump says he delayed Iran strike planned for Tuesday
```

**Why current v2.45 missed it:**
- Only 2 distinct strong entities: `Trump`, `Iran`. Below 3-shared threshold.
- `Middle East` is a 2-word entity. Tokenized as `Middle` + `East` separately. `Middle` is a stopword-ish; `East` is generic — neither survives as a strong entity.
- Verb pair `postponing` / `delayed` describe the same action with no overlap in tokens.
- Topic noun `strike` / `attack` are semantically identical, no overlap in tokens.
- `tomorrow` / `Tuesday` are time markers for the same upcoming event.

---

## Root-cause failure modes

| # | Failure mode | Affects | Severity |
|---|--------------|---------|----------|
| F1 | **2 strong entities is below threshold** (current min 3) — but with verb + action context, 2 is often enough | A, C | High |
| F2 | **Apostrophe handling** — `Pratt's`, `Musk's`, `he's` tokenize inconsistently | A, B | Medium |
| F3 | **Multi-word entities lost** — `Bel Air`, `Sam Altman`, `Middle East`, `LA Mayor`, `Mark Halperin`, `Harvey Levin` — each is a single entity but counted as separate tokens after lowercase | A, B, C | High |
| F4 | **Verb stemming missing** — `lost`/`loses`/`losing`/`lose`; `delayed`/`delay`/`postponing`/`postpone` | B, C | High |
| F5 | **Topic synonyms not recognized** — `strike`/`attack`; `lawsuit`/`trial`/`case`/`court battle` | B, C | High |
| F6 | **Time markers ignored** — `tomorrow`/`Tuesday` reference the same upcoming event | C | Low |
| F7 | **No bidirectional entity-alias resolution** — `Sam Altman` and `OpenAI` are tightly linked in this event; the matcher doesn't know that | B | Low |

---

## Requirements

### R1 — Apostrophe & possessive normalization
Strip `'s` and `s'` from tokens before extraction. `Pratt's` → `Pratt`. `Musk's` → `Musk`. `he's` → `he` (then stopworded).
**Test:** A1+A2 must each include `pratt` in their proper-noun set.

### R2 — Multi-word entity bigrams
When two consecutive tokens are both capitalized (3+ chars, not stopwords), emit a third compound token (e.g. `sam-altman`, `bel-air`, `middle-east`, `mark-halperin`, `harvey-levin`). The compound counts as 1 strong entity.
**Test:** A1 must include `mark-halperin`; A2 must include `bel-air` and `harvey-levin`. B5+B6 must each include `sam-altman`.

### R3 — Verb stemming (light, news-domain)
Stem these action verb forms in titles:
- `lost`/`losing`/`loses`/`lose` → `lose`
- `delayed`/`delays`/`delaying`/`delay` → `delay`
- `postponed`/`postpones`/`postponing`/`postpone` → `postpone`
- `ruled`/`rules`/`ruling`/`rule` → `rule`
- `filed`/`files`/`filing`/`file` → `file`
- `sued`/`sues`/`suing`/`sue` → `sue`
- `won`/`winning`/`wins`/`win` → `win`
- `launched`/`launches`/`launching`/`launch` → `launch`
- `bought`/`buys`/`buying`/`buy` → `buy`
- `sold`/`sells`/`selling`/`sell` → `sell`
- `announced`/`announces`/`announcing`/`announce` → `announce`
- `released`/`releases`/`releasing`/`release` → `release`
- `cancelled`/`cancels`/`cancelling`/`cancel` → `cancel`
- `acquired`/`acquires`/`acquiring`/`acquire` → `acquire`
- `fired`/`fires`/`firing`/`fire` → `fire`
- `hired`/`hires`/`hiring`/`hire` → `hire`
- `unveiled`/`unveils`/`unveiling`/`unveil` → `unveil`
- `attacked`/`attacks`/`attacking`/`attack` → `attack`
- `struck`/`strikes`/`striking`/`strike` → `strike`
- `said`/`says`/`saying` → `say`

Single function with a regex-driven suffix table.

**Test:** B1+B5+B6 verb stems include `lose`. C1+C2 verb stems include `postpone` AND `delay` (both should map together).

### R4 — Topic-synonym groups
Maintain a small dictionary of news topic synonym groups. Words in the same group count as a match.

```
strike ≡ attack ≡ raid
lawsuit ≡ trial ≡ case ≡ court ≡ verdict ≡ ruling ≡ judgment
deal ≡ acquisition ≡ merger ≡ takeover
launch ≡ release ≡ debut ≡ unveil
fire ≡ layoff ≡ cut ≡ terminate
hire ≡ recruit ≡ poach
delay ≡ postpone ≡ defer
ban ≡ block ≡ prohibit
win ≡ victory ≡ triumph
lose ≡ defeat ≡ loss
```

When scoring, a token from one article that matches any synonym in the same group as a token from the other counts as a shared signal.

**Test:** B1 (`lawsuit`) and B5 (`court battle`) should share via the lawsuit-group. C1 (`attack`) and C2 (`strike`) should share via the strike-group.

### R5 — Tiered scoring with entity-anchored shortcut

Today's rule: ≥ 3 shared strong entities → flag duplicate (score boost to 0.66).

Proposed rule:
- **Tier 1:** ≥ 3 shared strong entities OR ≥ 1 multi-word entity + 1 strong entity → strong dup (score 0.80)
- **Tier 2:** 2 shared strong entities + 1 shared verb-stem → likely dup (score 0.70)
- **Tier 3:** 2 shared strong entities + 1 shared topic-synonym match → likely dup (score 0.70)
- **Tier 4:** 1 shared strong entity + 1 shared verb-stem + 1 shared topic-synonym → possible dup (score 0.60)

**Test:** All 6 examples in B should cluster. Both A1+A2 should cluster. Both C1+C2 should cluster.

### R6 — Tightened time window for confident matches
For Tier 1 and Tier 2 matches, allow up to 30 days (current default).
For Tier 3 and Tier 4 (weaker signals), require articles within 72 hours.
Reduces false positives for evergreen topics where same entities recur (e.g. `Apple` + `iPhone` mentioned weekly).

### R7 — Preserve current cache + simhash + Jaccard
None of the above replaces the existing signals; they add to them. Final score is max of all signals.

---

## Test corpus

Each cluster below is canonical truth — all titles in a cluster are duplicates of the same underlying event. The matcher should cluster every pair within a cluster, and never cluster across clusters.

### Cluster A — Spencer Pratt LA Mayor
- Spencer Pratt's Brilliant New Ad Shows Why He Can WIN in LA Mayor Race, with Mark Halperin
- Watch Spencer Pratt's BRILLIANT New "Fresh Prince of Bel Air" Ad Firing Back at Harvey Levin

### Cluster B — Musk v. OpenAI verdict
- Elon Musk just lost another lawsuit. Will he keep fighting?
- What to Know About Elon Musk's Trial Against OpenAI
- Jury rules against Elon Musk in his feud with OpenAI, saying he filed his lawsuit too late
- The jury in the OpenAI case has ruled against Elon Musk
- Elon Musk loses court battle against Sam Altman and OpenAI after 3-week trial
- Elon Musk lost his case against Sam Altman

### Cluster C — Trump Iran strike postponed
- Trump says he's postponing 'scheduled attack of Iran tomorrow' at Middle East leaders' request
- Trump says he delayed Iran strike planned for Tuesday

### Cross-cluster guard (must NOT match)
Add as we discover them. Initial:
- `Elon Musk` mentioned in a different week / different topic must not cluster with B.
- `Trump` + `Iran` mentioned about sanctions (not strike) must not cluster with C unless verb+topic also match.

---

## Implementation order

1. **R1 + R2 + R3** (token-level fixes) — smallest, no scoring change yet. Verify against test corpus.
2. **R4** (synonym dictionary) — additive, easy to expand.
3. **R5** (tiered scoring) — replaces the single 3-shared-noun rule with the tier system.
4. **R6** (time windows) — last, after we see false positive rates from R5.

Ingestion version bumps: each phase its own version. Probably v2.47 → v2.50.

---

## Out of scope (don't do)

- Cross-language matching (we only ingest English).
- Sentiment / stance matching ("Musk wins" vs "Musk loses" — these are NOT duplicates; they're different framings of same event but the matcher should still cluster them, since the verb stems are antonyms but the topic+entities match).
- Image/embedding similarity (would require pgvector — see PIM evolution backlog).
- ML training (too few labeled examples; rule-based is enough for personal-reader scale).
