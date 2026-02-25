[CmdletBinding()]
param(
  [Parameter(Mandatory=$true)]
  [string]$RepoRoot,

  [string]$FrontendDir = "frontend",

  [switch]$Install,
  [switch]$Build,

  [switch]$WriteVercelJson,

  [switch]$Commit,
  [switch]$Push,

  [string]$CommitMessage = "Green: Node20 + CRA/CRACO overrides + CI=false build + clean reinstall"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Ok($m){ Write-Host ("OK   " + $m) -ForegroundColor Green }
function Warn($m){ Write-Host ("WARN " + $m) -ForegroundColor Yellow }
function Fail($m){ Write-Host ("FAIL " + $m) -ForegroundColor Red; throw $m }

function Assert-Path($p, $label){
  if (-not (Test-Path -LiteralPath $p)) { Fail "$label not found: $p" }
}

function Backup-File($path){
  if (-not (Test-Path -LiteralPath $path)) { return }
  $ts = Get-Date -Format "yyyyMMdd_HHmmss"
  $bak = "$path.bak.$ts"
  Copy-Item -LiteralPath $path -Destination $bak -Force
  Ok "Backup created: $bak"
}

function Read-Json($path){
  $raw = Get-Content -LiteralPath $path -Raw
  try { return ($raw | ConvertFrom-Json -Depth 100) }
  catch { Fail "Failed to parse JSON: $path  ($($_.Exception.Message))" }
}

function Write-JsonPretty($path, $obj){
  $json = $obj | ConvertTo-Json -Depth 100
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($path, $json + "`n", $utf8NoBom)
}

function Get-SemverMajor([string]$ver){
  if ([string]::IsNullOrWhiteSpace($ver)) { return $null }
  $v = $ver.Trim()
  $v = $v -replace '^[\^\~\<\>\=\s]*', ''
  $v = $v -replace '^[vV]', ''
  if ($v -match '^(\d+)\.x') { return [int]$Matches[1] }
  if ($v -match '^(\d+)\.(\d+)\.(\d+)') { return [int]$Matches[1] }
  if ($v -match '^(\d+)$') { return [int]$Matches[1] }
  return $null
}

function Run-Cmd([string]$exe, [string[]]$args, [string]$workdir){
  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = $exe
  $psi.WorkingDirectory = $workdir
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError  = $true
  $psi.UseShellExecute = $false
  foreach($a in $args){ [void]$psi.ArgumentList.Add($a) }

  $p = New-Object System.Diagnostics.Process
  $p.StartInfo = $psi
  [void]$p.Start()
  $stdout = $p.StandardOutput.ReadToEnd()
  $stderr = $p.StandardError.ReadToEnd()
  $p.WaitForExit()

  if ($stdout) { Write-Host $stdout }
  if ($stderr) { Write-Host $stderr -ForegroundColor Yellow }

  if ($p.ExitCode -ne 0) {
    Fail ("Command failed (exit {0}): {1} {2}" -f $p.ExitCode, $exe, ($args -join " "))
  }
}

# --- Resolve paths
$RepoRoot = (Resolve-Path -LiteralPath $RepoRoot).Path
$FrontendPath = Join-Path $RepoRoot $FrontendDir
$PkgPath = Join-Path $FrontendPath "package.json"
$LockPath = Join-Path $FrontendPath "package-lock.json"
$NodeModules = Join-Path $FrontendPath "node_modules"
$VercelJson = Join-Path $RepoRoot "vercel.json"

Assert-Path $FrontendPath "Frontend directory"
Assert-Path $PkgPath "frontend/package.json"
Ok "RepoRoot: $RepoRoot"
Ok "Frontend: $FrontendPath"

# --- Patch frontend/package.json
Backup-File $PkgPath
$pkg = Read-Json $PkgPath

if (-not $pkg.engines) { $pkg | Add-Member -NotePropertyName "engines" -NotePropertyValue ([pscustomobject]@{}) }
$pkg.engines.node = "20.x"
$pkg.engines.npm  = "10.x"

if (-not $pkg.overrides) { $pkg | Add-Member -NotePropertyName "overrides" -NotePropertyValue ([pscustomobject]@{}) }
$pkg.overrides."schema-utils"  = "3.3.0"
$pkg.overrides."ajv"          = "6.12.6"
$pkg.overrides."ajv-keywords" = "3.5.2"

if (-not $pkg.dependencies)    { $pkg | Add-Member -NotePropertyName "dependencies" -NotePropertyValue ([pscustomobject]@{}) }
if (-not $pkg.devDependencies) { $pkg | Add-Member -NotePropertyName "devDependencies" -NotePropertyValue ([pscustomobject]@{}) }

$deps = @{}
foreach($p in $pkg.dependencies.PSObject.Properties){ $deps[$p.Name] = [string]$p.Value }
$dev  = @{}
foreach($p in $pkg.devDependencies.PSObject.Properties){ $dev[$p.Name] = [string]$p.Value }

function Get-PkgVersion([string]$name){
  if ($deps.ContainsKey($name)) { return $deps[$name] }
  if ($dev.ContainsKey($name))  { return $dev[$name] }
  return $null
}

$cracoVer = Get-PkgVersion "@craco/craco"
$rsVer    = Get-PkgVersion "react-scripts"

$cracoMajor = Get-SemverMajor $cracoVer
$rsMajor    = Get-SemverMajor $rsVer

if ($cracoVer) { Ok "@craco/craco: $cracoVer (major=$cracoMajor)" } else { Warn "@craco/craco not found." }
if ($rsVer)    { Ok "react-scripts: $rsVer (major=$rsMajor)" } else { Warn "react-scripts not found." }

if ($cracoMajor -ne $null -and $cracoMajor -ge 7 -and $rsMajor -ne $null -and $rsMajor -lt 5) {
  Warn "Aligning react-scripts to 5.0.1 for CRACO v7+ compatibility."
  if ($deps.ContainsKey("react-scripts")) { $pkg.dependencies."react-scripts" = "5.0.1" }
  else { $pkg.devDependencies."react-scripts" = "5.0.1" }
}

if (-not (Get-PkgVersion "cross-env")) {
  $pkg.devDependencies."cross-env" = "7.0.3"
  Ok "Added devDependency: cross-env@7.0.3"
}

if (-not $pkg.scripts) { $pkg | Add-Member -NotePropertyName "scripts" -NotePropertyValue ([pscustomobject]@{}) }

$buildScript = [string]$pkg.scripts.build
if ([string]::IsNullOrWhiteSpace($buildScript)) {
  Warn "No scripts.build found. Setting to 'cross-env CI=false craco build'."
  $pkg.scripts.build = "cross-env CI=false craco build"
} else {
  if ($buildScript -match '\bcraco\b' -and $buildScript -notmatch '\bCI=false\b') {
    Warn "Rewriting scripts.build to 'cross-env CI=false craco build'."
    $pkg.scripts.build = "cross-env CI=false craco build"
  } elseif ($buildScript -match '\breact-scripts\s+build\b' -and $buildScript -notmatch '\bCI=false\b') {
    Warn "Rewriting scripts.build to 'cross-env CI=false react-scripts build'."
    $pkg.scripts.build = "cross-env CI=false react-scripts build"
  } else {
    Ok "scripts.build left as-is: $buildScript"
  }
}

Write-JsonPretty $PkgPath $pkg
Ok "Patched: frontend/package.json"

# --- Optionally write vercel.json
if ($WriteVercelJson) {
  Backup-File $VercelJson
  $vercelObj = [pscustomobject]@{
    version = 2
    builds = @(
      [pscustomobject]@{
        src = "frontend/package.json"
        use = "@vercel/static-build"
        config = [pscustomobject]@{ distDir = "frontend/build" }
      }
    )
    routes = @(
      [pscustomobject]@{ handle = "filesystem" },
      [pscustomobject]@{ src = "/(.*)"; dest = "/frontend/build/index.html" }
    )
  }
  $json = $vercelObj | ConvertTo-Json -Depth 100
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($VercelJson, $json + "`n", $utf8NoBom)
  Ok "Wrote: vercel.json"
}

# --- HARD CLEAN
if (Test-Path -LiteralPath $NodeModules) {
  Ok "Deleting node_modules..."
  Remove-Item -LiteralPath $NodeModules -Recurse -Force
  Ok "Deleted node_modules."
} else { Ok "node_modules not present (skip)." }

if (Test-Path -LiteralPath $LockPath) {
  Ok "Deleting package-lock.json..."
  Remove-Item -LiteralPath $LockPath -Force
  Ok "Deleted package-lock.json."
} else { Ok "package-lock.json not present (skip)." }

# --- Install + Build
if ($Install) {
  Ok "npm install (frontend)"
  Run-Cmd "npm" @("install") $FrontendPath
  Ok "npm install OK"
}

if ($Build) {
  Ok "npm run build (frontend)"
  Run-Cmd "npm" @("run","build") $FrontendPath
  Ok "npm run build OK"
}

# --- Git commit / push
if ($Commit -or $Push) {
  Assert-Path (Join-Path $RepoRoot ".git") "Git repo (.git)"
}

if ($Commit) {
  $porc = & git -C $RepoRoot status --porcelain
  if (-not $porc) { Ok "No changes to commit." }
  else {
    & git -C $RepoRoot add -A | Out-Host
    & git -C $RepoRoot commit -m $CommitMessage | Out-Host
    Ok "Committed: $CommitMessage"
  }
}

if ($Push) {
  Ok "Pushing..."
  & git -C $RepoRoot push | Out-Host
  Ok "Pushed."
}

Ok "DONE — Green nuclear pass complete."
