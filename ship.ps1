# Refinery ship script — automates clasp push + version stamping + git commit/push.
#
# Behavior:
#   - clasp push the chosen app(s)
#   - auto-stamp the Current Versions table in HOW_THIS_WORKS.md from the
#     code itself (Viewer: line 1 marker; Ingestion: line 4 `* Version:` marker)
#   - git add / commit / push (the stamp update is included in the commit)
#
# Does NOT bump versions in Code.js or write the "what changed" description —
# those still need judgment, do them BEFORE running ship.ps1.
#
# Usage:
#   .\ship.ps1 -App ingestion -Message "Ingestion v2.56: short summary"
#   .\ship.ps1 -App viewer    -Message "Viewer v2.44: short summary"
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

function Get-IngestionVersion {
  # Ingestion uses a JSDoc header; version is on line 4 like " * Version: 2.55"
  $line = Get-Content -LiteralPath (Join-Path $root 'Ingestion\Code.js') -TotalCount 6 |
          Where-Object { $_ -match 'Version:\s*([0-9]+\.[0-9]+)' } |
          Select-Object -First 1
  if ($line -match 'Version:\s*([0-9]+\.[0-9]+)') { return $matches[1] }
  return $null
}

function Get-ViewerVersion {
  # Viewer uses a one-line header on line 1 like "// REFINERY - ... - Viewer v2.43"
  $line = Get-Content -LiteralPath (Join-Path $root 'Viewer\Code.js') -TotalCount 1
  if ($line -match 'Viewer\s+v([0-9]+\.[0-9]+)') { return $matches[1] }
  return $null
}

function Update-VersionStamps {
  $ing = Get-IngestionVersion
  $vwr = Get-ViewerVersion

  if (-not $ing -or -not $vwr) {
    Write-Host "WARN: could not parse version from Code.js headers — leaving HOW_THIS_WORKS.md untouched." -ForegroundColor Yellow
    Write-Host "      Ingestion line 4 should look like:   * Version: 2.XX" -ForegroundColor DarkGray
    Write-Host "      Viewer line 1 should look like:     // ... Viewer v2.XX" -ForegroundColor DarkGray
    return
  }

  $docPath = Join-Path $root 'HOW_THIS_WORKS.md'
  if (-not (Test-Path -LiteralPath $docPath)) {
    Write-Host "WARN: HOW_THIS_WORKS.md not found, skipping stamp." -ForegroundColor Yellow
    return
  }

  $today = Get-Date -Format 'yyyy-MM-dd'
  $doc = Get-Content -LiteralPath $docPath -Raw

  # Rewrite the | App | version | date | columns. Leaves the "What changed"
  # column alone — that requires judgment and stays whatever it was last set to.
  $newDoc = $doc -replace `
    '\| Ingestion \| v[0-9]+\.[0-9]+ \| [0-9]{4}-[0-9]{2}-[0-9]{2}', `
    "| Ingestion | v$ing | $today"
  $newDoc = $newDoc -replace `
    '\| Viewer \| v[0-9]+\.[0-9]+ \| [0-9]{4}-[0-9]{2}-[0-9]{2}', `
    "| Viewer | v$vwr | $today"

  if ($newDoc -eq $doc) {
    Write-Host "Version stamps already current (Ingestion v$ing, Viewer v$vwr, $today)." -ForegroundColor DarkGray
    return
  }

  Set-Content -LiteralPath $docPath -Value $newDoc -NoNewline
  Write-Host "==> Stamped HOW_THIS_WORKS.md: Ingestion v$ing, Viewer v$vwr ($today)." -ForegroundColor Cyan
  Write-Host "    REMINDER: update the 'What changed' column manually if the version bumped." -ForegroundColor Yellow
}

# 1. clasp push the relevant app(s)
switch ($App) {
  'ingestion' { Push-AppFolder 'Ingestion' }
  'viewer'    { Push-AppFolder 'Viewer' }
  'both'      { Push-AppFolder 'Ingestion'; Push-AppFolder 'Viewer' }
}

# 2. auto-stamp HOW_THIS_WORKS.md from code (no judgment needed)
Update-VersionStamps

# 3. git add / commit / push
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
