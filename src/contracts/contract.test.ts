import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import solc from "solc";

describe("delivery market contracts", () => {
  it("compiles the resolver and exposes resolver events", () => {
    const contractPath = join(process.cwd(), "contracts", "DeliveryMarketResolver.sol");
    const source = readFileSync(contractPath, "utf8");
    const output = compileContract("DeliveryMarketResolver.sol", source);

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

  it("compiles the recipient-only private market receipt contract", () => {
    const contractPath = join(process.cwd(), "contracts", "PrivateDeliveryMarket.sol");
    const source = readFileSync(contractPath, "utf8");
    const output = compileContract("PrivateDeliveryMarket.sol", source);
    const errors =
      output.errors?.filter((item: { severity: string }) => item.severity === "error") ?? [];
    const contract = output.contracts["PrivateDeliveryMarket.sol"].PrivateDeliveryMarket;
    const eventNames = contract.abi
      .filter((entry: { type: string }) => entry.type === "event")
      .map((entry: { name: string }) => entry.name);

    expect(errors).toEqual([]);
    expect(contract.evm.bytecode.object.length).toBeGreaterThan(1000);
    expect(eventNames).toContain("TradeRecorded");
    expect(source).toContain("if (msg.sender != market.recipient) revert NotRecipient()");
  });
});

function compileContract(fileName: string, source: string) {
  return JSON.parse(
    solc.compile(
      JSON.stringify({
        language: "Solidity",
        sources: {
          [fileName]: { content: source }
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
}
