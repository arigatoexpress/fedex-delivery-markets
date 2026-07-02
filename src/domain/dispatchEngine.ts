import type {
  Station,
  Route,
  Conveyance,
  Package,
  SimulationResult,
  RouteSimulationResult,
  ProductType,
  ReasoningReport,
  WeatherType,
  ManifestStop
} from "../shared/dispatchTypes";

// Helper to format minutes from 08:00 AM to a nice string
export function formatMinutesToTime(min: number): string {
  const baseHour = 8;
  const totalMinutes = baseHour * 60 + min;
  const hour24 = Math.floor(totalMinutes / 60) % 24;
  const minutes = Math.floor(totalMinutes % 60);
  const ampm = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")} ${ampm}`;
}

const PRODUCT_WEIGHTS: Record<ProductType, number> = {
  EXPRESS_PO: 100,
  MEDICAL_SO: 80,
  EXPRESS_SO: 50,
  GROUND_COMMERCIAL: 20,
  HOME_DELIVERY: 10,
  ECONOMY_GROUND: 5
};

const PRODUCT_DEADLINES: Record<ProductType, number> = {
  EXPRESS_PO: 240, // 12:00 PM
  MEDICAL_SO: 420, // 03:00 PM
  EXPRESS_SO: 500, // 05:00 PM
  GROUND_COMMERCIAL: 600, // 06:00 PM
  HOME_DELIVERY: 600,
  ECONOMY_GROUND: 600
};

// Standard mock data for Station A (Memphis MEM-A)
const STATION_A_ROUTES: Route[] = [
  { id: "101", name: "Downtown Core", driverName: "Ryan Day", normalStopsCount: 45, normalPackagesCount: 58 },
  { id: "102", name: "Suburbs North", driverName: "Brady Bates", normalStopsCount: 52, normalPackagesCount: 68 },
  { id: "103", name: "Industrial East", driverName: "Sarah Jenkins", normalStopsCount: 38, normalPackagesCount: 48 },
  { id: "104", name: "West Heights", driverName: "John Miller", normalStopsCount: 55, normalPackagesCount: 70 },
  { id: "105", name: "Airport Corridor", driverName: "Emma Watson", normalStopsCount: 32, normalPackagesCount: 40 },
  { id: "106", name: "South Valley", driverName: "David Lee", normalStopsCount: 48, normalPackagesCount: 60 },
  { id: "107", name: "Metro Center", driverName: "Lisa Clark", normalStopsCount: 50, normalPackagesCount: 65 },
  { id: "108", name: "East Foothills", driverName: "James Rodriguez", normalStopsCount: 30, normalPackagesCount: 38 }
];

// Standard mock data for Station B (Denver DEN-B)
const STATION_B_ROUTES: Route[] = [
  { id: "201", name: "Cherry Creek", driverName: "Robert Frost", normalStopsCount: 35, normalPackagesCount: 45 },
  { id: "202", name: "Boulder Express", driverName: "Emily Dickinson", normalStopsCount: 42, normalPackagesCount: 54 },
  { id: "203", name: "Golden Foothills", driverName: "Walt Whitman", normalStopsCount: 38, normalPackagesCount: 48 },
  { id: "204", name: "Aurora West", driverName: "Sylvia Plath", normalStopsCount: 44, normalPackagesCount: 56 }
];

