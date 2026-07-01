#!/usr/bin/env bash
# ============================================================
# Refinery — Wisdomware vault → Google Drive sync (Mac only)
# ============================================================
# Pushes the local Obsidian "Wisdomware" vault's summaries INTO the Google Drive
# folder Refinery reads, so they show up in the Viewer's Artifacts tab.
#
# WHY on the Mac: Refinery is Google Apps Script (cloud) and can't see the local
# vault. rclone must run where the vault lives. Refinery only READS the Drive folder.
#
# BEHAVIOUR (deliberate):
#   - ADDITIVE: `rclone copy` (never `sync`) — it NEVER deletes on Drive, so files
#     you delete on the Drive/Refinery side stay deleted (your reading workflow).
#   - RECENT-ONLY by default (--max-age 2d): only files modified in the last 2 days
#     are considered, so older items you deleted aren't re-copied. New summaries get
#     pushed the night they're filed, then never again.
#   - FILTER: *.md and *.html only; skips dot-folders (.obsidian/.smart-env/
#     ._PDF_Archive/.JPEG_Archive), _trash, and everything else (PDFs, mp4s, images).
#
# USAGE:
#   ./sync-wisdomware.sh          # recurring sync (recent files only) — used by launchd
#   ./sync-wisdomware.sh --all    # full backfill (ignore --max-age; copy every md/html)
#   ./sync-wisdomware.sh --dry    # dry run (show what would copy, change nothing)
#
# Requires: rclone remote "gdrive" authorized to moltoboto@gmail.com.
set -eo pipefail   # not -u: macOS bash 3.2 errors on empty-array expansion under nounset

VAULT="/Users/thomascala/Library/CloudStorage/OneDrive-NewAmsterdamPharmaB.V/NewAmsterdam Pharma/[100] Wisdomware"
DRIVE_FOLDER_ID="1eO6n6MQKF7_cCwulGxhDkzrxT772M-Iz"   # Refinery's DRIVE_FOLDER_ID (Viewer + Ingestion read this)
LOG="$HOME/Library/Logs/refinery-sync.log"

AGE_ARGS=(--max-age 2d)
DRY_ARGS=()
for arg in "$@"; do
  case "$arg" in
    --all) AGE_ARGS=() ;;                 # full backfill: no age filter
    --dry) DRY_ARGS=(--dry-run) ;;
  esac
done

mkdir -p "$(dirname "$LOG")"
echo "=== $(date '+%Y-%m-%d %H:%M:%S') sync start (${*:-recurring}) ===" >> "$LOG"

rclone copy "$VAULT" "gdrive:" \
  --drive-root-folder-id "$DRIVE_FOLDER_ID" \
  "${AGE_ARGS[@]}" "${DRY_ARGS[@]}" \
  --filter "- **/.*/**" \
  --filter "- .*/**" \
  --filter "- _trash/**" \
  --filter "+ *.md" \
  --filter "+ *.html" \
  --filter "- *" \
  --no-update-modtime \
  --log-file "$LOG" --log-level INFO

echo "=== $(date '+%Y-%m-%d %H:%M:%S') sync done ===" >> "$LOG"
