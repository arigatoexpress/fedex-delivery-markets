import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export interface Logger {
  info(obj: Record<string, unknown>, msg: string): void;
  warn(obj: Record<string, unknown>, msg: string): void;
  error(obj: Record<string, unknown>, msg: string): void;
}

function writeLog(level: string, obj: Record<string, unknown>, msg: string): void {
  const entry = JSON.stringify({ level, time: new Date().toISOString(), msg, ...obj });
  // eslint-disable-next-line no-console
  console.log(entry);
}

export const logger: Logger = {
  info: (obj, msg) => writeLog("info", obj, msg),
  warn: (obj, msg) => writeLog("warn", obj, msg),
  error: (obj, msg) => writeLog("error", obj, msg)
};

export function logServerStartup(port: number): void {
  logger.info({ port, service: "fedex-delivery-markets" }, "Delivery Markets API listening");
}
