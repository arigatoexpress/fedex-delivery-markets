import { ROBINHOOD_CHAIN_TESTNET } from "../shared/constants";
import type { VenueRoute } from "../shared/types";

export function getPrivateVenueRoutes(): VenueRoute[] {
  return [
    {
      id: "robinhood-chain-private-amm",
      label: "Robinhood Chain private AMM receipt",
      mode: "testnet-calldata",
      available: true,
      network: `${ROBINHOOD_CHAIN_TESTNET.name} (${ROBINHOOD_CHAIN_TESTNET.chainId})`,
      summary:
        "Deploy or point to the private delivery market contract, then let only the recorded recipient wallet submit testnet trade receipts.",
      constraints: [
        "Requires testnet contract deployment and a recipient wallet signature.",
        "No API route signs or broadcasts transactions.",
        "This is an onchain receipt/permission model, not a regulated live event-contract listing."
      ],
      sourceUrl: "https://docs.robinhood.com/chain/connecting/"
    },
    {
      id: "arbitrum-orbit-compatible",
      label: "Arbitrum Orbit compatible path",
      mode: "testnet-calldata",
      available: true,
      network: "Arbitrum-compatible EVM L2",
      summary:
        "The same contract/calldata pattern can run on Arbitrum-compatible chains, including Robinhood Chain's Orbit-based testnet.",
      constraints: [
        "Needs chain RPC, contract deployment, wallet connection, and explorer readback.",
        "Production settlement still needs compliance, custody, and market-operator approval."
      ],
      sourceUrl: "https://docs.arbitrum.io/"
    },
    {
      id: "robinhood-event-contracts",
      label: "Robinhood event contracts",
      mode: "partner-required",
      available: false,
      summary:
        "Robinhood event contracts are an app/brokerage product with exchange-defined terms; no public SDK currently creates private delivery contracts.",
      constraints: [
        "Would require Robinhood Derivatives and exchange listing approval.",
        "Eligibility, state restrictions, terms, and settlement source must be controlled by the regulated venue.",
        "Private single-recipient markets are a partner product requirement, not a public developer toggle."
      ],
      sourceUrl: "https://robinhood.com/us/en/support/articles/robinhood-event-contracts/"
    },
    {
      id: "polymarket-clob",
      label: "Polymarket CLOB",
      mode: "read-only",
      available: false,
      network: "Polygon mainnet CLOB",
      summary:
        "Polymarket supports public CLOB trading with EIP-712 signed orders; the public docs do not expose private, recipient-only market creation.",
      constraints: [
        "Authenticated trading requires wallet signing and L2 API credentials.",
        "Creating a FedEx delivery market would need venue approval and public market rules.",
        "Use this app's SDK adapter for public market data shape and not for live order placement."
      ],
      sourceUrl: "https://docs.polymarket.com/trading/overview"
    },
    {
      id: "hedera-hcs-oracle",
      label: "Hedera HCS oracle anchor",
      mode: "testnet-calldata",
      available: true,
      network: "Hedera testnet HCS",
      summary:
        "Anchor signed FedEx milestone hashes and ordered timestamps to HCS, then use those anchors as resolver evidence.",
      constraints: [
        "HCS proves ordering and timestamping of submitted messages, not that a FedEx event is true.",
        "Production must submit only public-safe hashes and authorized event metadata."
      ],
      sourceUrl: "https://docs.hedera.com/hedera/sdks-and-apis/sdks/consensus-service/submit-a-message"
    }
  ];
}
