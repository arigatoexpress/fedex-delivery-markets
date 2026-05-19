# Market Rulebook Draft

This is a draft for internal review only.

## Market Types

- Delivery day: “Will package X be delivered on date Y?”
- Delivery window: “Will package X be delivered inside ETA window Z?”
- Before-time: “Will package X be delivered before time T at destination local time?”

## Opening

Markets may open only after package acceptance into the network and before first major hub arrival.

## Cutoff

Trading locks at the earliest authoritative signal:

1. first major hub arrival event;
2. projected hub-arrival cutoff timestamp;
3. manual compliance halt;
4. oracle-health halt.

## Resolution Source

The primary resolution source is an authorized FedEx event feed. The demo models this with synthetic events and HCS-style hashes.

## Resolution

- `DELIVERED` event timestamp determines delivery-day and delivery-window outcomes.
- Destination-local time determines before-time markets.
- If the event feed later corrects a timestamp, the correction procedure must be applied before final settlement in any real pilot.

## Exceptions

- Lost package: market is void unless a rule-specific fallback exists.
- Delivery exception: market remains unresolved until a delivery, void, or correction rule applies.
- Ambiguous delivery proof: compliance halt until manual review.
- Customer pickup / hold-at-location: requires separate market-specific treatment.
- Weather/service disruption: no automatic void unless defined before market open.

## Participant Restrictions

The current product shape is recipient-only for private paper/testnet markets:

- the recipient wallet must match the package access policy;
- the package claim code must match;
- private orders must include the grant secret issued at claim time;
- trading remains blocked after first hub cutoff or resolution.

Any real-money pilot should further restrict or exclude:

- FedEx employees and contractors;
- delivery drivers and station operators;
- shippers unless explicitly approved;
- recipients unless the regulated venue approves a limited, disclosed recipient-only product;
- anyone with non-public routing, staffing, exception, or delivery-priority information.

## Surveillance

Minimum surveillance model:

- unusual order timing near cutoff;
- correlated participants on same route/facility;
- employee/contractor account matching;
- repeated last-mile manipulation attempts;
- oracle-event delay or correction anomalies.
