import { sha256 } from "../domain/hash";

export type RecipientAccessFixture = {
  trackingNumber: string;
  packageAlias: string;
  allowedWallets: string[];
  claimCodeHash: string;
  demoClaimCode: string;
};

export const demoRecipientAccess: RecipientAccessFixture[] = [
  {
    trackingNumber: "771234567890",
    packageAlias: "Austin -> Denver Priority Overnight",
    allowedWallets: ["0x1111111111111111111111111111111111111111"],
    claimCodeHash: sha256("AUSTIN-DENVER-RECIPIENT"),
    demoClaimCode: "AUSTIN-DENVER-RECIPIENT"
  },
  {
    trackingNumber: "882345678901",
    packageAlias: "Raleigh -> Phoenix FedEx 2Day",
    allowedWallets: ["0x2222222222222222222222222222222222222222"],
    claimCodeHash: sha256("RALEIGH-PHOENIX-RECIPIENT"),
    demoClaimCode: "RALEIGH-PHOENIX-RECIPIENT"
  },
  {
    trackingNumber: "993456789012",
    packageAlias: "Seattle -> Boulder Ground",
    allowedWallets: ["0x3333333333333333333333333333333333333333"],
    claimCodeHash: sha256("SEATTLE-BOULDER-RECIPIENT"),
    demoClaimCode: "SEATTLE-BOULDER-RECIPIENT"
  }
];

export function findRecipientAccessFixture(
  trackingNumber: string
): RecipientAccessFixture | undefined {
  const normalized = trackingNumber.replace(/\D/g, "");
  return demoRecipientAccess.find((fixture) => fixture.trackingNumber === normalized);
}
