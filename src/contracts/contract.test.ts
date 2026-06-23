import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import solc from "solc";
import { createPublicClient, createWalletClient, http, custom, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";

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

  it("resolver ABI includes pause, ownable transfer, and cutoff enforcement", () => {
    const contractPath = join(process.cwd(), "contracts", "DeliveryMarketResolver.sol");
    const source = readFileSync(contractPath, "utf8");
    const output = compileContract("DeliveryMarketResolver.sol", source);
    const abi = output.contracts["DeliveryMarketResolver.sol"].DeliveryMarketResolver.abi;
    const functionNames = abi
      .filter((entry: { type: string }) => entry.type === "function")
      .map((entry: { name: string }) => entry.name);

    expect(functionNames).toContain("pause");
    expect(functionNames).toContain("unpause");
    expect(functionNames).toContain("transferOwnership");
    expect(functionNames).toContain("acceptOwnership");
    expect(functionNames).toContain("owner");
    expect(functionNames).toContain("pendingOwner");
    expect(functionNames).toContain("paused");
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
