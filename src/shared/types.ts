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

export type AccessGrantCapability =
  | "VIEW_PRIVATE_MARKET"
  | "QUOTE_PRIVATE_AMM"
  | "SUBMIT_PRIVATE_ORDER"
  | "PREVIEW_TESTNET_CALLDATA";

export interface RecipientAccessPolicy {
  trackingNumberHash: string;
  packageAlias: string;
  recipientScope: "recipient_only";
  eligibleRelation: "recipient";
  allowedWallets: string[];
  claimCodeRequired: boolean;
  demoClaimCode?: string;
  cutoffAt: string;
  status: "CLAIMABLE" | "LOCKED" | "RESOLVED";
}

export interface RecipientAccessGrant {
  id: string;
  trackingNumberHash: string;
  walletAddress: string;
  relationToShipment: "recipient";
  status: "GRANTED" | "DENIED";
  reason: string;
  capabilities: AccessGrantCapability[];
  grantSecretHash?: string;
  expiresAt: string;
  createdAt: string;
}

export interface PublicPaperOrder {
  id: string;
  marketId: string;
  side: OrderSide;
  contracts: number;
  limitPrice: number;
  notionalUsd: number;
  status: "ACCEPTED" | "BLOCKED";
  reason: string;
  environment: "paper";
  createdAt: string;
}

export interface PrivateMarketQuote {
  marketId: string;
  trackingNumberHash: string;
  side: OrderSide;
  contracts: number;
  spotPrice: number;
  averagePrice: number;
  limitPrice: number;
  grossCostUsd: number;
  spreadUsd: number;
  totalCostUsd: number;
  beforeProbability: number;
  afterProbability: number;
  slippageBps: number;
  thetaDecayBps: number;
  inventorySkewBps: number;
  liquidityParameter: number;
  maxContracts: number;
  counterparty: "private-amm-bot";
  cutoffAt: string;
  generatedAt: string;
  explanation: string;
}

export interface VenueRoute {
  id: string;
  label: string;
  mode: "testnet-calldata" | "partner-required" | "read-only" | "blocked";
  available: boolean;
  network?: string;
  summary: string;
  constraints: string[];
  sourceUrl: string;
}

export interface TestnetTransactionPreview {
  id: string;
  chainId: number;
  chainName: string;
  to: string;
  functionName: string;
  calldata: string;
  walletRequest: {
    to: string;
    data: string;
    value: "0x0";
    chainId: string;
  };
  requiresWalletSignature: boolean;
  broadcastEnabled: boolean;
  explorerUrl: string;
  warnings: string[];
}

export interface TestnetDeploymentPlan {
  chainId: number;
  chainName: string;
  targetContract: "PrivateDeliveryMarket";
  contractAddress?: string;
  contractAddressConfigured: boolean;
  artifactCommand: string;
  deployCommand: string;
  requiredEnv: string[];
  apiBroadcastEnabled: false;
  walletBroadcastEnabled: false;
  notes: string[];
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
  accessGrantCount: number;
  lastOrderId?: string;
  lastOracleEventHash?: string;
  dataDir: string;
  maxRecords: number;
}

export interface SecurityPosture {
  adminAuthMode: "token" | "locked" | "dev-open";
  oracleMode: "signed" | "locked" | "fixture-dev";
  adminRoutesFailClosed: boolean;
  oracleEventsRequireSignature: boolean;
  publicLedgerRedacted: boolean;
  rejectedOrdersPersisted: boolean;
  rateLimitsEnabled: boolean;
  bodyLimitBytes: number;
  securityHeadersEnabled: boolean;
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
