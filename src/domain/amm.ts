import { z } from "zod";
import type { DeliveryMarket, OrderSide, PaperOrder, PrivateMarketQuote } from "../shared/types";
import { DEMO_MARKET_AS_OF } from "./deliveryMarkets";

export const ammQuoteRequestSchema = z.object({
  trackingNumber: z.string().min(8),
  marketId: z.string().min(8),
  side: z.enum(["YES", "NO"]),
  contracts: z.number().int().min(1).max(100)
});

export type AmmQuoteRequest = z.infer<typeof ammQuoteRequestSchema>;

const DEFAULT_BASE_LIQUIDITY = Number(process.env.PRIVATE_AMM_BASE_LIQUIDITY_USD ?? 42);
const MIN_LIQUIDITY_MULTIPLIER = 0.35;
const THETA_GAMMA = 1.3;
const MAX_CONTRACTS = 100;

export function quotePrivateAmm(input: {
  market: DeliveryMarket;
  side: OrderSide;
  contracts: number;
  existingOrders?: PaperOrder[];
  generatedAt?: Date;
}): PrivateMarketQuote {
  const generatedAt = input.generatedAt ?? DEMO_MARKET_AS_OF;
  const contracts = Math.min(Math.max(Math.trunc(input.contracts), 1), MAX_CONTRACTS);
  const initialProbability = clamp(input.market.yesPrice, 0.03, 0.97);
  const inventory = getInventory(input.market.id, input.existingOrders ?? []);
  const liquidityParameter = liquidityForCutoff(input.market.cutoffAt, generatedAt);
  const initialState = initialLmsrState(initialProbability, liquidityParameter);
  const currentYes = initialState.yes + inventory.yes;
  const currentNo = initialState.no + inventory.no;
  const beforeProbability = lmsrPrice(currentYes, currentNo, liquidityParameter);
  const nextYes = input.side === "YES" ? currentYes + contracts : currentYes;
  const nextNo = input.side === "NO" ? currentNo + contracts : currentNo;
  const grossCostUsd =
    lmsrCost(nextYes, nextNo, liquidityParameter) -
    lmsrCost(currentYes, currentNo, liquidityParameter);
  const afterProbability = lmsrPrice(nextYes, nextNo, liquidityParameter);
  const thetaDecayBps = thetaDecaySpreadBps(input.market.cutoffAt, generatedAt);
  const inventorySkewBps = inventorySpreadBps(input.side, inventory);
  const spreadUsd = roundUsd(grossCostUsd * ((thetaDecayBps + inventorySkewBps) / 10_000));
  const totalCostUsd = roundUsd(grossCostUsd + spreadUsd);
  const averagePrice = roundPrice(grossCostUsd / contracts);
  const limitPrice = roundPrice(totalCostUsd / contracts);
  const spotPrice = roundPrice(input.side === "YES" ? beforeProbability : 1 - beforeProbability);
  const slippageBps = Math.round(Math.abs(averagePrice - spotPrice) * 10_000);

  return {
    marketId: input.market.id,
    trackingNumberHash: input.market.trackingNumberHash,
    side: input.side,
    contracts,
    spotPrice,
    averagePrice,
    limitPrice,
    grossCostUsd: roundUsd(grossCostUsd),
    spreadUsd,
    totalCostUsd,
    beforeProbability: roundPrice(beforeProbability),
    afterProbability: roundPrice(afterProbability),
    slippageBps,
    thetaDecayBps,
    inventorySkewBps,
    liquidityParameter: roundUsd(liquidityParameter),
    maxContracts: MAX_CONTRACTS,
    counterparty: "private-amm-bot",
    cutoffAt: input.market.cutoffAt,
    generatedAt: generatedAt.toISOString(),
    explanation:
      "LMSR private AMM quote with a shrinking liquidity parameter near cutoff plus inventory and time-risk spread. It is a paper/testnet quote, not a live venue order."
  };
}

