import type { IntegrationReadiness } from "../shared/types";

export async function getPolymarketReadiness(): Promise<IntegrationReadiness> {
  const sdkLoaded = await canLoad("@polymarket/clob-client-v2");
  return {
    id: "polymarket-clob",
    label: "Polymarket CLOB SDK",
    mode: "read-only",
    ready: sdkLoaded,
    packageName: "@polymarket/clob-client-v2",
    network: "Polygon settlement for live Polymarket markets",
    requiredEnv: [
      "POLYMARKET_PRIVATE_KEY",
      "POLYMARKET_DEPOSIT_WALLET_ADDRESS",
      "POLYMARKET_API_KEY"
    ],
    notes: [
      "Installed for API-shape parity and future market-data experiments.",
      "Order placement remains disabled because it requires EIP-712 signing and venue eligibility review.",
      "This app does not create FedEx delivery markets on Polymarket."
    ],
    sourceUrl: "https://docs.polymarket.com/trading/overview"
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
