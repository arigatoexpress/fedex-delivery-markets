import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { ROBINHOOD_CHAIN_TESTNET } from "../src/shared/constants";

if (process.env.DEPLOY_CONTRACTS !== "true") {
  throw new Error("Refusing to deploy. Set DEPLOY_CONTRACTS=true for an explicit testnet run.");
}

const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
const rpcUrl = process.env.ROBINHOOD_CHAIN_RPC_URL ?? ROBINHOOD_CHAIN_TESTNET.publicRpcUrl;

if (!privateKey?.startsWith("0x")) {
  throw new Error("DEPLOYER_PRIVATE_KEY must be a 0x-prefixed testnet key.");
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

console.log({
  message:
    "Deployment client initialized. Compile and pass bytecode/ABI only after contract audit and testnet approval.",
  chainId: client.chain.id,
  account: account.address
});
