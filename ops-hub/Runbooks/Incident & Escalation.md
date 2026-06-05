---
type: runbook
title: Incident & Escalation
updated: 2026-06-04
tags: [safety, governance]
---

# 🧯 Incident & Escalation

Use this if the app ever shows something it **shouldn't** — anything that looks
real when it's supposed to be pretend.

> [!warning] Golden rule: **Stop first, ask second.**

---

## 🚨 What counts as an incident
Treat any of these as an incident, even if you're not sure:
- Anything that looks like **real customer data** (real names, addresses, real tracking).
- Any prompt about **real money** — deposits, withdrawals, payouts, wallets, fees.
- Any sign it's **connected to a live FedEx system** or a **real trading platform**.
- The app asking for **real credentials, private keys, or API keys**.

None of this should ever happen by design (see [[Safety & What This Is NOT]]) —
which is exactly why it must be reported if it does.

## ✋ Immediate steps
1. **Stop the demo.** Don't click further. Don't enter anything real.
2. **Don't close the window if it's safe to leave it** — a screenshot helps.
   Take a screenshot of what you saw.
3. **Disconnect if needed.** If you're worried it's reaching the internet, the
   technical teammate can stop the app (close the terminal running `npm run dev`).
4. **Do not** enter any real tracking number, real payment info, or real login.

## 📣 Who to tell (in order)
1. The **Product/Technical owner** in [[Roles & Owners]].
2. The **Ops lead** in [[Roles & Owners]].
3. If it involves possible **real customer data or money**, also escalate to
   whoever owns **security/compliance** in [[Roles & Owners]].

## 📝 Write it down
Create a [[Templates/Demo Session Log|Demo Session Log]], set **result = "incident"**,
and describe:
- What you did right before it happened.
- What you saw (attach the screenshot to the `_attachments` folder).
- Which tracking number / screen you were on.

Then add a follow-up item to [[Decisions & Open Questions]] so it's tracked to closure.

---

> [!note] Why we're this careful
> The whole value of this prototype is that it **cleanly separates pretend from
> real**. Protecting that boundary is everyone's job — reporting a false alarm is
> always better than missing a real one.
