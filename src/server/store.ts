import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { OracleEventRecord, PaperOrder, StoreSnapshot } from "../shared/types";

const DEFAULT_DATA_DIR = join(process.cwd(), "data");

export class PilotStore {
  readonly dataDir: string;
  private readonly ordersPath: string;
  private readonly oracleEventsPath: string;

  constructor(dataDir = process.env.DELIVERY_MARKETS_DATA_DIR ?? DEFAULT_DATA_DIR) {
    this.dataDir = dataDir;
    this.ordersPath = join(dataDir, "orders.jsonl");
    this.oracleEventsPath = join(dataDir, "oracle-events.jsonl");
    mkdirSync(dataDir, { recursive: true });
  }

  appendOrder(order: PaperOrder): void {
    appendJsonLine(this.ordersPath, order);
  }

  listOrders(limit = 50): PaperOrder[] {
    return readJsonLines<PaperOrder>(this.ordersPath).slice(-limit).reverse();
  }

  appendOracleEvent(event: OracleEventRecord): void {
    appendJsonLine(this.oracleEventsPath, event);
  }

  listOracleEvents(limit = 50): OracleEventRecord[] {
    return readJsonLines<OracleEventRecord>(this.oracleEventsPath).slice(-limit).reverse();
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
      dataDir: this.dataDir
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
