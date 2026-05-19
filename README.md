# Delivery Markets Lab

Recipient-only, paper/testnet demo for a FedEx delivery-time prediction market concept.

The app lets a recipient enter a synthetic tracking number, claim access with a demo recipient wallet/code, view generated YES/NO delivery-time markets, quote a private AMM, submit recipient-gated paper orders before the hub cutoff, and preview Robinhood Chain / Arbitrum-compatible calldata. The architecture panel shows how Hedera HCS, Robinhood Chain, Polymarket, and CoW Protocol fit without triggering live trading or customer data flows.

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
npm run contracts:build
npm run browser:smoke
```

## Pilot Infrastructure

- Append-only paper orders: `data/orders.jsonl`
- Append-only oracle events: `data/oracle-events.jsonl`
- Append-only recipient grants: `data/access-grants.jsonl`
- Recipient access route: `/api/access/claim`
- Private AMM quote route: `/api/amm/quote`
- Private order route: `/api/private/orders`
- Testnet calldata preview route: `/api/testnet/calldata`
- Private receipt contract: `contracts/PrivateDeliveryMarket.sol`
- Admin audit route: `/api/admin/audit`
- EIP-712 oracle event route: `/api/oracle/events`
- Participant risk route: `/api/risk/evaluate`
- Contract compile coverage for `contracts/DeliveryMarketResolver.sol`

See [API.md](docs/API.md), [AMM_MATH.md](docs/AMM_MATH.md), [PRIVATE_MARKET_PRODUCT_PLAN.md](docs/PRIVATE_MARKET_PRODUCT_PLAN.md), [TESTNET_RUNBOOK.md](docs/TESTNET_RUNBOOK.md), [PILOT_PLAN.md](docs/PILOT_PLAN.md), [SECURITY_AND_COMPLIANCE.md](docs/SECURITY_AND_COMPLIANCE.md), and [MARKET_RULEBOOK_DRAFT.md](docs/MARKET_RULEBOOK_DRAFT.md).

Deployment scaffolds:

- `Dockerfile`
- `infra/docker-compose.yml`
- `infra/render.yaml`

Testnet deploy path:

```bash
npm run contracts:build
DEPLOY_CONTRACTS=true \
DEPLOY_PRIVATE_MARKET_CONTRACT=true \
ROBINHOOD_CHAIN_RPC_URL=https://... \
DEPLOYER_PRIVATE_KEY=0x... \
npm run deploy:robinhood:testnet
```

Do not use a mainnet key. The deploy script only targets the receipt contract and still does not enable live funds, exchange routing, or settlement.

## Safety Posture

- No real FedEx API calls.
- No real tracking numbers or customer payloads.
- No Robinhood, Polymarket, Kalshi, CoW, or Hedera live order submission.
- No server-side wallet signing, exchange order routing, funds, settlement, or customer wagering.
- SDK packages are present for readiness and future testnet integration only.

## Product Thesis

Delivery-time uncertainty can be expressed as a regulated event-contract concept: “Will this package arrive on this date / inside this window?” The app’s cutoff gate closes trading once the package reaches the first major hub, where information asymmetry and operational influence risk increase. A privacy-preserving oracle path can anchor only hashed shipment/event metadata to Hedera and resolve a testnet EVM market on Robinhood Chain or Arbitrum Sepolia.

The honest next step is a recipient-only internal simulator, FedEx sandbox oracle, and testnet receipt deployment, not a public live market.