export function getStations(): Station[] {
  return [
    {
      id: "MEM-A",
      name: "Memphis Hub (MEM-A)",
      normalStartMin: 60, // 09:00 AM
      rtbMin: 600, // 06:00 PM (10 hours, 600m total)
      defaultRate: 15, // 15 stops per hour
      routes: STATION_A_ROUTES,
      conveyances: [
        {
          id: "FX-88",
          name: "Flight FX-88 (Priority Express)",
          type: "FLIGHT",
          etaMin: 75, // 09:15 AM
          packages: generateConveyancePackages("FX-88", STATION_A_ROUTES)
        },
        {
          id: "TR-124",
          name: "Feeder TR-124 (Ground Commercial)",
          type: "FEEDER",
          etaMin: 100, // 09:40 AM
          packages: generateConveyancePackages("TR-124", STATION_A_ROUTES)
        },
        {
          id: "RA-03",
          name: "Rail RA-03 (Bulk Economy)",
          type: "RAIL",
          etaMin: 135, // 10:15 AM
          packages: generateConveyancePackages("RA-03", STATION_A_ROUTES)
        }
      ]
    },
    {
      id: "DEN-B",
      name: "Denver Foothills (DEN-B)",
      normalStartMin: 30, // 08:30 AM
      rtbMin: 570, // 05:30 PM (9.5 hours, 570m total)
      defaultRate: 12, // 12 stops per hour
      routes: STATION_B_ROUTES,
      conveyances: [
        {
          id: "FX-202",
          name: "Flight FX-202 (Express & Medical)",
          type: "FLIGHT",
          etaMin: 45, // 08:45 AM
          packages: generateConveyancePackages("FX-202", STATION_B_ROUTES)
        },
        {
          id: "TR-505",
          name: "Truck TR-505 (Express & Ground)",
          type: "FEEDER",
          etaMin: 75, // 09:15 AM
          packages: generateConveyancePackages("TR-505", STATION_B_ROUTES)
        }
      ]
    }
  ];
}

// Generate packages that arrive on normal sort (available from minute 0)
export function generateNormalPackages(routes: Route[]): Package[] {
  const list: Package[] = [];
  routes.forEach((route) => {
    const normalCount = route.normalPackagesCount;
    for (let i = 0; i < normalCount; i++) {
      let productType: ProductType = "GROUND_COMMERCIAL";
      if (i < normalCount * 0.15) {
        productType = "EXPRESS_SO";
      } else if (i > normalCount * 0.7) {
        productType = "HOME_DELIVERY";
      } else if (i > normalCount * 0.9) {
        productType = "ECONOMY_GROUND";
      }

      const stopNum = Math.floor(i / 1.3) + 1;

      list.push({
        id: `norm-${route.id}-${i}`,
        routeId: route.id,
        productType,
        weight: PRODUCT_WEIGHTS[productType],
        stopNum
      });
    }
  });
  return list;
}

