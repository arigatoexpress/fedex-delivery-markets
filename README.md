# 🚚 Delivery Markets Lab

> A **paper-only, synthetic-data** demo exploring delivery-time prediction markets — **no real money, no real tracking, no live trading.**

[![CI](https://github.com/arigatoexpress/fedex-delivery-markets/actions/workflows/ci.yml/badge.svg)](https://github.com/arigatoexpress/fedex-delivery-markets/actions/workflows/ci.yml)
[![Last commit](https://img.shields.io/github/last-commit/arigatoexpress/fedex-delivery-markets/main)](https://github.com/arigatoexpress/fedex-delivery-markets/commits/main)
[![Open PRs](https://img.shields.io/github/issues-pr/arigatoexpress/fedex-delivery-markets)](https://github.com/arigatoexpress/fedex-delivery-markets/pulls)
[![Status: paper-only prototype](https://img.shields.io/badge/status-paper--only%20prototype-blueviolet)](#-status)
[![Stack](https://img.shields.io/badge/stack-TypeScript%20·%20React%2019%20·%20Hono-3178c6)](#)

> [!IMPORTANT]
> **This is a paper-only prototype using synthetic (made-up) data.** It is **not** connected to FedEx systems, handles **no** real customer data, moves **no** real money, and does **no** live trading. It exists to learn and to make governance questions concrete before anything real is considered.

## Product boundary

Delivery Markets is a **standalone application**. It is not part of Sapphire Nexus and it is not the RECON station-operations dashboard.

- **FedEx manager enablement / prompts / souls:** [`arigatoexpress/Ops-AI-Library`](https://github.com/arigatoexpress/Ops-AI-Library)
- **Delivery Markets source/runtime:** this repository
- **Sapphire Nexus:** separate company-neutral intelligence platform
- **RECON:** separate station-operations decision-support application

The detailed source/runtime/GCP separation is in [`docs/PRODUCT_BOUNDARY.md`](docs/PRODUCT_BOUNDARY.md).

---

## 👀 For governance review — start here

| Topic | Document |
|------|----------|
| 🔒 Security & compliance posture | [docs/SECURITY_AND_COMPLIANCE.md](docs/SECURITY_AND_COMPLIANCE.md) |
| 🧾 Independent security audit | [docs/SECURITY_AUDIT_2026-05-16.md](docs/SECURITY_AUDIT_2026-05-16.md) |
| 📐 Proposed market rules | [docs/MARKET_RULEBOOK_DRAFT.md](docs/MARKET_RULEBOOK_DRAFT.md) |
| 🗺️ Pilot / rollout plan | [docs/PILOT_PLAN.md](docs/PILOT_PLAN.md) |
| 🧩 Private-market product plan | [docs/PRIVATE_MARKET_PRODUCT_PLAN.md](docs/PRIVATE_MARKET_PRODUCT_PLAN.md) |
| 🏛️ Architecture | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| 🔬 Research background | [docs/RESEARCH.md](docs/RESEARCH.md) |
| 🧱 Product / GCP boundary | [docs/PRODUCT_BOUNDARY.md](docs/PRODUCT_BOUNDARY.md) |

---

## 🟢 Live repository status

- ✅ **Build health** — the CI badge above is green when `main` is healthy.
- 🕑 **Recency** — the last-commit badge shows when the repo last changed.
- 📜 **Recent changes** → [commit history](https://github.com/arigatoexpress/fedex-delivery-markets/commits/main)
- 🔀 **In-flight work** → [open pull requests](https://github.com/arigatoexpress/fedex-delivery-markets/pulls)
- 🏃 **Pipeline runs** → [GitHub Actions](https://github.com/arigatoexpress/fedex-delivery-markets/actions)
- 🔒 **Dependency security** → [Dependabot alerts](https://github.com/arigatoexpress/fedex-delivery-markets/security/dependabot)

> [!NOTE]
> Recent hardening includes supply-chain dependency patches, removal of readiness-only market SDKs, pinned Actions, minimal workflow permissions, and a CI gate covering typecheck, tests, and build.

---

## What this does

A user selects a **synthetic** demo shipment, claims demo recipient access, and views **YES/NO** paper markets tied to estimated delivery windows. They can quote the private AMM, submit **paper** practice orders, and preview testnet-compatible calldata — all without touching real customer data or live exchanges.

The app deliberately separates:

- synthetic data from production data;
- paper simulation from real money;
- testnet previews from transaction submission;
- prototype learning from approved deployment.

## ▶️ Quick start

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5178`. For a production-style build:

```bash
npm run build
NODE_ENV=production npm run start
```

Then open `http://127.0.0.1:4747`.

### Demo tracking numbers

| Number | State | What it shows |
|--------|-------|----------------|
| `771234567890` | Pre-hub | Paper markets open |
| `882345678901` | Hub-arrived | Paper markets locked |
| `993456789012` | Delivered | Paper markets resolved |

## ✅ Verify

```bash
npm run verify        # typecheck + test + build
npm run contracts:build
npm run browser:smoke
```

## 🗂️ Key paths

| Path | What it is |
|------|------------|
| `src/server/` | Hono API routes, store, and market logic |
| `src/` | React + Vite frontend and shared application code |
| `contracts/` | Solidity contracts used for paper/testnet-readiness experiments |
| `docs/` | API docs, AMM math, pilot plan, security posture, and runbooks |
| `infra/` | Deployment/infrastructure references |
| `ops-hub/` | **Legacy companion material**; manager adoption content now belongs in Ops AI Library |

The `ops-hub/` directory remains only as historical context for this prototype. Do not add new general manager-training material there; contribute that work to [`Ops-AI-Library`](https://github.com/arigatoexpress/Ops-AI-Library) instead.

See [docs/API.md](docs/API.md), [docs/AMM_MATH.md](docs/AMM_MATH.md), [docs/PRODUCT_BOUNDARY.md](docs/PRODUCT_BOUNDARY.md), and [AGENTS.md](AGENTS.md).

## 🛡️ Safety posture

- **No real FedEx API calls.**
- **No real tracking numbers or customer payloads.**
- **No live trading.** No Robinhood, Polymarket, Kalshi, CoW, or Hedera order submission.
- **No funds or settlement.** No server-side wallet signing, exchange routing, or customer wagering.
- **No Sapphire runtime dependency.** This service owns its own deployment and configuration boundary.
- Testnet/readiness code may construct previews, but no browser action or API route is permitted to sign or broadcast a live transaction.

## 📌 Status

**Paper-only prototype.** Safe for synthetic-data demo and governance review. It is not connected to production FedEx systems and should be deployed, when needed, only as its own isolated prototype service.

---

<sub>Standalone research prototype · paper-only / synthetic data · current FedEx manager enablement lives in [Ops AI Library](https://github.com/arigatoexpress/Ops-AI-Library).</sub>
