#!/usr/bin/env bash
# Refinery ship script (cross-platform: Mac + Lenovo via Git-Bash).
# Bash twin of ship.ps1 — same behavior, same guarantees.
#
# Behavior:
#   - clasp push the chosen app(s)
#   - auto-stamp the Current Versions table in HOW_THIS_WORKS.md from the
#     code itself (Viewer: line 1 marker; Ingestion: line 4 `* Version:` marker)
#   - git add / commit / push (the stamp update is included in the commit)
#
# Does NOT bump versions in Code.js or write the "what changed" description —
# those still need judgment, do them BEFORE running ship.sh.
#
# Usage:
#   ./ship.sh ingestion "Ingestion v2.56: short summary"
#   ./ship.sh viewer    "Viewer v2.44: short summary"
#   ./ship.sh both      "short summary"
#
# After shipping the Viewer you STILL must redeploy in Apps Script
# (pencil -> New version -> Deploy). Ingestion is push-only.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

APP="${1:-}"
MESSAGE="${2:-}"

if [[ "$APP" != "ingestion" && "$APP" != "viewer" && "$APP" != "both" ]]; then
  echo "Usage: ./ship.sh <ingestion|viewer|both> \"commit message\"" >&2
  exit 2
fi
if [[ -z "$MESSAGE" ]]; then
  echo "ERROR: commit message (2nd argument) is required." >&2
  exit 2
fi

# Colors (fall back to plain if not a tty)
if [[ -t 1 ]]; then C='\033[36m'; Y='\033[33m'; G='\033[32m'; D='\033[90m'; N='\033[0m'
else C=''; Y=''; G=''; D=''; N=''; fi

push_app() {
  local name="$1"
  local dir="$ROOT/$name"
  if [[ ! -f "$dir/.clasp.json" ]]; then
    echo "ERROR: No .clasp.json in $dir — wrong folder or repo not cloned correctly." >&2
    exit 1
  fi
  echo -e "${C}==> clasp push: $name${N}"
  ( cd "$dir" && npx --yes @google/clasp push )
}

get_ingestion_version() {
  # Ingestion JSDoc header, version like " * Version: 2.55" within the first lines
  head -n 6 "$ROOT/Ingestion/Code.js" \
    | grep -oE 'Version:[[:space:]]*[0-9]+\.[0-9]+' \
    | head -n 1 | grep -oE '[0-9]+\.[0-9]+' || true
}

get_viewer_version() {
  # Viewer one-line header on line 1 like "// ... Viewer v2.43"
  head -n 1 "$ROOT/Viewer/Code.js" \
    | grep -oE 'Viewer[[:space:]]+v[0-9]+\.[0-9]+' \
    | grep -oE '[0-9]+\.[0-9]+' || true
}

update_version_stamps() {
  local ing vwr today doc
  ing="$(get_ingestion_version)"
  vwr="$(get_viewer_version)"
  today="$(date +%Y-%m-%d)"
  doc="$ROOT/HOW_THIS_WORKS.md"

  if [[ -z "$ing" || -z "$vwr" ]]; then
    echo -e "${Y}WARN: could not parse version from Code.js headers — leaving HOW_THIS_WORKS.md untouched.${N}"
    echo -e "${D}      Ingestion line 4 should look like:   * Version: 2.XX${N}"
    echo -e "${D}      Viewer line 1 should look like:      // ... Viewer v2.XX${N}"
    return
  fi
  if [[ ! -f "$doc" ]]; then
    echo -e "${Y}WARN: HOW_THIS_WORKS.md not found, skipping stamp.${N}"
    return
  fi

  # Rewrite the | App | version | date | columns; leave "What changed" alone.
  # perl -i is portable across macOS (BSD) and Git-Bash (GNU); sed -i is not.
  perl -0pi -e "s/\\| Ingestion \\| v[0-9]+\\.[0-9]+ \\| \\d{4}-\\d{2}-\\d{2}/| Ingestion | v${ing} | ${today}/g" "$doc"
  perl -0pi -e "s/\\| Viewer \\| v[0-9]+\\.[0-9]+ \\| \\d{4}-\\d{2}-\\d{2}/| Viewer | v${vwr} | ${today}/g" "$doc"
  echo -e "${C}==> Stamped HOW_THIS_WORKS.md: Ingestion v${ing}, Viewer v${vwr} (${today}).${N}"
  echo -e "${Y}    REMINDER: update the 'What changed' column manually if the version bumped.${N}"
}

# 1. clasp push the relevant app(s)
case "$APP" in
  ingestion) push_app Ingestion ;;
  viewer)    push_app Viewer ;;
  both)      push_app Ingestion; push_app Viewer ;;
esac

# 2. auto-stamp HOW_THIS_WORKS.md from code (no judgment needed)
update_version_stamps

# 3. git add / commit / push
echo -e "${C}==> git commit + push${N}"
git -C "$ROOT" add -A
if git -C "$ROOT" commit -m "$MESSAGE"; then :; else
  echo -e "${Y}Nothing to commit (or commit failed).${N}"
fi
git -C "$ROOT" push

echo ""
echo -e "${G}Shipped: $MESSAGE${N}"
if [[ "$APP" == "viewer" || "$APP" == "both" ]]; then
  echo -e "${Y}REMINDER: redeploy the Viewer in Apps Script (pencil -> New version -> Deploy).${N}"
fi
