import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createPublicClient, createWalletClient, http, type Abi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { ROBINHOOD_CHAIN_TESTNET } from "../src/shared/constants";

if (process.env.DEPLOY_CONTRACTS !== "true") {
  throw new Error("Refusing to deploy. Set DEPLOY_CONTRACTS=true for an explicit testnet run.");
}

const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
const rpcUrl = process.env.ROBINHOOD_CHAIN_RPC_URL ?? ROBINHOOD_CHAIN_TESTNET.publicRpcUrl;
const deployPrivateMarket = process.env.DEPLOY_PRIVATE_MARKET_CONTRACT === "true";

if (!privateKey?.startsWith("0x")) {
  throw new Error("DEPLOYER_PRIVATE_KEY must be a 0x-prefixed testnet key.");
}

if (!deployPrivateMarket) {
  throw new Error(
    "Refusing to deploy. Set DEPLOY_PRIVATE_MARKET_CONTRACT=true after audit approval."
  );
}

const account = privateKeyToAccount(privateKey as `0x${string}`);

export const robinhoodChain = {
  id: ROBINHOOD_CHAIN_TESTNET.chainId,
  name: ROBINHOOD_CHAIN_TESTNET.name,
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH"
  },
  rpcUrls: {
    default: {
      http: [rpcUrl]
    }
  }
} as const;

const client = createWalletClient({
  account,
  chain: robinhoodChain,
  transport: http(rpcUrl)
});

const publicClient = createPublicClient({
  chain: robinhoodChain,
  transport: http(rpcUrl)
});

const artifact = JSON.parse(
  readFileSync(join(process.cwd(), "artifacts", "contracts", "PrivateDeliveryMarket.json"), "utf8")
) as {
  abi: Abi;
  bytecode: `0x${string}`;
};

console.log({
  message: "Deploying PrivateDeliveryMarket to Robinhood Chain testnet.",
  chainId: client.chain.id,
  account: account.address,
  rpcUrl
});

const hash = await client.deployContract({
  abi: artifact.abi,
  bytecode: artifact.bytecode,
  account
});

console.log({ hash, explorerUrl: `${ROBINHOOD_CHAIN_TESTNET.explorerUrl}/tx/${hash}` });

const receipt = await publicClient.waitForTransactionReceipt({ hash });
console.log({
  contractAddress: receipt.contractAddress,
  status: receipt.status,
  explorerUrl: receipt.contractAddress
    ? `${ROBINHOOD_CHAIN_TESTNET.explorerUrl}/address/${receipt.contractAddress}`
    : undefined
});
