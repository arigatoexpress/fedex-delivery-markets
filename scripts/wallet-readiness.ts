import { getWalletReadiness } from "../src/domain/walletReadiness";

const readiness = await getWalletReadiness();

console.log(JSON.stringify(readiness, null, 2));
