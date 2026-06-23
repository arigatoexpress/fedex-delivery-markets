# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Security

- Fixed `shell-quote` CVE by upgrading `concurrently` from `^9.1.2` to `^10.0.3`.
- Added `verifyingContract` and `nonce` to EIP-712 typed data in `oracle.ts` to prevent cross-context replay attacks.
- Added `Ownable2Step`-style ownership transfer to `DeliveryMarketResolver.sol`.
- Added `pause` / `unpause` to `DeliveryMarketResolver.sol` with `EnforcedPause` error.
- Added zero-address checks for `oracle` and `newOwner` in `DeliveryMarketResolver.sol`.
- Added `CutoffNotReached` enforcement in `DeliveryMarketResolver.sol` so `lockCutoff` and `resolve` respect time and state ordering.
- Added `robots.txt` to disallow crawlers from API routes.
- Added `/ready` probe that verifies store writability and static build presence.

### Added

- Decomposed `App.tsx` into `MarketCard`, `OrderTicket`, `RouteMap`, `Ledger`, and `AccessTicket` components.
- Added frontend smoke tests using Playwright (`e2e/smoke.spec.ts`).
- Added contract ABI verification tests for pause, ownable, and cutoff enforcement.
- Added `CHANGELOG.md` and `CONTRIBUTING.md`.
- Added structured JSON logging wrapper (`src/server/logger.ts`) replacing `console.log` in `index.ts`.

### Changed

- Replaced `console.log` in `src/server/index.ts` with structured JSON logging via `logServerStartup`.

### Fixed

- `npm audit --audit-level=high` now passes for the `shell-quote` critical vulnerability.

## [0.1.0] - 2026-05-22

### Added

- Initial paper-only demo for delivery-time prediction markets.
- Synthetic tracking fixtures with three demo tracking numbers.
- Private AMM quoting with theta decay and LMSR liquidity.
- Recipient access grants and claim-code verification.
- Testnet calldata previews for Robinhood Chain (chainId 46630).
- Oracle event ingestion with EIP-712 signature verification.
- Wallet readiness and integration readiness endpoints.
- Admin audit routes with token-based auth.
- `llms.txt` for AI-agent context.
- Security headers, rate limiting, and CORS configuration.

