# Security and Compliance Model

## Data Principles

- Store hashed tracking identifiers.
- Do not persist names, addresses, signatures, photos, delivery instructions, phone numbers, or GPS points.
- Keep raw FedEx payloads out of public chains.
- Anchor event hashes and coarse metadata only after privacy review.

## Live-Execution Gates

The application currently exposes no route for:

- real-money deposits;
- wallet signing;
- Robinhood order routing;
- Polymarket order routing;
- CoW swaps;
- mainnet settlement;
- real FedEx production API access.

The deploy script also requires `DEPLOY_CONTRACTS=true` before initializing a testnet deployment client.

## Oracle Trust

The pilot supports two oracle modes:

- `fixture`: local development accepts synthetic events and records deterministic hashes.
- `signed`: when `ORACLE_SIGNER_ADDRESS` is configured, events must carry a valid EIP-712 signature.

Hedera HCS-style anchors prove ordering and timestamping of submitted oracle messages. They do not independently prove the FedEx event is true. Truth still depends on the authorized source feed and governance around corrections/disputes.

## Participant Risk Controls

The app includes a separate risk engine for participant profiles. It warns or blocks real-money eligibility for:

- FedEx employees and contractors;
- drivers, station operators, and operations staff;
- shippers and recipients with direct shipment influence;
- unreviewed jurisdictions.

Paper simulation remains allowed so product teams can test UX and market design.

## Required Reviews Before Production

- FedEx legal and privacy.
- Robinhood Derivatives / partner-exchange listing.
- CFTC/event-contract counsel.
- State-level availability and geofence review.
- Consumer-risk disclosures.
- Insider/manipulation surveillance model.
- Incident, correction, dispute, and exception handling.
