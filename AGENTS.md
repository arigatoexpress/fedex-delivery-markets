# Delivery Markets Lab Agent Notes

This repo is an isolated demo for a FedEx delivery-time prediction market concept.

## Boundaries

- Paper-only orders by default.
- No real FedEx customer data, no FedEx API credentials, and no private tracking payloads in fixtures.
- No real-money betting, settlement, wallet signing, order routing, or market creation.
- Robinhood, Polymarket, CoW Protocol, Hedera, and Arbitrum integrations are SDK/readiness adapters unless explicitly promoted in a reviewed testnet branch.
- External APIs must be treated as optional read-only sources unless a human supplies credentials and authorizes a specific live call.

## Verification

- `npm run verify` is the local all-in check.
- Browser smoke the Vite UI after frontend changes.
- Keep compliance and source caveats visible in `/docs` and `/api/readiness`.
