import { Hono } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";
import { buildMarketBundle, listDemoTrackingNumbers } from "../domain/deliveryMarkets";
import { createPaperOrder, orderRequestSchema } from "../domain/orders";
import {
  buildOracleEventRecord,
  oracleSignatureRequired,
  signedOracleEventRequestSchema
} from "../domain/oracle";
import { evaluateParticipantRisk, participantProfileSchema } from "../domain/risk";
import { getIntegrationReadiness, getResearchReferences } from "../adapters/readiness";
import { adminAuthConfigured, adminAuthMode, requireAdmin } from "./auth";
import { createPilotStore, toPublicOrder, type PilotStore } from "./store";
import { installStaticRoutes } from "./static";
import { parseLimitedJson, DEFAULT_JSON_BODY_LIMIT_BYTES } from "./request";
import { rateLimit } from "./rateLimit";
import { securityHeaders } from "./securityHeaders";

const trackingOnlySchema = z.object({ trackingNumber: z.string().min(8) });

export function createApp(options: { store?: PilotStore; serveStatic?: boolean } = {}) {
  const app = new Hono();
  const store = options.store ?? createPilotStore();

  app.use("*", securityHeaders());
  app.use("*", cors({ origin: ["http://127.0.0.1:5178", "http://localhost:5178"] }));
  app.use("/api/*", rateLimit({ windowMs: 60_000, max: 60 }));

  app.get("/health", (c) =>
    c.json({
      ok: true,
      service: "fedex-delivery-markets",
      mode: "paper-only",
      pilotInfrastructureReady: true,
      adminAuthConfigured: adminAuthConfigured(),
      liveMoneyMovementAllowed: false,
      liveFedExApiAllowed: false,
      liveOrderSigningAllowed: false,
      store: store.publicSnapshot(),
      timestamp: new Date().toISOString()
    })
  );

  app.get("/api/demo-tracking-numbers", (c) =>
    c.json({ trackingNumbers: listDemoTrackingNumbers() })
  );

  app.get("/api/tracking/:trackingNumber", (c) => {
    try {
      return c.json(buildMarketBundle(c.req.param("trackingNumber")));
    } catch (error) {
      return c.json(
        {
          error: error instanceof Error ? error.message : "Unknown tracking lookup error",
          availableDemoTrackingNumbers: listDemoTrackingNumbers()
        },
        404
      );
    }
  });

  app.post("/api/orders", async (c) => {
    const parsed = await parseLimitedJson(c, orderRequestSchema);
    if (!parsed.ok) {
      return c.json(parsed.payload, parsed.status);
    }

    const bundle = buildMarketBundle(parsed.data.trackingNumber);
    const order = createPaperOrder(parsed.data, bundle);
    if (order.status === "ACCEPTED") {
      store.appendOrder(order);
    }

    return c.json(
      { order: toPublicOrder(order), ledger: store.listPublicOrders(12) },
      order.status === "ACCEPTED" ? 201 : 409
    );
  });

  app.get("/api/ledger", (c) => c.json({ orders: store.listPublicOrders(50) }));

  app.post("/api/risk/evaluate", async (c) => {
    const parsed = await parseLimitedJson(c, participantProfileSchema);
    if (!parsed.ok) {
      return c.json(parsed.payload, parsed.status);
    }

    return c.json(evaluateParticipantRisk(parsed.data));
  });

  app.get("/api/oracle/events", requireAdmin, (c) => c.json({ events: store.listOracleEvents(50) }));

  app.post("/api/oracle/events", requireAdmin, async (c) => {
    const parsed = await parseLimitedJson(c, signedOracleEventRequestSchema);
    if (!parsed.ok) {
      return c.json(parsed.payload, parsed.status);
    }

    const requireSignature = oracleSignatureRequired();
    if (requireSignature && !process.env.ORACLE_SIGNER_ADDRESS) {
      return c.json(
        {
          error: "Oracle signer not configured",
          failClosed: true
        },
        503
      );
    }

    const record = await buildOracleEventRecord(parsed.data, {
      expectedSignerAddress: process.env.ORACLE_SIGNER_ADDRESS,
      requireSignature,
      nextSequenceNumber: store.nextOracleSequenceNumber()
    });

    if (record.verificationStatus !== "accepted") {
      return c.json(
        {
          oracleEvent: record,
          liveResolutionSubmitted: false
        },
        401
      );
    }

    store.appendOracleEvent(record);

    return c.json(
      {
        oracleEvent: record,
        liveResolutionSubmitted: false,
        note:
          "Oracle event recorded to the pilot ledger only; no live Hedera submission or EVM resolution was executed."
      },
      record.verificationStatus === "accepted" ? 202 : 401
    );
  });

  app.get("/api/readiness", async (c) => {
    const integrations = await getIntegrationReadiness();
    const requireSignedOracle = oracleSignatureRequired();
    return c.json({
      mode: "paper-only",
      pilotInfrastructureReady: true,
      adminAuthConfigured: adminAuthConfigured(),
      oracleSignerConfigured: Boolean(process.env.ORACLE_SIGNER_ADDRESS),
      liveMoneyMovementAllowed: false,
      liveOrderRoutingAllowed: false,
      liveFedExApiAllowed: false,
      liveOrderSigningAllowed: false,
      store: store.publicSnapshot(),
      securityPosture: {
        adminAuthMode: adminAuthMode(),
        oracleMode: process.env.ORACLE_SIGNER_ADDRESS
          ? "signed"
          : requireSignedOracle
            ? "locked"
            : "fixture-dev",
        adminRoutesFailClosed: adminAuthMode() !== "dev-open",
        oracleEventsRequireSignature: requireSignedOracle,
        publicLedgerRedacted: true,
        rejectedOrdersPersisted: false,
        rateLimitsEnabled: true,
        bodyLimitBytes: DEFAULT_JSON_BODY_LIMIT_BYTES,
        securityHeadersEnabled: true
      },
      integrations,
      blockers: [
        "Regulatory review required before any customer-facing event-contract flow.",
        "FedEx production tracking/oracle feed must be formally authorized and privacy-reviewed.",
        "Exchange listing and market-resolution rules must be approved before real markets exist.",
        "Employee, shipper, recipient, and operations-staff eligibility controls need written approval."
      ]
    });
  });

  app.get("/api/research", (c) =>
    c.json({
      references: getResearchReferences(),
      thesis:
        "Delivery Markets Lab turns shipment tracking milestones into paper event contracts with hub-arrival cutoff gates and oracle-backed resolution.",
      recommendedNextStep:
        "Keep the demo internal, connect a FedEx sandbox feed, then explore a regulated partner-exchange listing path rather than open public betting."
    })
  );

  app.get("/api/admin/audit", requireAdmin, (c) =>
    c.json({
      snapshot: store.snapshot(),
      latestOrders: store.listOrders(20),
      latestOracleEvents: store.listOracleEvents(20),
      liveMoneyMovementAllowed: false,
      liveOrderSigningAllowed: false
    })
  );

  app.post("/api/admin/simulate-resolution", requireAdmin, async (c) => {
    const parsed = await parseLimitedJson(c, trackingOnlySchema);
    if (!parsed.ok) {
      return c.json(parsed.payload, parsed.status);
    }
    const bundle = buildMarketBundle(parsed.data.trackingNumber);
    return c.json({
      message:
        bundle.settlement?.deliveredAt ??
        "Shipment has not reached a delivered fixture state; no market resolution applied.",
      bundle
    });
  });

  if (options.serveStatic ?? process.env.NODE_ENV === "production") {
    installStaticRoutes(app);
  }

  return app;
}
