# Security Audit Report

Date: 2026-05-16  
Repo: `/Users/aribs/Code/fedex-delivery-markets`  
Commit audited: `39071a1` plus current uncommitted security-audit report  
Scope: React/Vite frontend, Hono API, oracle/risk/order domains, JSONL persistence, Solidity resolver, Docker/Render/CI scaffolding.

Remediation update: 2026-05-19, current branch `fix/stable-demo-market-clock`
at `47aa517`. The original audit findings below remain as historical evidence
for commit `39071a1`; the current implementation has remediated the two
critical fail-open findings and several high/medium demo-hardening issues.
Current `/api/readiness` is the source of truth for live operator posture.

## Executive Summary

The application is acceptable as a local paper-only prototype and is now safer
for partner review, but it is still not ready for an internet-exposed
FedEx/Robinhood pilot. The original highest-risk issue was that privileged
admin/oracle routes failed open when environment variables were missing,
including in `NODE_ENV=production`. Current live probes show those routes now
fail closed by default: unauthenticated `/api/admin/audit` returns `401`, admin
mode reports `locked`, and oracle mode reports `locked` unless an explicit
development fixture flag or signer configuration is present.

The remaining risk cluster is pilot data governance: public demo users can
still create paper orders and read redacted recent paper-order records, and the
smart contract remains explicitly demo-only. That is acceptable for an internal
fixture demo, but a shared pilot still needs account-scoped access, written
exchange/listing rules, formal FedEx oracle authorization, and a reviewed
testnet resolver before any result is treated as authoritative.

Positive findings: no committed production secrets were found, no obvious React DOM-XSS sinks were found, the app uses Zod schemas for most request validation, tests pass, and the code keeps live money movement/order signing absent rather than hidden behind an unsafe toggle.

## Methodology

- Read project security instructions and JavaScript/TypeScript, React, and Node web-server security guidance.
- Reviewed API routes, auth, oracle signing, risk logic, storage, static serving, deployment files, CI, and Solidity resolver.
- Ran targeted source searches for DOM-XSS sinks, dynamic code execution, storage/token patterns, secrets, unsafe filesystem use, and auth-sensitive code.
- Ran dependency audit with `npm audit --json` and high-severity gate with `npm audit --audit-level=high`.
- Ran `npm run verify`.
- Performed live probes against the current dev server and a production-style single-process server on `PORT=4752 NODE_ENV=production`.

## Verification Evidence

Current remediation evidence on 2026-05-19:

- `npm run verify`: passed.
- Vitest: 13 tests passed.
- Production build: passed.
- Browser smoke: passed against `http://127.0.0.1:5178`.
- Runtime probe: `GET /api/admin/audit` returned `401 Unauthorized` without authorization when `DELIVERY_MARKETS_ADMIN_TOKEN` was unset.
- Runtime probe: `GET /api/readiness` returned `securityPosture.adminAuthMode: "locked"`, `oracleMode: "locked"`, `adminRoutesFailClosed: true`, `oracleEventsRequireSignature: true`, `publicLedgerRedacted: true`, `rejectedOrdersPersisted: false`, `rateLimitsEnabled: true`, and all live money/FedEx/order-signing gates `false`.

Original audit evidence from 2026-05-16:

- `npm run verify`: passed.
- Vitest: 10 tests passed.
- Production build: passed.
- `npm audit --audit-level=high`: passed.
- Full `npm audit --json`: 16 low-severity advisories.
- Secret-pattern scan: no production secrets found; one known test private key in `src/server/app.test.ts`.
- Runtime probe: `GET /api/admin/audit` returned `200 OK` without authorization when admin token was unset.
- Runtime probe: `POST /api/oracle/events` returned `202 Accepted` for an unsigned `fedex_fixture` event when oracle signer was unset.

## Critical Findings

### SEC-01: Admin authorization fails open in production when token is missing

- Rule ID: NODE-AUTH-001
- Severity: Critical; status: remediated in current branch
- Location: `src/server/auth.ts:7-12`, `src/server/app.ts:87`, `src/server/app.ts:143-153`
- Current behavior: `requireAdmin` now returns `401` unless
  `DELIVERY_MARKETS_ADMIN_TOKEN` is configured or
  `ALLOW_DEV_OPEN_ADMIN=true` is set outside production.
- Evidence:

```ts
if (!configuredToken) {
  c.header("x-delivery-markets-auth", "dev-open-admin");
  await next();
  return;
}
```

Privileged routes use this middleware:

```ts
app.post("/api/oracle/events", requireAdmin, async (c) => { ... });
app.get("/api/admin/audit", requireAdmin, (c) => ...);
app.post("/api/admin/simulate-resolution", requireAdmin, async (c) => { ... });
```

