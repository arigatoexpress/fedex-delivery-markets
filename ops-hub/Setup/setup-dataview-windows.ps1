# ---------------------------------------------------------------------------
# setup-dataview-windows.ps1
#
# OPTIONAL convenience script for the IT / rollout person.
# Downloads the official, open-source "Dataview" Obsidian add-on into this vault
# so the auto-updating dashboards work for everyone who syncs the vault.
#
# You normally do NOT need this — the in-app installer is easier:
#   see "Enable the Dashboards (Dataview).md".
#
# What it does:
#   - Downloads manifest.json + main.js + styles.css from Dataview's official
#     GitHub releases page (https://github.com/blacksmithgu/obsidian-dataview).
#   - Places them in <vault>\.obsidian\plugins\dataview\
#
# Run it ONCE on the synced copy of the vault.
# Usage (in PowerShell, from this Setup folder):
#   powershell -ExecutionPolicy Bypass -File .\setup-dataview-windows.ps1
# ---------------------------------------------------------------------------
$ErrorActionPreference = "Stop"

# Vault root = parent of the folder this script lives in (Setup\ -> vault root)
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$VaultRoot = Split-Path -Parent $ScriptDir
$Dest      = Join-Path $VaultRoot ".obsidian\plugins\dataview"

Write-Host "Vault root : $VaultRoot"
Write-Host "Installing : Dataview -> $Dest"
New-Item -ItemType Directory -Force -Path $Dest | Out-Null

$Base = "https://github.com/blacksmithgu/obsidian-dataview/releases/latest/download"

# manifest.json and main.js are required; styles.css is best-effort.
Invoke-WebRequest "$Base/manifest.json" -OutFile (Join-Path $Dest "manifest.json")
Invoke-WebRequest "$Base/main.js"       -OutFile (Join-Path $Dest "main.js")
try {
  Invoke-WebRequest "$Base/styles.css"  -OutFile (Join-Path $Dest "styles.css")
} catch {
  Write-Host "(styles.css not found in release - that's OK)"
}

Write-Host ""
Write-Host "Done. Open Obsidian and confirm Dataview shows as Enabled under"
Write-Host "Settings -> Community plugins, then open the Operations Dashboard."