// Generate packages for late conveyances
function generateConveyancePackages(conveyanceId: string, routes: Route[]): Package[] {
  const list: Package[] = [];
  
  if (conveyanceId === "FX-88") {
    routes.slice(0, 5).forEach((route, idx) => {
      for (let i = 0; i < 3; i++) {
        const stopNum = i === 0 ? 12 : 60 + idx * 5 + i;
        list.push({
          id: `pkg-${conveyanceId}-${route.id}-po-${i}`,
          routeId: route.id,
          productType: "EXPRESS_PO",
          weight: PRODUCT_WEIGHTS.EXPRESS_PO,
          stopNum
        });
      }
    });

    routes.slice(4, 8).forEach((route, idx) => {
      for (let i = 0; i < 2; i++) {
        const stopNum = i === 0 ? 15 : 70 + idx * 5 + i;
        list.push({
          id: `pkg-${conveyanceId}-${route.id}-med-${i}`,
          routeId: route.id,
          productType: "MEDICAL_SO",
          weight: PRODUCT_WEIGHTS.MEDICAL_SO,
          stopNum
        });
      }
    });
  } else if (conveyanceId === "TR-124") {
    routes.forEach((route, idx) => {
      for (let i = 0; i < 2; i++) {
        const stopNum = i === 0 ? 5 : 80 + idx * 5 + i;
        list.push({
          id: `pkg-${conveyanceId}-${route.id}-so-${i}`,
          routeId: route.id,
          productType: "EXPRESS_SO",
          weight: PRODUCT_WEIGHTS.EXPRESS_SO,
          stopNum
        });
      }
      for (let i = 0; i < 4; i++) {
        const stopNum = i < 2 ? 8 + i * 4 : 90 + idx * 5 + i;
        list.push({
          id: `pkg-${conveyanceId}-${route.id}-gc-${i}`,
          routeId: route.id,
          productType: "GROUND_COMMERCIAL",
          weight: PRODUCT_WEIGHTS.GROUND_COMMERCIAL,
          stopNum
        });
      }
    });
  } else if (conveyanceId === "RA-03") {
    routes.forEach((route, idx) => {
      for (let i = 0; i < 10; i++) {
        const stopNum = i < 5 ? 10 + i * 2 : 100 + idx * 15 + i;
        list.push({
          id: `pkg-${conveyanceId}-${route.id}-hd-${i}`,
          routeId: route.id,
          productType: "HOME_DELIVERY",
          weight: PRODUCT_WEIGHTS.HOME_DELIVERY,
          stopNum
        });
      }
      for (let i = 0; i < 15; i++) {
        const stopNum = i < 8 ? 12 + i * 2 : 120 + idx * 15 + i;
        list.push({
          id: `pkg-${conveyanceId}-${route.id}-eg-${i}`,
          routeId: route.id,
          productType: "ECONOMY_GROUND",
          weight: PRODUCT_WEIGHTS.ECONOMY_GROUND,
          stopNum
        });
      }
    });
  } else if (conveyanceId === "FX-202") {
    routes.forEach((route, idx) => {
      for (let i = 0; i < 2; i++) {
        const stopNum = i === 0 ? 8 : 50 + idx * 5 + i;
        list.push({
          id: `pkg-${conveyanceId}-${route.id}-po-${i}`,
          routeId: route.id,
          productType: "EXPRESS_PO",
          weight: PRODUCT_WEIGHTS.EXPRESS_PO,
          stopNum
        });
      }
      list.push({
        id: `pkg-${conveyanceId}-${route.id}-med-0`,
        routeId: route.id,
        productType: "MEDICAL_SO",
        weight: PRODUCT_WEIGHTS.MEDICAL_SO,
        stopNum: 60 + idx * 5
      });
    });
  } else if (conveyanceId === "TR-505") {
    routes.forEach((route, idx) => {
      for (let i = 0; i < 2; i++) {
        const stopNum = i === 0 ? 12 : 70 + idx * 5 + i;
        list.push({
          id: `pkg-${conveyanceId}-${route.id}-so-${i}`,
          routeId: route.id,
          productType: "EXPRESS_SO",
          weight: PRODUCT_WEIGHTS.EXPRESS_SO,
          stopNum
        });
      }
      for (let i = 0; i < 4; i++) {
        const stopNum = i < 2 ? 15 + i * 3 : 80 + idx * 5 + i;
        list.push({
          id: `pkg-${conveyanceId}-${route.id}-gc-${i}`,
          routeId: route.id,
          productType: "GROUND_COMMERCIAL",
          weight: PRODUCT_WEIGHTS.GROUND_COMMERCIAL,
          stopNum
        });
      }
    });
  }

  return list;
}

