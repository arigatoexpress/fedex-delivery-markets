---
type: setup
title: Sync with OneDrive (Microsoft)
updated: 2026-06-04
---

# ☁️ Share the hub with the team — Microsoft OneDrive

Because this vault is just a **folder of files**, you can share it with the whole
team by putting it in **OneDrive** (or SharePoint/Teams files). Everyone points
Obsidian at their synced copy and edits stay in sync.

## One-time setup (the person who owns the hub)
1. Make sure **OneDrive** is installed and signed in (built into Windows; for Mac
   get it from the App Store).
2. **Move** the `FedEx-Delivery-Markets-Ops-Vault` folder into your OneDrive
   folder (e.g. `OneDrive\Team\` or a shared library).
3. Right-click the folder → **Share** (or **OneDrive → Share**) and invite the
   team with **Edit** permission. For a department, a **SharePoint/Teams** document
   library is even better than personal OneDrive.
4. Tell teammates the folder name and where it lives.

## Each teammate
1. Open OneDrive and make sure the shared folder is syncing to their computer.
   - Tip: right-click the folder → **Always keep on this device** so Obsidian
     always has the files offline.
2. In Obsidian: **Open folder as vault** → choose the synced
   `FedEx-Delivery-Markets-Ops-Vault` folder.
3. Done — edits sync automatically.

## Healthy-sync tips (please read)
> [!warning] Two rules to avoid conflicts
> 1. **Let sync finish** before opening Obsidian (the OneDrive icon should show a
>    ✅, not spinning arrows).
> 2. **Don't edit the same note on two computers at the same moment.** OneDrive may
>    create a "conflicted copy" if you do. If you see a file with "conflict" in its
>    name, keep the newer one and delete the other.

- Keep the `.obsidian` settings folder **inside** the shared folder (it already is)
  — that's how everyone gets the same theme, dashboards, and the Dataview add-on
  once it's installed once. See [[Enable the Dashboards (Dataview)]].
- For heavy, simultaneous team use, consider official **Obsidian Sync** (paid) —
  it's built for this and avoids cloud-drive conflicts. OneDrive is fine for light use.

Related: [[Install Obsidian — Windows]] · [[Install Obsidian — Mac]] · [[Sync with Google Drive]]
