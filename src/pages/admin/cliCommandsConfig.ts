export type CliCommandCategory =
  | "deploy"
  | "seed"
  | "git"
  | "auth"
  | "firestore"
  | "setup"
  | "misc";

export type CliCommandRepo = "main" | "control-panel" | "auth-api" | "backend" | "global";

export type CliCommandEnvironment = "local" | "test" | "beta" | "prod" | "cloud-shell";

export type CliCommandShell = "powershell" | "bash";

export type CliCommandDangerLevel = "safe" | "warning" | "dangerous";

export interface CliCommandPlaceholder {
  name: string;
  description: string;
}

export interface CliCommand {
  id: string;
  title: string;
  description: string;
  command: string;
  shell: CliCommandShell;
  category: CliCommandCategory;
  repo: CliCommandRepo;
  environment: CliCommandEnvironment;
  dangerLevel: CliCommandDangerLevel;
  placeholders: CliCommandPlaceholder[];
  notes?: string;
  updatedAt?: string;
}

export const cliCommands: CliCommand[] = [
  {
    id: "auth-api-deploy-staging-powershell",
    title: "Deploy auth-api to Cloud Functions (staging, PowerShell)",
    description:
      "Builds the auth-api and deploys the Cloud Function `authApi` to the `sfdatahub-staging` project (europe-west1, Gen2, Node.js 20). Run from PowerShell on your dev machine.",
    command: `cd D:\\SFDataHub\\sfdatahub.github.io\\auth-api

npm run build

gcloud functions deploy authApi \`
  --project=sfdatahub-staging \`
  --region=europe-west1 \`
  --gen2 \`
  --runtime=nodejs20 \`
  --source=. \`
  --entry-point=authApi \`
  --trigger-http \`
  --allow-unauthenticated`,
    shell: "powershell",
    category: "deploy",
    repo: "auth-api",
    environment: "test",
    dangerLevel: "warning",
    placeholders: [],
    notes:
      "Requires gcloud CLI configured for the sfdatahub-staging project. Run from PowerShell on your local machine in the auth-api folder.",
  },
  {
    id: "auth-api-seed-access-control-powershell",
    title: "Seed Access-Control (auth-api, PowerShell)",
    description:
      "Calls the `/internal/seed/access-control` endpoint on auth.sfdatahub.com with the one-time seed token. Use from PowerShell.",
    command: `$ACCESS_SEED_TOKEN = 'DEIN_TOKEN_AUS_CLOUD_RUN_HIER'

$ACCESS_SEED_TOKEN  # kurz prüfen, dass er korrekt angezeigt wird

$headers = @{
    "x-access-seed-token" = $ACCESS_SEED_TOKEN
}

Invoke-RestMethod \`
    -Uri "https://auth.sfdatahub.com/internal/seed/access-control" \`
    -Method POST \`
    -Headers $headers`,
    shell: "powershell",
    category: "seed",
    repo: "auth-api",
    environment: "prod",
    dangerLevel: "warning",
    placeholders: [
      {
        name: "DEIN_TOKEN_AUS_CLOUD_RUN_HIER",
        description:
          "ACCESS_SEED_TOKEN value copied from Cloud Run / Secret Manager. Replace this placeholder with the real token before running.",
      },
    ],
  notes:
      "Use only with the correct one-time seed token from Cloud Run / Secret Manager. This writes access-control config in the auth-api.",
  },
  {
    id: "control-panel-deploy-main-powershell",
    title: "Deploy Control Panel (build + docs + push main)",
    description:
      "Builds the control-panel project and docs, then commits and pushes to origin main (GitHub Pages deploy).",
    command: `cd D:\\SFDataHub\\control-panel
npm run build
npm run build:docs
git add .
git commit -m "update"
git push -u origin main`,
    shell: "powershell",
    category: "deploy",
    repo: "control-panel",
    environment: "prod",
    dangerLevel: "warning",
    placeholders: [],
    notes: "Runs from your local machine in the control-panel repo and pushes directly to origin main.",
  },
  {
    id: "firestore-rules-deploy-main-powershell",
    title: "Deploy Firestore security rules (main)",
    description: "Deploys the Firestore security rules to the sfdatahub-main Firebase project.",
    command: `cd D:\\SFDataHub\\sfdatahub.github.io

firebase deploy --only firestore:rules --project sfdatahub-main`,
    shell: "powershell",
    category: "deploy",
    repo: "main",
    environment: "prod",
    dangerLevel: "warning",
    placeholders: [],
    notes:
      "Requires firebase-tools installed and logged in. Run this only after intentional changes to firestore.rules for the sfdatahub-main project.",
  },
  {
    id: "main-safe-deploy-no-backup-powershell",
    title: "Safe Deploy main repo (no local deletions)",
    description:
      "Runs the SFDataHub Safe Deploy script for the main repo. Builds for test/beta/main, copies dist → docs without deleting local files, creates 404.html, and pushes to the selected target (test/beta) or creates a release branch and PR link for main.",
    command: `# ============================================
# SFDataHub – Safe Deploy (KEINE lokalen Löschungen)
# - Build im gewählten Modus (test | beta | main)
# - dist → docs   (ADD-ONLY, KEIN Spiegeln, KEIN Löschen)
# - 404.html anlegen (SPA-Fallback)
# - Git:
#     * TEST/BETA: Commit & Push auf main (bei Bedarf --force-with-lease)
#     * MAIN:     Release-Branch aus lokalem main + PR-Link (kein Push auf main)
# ============================================

# === Einstellungen anpassen falls nötig ===
$Project = "D:\\SFDataHub\\sfdatahub.github.io"

$RepoTest = "https://github.com/SFDataHub/test.git"
$RepoBeta = "https://github.com/SFDataHub/beta.git"
$RepoMain = "https://github.com/SFDataHub/sfdatahub.github.io.git"

# === Hilfsfunktionen ===
function Fail($m){ throw $m }
function Dir($p){ if(-not(Test-Path $p)){ New-Item -Type Directory -Path $p -Force | Out-Null } }

function Ensure-NodeModules {
  if (-not (Test-Path (Join-Path $Project "node_modules"))) {
    if (Test-Path (Join-Path $Project "package-lock.json")) { npm ci } else { npm install }
  }
}

function Build-Mode {
  param([ValidateSet('test','beta','main')][string]$Mode)
  Write-Host "Baue für $Mode ..." -ForegroundColor Cyan
  Ensure-NodeModules
  $script = "build:$Mode"
  if (Get-Content (Join-Path $Project "package.json") -Raw | Select-String $script -Quiet) {
    npm run $script
    if ($LASTEXITCODE -ne 0) { Fail "Build-Script $script fehlgeschlagen." }
  } else {
    npx vite build --mode $Mode
    if ($LASTEXITCODE -ne 0) { Fail "Direkter Build (--mode $Mode) fehlgeschlagen." }
  }
  $distIndex = Join-Path $Project "dist\\index.html"
  if (-not (Test-Path $distIndex)) { Fail "dist/index.html fehlt – Build fehlerhaft." }
}

function Update-Docs {
  $Dist = Join-Path $Project "dist"
  $Docs = Join-Path $Project "docs"
  Dir $Docs
  # ADD-ONLY Kopie: keine Löschungen in docs
  robocopy $Dist $Docs *.* /E /NFL /NDL /NJH /NJS /NP | Out-Null
  $docsIndex = Join-Path $Docs "index.html"
  if (Test-Path $docsIndex) {
    Copy-Item $docsIndex (Join-Path $Docs "404.html") -Force
  }
  Write-Host "docs aktualisiert (dist → docs, 404.html erstellt)." -ForegroundColor Cyan
}

function Git-Prep {
  param([string]$RepoUrl, [string]$Branch = "main")
  if (-not (Test-Path (Join-Path $Project ".git"))) { git init }
  $remotes = git remote
  if ($remotes -match "^origin$") { git remote remove origin }
  git remote add origin $RepoUrl
  git checkout -B $Branch
  git fetch origin --prune 2>$null | Out-Null
}

function Push-TestBeta {
  param([string]$RepoUrl, [string]$branchName, [string]$commitMsg)
  Git-Prep -RepoUrl $RepoUrl -Branch $branchName
  # Rebase versuchen, aber KEINE Hard-Resets (keine lokalen Löschungen)
  $hasRemote = $false
  git rev-parse --verify "origin/$branchName" 2>$null | Out-Null
  if ($LASTEXITCODE -eq 0) { $hasRemote = $true }
  if ($hasRemote) {
    git pull --rebase origin $branchName
    if ($LASTEXITCODE -ne 0) { Write-Warning "Rebase fehlgeschlagen – es wird kontrolliert mit --force-with-lease gepusht (Remote wird ersetzt, lokal bleibt unverändert)." }
  }
  git add -A
  git commit -m $commitMsg 2>$null | Out-Null
  git push -u origin $branchName
  if ($LASTEXITCODE -ne 0) {
    Write-Host "Normaler Push fehlgeschlagen – versuche --force-with-lease (nur test/beta)." -ForegroundColor Yellow
    git push -u origin $branchName --force-with-lease
    if ($LASTEXITCODE -ne 0) { Fail "Push fehlgeschlagen. Bitte Ausgabe prüfen." }
  }
}

function Release-Main {
  param([string]$RepoUrl, [string]$labelStamp)
  # Lokalen main sanft aktualisieren (KEIN reset --hard)
  if (-not (Test-Path (Join-Path $Project ".git"))) { git init }
  $rem = git remote
  if ($rem -match "^origin$") { git remote remove origin }
  git remote add origin $RepoUrl
  git fetch origin --prune
  git checkout -B main
  git pull --rebase origin main
  if ($LASTEXITCODE -ne 0) { Fail "Rebase auf main fehlgeschlagen. Konflikte lösen (git status), dann erneut ausführen. Lokale Daten wurden NICHT gelöscht." }

  # Release-Branch aus lokalem main abzweigen
  $rel = "release/$labelStamp"
  git checkout -B $rel main

  git add -A
  git commit -m "release(main): dist→docs + 404 ($labelStamp)" 2>$null | Out-Null
  git push -u origin $rel
  if ($LASTEXITCODE -ne 0) { Fail "Push des Release-Branches fehlgeschlagen." }

  $pr = "https://github.com/SFDataHub/sfdatahub.github.io/compare/main...$rel?expand=1"
  Write-Host "PR öffnen & mergen: $pr" -ForegroundColor Cyan
}

# === Start ===
if (-not (Test-Path $Project)) { Fail "Projektordner nicht gefunden: $Project" }
Set-Location $Project

Write-Host ""
Write-Host "=== Safe Deploy Menü (ohne lokale Löschungen) ===" -ForegroundColor Cyan
Write-Host "1) Build & Publish → TEST   (base=/test/)"
Write-Host "2) Build & Publish → BETA   (base=/beta/)"
Write-Host "3) Build & PR  → MAIN       (base=/, Release-Branch + PR)"
Write-Host "0) Abbrechen"
$choice = Read-Host "Wähle 0-3"

switch ($choice) {
  '1' {
    $stamp = Get-Date -Format "yyyyMMdd_HHmmss"
    Build-Mode -Mode test
    Update-Docs
    Push-TestBeta -RepoUrl $RepoTest -branchName "main" -commitMsg "publish(test): dist→docs + 404 ($stamp)"
    Write-Host "✔ TEST deployed. Pages: Branch=main, Folder=/docs" -ForegroundColor Green
  }
  '2' {
    $stamp = Get-Date -Format "yyyyMMdd_HHmmss"
    Build-Mode -Mode beta
    Update-Docs
    Push-TestBeta -RepoUrl $RepoBeta -branchName "main" -commitMsg "publish(beta): dist→docs + 404 ($stamp)"
    Write-Host "✔ BETA deployed. Pages: Branch=main, Folder=/docs" -ForegroundColor Green
  }
  '3' {
    $stamp = Get-Date -Format "yyyyMMdd_HHmmss"
    Build-Mode -Mode main
    Update-Docs
    Release-Main -RepoUrl $RepoMain -labelStamp $stamp
    Write-Host "✔ Release-Branch erstellt & gepusht. Erstelle den PR und merge nach main." -ForegroundColor Green
  }
  default {
    Write-Host "Abgebrochen." -ForegroundColor Yellow
  }
}`,
    shell: "powershell",
    category: "deploy",
    repo: "main",
    environment: "prod",
    dangerLevel: "warning",
    placeholders: [],
    notes:
      "Interactive Safe Deploy menu for test/beta/main. Does not delete local files, uses dist → docs copy and creates a main release branch with PR link.",
  },
  {
    id: "main-safe-deploy-with-backup-powershell",
    title: "Safe Deploy main repo (with ZIP backup)",
    description:
      "Runs the SFDataHub Safe Deploy script for the main repo with ZIP backup. Creates a backup of the project folder, builds for test/beta/main, copies dist → docs without deleting local files, creates 404.html, and pushes or creates a release branch.",
    command: `# ============================================
# SFDataHub – Safe Deploy (KEINE lokalen Löschungen)
# - Backup (ZIP) des Projektordners
# - Build im gewählten Modus (test | beta | main)
# - dist → docs   (ADD-ONLY, KEIN Spiegeln, KEIN Löschen)
# - 404.html anlegen (SPA-Fallback)
# - Git:
#     * TEST/BETA: Commit & Push auf main (bei Bedarf --force-with-lease)
#     * MAIN:     Release-Branch aus lokalem main + PR-Link (kein Push auf main)
# ============================================

# === Einstellungen anpassen falls nötig ===
$Project = "D:\\SFDataHub\\sfdatahub.github.io"
$Backup  = "D:\\SFDataHub\\_backups"

$RepoTest = "https://github.com/SFDataHub/test.git"
$RepoBeta = "https://github.com/SFDataHub/beta.git"
$RepoMain = "https://github.com/SFDataHub/sfdatahub.github.io.git"

# === Hilfsfunktionen ===
function Fail($m){ throw $m }
function Dir($p){ if(-not(Test-Path $p)){ New-Item -Type Directory -Path $p -Force | Out-Null } }

function Backup-Zip {
  param([string]$label)
  Dir $Backup
  $t = Get-Date -Format "yyyyMMdd_HHmmss"
  $zip = Join-Path $Backup ("\${label}_$t.zip")
  if (Test-Path $zip) { Remove-Item $zip -Force }
  Compress-Archive -Path (Join-Path $Project "*") -DestinationPath $zip -Force
  Write-Host "Backup erstellt: $zip" -ForegroundColor Green
  return $t
}

function Ensure-NodeModules {
  if (-not (Test-Path (Join-Path $Project "node_modules"))) {
    if (Test-Path (Join-Path $Project "package-lock.json")) { npm ci } else { npm install }
  }
}

function Build-Mode {
  param([ValidateSet('test','beta','main')][string]$Mode)
  Write-Host "Baue für $Mode ..." -ForegroundColor Cyan
  Ensure-NodeModules
  $script = "build:$Mode"
  if (Get-Content (Join-Path $Project "package.json") -Raw | Select-String $script -Quiet) {
    npm run $script
    if ($LASTEXITCODE -ne 0) { Fail "Build-Script $script fehlgeschlagen." }
  } else {
    npx vite build --mode $Mode
    if ($LASTEXITCODE -ne 0) { Fail "Direkter Build (--mode $Mode) fehlgeschlagen." }
  }
  $distIndex = Join-Path $Project "dist\\index.html"
  if (-not (Test-Path $distIndex)) { Fail "dist/index.html fehlt – Build fehlerhaft." }
}

function Update-Docs {
  $Dist = Join-Path $Project "dist"
  $Docs = Join-Path $Project "docs"
  Dir $Docs
  # ADD-ONLY Kopie: keine Löschungen in docs
  robocopy $Dist $Docs *.* /E /NFL /NDL /NJH /NJS /NP | Out-Null
  $docsIndex = Join-Path $Docs "index.html"
  if (Test-Path $docsIndex) {
    Copy-Item $docsIndex (Join-Path $Docs "404.html") -Force
  }
  Write-Host "docs aktualisiert (dist → docs, 404.html erstellt)." -ForegroundColor Cyan
}

function Git-Prep {
  param([string]$RepoUrl, [string]$Branch = "main")
  if (-not (Test-Path (Join-Path $Project ".git"))) { git init }
  $remotes = git remote
  if ($remotes -match "^origin$") { git remote remove origin }
  git remote add origin $RepoUrl
  git checkout -B $Branch
  git fetch origin --prune 2>$null | Out-Null
}

function Push-TestBeta {
  param([string]$RepoUrl, [string]$branchName, [string]$commitMsg)
  Git-Prep -RepoUrl $RepoUrl -Branch $branchName
  # Rebase versuchen, aber KEINE Hard-Resets (keine lokalen Löschungen)
  $hasRemote = $false
  git rev-parse --verify "origin/$branchName" 2>$null | Out-Null
  if ($LASTEXITCODE -eq 0) { $hasRemote = $true }
  if ($hasRemote) {
    git pull --rebase origin $branchName
    if ($LASTEXITCODE -ne 0) { Write-Warning "Rebase fehlgeschlagen – es wird kontrolliert mit --force-with-lease gepusht (Remote wird ersetzt, lokal bleibt unverändert)." }
  }
  git add -A
  git commit -m $commitMsg 2>$null | Out-Null
  git push -u origin $branchName
  if ($LASTEXITCODE -ne 0) {
    Write-Host "Normaler Push fehlgeschlagen – versuche --force-with-lease (nur test/beta)." -ForegroundColor Yellow
    git push -u origin $branchName --force-with-lease
    if ($LASTEXITCODE -ne 0) { Fail "Push fehlgeschlagen. Bitte Ausgabe prüfen." }
  }
}

function Release-Main {
  param([string]$RepoUrl, [string]$labelStamp)
  # Lokalen main sanft aktualisieren (KEIN reset --hard)
  if (-not (Test-Path (Join-Path $Project ".git"))) { git init }
  $rem = git remote
  if ($rem -match "^origin$") { git remote remove origin }
  git remote add origin $RepoUrl
  git fetch origin --prune
  git checkout -B main
  git pull --rebase origin main
  if ($LASTEXITCODE -ne 0) { Fail "Rebase auf main fehlgeschlagen. Konflikte lösen (git status), dann erneut ausführen. Lokale Daten wurden NICHT gelöscht." }

  # Release-Branch aus lokalem main abzweigen
  $rel = "release/$labelStamp"
  git checkout -B $rel main

  git add -A
  git commit -m "release(main): dist→docs + 404 ($labelStamp)" 2>$null | Out-Null
  git push -u origin $rel
  if ($LASTEXITCODE -ne 0) { Fail "Push des Release-Branches fehlgeschlagen." }

  $pr = "https://github.com/SFDataHub/sfdatahub.github.io/compare/main...$rel?expand=1"
  Write-Host "PR öffnen & mergen: $pr" -ForegroundColor Cyan
}

# === Start ===
if (-not (Test-Path $Project)) { Fail "Projektordner nicht gefunden: $Project" }
Set-Location $Project

Write-Host ""
Write-Host "=== Safe Deploy Menü (ohne lokale Löschungen) ===" -ForegroundColor Cyan
Write-Host "1) Build & Publish → TEST   (base=/test/)"
Write-Host "2) Build & Publish → BETA   (base=/beta/)"
Write-Host "3) Build & PR  → MAIN       (base=/, Release-Branch + PR)"
Write-Host "0) Abbrechen"
$choice = Read-Host "Wähle 0-3"

switch ($choice) {
  '1' {
    $stamp = Backup-Zip -label "push_test"
    Build-Mode -Mode test
    Update-Docs
    Push-TestBeta -RepoUrl $RepoTest -branchName "main" -commitMsg "publish(test): dist→docs + 404 ($stamp)"
    Write-Host "✔ TEST deployed. Pages: Branch=main, Folder=/docs" -ForegroundColor Green
  }
  '2' {
    $stamp = Backup-Zip -label "push_beta"
    Build-Mode -Mode beta
    Update-Docs
    Push-TestBeta -RepoUrl $RepoBeta -branchName "main" -commitMsg "publish(beta): dist→docs + 404 ($stamp)"
    Write-Host "✔ BETA deployed. Pages: Branch=main, Folder=/docs" -ForegroundColor Green
  }
  '3' {
    $stamp = Backup-Zip -label "release_main"
    Build-Mode -Mode main
    Update-Docs
    Release-Main -RepoUrl $RepoMain -labelStamp $stamp
    Write-Host "✔ Release-Branch erstellt & gepusht. Erstelle den PR und merge nach main." -ForegroundColor Green
  }
  default {
    Write-Host "Abgebrochen." -ForegroundColor Yellow
  }
}`,
    shell: "powershell",
    category: "deploy",
    repo: "main",
    environment: "prod",
    dangerLevel: "warning",
    placeholders: [],
    notes:
      "Same Safe Deploy menu as the non-backup version, but creates a ZIP backup of the project folder before building and pushing.",
  },
  {
    id: "update-stats-cache-player-derived-powershell",
    title: "Update stats_cache_player_derived (Firestore cache)",
    description:
      "Runs the update-player-derived.mts script to refresh the stats_cache_player_derived collection in Firestore.",
    command: `cd D:\\SFDataHub\\sfdatahub.github.io

# (falls noch nicht gemacht in dieser Windows-Session)
gcloud auth application-default login

# Script ausführen
npx tsx .\\tools\\update-player-derived.mts`,
    shell: "powershell",
    category: "firestore",
    repo: "main",
    environment: "prod",
    dangerLevel: "warning",
    placeholders: [],
    notes:
      "Requires gcloud CLI and application-default credentials for the correct Firebase/Firestore project. Use when you want to recalculate the stats_cache_player_derived collection via the TSX tool script.",
  },
];
