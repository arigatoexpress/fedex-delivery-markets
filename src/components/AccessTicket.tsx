import { LockKeyhole } from "lucide-react";
import type { RecipientAccessGrant } from "../shared/types";

interface AccessTicketProps {
  walletAddress: string;
  claimCode: string;
  accessGranted: boolean;
  accessGrant: RecipientAccessGrant | null;
  onWalletChange: (address: string) => void;
  onClaimCodeChange: (code: string) => void;
  onConnectWallet: () => void;
  onClaimAccess: () => void;
  idSuffix?: string;
  extraClass?: string;
}

export function AccessTicket({
  walletAddress,
  claimCode,
  accessGranted,
  accessGrant,
  onWalletChange,
  onClaimCodeChange,
  onConnectWallet,
  onClaimAccess,
  idSuffix = "",
  extraClass = ""
}: AccessTicketProps) {
  return (
    <section className={`order-ticket recipient-ticket ${extraClass}`}>
      <div className="section-heading">
        <h3>Package Check</h3>
        <LockKeyhole size={18} />
      </div>
      <label className="field-label" htmlFor={`wallet-address-${idSuffix}`}>
        Demo recipient wallet
      </label>
      <input
        id={`wallet-address-${idSuffix}`}
        onChange={(event) => onWalletChange(event.target.value)}
        value={walletAddress}
      />
      <label className="field-label" htmlFor={`claim-code-${idSuffix}`}>
        Demo claim code
      </label>
      <input
        id={`claim-code-${idSuffix}`}
        onChange={(event) => onClaimCodeChange(event.target.value)}
        value={claimCode}
      />
      <div className="dual-action">
        <button onClick={() => onConnectWallet()} type="button">
          MetaMask
        </button>
        <button onClick={() => onClaimAccess()} type="button">
          Verify
        </button>
      </div>
      <div className={`grant-status ${accessGranted ? "granted" : "pending"}`}>
        <strong>{accessGranted ? "Ready to bet" : "Auto-filled for demo"}</strong>
        <span>{accessGrant?.reason ?? "Only the package recipient can place the real version of this bet."}</span>
      </div>
    </section>
  );
}
