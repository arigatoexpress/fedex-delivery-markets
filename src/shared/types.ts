export type ShipmentStatus =
  | "LABEL_CREATED"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "HUB_ARRIVAL"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED";

export type MarketStatus = "OPEN" | "CUTOFF_LOCKED" | "RESOLVED";

export type MarketKind = "DELIVERY_DAY" | "DELIVERY_WINDOW" | "BEFORE_TIME";

export type OrderSide = "YES" | "NO";

export interface TrackingEvent {
  code: ShipmentStatus;
  label: string;
  facility: string;
  city: string;
  state: string;
  timestamp: string;
  publicDetail: string;
}

export interface Shipment {
  trackingNumber: string;
  service: string;
  origin: string;
  destination: string;
  promisedDate: string;
  etaWindowStart: string;
  etaWindowEnd: string;
  projectedHubArrivalAt: string;
  actualDeliveryAt?: string;
  status: ShipmentStatus;
  confidence: number;
  events: TrackingEvent[];
}

export interface OracleAnchor {
  id: string;
  network: "HEDERA_HCS_SIM" | "HEDERA_HCS_TESTNET" | "ROBINHOOD_CHAIN_TESTNET";
  topicId?: string;
  consensusTimestamp: string;
  sequenceNumber: number;
  payloadHash: string;
  sourceEventCode: ShipmentStatus;
  sourceEventLabel: string;
  trackingNumberHash: string;
}

export interface DeliveryMarket {
  id: string;
  trackingNumberHash: string;
  question: string;
  kind: MarketKind;
  status: MarketStatus;
  yesPrice: number;
  noPrice: number;
  cutoffAt: string;
  cutoffReason: string;
  resolutionSource: string;
  outcome?: OrderSide;
  settlesAgainst?: string;
}

export interface DeliveryMarketBundle {
  shipment: Shipment;
  markets: DeliveryMarket[];
  oracleAnchors: OracleAnchor[];
  cutoff: {
    status: MarketStatus;
    cutoffAt: string;
    reason: string;
    triggeredBy?: TrackingEvent;
  };
  settlement?: {
    deliveredAt: string;
    resolvedMarketIds: string[];
  };
}

export interface PaperOrder {
  id: string;
  marketId: string;
  trackingNumberHash: string;
  accountId: string;
  side: OrderSide;
  contracts: number;
  limitPrice: number;
  notionalUsd: number;
  status: "ACCEPTED" | "BLOCKED";
  reason: string;
  riskChecks: RiskCheck[];
  environment: "paper";
  createdAt: string;
}

export type ParticipantRole =
  | "recipient"
  | "shipper"
  | "third_party"
  | "fedex_employee"
  | "driver_or_station_operator"
  | "market_maker"
  | "admin";

export interface ParticipantProfile {
  accountId: string;
  role: ParticipantRole;
  jurisdiction: string;
  relationToShipment: "none" | "shipper" | "recipient" | "operations" | "unknown";
  employeeOrContractor: boolean;
}

export interface RiskCheck {
  id: string;
  status: "pass" | "warn" | "block";
  label: string;
  detail: string;
}

export interface RiskDecision {
  eligibleForPaper: boolean;
  eligibleForRealMoneyPilot: boolean;
  checks: RiskCheck[];
}

export interface OracleEventPayload {
  trackingNumberHash: string;
  eventCode: ShipmentStatus;
  occurredAt: string;
  facility: string;
  city: string;
  state: string;
  eventSource: "fedex_fixture" | "fedex_sandbox" | "fedex_authorized_feed";
  previousAnchorHash?: string;
}

export interface OracleEventRecord {
  id: string;
  event: OracleEventPayload;
  eventHash: string;
  verificationMode: "fixture" | "signed";
  verificationStatus: "accepted" | "rejected";
  signerAddress?: string;
  expectedSignerAddress?: string;
  hcsTopicId: string;
  hcsSequenceNumber: number;
  hcsConsensusTimestamp: string;
  createdAt: string;
  rejectionReason?: string;
}

export interface StoreSnapshot {
  orderCount: number;
  oracleEventCount: number;
  lastOrderId?: string;
  lastOracleEventHash?: string;
  dataDir: string;
}

export interface IntegrationReadiness {
  id: string;
  label: string;
  mode: "paper" | "read-only" | "testnet-ready" | "blocked";
  ready: boolean;
  packageName?: string;
  network?: string;
  requiredEnv?: string[];
  notes: string[];
  sourceUrl: string;
}

export interface ResearchReference {
  id: string;
  label: string;
  takeaway: string;
  url: string;
}
