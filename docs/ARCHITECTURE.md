# Architecture

```mermaid
flowchart LR
  Customer["Customer enters synthetic tracking number"] --> API["Hono API"]
  API --> Simulator["Delivery event simulator"]
  Simulator --> Cutoff["Hub cutoff gate"]
  Simulator --> Anchor["Hedera HCS-style anchor"]
  Cutoff --> PaperBook["Paper order ledger"]
  Anchor --> Resolver["EVM resolver contract"]
  Resolver --> Robinhood["Robinhood Chain testnet"]
  Resolver --> Arbitrum["Arbitrum Sepolia fallback"]
  API --> UI["React workbench"]
  Poly["Polymarket CLOB SDK"] -. read-only reference .-> API
  Cow["CoW Protocol SDK"] -. intent reference .-> API
```

## Runtime Contract

- `/health` reports paper-only posture.
- `/api/tracking/:trackingNumber` returns shipment fixture, generated markets, cutoff status, and HCS-style anchors.
- `/api/orders` accepts or blocks paper orders.
- `/api/ledger` returns the in-memory paper order tape.
- `/api/readiness` reports SDK and chain readiness without enabling live order submission.
- `/api/research` returns source references and the current demo thesis.

## Market Lifecycle

1. `OPEN`: shipment is pre-hub, projected hub cutoff has not passed.
2. `CUTOFF_LOCKED`: a `HUB_ARRIVAL` event exists or the projected hub deadline has passed.
3. `RESOLVED`: a `DELIVERED` event exists and the market outcomes are computed.

## Oracle Payload

Only public-safe fields are modeled:

```json
{
  "trackingNumberHash": "sha256:...",
  "code": "HUB_ARRIVAL",
  "timestamp": "2026-05-16T10:25:00-05:00",
  "facility": "Memphis World Hub",
  "city": "Memphis",
  "state": "TN"
}
```

Production should further reduce granularity when needed and keep raw customer data off public ledgers.

## EVM Resolver Shape

The demo contract in `contracts/DeliveryMarketResolver.sol` is intentionally minimal:

- owner creates market metadata and cutoff timestamps;
- configured oracle resolves with final outcome and HCS anchor fields;
- no payable methods;
- no custody, token transfer, or real settlement.

The next serious version would split custody/order matching from resolution, add EIP-712 orders, implement nonce/deadline checks, and use audited libraries.
