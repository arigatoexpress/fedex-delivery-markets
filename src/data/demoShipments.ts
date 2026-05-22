import type { Shipment } from "../shared/types";

export const demoShipments: Shipment[] = [
  {
    trackingNumber: "771234567890",
    service: "FedEx Priority Overnight",
    origin: "Austin, TX",
    destination: "Denver, CO",
    promisedDate: "2026-05-18",
    etaWindowStart: "2026-05-18T10:00:00-06:00",
    etaWindowEnd: "2026-05-18T14:00:00-06:00",
    projectedHubArrivalAt: "2026-05-17T08:20:00-05:00",
    status: "IN_TRANSIT",
    confidence: 0.74,
    events: [
      {
        code: "LABEL_CREATED",
        label: "Shipment information sent",
        facility: "Customer shipping system",
        city: "Austin",
        state: "TX",
        timestamp: "2026-05-15T18:42:00-05:00",
        publicDetail: "Label created from a sanitized demo shipment."
      },
      {
        code: "PICKED_UP",
        label: "Picked up",
        facility: "Austin Station",
        city: "Austin",
        state: "TX",
        timestamp: "2026-05-16T09:12:00-05:00",
        publicDetail: "Package accepted into the FedEx network."
      },
      {
        code: "IN_TRANSIT",
        label: "Departed origin sort",
        facility: "Austin Sort",
        city: "Austin",
        state: "TX",
        timestamp: "2026-05-16T13:48:00-05:00",
        publicDetail: "Moving toward the primary hub."
      }
    ]
  },
  {
    trackingNumber: "882345678901",
    service: "FedEx 2Day",
    origin: "Raleigh, NC",
    destination: "Phoenix, AZ",
    promisedDate: "2026-05-19",
    etaWindowStart: "2026-05-19T12:00:00-07:00",
    etaWindowEnd: "2026-05-19T18:00:00-07:00",
    projectedHubArrivalAt: "2026-05-16T10:20:00-05:00",
    status: "HUB_ARRIVAL",
    confidence: 0.82,
    events: [
      {
        code: "PICKED_UP",
        label: "Picked up",
        facility: "Raleigh Station",
        city: "Raleigh",
        state: "NC",
        timestamp: "2026-05-15T16:04:00-04:00",
        publicDetail: "Package accepted into the FedEx network."
      },
      {
        code: "HUB_ARRIVAL",
        label: "Arrived at FedEx hub",
        facility: "Memphis World Hub",
        city: "Memphis",
        state: "TN",
        timestamp: "2026-05-16T10:25:00-05:00",
        publicDetail: "Cutoff event: market creation and trading are locked."
      }
    ]
  },
  {
    trackingNumber: "993456789012",
    service: "FedEx Ground",
    origin: "Seattle, WA",
    destination: "Boulder, CO",
    promisedDate: "2026-05-15",
    etaWindowStart: "2026-05-15T12:00:00-06:00",
    etaWindowEnd: "2026-05-15T16:00:00-06:00",
    projectedHubArrivalAt: "2026-05-14T22:30:00-06:00",
    actualDeliveryAt: "2026-05-15T14:14:00-06:00",
    status: "DELIVERED",
    confidence: 1,
    events: [
      {
        code: "HUB_ARRIVAL",
        label: "Arrived at destination hub",
        facility: "Denver Hub",
        city: "Denver",
        state: "CO",
        timestamp: "2026-05-14T22:26:00-06:00",
        publicDetail: "Market cutoff was triggered before final-mile movement."
      },
      {
        code: "OUT_FOR_DELIVERY",
        label: "On FedEx vehicle for delivery",
        facility: "Boulder Station",
        city: "Boulder",
        state: "CO",
        timestamp: "2026-05-15T08:41:00-06:00",
        publicDetail: "Package moved to final-mile route."
      },
      {
        code: "DELIVERED",
        label: "Delivered",
        facility: "Recipient address",
        city: "Boulder",
        state: "CO",
        timestamp: "2026-05-15T14:14:00-06:00",
        publicDetail: "Delivered event resolves the demo market set."
      }
    ]
  }
];

export function findDemoShipment(trackingNumber: string): Shipment | undefined {
  const normalized = trackingNumber.replace(/\D/g, "");
  return demoShipments.find((shipment) => shipment.trackingNumber === normalized);
}
