import {
  Activity,
  ArrowRight,
  Ban,
  Box,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  ExternalLink,
  LockKeyhole,
  Network,
  PackageCheck,
  RadioTower,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Truck
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type {
  DeliveryMarket,
  DeliveryMarketBundle,
  IntegrationReadiness,
  OrderSide,
  PublicPaperOrder,
  ResearchReference,
  SecurityPosture
} from "./shared/types";

type ReadinessResponse = {
  mode: string;
  pilotInfrastructureReady: boolean;
  adminAuthConfigured: boolean;
  oracleSignerConfigured: boolean;
  liveMoneyMovementAllowed: boolean;
  liveOrderRoutingAllowed: boolean;
  liveFedExApiAllowed: boolean;
  liveOrderSigningAllowed: boolean;
  securityPosture: SecurityPosture;
  integrations: IntegrationReadiness[];
  blockers: string[];
};

type ResearchResponse = {
  references: ResearchReference[];
  thesis: string;
  recommendedNextStep: string;
};

const DEFAULT_TRACKING = "771234567890";

export default function App() {
  const [trackingNumbers, setTrackingNumbers] = useState<string[]>([DEFAULT_TRACKING]);
  const [trackingNumber, setTrackingNumber] = useState(DEFAULT_TRACKING);
  const [bundle, setBundle] = useState<DeliveryMarketBundle | null>(null);
  const [readiness, setReadiness] = useState<ReadinessResponse | null>(null);
  const [research, setResearch] = useState<ResearchResponse | null>(null);
  const [ledger, setLedger] = useState<PublicPaperOrder[]>([]);
  const [selectedMarketId, setSelectedMarketId] = useState<string | null>(null);
  const [contracts, setContracts] = useState(5);
  const [orderSide, setOrderSide] = useState<OrderSide>("YES");
  const [notice, setNotice] = useState<string>("Ready");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void Promise.all([
      fetchJson<{ trackingNumbers: string[] }>("/api/demo-tracking-numbers").then((data) =>
        setTrackingNumbers(data.trackingNumbers)
      ),
      fetchJson<ReadinessResponse>("/api/readiness").then(setReadiness),
      fetchJson<ResearchResponse>("/api/research").then(setResearch),
      fetchJson<{ orders: PublicPaperOrder[] }>("/api/ledger").then((data) => setLedger(data.orders))
    ]);
  }, []);

  useEffect(() => {
    void loadTracking(trackingNumber);
  }, [trackingNumber]);

  useEffect(() => {
    if (bundle?.markets.length && !bundle.markets.some((market) => market.id === selectedMarketId)) {
      setSelectedMarketId(bundle.markets[0].id);
    }
  }, [bundle, selectedMarketId]);

  const selectedMarket = useMemo(
    () => bundle?.markets.find((market) => market.id === selectedMarketId) ?? null,
    [bundle, selectedMarketId]
  );

  async function loadTracking(nextTrackingNumber = trackingNumber) {
    setLoading(true);
    try {
      const data = await fetchJson<DeliveryMarketBundle>(`/api/tracking/${nextTrackingNumber}`);
      setBundle(data);
      setNotice(
        data.cutoff.status === "OPEN"
          ? "Markets open before hub cutoff"
          : data.cutoff.status === "RESOLVED"
            ? "Resolved by delivery event"
            : "Locked at hub cutoff"
      );
    } catch (error) {
      setBundle(null);
      setNotice(error instanceof Error ? error.message : "Tracking lookup failed");
    } finally {
      setLoading(false);
    }
  }

  async function submitPaperOrder(market: DeliveryMarket, side: OrderSide) {
    setOrderSide(side);
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        trackingNumber,
        marketId: market.id,
        side,
        contracts
      })
    });
    const payload = (await response.json()) as {
      order: PublicPaperOrder;
      ledger: PublicPaperOrder[];
    };
    setLedger(payload.ledger);
    setNotice(payload.order.reason);
  }

  const selectedPrice =
    selectedMarket && orderSide === "YES" ? selectedMarket.yesPrice : selectedMarket?.noPrice ?? 0;
  const notional = Math.round(contracts * selectedPrice * 100) / 100;

  return (
    <div className="app-shell">
      <aside className="left-rail">
        <div className="brand-block">
          <div className="brand-mark">
            <Box size={22} />
          </div>
          <div>
            <p className="eyebrow">Internal Concept</p>
            <h1>Delivery Markets Lab</h1>
          </div>
        </div>

        <div className="mode-strip">
          <ShieldCheck size={18} />
          <div>
            <strong>Paper-only simulation</strong>
            <span>No funds, live orders, or real tracking data</span>
          </div>
        </div>

        <section className="rail-section">
          <p className="section-label">Demo Tracking</p>
          <div className="tracking-search">
            <ScanLine size={18} />
            <input
              value={trackingNumber}
              onChange={(event) => setTrackingNumber(event.target.value)}
              aria-label="Tracking number"
            />
          </div>
          <div className="sample-list">
            {trackingNumbers.map((number) => (
              <button
                className={number === trackingNumber ? "sample active" : "sample"}
                key={number}
                onClick={() => setTrackingNumber(number)}
                type="button"
              >
                <PackageCheck size={16} />
                {number}
              </button>
            ))}
          </div>
        </section>

        <section className="rail-section">
          <p className="section-label">Execution Rails</p>
          <RailItem
            icon={<Network size={17} />}
            title="Robinhood Chain"
            value="Testnet resolver target"
          />
          <RailItem
            icon={<RadioTower size={17} />}
            title="Hedera HCS"
            value="Oracle timestamp anchor"
          />
          <RailItem icon={<Activity size={17} />} title="Polymarket" value="Read-only SDK reference" />
          <RailItem icon={<Sparkles size={17} />} title="CoW SDK" value="Intent-signing pattern" />
        </section>
      </aside>

      <main className="workspace">
        <header className="top-bar">
          <div>
            <p className="eyebrow">FedEx x Robinhood Thesis Demo</p>
            <h2>{bundle ? `${bundle.shipment.origin} to ${bundle.shipment.destination}` : "Loading"}</h2>
          </div>
          <div className={`status-pill ${bundle?.cutoff.status.toLowerCase() ?? "open"}`}>
            {bundle?.cutoff.status === "OPEN" ? <Clock3 size={17} /> : <LockKeyhole size={17} />}
            {loading ? "Refreshing" : bundle?.cutoff.status ?? "OPEN"}
          </div>
        </header>

        <section className="security-band">
          <div>
            <p className="eyebrow">Security Remediation</p>
            <h3>Critical audit controls are now fail-closed</h3>
          </div>
          <div className="security-grid">
            <SecurityBadge
              label="Admin"
              value={formatAdminMode(readiness?.securityPosture.adminAuthMode)}
              state={readiness?.securityPosture.adminAuthMode === "dev-open" ? "warn" : "pass"}
            />
            <SecurityBadge
              label="Oracle"
              value={formatOracleMode(readiness?.securityPosture.oracleMode)}
              state={readiness?.securityPosture.oracleMode === "fixture-dev" ? "warn" : "pass"}
            />
            <SecurityBadge
              label="Ledger"
              value={readiness?.securityPosture.publicLedgerRedacted ? "Redacted" : "Raw"}
              state={readiness?.securityPosture.publicLedgerRedacted ? "pass" : "warn"}
            />
          </div>
        </section>

        {bundle ? (
          <>
            <section className="journey-band">
              <div className="journey-copy">
                <div className="service-row">
                  <span>{bundle.shipment.service}</span>
                  <span>{formatPercent(bundle.shipment.confidence)} confidence</span>
                  <span>Promised {formatDate(bundle.shipment.promisedDate)}</span>
                </div>
                <h3>{notice}</h3>
                <p>{bundle.cutoff.reason}</p>
              </div>
              <RouteMap bundle={bundle} />
            </section>

            <section className="market-grid">
              {bundle.markets.map((market) => (
                <article
                  className={selectedMarketId === market.id ? "market-card selected" : "market-card"}
                  key={market.id}
                  onClick={() => setSelectedMarketId(market.id)}
                >
                  <div className="market-head">
                    <span className={`mini-status ${market.status.toLowerCase()}`}>
                      {market.status.replace("_", " ")}
                    </span>
                    <span>{market.kind.replace("_", " ")}</span>
                  </div>
                  <h4>{market.question}</h4>
                  <div className="price-row">
                    <PriceTile label="YES" price={market.yesPrice} />
                    <PriceTile label="NO" price={market.noPrice} />
                  </div>
                  <div className="trade-row">
                    <button
                      disabled={market.status !== "OPEN"}
                      onClick={(event) => {
                        event.stopPropagation();
                        void submitPaperOrder(market, "YES");
                      }}
                      title="Submit paper YES order"
                      type="button"
                    >
                      <CheckCircle2 size={16} />
                      Paper YES
                    </button>
                    <button
                      disabled={market.status !== "OPEN"}
                      onClick={(event) => {
                        event.stopPropagation();
                        void submitPaperOrder(market, "NO");
                      }}
                      title="Submit paper NO order"
                      type="button"
                    >
                      <Ban size={16} />
                      Paper NO
                    </button>
                  </div>
                </article>
              ))}
            </section>

            <section className="timeline-section">
              <div className="section-heading">
                <h3>Oracle Event Tape</h3>
                <span>{bundle.oracleAnchors.length} anchored events</span>
              </div>
              <div className="timeline">
                {bundle.shipment.events.map((event, index) => {
                  const anchor = bundle.oracleAnchors[index];
                  return (
                    <div className="timeline-row" key={`${event.timestamp}-${event.code}`}>
                      <div className="timeline-dot" />
                      <div>
                        <strong>{event.label}</strong>
                        <span>
                          {event.facility} · {event.city}, {event.state} · {formatDateTime(event.timestamp)}
                        </span>
                      </div>
                      <code>{anchor.payloadHash.slice(0, 22)}...</code>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        ) : (
          <section className="empty-state">
            <ScanLine size={28} />
            <h3>No demo shipment loaded</h3>
            <p>{notice}</p>
          </section>
        )}
      </main>

      <aside className="right-rail">
        <section className="order-ticket">
          <div className="section-heading">
            <h3>Paper Ticket</h3>
            <CircleDollarSign size={18} />
          </div>
          {selectedMarket ? (
            <>
              <p>{selectedMarket.question}</p>
              <div className="segmented">
                <button
                  className={orderSide === "YES" ? "active" : ""}
                  onClick={() => setOrderSide("YES")}
                  type="button"
                >
                  YES
                </button>
                <button
                  className={orderSide === "NO" ? "active" : ""}
                  onClick={() => setOrderSide("NO")}
                  type="button"
                >
                  NO
                </button>
              </div>
              <label className="field-label" htmlFor="contracts">
                Contracts
              </label>
              <input
                id="contracts"
                max={100}
                min={1}
                onChange={(event) => setContracts(Number(event.target.value))}
                type="number"
                value={contracts}
              />
              <div className="ticket-total">
                <span>Limit</span>
                <strong>{formatCents(selectedPrice)}</strong>
              </div>
              <div className="ticket-total">
                <span>Paper notional</span>
                <strong>${notional.toFixed(2)}</strong>
              </div>
              <button
                className="primary-action"
                disabled={selectedMarket.status !== "OPEN"}
                onClick={() => void submitPaperOrder(selectedMarket, orderSide)}
                type="button"
              >
                <ArrowRight size={17} />
                Submit Paper Order
              </button>
            </>
          ) : (
            <p>Select a market.</p>
          )}
        </section>

        <section className="rail-section inspector">
          <div className="section-heading">
            <h3>Readiness</h3>
            <ShieldCheck size={18} />
          </div>
          {readiness?.integrations.map((item) => (
            <div className="integration" key={item.id}>
              <div>
                <strong>{item.label}</strong>
                <span>{item.mode}</span>
              </div>
              <a href={item.sourceUrl} rel="noreferrer" target="_blank" title={`${item.label} docs`}>
                <ExternalLink size={15} />
              </a>
            </div>
          ))}
        </section>

        <section className="rail-section inspector">
          <div className="section-heading">
            <h3>Pilot Controls</h3>
            <LockKeyhole size={18} />
          </div>
          <div className="control-list">
            <ControlRow
              label="Admin routes"
              value={formatAdminMode(readiness?.securityPosture.adminAuthMode)}
              status={readiness?.securityPosture.adminAuthMode === "dev-open" ? "warn" : "pass"}
            />
            <ControlRow
              label="Oracle intake"
              value={formatOracleMode(readiness?.securityPosture.oracleMode)}
              status={readiness?.securityPosture.oracleMode === "fixture-dev" ? "warn" : "pass"}
            />
            <ControlRow
              label="Public ledger"
              value={readiness?.securityPosture.publicLedgerRedacted ? "Redacted" : "Raw"}
              status={readiness?.securityPosture.publicLedgerRedacted ? "pass" : "warn"}
            />
            <ControlRow
              label="Rejected orders"
              value={readiness?.securityPosture.rejectedOrdersPersisted ? "Persisted" : "Not persisted"}
              status={readiness?.securityPosture.rejectedOrdersPersisted ? "warn" : "pass"}
            />
            <ControlRow
              label="Rate limits"
              value={readiness?.securityPosture.rateLimitsEnabled ? "Enabled" : "Missing"}
              status={readiness?.securityPosture.rateLimitsEnabled ? "pass" : "warn"}
            />
            <ControlRow
              label="Live order signing"
              value={readiness?.liveOrderSigningAllowed ? "Enabled" : "Blocked"}
              status={readiness?.liveOrderSigningAllowed ? "warn" : "pass"}
            />
            <ControlRow
              label="FedEx production API"
              value={readiness?.liveFedExApiAllowed ? "Enabled" : "Blocked"}
              status={readiness?.liveFedExApiAllowed ? "warn" : "pass"}
            />
          </div>
        </section>

        <section className="rail-section inspector">
          <div className="section-heading">
            <h3>Ledger</h3>
            <Activity size={18} />
          </div>
          <div className="ledger-list">
            {ledger.length ? (
              ledger.slice(0, 5).map((order) => (
                <div className="ledger-row" key={order.id}>
                  <span className={order.status === "ACCEPTED" ? "accepted" : "blocked"}>
                    {order.status}
                  </span>
                  <strong>
                    {order.side} · {order.contracts} @ {formatCents(order.limitPrice)}
                  </strong>
                  <small>{order.reason}</small>
                </div>
              ))
            ) : (
              <p>No paper orders yet.</p>
            )}
          </div>
        </section>

        <section className="rail-section inspector">
          <div className="section-heading">
            <h3>Research</h3>
            <Truck size={18} />
          </div>
          <p>{research?.thesis ?? "Loading research memo."}</p>
        </section>
      </aside>
    </div>
  );
}

function RailItem({
  icon,
  title,
  value
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="rail-item">
      {icon}
      <div>
        <strong>{title}</strong>
        <span>{value}</span>
      </div>
    </div>
  );
}

function RouteMap({ bundle }: { bundle: DeliveryMarketBundle }) {
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

function PriceTile({ label, price }: { label: string; price: number }) {
  return (
    <div className={label === "YES" ? "price-tile yes" : "price-tile no"}>
      <span>{label}</span>
      <strong>{formatCents(price)}</strong>
    </div>
  );
}

function SecurityBadge({
  label,
  value,
  state
}: {
  label: string;
  value: string;
  state: "pass" | "warn";
}) {
  return (
    <div className={`security-badge ${state}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ControlRow({
  label,
  value,
  status
}: {
  label: string;
  value: string;
  status: "pass" | "warn";
}) {
  return (
    <div className="control-row">
      <span>{label}</span>
      <strong className={status}>{value}</strong>
    </div>
  );
}

function formatAdminMode(mode?: SecurityPosture["adminAuthMode"]): string {
  if (mode === "token") return "Token required";
  if (mode === "dev-open") return "Dev override";
  return "Fail-closed";
}

function formatOracleMode(mode?: SecurityPosture["oracleMode"]): string {
  if (mode === "signed") return "Signed only";
  if (mode === "fixture-dev") return "Fixture override";
  return "Fail-closed";
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return (await response.json()) as T;
}

function formatCents(value: number): string {
  return `${Math.round(value * 100)}¢`;
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function formatDate(input: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(input));
}

function formatDateTime(input: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(input));
}
