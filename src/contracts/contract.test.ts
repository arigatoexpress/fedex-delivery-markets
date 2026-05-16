import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import solc from "solc";

describe("DeliveryMarketResolver contract", () => {
  it("compiles and exposes the resolver events", () => {
    const contractPath = join(process.cwd(), "contracts", "DeliveryMarketResolver.sol");
    const source = readFileSync(contractPath, "utf8");
    const output = JSON.parse(
      solc.compile(
        JSON.stringify({
          language: "Solidity",
          sources: {
            "DeliveryMarketResolver.sol": { content: source }
          },
          settings: {
            outputSelection: {
              "*": {
                "*": ["abi", "evm.bytecode.object"]
              }
            }
          }
        })
      )
    );

    const errors =
      output.errors?.filter((item: { severity: string }) => item.severity === "error") ?? [];
    const contract = output.contracts["DeliveryMarketResolver.sol"].DeliveryMarketResolver;
    const eventNames = contract.abi
      .filter((entry: { type: string }) => entry.type === "event")
      .map((entry: { name: string }) => entry.name);

    expect(errors).toEqual([]);
    expect(contract.evm.bytecode.object.length).toBeGreaterThan(1000);
    expect(eventNames).toContain("MarketResolved");
    expect(source).toContain("revert PayableDisabled()");
  });
});
