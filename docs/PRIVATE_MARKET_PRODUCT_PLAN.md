# Private Delivery Market Product Plan

## Product Thesis

A delivery recipient should be able to open a private, recipient-only event market for their own package before the hub cutoff. The market should answer bounded questions like:

- will this package arrive on the promised day?
- will it arrive inside the current ETA window?
- will it arrive before noon local time?

The app now models the production path as:

```text
recipient claim -> private AMM quote -> paper/testnet order receipt -> signed oracle event -> resolver evidence
```

## What Is Implemented

- Recipient-only claim policy per synthetic tracking number.
- Demo claim code and recipient wallet fixture.
- Private access grants with explicit capabilities, expiry, and hashed grant secrets.
- LMSR AMM quote engine with theta decay, inventory skew, and max-contract controls.
- Recipient-gated private AMM paper orders.
- Redacted public ledger.
- Unsigned Robinhood Chain / Arbitrum-compatible calldata previews.
- Read-only wallet readiness for public testnet wallets, with Solana explicitly
  marked not required for the current EVM receipt path.
- `PrivateDeliveryMarket.sol`, a recipient-only testnet receipt contract with no custody.
- Contract artifact builder and fail-closed Robinhood Chain deploy script.

## Venue Reality

### Robinhood

Robinhood Chain testnet is the best build target for this prototype because it is Ethereum-compatible and Arbitrum Orbit-based. The app can generate calldata for a private market receipt contract on chain ID `46630`.

Robinhood event contracts themselves are not modeled as a public developer SDK integration. A real listing would require Robinhood Derivatives / partner exchange review, exchange-defined terms, eligibility, geofencing, risk disclosure, and settlement-source approval.

### Polymarket

Polymarket's CLOB supports public orderbook trading with EIP-712 signed orders and authenticated order management. The public docs do not expose private, recipient-only market creation. The current app keeps Polymarket as a read-only/reference integration unless a partner route is explicitly approved.

### Hedera

Hedera HCS is suitable for ordered oracle evidence. It proves when a signed event hash was submitted and in what sequence. It does not prove the underlying FedEx event is true; production truth still depends on an authorized FedEx data source and signing key.

### MetaMask / Arbitrum

The frontend includes a wallet-address claim path and calldata preview. A next implementation can add a direct MetaMask transaction handoff for `createMarket` and `recordTrade`, with user confirmation in the wallet and no server-side signing.

## Production Gaps

- Replace demo access codes with FedEx account, recipient identity, or delivery-manager authorization.
- Replace fixtures with FedEx sandbox event ingestion.
- Deploy the private receipt contract to Robinhood Chain testnet or Arbitrum Sepolia.
- Add wallet transaction handoff and explorer readback after a testnet receipt
  contract address is configured.
- Add durable storage beyond JSONL.
- Add formal KYC/geofence/suitability controls.
- Add market-maker exposure limits and treasury/collateral accounting before any real-money pilot.
- Draft exchange-grade market terms, settlement definitions, corrections, and dispute handling.

## Recommendation

For the hackathon path, position this as:

> A recipient-only delivery prediction market with a private AMM, FedEx oracle evidence, Hedera timestamp anchoring, and Robinhood Chain / Arbitrum-compatible testnet receipts.

That story is technically demoable without claiming a live Robinhood or Polymarket private-market integration that does not currently exist as a public SDK path.
