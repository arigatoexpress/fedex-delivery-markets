import { demoShipments, findDemoShipment } from "../data/demoShipments";
import type {
  DeliveryMarket,
  DeliveryMarketBundle,
  MarketStatus,
  OracleAnchor,
  Shipment,
  TrackingEvent
} from "../shared/types";
import { sha256, shortHash } from "./hash";

export const DEMO_MARKET_AS_OF = new Date("2026-05-16T20:00:00.000Z");

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric"
});

const TIME_FORMAT = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  timeZoneName: "short"
});

export function listDemoTrackingNumbers(): string[] {
  return demoShipments.map((shipment) => shipment.trackingNumber);
}

export function getShipmentOrThrow(trackingNumber: string): Shipment {
  const shipment = findDemoShipment(trackingNumber);
  if (!shipment) {
    throw new Error("Unknown demo tracking number");
  }
  return shipment;
}

export function buildMarketBundle(
  trackingNumber: string,
  asOf = DEMO_MARKET_AS_OF
): DeliveryMarketBundle {
  const shipment = getShipmentOrThrow(trackingNumber);
  const cutoff = getCutoff(shipment, asOf);
  const oracleAnchors = buildOracleAnchors(shipment);
  const markets = buildMarkets(shipment, cutoff.status, asOf);
  const resolvedMarketIds = markets
    .filter((market) => market.status === "RESOLVED")
    .map((market) => market.id);

  return {
    shipment,
    markets,
    oracleAnchors,
    cutoff,
    settlement: shipment.actualDeliveryAt
      ? {
          deliveredAt: shipment.actualDeliveryAt,
          resolvedMarketIds
        }
      : undefined
  };
}

export function getCutoff(
  shipment: Shipment,
  asOf = DEMO_MARKET_AS_OF
): DeliveryMarketBundle["cutoff"] {
  const hubEvent = shipment.events.find((event) => event.code === "HUB_ARRIVAL");
  const cutoffAt = hubEvent?.timestamp ?? shipment.projectedHubArrivalAt;
  const cutoffTime = new Date(cutoffAt).getTime();
  const status: MarketStatus = shipment.actualDeliveryAt
    ? "RESOLVED"
    : hubEvent || asOf.getTime() >= cutoffTime
      ? "CUTOFF_LOCKED"
      : "OPEN";

  return {
    status,
    cutoffAt,
    triggeredBy: hubEvent,
    reason: hubEvent
      ? "Hub arrival event is already anchored; trading is locked."
      : "Trading remains open until the package reaches the first hub or the projected hub cutoff passes."
  };
}

export function buildMarkets(
  shipment: Shipment,
  status: MarketStatus,
  asOf = DEMO_MARKET_AS_OF
): DeliveryMarket[] {
  const trackingNumberHash = sha256(shipment.trackingNumber);
  const etaStart = new Date(shipment.etaWindowStart);
  const etaEnd = new Date(shipment.etaWindowEnd);
  const promisedDate = new Date(`${shipment.promisedDate}T12:00:00`);
  const dayBefore = addDays(promisedDate, -1);
  const dayAfter = addDays(promisedDate, 1);
  const deliveredAt = shipment.actualDeliveryAt
    ? new Date(shipment.actualDeliveryAt)
    : undefined;

  const dayProbabilities = [
    { date: dayBefore, probability: 0.14 },
    { date: promisedDate, probability: clamp(shipment.confidence, 0.5, 0.86) },
    { date: dayAfter, probability: 0.12 }
  ];

  const dayMarkets = dayProbabilities.map(({ date, probability }) => {
    const dayLabel = DATE_FORMAT.format(date);
    const outcome = deliveredAt
      ? sameLocalDate(deliveredAt, date)
        ? "YES"
        : "NO"
      : undefined;
    return makeMarket({
      shipment,
      status,
      id: `day-${toDateKey(date)}`,
      question: `Will this package be delivered on ${dayLabel}?`,
      probability,
      kind: "DELIVERY_DAY",
      outcome,
      settlesAgainst: deliveredAt?.toISOString()
    });
  });

  const windowLabel = `${TIME_FORMAT.format(etaStart)} - ${TIME_FORMAT.format(etaEnd)}`;
  const windowOutcome = deliveredAt
    ? deliveredAt >= etaStart && deliveredAt <= etaEnd
      ? "YES"
      : "NO"
    : undefined;
  const windowMarket = makeMarket({
    shipment,
    status,
    id: "eta-window",
    question: `Will it arrive inside the current ETA window (${windowLabel})?`,
    probability: clamp(shipment.confidence - 0.08, 0.42, 0.8),
    kind: "DELIVERY_WINDOW",
    outcome: windowOutcome,
    settlesAgainst: deliveredAt?.toISOString()
  });

  const beforeNoon = setLocalHour(etaStart, 12);
  const beforeNoonOutcome = deliveredAt
    ? deliveredAt.getTime() < beforeNoon.getTime()
      ? "YES"
      : "NO"
    : undefined;
  const beforeMarket = makeMarket({
    shipment,
    status,
    id: "before-noon",
    question: "Will it arrive before noon local destination time?",
    probability: deriveBeforeProbability(etaStart, etaEnd, asOf),
    kind: "BEFORE_TIME",
    outcome: beforeNoonOutcome,
    settlesAgainst: deliveredAt?.toISOString()
  });

  return [...dayMarkets, windowMarket, beforeMarket];
}

