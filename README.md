# 🚚 Delivery Markets Lab

> A **paper-only, synthetic-data** demo exploring delivery-time prediction markets — **no real money, no real tracking, no live trading.**
> Built by the **AI Efficiency team** as a hands-on **governance conversation starter.**

[![CI](https://github.com/arigatoexpress/fedex-delivery-markets/actions/workflows/ci.yml/badge.svg)](https://github.com/arigatoexpress/fedex-delivery-markets/actions/workflows/ci.yml)
[![Last commit](https://img.shields.io/github/last-commit/arigatoexpress/fedex-delivery-markets/main)](https://github.com/arigatoexpress/fedex-delivery-markets/commits/main)
[![Open PRs](https://img.shields.io/github/issues-pr/arigatoexpress/fedex-delivery-markets)](https://github.com/arigatoexpress/fedex-delivery-markets/pulls)
[![Status: paper-only prototype](https://img.shields.io/badge/status-paper--only%20prototype-blueviolet)](#-status)
[![Stack](https://img.shields.io/badge/stack-TypeScript%20·%20React%2019%20·%20Hono-3178c6)](#)

> [!IMPORTANT]
> **This is a paper-only prototype using synthetic (made-up) data.** It is **not** connected to FedEx systems, handles **no** real customer data, moves **no** real money, and does **no** live trading. It exists to *learn and to align on governance* **before** anything real is built. See [Safety posture](#-safety-posture).

---

## 👀 For the AI Governance review — start here

A short, self-contained reading set for today's session:

| Topic | Document |
|------|----------|
| 🔒 Security & compliance posture | [docs/SECURITY_AND_COMPLIANCE.md](docs/SECURITY_AND_COMPLIANCE.md) |
| 🧾 Independent security audit | [docs/SECURITY_AUDIT_2026-05-16.md](docs/SECURITY_AUDIT_2026-05-16.md) |
| 📐 Proposed market rules | [docs/MARKET_RULEBOOK_DRAFT.md](docs/MARKET_RULEBOOK_DRAFT.md) |
| 🗺️ Pilot / rollout plan | [docs/PILOT_PLAN.md](docs/PILOT_PLAN.md) |
| 🧩 Private-market product plan | [docs/PRIVATE_MARKET_PRODUCT_PLAN.md](docs/PRIVATE_MARKET_PRODUCT_PLAN.md) |
| 🏛️ Architecture | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| 🔬 Research background | [docs/RESEARCH.md](docs/RESEARCH.md) |
| 🤝 Non-technical Ops Hub (Obsidian) | [see below](#-ops-hub-for-non-technical-ops-managers) |

---

## 🟢 Live status & newest updates

Everything in this section refreshes **automatically** — no stale snapshots to maintain:

- ✅ **Build health** — the **CI** badge above is green when `main` is healthy.
- 🕑 **Recency** — the **last-commit** badge above shows when the repo last changed.
- 📜 **Recent changes** → [commit history](https://github.com/arigatoexpress/fedex-delivery-markets/commits/main)
- 🔀 **In-flight work** → [open pull requests](https://github.com/arigatoexpress/fedex-delivery-markets/pulls)
- 🏃 **Pipeline runs** → [GitHub Actions](https://github.com/arigatoexpress/fedex-delivery-markets/actions)
- 🔒 **Dependency security** → [Dependabot alerts](https://github.com/arigatoexpress/fedex-delivery-markets/security/dependabot)

> [!NOTE]
> **Recent hardening (June 2026):** critical/high dependency CVEs remediated ([#13](https://github.com/arigatoexpress/fedex-delivery-markets/pull/13)); GitHub Actions pinned to commit SHAs; lockfile + Dependabot enabled; minimal workflow permissions ([#4](https://github.com/arigatoexpress/fedex-delivery-markets/pull/4)). Every pull request runs `typecheck + tests + build`.

---

## What this does

A recipient enters a **synthetic** tracking number, claims demo access, and views **YES/NO** markets tied to estimated delivery windows. They can quote a private AMM, submit **paper** (practice) orders, and preview testnet-compatible calldata — all without touching real customer data or live exchanges.

The app deliberately **separates** synthetic data from production data, paper simulation from real money, and prototype learning from approved deployment — so leaders can have a concrete, safe governance conversation.

*New to the concept? The [Ops Hub](#-ops-hub-for-non-technical-ops-managers) explains it in plain English with visual maps.*

## ▶️ Quick start

```bash
npm install      # install dependencies
npm run dev      # run the full-stack dev server (API + Vite UI)
```

Open `http://127.0.0.1:5178`. For a production-style build:

```bash
npm run build
NODE_ENV=production npm run start    # then open http://127.0.0.1:4747
```

### Demo tracking numbers

| Number | State | What it shows |
|--------|-------|----------------|
| `771234567890` | Pre-hub | Markets **open** — you can take a side |
| `882345678901` | Hub-arrived | Markets **locked** |
| `993456789012` | Delivered | Markets **resolved** (final outcome) |

## ✅ Verify

```bash
npm run verify        # typecheck + test + build
npm run contracts:build
npm run browser:smoke
```

## 🤝 Ops Hub (for non-technical ops managers)

A companion **Obsidian knowledge base** turns this repo into a plain-English, visual handbook for ops managers — a **Canvas** system map, **Excalidraw** route maps, auto-updating **dashboards**, step-by-step **demo runbooks**, a safety/incident guide, and one-click setup for Windows/Mac/Linux + OneDrive/Google Drive.

Ask the AI Efficiency team for the **`FedEx-Delivery-Markets-Ops-Vault`** (open the folder in the free [Obsidian](https://obsidian.md) app — plugins come pre-configured).

## 🗂️ Key paths

| Path | What it is |
|------|------------|
| `src/server/` | Hono API routes, store, and market logic |
| `src/client/` | React + Vite frontend |
| `contracts/` | Solidity contracts (paper-only) |
| `data/` | Append-only paper orders, oracle events, and access grants |
| `docs/` | API docs, AMM math, pilot plan, security posture, and runbooks |
| `infra/` | Docker Compose and Render blueprints |

See [docs/API.md](docs/API.md) and [docs/AMM_MATH.md](docs/AMM_MATH.md) for engineering detail, and [AGENTS.md](AGENTS.md) for agent collaborators.

## 🛡️ Safety posture

- **No real FedEx API calls.**
- **No real tracking numbers or customer payloads.**
- **No live trading.** No Robinhood, Polymarket, Kalshi, CoW, or Hedera order submission.
- **No funds or settlement.** No server-side wallet signing, exchange routing, or customer wagering.
- SDK packages are present for future testnet readiness only.

## 📌 Status

**Paper-only prototype.** Safe for local demo and governance review. Not connected to production FedEx systems and not production-deployed.

---

<sub>Maintained by the **AI Efficiency team** · paper-only / synthetic data · for the live state of this repo, see the [badges](#-delivery-markets-lab) and [commit history](https://github.com/arigatoexpress/fedex-delivery-markets/commits/main) above.</sub>
