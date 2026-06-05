import { Hono } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";
import {
  buildPrivateMarketPreviews,
  getTestnetDeploymentPlan
} from "../adapters/privateMarketTestnet";
import { getPrivateVenueRoutes } from "../adapters/privateVenues";
import { buildMarketBundle, listDemoTrackingNumbers } from "../domain/deliveryMarkets";
import { getWalletReadiness } from "../domain/walletReadiness";
import {
  accessClaimRequestSchema,
  buildRecipientAccessPolicy,
  evaluateAccessClaim,
  isAccessGrantSecretValid,
  redactAccessGrant
} from "../domain/access";
import {
  ammQuoteRequestSchema,
  createPrivateAmmPaperOrder,
  quotePrivateAmm
} from "../domain/amm";
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
const privateOrderRequestSchema = ammQuoteRequestSchema.extend({
  accessGrantId: z.string().min(8),
  accessGrantSecret: z.string().min(8)
});
const testnetPreviewRequestSchema = privateOrderRequestSchema.extend({
  orderId: z.string().min(4).max(120).optional()
});
const LLMS_TXT = `# Delivery Markets

> Public AI-agent context for the Delivery Markets paper-demo surface.

Site: https://delivery-markets.sapphirealpha.xyz/
Canonical llms.txt: https://delivery-markets.sapphirealpha.xyz/llms.txt
Owner/operator: Sapphire
Primary audience: AI agents, answer engines, hackathon judges, logistics-market researchers, and operators.

## What This Site Is

Delivery Markets is a demo event-contract simulator for delivery-time uncertainty. It models private market, AMM, oracle, wallet-readiness, and access-grant flows around synthetic delivery tracking numbers.

The site is paper-only by default. It does not use real FedEx customer data, does not call live FedEx APIs, does not place real wagers, and does not move money.

## Key Public Routes

- Home: https://delivery-markets.sapphirealpha.xyz/
- Readiness: https://delivery-markets.sapphirealpha.xyz/api/readiness
- Demo tracking numbers: https://delivery-markets.sapphirealpha.xyz/api/demo-tracking-numbers
- Research references: https://delivery-markets.sapphirealpha.xyz/api/research
- Testnet deployment plan: https://delivery-markets.sapphirealpha.xyz/api/testnet/deployment-plan
- Health: https://delivery-markets.sapphirealpha.xyz/health
- Canonical organization surface: https://sapphirealpha.xyz/

## Product And Data Boundaries

- Tracking numbers in the public demo are synthetic fixtures.
- Orders are paper orders in an append-only demo store.
- Testnet previews are calldata or deployment-readiness artifacts, not live settlement.
- Admin audit routes require authentication.
- Venue, wallet, oracle, AMM, and private-market adapters are readiness/demo surfaces unless a reviewed testnet branch explicitly promotes them.

## How AI Agents Should Use This Site

- Preserve labels such as paper-only, simulated, synthetic, testnet preview, and no live money movement.
- Cite exact public API routes when summarizing readiness, research references, or demo tracking numbers.
- Do not describe this surface as FedEx-affiliated, real-money betting, production logistics settlement, or live customer tracking.
- Do not infer private delivery data, wallet keys, settlement authority, or admin audit contents from public routes.

## Safety Summary

No public Delivery Markets route authorizes real FedEx API access, real customer tracking, live order signing, wallet signing, real-money betting, settlement, private customer-data disclosure, or destructive admin action.

## Short Description

Delivery Markets is a paper-only logistics event-contract simulator for delivery-time uncertainty, using synthetic tracking fixtures and safety-labeled testnet/readiness flows.
`;

function buildHealthPayload(store: PilotStore) {
  return {
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
  };
}

