# API Contract

Base URL: `http://127.0.0.1:4747`

## Public/Internal Pilot Routes

### `GET /health`

Returns service mode, live-execution gates, auth configuration, and append-only store snapshot.

### `GET /api/demo-tracking-numbers`

Returns the three synthetic tracking numbers bundled with the pilot.

### `GET /api/tracking/:trackingNumber`

Returns the synthetic shipment, generated markets, cutoff state, settlement state, and HCS-style anchors.

### `POST /api/orders`

Creates a paper order only.

```json
{
  "trackingNumber": "771234567890",
  "marketId": "abc123-day-2026-05-18",
  "side": "YES",
  "contracts": 5,
  "accountId": "demo-customer",
  "participant": {
    "role": "recipient",
    "jurisdiction": "US-CO",
    "relationToShipment": "recipient",
    "employeeOrContractor": false
  }
}
```

The response includes `riskChecks`, `environment: "paper"`, and `reason`. No wallet signature or venue order is generated.

### `GET /api/ledger`

Returns recent append-only paper order records.

### `POST /api/risk/evaluate`

Evaluates participant risk separately from paper-order acceptance.

```json
{
  "accountId": "driver-1",
  "role": "driver_or_station_operator",
  "jurisdiction": "US-TN",
  "relationToShipment": "operations",
  "employeeOrContractor": true
}
```

Real-money pilot eligibility currently always returns `false`.

### `GET /api/oracle/events`

Returns recent oracle event records.

### `POST /api/oracle/events`

Records an oracle event to the pilot ledger. If `ORACLE_SIGNER_ADDRESS` is configured, the payload must include an EIP-712 signature from that address.

```json
{
  "event": {
    "trackingNumberHash": "sha256:...",
    "eventCode": "HUB_ARRIVAL",
    "occurredAt": "2026-05-17T08:20:00-05:00",
    "facility": "Memphis World Hub",
    "city": "Memphis",
    "state": "TN",
    "eventSource": "fedex_sandbox"
  },
  "signerAddress": "0x...",
  "signature": "0x..."
}
```

The route returns `liveResolutionSubmitted: false`.

## Admin Routes

Admin routes are open in local development unless `DELIVERY_MARKETS_ADMIN_TOKEN` is configured. When configured, send `Authorization: Bearer <token>`.

### `GET /api/admin/audit`

Returns store snapshot, latest orders, latest oracle events, and live-execution gates.

### `POST /api/admin/simulate-resolution`

Returns the computed bundle and settlement state for a synthetic tracking number. It does not submit an EVM transaction.
