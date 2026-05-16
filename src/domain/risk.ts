import { z } from "zod";
import type { ParticipantProfile, RiskCheck, RiskDecision } from "../shared/types";

export const participantProfileSchema = z.object({
  accountId: z.string().min(3).max(80),
  role: z.enum([
    "recipient",
    "shipper",
    "third_party",
    "fedex_employee",
    "driver_or_station_operator",
    "market_maker",
    "admin"
  ]),
  jurisdiction: z.string().min(2).max(40),
  relationToShipment: z.enum(["none", "shipper", "recipient", "operations", "unknown"]),
  employeeOrContractor: z.boolean()
});

export function evaluateParticipantRisk(profile: ParticipantProfile): RiskDecision {
  const checks: RiskCheck[] = [
    {
      id: "paper-mode",
      status: "pass",
      label: "Paper-only environment",
      detail: "The application records simulated orders only; no funds or live exchange route exist."
    }
  ];

  if (profile.employeeOrContractor || profile.role === "fedex_employee") {
    checks.push({
      id: "employee-restriction",
      status: "block",
      label: "Employee and contractor restriction",
      detail:
        "FedEx employees and contractors should be excluded from any real-money delivery market pilot."
    });
  }

  if (profile.role === "driver_or_station_operator" || profile.relationToShipment === "operations") {
    checks.push({
      id: "operations-restriction",
      status: "block",
      label: "Operational influence restriction",
      detail:
        "Drivers, station operators, and operational staff can influence timing and must be blocked from real-money markets."
    });
  }

  if (profile.relationToShipment === "recipient" || profile.relationToShipment === "shipper") {
    checks.push({
      id: "shipment-party-risk",
      status: "warn",
      label: "Shipment-party influence risk",
      detail:
        "Recipients and shippers are central to the product thesis, but real-money eligibility needs compliance-approved limits and manipulation controls."
    });
  }

  if (!profile.jurisdiction.startsWith("US-")) {
    checks.push({
      id: "jurisdiction-review",
      status: "block",
      label: "Jurisdiction review",
      detail: "Pilot availability cannot be inferred outside a reviewed US state-by-state rollout."
    });
  }

  const hasBlock = checks.some((check) => check.status === "block");
  const hasWarn = checks.some((check) => check.status === "warn");

  checks.push({
    id: "real-money-status",
    status: hasBlock || hasWarn ? "block" : "warn",
    label: "Real-money status",
    detail:
      hasBlock || hasWarn
        ? "This profile is eligible for paper simulation only until legal/compliance approval changes the rule set."
        : "This profile still requires venue onboarding, KYC, geofence, and rulebook approval before real-money access."
  });

  return {
    eligibleForPaper: true,
    eligibleForRealMoneyPilot: false,
    checks
  };
}
