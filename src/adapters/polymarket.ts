import type { IntegrationReadiness } from "../shared/types";

export async function getPolymarketReadiness(): Promise<IntegrationReadiness> {
  return {
    id: "polymarket-clob",
    label: "Polymarket CLOB",
    mode: "paper",
    ready: false,
    network: "Paper-only venue modeling; no SDK or order route installed",
    notes: [
      "The Polymarket SDK is not installed; this entry documents a future research surface only.",
      "Supplying Polymarket credentials does not enable market data, signing, or order placement.",
      "This app does not create FedEx delivery markets on Polymarket."
    ],
    sourceUrl: "https://docs.polymarket.com/trading/overview"
  };
}
