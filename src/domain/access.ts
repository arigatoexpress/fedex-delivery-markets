import { randomBytes } from "node:crypto";
import { z } from "zod";
import { findRecipientAccessFixture } from "../data/recipientAccess";
import type {
  DeliveryMarketBundle,
  RecipientAccessGrant,
  RecipientAccessPolicy
} from "../shared/types";
import { getCutoff, getShipmentOrThrow } from "./deliveryMarkets";
import { sha256, shortHash } from "./hash";

export const walletAddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/);

export const accessClaimRequestSchema = z.object({
  trackingNumber: z.string().min(8),
  walletAddress: walletAddressSchema,
  claimCode: z.string().min(6).max(80)
});

export type AccessClaimRequest = z.infer<typeof accessClaimRequestSchema>;
export type AccessClaimResult = {
  grant: RecipientAccessGrant;
  accessGrantSecret?: string;
};

export function buildRecipientAccessPolicy(
  trackingNumber: string,
  bundle?: DeliveryMarketBundle
): RecipientAccessPolicy {
  const shipment = bundle?.shipment ?? getShipmentOrThrow(trackingNumber);
  const fixture = findRecipientAccessFixture(trackingNumber);
  const cutoff = bundle?.cutoff ?? getCutoff(shipment);

  return {
    trackingNumberHash: sha256(shipment.trackingNumber),
    packageAlias: fixture?.packageAlias ?? `${shipment.origin} to ${shipment.destination}`,
    recipientScope: "recipient_only",
    eligibleRelation: "recipient",
    allowedWallets: fixture?.allowedWallets ?? [],
    claimCodeRequired: true,
    demoClaimCode: fixture?.demoClaimCode,
    cutoffAt: cutoff.cutoffAt,
    status:
      cutoff.status === "RESOLVED"
        ? "RESOLVED"
        : cutoff.status === "CUTOFF_LOCKED"
          ? "LOCKED"
          : "CLAIMABLE"
  };
}

export function evaluateAccessClaim(
  request: AccessClaimRequest,
  bundle: DeliveryMarketBundle,
  now = new Date()
): AccessClaimResult {
  const fixture = findRecipientAccessFixture(request.trackingNumber);
  const trackingNumberHash = sha256(bundle.shipment.trackingNumber);
  const walletAddress = request.walletAddress.toLowerCase();
  const cutoffTime = new Date(bundle.cutoff.cutoffAt).getTime();
  const grantTtlMs = 24 * 60 * 60 * 1000;
  const expiresAt =
    bundle.cutoff.status === "OPEN"
      ? new Date(Math.max(cutoffTime, now.getTime() + grantTtlMs))
      : new Date(cutoffTime);

  if (!fixture) {
    return deniedGrant({
      trackingNumberHash,
      walletAddress,
      reason: "No recipient access fixture exists for this package.",
      expiresAt,
      now
    });
  }

  if (bundle.cutoff.status !== "OPEN") {
    return deniedGrant({
      trackingNumberHash,
      walletAddress,
      reason: `Recipient market is ${bundle.cutoff.status}; new private access grants are locked.`,
      expiresAt,
      now
    });
  }

  const allowedWallets = fixture.allowedWallets.map((address) => address.toLowerCase());
  if (!allowedWallets.includes(walletAddress)) {
    return deniedGrant({
      trackingNumberHash,
      walletAddress,
      reason: "Wallet is not the recorded recipient wallet for this demo package.",
      expiresAt,
      now
    });
  }

  if (sha256(request.claimCode.trim()) !== fixture.claimCodeHash) {
    return deniedGrant({
      trackingNumberHash,
      walletAddress,
      reason: "Claim code did not match the package recipient record.",
      expiresAt,
      now
    });
  }

  const accessGrantSecret = `ag_${randomBytes(24).toString("hex")}`;
  const grant: RecipientAccessGrant = {
    id: `grant-${shortHash(`${trackingNumberHash}:${walletAddress}:${now.toISOString()}`)}`,
    trackingNumberHash,
    walletAddress,
    relationToShipment: "recipient",
    status: "GRANTED",
    reason: "Recipient-only access granted for the private market simulation.",
    capabilities: [
      "VIEW_PRIVATE_MARKET",
      "QUOTE_PRIVATE_AMM",
      "SUBMIT_PRIVATE_ORDER",
      "PREVIEW_TESTNET_CALLDATA"
    ],
    grantSecretHash: sha256(accessGrantSecret),
    expiresAt: expiresAt.toISOString(),
    createdAt: now.toISOString()
  };

  return { grant, accessGrantSecret };
}

export function isAccessGrantSecretValid(
  grant: RecipientAccessGrant,
  accessGrantSecret: string
): boolean {
  return Boolean(grant.grantSecretHash) && sha256(accessGrantSecret) === grant.grantSecretHash;
}

export function redactAccessGrant(grant: RecipientAccessGrant): RecipientAccessGrant {
  const { grantSecretHash: _grantSecretHash, ...redacted } = grant;
  return redacted;
}

function deniedGrant(input: {
  trackingNumberHash: string;
  walletAddress: string;
  reason: string;
  expiresAt: Date;
  now: Date;
}): AccessClaimResult {
  const grant: RecipientAccessGrant = {
    id: `denied-${shortHash(`${input.trackingNumberHash}:${input.walletAddress}:${input.now.toISOString()}`)}`,
    trackingNumberHash: input.trackingNumberHash,
    walletAddress: input.walletAddress,
    relationToShipment: "recipient",
    status: "DENIED",
    reason: input.reason,
    capabilities: [],
    expiresAt: input.expiresAt.toISOString(),
    createdAt: input.now.toISOString()
  };
  return { grant };
}
