# Delivery Markets Product Boundary

Delivery Markets Lab is a **standalone paper-only research prototype**. It is not part of Sapphire Nexus and it is not the RECON station-operations dashboard.

## Owns

- Synthetic delivery-window scenarios and demo tracking numbers.
- Paper YES/NO market mechanics and deterministic cutoff/resolution behavior.
- Recipient-access demo gates.
- Paper ledger and testnet calldata **preview** paths.
- Its own frontend, API, tests, container, and deployment identity.

## Does not own

- FedEx manager prompt/adoption content — that belongs in `arigatoexpress/Ops-AI-Library`.
- RECON station-risk / manager-brief workflows.
- Sapphire Nexus intelligence, quant research, source-rights, or model-gateway contracts.
- Real package/customer data, real tracking integration, live exchange routing, money movement, wallet signing, or settlement.

## GCP boundary

Deploy this repository as its own Cloud Run service (recommended service name: `fedex-delivery-markets`) in the approved FedEx prototype/sandbox project. Do not deploy it into the Sapphire service and do not share Sapphire runtime credentials, service accounts, databases, or Secret Manager bindings.

Logical layout:

```text
FedEx prototype / sandbox GCP project
├── recon-dashboard
└── fedex-delivery-markets

Sapphire GCP project
└── sapphire-nexus
```

Cross-project links may point users to another public demo, but runtime state and secrets remain isolated.

## Demo contract

Every user-facing path must make these facts obvious without requiring documentation:

1. Synthetic data only.
2. Paper/practice predictions only.
3. No real funds or exchange order submission.
4. No real FedEx API connection.
5. No operational decision is produced by this app.

If future work changes any of those statements, it is a new governance review rather than a routine feature change.
