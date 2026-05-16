import { SOURCE_REFERENCES } from "../shared/constants";
import type { IntegrationReadiness, ResearchReference } from "../shared/types";
import { getCowReadiness } from "./cow";
import { getHederaReadiness } from "./hedera";
import { getPolymarketReadiness } from "./polymarket";
import { getRobinhoodReadiness } from "./robinhood";

export async function getIntegrationReadiness(): Promise<IntegrationReadiness[]> {
  const [polymarket, cow, hedera] = await Promise.all([
    getPolymarketReadiness(),
    getCowReadiness(),
    getHederaReadiness()
  ]);

  return [getRobinhoodReadiness(), hedera, polymarket, cow];
}

export function getResearchReferences(): ResearchReference[] {
  return SOURCE_REFERENCES.map((source) => ({ ...source }));
}
