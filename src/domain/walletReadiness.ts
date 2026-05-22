import { createPublicClient, formatEther, getAddress, http, isAddress } from "viem";
import { ROBINHOOD_CHAIN_TESTNET } from "../shared/constants";
import type { WalletRailReadiness, WalletReadiness } from "../shared/types";

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_SOLANA_DEVNET_RPC = "https://api.devnet.solana.com";

const robinhoodChain = {
  id: ROBINHOOD_CHAIN_TESTNET.chainId,
  name: ROBINHOOD_CHAIN_TESTNET.name,
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH"
  },
  rpcUrls: {
    default: {
      http: [ROBINHOOD_CHAIN_TESTNET.publicRpcUrl]
    }
  }
} as const;

export async function getWalletReadiness(): Promise<WalletReadiness> {
  const generatedAt = new Date().toISOString();
  const rails = await Promise.all([buildEvmRail(), buildSolanaRail()]);
  const evmRail = rails.find((rail) => rail.id === "robinhood-chain-gas-wallet");

  return {
    generatedAt,
    custodyMode: "non_custodial_user_signed",
    liveFundsAllowed: false,
    serverSideSigning: "disabled",
    rails,
    nextSafeStep: evmRail?.status === "online"
      ? "Deploy or point to the non-custodial testnet receipt contract, then use wallet-confirmed calldata handoff."
      : "Configure a public EVM testnet wallet address and fund it with Robinhood Chain testnet ETH; do not send live SOL or mainnet assets."
  };
}

