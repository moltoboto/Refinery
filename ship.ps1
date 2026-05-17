# Refinery ship script — automates clasp push + git commit/push.
# Does NOT bump versions or edit docs (those need judgment — do them first).
#
# Usage:
#   .\ship.ps1 -App ingestion -Message "v2.46: short summary"
#   .\ship.ps1 -App viewer    -Message "Viewer v2.30: short summary"
#   .\ship.ps1 -App both      -Message "short summary"
#
# After shipping the Viewer you STILL must redeploy in Apps Script
# (pencil -> New version -> Deploy). Ingestion is push-only.

param(
  [Parameter(Mandatory=$true)][ValidateSet('ingestion','viewer','both')][string]$App,
  [Parameter(Mandatory=$true)][string]$Message
)

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot

function Push-AppFolder($name) {
  $dir = Join-Path $root $name
  if (-not (Test-Path (Join-Path $dir '.clasp.json'))) {
    throw "No .clasp.json in $dir — wrong folder or repo not cloned correctly."
  }
  Write-Host "==> clasp push: $name" -ForegroundColor Cyan
  Push-Location $dir
  try {
    & npx --yes @google/clasp push
    if ($LASTEXITCODE -ne 0) { throw "clasp push failed for $name" }
  } finally {
    Pop-Location
  }
}

# 1. clasp push the relevant app(s)
switch ($App) {
  'ingestion' { Push-AppFolder 'Ingestion' }
  'viewer'    { Push-AppFolder 'Viewer' }
  'both'      { Push-AppFolder 'Ingestion'; Push-AppFolder 'Viewer' }
}

# 2. git add / commit / push
Write-Host "==> git commit + push" -ForegroundColor Cyan
Push-Location $root
try {
  & git add -A
  & git commit -m $Message
  if ($LASTEXITCODE -ne 0) { Write-Host "Nothing to commit (or commit failed)." -ForegroundColor Yellow }
  & git push
  if ($LASTEXITCODE -ne 0) { throw "git push failed" }
} finally {
  Pop-Location
}

Write-Host ""
Write-Host "Shipped: $Message" -ForegroundColor Green
if ($App -eq 'viewer' -or $App -eq 'both') {
  Write-Host "REMINDER: redeploy the Viewer in Apps Script (pencil -> New version -> Deploy)." -ForegroundColor Yellow
}
