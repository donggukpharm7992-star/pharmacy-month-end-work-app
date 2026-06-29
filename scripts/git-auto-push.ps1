param(
  [string]$Message = "chore: update pharmacy work app"
)

$ErrorActionPreference = "Stop"

git status --short
git add -A

$changes = git status --short
if (-not $changes) {
  Write-Output "No changes to commit."
  exit 0
}

git commit -m $Message

$remote = git remote
if ($remote -contains "origin") {
  git push origin HEAD
} else {
  Write-Output "No origin remote configured. Add GitHub remote first:"
  Write-Output "git remote add origin <github-url>"
}