async function buildEvmRail(): Promise<WalletRailReadiness> {
  const configuredAddress = process.env.DELIVERY_MARKETS_TESTNET_WALLET_ADDRESS?.trim();
  const rpcUrl = process.env.ROBINHOOD_CHAIN_RPC_URL?.trim() || ROBINHOOD_CHAIN_TESTNET.publicRpcUrl;
  const contractAddress = process.env.PRIVATE_MARKET_CONTRACT_ADDRESS?.trim();

  if (!configuredAddress) {
    return {
      id: "robinhood-chain-gas-wallet",
      label: "Robinhood Chain gas wallet",
      network: ROBINHOOD_CHAIN_TESTNET.name,
      status: "not_configured",
      addressConfigured: false,
      rpcConfigured: Boolean(rpcUrl),
      expectedChainId: ROBINHOOD_CHAIN_TESTNET.chainId,
      requiredAsset: "testnet ETH",
      contractConfigured: Boolean(contractAddress),
      contractAddress: contractAddress ? redactAddress(contractAddress) : undefined,
      contractCodePresent: false,
      liveFundsAllowed: false,
      canDeployTestnet: false,
      notes: [
        "No public wallet address is configured for balance/readiness checks.",
        "The API does not hold keys or broadcast transactions."
      ],
      actions: [
        "Set DELIVERY_MARKETS_TESTNET_WALLET_ADDRESS to the public deployer or recipient wallet.",
        "Fund only with Robinhood Chain testnet ETH."
      ]
    };
  }

  if (!isAddress(configuredAddress)) {
    return {
      id: "robinhood-chain-gas-wallet",
      label: "Robinhood Chain gas wallet",
      network: ROBINHOOD_CHAIN_TESTNET.name,
      status: "blocked",
      addressConfigured: true,
      address: redactAddress(configuredAddress),
      rpcConfigured: Boolean(rpcUrl),
      expectedChainId: ROBINHOOD_CHAIN_TESTNET.chainId,
      requiredAsset: "testnet ETH",
      contractConfigured: Boolean(contractAddress),
      contractAddress: contractAddress ? redactAddress(contractAddress) : undefined,
      liveFundsAllowed: false,
      canDeployTestnet: false,
      notes: ["Configured EVM wallet address is invalid."],
      actions: ["Replace DELIVERY_MARKETS_TESTNET_WALLET_ADDRESS with a 0x-prefixed EVM address."]
    };
  }

  if (contractAddress && !isAddress(contractAddress)) {
    return {
      id: "robinhood-chain-gas-wallet",
      label: "Robinhood Chain gas wallet",
      network: ROBINHOOD_CHAIN_TESTNET.name,
      status: "blocked",
      addressConfigured: true,
      address: redactAddress(configuredAddress),
      rpcConfigured: Boolean(rpcUrl),
      expectedChainId: ROBINHOOD_CHAIN_TESTNET.chainId,
      requiredAsset: "testnet ETH",
      contractConfigured: true,
      contractAddress: redactAddress(contractAddress),
      liveFundsAllowed: false,
      canDeployTestnet: false,
      notes: ["PRIVATE_MARKET_CONTRACT_ADDRESS is configured but is not a valid EVM address."],
      actions: ["Set PRIVATE_MARKET_CONTRACT_ADDRESS to the deployed testnet contract address or leave it blank."]
    };
  }

  try {
    const client = createPublicClient({
      chain: {
        ...robinhoodChain,
        rpcUrls: {
          default: {
            http: [rpcUrl]
          }
        }
      },
      transport: http(rpcUrl, { timeout: timeoutMs() })
    });
    const address = getAddress(configuredAddress);
    const [chainId, balance, contractBytecode] = await Promise.all([
      withTimeout(client.getChainId(), "chain id"),
      withTimeout(client.getBalance({ address }), "balance"),
      contractAddress
        ? withTimeout(client.getBytecode({ address: getAddress(contractAddress) }), "contract bytecode")
        : Promise.resolve(undefined)
    ]);
    const balanceEth = Number(formatEther(balance));
    const hasGas = balance > 0n;
    const chainMatches = chainId === ROBINHOOD_CHAIN_TESTNET.chainId;
    const contractCodePresent = Boolean(contractBytecode && contractBytecode !== "0x");

    return {
      id: "robinhood-chain-gas-wallet",
      label: "Robinhood Chain gas wallet",
      network: ROBINHOOD_CHAIN_TESTNET.name,
      status: !chainMatches ? "blocked" : hasGas ? "online" : "needs_funding",
      addressConfigured: true,
      address: redactAddress(address),
      rpcConfigured: Boolean(rpcUrl),
      chainId,
      expectedChainId: ROBINHOOD_CHAIN_TESTNET.chainId,
      requiredAsset: "testnet ETH",
      balance: `${balanceEth.toFixed(balanceEth >= 1 ? 4 : 8)} ETH`,
      contractConfigured: Boolean(contractAddress),
      contractAddress: contractAddress ? redactAddress(contractAddress) : undefined,
      contractCodePresent,
      liveFundsAllowed: false,
      canDeployTestnet: chainMatches && hasGas,
      notes: [
        chainMatches
          ? "RPC is reachable on the expected Robinhood Chain testnet."
          : `RPC returned chain id ${chainId}, expected ${ROBINHOOD_CHAIN_TESTNET.chainId}.`,
        hasGas
          ? "Wallet has testnet gas for user-signed deployment or receipt transactions."
          : "Wallet has no native testnet gas.",
        contractAddress
          ? contractCodePresent
            ? "Configured private market contract has bytecode on this RPC."
            : "Configured private market contract has no bytecode on this RPC."
          : "No private market contract address is configured yet."
      ],
      actions: [
        ...(chainMatches ? [] : ["Point ROBINHOOD_CHAIN_RPC_URL at Robinhood Chain testnet."]),
        ...(hasGas ? [] : ["Fund this public wallet with Robinhood Chain testnet ETH only."]),
        ...(contractAddress && contractCodePresent
          ? []
          : ["Deploy PrivateDeliveryMarket on testnet or set PRIVATE_MARKET_CONTRACT_ADDRESS."])
      ]
    };
  } catch (error) {
    return {
      id: "robinhood-chain-gas-wallet",
      label: "Robinhood Chain gas wallet",
      network: ROBINHOOD_CHAIN_TESTNET.name,
      status: "degraded",
      addressConfigured: true,
      address: redactAddress(configuredAddress),
      rpcConfigured: Boolean(rpcUrl),
      expectedChainId: ROBINHOOD_CHAIN_TESTNET.chainId,
      requiredAsset: "testnet ETH",
      contractConfigured: Boolean(contractAddress),
      contractAddress: contractAddress ? redactAddress(contractAddress) : undefined,
      liveFundsAllowed: false,
      canDeployTestnet: false,
      notes: [`Read-only RPC check failed: ${error instanceof Error ? error.message : "unknown error"}`],
      actions: ["Check ROBINHOOD_CHAIN_RPC_URL and retry the read-only wallet readiness probe."]
    };
  }
}

