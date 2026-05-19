import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import solc from "solc";

const contracts = ["DeliveryMarketResolver.sol", "PrivateDeliveryMarket.sol"];
const sources = Object.fromEntries(
  contracts.map((fileName) => [
    fileName,
    { content: readFileSync(join(process.cwd(), "contracts", fileName), "utf8") }
  ])
);

const output = JSON.parse(
  solc.compile(
    JSON.stringify({
      language: "Solidity",
      sources,
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        },
        outputSelection: {
          "*": {
            "*": ["abi", "evm.bytecode.object", "evm.deployedBytecode.object"]
          }
        }
      }
    })
  )
);

const errors =
  output.errors?.filter((item: { severity: string }) => item.severity === "error") ?? [];
if (errors.length) {
  console.error(JSON.stringify(errors, null, 2));
  process.exit(1);
}

const artifactDir = join(process.cwd(), "artifacts", "contracts");
mkdirSync(artifactDir, { recursive: true });

for (const [fileName, compiledContracts] of Object.entries(output.contracts) as Array<
  [string, Record<string, { abi: unknown; evm: { bytecode: { object: string }; deployedBytecode: { object: string } } }>]
>) {
  for (const [contractName, contract] of Object.entries(compiledContracts)) {
    const artifact = {
      contractName,
      source: fileName,
      abi: contract.abi,
      bytecode: `0x${contract.evm.bytecode.object}`,
      deployedBytecode: `0x${contract.evm.deployedBytecode.object}`,
      generatedAt: new Date().toISOString()
    };
    const outPath = join(artifactDir, `${contractName}.json`);
    writeFileSync(outPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
    console.log(`${contractName}: ${outPath}`);
  }
}