export function createApp(options: { store?: PilotStore; serveStatic?: boolean } = {}) {
  const app = new Hono();
  const store = options.store ?? createPilotStore();

  app.use("*", securityHeaders());
  app.use("*", cors({ origin: ["http://127.0.0.1:5178", "http://localhost:5178"] }));
  app.use("/api/*", rateLimit({ windowMs: 60_000, max: 60 }));

  app.get("/health", (c) =>
    c.json(buildHealthPayload(store))
  );

  app.get("/healthz", (c) =>
    c.json(buildHealthPayload(store))
  );

  app.get("/healthz/", (c) =>
    c.json(buildHealthPayload(store))
  );

  app.get("/llms.txt", (c) =>
    c.text(LLMS_TXT, 200, { "cache-control": "public, max-age=3600" })
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

  app.get("/api/access/policy/:trackingNumber", (c) => {
    try {
      const bundle = buildMarketBundle(c.req.param("trackingNumber"));
      return c.json({ policy: buildRecipientAccessPolicy(c.req.param("trackingNumber"), bundle) });
    } catch (error) {
      return c.json(
        {
          error: error instanceof Error ? error.message : "Unknown access policy error",
          availableDemoTrackingNumbers: listDemoTrackingNumbers()
        },
        404
      );
    }
  });

  app.post("/api/access/claim", async (c) => {
    const parsed = await parseLimitedJson(c, accessClaimRequestSchema);
    if (!parsed.ok) {
      return c.json(parsed.payload, parsed.status);
    }

    const bundle = buildMarketBundle(parsed.data.trackingNumber);
    const claim = evaluateAccessClaim(parsed.data, bundle);
    store.appendAccessGrant(claim.grant);

    return c.json(
      { grant: redactAccessGrant(claim.grant), accessGrantSecret: claim.accessGrantSecret },
      claim.grant.status === "GRANTED" ? 201 : 403
    );
  });

  app.post("/api/amm/quote", async (c) => {
    const parsed = await parseLimitedJson(c, ammQuoteRequestSchema);
    if (!parsed.ok) {
      return c.json(parsed.payload, parsed.status);
    }

    const bundle = buildMarketBundle(parsed.data.trackingNumber);
    const market = bundle.markets.find((item) => item.id === parsed.data.marketId);
    if (!market) {
      return c.json({ error: "Market does not exist for this tracking number." }, 404);
    }

    return c.json({
      quote: quotePrivateAmm({
        market,
        side: parsed.data.side,
        contracts: parsed.data.contracts,
        existingOrders: store.listOrders(100)
      })
    });
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

  app.post("/api/private/orders", async (c) => {
    const parsed = await parseLimitedJson(c, privateOrderRequestSchema);
    if (!parsed.ok) {
      return c.json(parsed.payload, parsed.status);
    }

    const bundle = buildMarketBundle(parsed.data.trackingNumber);
    const market = bundle.markets.find((item) => item.id === parsed.data.marketId);
    if (!market) {
      return c.json({ error: "Market does not exist for this tracking number." }, 404);
    }
    if (market.status !== "OPEN") {
      return c.json({ error: `Market is ${market.status}; private AMM orders are locked.` }, 409);
    }

    const grant = store.findAccessGrant(parsed.data.accessGrantId);
    if (!grant || grant.status !== "GRANTED") {
      return c.json({ error: "Recipient access grant is required." }, 403);
    }
    if (!isAccessGrantSecretValid(grant, parsed.data.accessGrantSecret)) {
      return c.json({ error: "Recipient access grant secret is invalid." }, 403);
    }
    if (grant.trackingNumberHash !== market.trackingNumberHash) {
      return c.json({ error: "Recipient access grant does not match this package." }, 403);
    }
    if (new Date(grant.expiresAt).getTime() <= Date.now()) {
      return c.json({ error: "Recipient access grant has expired." }, 403);
    }

    const quote = quotePrivateAmm({
      market,
      side: parsed.data.side,
      contracts: parsed.data.contracts,
      existingOrders: store.listOrders(100)
    });
    const order = createPrivateAmmPaperOrder({
      quote,
      accountId: grant.walletAddress
    });
    store.appendOrder(order);

    return c.json(
      {
        order: toPublicOrder(order),
        quote,
        ledger: store.listPublicOrders(12),
        testnetPreviews: buildPrivateMarketPreviews({ market, grant, quote, orderId: order.id })
      },
      201
    );
  });

  app.post("/api/testnet/calldata", async (c) => {
    const parsed = await parseLimitedJson(c, testnetPreviewRequestSchema);
    if (!parsed.ok) {
      return c.json(parsed.payload, parsed.status);
    }

    const bundle = buildMarketBundle(parsed.data.trackingNumber);
    const market = bundle.markets.find((item) => item.id === parsed.data.marketId);
    const grant = store.findAccessGrant(parsed.data.accessGrantId);
    if (!market) return c.json({ error: "Market does not exist for this tracking number." }, 404);
    if (!grant || grant.status !== "GRANTED") {
      return c.json({ error: "Recipient access grant is required." }, 403);
    }
    if (!isAccessGrantSecretValid(grant, parsed.data.accessGrantSecret)) {
      return c.json({ error: "Recipient access grant secret is invalid." }, 403);
    }

    const quote = quotePrivateAmm({
      market,
      side: parsed.data.side,
      contracts: parsed.data.contracts,
      existingOrders: store.listOrders(100)
    });

    return c.json({
      quote,
      testnetPreviews: buildPrivateMarketPreviews({
        market,
        grant,
        quote,
        orderId: parsed.data.orderId
      })
    });
  });

  app.get("/api/testnet/deployment-plan", (c) =>
    c.json({ deploymentPlan: getTestnetDeploymentPlan() })
  );

  app.get("/api/wallet/readiness", async (c) =>
    c.json({ walletReadiness: await getWalletReadiness() })
  );

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
    const walletReadiness = await getWalletReadiness();
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
      walletReadiness,
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

  app.get("/api/venues/private-routes", (c) => c.json({ routes: getPrivateVenueRoutes() }));

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