export function simulateDispatch(
  stationId: string,
  dispatchTimeMin: number, // Dispatch time in minutes from 08:00 AM (e.g. 60 = 09:00 AM)
  selectiveRouteHolds: Record<string, number> = {},
  customEtas: Record<string, number> = {},
  optimizerMode: "MIN_PENALTY" | "MAX_ON_TIME" | "EXPRESS_ONLY" = "MIN_PENALTY",
  weather: WeatherType = "CLEAR",
  customSorter?: (stops: any[]) => any[]
): SimulationResult {
  const stations = getStations();
  const station = stations.find((s) => s.id === stationId);
  if (!station) {
    throw new Error(`Station ${stationId} not found`);
  }

  // Weather parameters
  let rateMultiplier = 1.0;
  let weatherEtaDelay = 0;
  if (weather === "RAIN") {
    rateMultiplier = 0.9;
    weatherEtaDelay = 15;
  } else if (weather === "SNOW") {
    rateMultiplier = 0.8;
    weatherEtaDelay = 30;
  } else if (weather === "THUNDERSTORM") {
    rateMultiplier = 0.7;
    weatherEtaDelay = 45;
  }

  const normalPackages = generateNormalPackages(station.routes);
  const allConveyancePackages = station.conveyances.flatMap((c) => c.packages);
  const totalVolume = normalPackages.length + allConveyancePackages.length;

  const leftBehindPackages: Package[] = [];
  const capacityFailedPackages: Package[] = [];
  const commitFailedPackages: Package[] = [];
  const routeResults: RouteSimulationResult[] = [];

  const productBreakdown: Record<ProductType, number> = {
    EXPRESS_PO: 0,
    MEDICAL_SO: 0,
    EXPRESS_SO: 0,
    GROUND_COMMERCIAL: 0,
    HOME_DELIVERY: 0,
    ECONOMY_GROUND: 0
  };

  let totalWagesWaitHours = 0;

  station.routes.forEach((route) => {
    // Actual dispatch time for this route
    const routeDispatchTime = selectiveRouteHolds[route.id] ?? dispatchTimeMin;

    // Track driver wait wages
    const waitTimeMin = Math.max(0, routeDispatchTime - station.normalStartMin);
    totalWagesWaitHours += waitTimeMin / 60;

    // Normal packages for this route (always loaded)
    const routeNormalPkgs = normalPackages.filter((p) => p.routeId === route.id);
    
    // Conveyance packages for this route
    const routeConveyancePkgs = allConveyancePackages.filter((p) => p.routeId === route.id);

    const loadedConveyancePkgs: Package[] = [];
    const leftBehindConveyancePkgs: Package[] = [];

    routeConveyancePkgs.forEach((pkg) => {
      // Find the conveyance this package belongs to
      const conveyance = station.conveyances.find((c) => c.packages.some((p) => p.id === pkg.id));
      const baseEta = conveyance ? conveyance.etaMin : 0;
      const dynamicEta = customEtas[conveyance?.id ?? ""] !== undefined 
        ? customEtas[conveyance?.id ?? ""] 
        : baseEta;
      
      const eta = dynamicEta + weatherEtaDelay;
      
      if (eta + 15 <= routeDispatchTime) {
        loadedConveyancePkgs.push(pkg);
      } else {
        leftBehindConveyancePkgs.push(pkg);
        leftBehindPackages.push(pkg);
        productBreakdown[pkg.productType]++;
      }
    });

    const loadedPackages = [...routeNormalPkgs, ...loadedConveyancePkgs];

    // Compute stops for loaded packages
    const stopsMap: Record<number, Package[]> = {};
    loadedPackages.forEach((pkg) => {
      if (!stopsMap[pkg.stopNum]) {
        stopsMap[pkg.stopNum] = [];
      }
      stopsMap[pkg.stopNum].push(pkg);
    });

    const totalStopsCount = Object.keys(stopsMap).length;

    // On road capacity calculations
    const finalDeliveryRate = station.defaultRate * rateMultiplier;
    const timeOnRoad = Math.max(0, station.rtbMin - routeDispatchTime);
    const capacityStops = (timeOnRoad / 60) * finalDeliveryRate;
    const completedStopsCount = Math.min(totalStopsCount, Math.floor(capacityStops));
    const failedStopsCount = Math.max(0, totalStopsCount - completedStopsCount);

    const routeFailures: Package[] = [];
    const routeManifestStops: ManifestStop[] = [];
    let routeCommitFailures = 0;

    // Sort stops according to optimizer strategy
    let sortedStopKeys = Object.entries(stopsMap).map(([stopNum, pkgs]) => {
      const maxWeight = Math.max(...pkgs.map((p) => p.weight));
      const minDeadline = Math.min(...pkgs.map((p) => PRODUCT_DEADLINES[p.productType]));
      return {
        stopNum: Number(stopNum),
        pkgs,
        maxWeight,
        pkgCount: pkgs.length,
        minDeadline
      };
    });

    if (customSorter) {
      try {
        const customSorted = customSorter(sortedStopKeys);
        if (Array.isArray(customSorted)) {
          sortedStopKeys = customSorted;
        }
      } catch (err) {
        sortedStopKeys.sort((a, b) => b.maxWeight - a.maxWeight);
      }
    } else if (optimizerMode === "MAX_ON_TIME") {
      sortedStopKeys.sort((a, b) => b.pkgCount - a.pkgCount);
    } else if (optimizerMode === "EXPRESS_ONLY") {
      sortedStopKeys.sort((a, b) => {
        const aIsPriority = a.maxWeight >= 80 ? 1 : 0;
        const bIsPriority = b.maxWeight >= 80 ? 1 : 0;
        if (aIsPriority !== bIsPriority) {
          return bIsPriority - aIsPriority;
        }
        return b.maxWeight - a.maxWeight;
      });
    } else {
      // MIN_PENALTY: Sort by maxWeight descending (priority first), then by earliest deadline
      sortedStopKeys.sort((a, b) => {
        if (b.maxWeight !== a.maxWeight) {
          return b.maxWeight - a.maxWeight;
        }
        return a.minDeadline - b.minDeadline;
      });
    }

    const timePerStopMin = 60 / finalDeliveryRate;

    sortedStopKeys.forEach((stop, index) => {
      const isCompleted = index < completedStopsCount;
      // Est delivery time = dispatch + 15m stem time + stop index * time per stop
      const estTimeMin = routeDispatchTime + 15 + (index + 1) * timePerStopMin;

      let isCommitFailure = false;
      if (isCompleted) {
        // Check commitment deadlines for loaded packages on this stop
        stop.pkgs.forEach((pkg) => {
          const deadline = PRODUCT_DEADLINES[pkg.productType];
          if (estTimeMin > deadline) {
            isCommitFailure = true;
          }
        });

        if (isCommitFailure) {
          routeCommitFailures++;
          stop.pkgs.forEach((pkg) => {
            commitFailedPackages.push(pkg);
            productBreakdown[pkg.productType]++;
          });
        }
      } else {
        // Failed due to capacity limits
        stop.pkgs.forEach((pkg) => {
          routeFailures.push(pkg);
          capacityFailedPackages.push(pkg);
          productBreakdown[pkg.productType]++;
        });
      }

      routeManifestStops.push({
        stopNum: stop.stopNum,
        estimatedDeliveryTimeMin: Math.round(estTimeMin),
        formattedTime: formatMinutesToTime(Math.round(estTimeMin)),
        packages: stop.pkgs,
        isCompleted,
        isCommitFailure,
        commitDeadlineMin: stop.minDeadline
      });
    });

    routeResults.push({
      routeId: route.id,
      driverName: route.driverName,
      totalStops: totalStopsCount,
      capacityStops: Math.round(capacityStops * 10) / 10,
      failedStopsCount,
      loadedPackagesCount: loadedPackages.length,
      leftBehindPackagesCount: leftBehindConveyancePkgs.length,
      failures: routeFailures,
      manifest: routeManifestStops,
      commitFailuresCount: routeCommitFailures
    });
  });

  // Calculate penalties
  const leftBehindPenalty = leftBehindPackages.reduce((acc, p) => acc + p.weight, 0);
  const capacityPenalty = capacityFailedPackages.reduce((acc, p) => acc + p.weight, 0);
  
  // Late delivery / commitment failure costs 30% of total package weight
  const commitPenalty = commitFailedPackages.reduce((acc, p) => acc + p.weight * 0.3, 0);
  
  const totalPenalty = Math.round(leftBehindPenalty + capacityPenalty + commitPenalty);

  const totalFailedCount = leftBehindPackages.length + capacityFailedPackages.length + commitFailedPackages.length;
  const onTimeRate = totalVolume > 0 ? (totalVolume - totalFailedCount) / totalVolume : 1;

  // Operational Financial Costs
  const wageCostUsd = totalWagesWaitHours * 32.50; // $32.50/hour driver wages
  const fuelIdlingGals = totalWagesWaitHours * 0.6; // 0.6 gallons / hour idling
  const idleFuelCostUsd = fuelIdlingGals * 3.85; // $3.85 / gallon fuel
  const carbonEmissionsKg = fuelIdlingGals * 8.8; // 8.8 kg CO2 per gallon of diesel fuel

  const servicePenaltyCostUsd = totalPenalty * 15.00; // SLA penalty cost: $15/penalty point
  const combinedFinancialImpactUsd = wageCostUsd + idleFuelCostUsd + servicePenaltyCostUsd;

  return {
    dispatchTimeMin,
    formattedDispatchTime: formatMinutesToTime(dispatchTimeMin),
    leftBehindCount: leftBehindPackages.length,
    leftBehindPackages,
    capacityFailedCount: capacityFailedPackages.length,
    capacityFailedPackages,
    commitFailuresCount: commitFailedPackages.length,
    totalPenalty,
    totalVolume,
    onTimeRate: Math.round(onTimeRate * 1000) / 10,
    routes: routeResults,
    breakdown: {
      leftBehind: leftBehindPackages.length,
      capacityFailed: capacityFailedPackages.length,
      commitFailed: commitFailedPackages.length,
      byProduct: productBreakdown
    },
    operationalCost: {
      waitWagesUsd: Math.round(wageCostUsd * 100) / 100,
      idleFuelUsd: Math.round(idleFuelCostUsd * 100) / 100,
      co2EmissionsKg: Math.round(carbonEmissionsKg * 100) / 100,
      servicePenaltyCostUsd: Math.round(servicePenaltyCostUsd * 100) / 100,
      combinedFinancialImpactUsd: Math.round(combinedFinancialImpactUsd * 100) / 100
    }
  };
}

