---
type: guide
title: Where the technical docs live
updated: 2026-06-04
---

# 🧰 Where the technical docs live (for engineers)

This hub is the **friendly, non-technical layer.** The **deep engineering docs**
live inside the code repository, in its `docs/` folder. You generally won't need
these — but here's the map so you can point an engineer to the right file.

**Repository folder on the build machine:**
`~/Code/fedex-delivery-markets/`

| If someone needs… | Engineer doc (in the repo `docs/` folder) |
|---|---|
| The big-picture architecture | `ARCHITECTURE.md` |
| The API (how the app talks to itself) | `API.md` |
| The pricing math | `AMM_MATH.md` |
| The proposed market rules | `MARKET_RULEBOOK_DRAFT.md` |
| The pilot/rollout plan | `PILOT_PLAN.md` |
| The private-market product plan | `PRIVATE_MARKET_PRODUCT_PLAN.md` |
| Security & compliance posture | `SECURITY_AND_COMPLIANCE.md` |
| The security audit | `SECURITY_AUDIT_2026-05-16.md` |
| How to run a polished demo build | `PRODUCTION_DEMO_RUNBOOK.md` |
| Blockchain testnet steps (advanced) | `TESTNET_RUNBOOK.md` |
| Background research | `RESEARCH.md` |
| Notes for AI/agent collaborators | `AGENTS.md` (repo root) |
| The overview readme | `README.md` (repo root) |

> [!note] Keep this hub and the repo in sync
> When an engineer changes how something works, update the matching plain-English
> page here too (e.g. [[What is Delivery Markets Lab]] or [[Run a Demo (step by step)]]).
> This hub should always be *true*, even if it's simpler than the code.

Related: [[00 — START HERE]] · [[Roles & Owners]]
