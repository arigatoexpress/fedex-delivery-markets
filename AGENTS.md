# Delivery Markets Lab — Agent Notes

This repo is an isolated, paper-only demo for a FedEx delivery-time prediction market concept. It is a full-stack TypeScript/React prototype with Solidity contracts and synthetic data.

## What this repo does

The app lets a recipient enter a synthetic tracking number, claim demo access, view YES/NO delivery-time markets, quote a private AMM, and submit paper orders. It also previews testnet-compatible calldata for Robinhood Chain / Arbitrum without triggering live trading.

## Key directories and files

| Path | Purpose |
|------|---------|
| `src/server/` | Hono API routes, in-memory store, and market logic |
| `src/client/` | React 19 + Vite frontend |
| `contracts/` | Solidity contracts: `PrivateDeliveryMarket.sol`, `DeliveryMarketResolver.sol` |
| `data/` | Append-only JSONL files for orders, oracle events, and access grants |
| `docs/` | API docs, AMM math, pilot plan, security, runbooks, and market rulebook |
| `scripts/` | Build contracts, deploy to testnet, wallet readiness, browser smoke tests |
| `infra/` | Docker Compose and Render deployment scaffolds |

## How to run / develop

```bash
npm install
npm run dev          # API + UI concurrently
npm run verify       # typecheck + test + build
npm run browser:smoke
```

Dev server: `http://127.0.0.1:5178`
Production-style: `npm run build && NODE_ENV=production npm run start` on `http://127.0.0.1:4747`

## Safety boundaries

- **Paper-only orders by default.**
- **No real FedEx customer data**, no FedEx API credentials, and no private tracking payloads in fixtures.
- **No real-money betting, settlement, wallet signing, order routing, or market creation.**
- Robinhood, Polymarket, CoW Protocol, Hedera, and Arbitrum integrations are SDK/readiness adapters unless explicitly promoted in a reviewed testnet branch.
- External APIs must be treated as optional read-only sources unless a human supplies credentials and authorizes a specific live call.
- **Do NOT** add `.env` files with real private keys, RPC URLs, or API credentials.

## Current status

Stable prototype. Local dev and verify pass. Ready for governance review and safe demo use. Not production-deployed and not connected to live FedEx systems.