// Generate AI Reasoning reports including financial costs and weather
export function generateAiReasoning(
  stationId: string,
  dispatchTimeMin: number,
  selectiveRouteHolds: Record<string, number> = {},
  customEtas: Record<string, number> = {},
  optimizerMode: "MIN_PENALTY" | "MAX_ON_TIME" | "EXPRESS_ONLY" = "MIN_PENALTY",
  weather: WeatherType = "CLEAR"
): ReasoningReport[] {
  const result = simulateDispatch(stationId, dispatchTimeMin, selectiveRouteHolds, customEtas, optimizerMode, weather);
  const isSelectiveActive = Object.keys(selectiveRouteHolds).length > 0;

  // Find optimal station hold time under this weather setting
  let bestStationTime = 60;
  let minStationPenalty = Infinity;

  for (let t = 30; t <= 180; t += 5) {
    const sim = simulateDispatch(stationId, t, {}, customEtas, optimizerMode, weather);
    if (sim.totalPenalty < minStationPenalty) {
      minStationPenalty = sim.totalPenalty;
      bestStationTime = t;
    }
  }

  const stationName = stationId === "MEM-A" ? "Memphis Hub" : "Denver Foothills";
  const optimalTimeFormatted = formatMinutesToTime(bestStationTime);

  const fx88Eta = customEtas["FX-88"] !== undefined ? customEtas["FX-88"] : 75;
  const fx202Eta = customEtas["FX-202"] !== undefined ? customEtas["FX-202"] : 45;

  const memoExplanation = stationId === "MEM-A"
    ? `Flight FX-88 ETA is currently set at ${formatMinutesToTime(fx88Eta)} (Sort ready at ${formatMinutesToTime(fx88Eta + 15)}). Under current '${weather}' weather conditions and '${optimizerMode}' driver sequence: holding the fleet to ${formatMinutesToTime(fx88Eta + 15)} incurs $${result.operationalCost.waitWagesUsd} in driver wait wages and ${result.operationalCost.co2EmissionsKg}kg in idling CO2 emissions, but protects priority SLA commitments, achieving a financially optimized balance of $${result.operationalCost.combinedFinancialImpactUsd} total combined impact.`
    : `Flight FX-202 ETA is set at ${formatMinutesToTime(fx202Eta)}. With Denver's steep travel curves under '${weather}' weather and '${optimizerMode}' optimization: dynamic route-level dispatching isolates delays, preventing on-road SLA commit failures on 75% of the regional network.`;

  return [
    {
      modelName: "Gemini 2.5 Flash",
      runTimeMs: 160,
      costUsd: 0.0028,
      tokensUsed: 12500,
      recommendation: `HOLD FLEET UNTIL ${optimalTimeFormatted}`,
      logic: `Gemini 2.5 Flash Recommendation Engine Analysis for ${stationName}:
- Optimal Station Dispatch under ${weather}: ${optimalTimeFormatted} (total penalty: ${minStationPenalty} points).
- Dynamic Failures: ${result.breakdown.leftBehind} left-behind, ${result.breakdown.capacityFailed} capacity-failed, ${result.breakdown.commitFailed} committed-late.
- Financial Target: Minimum combined impact of $${result.operationalCost.combinedFinancialImpactUsd}.
- Operational Tradeoff: ${memoExplanation}
- Action Plan: Hold all vehicles until sort ready at ${optimalTimeFormatted}. Release immediately to prevent compounding on-road commitments late arrivals.`
    },
    {
      modelName: "GLM 5.2 (Open Source / Self-Hosted)",
      runTimeMs: 80,
      costUsd: 0.0006,
      tokensUsed: 12100,
      recommendation: isSelectiveActive 
        ? "SELECTIVE ROUTE HOLD APPROVED" 
        : `SELECTIVE ROUTE HOLD RECOMMENDED (HOLD ONLY PO-AFFECTED ROUTES TO ${optimalTimeFormatted})`,
      logic: `GLM 5.2 Frontier Reasoning Engine Analysis for ${stationName}:
- Optimal Decision: Selective Route-Level Dispatching is superior to Station-Wide Hold.
- Analysis:
  * Station-wide hold to ${optimalTimeFormatted} increases wages by $${result.operationalCost.waitWagesUsd} and CO2 by ${result.operationalCost.co2EmissionsKg}kg.
  * Under '${optimizerMode}' mode and '${weather}' conditions, dispatching standard routes on-time at normal start protects Ground service levels.
  * Hold only the specific priority-affected routes to ${optimalTimeFormatted} (ready time).
- cost-efficiency: GLM 5.2 runs self-hosted on Google Cloud GPU instances at a cost of $0.0006 per call, representing a 4.6x cost reduction relative to commercial API endpoints for high-throughput operational runs.`
    }
  ];
}