function makeMarket(input: {
  shipment: Shipment;
  status: MarketStatus;
  id: string;
  question: string;
  probability: number;
  kind: DeliveryMarket["kind"];
  outcome?: "YES" | "NO";
  settlesAgainst?: string;
}): DeliveryMarket {
  const yesPrice = Math.round(clamp(input.probability, 0.03, 0.97) * 100) / 100;
  const status = input.outcome ? "RESOLVED" : input.status;
  return {
    id: `${shortHash(input.shipment.trackingNumber)}-${input.id}`,
    trackingNumberHash: sha256(input.shipment.trackingNumber),
    question: input.question,
    kind: input.kind,
    status,
    yesPrice,
    noPrice: Math.round((1 - yesPrice) * 100) / 100,
    cutoffAt:
      input.shipment.events.find((event) => event.code === "HUB_ARRIVAL")?.timestamp ??
      input.shipment.projectedHubArrivalAt,
    cutoffReason:
      "Cutoff is triggered by first hub arrival or the projected hub arrival deadline, whichever is authoritative first.",
    resolutionSource:
      "FedEx tracking event stream fixture -> Hedera HCS-style anchor -> EVM resolver",
    outcome: input.outcome,
    settlesAgainst: input.settlesAgainst
  };
}

function buildOracleAnchors(shipment: Shipment): OracleAnchor[] {
  return shipment.events.map((event, index) => ({
    id: `hcs-${shortHash(`${shipment.trackingNumber}:${event.timestamp}:${event.code}`)}`,
    network: "HEDERA_HCS_SIM",
    topicId: "0.0.demo-fedex-delivery-markets",
    consensusTimestamp: event.timestamp,
    sequenceNumber: index + 1,
    payloadHash: sha256(JSON.stringify(toPublicOraclePayload(shipment, event))),
    sourceEventCode: event.code,
    sourceEventLabel: event.label,
    trackingNumberHash: sha256(shipment.trackingNumber)
  }));
}

function toPublicOraclePayload(shipment: Shipment, event: TrackingEvent) {
  return {
    trackingNumberHash: sha256(shipment.trackingNumber),
    code: event.code,
    timestamp: event.timestamp,
    facility: event.facility,
    city: event.city,
    state: event.state
  };
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function deriveBeforeProbability(start: Date, end: Date, asOf: Date): number {
  const noon = setLocalHour(start, 12);
  if (end.getTime() <= noon.getTime()) return 0.72;
  if (start.getTime() >= noon.getTime()) return 0.26;
  const total = end.getTime() - start.getTime();
  const before = noon.getTime() - start.getTime();
  const recencyNudge = asOf.getUTCHours() % 2 === 0 ? 0.02 : -0.02;
  return clamp(before / total + recencyNudge, 0.18, 0.82);
}

function sameLocalDate(a: Date, b: Date): boolean {
  return toDateKey(a) === toDateKey(b);
}

function setLocalHour(date: Date, hour: number): Date {
  const copy = new Date(date);
  copy.setHours(hour, 0, 0, 0);
  return copy;
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}
