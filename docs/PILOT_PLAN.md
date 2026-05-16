# Pilot Plan

## Positioning

Delivery Markets Lab is an internal pilot for a regulated event-contract product around delivery-time uncertainty. It should be presented as:

- a forecasting and market-design prototype;
- a compliance discovery surface;
- an oracle and settlement architecture;
- not a launched wagering product.

## Partner Story

### FedEx

FedEx owns the operational data and customer trust surface. The pilot should emphasize privacy-preserving event proofs:

- hash tracking identifiers before persistence or anchoring;
- publish coarse milestone events, not raw addresses, photos, signatures, GPS, or recipient identities;
- use an authorized sandbox feed before any production feed;
- preserve event correction and dispute procedures.

### Robinhood

Robinhood owns the consumer distribution and event-contract UX angle. The pilot should emphasize:

- Robinhood Chain testnet as the onchain proof surface;
- Robinhood Derivatives / partner-exchange review for any real event contracts;
- no assumption that Robinhood exposes a public prediction-market SDK;
- eventual CFTC-regulated event-contract path rather than open public betting.

## Pilot Phases

1. **Internal simulator**
   - Current repo.
   - Synthetic shipments only.
   - Paper orders only.
   - Local append-only ledger.

2. **FedEx sandbox oracle**
   - Replace fixtures with an approved sandbox feed.
   - Sign oracle events with a dedicated pilot key.
   - Store hashed events and read back the audit ledger.

3. **Testnet resolver**
   - Deploy `DeliveryMarketResolver` to Robinhood Chain testnet or Arbitrum Sepolia.
   - Record HCS topic metadata and resolver events.
   - Still no custody or real settlement.

4. **Compliance pilot design**
   - Write market rulebook.
   - Define eligible participants.
   - Exclude employees, operations staff, shippers/recipients when required, and market makers with restricted information.
   - Define correction, dispute, delay, exception, and ambiguous-delivery procedures.

5. **Regulated venue review**
   - Determine whether the product can be listed by a regulated exchange or Robinhood partner flow.
   - Run customer suitability, KYC, geofence, risk disclosure, and state availability review.

## Success Criteria

- Product team can explain the market lifecycle in under two minutes.
- Legal/compliance can see every blocked live-execution gate.
- Engineering can swap fixture events for a sandbox adapter without redesigning the app.
- Partner teams can review API routes, oracle payloads, and contract resolver shape.