export interface OptimalSolveResult {
  dispatchTimeMin: number;
  selectiveRouteHolds: Record<string, number>;
  totalPenalty: number;
  combinedFinancialImpactUsd: number;
  savingsUsd: number;
}

export function solveOptimalDispatch(
  stationId: string,
  customEtas: Record<string, number> = {},
  optimizerMode: "MIN_PENALTY" | "MAX_ON_TIME" | "EXPRESS_ONLY" = "MIN_PENALTY",
  weather: WeatherType = "CLEAR"
): OptimalSolveResult {
  const stations = getStations();
  const station = stations.find((s) => s.id === stationId);
  if (!station) {
    throw new Error(`Station ${stationId} not found`);
  }

  const baseline = simulateDispatch(stationId, station.normalStartMin, {}, {}, optimizerMode, weather);
  const baselineCost = baseline.operationalCost.combinedFinancialImpactUsd;

  let bestCost = baselineCost;
  let bestTime = station.normalStartMin;
  let bestHolds: Record<string, number> = {};

  let weatherEtaDelay = 0;
  if (weather === "RAIN") weatherEtaDelay = 15;
  else if (weather === "SNOW") weatherEtaDelay = 30;
  else if (weather === "THUNDERSTORM") weatherEtaDelay = 45;

  const readyTimes = station.conveyances.map((c) => {
    const base = c.etaMin;
    const custom = customEtas[c.id] !== undefined ? customEtas[c.id] : base;
    return custom + weatherEtaDelay + 15;
  });

  const candidateTimes = [station.normalStartMin, ...readyTimes].filter(t => t >= 30 && t <= 180);

  candidateTimes.forEach((t) => {
    const sim = simulateDispatch(stationId, t, {}, customEtas, optimizerMode, weather);
    if (sim.operationalCost.combinedFinancialImpactUsd < bestCost) {
      bestCost = sim.operationalCost.combinedFinancialImpactUsd;
      bestTime = t;
      bestHolds = {};
    }
  });

  station.conveyances.forEach((c) => {
    const base = c.etaMin;
    const custom = customEtas[c.id] !== undefined ? customEtas[c.id] : base;
    const readyTime = custom + weatherEtaDelay + 15;

    const routesToHold = Array.from(new Set(c.packages.map(p => p.routeId)));
    
    const holds: Record<string, number> = {};
    routesToHold.forEach((rId) => {
      holds[rId] = readyTime;
    });

    const sim = simulateDispatch(stationId, station.normalStartMin, holds, customEtas, optimizerMode, weather);
    if (sim.operationalCost.combinedFinancialImpactUsd < bestCost) {
      bestCost = sim.operationalCost.combinedFinancialImpactUsd;
      bestTime = station.normalStartMin;
      bestHolds = holds;
    }
  });

  return {
    dispatchTimeMin: bestTime,
    selectiveRouteHolds: bestHolds,
    totalPenalty: simulateDispatch(stationId, bestTime, bestHolds, customEtas, optimizerMode, weather).totalPenalty,
    combinedFinancialImpactUsd: bestCost,
    savingsUsd: Math.max(0, baselineCost - bestCost)
  };
}
