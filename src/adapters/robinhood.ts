import { ROBINHOOD_CHAIN_TESTNET } from "../shared/constants";
import type { IntegrationReadiness } from "../shared/types";

export function getRobinhoodReadiness(): IntegrationReadiness {
  return {
    id: "robinhood-chain",
    label: "Robinhood Chain Testnet",
    mode: "testnet-ready",
    ready: true,
    packageName: "viem",
    network: `${ROBINHOOD_CHAIN_TESTNET.name} (${ROBINHOOD_CHAIN_TESTNET.chainId})`,
    requiredEnv: ["ROBINHOOD_CHAIN_RPC_URL", "DEPLOYER_PRIVATE_KEY"],
    notes: [
      "The app includes chain metadata for a future Robinhood Chain resolver deployment.",
      "Robinhood event-contract trading is app/partner-exchange mediated; no public event-contract SDK is used here.",
      "The API exposes no route that can sign or submit a Robinhood or exchange order."
    ],
    sourceUrl: "https://docs.robinhood.com/chain/connecting/"
  };
}
