# Research Notes

Current as of 2026-05-16.

## FedEx Tracking Data

FedEx Developer Portal exposes Basic Integrated Visibility for shipment tracking status, estimated delivery dates, and estimated delivery time windows. It also points to advanced visibility features for near-real-time updates and delivery prediction changes.

Demo decision: use synthetic fixtures only. A production FedEx oracle must publish only privacy-reviewed fields, preferably hashed tracking IDs plus coarse event codes and timestamps.

Source: https://developer.fedex.com/api/en-gl/catalog/track.html

## Robinhood

Robinhood prediction markets are offered inside the Robinhood app through Robinhood Derivatives and regulated partner exchanges. Public docs describe event-contract behavior, eligibility, trading hours, exchange settlement authority, and risk disclosures. I did not find a public Robinhood prediction-market trading SDK.

Robinhood Chain is separate: it is an Ethereum-compatible Arbitrum Orbit L2 testnet using ETH gas. The documented chain ID is `46630`, with public and Alchemy RPC options. That makes it a credible testnet settlement receipt target for a demo resolver, not a shortcut into Robinhood event-contract trading.

Sources:

- https://robinhood.com/us/en/newsroom/robinhood-prediction-markets-hub/
- https://robinhood.com/us/en/support/articles/robinhood-event-contracts/
- https://docs.robinhood.com/chain/
- https://docs.robinhood.com/chain/connecting/

## Polymarket

Polymarket exposes Gamma, Data, and CLOB APIs. Gamma/Data are public for market discovery and related analytics; CLOB supports orderbook/pricing and authenticated trading. Trading uses a hybrid model: offchain matching, EIP-712 signed orders, and onchain settlement on Polygon.

Demo decision: install the official TypeScript CLOB client for API-shape readiness, but keep it disabled for live order submission. Polymarket is useful as a reference architecture and optional read-only comparison feed. It is not a practical venue for instantly creating custom FedEx delivery markets because market creation and resolution rules are controlled by the venue.

Sources:

- https://docs.polymarket.com/api-reference
- https://docs.polymarket.com/developers/gamma-markets-api/overview
- https://docs.polymarket.com/trading/overview
- https://help.polymarket.com/en/articles/13364541-how-are-markets-created

## Hedera HCS

Hedera Consensus Service topics can receive messages, and mirror nodes expose ordered topic messages with consensus timestamps and sequence numbers. HCS proves an oracle message was anchored at a time and in an order; it does not prove the underlying FedEx event is true by itself.

Demo decision: model HCS anchors with deterministic hashes and sequence numbers. A testnet upgrade would submit compact event hashes with `@hashgraph/sdk`, then read back the mirror node topic stream before resolving a market.

Sources:

- https://docs.hedera.com/hedera/tutorials/consensus/submit-your-first-message
- https://docs.hedera.com/hedera/sdks-and-apis/sdks/consensus-service/get-topic-message

## CoW Protocol / “Cowley”

I found no strong official signal for a prediction-market “Cowley developer kit.” The likely intended tool is CoW Protocol / CoW Swap. CoW supports intent-style offchain orders and EIP-712 / ERC-1271 / presign schemes for swap execution. It is not a prediction-market creation or resolution SDK.

Demo decision: install the CoW SDK as an intent-signing reference and label it as read-only. Do not frame it as the venue.

Sources:

- https://docs.cow.bleu.builders/
- https://docs.cow.bleu.builders/cow-protocol/reference/core/signing-schemes
- https://github.com/cowprotocol/cow-sdk

## Architecture Recommendation

1. Synthetic FedEx-style tracking simulator.
2. Hub-arrival cutoff gate for market lock.
3. Hedera HCS topic anchoring of hashed event payloads.
4. Local paper orderbook and ledger.
5. Testnet EVM resolver on Robinhood Chain first, Arbitrum Sepolia as fallback.
6. Read-only Polymarket/Kalshi-style probability comparison after compliance review.
7. Regulated partner-exchange path for any real event contracts.

## Hard Blockers Before Any Live Pilot

- FedEx legal/compliance approval.
- Consumer protection and gambling/event-contract review.
- Partner-exchange listing and settlement rule approval.
- Privacy review for tracking-number, route, timestamp, delivery photo, signature, GPS, and proof-of-delivery data.
- Insider-trading/manipulation controls for employees, contractors, shippers, recipients, drivers, operations staff, and automated systems.
- Formal incident plan for delayed, missing, ambiguous, or corrected tracking events.
