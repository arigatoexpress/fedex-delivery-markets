---
type: setup
title: Install Obsidian — Linux
updated: 2026-06-04
---

# 🐧 Install Obsidian — Linux

Obsidian ships as an **AppImage**, a **Flatpak**, and a **Snap**. Pick whichever
your distro prefers. ~5 minutes.

## Easiest: AppImage (works on most distros)
1. Go to **https://obsidian.md/download** and download **Obsidian-x.x.x.AppImage**.
2. Make it runnable. In a terminal, in your Downloads folder:
   ```
   chmod +x Obsidian-*.AppImage
   ```
3. Double-click it in your file manager, or run `./Obsidian-*.AppImage`.
4. Click **Open folder as vault** → choose **`FedEx-Delivery-Markets-Ops-Vault`**.
5. If asked, **Trust author and enable plugins**.
6. Open **`00 — START HERE`**. 🎉

## Flatpak (Flathub)
```
flatpak install flathub md.obsidian.Obsidian
flatpak run md.obsidian.Obsidian
```

## Snap
```
sudo snap install obsidian --classic
```

## Next
- Turn on the dashboards: [[Enable the Dashboards (Dataview)]]
- Sharing on Linux is usually via **Google Drive** (e.g. `rclone`, Insync, or
  GNOME Online Accounts) or a shared network folder — see [[Sync with Google Drive]].

> [!note] No "missing libfuse" surprises
> If the AppImage won't start, install FUSE: on Debian/Ubuntu
> `sudo apt install libfuse2`. The Flatpak/Snap options avoid this entirely.
