import { describe, expect, it } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { privateKeyToAccount } from "viem/accounts";
import { buildMarketBundle } from "../domain/deliveryMarkets";
import { createPaperOrder } from "../domain/orders";
import {
  oracleTypedDataDomain,
  oracleTypedDataTypes,
  normalizeEvent
} from "../domain/oracle";
import { sha256 } from "../domain/hash";
import { createPilotStore } from "./store";
import { createApp } from "./app";

describe("delivery market lifecycle", () => {
  it("keeps pre-hub markets open", () => {
    const bundle = buildMarketBundle(
      "771234567890",
      new Date("2026-05-16T20:00:00.000Z")
    );

    expect(bundle.cutoff.status).toBe("OPEN");
    expect(bundle.markets.every((market) => market.status === "OPEN")).toBe(true);
  });

  it("locks markets after hub arrival", () => {
    const bundle = buildMarketBundle(
      "882345678901",
      new Date("2026-05-16T20:00:00.000Z")
    );

    expect(bundle.cutoff.status).toBe("CUTOFF_LOCKED");
    expect(bundle.markets.every((market) => market.status === "CUTOFF_LOCKED")).toBe(true);
  });

  it("resolves delivered package markets", () => {
    const bundle = buildMarketBundle(
      "993456789012",
      new Date("2026-05-16T20:00:00.000Z")
    );

    expect(bundle.cutoff.status).toBe("RESOLVED");
    expect(bundle.settlement?.resolvedMarketIds.length).toBeGreaterThan(0);
    expect(bundle.markets.every((market) => market.status === "RESOLVED")).toBe(true);
  });

  it("accepts only paper orders on open markets", () => {
    const bundle = buildMarketBundle(
      "771234567890",
      new Date("2026-05-16T20:00:00.000Z")
    );
    const market = bundle.markets[0];
    const order = createPaperOrder(
      {
        trackingNumber: "771234567890",
        marketId: market.id,
        side: "YES",
        contracts: 3,
        accountId: "demo-customer"
      },
      bundle,
      new Date("2026-05-16T20:00:00.000Z")
    );

    expect(order.status).toBe("ACCEPTED");
    expect(order.reason).toContain("No wallet signature");
  });

  it("blocks paper orders once cutoff has fired", () => {
    const bundle = buildMarketBundle(
      "882345678901",
      new Date("2026-05-16T20:00:00.000Z")
    );
    const market = bundle.markets[0];
    const order = createPaperOrder(
      {
        trackingNumber: "882345678901",
        marketId: market.id,
        side: "NO",
        contracts: 2,
        accountId: "demo-customer"
      },
      bundle,
      new Date("2026-05-16T20:00:00.000Z")
    );

    expect(order.status).toBe("BLOCKED");
    expect(order.reason).toContain("CUTOFF_LOCKED");
  });
});

