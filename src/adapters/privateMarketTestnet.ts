import { encodeFunctionData, parseAbi } from "viem";
import { ROBINHOOD_CHAIN_TESTNET } from "../shared/constants";
import type {
  DeliveryMarket,
  PrivateMarketQuote,
  RecipientAccessGrant,
  TestnetDeploymentPlan,
  TestnetTransactionPreview
} from "../shared/types";
import { shortHash } from "../domain/hash";

const PRIVATE_MARKET_ABI = parseAbi([
  "function createMarket(bytes32 marketKey, bytes32 trackingHash, address recipient, uint64 cutoffAt, uint16 initialYesBps)",
  "function recordTrade(bytes32 marketKey, bool yes, uint256 contracts, uint256 limitPriceCents, bytes32 offchainOrderId)"
]);

const PLACEHOLDER_CONTRACT = "0x0000000000000000000000000000000000000000";

export function buildPrivateMarketPreviews(input: {
  market: DeliveryMarket;
  grant: RecipientAccessGrant;
  quote: PrivateMarketQuote;
  orderId?: string;
}): TestnetTransactionPreview[] {
  const contractAddress = process.env.PRIVATE_MARKET_CONTRACT_ADDRESS ?? PLACEHOLDER_CONTRACT;
  const marketKey = toBytes32(input.market.id);
  const trackingHash = trackingHashToBytes32(input.market.trackingNumberHash);
  const cutoffSeconds = BigInt(Math.floor(new Date(input.market.cutoffAt).getTime() / 1000));
  const initialYesBps = Math.round(input.market.yesPrice * 10_000);
  const orderId = input.orderId ?? `preview-${shortHash(`${input.market.id}:${input.quote.generatedAt}`)}`;

  return [
    {
      id: "robinhood-chain-create-private-market",
      chainId: ROBINHOOD_CHAIN_TESTNET.chainId,
      chainName: ROBINHOOD_CHAIN_TESTNET.name,
      to: contractAddress,
      functionName: "createMarket",
      calldata: encodeFunctionData({
        abi: PRIVATE_MARKET_ABI,
        functionName: "createMarket",
        args: [
          marketKey,
          trackingHash,
          input.grant.walletAddress as `0x${string}`,
          cutoffSeconds,
          initialYesBps
        ]
      }),
      walletRequest: walletRequest(contractAddress, encodeFunctionData({
        abi: PRIVATE_MARKET_ABI,
        functionName: "createMarket",
        args: [
          marketKey,
          trackingHash,
          input.grant.walletAddress as `0x${string}`,
          cutoffSeconds,
          initialYesBps
        ]
      })),
      requiresWalletSignature: true,
      broadcastEnabled: false,
      explorerUrl: ROBINHOOD_CHAIN_TESTNET.explorerUrl,
      warnings: contractAddress === PLACEHOLDER_CONTRACT ? ["PRIVATE_MARKET_CONTRACT_ADDRESS is not configured."] : []
    },
    {
      id: "robinhood-chain-record-private-trade",
      chainId: ROBINHOOD_CHAIN_TESTNET.chainId,
      chainName: ROBINHOOD_CHAIN_TESTNET.name,
      to: contractAddress,
      functionName: "recordTrade",
      calldata: encodeFunctionData({
        abi: PRIVATE_MARKET_ABI,
        functionName: "recordTrade",
        args: [
          marketKey,
          input.quote.side === "YES",
          BigInt(input.quote.contracts),
          BigInt(Math.round(input.quote.limitPrice * 100)),
          toBytes32(orderId)
        ]
      }),
      walletRequest: walletRequest(contractAddress, encodeFunctionData({
        abi: PRIVATE_MARKET_ABI,
        functionName: "recordTrade",
        args: [
          marketKey,
          input.quote.side === "YES",
          BigInt(input.quote.contracts),
          BigInt(Math.round(input.quote.limitPrice * 100)),
          toBytes32(orderId)
        ]
      })),
      requiresWalletSignature: true,
      broadcastEnabled: false,
      explorerUrl: ROBINHOOD_CHAIN_TESTNET.explorerUrl,
      warnings: [
        "Preview only: the API never signs or broadcasts this transaction.",
        ...(contractAddress === PLACEHOLDER_CONTRACT
          ? ["PRIVATE_MARKET_CONTRACT_ADDRESS is not configured."]
          : [])
      ]
    }
  ];
}

export function getTestnetDeploymentPlan(): TestnetDeploymentPlan {
  const contractAddress = process.env.PRIVATE_MARKET_CONTRACT_ADDRESS;
  return {
    chainId: ROBINHOOD_CHAIN_TESTNET.chainId,
    chainName: ROBINHOOD_CHAIN_TESTNET.name,
    targetContract: "PrivateDeliveryMarket",
    contractAddress,
    contractAddressConfigured: Boolean(contractAddress),
    artifactCommand: "npm run contracts:build",
    deployCommand: "npm run deploy:robinhood:testnet",
    requiredEnv: [
      "ROBINHOOD_CHAIN_RPC_URL",
      "DEPLOYER_PRIVATE_KEY",
      "DEPLOY_CONTRACTS=true",
      "DEPLOY_PRIVATE_MARKET_CONTRACT=true"
    ],
    apiBroadcastEnabled: false,
    walletBroadcastEnabled: false,
    notes: [
      "The API never signs or broadcasts transactions.",
      "Deploy only with a testnet key after review.",
      "Set PRIVATE_MARKET_CONTRACT_ADDRESS after deployment to replace the zero-address calldata preview target."
    ]
  };
}

function trackingHashToBytes32(value: string): `0x${string}` {
  return `0x${value.replace(/^sha256:/, "").padStart(64, "0").slice(0, 64)}`;
}

function toBytes32(value: string): `0x${string}` {
  const hex = Buffer.from(value).toString("hex");
  return `0x${hex.padEnd(64, "0").slice(0, 64)}`;
}

function walletRequest(to: string, data: `0x${string}`) {
  return {
    to,
    data,
    value: "0x0" as const,
    chainId: `0x${ROBINHOOD_CHAIN_TESTNET.chainId.toString(16)}`
  };
}
