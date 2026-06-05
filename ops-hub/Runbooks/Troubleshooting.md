---
type: runbook
title: Troubleshooting
updated: 2026-06-04
---

# 🔧 Troubleshooting

Common hiccups and the simplest fix. If something looks **unsafe** (real data,
real money), don't troubleshoot — go straight to [[Incident & Escalation]].

---

## The app won't open in my browser
- **Check the address.** Dev is `http://127.0.0.1:5178`. The production-style build
  is `http://127.0.0.1:4747`. They're different — make sure you're using the right one.
- **Is it actually running?** The terminal that ran `npm run dev` must stay open.
  If that window was closed, the app stopped. Restart it (see [[Run a Demo (step by step)]]).
- **Try a hard refresh:** `Ctrl/Cmd + Shift + R`.

## "Page can't be reached" / nothing loads
- The app probably isn't started. Ask the technical teammate to run `npm run dev`,
  or do it yourself per [[Run a Demo (step by step)]].
- Wait ~10 seconds after starting — it needs a moment to boot.

## A demo tracking number doesn't do anything
- Use the **exact** numbers from [[Demo Tracking Numbers]] (copy/paste to avoid typos).
- Each number behaves differently on purpose (open / locked / resolved). That's not
  a bug — see [[Demo Tracking Numbers]] for what each one does.

## The market looks "locked" and I can't take a side
- That's expected for `882345678901` (reached the hub) and `993456789012`
  (delivered). Use `771234567890` to show an **open** market.

## The dashboards in this hub show code or a gray box
- Turn on **Dataview** once: [[Enable the Dashboards (Dataview)]]. After that they
  fill in automatically.

## My notes/links aren't showing up for a teammate
- This is a **sync** delay. Give OneDrive/Google Drive a minute to finish syncing,
  then have them reopen Obsidian. See [[Sync with OneDrive (Microsoft)]] /
  [[Sync with Google Drive]] for healthy-sync tips (don't edit the same note on two
  machines at the same second).

## For the technical teammate — quick health check
Run these in the repo folder; all should pass:
```
npm run verify        # typecheck + tests + build
npm run browser:smoke # quick automated click-through
```
If `verify` fails, the app may not be safe to demo — flag it to the owner in
[[Roles & Owners]].

---

Still stuck? Log it in a [[Templates/Demo Session Log|Demo Session Log]] (mark
result = "issues") and ping the owner from [[Roles & Owners]].
