$ErrorActionPreference = "Stop"

$repoRoot = Join-Path $PSScriptRoot ".."
Push-Location $repoRoot

try {
  if (-not $env:NODE_ENV) {
    $env:NODE_ENV = "development"
  }

  if (-not $env:FIREBASE_SERVICE_ACCOUNT_JSON -and -not $env:FIREBASE_SERVICE_ACCOUNT_PATH) {
    Write-Error "No service account env vars set (FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH). Aborting; ADC is disabled for seeding."
    exit 1
  }

  Write-Host "Seeding access control data (collections: feature_access, access_groups)..."
  npx --yes tsx ".\scripts\access\seed-access.ts"
  Write-Host "Seeding finished."
} finally {
  Pop-Location
}
