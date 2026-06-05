---
type: setup
title: Sync with Google Drive
updated: 2026-06-04
---

# ☁️ Share the hub with the team — Google Drive

Same idea as OneDrive: this vault is just a **folder**, so you can keep it in
**Google Drive** (or a Shared Drive) and the whole team points Obsidian at their
synced copy.

## One-time setup (the person who owns the hub)
1. Install **Google Drive for desktop** (Windows & Mac):
   **https://www.google.com/drive/download/**. It adds Drive as a folder/drive on
   your computer. (On Linux, use `rclone`, **Insync**, or GNOME Online Accounts.)
2. **Move** the `FedEx-Delivery-Markets-Ops-Vault` folder into your Google Drive
   folder. For team use, put it in a **Shared Drive** so ownership stays with the
   team, not one person.
3. Share it with the team with **Editor** access.

## Each teammate
1. Install **Google Drive for desktop** and sign in.
2. Make the shared folder **available offline**: right-click the folder →
   **Offline access → Available offline** (so Obsidian always has the files).
3. In Obsidian: **Open folder as vault** → pick the synced
   `FedEx-Delivery-Markets-Ops-Vault` folder.
4. Done.

## Healthy-sync tips (please read)
> [!warning] Two rules to avoid conflicts
> 1. **Wait for Drive to finish syncing** (the Drive icon shows ✔ when done)
>    before opening Obsidian.
> 2. **Don't edit the same note on two machines at once.** Drive may keep both
>    versions. If you see a duplicate, keep the newer one.

- Set the folder to **Available offline** — "stream-only" files can confuse
  Obsidian because the files aren't physically present until opened.
- The `.obsidian` settings folder travels with the vault, so everyone shares the
  same theme and dashboards (and the Dataview add-on once installed once —
  see [[Enable the Dashboards (Dataview)]]).
- Heavy simultaneous editing? Official **Obsidian Sync** (paid) is the smoothest.
  Google Drive is fine for light, mostly-read use.

Related: [[Install Obsidian — Windows]] · [[Install Obsidian — Mac]] · [[Install Obsidian — Linux]] · [[Sync with OneDrive (Microsoft)]]
