---
type: setup
title: Enable the Dashboards (Dataview)
updated: 2026-06-04
---

# 📊 The dashboards & route maps (Dataview + Excalidraw)

> [!success] Good news — these are **already installed** in this vault.
> The two add-ons that power the auto-updating dashboards (**Dataview**) and the
> editable route maps (**Excalidraw**) are pre-bundled. You usually don't have to
> install anything.

---

## First time you open the vault — one click
When you first open this vault, Obsidian shows a small box:
**"This vault contains community plugins… Trust author and enable plugins?"**

👉 Click **Trust author and enable plugins.**

That's it. The [[Operations Dashboard]] fills in, and the [[Maps]] open as
whiteboards. (If you skipped that box, see "Turn them on manually" below.)

---

## Turn them on manually (if needed)
1. Open **Settings** (gear, bottom-left) → **Community plugins**.
2. If you see a warning, click **Turn on community plugins** (safe — both add-ons
   are popular, open-source, and already in this vault).
3. You should see **Dataview** and **Excalidraw** listed. Make sure each shows
   **Enabled** (toggle on).
4. Open the [[Operations Dashboard]] and the [[Maps]] — they now render. 🎉

---

## Troubleshooting
- **Dashboard still shows code / a gray box?** Settings → Community plugins →
  confirm **Dataview** is **Enabled**, then reopen the dashboard.
- **A route map opens as text/code?** That's the raw drawing data. Click the
  **More options (•••)** at the top-right of the note → **Switch to Excalidraw
  view**. (Once Excalidraw is enabled, `.excalidraw` notes open as drawings.)
- **A teammate doesn't see them?** Their vault hasn't finished syncing the
  `.obsidian` folder yet — wait for sync to finish, then restart Obsidian. See
  [[Sync with OneDrive (Microsoft)]] / [[Sync with Google Drive]].

---

## Re-installing later (advanced / IT)
If you ever need to refresh the add-ons (e.g. a clean rebuild), the helper scripts
in this folder re-download them from their official GitHub releases:
- **Windows:** `setup-dataview-windows.ps1`
- **Mac / Linux:** `setup-dataview-mac-linux.sh`

> [!note] Supply-chain note
> The pre-bundled add-ons are **Dataview** (`blacksmithgu/obsidian-dataview`) and
> **Excalidraw** (`zsviczian/obsidian-excalidraw-plugin`), both open-source and
> fetched from their official release pages. Treat them like any reviewed
> dependency.
