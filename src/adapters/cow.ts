import type { IntegrationReadiness } from "../shared/types";

export async function getCowReadiness(): Promise<IntegrationReadiness> {
  const sdkLoaded = await canLoad("@cowprotocol/cow-sdk");
  return {
    id: "cow-protocol",
    label: "CoW Protocol SDK",
    mode: "read-only",
    ready: sdkLoaded,
    packageName: "@cowprotocol/cow-sdk",
    network: "Ethereum and supported EVM networks",
    requiredEnv: ["COW_PROTOCOL_RPC_URL", "COW_PROTOCOL_SAFE_ADDRESS"],
    notes: [
      "Included because 'Cowley developer kit' most likely maps to CoW Protocol developer tooling.",
      "CoW is useful as an intent/order-signing reference, not as a native prediction-market exchange.",
      "No swap, solver, or settlement request is sent from the demo."
    ],
    sourceUrl: "https://docs.cow.bleu.builders/cow-protocol/reference/core/signing-schemes"
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
