---
type: runbook
title: Run a Demo (step by step)
updated: 2026-06-04
---

# ▶️ Run a Demo — step by step

This walks you through showing the app to someone, start to finish. There are
**two parts**: *(A)* a technical teammate starts the app, and *(B)* you drive the
demo. If you're comfortable, you can do both yourself.

> [!tip] Before you start
> Skim the [[Daily Demo Checklist]] and keep [[Safety & What This Is NOT]] open in
> another tab. Log the session afterward with the [[Templates/Demo Session Log|Demo Session Log]] template.

---

## Part A — Start the app (technical teammate, one time per session)

> This part uses a terminal. If that's not you, ask whoever set up the repo. It
> takes ~1 minute once installed.

1. Open a terminal in the repo folder: `~/Code/fedex-delivery-markets/`
2. First time only, install: `npm install`
3. Start it: `npm run dev`
4. Wait for it to say it's ready, then open this address in a browser:
   **http://127.0.0.1:5178**

For a polished, production-style build instead:
```
npm run build
NODE_ENV=production npm run start
```
…then open **http://127.0.0.1:4747**.

> [!note] What "127.0.0.1" means
> It's just "this computer." The app runs **locally** — nothing is published to
> the internet. See [[Glossary (plain English)]].

---

## Part B — Drive the demo (anyone)

### 1. Set the frame (say this first)
> "This is an **internal, paper-only prototype** with **fake data**. No real money,
> no real customer info, not connected to FedEx systems. It's how we explore the
> idea safely." *(From [[Safety & What This Is NOT]].)*

### 2. Enter a demo tracking number
Use one from [[Demo Tracking Numbers]]. Pick based on what you want to show:

| Tracking number | What it shows |
|---|---|
| `771234567890` | A package **before the hub** — markets are **open** (you can take a side). |
| `882345678901` | A package that **reached the hub** — markets are **locked**. |
| `993456789012` | A package **delivered** — markets are **resolved** (final answer). |

### 3. Claim demo access
Click the **"claim demo access"** button. This is a *pretend* sign-in — there's no
real account. It just unlocks the demo view.

### 4. Show the YES / NO market
Point out the question (will it arrive in its window?) and the **YES** and **NO**
prices. Explain: *"the price reads like a probability — 70¢ ≈ 70% chance."*

### 5. Get a quote and submit a paper order
- Click to **quote** the price.
- Submit a **paper order**. Emphasize the word **paper** — *practice, not real.*
- Nothing is bought, nothing is owed.

### 6. (Optional, advanced) Show the calldata preview
There's a technical **"calldata preview."** You can say: *"engineers use this to
check what a future blockchain instruction would look like — but it's never
actually sent."* Then move on. Ops audiences usually skip this.

### 7. Show resolution
Switch to `993456789012` (a delivered package) to show a **resolved** market —
the final YES/NO outcome. This closes the loop: question → market → answer.

### 8. Close the frame (say this last)
> "Again — pretend points, fake data, nothing real moved. This lets us talk about
> the rules and the customer experience **before** building anything."

---

## After the demo
- Fill out a **[[Templates/Demo Session Log|Demo Session Log]]** (save it in the **Logs** folder; it shows up on the [[Operations Dashboard]]).
- Capture any questions raised in **[[Decisions & Open Questions]]**.
- If anything broke, see [[Troubleshooting]]. If anything looked unsafe, see [[Incident & Escalation]].
