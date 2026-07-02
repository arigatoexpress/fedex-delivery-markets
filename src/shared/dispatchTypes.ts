export type ConveyanceType = "FLIGHT" | "FEEDER" | "RAIL";

export type ProductType =
  | "EXPRESS_PO" // Priority Overnight (100 pts)
  | "MEDICAL_SO" // Healthcare / Medical (80 pts)
  | "EXPRESS_SO" // Standard Overnight (50 pts)
  | "GROUND_COMMERCIAL" // Ground Business (20 pts)
  | "HOME_DELIVERY" // Home Delivery Economy (10 pts)
  | "ECONOMY_GROUND"; // Economy (5 pts)

export type WeatherType = "CLEAR" | "RAIN" | "SNOW" | "THUNDERSTORM";

export interface Package {
  id: string;
  routeId: string;
  productType: ProductType;
  weight: number; // Penalty points
  stopNum: number;
}

export interface Conveyance {
  id: string;
  name: string;
  type: ConveyanceType;
  etaMin: number; // ETA in minutes from sort start (08:00 AM = 0)
  packages: Package[];
}

export interface Route {
  id: string;
  name: string;
  driverName: string;
  normalStopsCount: number;
  normalPackagesCount: number;
}

export interface Station {
  id: string;
  name: string;
  normalStartMin: number; // e.g. 60 min (09:00 AM)
  rtbMin: number; // Return to Building constraint e.g. 600 min (06:00 PM)
  defaultRate: number; // stops per hour (e.g. 15 or 12)
  routes: Route[];
  conveyances: Conveyance[];
}

export interface ManifestStop {
  stopNum: number;
  estimatedDeliveryTimeMin: number;
  formattedTime: string;
  packages: Package[];
  isCompleted: boolean;
  isCommitFailure: boolean;
  commitDeadlineMin: number;
}

export interface RouteSimulationResult {
  routeId: string;
  driverName: string;
  totalStops: number;
  capacityStops: number;
  failedStopsCount: number;
  loadedPackagesCount: number;
  leftBehindPackagesCount: number;
  failures: Package[];
  manifest: ManifestStop[];
  commitFailuresCount: number;
}

export interface SimulationResult {
  dispatchTimeMin: number; // Minutes from sort start
  formattedDispatchTime: string; // e.g. "09:30 AM"
  leftBehindCount: number;
  leftBehindPackages: Package[];
  capacityFailedCount: number;
  capacityFailedPackages: Package[];
  commitFailuresCount: number;
  totalPenalty: number;
  totalVolume: number;
  onTimeRate: number;
  routes: RouteSimulationResult[];
  breakdown: {
    leftBehind: number;
    capacityFailed: number;
    commitFailed: number;
    byProduct: Record<ProductType, number>;
  };
  operationalCost: {
    waitWagesUsd: number;
    idleFuelUsd: number;
    co2EmissionsKg: number;
    servicePenaltyCostUsd: number;
    combinedFinancialImpactUsd: number;
  };
}

export interface ReasoningReport {
  modelName: string;
  runTimeMs: number;
  costUsd: number;
  tokensUsed: number;
  recommendation: string;
  logic: string;
}
