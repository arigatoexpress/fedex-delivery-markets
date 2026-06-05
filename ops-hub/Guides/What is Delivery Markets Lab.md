---
type: guide
title: What is Delivery Markets Lab
updated: 2026-06-04
---

# 📖 What is Delivery Markets Lab?

**In one sentence:** it's a safe, pretend "what-if" app that lets someone look at
a package's estimated delivery time and explore a simple yes/no question —
*"Will it arrive on time?"* — using **fake data and fake money**.

Think of it like a **flight simulator**. A flight simulator lets a pilot practice
without a real plane and real passengers. This lets us explore a delivery-time
"prediction market" idea **without** real customers, real tracking, or real money.

---

## 🧩 The idea, step by step

1. **Someone has a package on the way.** In the demo we use a *pretend* tracking
   number (see [[Demo Tracking Numbers]]). No real packages are involved.
2. **They look at a question.** Example: *"Will package #771234567890 arrive before
   its estimated window closes?"* The answer is either **YES** or **NO**.
3. **They can "take a side"** with pretend points — like calling heads or tails.
   This is called a **market**. (Definitions in [[Glossary (plain English)]].)
4. **The app shows a price** for YES and for NO. The price is just a way of showing
   *how likely* the crowd thinks each outcome is.
5. **When the package "arrives"** (in the demo, this is simulated), the market
   **resolves** — YES or NO wins. Again: **pretend points only.**

That's the whole concept. Everything else is detail.

---

## 🤔 Why would FedEx care about this?

Because **delivery-time confidence is valuable information.** If lots of people
think a package will be late, that's an early-warning signal. This prototype is a
way to **explore that idea and talk about whether it's a good one** — the safety,
the rules, the customer experience — *before* anyone builds something real.

The app is deliberately built to **separate the pretend from the real** so leaders
can have that conversation with a concrete thing in front of them.

---

## 🖥️ What you actually see on screen

- A box to **enter a tracking number** (use the [[Demo Tracking Numbers]]).
- A **"claim demo access"** button (pretend sign-in — no real account).
- One or more **YES / NO markets** tied to delivery windows.
- A **quote** area showing pretend prices.
- A **"submit paper order"** button — *"paper" means practice, not real.*
- A technical **"calldata preview"** — engineers use this; ops can ignore it.

---

## 🚫 What it is **not**

It is **not** connected to FedEx systems, **not** handling real packages, and
**not** moving any real money. That's so important it has its own page:
👉 **[[Safety & What This Is NOT]]** (please read it before demoing).

---

## ▶️ Want to see it?

Go to **[[Run a Demo (step by step)]]** for a click-by-click walkthrough, or look
at the visual **[[Maps]]** — the **[[System Overview.canvas|🧭 System Overview]]**
and the **[[Delivery Route Map.excalidraw|🚚 Delivery Route Map]]** — to see how
the pieces connect.

---

### For the curious (optional)
- It's a website that runs on a computer (built with React/TypeScript — engineer stuff).
- The "rules" of a market are written down in the repo's `docs/MARKET_RULEBOOK_DRAFT.md`.
- The math behind the prices is in `docs/AMM_MATH.md`. You don't need either to use this hub.
- See [[Where the technical docs live]] if you ever need the engineering detail.