async function buildSolanaRail(): Promise<WalletRailReadiness> {
  const configuredAddress = process.env.SOLANA_TESTNET_WALLET_ADDRESS?.trim();
  const rpcUrl = process.env.SOLANA_RPC_URL?.trim() || DEFAULT_SOLANA_DEVNET_RPC;

  if (!configuredAddress) {
    return {
      id: "solana-reference-wallet",
      label: "Solana reference wallet",
      network: "Solana devnet",
      status: "not_required",
      addressConfigured: false,
      rpcConfigured: Boolean(rpcUrl),
      requiredAsset: "none",
      liveFundsAllowed: false,
      canDeployTestnet: false,
      notes: ["Solana is not required for the current EVM receipt-contract path."],
      actions: ["Do not send SOL for this demo unless the architecture changes to a Solana rail."]
    };
  }

  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(configuredAddress)) {
    return {
      id: "solana-reference-wallet",
      label: "Solana reference wallet",
      network: "Solana devnet",
      status: "blocked",
      addressConfigured: true,
      address: redactGeneric(configuredAddress),
      rpcConfigured: Boolean(rpcUrl),
      requiredAsset: "devnet SOL only if a Solana rail is added",
      liveFundsAllowed: false,
      canDeployTestnet: false,
      notes: ["Configured Solana wallet address does not look like a base58 public key."],
      actions: ["Remove SOLANA_TESTNET_WALLET_ADDRESS or replace it with a devnet public key."]
    };
  }

  try {
    const response = await fetchWithTimeout(rpcUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "delivery-markets-wallet-readiness",
        method: "getBalance",
        params: [configuredAddress]
      })
    });
    const payload = (await response.json()) as {
      error?: { message?: string };
      result?: { value?: number };
    };
    if (!response.ok || payload.error) {
      throw new Error(payload.error?.message ?? `Solana RPC returned ${response.status}`);
    }
    const lamports = payload.result?.value ?? 0;

    return {
      id: "solana-reference-wallet",
      label: "Solana reference wallet",
      network: "Solana devnet",
      status: "not_required",
      addressConfigured: true,
      address: redactGeneric(configuredAddress),
      rpcConfigured: Boolean(rpcUrl),
      requiredAsset: "none for current EVM path",
      balance: `${(lamports / 1_000_000_000).toFixed(6)} SOL`,
      liveFundsAllowed: false,
      canDeployTestnet: false,
      notes: ["Solana wallet is observable, but Solana is outside the current receipt-contract path."],
      actions: ["Keep SOL out of this project unless a reviewed Solana adapter is added."]
    };
  } catch (error) {
    return {
      id: "solana-reference-wallet",
      label: "Solana reference wallet",
      network: "Solana devnet",
      status: "degraded",
      addressConfigured: true,
      address: redactGeneric(configuredAddress),
      rpcConfigured: Boolean(rpcUrl),
      requiredAsset: "none for current EVM path",
      liveFundsAllowed: false,
      canDeployTestnet: false,
      notes: [`Read-only Solana RPC check failed: ${error instanceof Error ? error.message : "unknown error"}`],
      actions: ["Leave Solana unset for this demo, or verify SOLANA_RPC_URL if a future Solana rail is added."]
    };
  }
}

function timeoutMs(): number {
  const parsed = Number(process.env.WALLET_READINESS_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TIMEOUT_MS;
}

async function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} check timed out`)), timeoutMs());
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs());
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function redactAddress(value: string): string {
  const normalized = isAddress(value) ? getAddress(value) : value;
  return `${normalized.slice(0, 6)}...${normalized.slice(-4)}`;
}

function redactGeneric(value: string): string {
  return value.length <= 12 ? value : `${value.slice(0, 6)}...${value.slice(-4)}`;
}
