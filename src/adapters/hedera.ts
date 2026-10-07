import type { IntegrationReadiness } from "../shared/types";

export async function getHederaReadiness(): Promise<IntegrationReadiness> {
  return {
    id: "hedera-hcs",
    label: "Hedera Consensus Service",
    mode: "paper",
    ready: false,
    network: "Deterministic HCS-style fixture modeling; no network client installed",
    notes: [
      "The Hedera SDK is not installed; fixture events use deterministic HCS-style hashes in paper mode.",
      "Supplying Hedera credentials does not enable testnet submission.",
      "A production design should publish only hashed tracking identifiers and public event metadata.",
      "Mirror node timestamps and sequence numbers are modeled in the API response."
    ],
    sourceUrl: "https://docs.hedera.com/hedera/tutorials/consensus/submit-your-first-message"
  };
}
