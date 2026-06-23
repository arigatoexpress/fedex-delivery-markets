import type { DeliveryMarketBundle } from "../shared/types";

interface RouteMapProps {
  bundle: DeliveryMarketBundle;
}

export function RouteMap({ bundle }: RouteMapProps) {
  const statusIndex =
    bundle.cutoff.status === "RESOLVED" ? 3 : bundle.cutoff.status === "CUTOFF_LOCKED" ? 2 : 1;

  return (
    <div className="route-map" aria-label="Shipment route visualization">
      <svg viewBox="0 0 560 220" role="img">
        <defs>
          <linearGradient id="routeGradient" x1="0" x2="1">
            <stop offset="0%" stopColor="#4d148c" />
            <stop offset="45%" stopColor="#ff6600" />
            <stop offset="100%" stopColor="#00a86b" />
          </linearGradient>
        </defs>
        <path
          className="route-shadow"
          d="M70 155 C170 40, 260 190, 360 78 S500 95, 506 62"
          fill="none"
          strokeWidth="18"
        />
        <path
          d="M70 155 C170 40, 260 190, 360 78 S500 95, 506 62"
          fill="none"
          stroke="url(#routeGradient)"
          strokeLinecap="round"
          strokeWidth="9"
        />
        {[{ x: 70, y: 155 }, { x: 230, y: 111 }, { x: 365, y: 78 }, { x: 506, y: 62 }].map(
          (point, index) => (
            <g key={`${point.x}-${point.y}`}>
              <circle
                cx={point.x}
                cy={point.y}
                fill={index <= statusIndex ? "#ffffff" : "#e7e1ee"}
                r="17"
                stroke={index <= statusIndex ? "#4d148c" : "#c8bdd8"}
                strokeWidth="5"
              />
              {index <= statusIndex ? (
                <circle cx={point.x} cy={point.y} fill="#ff6600" r="6" />
              ) : null}
            </g>
          )
        )}
        <text x="42" y="196">{bundle.shipment.origin}</text>
        <text x="326" y="48">Hub cutoff</text>
        <text x="438" y="34">{bundle.shipment.destination}</text>
      </svg>
    </div>
  );
}
