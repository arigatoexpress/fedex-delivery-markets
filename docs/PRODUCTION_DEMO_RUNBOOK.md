# Production Demo Runbook

Target host: `delivery-markets.sapphirealpha.xyz`  
Cloud project: `sapphire-479610`  
Region: `us-central1`  
Service: `fedex-delivery-markets`

## Demo Posture

This is a public paper-money demo, not a live prediction market.

- No real funds.
- No server-side wallet signing.
- No live Robinhood, Polymarket, CoW, or Hedera transaction submission.
- No FedEx production API calls.
- No real package payload storage.
- No customer wagering, settlement, deposits, withdrawals, or order routing.

## Current Public Scope

The public demo uses synthetic package fixtures and deterministic paper orders.
Real FedEx tracking can only be enabled after an authorized FedEx API/sandbox
path, privacy review, retention policy, and visible user consent are in place.

## Deploy

```bash
gcloud run deploy fedex-delivery-markets \
  --project sapphire-479610 \
  --region us-central1 \
  --source . \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production,DELIVERY_MARKETS_DATA_DIR=/var/data/delivery-markets
```

## Domain Mapping

```bash
gcloud beta run domain-mappings create \
  --project sapphire-479610 \
  --region us-central1 \
  --service fedex-delivery-markets \
  --domain delivery-markets.sapphirealpha.xyz
```

If the mapping requires DNS records, add only the records returned by Cloud Run
to the authoritative `sapphirealpha.xyz` DNS zone, then wait for
`DomainRoutable=True`.

## Production Readback

```bash
curl -fsS https://delivery-markets.sapphirealpha.xyz/health
curl -fsS https://delivery-markets.sapphirealpha.xyz/api/readiness
curl -fsS https://delivery-markets.sapphirealpha.xyz/api/wallet/readiness
curl -fsS -o /tmp/delivery-markets-admin.out -w '%{http_code}' \
  https://delivery-markets.sapphirealpha.xyz/api/admin/audit
```

Expected:

- `/health` reports `mode: "paper-only"`.
- `/api/readiness` reports all live money/FedEx/signing gates `false`.
- `/api/wallet/readiness` reports `serverSideSigning: "disabled"`.
- unauthenticated `/api/admin/audit` returns `401`.

## Rollback

Use the previous Cloud Run revision in the `fedex-delivery-markets` service if
the public smoke fails. Do not change `sapphirealpha.xyz` apex or existing
dashboard/gateway/PM mappings for this demo.
