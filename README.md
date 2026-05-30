# Delivery Markets Lab

> A paper-only, synthetic-data demo that lets recipients explore delivery-time prediction markets — no real money, no real tracking, no live trading.

**Tech stack:** React 19 · TypeScript · Vite · Hono · Node.js · Ethers/Viem

*[Agent collaborators: see [AGENTS.md](AGENTS.md)]*

## What this does

This is a **prototype/demo** for a FedEx delivery-time prediction market concept. A recipient enters a synthetic tracking number, claims demo access, and views YES/NO markets tied to estimated delivery windows. They can quote a private AMM, submit paper orders, and preview testnet-compatible calldata — all without touching real customer data or live exchanges.

The app is useful as a **governance conversation starter**: it clearly separates synthetic data from production data, paper simulation from real money, and prototype learning from approved deployment.

## Quick start

```bash
# Install dependencies
npm install

# Run the full-stack dev server (API + Vite UI)
npm run dev
```

Open `http://127.0.0.1:5178`.

For a production-style build:

```bash
npm run build
NODE_ENV=production npm run start
```

Open `http://127.0.0.1:4747`.

### Demo tracking numbers

| Number | State |
|--------|-------|
| `771234567890` | Pre-hub, markets open |
| `882345678901` | Hub-arrived, markets locked |
| `993456789012` | Delivered, markets resolved |

## Verify

```bash
npm run verify        # typecheck + test + build
npm run contracts:build
npm run browser:smoke
```

## Key paths

| Path | What it is |
|------|------------|
| `src/server/` | Hono API routes, store, and market logic |
| `src/client/` | React + Vite frontend |
| `contracts/` | Solidity contracts (paper-only) |
| `data/` | Append-only paper orders, oracle events, and access grants |
| `docs/` | API docs, AMM math, pilot plan, security posture, and runbooks |
| `infra/` | Docker Compose and Render blueprints |

See [docs/API.md](docs/API.md), [docs/AMM_MATH.md](docs/AMM_MATH.md), [docs/PILOT_PLAN.md](docs/PILOT_PLAN.md), and [docs/SECURITY_AND_COMPLIANCE.md](docs/SECURITY_AND_COMPLIANCE.md) for full details.

## Safety posture

- **No real FedEx API calls.**
- **No real tracking numbers or customer payloads.**
- **No live trading.** No Robinhood, Polymarket, Kalshi, CoW, or Hedera order submission.
- **No funds or settlement.** No server-side wallet signing, exchange routing, or customer wagering.
- SDK packages are present for future testnet readiness only.

## Status

Paper-only prototype. Safe for local demo and governance review. Not connected to production FedEx systems.
