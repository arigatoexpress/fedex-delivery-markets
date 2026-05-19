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
    expect(payload.securityPosture.adminRoutesFailClosed).toBe(true);
    expect(payload.securityPosture.publicLedgerRedacted).toBe(true);
    expect(payload.integrations.length).toBeGreaterThanOrEqual(3);
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
