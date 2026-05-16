import { z } from "zod";
import { sha256 } from "./hash";
import { evaluateParticipantRisk } from "./risk";
import type { DeliveryMarketBundle, PaperOrder, ParticipantProfile } from "../shared/types";

export const orderRequestSchema = z.object({
  trackingNumber: z.string().min(8),
  marketId: z.string().min(8),
  side: z.enum(["YES", "NO"]),
  contracts: z.number().int().min(1).max(100),
  accountId: z.string().min(3).max(80).default("demo-customer"),
  participant: z
    .object({
      role: z
        .enum([
          "recipient",
          "shipper",
          "third_party",
          "fedex_employee",
          "driver_or_station_operator",
          "market_maker",
          "admin"
        ])
        .default("recipient"),
      jurisdiction: z.string().min(2).max(40).default("US-CO"),
      relationToShipment: z
        .enum(["none", "shipper", "recipient", "operations", "unknown"])
        .default("recipient"),
      employeeOrContractor: z.boolean().default(false)
    })
    .optional()
});

export type OrderRequest = z.infer<typeof orderRequestSchema>;

export function createPaperOrder(
  request: OrderRequest,
  bundle: DeliveryMarketBundle,
  now = new Date()
): PaperOrder {
  const market = bundle.markets.find((item) => item.id === request.marketId);
  const participant = normalizeParticipant(request);
  const riskDecision = evaluateParticipantRisk(participant);

  if (!market) {
    return blockedOrder(
      request,
      "Market does not exist for this tracking number.",
      now,
      riskDecision.checks
    );
  }

  if (market.status !== "OPEN") {
    return blockedOrder(
      request,
      `Market is ${market.status}; cutoff and settlement gates block new orders.`,
      now,
      riskDecision.checks,
      request.side === "YES" ? market.yesPrice : market.noPrice
    );
  }

  const limitPrice = request.side === "YES" ? market.yesPrice : market.noPrice;
  const notionalUsd = Math.round(request.contracts * limitPrice * 100) / 100;

  return {
    id: `paper-${now.getTime().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    marketId: request.marketId,
    trackingNumberHash: sha256(request.trackingNumber.replace(/\D/g, "")),
    accountId: participant.accountId,
    side: request.side,
    contracts: request.contracts,
    limitPrice,
    notionalUsd,
    status: "ACCEPTED",
    reason:
      "Paper order accepted. No wallet signature, exchange route, customer funds, or real-money settlement occurred.",
    riskChecks: riskDecision.checks,
    environment: "paper",
    createdAt: now.toISOString()
  };
}

function blockedOrder(
  request: OrderRequest,
  reason: string,
  now: Date,
  riskChecks = evaluateParticipantRisk(normalizeParticipant(request)).checks,
  limitPrice = 0
): PaperOrder {
  return {
    id: `blocked-${now.getTime().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    marketId: request.marketId,
    trackingNumberHash: sha256(request.trackingNumber.replace(/\D/g, "")),
    accountId: normalizeParticipant(request).accountId,
    side: request.side,
    contracts: request.contracts,
    limitPrice,
    notionalUsd: 0,
    status: "BLOCKED",
    reason,
    riskChecks,
    environment: "paper",
    createdAt: now.toISOString()
  };
}

function normalizeParticipant(request: OrderRequest): ParticipantProfile {
  return {
    accountId: request.accountId,
    role: request.participant?.role ?? "recipient",
    jurisdiction: request.participant?.jurisdiction ?? "US-CO",
    relationToShipment: request.participant?.relationToShipment ?? "recipient",
    employeeOrContractor: request.participant?.employeeOrContractor ?? false
  };
}