Live production-style evidence:

```http
GET /api/admin/audit
HTTP/1.1 200 OK
x-delivery-markets-auth: dev-open-admin
```

- Historical impact: Any internet user could read audit data and submit oracle events if the deployment omitted `DELIVERY_MARKETS_ADMIN_TOKEN`. This compromised pilot data integrity and partner trust in the audited commit.
- Fix: Fail closed in `NODE_ENV=production` when `DELIVERY_MARKETS_ADMIN_TOKEN` is missing. Keep a separate explicit `ALLOW_DEV_OPEN_ADMIN=true` escape hatch for local development only.
- Mitigation: Put admin and oracle routes behind network access controls, Basic/OIDC auth, and deployment checks that reject missing admin token.
- Residual risk: Shared pilot deployments still need real identity, account scoping, and deployment checks that require the token.

### SEC-02: Oracle event authenticity is optional and unsigned fixture events are accepted

- Rule ID: ORACLE-AUTH-001
- Severity: Critical; status: remediated in current branch
- Location: `src/domain/oracle.ts:63-68`, `src/server/app.ts:94-98`
- Current behavior: oracle signatures are required by default. Unsigned fixture
  events require the explicit non-production `ALLOW_FIXTURE_ORACLE_EVENTS=true`
  escape hatch, and admin auth still gates oracle routes.
- Evidence:

```ts
const needsSignature = Boolean(expectedSignerAddress);
const signatureValid = needsSignature
  ? await verifyOracleSignature(request, expectedSignerAddress as Address)
  : false;
const accepted = !needsSignature || signatureValid;
```

Live production-style evidence:

```http
POST /api/oracle/events
HTTP/1.1 202 Accepted
...
"verificationMode":"fixture","verificationStatus":"accepted"
```

- Historical impact: If `ORACLE_SIGNER_ADDRESS` was missing, the server treated unsigned events as accepted. In a pilot, a forged `DELIVERED` or `HUB_ARRIVAL` event could poison the audit trail and any downstream resolver or dashboard that trusted accepted events.
- Fix: In production, require `ORACLE_SIGNER_ADDRESS` and a valid signature for every oracle event. Treat fixture mode as test-only and block it unless `NODE_ENV !== "production"` and an explicit test flag is present.
- Mitigation: Separate `/api/oracle/fixtures` from `/api/oracle/events`; never let fixture events share the accepted production event namespace.
- Residual risk: A real pilot still needs signer key custody, rotation, replay
  prevention, event corrections, and source-feed governance before oracle output
  is authoritative.

## High Findings

### SEC-03: Ledger and order APIs allow unauthenticated writes and public reads

- Rule ID: API-AUTH-001
- Severity: High
- Location: `src/server/app.ts:51-73`, `src/domain/orders.ts:67-81`
- Evidence:

```ts
app.post("/api/orders", async (c) => {
  ...
  store.appendOrder(order);
  return c.json({ order, ledger: store.listOrders(12) }, ...);
});

app.get("/api/ledger", (c) => c.json({ orders: store.listOrders(50) }));
```

Persisted order records include:

```ts
trackingNumberHash: sha256(request.trackingNumber.replace(/\D/g, "")),
accountId: participant.accountId,
riskChecks: riskDecision.checks,
```

- Impact: Any user can impersonate any `accountId`, write paper orders, and read recent order/risk records. Even hashed tracking numbers and risk decisions can become sensitive in a partner pilot.
- Fix: Add authenticated accounts, scoped ledger reads, and server-issued account IDs. Return only the caller's orders unless admin authorization is present.
- Mitigation: Keep `/api/ledger` admin-only until a real account model exists.
- False positive notes: This is lower risk for a local demo, but high risk for any shared pilot URL.

### SEC-04: No body-size limits, rate limits, or storage quotas protect append-only routes

- Rule ID: API-DOS-001
- Severity: High
- Location: `src/server/app.ts:51-98`, `src/server/store.ts:23-67`
- Evidence:

```ts
const body = await c.req.json().catch(() => undefined);
store.appendOrder(order);
store.appendOracleEvent(record);
```

The store reads entire files for common operations:

```ts
return readJsonLines<PaperOrder>(this.ordersPath).slice(-limit).reverse();
return readJsonLines<OracleEventRecord>(this.oracleEventsPath).length + 1;
const content = readFileSync(path, "utf8").trim();
```

