#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# setup-dataview-mac-linux.sh
#
# OPTIONAL convenience script for the IT / rollout person.
# It downloads the official, open-source "Dataview" Obsidian add-on into this
# vault so the auto-updating dashboards work for everyone who syncs the vault.
#
# You normally do NOT need this — the in-app installer is easier:
#   see "Enable the Dashboards (Dataview).md".
#
# What it does:
#   - Downloads manifest.json + main.js + styles.css from Dataview's official
#     GitHub releases page (https://github.com/blacksmithgu/obsidian-dataview).
#   - Places them in <vault>/.obsidian/plugins/dataview/
#
# Run it ONCE on the synced copy of the vault. Requires: bash + curl.
# Usage:   bash setup-dataview-mac-linux.sh
# ---------------------------------------------------------------------------
set -euo pipefail

# Vault root = parent of the folder this script lives in (Setup/ -> vault root)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VAULT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DEST="$VAULT_ROOT/.obsidian/plugins/dataview"

echo "Vault root : $VAULT_ROOT"
echo "Installing : Dataview -> $DEST"
mkdir -p "$DEST"

BASE="https://github.com/blacksmithgu/obsidian-dataview/releases/latest/download"

# manifest.json and main.js are required; styles.css is best-effort.
curl -fL "$BASE/manifest.json" -o "$DEST/manifest.json"
curl -fL "$BASE/main.js"       -o "$DEST/main.js"
curl -fL "$BASE/styles.css"    -o "$DEST/styles.css" || echo "(styles.css not found in release — that's OK)"

echo ""
echo "✅ Done. Now open Obsidian and confirm Dataview shows as Enabled under"
echo "   Settings → Community plugins, then open the Operations Dashboard."
