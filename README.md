# Delivery Markets Lab

Paper-only demo for a FedEx delivery-time prediction market concept.

The app lets a customer-style user enter a synthetic tracking number, view generated YES/NO delivery-time markets, submit paper orders before the hub cutoff, and see why the market locks once the package reaches a hub. The architecture panel shows how Hedera HCS, Robinhood Chain, Polymarket, and CoW Protocol fit without triggering live trading or customer data flows.

## Run

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5178`.

For a single production-style process after `npm run build`:

```bash
NODE_ENV=production npm run start
```

Open `http://127.0.0.1:4747`.

Demo tracking numbers:

- `771234567890` pre-hub, markets open
- `882345678901` hub-arrived, markets locked
- `993456789012` delivered, markets resolved

## Verify

```bash
npm run verify
```

## Pilot Infrastructure

- Append-only paper orders: `data/orders.jsonl`
- Append-only oracle events: `data/oracle-events.jsonl`
- Admin audit route: `/api/admin/audit`
- EIP-712 oracle event route: `/api/oracle/events`
- Participant risk route: `/api/risk/evaluate`
- Contract compile coverage for `contracts/DeliveryMarketResolver.sol`

See [API.md](docs/API.md), [PILOT_PLAN.md](docs/PILOT_PLAN.md), [SECURITY_AND_COMPLIANCE.md](docs/SECURITY_AND_COMPLIANCE.md), and [MARKET_RULEBOOK_DRAFT.md](docs/MARKET_RULEBOOK_DRAFT.md).

Deployment scaffolds:

- `Dockerfile`
- `infra/docker-compose.yml`
- `infra/render.yaml`

## Safety Posture

- No real FedEx API calls.
- No real tracking numbers or customer payloads.
- No Robinhood, Polymarket, Kalshi, CoW, or Hedera live order submission.
- No wallet signing, exchange order routing, funds, settlement, or customer wagering.
- SDK packages are present for readiness and future testnet integration only.

## Product Thesis

Delivery-time uncertainty can be expressed as a regulated event-contract concept: “Will this package arrive on this date / inside this window?” The app’s cutoff gate closes trading once the package reaches the first major hub, where information asymmetry and operational influence risk increase. A privacy-preserving oracle path can anchor only hashed shipment/event metadata to Hedera and resolve a testnet EVM market on Robinhood Chain or Arbitrum Sepolia.

The honest next step is an internal simulator plus compliance review, not a public market.
