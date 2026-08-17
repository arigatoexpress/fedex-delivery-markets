import { afterEach, describe, expect, it } from "vitest";
import { getHederaReadiness } from "./hedera";
import { getPolymarketReadiness } from "./polymarket";

const READINESS_ENV_KEYS = [
  "HEDERA_OPERATOR_ID",
  "HEDERA_OPERATOR_KEY",
  "HEDERA_TOPIC_ID",
  "POLYMARKET_PRIVATE_KEY",
  "POLYMARKET_DEPOSIT_WALLET_ADDRESS",
  "POLYMARKET_API_KEY"
] as const;

const originalReadinessEnv = Object.fromEntries(
  READINESS_ENV_KEYS.map((key) => [key, process.env[key]])
);

afterEach(() => {
  for (const key of READINESS_ENV_KEYS) {
    const original = originalReadinessEnv[key];
    if (original === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = original;
    }
  }
});

describe("readiness-only SDK removal", () => {
  it("keeps Hedera and Polymarket unavailable in paper mode", async () => {
    process.env.HEDERA_OPERATOR_ID = "0.0.1001";
    process.env.HEDERA_OPERATOR_KEY = "test-only-key";
    process.env.HEDERA_TOPIC_ID = "0.0.1002";
    process.env.POLYMARKET_PRIVATE_KEY = "test-only-key";
    process.env.POLYMARKET_DEPOSIT_WALLET_ADDRESS = "0x0000000000000000000000000000000000000001";
    process.env.POLYMARKET_API_KEY = "test-only-api-key";

    const [hedera, polymarket] = await Promise.all([
      getHederaReadiness(),
      getPolymarketReadiness()
    ]);

    expect(hedera).toMatchObject({ id: "hedera-hcs", mode: "paper", ready: false });
    expect(hedera).not.toHaveProperty("packageName");
    expect(polymarket).toMatchObject({
      id: "polymarket-clob",
      mode: "paper",
      ready: false
    });
    expect(polymarket).not.toHaveProperty("packageName");
  });
});
