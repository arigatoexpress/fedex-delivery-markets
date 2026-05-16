export const PAPER_MODE = true;

export const ROBINHOOD_CHAIN_TESTNET = {
  name: "Robinhood Chain Testnet",
  chainId: 46630,
  currency: "ETH",
  publicRpcUrl: "https://rpc.testnet.chain.robinhood.com",
  explorerUrl: "https://explorer.testnet.chain.robinhood.com",
  recommendedRpcPattern: "https://robinhood-testnet.g.alchemy.com/v2/<YOUR_API_KEY>"
} as const;

export const DEMO_TRACKING_NUMBERS = [
  "771234567890",
  "882345678901",
  "993456789012"
] as const;

export const SOURCE_REFERENCES = [
  {
    id: "fedex-basic-visibility",
    label: "FedEx Basic Integrated Visibility",
    takeaway:
      "FedEx exposes tracking status, estimated delivery date, and estimated delivery time windows through its developer portal. This demo uses fixtures only.",
    url: "https://developer.fedex.com/api/en-gl/catalog/track.html"
  },
  {
    id: "polymarket-clob",
    label: "Polymarket CLOB",
    takeaway:
      "Polymarket uses offchain order matching with onchain settlement, EIP-712 signed orders, and SDK clients. This demo does not sign or submit orders.",
    url: "https://docs.polymarket.com/trading/overview"
  },
  {
    id: "robinhood-chain",
    label: "Robinhood Chain Testnet",
    takeaway:
      "Robinhood Chain is an Ethereum-compatible Arbitrum Orbit L2 testnet using ETH as gas with chain id 46630.",
    url: "https://docs.robinhood.com/chain/connecting/"
  },
  {
    id: "robinhood-event-contracts",
    label: "Robinhood Event Contracts",
    takeaway:
      "Robinhood event contracts are offered through Robinhood Derivatives and regulated partner exchanges, with exchange-defined settlement.",
    url: "https://robinhood.com/us/en/support/articles/robinhood-event-contracts/"
  },
  {
    id: "hedera-hcs",
    label: "Hedera Consensus Service",
    takeaway:
      "HCS topics can receive messages and mirror nodes expose ordered consensus timestamps and sequence numbers for event anchoring.",
    url: "https://docs.hedera.com/hedera/tutorials/consensus/submit-your-first-message"
  },
  {
    id: "cow-protocol",
    label: "CoW Protocol SDK",
    takeaway:
      "CoW Protocol supports intent-style offchain orders and EIP-712 signing. It is a DeFi execution reference, not a prediction-market venue.",
    url: "https://docs.cow.bleu.builders/cow-protocol/reference/core/signing-schemes"
  }
] as const;