- Impact: An attacker can submit many requests or large JSON bodies to consume disk and CPU. Once the JSONL files grow, routine reads and `snapshot()` become increasingly expensive and can block the Node event loop.
- Fix: Add body-size caps, per-IP/account rate limits, request timeouts, bounded JSONL tail reads, and a quota/rotation policy. Reject malformed or blocked writes before persistence unless the audit trail is explicitly protected.
- Mitigation: Put the service behind a WAF/reverse proxy with request-size and rate limits while code-level limits are implemented.
- False positive notes: Render disk is limited to 1GB in `infra/render.yaml`, which prevents unlimited disk growth but turns this into an easy denial-of-service target.

### SEC-05: Blocked and invalid orders are persisted, enabling ledger spam and noisy audit trails

- Rule ID: DATA-INTEGRITY-001
- Severity: High
- Location: `src/server/app.ts:64-69`, `src/domain/orders.ts:45-61`
- Evidence:

```ts
const order = createPaperOrder(parsed.data, bundle);
store.appendOrder(order);
return c.json(
  { order, ledger: store.listOrders(12) },
  order.status === "ACCEPTED" ? 201 : 409
);
```

Live evidence: a request with an invalid `marketId` returned `409 Conflict` but was still appended to the ledger with `accountId:"attacker"`.

- Impact: Attackers can flood the ledger with blocked records, pollute reports, inflate order counts, and obscure legitimate audit activity.
- Fix: Split operational order ledger from security audit events. Persist rejected/blocked requests only in an authenticated, rate-limited abuse log with minimal fields.
- Mitigation: Add anti-spam counters and reject invalid market IDs before writing to the order ledger.
- False positive notes: Persisting rejections can be valuable for security audit, but it should not share the product ledger without guardrails.

## Medium Findings

### SEC-06: Missing production security headers

- Rule ID: WEB-HEADERS-001
- Severity: Medium
- Location: `src/server/static.ts:30-33`, runtime responses from `http://127.0.0.1:4752/`
- Evidence:

```ts
return c.body(readFileSync(filePath), 200, {
  "content-type": MIME_TYPES[ext] ?? "application/octet-stream"
});
```

Runtime response did not include visible `Content-Security-Policy`, `X-Frame-Options` or `frame-ancestors`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, or `Permissions-Policy`.

- Impact: Missing headers weaken defense-in-depth against XSS, clickjacking, MIME sniffing, and data leakage via referrers. This matters because the app displays market/order/oracle data and external docs links.
- Fix: Add a Hono security-headers middleware or set equivalent headers at the edge. Use a CSP compatible with the Vite build, including `default-src 'self'`, `script-src 'self'`, `style-src 'self'`, `frame-ancestors 'none'`, and tight `connect-src`.
- Mitigation: Configure the hosting provider or CDN to set these headers before public pilot exposure.
- False positive notes: Headers may be supplied by future edge infrastructure, but none are visible in app code or local production-style responses.

### SEC-07: EIP-712 oracle messages are replayable across deployments and contexts

- Rule ID: ORACLE-REPLAY-001
- Severity: Medium
- Location: `src/domain/oracle.ts:33-49`
- Evidence:

```ts
export const oracleTypedDataDomain = {
  name: "DeliveryMarketsOracle",
  version: "1",
  chainId: ROBINHOOD_CHAIN_TESTNET.chainId
} as const;
```

The signed message includes event fields, but not a deployment-specific verifying contract, environment, nonce, market ID, expiry, or HCS topic ID.

- Impact: A valid signature from one environment could be replayed in another environment that uses the same chain ID and signer. A signed delivery event could also be replayed unless downstream code enforces event uniqueness.
- Fix: Include `verifyingContract` or a deployment salt in the typed-data domain, and include `nonce`, `marketId`, `expiresAt`, and `hcsTopicId` in the signed message.
- Mitigation: Track accepted `eventHash` values and reject duplicates immediately.
- False positive notes: The current local pilot has no live EVM/Hedera submission, but the signing shape is exactly the thing partners will review.

### SEC-08: Smart contract resolver lacks production governance and validation controls

- Rule ID: CONTRACT-GOV-001
- Severity: Medium
- Location: `contracts/DeliveryMarketResolver.sol:59-76`, `contracts/DeliveryMarketResolver.sol:78-134`
- Evidence:

```solidity
constructor(address initialOracle) {
    owner = msg.sender;
    oracle = initialOracle;
}

function setOracle(address nextOracle) external onlyOwner {
    oracle = nextOracle;
}

function resolve(...) external onlyOracle {
    ...
    market.status = MarketStatus.Resolved;
}
```

