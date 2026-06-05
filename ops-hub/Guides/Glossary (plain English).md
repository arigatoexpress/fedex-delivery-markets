---
type: guide
title: Glossary (plain English)
updated: 2026-06-04
---

# 📚 Glossary — every term, in plain English

Sorted simplest-first. If a word in this hub confuses you, it's probably here.

### Prediction market
A place where people give their opinion on a yes/no question by "taking a side."
The mix of opinions produces a **price** that reads like a probability.
*Example: "YES is trading at 70¢" ≈ "the crowd thinks there's a ~70% chance."*

### YES / NO market
The two sides of the question. Buying **YES** means "I think this will happen."
Buying **NO** means "I think it won't." In this app the question is about a
package's delivery window.

### Paper / paper-only
**Practice mode.** Like "paper trading" — you go through the motions, but nothing
is real. **No real money changes hands.** This entire app is paper-only.

### Synthetic data
**Made-up data** created for testing. None of it is real. All our tracking
numbers are synthetic. See [[Demo Tracking Numbers]].

### Tracking number
Normally, the code on a real package. **Here it's fake** — just a label to look up
a pretend package's status.

### Market states: open / locked / resolved
- **Open** — you can still take a side (package hasn't reached the deciding point).
- **Locked** — betting is closed (e.g., package reached the hub; outcome pending).
- **Resolved** — the answer is final; YES or NO won. *(Pretend points only.)*

### AMM (Automated Market Maker)
A piece of math that **sets the price automatically** instead of matching two
people by hand. You don't need the math — just know it's "the thing that quotes a
price." The math lives in the repo's `docs/AMM_MATH.md` if anyone asks.

### Quote
The price the app shows you for YES or NO **right now**, before you commit.

### Order
A request to take a side at the quoted price. In this app every order is a
**paper order** (practice).

### Resolve / resolution
The moment the market gets its final answer (the package "arrives" in the demo).

### Oracle
The thing that **tells the market the real-world outcome** so it can resolve. In
this demo the oracle is **simulated** (we feed it pretend events).

### Calldata / testnet calldata
**Engineer-only.** A technical preview of what a blockchain instruction *would*
look like — shown but **never actually sent**. Ops can ignore this entirely.

### Testnet
A **practice version of a blockchain** with no real value, used by engineers to
test. Nothing here touches a real ("mainnet") blockchain.

### Localhost / 127.0.0.1
"This computer." When a guide says open `http://127.0.0.1:5178`, it means open
that address in your web browser to see the app **running on your own machine.**

### Vault (Obsidian)
The name Obsidian gives to **this folder of notes**. "Open the vault" = open this
folder in Obsidian.

### Dataview
A free Obsidian add-on that turns notes into **auto-updating tables and lists**
(it powers the [[Operations Dashboard]]). Setup: [[Enable the Dashboards (Dataview)]].

### Canvas
Obsidian's built-in **whiteboard**. Our [[System Overview.canvas|System Overview]]
is a Canvas — a single screen showing how the pieces connect.

---

Can't find a term? Add it here — just type it in and save. This is *your* glossary.
