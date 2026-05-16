import { Hono } from "hono";
import { cors } from "hono/cors";
import { buildMarketBundle, listDemoTrackingNumbers } from "../domain/deliveryMarkets";
import { createPaperOrder, orderRequestSchema } from "../domain/orders";
import { buildOracleEventRecord, signedOracleEventRequestSchema } from "../domain/oracle";
import { evaluateParticipantRisk, participantProfileSchema } from "../domain/risk";
import { getIntegrationReadiness, getResearchReferences } from "../adapters/readiness";
import { adminAuthConfigured, requireAdmin } from "./auth";
import { createPilotStore, type PilotStore } from "./store";
import { installStaticRoutes } from "./static";

export function createApp(options: { store?: PilotStore; serveStatic?: boolean } = {}) {
  const app = new Hono();
  const store = options.store ?? createPilotStore();

  app.use("*", cors({ origin: ["http://127.0.0.1:5178", "http://localhost:5178"] }));

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
      store: store.snapshot(),
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
    const body = await c.req.json().catch(() => undefined);
    const parsed = orderRequestSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(
        {
          error: "Invalid paper order request",
          details: parsed.error.flatten()
        },
        400
      );
    }

    const bundle = buildMarketBundle(parsed.data.trackingNumber);
    const order = createPaperOrder(parsed.data, bundle);
    store.appendOrder(order);
    return c.json(
      { order, ledger: store.listOrders(12) },
      order.status === "ACCEPTED" ? 201 : 409
    );
  });

  app.get("/api/ledger", (c) => c.json({ orders: store.listOrders(50) }));

  app.post("/api/risk/evaluate", async (c) => {
    const body = await c.req.json().catch(() => undefined);
    const parsed = participantProfileSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: "Invalid participant profile", details: parsed.error.flatten() }, 400);
    }

    return c.json(evaluateParticipantRisk(parsed.data));
  });

  app.get("/api/oracle/events", (c) => c.json({ events: store.listOracleEvents(50) }));

  app.post("/api/oracle/events", requireAdmin, async (c) => {
    const body = await c.req.json().catch(() => undefined);
    const parsed = signedOracleEventRequestSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: "Invalid oracle event", details: parsed.error.flatten() }, 400);
    }

    const record = await buildOracleEventRecord(parsed.data, {
      expectedSignerAddress: process.env.ORACLE_SIGNER_ADDRESS,
      nextSequenceNumber: store.nextOracleSequenceNumber()
    });
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
    return c.json({
      mode: "paper-only",
      pilotInfrastructureReady: true,
      adminAuthConfigured: adminAuthConfigured(),
      oracleSignerConfigured: Boolean(process.env.ORACLE_SIGNER_ADDRESS),
      liveMoneyMovementAllowed: false,
      liveOrderRoutingAllowed: false,
      liveFedExApiAllowed: false,
      liveOrderSigningAllowed: false,
      store: store.snapshot(),
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
    const body = await c.req.json().catch(() => undefined);
    const parsed = orderRequestSchema.pick({ trackingNumber: true }).safeParse(body);
    if (!parsed.success) {
      return c.json({ error: "trackingNumber is required" }, 400);
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
