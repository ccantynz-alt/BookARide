[CmdletBinding()]
param(
  [string]$RepoRoot = (Get-Location).Path,
  [string]$PythonExe = "python",
  [int]$MaxCandidates = 200,
  [switch]$AutoCommit,
  [switch]$AutoPush
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Info([string]$m){ Write-Host ("INFO  " + $m) -ForegroundColor Cyan }
function Ok([string]$m){ Write-Host ("OK    " + $m) -ForegroundColor Green }
function Warn([string]$m){ Write-Host ("WARN  " + $m) -ForegroundColor Yellow }
function Fail([string]$m){ Write-Host ("FAIL  " + $m) -ForegroundColor Red; throw $m }

function Run-Proc([string]$Exe, [string[]]$ProcArgs, [string]$WorkDir){
  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = $Exe
  $psi.WorkingDirectory = $WorkDir
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError  = $true
  $psi.UseShellExecute = $false
  $psi.CreateNoWindow = $true
  $psi.Arguments = ($ProcArgs -join " ")

  $p = New-Object System.Diagnostics.Process
  $p.StartInfo = $psi
  [void]$p.Start()
  $stdout = $p.StandardOutput.ReadToEnd()
  $stderr = $p.StandardError.ReadToEnd()
  $p.WaitForExit()

  return [pscustomobject]@{ ExitCode=$p.ExitCode; StdOut=$stdout; StdErr=$stderr }
}

function RunGit([string[]]$GitArgs){
  $r = Run-Proc "git.exe" $GitArgs (Get-Location).Path
  if ($r.ExitCode -ne 0) {
    Fail ("git " + ($GitArgs -join " ") + "`n" + $r.StdErr + "`n" + $r.StdOut)
  }
  return $r.StdOut
}

function Backup-File([string]$path){
  if (-not (Test-Path -LiteralPath $path)) { return $null }
  $ts = Get-Date -Format "yyyyMMdd_HHmmss"
  $bak = ($path + ".bak." + $ts)
  Copy-Item -LiteralPath $path -Destination $bak -Force
  return $bak
}

function PyCompileCheck([string]$filePath){
  if (-not (Test-Path -LiteralPath $filePath)) { return $false }
  $r = Run-Proc $PythonExe @("-m","py_compile","`"$filePath`"") (Get-Location).Path
  return ($r.ExitCode -eq 0)
}

Info ("RepoRoot = " + $RepoRoot)
if (-not (Test-Path -LiteralPath $RepoRoot)) { Fail ("RepoRoot not found: " + $RepoRoot) }
Set-Location -LiteralPath $RepoRoot

$gitTop = (RunGit @("rev-parse","--show-toplevel")).Trim()
if (-not $gitTop) { Fail "Not a git repository." }
if ($gitTop -ne (Get-Location).Path) { Set-Location -LiteralPath $gitTop }

$pyv = Run-Proc $PythonExe @("--version") (Get-Location).Path
if ($pyv.ExitCode -ne 0) { Fail "Python not available." }
Info ("Python: " + (($pyv.StdOut + $pyv.StdErr).Trim()))

$serverRel = "backend/server.py"
$serverAbs = Join-Path (Get-Location).Path $serverRel
if (-not (Test-Path -LiteralPath $serverAbs)) { Fail ("Missing " + $serverRel) }

$bak = Backup-File $serverAbs
if ($bak) { Ok ("Backed up -> " + $bak) }

$ts = Get-Date -Format "yyyyMMdd_HHmmss"
$branch = "doctor/restore-backend-v2-$ts"
RunGit @("checkout","-b",$branch) | Out-Null
Ok ("Branch: " + $branch)

Info ("Collecting commits that touched " + $serverRel + " ...")
$raw = RunGit @("log","--format=%H","-n",("$MaxCandidates"),"--",$serverRel)
$candidates = $raw.Split("`n") | ForEach-Object { $_.Trim() } | Where-Object { $_ }

if (-not $candidates -or $candidates.Count -eq 0) { Fail "No candidates found." }

Info ("Testing " + $candidates.Count + " candidate commits...")

$found = $null
$tested = 0

foreach ($sha in $candidates) {
  $tested++
  RunGit @("checkout",$sha,"--",$serverRel) | Out-Null

  if (PyCompileCheck $serverAbs) {
    $found = $sha
    Ok ("FOUND syntax-valid server.py at " + $sha + " (tested $tested)")
    break
  }
}

if (-not $found) { Fail "No syntax-valid server.py found." }

$porc = RunGit @("status","--porcelain")
if ($porc.Trim().Length -gt 0) {
  RunGit @("add","--",$serverRel) | Out-Null
  $msg = "Restore backend/server.py from last syntax-valid commit " + $found.Substring(0,7)
  RunGit @("commit","-m",$msg) | Out-Null
  Ok ("Committed: " + $msg)
} else {
  Warn "No changes detected after restore (server.py already matches?)."
}

if ($AutoPush) {
  RunGit @("push","-u","origin",$branch) | Out-Null
  Ok ("Pushed: " + $branch)
} else {
  Warn "AutoPush not set; not pushing."
}

Ok "DONE. Create PR -> merge."