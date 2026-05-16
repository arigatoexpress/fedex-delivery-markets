import { z } from "zod";
import { verifyTypedData, type Address, type Hex } from "viem";
import { ROBINHOOD_CHAIN_TESTNET } from "../shared/constants";
import type { OracleEventPayload, OracleEventRecord } from "../shared/types";
import { sha256, shortHash } from "./hash";

export const oracleEventPayloadSchema = z.object({
  trackingNumberHash: z.string().startsWith("sha256:"),
  eventCode: z.enum([
    "LABEL_CREATED",
    "PICKED_UP",
    "IN_TRANSIT",
    "HUB_ARRIVAL",
    "OUT_FOR_DELIVERY",
    "DELIVERED"
  ]),
  occurredAt: z.string().datetime({ offset: true }),
  facility: z.string().min(2).max(120),
  city: z.string().min(2).max(80),
  state: z.string().min(2).max(40),
  eventSource: z.enum(["fedex_fixture", "fedex_sandbox", "fedex_authorized_feed"]),
  previousAnchorHash: z.string().startsWith("sha256:").optional()
});

export const signedOracleEventRequestSchema = z.object({
  event: oracleEventPayloadSchema,
  signerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  signature: z.string().regex(/^0x[a-fA-F0-9]+$/).optional()
});

export type SignedOracleEventRequest = z.infer<typeof signedOracleEventRequestSchema>;

export const oracleTypedDataDomain = {
  name: "DeliveryMarketsOracle",
  version: "1",
  chainId: ROBINHOOD_CHAIN_TESTNET.chainId
} as const;

export const oracleTypedDataTypes = {
  TrackingOracleEvent: [
    { name: "trackingNumberHash", type: "string" },
    { name: "eventCode", type: "string" },
    { name: "occurredAt", type: "string" },
    { name: "facility", type: "string" },
    { name: "city", type: "string" },
    { name: "state", type: "string" },
    { name: "eventSource", type: "string" },
    { name: "previousAnchorHash", type: "string" }
  ]
} as const;

export async function buildOracleEventRecord(
  request: SignedOracleEventRequest,
  options: {
    expectedSignerAddress?: string;
    nextSequenceNumber: number;
    now?: Date;
  }
): Promise<OracleEventRecord> {
  const now = options.now ?? new Date();
  const event = normalizeEvent(request.event);
  const eventHash = sha256(JSON.stringify(event));
  const expectedSignerAddress = options.expectedSignerAddress;
  const needsSignature = Boolean(expectedSignerAddress);
  const signatureValid = needsSignature
    ? await verifyOracleSignature(request, expectedSignerAddress as Address)
    : false;
  const accepted = !needsSignature || signatureValid;

  return {
    id: `oracle-${shortHash(`${eventHash}:${options.nextSequenceNumber}`)}`,
    event,
    eventHash,
    verificationMode: needsSignature ? "signed" : "fixture",
    verificationStatus: accepted ? "accepted" : "rejected",
    signerAddress: request.signerAddress,
    expectedSignerAddress,
    hcsTopicId: "0.0.demo-fedex-delivery-markets",
    hcsSequenceNumber: options.nextSequenceNumber,
    hcsConsensusTimestamp: now.toISOString(),
    createdAt: now.toISOString(),
    rejectionReason: accepted
      ? undefined
      : "Signature did not match configured oracle signer address."
  };
}

export function normalizeEvent(event: OracleEventPayload): OracleEventPayload & {
  previousAnchorHash: string;
} {
  return {
    ...event,
    previousAnchorHash: event.previousAnchorHash ?? "sha256:genesis"
  };
}

export async function verifyOracleSignature(
  request: SignedOracleEventRequest,
  expectedSignerAddress: Address
): Promise<boolean> {
  if (!request.signature || !request.signerAddress) return false;
  if (request.signerAddress.toLowerCase() !== expectedSignerAddress.toLowerCase()) return false;

  return verifyTypedData({
    address: expectedSignerAddress,
    domain: oracleTypedDataDomain,
    types: oracleTypedDataTypes,
    primaryType: "TrackingOracleEvent",
    message: normalizeEvent(request.event),
    signature: request.signature as Hex
  });
}