export function createPrivateAmmPaperOrder(input: {
  quote: PrivateMarketQuote;
  accountId: string;
  createdAt?: Date;
}): PaperOrder {
  const createdAt = input.createdAt ?? new Date();
  return {
    id: `private-amm-${createdAt.getTime().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    marketId: input.quote.marketId,
    trackingNumberHash: input.quote.trackingNumberHash,
    accountId: input.accountId,
    side: input.quote.side,
    contracts: input.quote.contracts,
    limitPrice: input.quote.limitPrice,
    notionalUsd: input.quote.totalCostUsd,
    status: "ACCEPTED",
    reason:
      "Private recipient AMM paper order accepted. Counterparty is the demo AMM bot; no exchange route, wallet signature, customer funds, or settlement occurred.",
    riskChecks: [
      {
        id: "recipient-only",
        status: "pass",
        label: "Recipient-only access",
        detail: "The order was submitted through a recipient access grant."
      },
      {
        id: "paper-testnet-only",
        status: "pass",
        label: "No live venue route",
        detail: "The order is a paper record with optional testnet calldata preview only."
      }
    ],
    environment: "paper",
    createdAt: createdAt.toISOString()
  };
}

function getInventory(marketId: string, orders: PaperOrder[]): { yes: number; no: number } {
  return orders
    .filter((order) => order.marketId === marketId && order.status === "ACCEPTED")
    .reduce(
      (inventory, order) => {
        if (order.side === "YES") {
          inventory.yes += order.contracts;
        } else {
          inventory.no += order.contracts;
        }
        return inventory;
      },
      { yes: 0, no: 0 }
    );
}

function initialLmsrState(probability: number, liquidityParameter: number) {
  return {
    yes: liquidityParameter * Math.log(probability),
    no: liquidityParameter * Math.log(1 - probability)
  };
}

function lmsrCost(yes: number, no: number, liquidityParameter: number): number {
  const max = Math.max(yes, no) / liquidityParameter;
  return (
    liquidityParameter *
    (max +
      Math.log(
        Math.exp(yes / liquidityParameter - max) +
          Math.exp(no / liquidityParameter - max)
      ))
  );
}

function lmsrPrice(yes: number, no: number, liquidityParameter: number): number {
  const yesExp = Math.exp(yes / liquidityParameter);
  const noExp = Math.exp(no / liquidityParameter);
  return yesExp / (yesExp + noExp);
}

function liquidityForCutoff(cutoffAt: string, now: Date): number {
  const cutoffMs = new Date(cutoffAt).getTime();
  const nowMs = now.getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const remaining = clamp((cutoffMs - nowMs) / oneDayMs, 0, 1);
  const multiplier =
    MIN_LIQUIDITY_MULTIPLIER +
    (1 - MIN_LIQUIDITY_MULTIPLIER) * Math.pow(remaining, THETA_GAMMA);
  return Math.max(DEFAULT_BASE_LIQUIDITY * multiplier, 8);
}

function thetaDecaySpreadBps(cutoffAt: string, now: Date): number {
  const cutoffMs = new Date(cutoffAt).getTime();
  const remainingHours = Math.max((cutoffMs - now.getTime()) / (60 * 60 * 1000), 0);
  if (remainingHours >= 24) return 35;
  if (remainingHours >= 12) return 75;
  if (remainingHours >= 4) return 140;
  return 240;
}

function inventorySpreadBps(side: OrderSide, inventory: { yes: number; no: number }): number {
  const directionalInventory = side === "YES" ? inventory.yes - inventory.no : inventory.no - inventory.yes;
  return Math.max(0, Math.min(180, Math.round(directionalInventory * 8)));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function roundPrice(value: number): number {
  return Math.round(clamp(value, 0.01, 0.99) * 1000) / 1000;
}

function roundUsd(value: number): number {
  return Math.round(value * 100) / 100;
}
