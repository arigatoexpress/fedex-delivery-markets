import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { OracleEventRecord, PaperOrder, PublicPaperOrder, StoreSnapshot } from "../shared/types";

const DEFAULT_DATA_DIR = join(process.cwd(), "data");
const DEFAULT_MAX_RECORDS = Number(process.env.PILOT_LEDGER_MAX_RECORDS ?? 5000);

export class PilotStore {
  readonly dataDir: string;
  readonly maxRecords: number;
  private readonly ordersPath: string;
  private readonly oracleEventsPath: string;

  constructor(
    dataDir = process.env.DELIVERY_MARKETS_DATA_DIR ?? DEFAULT_DATA_DIR,
    maxRecords = DEFAULT_MAX_RECORDS
  ) {
    this.dataDir = dataDir;
    this.maxRecords = maxRecords;
    this.ordersPath = join(dataDir, "orders.jsonl");
    this.oracleEventsPath = join(dataDir, "oracle-events.jsonl");
    mkdirSync(dataDir, { recursive: true });
  }

  appendOrder(order: PaperOrder): void {
    appendJsonLine(this.ordersPath, order);
    trimJsonlFile(this.ordersPath, this.maxRecords);
  }

  listOrders(limit = 50): PaperOrder[] {
    return readJsonLines<PaperOrder>(this.ordersPath).slice(-clampLimit(limit)).reverse();
  }

  listPublicOrders(limit = 50): PublicPaperOrder[] {
    return this.listOrders(limit).map(toPublicOrder);
  }

  appendOracleEvent(event: OracleEventRecord): void {
    appendJsonLine(this.oracleEventsPath, event);
    trimJsonlFile(this.oracleEventsPath, this.maxRecords);
  }

  listOracleEvents(limit = 50): OracleEventRecord[] {
    return readJsonLines<OracleEventRecord>(this.oracleEventsPath).slice(-clampLimit(limit)).reverse();
  }

  nextOracleSequenceNumber(): number {
    return readJsonLines<OracleEventRecord>(this.oracleEventsPath).length + 1;
  }

  snapshot(): StoreSnapshot {
    const orders = readJsonLines<PaperOrder>(this.ordersPath);
    const oracleEvents = readJsonLines<OracleEventRecord>(this.oracleEventsPath);
    return {
      orderCount: orders.length,
      oracleEventCount: oracleEvents.length,
      lastOrderId: orders.at(-1)?.id,
      lastOracleEventHash: oracleEvents.at(-1)?.eventHash,
      dataDir: this.dataDir,
      maxRecords: this.maxRecords
    };
  }

  publicSnapshot(): StoreSnapshot {
    return {
      ...this.snapshot(),
      dataDir: "[redacted]"
    };
  }
}

export function createPilotStore(dataDir?: string): PilotStore {
  return new PilotStore(dataDir);
}

function appendJsonLine(path: string, value: unknown): void {
  appendFileSync(path, `${JSON.stringify(value)}\n`, "utf8");
}

function readJsonLines<T>(path: string): T[] {
  if (!existsSync(path)) return [];
  const content = readFileSync(path, "utf8").trim();
  if (!content) return [];
  return content
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as T);
}

function trimJsonlFile(path: string, maxRecords: number): void {
  const records = readJsonLines<unknown>(path);
  if (records.length <= maxRecords) return;
  const trimmed = records.slice(-maxRecords).map((record) => JSON.stringify(record)).join("\n");
  // Rewriting the compacted ledger keeps the prototype bounded; production should use a database.
  writeFileSync(path, `${trimmed}\n`, "utf8");
}

function clampLimit(limit: number): number {
  return Math.min(Math.max(Math.trunc(limit || 50), 1), 100);
}

export function toPublicOrder(order: PaperOrder): PublicPaperOrder {
  return {
    id: order.id,
    marketId: order.marketId,
    side: order.side,
    contracts: order.contracts,
    limitPrice: order.limitPrice,
    notionalUsd: order.notionalUsd,
    status: order.status,
    reason: order.reason,
    environment: order.environment,
    createdAt: order.createdAt
  };
}