- Impact: The contract can be deployed with a zero oracle, oracle can be set to zero, there is no owner transfer/renounce pattern, no pause, no cutoff timestamp enforcement, and no validation that final event hash or HCS metadata are non-empty. The oracle can resolve a market directly from `Open`.
- Fix: Use audited access-control patterns, validate non-zero addresses and metadata, add owner transfer, add pause/emergency halt, enforce cutoff/resolution state transitions, and add a duplicate/finality model.
- Mitigation: Continue treating this contract as demo-only and non-custodial until a formal contract test suite and external review exist.
- False positive notes: The contract clearly says demo-only and has no custody, which materially reduces immediate risk.

### SEC-09: Production container runs as root and ships TypeScript runtime/source

- Rule ID: CONTAINER-HARDENING-001
- Severity: Medium
- Location: `Dockerfile:10-20`, `package.json:11`, `package.json:27`
- Evidence:

```dockerfile
FROM node:24-slim AS runtime
WORKDIR /app
...
COPY --from=build /app/src ./src
CMD ["npm", "run", "start"]
```

```json
"start": "tsx src/server/index.ts",
"tsx": "^4.19.4"
```

- Impact: Running as root increases container breakout and file-modification blast radius. Shipping source and a TS execution runtime in production increases attack surface and makes it easier for an attacker with a foothold to inspect or modify app logic.
- Fix: Compile server code to JavaScript, run `node dist-server/...`, copy only runtime artifacts, and set `USER node` or another non-root user. Use read-only filesystem where feasible.
- Mitigation: Use platform-level container hardening, least-privilege volume permissions, and no shell in final image if possible.
- False positive notes: This is acceptable for a prototype, not for a partner pilot.

## Low Findings

### SEC-10: Dependency audit has low-severity crypto/tooling advisories

- Rule ID: DEP-AUDIT-001
- Severity: Low
- Location: `package.json:18-41`, `package-lock.json`
- Evidence: `npm audit --json` reports 16 low-severity advisories, primarily ethers v5 lineage through `@hashgraph/sdk`/`@polymarket/clob-client-v2`, and `tmp` through dev-only `solc`.
- Impact: No high/critical dependency issue is currently blocking. Remaining items should still be tracked because crypto SDK dependencies matter if this becomes a real oracle/order-signing service.
- Fix: Prefer SDK versions that have moved off vulnerable transitive dependencies, or isolate optional SDK adapters from the runtime server.
- Mitigation: Keep `npm audit --audit-level=high` in CI and add a scheduled dependency review.
- False positive notes: `solc` is dev-only; the SDK crypto advisories are currently low severity.

### SEC-11: Test private key triggers secret scanners

- Rule ID: SECRET-HYGIENE-001
- Severity: Low
- Location: `src/server/app.test.ts:147-151`
- Evidence:

```ts
const account = privateKeyToAccount(
  "0x59c6995e998f97a5a0044966f094538e9d6d481b0392c81e9b513b7a8171b7e4"
);
```

- Impact: This is a known public test key, but it will trigger secret scanners and may train contributors to ignore secret-scan alerts.
- Fix: Use a named constant like `PUBLIC_TEST_PRIVATE_KEY_DO_NOT_USE` with a comment, or derive a test key from a deterministic non-secret seed if the library supports it.
- Mitigation: Add secret-scanner allowlist comments scoped to this exact line only.
- False positive notes: The scan found no production secret material.

## Informational Observations

- React frontend did not use `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `document.write`, `localStorage`, or `sessionStorage`.
- External links use `target="_blank"` with `rel="noreferrer"` in `src/App.tsx:371`, which prevents opener access.
- The app does not expose real-money routes, live exchange order routing, wallet signing, or FedEx production API access.
- Zod schema validation exists for order, risk, and oracle payloads.
- CORS is not permissive for browser access; an `Origin: https://evil.example` probe did not receive an allow-origin echo. CORS does not protect direct server-to-server requests, so it is not an auth control.

## Prioritized Remediation Plan

1. Fail closed on admin/oracle auth in production.
2. Require signed oracle events in production and remove accepted fixture mode from production routes.
3. Move `/api/ledger` and oracle event reads behind auth or scoped account access.
4. Add body-size limits, rate limits, bounded ledger reads, duplicate event rejection, and JSONL rotation.
5. Add production security headers.
6. Harden EIP-712 oracle payloads with deployment-bound domain data, nonce, market ID, topic ID, and expiry.
7. Harden Solidity resolver governance/state-transition validation.
8. Harden Docker runtime and compile server output instead of running `tsx` in production.
9. Track low-severity dependency advisories and isolate optional SDK adapters.

## Readiness Verdict

- Local demo: acceptable.
- Internal tabletop review: acceptable with this report attached.
- Partner pilot behind VPN/auth: not ready until SEC-01 through SEC-05 are fixed.
- Public internet pilot: not ready until all Critical, High, and Medium findings are fixed or formally risk-accepted.
