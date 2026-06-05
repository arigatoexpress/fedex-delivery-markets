---
type: guide
title: Safety & What This Is NOT
updated: 2026-06-04
tags: [safety, governance]
---

# 🛡️ Safety & What This Is NOT

> [!warning] Read this before you show the app to anyone.
> This page is the single most important page in the hub. If someone asks
> *"wait, is this real?"* — the answer is on this page.

---

## ✅ What this app **IS**

- A **paper-only prototype**. "Paper" = practice / pretend, like paper trading.
- **Synthetic (made-up) data only.** Every tracking number is fake.
- A **conversation starter** for leadership and governance.
- Something safe to **run on a laptop and demo** in a meeting.

## 🚫 What this app **is NOT** — the hard boundaries

These boundaries are built into the app on purpose:

- ❌ **No real FedEx systems.** It never calls FedEx's real tracking or APIs.
- ❌ **No real customer data.** No real names, addresses, or tracking numbers.
- ❌ **No real money.** Nobody can win, lose, deposit, or withdraw funds.
- ❌ **No live trading.** It does **not** place real orders on any exchange or
  market platform (e.g. Robinhood, Polymarket, Kalshi, and similar are **off**).
- ❌ **No payouts or settlement.** The computer never holds or signs for funds.
- ❌ **Not deployed to production.** It runs locally for demos only.

> [!tip] Plain-English version
> *"It's a flight simulator. Nothing you do in here touches a real plane,
> real passengers, or real money."*

---

## 🗣️ How to describe it safely (say this)

> "This is an **internal, paper-only prototype** using **fake data**. It's how we
> explore and pressure-test the idea **before** deciding whether to build anything
> real. There's **no real money, no real customer information, and it's not
> connected to FedEx systems.**"

### Please don't say
- ❌ "FedEx is launching betting on packages." (We are not.)
- ❌ "You can make money on this." (You cannot — it's pretend.)
- ❌ "It's pulling live tracking." (It is not — the data is synthetic.)

---

## 🧯 If something feels off

If anyone ever sees what looks like **real customer data**, a **real money
prompt**, or a **connection to a live FedEx or trading system**, treat it as an
incident:

1. **Stop the demo.**
2. Follow **[[Incident & Escalation]]**.
3. Note it in a **[[Templates/Demo Session Log|demo session log]]**.

This should never happen by design — but the rule is *stop first, ask second.*

---

## 📜 Where the official rules live

- The governance & compliance posture is documented for engineers in the repo:
  `docs/SECURITY_AND_COMPLIANCE.md` and `docs/SECURITY_AUDIT_2026-05-16.md`.
- The draft market rules are in `docs/MARKET_RULEBOOK_DRAFT.md`.
- See [[Where the technical docs live]] to find these.

Related: [[What is Delivery Markets Lab]] · [[Run a Demo (step by step)]] · [[Decisions & Open Questions]]
