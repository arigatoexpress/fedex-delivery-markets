import type { IntegrationReadiness } from "../shared/types";

export async function getHederaReadiness(): Promise<IntegrationReadiness> {
  const sdkLoaded = await canLoad("@hashgraph/sdk");
  const hasTestnetEnv = Boolean(
    process.env.HEDERA_OPERATOR_ID &&
      process.env.HEDERA_OPERATOR_KEY &&
      process.env.HEDERA_TOPIC_ID
  );

  return {
    id: "hedera-hcs",
    label: "Hedera Consensus Service",
    mode: hasTestnetEnv ? "testnet-ready" : "paper",
    ready: sdkLoaded,
    packageName: "@hashgraph/sdk",
    network: "Hedera testnet HCS topic anchoring",
    requiredEnv: ["HEDERA_OPERATOR_ID", "HEDERA_OPERATOR_KEY", "HEDERA_TOPIC_ID"],
    notes: [
      hasTestnetEnv
        ? "Environment is present for testnet anchoring, but live submission remains disabled by demo policy."
        : "SDK is installed; fixture events are anchored with deterministic HCS-style hashes.",
      "A production design should publish only hashed tracking identifiers and public event metadata.",
      "Mirror node timestamps and sequence numbers are modeled in the API response."
    ],
    sourceUrl: "https://docs.hedera.com/hedera/tutorials/consensus/submit-your-first-message"
  };
}

async function canLoad(packageName: string): Promise<boolean> {
  try {
    await import(packageName);
    return true;
  } catch {
    return false;
  }
}
