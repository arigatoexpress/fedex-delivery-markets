import { describe, it, expect } from "vitest";
import { simulateDispatch, getStations, solveOptimalDispatch } from "./dispatchEngine";

describe("dispatchEngine simulation", () => {
  it("loads station configurations correctly", () => {
    const stations = getStations();
    expect(stations).toHaveLength(2);
    expect(stations[0].id).toBe("MEM-A");
    expect(stations[1].id).toBe("DEN-B");
  });

  it("calculates left-behind vs capacity tradeoffs accurately", () => {
    const earlySim = simulateDispatch("MEM-A", 60, {});
    expect(earlySim.leftBehindCount).toBeGreaterThan(0);
    expect(earlySim.capacityFailedCount).toBe(0); 

    const optimalSim = simulateDispatch("MEM-A", 90, {});
    expect(optimalSim.leftBehindCount).toBeLessThan(earlySim.leftBehindCount);
    
    const denSim = simulateDispatch("DEN-B", 30, {});
    expect(denSim.totalVolume).toBeGreaterThan(0);
  });

  it("applies selective route holds correctly", () => {
    const sim = simulateDispatch("MEM-A", 60, { "101": 90 });
    
    const r101 = sim.routes.find((r) => r.routeId === "101");
    const r102 = sim.routes.find((r) => r.routeId === "102");

    expect(r101).toBeDefined();
    expect(r102).toBeDefined();

    expect(r101?.loadedPackagesCount).toBe(61); 
    expect(r101?.leftBehindPackagesCount).toBe(31); 

    expect(r102?.loadedPackagesCount).toBe(68); 
    expect(r102?.leftBehindPackagesCount).toBe(34); 
  });

  it("applies weather delays and multipliers accurately", () => {
    const clearSim = simulateDispatch("MEM-A", 60, {}, {}, "MIN_PENALTY", "CLEAR");
    const snowSim = simulateDispatch("MEM-A", 60, {}, {}, "MIN_PENALTY", "SNOW");
    
    expect(snowSim.totalPenalty).toBeGreaterThanOrEqual(clearSim.totalPenalty);
  });

  it("solves for optimal dispatch configurations", () => {
    const solveResult = solveOptimalDispatch("MEM-A", {}, "MIN_PENALTY", "CLEAR");
    
    expect(solveResult.dispatchTimeMin).toBeGreaterThanOrEqual(60);
    expect(solveResult.savingsUsd).toBeGreaterThanOrEqual(0);
  });

  it("executes custom compiler sorting functions successfully", () => {
    const reverseSorter = (stops: any[]) => [...stops].reverse();
    
    const baseSim = simulateDispatch("MEM-A", 150, {}, {}, "MIN_PENALTY", "CLEAR");
    const customSim = simulateDispatch("MEM-A", 150, {}, {}, "MIN_PENALTY", "CLEAR", reverseSorter);
    
    expect(customSim.totalPenalty).toBeGreaterThan(baseSim.totalPenalty);
  });
});