describe("api", () => {
  it("serves probe-friendly health aliases without enabling live systems", async () => {
    const app = createApp({ store: createPilotStore(tempDataDir()) });

    for (const path of ["/health", "/healthz", "/healthz/"]) {
      const response = await app.request(path);
      const payload = await response.json();

      expect(response.status).toBe(200);
      expect(payload.mode).toBe("paper-only");
      expect(payload.liveMoneyMovementAllowed).toBe(false);
      expect(payload.liveFedExApiAllowed).toBe(false);
      expect(payload.liveOrderSigningAllowed).toBe(false);
    }
  });

  it("serves llms.txt as paper-only agent context", async () => {
    const app = createApp({ store: createPilotStore(tempDataDir()) });

    const response = await app.request("/llms.txt");
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/plain");
    expect(response.headers.get("cache-control")).toBe("public, max-age=3600");
    expect(body).toContain("# Delivery Markets");
    expect(body).toContain("https://delivery-markets.sapphirealpha.xyz/");
    expect(body).toContain("No public Delivery Markets route authorizes real FedEx API access");
  });

  it("persists paper orders to an append-only store", async () => {
    const store = createPilotStore(tempDataDir());
    const app = createApp({ store });
    const bundleResponse = await app.request("/api/tracking/771234567890");
    const bundle = await bundleResponse.json();
    const response = await app.request("/api/orders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        trackingNumber: "771234567890",
        marketId: bundle.markets[0].id,
        side: "YES",
        contracts: 4
      })
    });

    expect(response.status).toBe(201);
    expect(store.snapshot().orderCount).toBe(1);
    expect(store.listOrders()[0].environment).toBe("paper");
  });

  it("serves readiness without enabling live money movement", async () => {
    const app = createApp({ store: createPilotStore(tempDataDir()) });
    const response = await app.request("/api/readiness");
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.liveMoneyMovementAllowed).toBe(false);
    expect(payload.walletReadiness.liveFundsAllowed).toBe(false);
    expect(payload.walletReadiness.serverSideSigning).toBe("disabled");
    expect(payload.securityPosture.adminRoutesFailClosed).toBe(true);
    expect(payload.securityPosture.publicLedgerRedacted).toBe(true);
    expect(payload.integrations.length).toBeGreaterThanOrEqual(3);
  });

  it("reports wallet readiness without requiring live funds", async () => {
    const previousWallet = process.env.DELIVERY_MARKETS_TESTNET_WALLET_ADDRESS;
    const previousSolanaWallet = process.env.SOLANA_TESTNET_WALLET_ADDRESS;
    delete process.env.DELIVERY_MARKETS_TESTNET_WALLET_ADDRESS;
    delete process.env.SOLANA_TESTNET_WALLET_ADDRESS;
    const app = createApp({ store: createPilotStore(tempDataDir()) });
    const response = await app.request("/api/wallet/readiness");
    const payload = await response.json();

    restoreEnv("DELIVERY_MARKETS_TESTNET_WALLET_ADDRESS", previousWallet);
    restoreEnv("SOLANA_TESTNET_WALLET_ADDRESS", previousSolanaWallet);

    expect(response.status).toBe(200);
    expect(payload.walletReadiness.liveFundsAllowed).toBe(false);
    expect(payload.walletReadiness.serverSideSigning).toBe("disabled");
    expect(payload.walletReadiness.rails).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "robinhood-chain-gas-wallet",
          status: "not_configured",
          liveFundsAllowed: false
        }),
        expect.objectContaining({
          id: "solana-reference-wallet",
          status: "not_required",
          liveFundsAllowed: false
        })
      ])
    );
  });

  it("blocks invalid wallet readiness addresses before RPC checks", async () => {
    const previousWallet = process.env.DELIVERY_MARKETS_TESTNET_WALLET_ADDRESS;
    process.env.DELIVERY_MARKETS_TESTNET_WALLET_ADDRESS = "not-a-wallet";
    const app = createApp({ store: createPilotStore(tempDataDir()) });
    const response = await app.request("/api/wallet/readiness");
    const payload = await response.json();
    const evmRail = payload.walletReadiness.rails.find(
      (rail: { id: string }) => rail.id === "robinhood-chain-gas-wallet"
    );

    restoreEnv("DELIVERY_MARKETS_TESTNET_WALLET_ADDRESS", previousWallet);

    expect(response.status).toBe(200);
    expect(evmRail.status).toBe("blocked");
    expect(evmRail.canDeployTestnet).toBe(false);
  });

  it("fails closed for admin routes by default", async () => {
    const app = createApp({ store: createPilotStore(tempDataDir()) });
    const response = await app.request("/api/admin/audit");
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.failClosed).toBe(true);
  });

  it("does not persist blocked paper orders to the product ledger", async () => {
    const store = createPilotStore(tempDataDir());
    const app = createApp({ store });
    const response = await app.request("/api/orders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        trackingNumber: "771234567890",
        marketId: "not-a-real-market",
        side: "YES",
        contracts: 1,
        accountId: "attacker"
      })
    });
    const payload = await response.json();

    expect(response.status).toBe(409);
    expect(payload.order.accountId).toBeUndefined();
    expect(store.snapshot().orderCount).toBe(0);
  });

  it("issues recipient-only access grants for matching package claims", async () => {
    const store = createPilotStore(tempDataDir());
    const app = createApp({ store });
    const response = await app.request("/api/access/claim", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        trackingNumber: "771234567890",
        walletAddress: "0x1111111111111111111111111111111111111111",
        claimCode: "AUSTIN-DENVER-RECIPIENT"
      })
    });
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.grant.status).toBe("GRANTED");
    expect(payload.grant.capabilities).toContain("SUBMIT_PRIVATE_ORDER");
    expect(payload.accessGrantSecret).toMatch(/^ag_/);
    expect(payload.grant.grantSecretHash).toBeUndefined();
    expect(store.snapshot().accessGrantCount).toBe(1);
  });

  it("denies recipient access when the wallet does not match the package record", async () => {
    const app = createApp({ store: createPilotStore(tempDataDir()) });
    const response = await app.request("/api/access/claim", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        trackingNumber: "771234567890",
        walletAddress: "0x9999999999999999999999999999999999999999",
        claimCode: "AUSTIN-DENVER-RECIPIENT"
      })
    });
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.grant.status).toBe("DENIED");
    expect(payload.accessGrantSecret).toBeUndefined();
    expect(payload.grant.reason).toContain("Wallet is not");
  });

  it("quotes the private AMM with theta decay and LMSR liquidity", async () => {
    const app = createApp({ store: createPilotStore(tempDataDir()) });
    const bundleResponse = await app.request("/api/tracking/771234567890");
    const bundle = await bundleResponse.json();
    const response = await app.request("/api/amm/quote", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        trackingNumber: "771234567890",
        marketId: bundle.markets[0].id,
        side: "YES",
        contracts: 5
      })
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.quote.counterparty).toBe("private-amm-bot");
    expect(payload.quote.totalCostUsd).toBeGreaterThan(0);
    expect(payload.quote.thetaDecayBps).toBeGreaterThan(0);
    expect(payload.quote.liquidityParameter).toBeGreaterThan(0);
  });

  it("requires recipient grants before private AMM order submission", async () => {
    const app = createApp({ store: createPilotStore(tempDataDir()) });
    const bundleResponse = await app.request("/api/tracking/771234567890");
    const bundle = await bundleResponse.json();
    const response = await app.request("/api/private/orders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        trackingNumber: "771234567890",
        marketId: bundle.markets[0].id,
        side: "YES",
        contracts: 5,
        accessGrantId: "grant-missing",
        accessGrantSecret: "ag_missing"
      })
    });

    expect(response.status).toBe(403);
  });

  it("rejects private AMM orders when the grant secret is wrong", async () => {
    const store = createPilotStore(tempDataDir());
    const app = createApp({ store });
    const bundleResponse = await app.request("/api/tracking/771234567890");
    const bundle = await bundleResponse.json();
    const grantResponse = await app.request("/api/access/claim", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        trackingNumber: "771234567890",
        walletAddress: "0x1111111111111111111111111111111111111111",
        claimCode: "AUSTIN-DENVER-RECIPIENT"
      })
    });
    const grantPayload = await grantResponse.json();
    const response = await app.request("/api/private/orders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        trackingNumber: "771234567890",
        marketId: bundle.markets[0].id,
        side: "YES",
        contracts: 5,
        accessGrantId: grantPayload.grant.id,
        accessGrantSecret: "ag_wrong"
      })
    });

    expect(response.status).toBe(403);
    expect(store.snapshot().orderCount).toBe(0);
  });

  it("submits private AMM paper orders and returns testnet calldata previews", async () => {
    const store = createPilotStore(tempDataDir());
    const app = createApp({ store });
    const bundleResponse = await app.request("/api/tracking/771234567890");
    const bundle = await bundleResponse.json();
    const grantResponse = await app.request("/api/access/claim", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        trackingNumber: "771234567890",
        walletAddress: "0x1111111111111111111111111111111111111111",
        claimCode: "AUSTIN-DENVER-RECIPIENT"
      })
    });
    const grantPayload = await grantResponse.json();
    const response = await app.request("/api/private/orders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        trackingNumber: "771234567890",
        marketId: bundle.markets[0].id,
        side: "YES",
        contracts: 5,
        accessGrantId: grantPayload.grant.id,
        accessGrantSecret: grantPayload.accessGrantSecret
      })
    });
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.order.accountId).toBeUndefined();
    expect(payload.quote.counterparty).toBe("private-amm-bot");
    expect(payload.testnetPreviews[0].chainId).toBe(46630);
    expect(payload.testnetPreviews[0].walletRequest.chainId).toBe("0xb626");
    expect(payload.testnetPreviews.every((preview: { broadcastEnabled: boolean }) => !preview.broadcastEnabled)).toBe(
      true
    );
    expect(store.snapshot().orderCount).toBe(1);
  });

  it("reports a testnet deployment plan without enabling API broadcast", async () => {
    const app = createApp({ store: createPilotStore(tempDataDir()) });
    const response = await app.request("/api/testnet/deployment-plan");
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.deploymentPlan.chainId).toBe(46630);
    expect(payload.deploymentPlan.targetContract).toBe("PrivateDeliveryMarket");
    expect(payload.deploymentPlan.apiBroadcastEnabled).toBe(false);
    expect(payload.deploymentPlan.requiredEnv).toContain("DEPLOY_PRIVATE_MARKET_CONTRACT=true");
  });

  it("evaluates participant risk separately from paper order acceptance", async () => {
    const app = createApp({ store: createPilotStore(tempDataDir()) });
    const response = await app.request("/api/risk/evaluate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        accountId: "driver-1",
        role: "driver_or_station_operator",
        jurisdiction: "US-TN",
        relationToShipment: "operations",
        employeeOrContractor: true
      })
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.eligibleForPaper).toBe(true);
    expect(payload.eligibleForRealMoneyPilot).toBe(false);
    expect(payload.checks.some((check: { status: string }) => check.status === "block")).toBe(true);
  });

  it("accepts signed oracle events when the configured signer matches", async () => {
    const previousSigner = process.env.ORACLE_SIGNER_ADDRESS;
    const previousAdminToken = process.env.DELIVERY_MARKETS_ADMIN_TOKEN;
    const account = privateKeyToAccount(
      "0x59c6995e998f97a5a0044966f094538e9d6d481b0392c81e9b513b7a8171b7e4"
    );
    process.env.ORACLE_SIGNER_ADDRESS = account.address;
    process.env.DELIVERY_MARKETS_ADMIN_TOKEN = "test-admin-token";
    const app = createApp({ store: createPilotStore(tempDataDir()) });
    const event = {
      trackingNumberHash: sha256("771234567890"),
      eventCode: "HUB_ARRIVAL",
      occurredAt: "2026-05-17T08:20:00-05:00",
      facility: "Memphis World Hub",
      city: "Memphis",
      state: "TN",
      eventSource: "fedex_sandbox"
    } as const;
    const signature = await account.signTypedData({
      domain: oracleTypedDataDomain,
      types: oracleTypedDataTypes,
      primaryType: "TrackingOracleEvent",
      message: normalizeEvent(event)
    });

    const response = await app.request("/api/oracle/events", {
      method: "POST",
      headers: {
        authorization: "Bearer test-admin-token",
        "content-type": "application/json"
      },
      body: JSON.stringify({ event, signerAddress: account.address, signature })
    });
    const payload = await response.json();
    if (previousSigner === undefined) {
      delete process.env.ORACLE_SIGNER_ADDRESS;
    } else {
      process.env.ORACLE_SIGNER_ADDRESS = previousSigner;
    }
    if (previousAdminToken === undefined) {
      delete process.env.DELIVERY_MARKETS_ADMIN_TOKEN;
    } else {
      process.env.DELIVERY_MARKETS_ADMIN_TOKEN = previousAdminToken;
    }

    expect(response.status).toBe(202);
    expect(payload.oracleEvent.verificationMode).toBe("signed");
    expect(payload.oracleEvent.verificationStatus).toBe("accepted");
    expect(payload.liveResolutionSubmitted).toBe(false);
  });

  it("rejects oracle events when signer configuration is missing", async () => {
    const previousSigner = process.env.ORACLE_SIGNER_ADDRESS;
    const previousAdminToken = process.env.DELIVERY_MARKETS_ADMIN_TOKEN;
    delete process.env.ORACLE_SIGNER_ADDRESS;
    process.env.DELIVERY_MARKETS_ADMIN_TOKEN = "test-admin-token";
    const store = createPilotStore(tempDataDir());
    const app = createApp({ store });
    const response = await app.request("/api/oracle/events", {
      method: "POST",
      headers: {
        authorization: "Bearer test-admin-token",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        event: {
          trackingNumberHash: sha256("771234567890"),
          eventCode: "HUB_ARRIVAL",
          occurredAt: "2026-05-17T08:20:00-05:00",
          facility: "Memphis World Hub",
          city: "Memphis",
          state: "TN",
          eventSource: "fedex_fixture"
        }
      })
    });
    const payload = await response.json();

    if (previousSigner === undefined) {
      delete process.env.ORACLE_SIGNER_ADDRESS;
    } else {
      process.env.ORACLE_SIGNER_ADDRESS = previousSigner;
    }
    if (previousAdminToken === undefined) {
      delete process.env.DELIVERY_MARKETS_ADMIN_TOKEN;
    } else {
      process.env.DELIVERY_MARKETS_ADMIN_TOKEN = previousAdminToken;
    }

    expect(response.status).toBe(503);
    expect(payload.failClosed).toBe(true);
    expect(store.snapshot().oracleEventCount).toBe(0);
  });
});

function tempDataDir(): string {
  return mkdtempSync(join(tmpdir(), "fedex-delivery-markets-test-"));
}

function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}
