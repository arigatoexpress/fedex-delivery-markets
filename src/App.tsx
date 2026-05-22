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
  Truck,
  Wallet
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type {
  DeliveryMarket,
  DeliveryMarketBundle,
  IntegrationReadiness,
  MarketStatus,
  OrderSide,
  PrivateMarketQuote,
  PublicPaperOrder,
  RecipientAccessGrant,
  RecipientAccessPolicy,
  ResearchReference,
  SecurityPosture,
  TestnetDeploymentPlan,
  TestnetTransactionPreview,
  VenueRoute,
  WalletReadiness,
  WalletRailStatus
} from "./shared/types";

declare global {
  interface Window {
    ethereum?: {
      request(input: { method: string; params?: unknown[] }): Promise<unknown>;
    };
  }
}

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
  walletReadiness: WalletReadiness;
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
  const [accessPolicy, setAccessPolicy] = useState<RecipientAccessPolicy | null>(null);
  const [accessGrant, setAccessGrant] = useState<RecipientAccessGrant | null>(null);
  const [quote, setQuote] = useState<PrivateMarketQuote | null>(null);
  const [testnetPreviews, setTestnetPreviews] = useState<TestnetTransactionPreview[]>([]);
  const [deploymentPlan, setDeploymentPlan] = useState<TestnetDeploymentPlan | null>(null);
  const [walletReadiness, setWalletReadiness] = useState<WalletReadiness | null>(null);
  const [venueRoutes, setVenueRoutes] = useState<VenueRoute[]>([]);
  const [walletAddress, setWalletAddress] = useState("0x1111111111111111111111111111111111111111");
  const [claimCode, setClaimCode] = useState("AUSTIN-DENVER-RECIPIENT");
  const [accessGrantSecret, setAccessGrantSecret] = useState<string | null>(null);
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
      fetchJson<{ walletReadiness: WalletReadiness }>("/api/wallet/readiness").then((data) =>
        setWalletReadiness(data.walletReadiness)
      ),
      fetchJson<ResearchResponse>("/api/research").then(setResearch),
      fetchJson<{ orders: PublicPaperOrder[] }>("/api/ledger").then((data) => setLedger(data.orders)),
      fetchJson<{ routes: VenueRoute[] }>("/api/venues/private-routes").then((data) =>
        setVenueRoutes(data.routes)
      ),
      fetchJson<{ deploymentPlan: TestnetDeploymentPlan }>("/api/testnet/deployment-plan").then(
        (data) => setDeploymentPlan(data.deploymentPlan)
      )
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

  useEffect(() => {
    if (!selectedMarket) {
      setQuote(null);
      return;
    }
    void refreshQuote(selectedMarket, orderSide, contracts);
  }, [selectedMarket, orderSide, contracts]);

  async function loadTracking(nextTrackingNumber = trackingNumber) {
    setLoading(true);
    try {
      const [data, policyPayload] = await Promise.all([
        fetchJson<DeliveryMarketBundle>(`/api/tracking/${nextTrackingNumber}`),
        fetchJson<{ policy: RecipientAccessPolicy }>(`/api/access/policy/${nextTrackingNumber}`)
      ]);
      setBundle(data);
      setAccessPolicy(policyPayload.policy);
      setAccessGrant(null);
      setAccessGrantSecret(null);
      setTestnetPreviews([]);
      if (policyPayload.policy.allowedWallets[0]) {
        setWalletAddress(policyPayload.policy.allowedWallets[0]);
      }
      if (policyPayload.policy.demoClaimCode) {
        setClaimCode(policyPayload.policy.demoClaimCode);
      }
      setNotice(
        data.cutoff.status === "OPEN"
          ? "Betting is open"
          : data.cutoff.status === "RESOLVED"
            ? "Package delivered"
            : "Betting is closed"
      );
    } catch (error) {
      setBundle(null);
      setAccessPolicy(null);
      setNotice(error instanceof Error ? error.message : "Tracking lookup failed");
    } finally {
      setLoading(false);
    }
  }

  async function refreshQuote(
    market: DeliveryMarket,
    side: OrderSide,
    nextContracts: number,
    quoteTrackingNumber = bundle?.shipment.trackingNumber ?? trackingNumber
  ) {
    try {
      const payload = await postJson<{ quote: PrivateMarketQuote }>("/api/amm/quote", {
        trackingNumber: quoteTrackingNumber,
        marketId: market.id,
        side,
        contracts: nextContracts
      });
      setQuote(payload.quote);
    } catch {
      setQuote(null);
    }
  }

  async function claimRecipientAccess() {
    const payload = await postJson<{
      grant: RecipientAccessGrant;
      accessGrantSecret?: string;
    }>("/api/access/claim", {
      trackingNumber,
      walletAddress,
      claimCode
    });
    setAccessGrant(payload.grant);
    setAccessGrantSecret(payload.accessGrantSecret ?? null);
    setNotice(payload.grant.reason);
  }

  async function ensureRecipientAccess() {
    if (accessGrant?.status === "GRANTED" && accessGrantSecret) {
      return { grant: accessGrant, accessGrantSecret };
    }

    const payload = await postJson<{
      grant: RecipientAccessGrant;
      accessGrantSecret?: string;
    }>("/api/access/claim", {
      trackingNumber,
      walletAddress,
      claimCode
    });
    setAccessGrant(payload.grant);
    setAccessGrantSecret(payload.accessGrantSecret ?? null);
    if (payload.grant.status !== "GRANTED" || !payload.accessGrantSecret) {
      throw new Error(payload.grant.reason);
    }
    return { grant: payload.grant, accessGrantSecret: payload.accessGrantSecret };
  }

  async function connectWallet() {
    if (!window.ethereum) {
      setNotice("MetaMask is not available in this browser session. Use the demo recipient wallet.");
      return;
    }
    const accounts = (await window.ethereum.request({ method: "eth_requestAccounts" })) as string[];
    if (accounts[0]) {
      setWalletAddress(accounts[0]);
      setNotice("Wallet address connected for recipient access check.");
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

  async function submitPrivateOrder(market: DeliveryMarket, side: OrderSide) {
    const grantPayload = await ensureRecipientAccess();
    const payload = await postJson<{
      order: PublicPaperOrder;
      quote: PrivateMarketQuote;
      ledger: PublicPaperOrder[];
      testnetPreviews: TestnetTransactionPreview[];
    }>("/api/private/orders", {
      trackingNumber,
      marketId: market.id,
      side,
      contracts,
      accessGrantId: grantPayload.grant.id,
      accessGrantSecret: grantPayload.accessGrantSecret
    });
    setQuote(payload.quote);
    setLedger(payload.ledger);
    setTestnetPreviews(payload.testnetPreviews);
    setNotice("Paper bet placed. No money moved.");
  }

  async function previewTestnetCalldata(market: DeliveryMarket, side: OrderSide) {
    if (!accessGrant || accessGrant.status !== "GRANTED" || !accessGrantSecret) {
      setNotice("Claim recipient access before previewing testnet calldata.");
      return;
    }
    const payload = await postJson<{
      quote: PrivateMarketQuote;
      testnetPreviews: TestnetTransactionPreview[];
    }>("/api/testnet/calldata", {
      trackingNumber,
      marketId: market.id,
      side,
      contracts,
      accessGrantId: accessGrant.id,
      accessGrantSecret
    });
    setQuote(payload.quote);
    setTestnetPreviews(payload.testnetPreviews);
    setNotice("Robinhood Chain / Arbitrum-compatible calldata preview generated. Nothing was signed or broadcast.");
  }

  const selectedPrice =
    quote?.limitPrice ??
    (selectedMarket && orderSide === "YES" ? selectedMarket.yesPrice : selectedMarket?.noPrice ?? 0);
  const notional = quote?.totalCostUsd ?? Math.round(contracts * selectedPrice * 100) / 100;
  const accessGranted = accessGrant?.status === "GRANTED";
  const acceptedNotional = ledger
    .filter((order) => order.status === "ACCEPTED")
    .reduce((total, order) => total + order.notionalUsd, 0);
  const paperBuyingPower = Math.max(0, 10_000 - acceptedNotional);
  const openMarketCount = bundle?.markets.filter((market) => market.status === "OPEN").length ?? 0;
  const renderRecipientAccessTicket = (idSuffix: string, extraClass = "") => (
    <section className={`order-ticket recipient-ticket ${extraClass}`}>
      <div className="section-heading">
        <h3>Package Check</h3>
        <LockKeyhole size={18} />
      </div>
      <label className="field-label" htmlFor={`wallet-address-${idSuffix}`}>
        Demo recipient wallet
      </label>
      <input
        id={`wallet-address-${idSuffix}`}
        onChange={(event) => setWalletAddress(event.target.value)}
        value={walletAddress}
      />
      <label className="field-label" htmlFor={`claim-code-${idSuffix}`}>
        Demo claim code
      </label>
      <input
        id={`claim-code-${idSuffix}`}
        onChange={(event) => setClaimCode(event.target.value)}
        value={claimCode}
      />
      <div className="dual-action">
        <button onClick={() => void connectWallet()} type="button">
          MetaMask
        </button>
        <button onClick={() => void claimRecipientAccess()} type="button">
          Verify
        </button>
      </div>
      <div className={`grant-status ${accessGranted ? "granted" : "pending"}`}>
        <strong>{accessGranted ? "Ready to bet" : "Auto-filled for demo"}</strong>
        <span>{accessGrant?.reason ?? "Only the package recipient can place the real version of this bet."}</span>
      </div>
    </section>
  );
  const renderPrivateAmmTicket = (idSuffix: string, extraClass = "") => (
    <section className={`order-ticket ${extraClass}`}>
      <div className="section-heading">
        <h3>Place a Paper Bet</h3>
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
          <label className="field-label" htmlFor={`contracts-${idSuffix}`}>
            Bet size
          </label>
          <input
            id={`contracts-${idSuffix}`}
            max={100}
            min={1}
            onChange={(event) => setContracts(Number(event.target.value))}
            type="number"
            value={contracts}
          />
          <div className="ticket-total">
            <span>Price</span>
            <strong>{formatCents(selectedPrice)}</strong>
          </div>
          <div className="ticket-total">
            <span>Paper cost</span>
            <strong>${notional.toFixed(2)}</strong>
          </div>
          {quote ? (
            <div className="quote-metrics">
              <span>Market price {formatCents(quote.spotPrice)}</span>
              <span>Est. cost ${quote.totalCostUsd.toFixed(2)}</span>
            </div>
          ) : null}
          <button
            className="primary-action"
            disabled={selectedMarket.status !== "OPEN"}
            onClick={() => void submitPrivateOrder(selectedMarket, orderSide)}
            type="button"
          >
            <ArrowRight size={17} />
            Place Paper Bet
          </button>
          <button
            className="secondary-action"
            disabled={accessGranted}
            onClick={() => void claimRecipientAccess()}
            type="button"
          >
            {accessGranted ? "Package Verified" : "Verify Package"}
          </button>
        </>
      ) : (
        <p>Select a market.</p>
      )}
    </section>
  );

  return (
    <div className="app-shell">
      <aside className="left-rail">
        <div className="brand-block">
          <div className="brand-mark">
            <Box size={22} />
          </div>
          <div>
            <p className="eyebrow">Paper Money Demo</p>
            <h1>Delivery Bet</h1>
          </div>
        </div>

        <div className="mode-strip">
          <ShieldCheck size={18} />
          <div>
            <strong>Practice bets only</strong>
            <span>No real money or real market orders</span>
          </div>
        </div>

        <section className="rail-section">
          <p className="section-label">Choose Package</p>
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
      </aside>

      <main className="workspace">
        <header className="top-bar">
          <div>
            <p className="eyebrow">Bet on this delivery</p>
            <h2>{bundle ? `${bundle.shipment.origin} to ${bundle.shipment.destination}` : "Loading package"}</h2>
          </div>
          <div className={`status-pill ${bundle?.cutoff.status.toLowerCase() ?? "open"}`}>
            {bundle?.cutoff.status === "OPEN" ? <Clock3 size={17} /> : <LockKeyhole size={17} />}
            {loading ? "Refreshing" : formatMarketStatus(bundle?.cutoff.status)}
          </div>
        </header>

        <section className="account-summary">
          <div>
            <span>Paper balance</span>
            <strong>${paperBuyingPower.toLocaleString("en-US", { maximumFractionDigits: 2 })}</strong>
          </div>
          <div>
            <span>Available bets</span>
            <strong>{openMarketCount}</strong>
          </div>
          <div>
            <span>Your pick</span>
            <strong>{formatCents(selectedPrice)} {orderSide}</strong>
          </div>
          <div>
            <span>Mode</span>
            <strong>Paper</strong>
          </div>
        </section>

        <section className="demo-note">
          <div>
            <p className="eyebrow">Demo note</p>
            <h3>This is a paper-money demo for the meeting.</h3>
            <p>No real funds, no real FedEx data, and no live market order will be sent.</p>
          </div>
        </section>

        <section className="private-market-band">
          <div>
            <p className="eyebrow">How it works</p>
            <h3>{accessPolicy?.packageAlias ?? "Private package market"}</h3>
            <p>
              Pick an outcome, choose YES or NO, and place a paper bet before the hub cutoff.
            </p>
          </div>
          <div className="private-market-stats">
            <SecurityBadge
              label="Step 1"
              value="Pick"
              state="pass"
            />
            <SecurityBadge
              label="Step 2"
              value="Bet"
              state="pass"
            />
            <SecurityBadge label="Step 3" value="Watch" state="pass" />
          </div>
        </section>

        <div className="mobile-ticket-stack">
          {renderPrivateAmmTicket("mobile", "mobile-ticket")}
          {renderRecipientAccessTicket("mobile", "mobile-ticket")}
        </div>

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
                <p>{formatCutoffReason(bundle)}</p>
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
                      {formatMarketStatus(market.status)}
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
                        setSelectedMarketId(market.id);
                        setOrderSide("YES");
                        void refreshQuote(market, "YES", contracts, bundle.shipment.trackingNumber);
                      }}
                      title="Pick YES"
                      type="button"
                    >
                      <CheckCircle2 size={16} />
                      Pick YES
                    </button>
                    <button
                      disabled={market.status !== "OPEN"}
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedMarketId(market.id);
                        setOrderSide("NO");
                        void refreshQuote(market, "NO", contracts, bundle.shipment.trackingNumber);
                      }}
                      title="Pick NO"
                      type="button"
                    >
                      <Ban size={16} />
                      Pick NO
                    </button>
                  </div>
                </article>
              ))}
            </section>

            <section className="timeline-section">
              <div className="section-heading">
                <h3>Package Updates</h3>
                <span>{bundle.shipment.events.length} updates</span>
              </div>
              <div className="timeline">
                {bundle.shipment.events.map((event) => {
                  return (
                    <div className="timeline-row" key={`${event.timestamp}-${event.code}`}>
                      <div className="timeline-dot" />
                      <div>
                        <strong>{event.label}</strong>
                        <span>
                          {event.facility} · {event.city}, {event.state} · {formatDateTime(event.timestamp)}
                        </span>
                      </div>
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
        {renderPrivateAmmTicket("desktop", "desktop-ticket")}
        {renderRecipientAccessTicket("desktop", "desktop-ticket")}

        <section className="rail-section inspector meeting-card">
          <div className="section-heading">
            <h3>What You Can Say</h3>
            <ShieldCheck size={18} />
          </div>
          <p>
            Customers can make a paper prediction on when their own package arrives. The real version
            would keep betting private to the recipient and close before operational milestones.
          </p>
        </section>

        <section className="rail-section inspector">
          <div className="section-heading">
            <h3>Recent Paper Bets</h3>
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
                  <small>Paper bet recorded. No money moved.</small>
                </div>
              ))
            ) : (
              <p>No paper bets yet.</p>
            )}
          </div>
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

function formatWalletStatus(status: WalletRailStatus): string {
  if (status === "online") return "Online";
  if (status === "needs_funding") return "Needs testnet gas";
  if (status === "not_configured") return "Not configured";
  if (status === "degraded") return "RPC issue";
  if (status === "blocked") return "Blocked";
  return "Not required";
}

function formatMarketStatus(status?: MarketStatus): string {
  if (status === "CUTOFF_LOCKED") return "Closed";
  if (status === "RESOLVED") return "Delivered";
  return "Open";
}

function formatCutoffReason(bundle: DeliveryMarketBundle): string {
  if (bundle.cutoff.status === "OPEN") {
    return "Betting is open until this package reaches the cutoff point.";
  }
  if (bundle.cutoff.status === "RESOLVED") {
    return "The delivery is complete, so the paper market is resolved.";
  }
  return "This package has reached the cutoff point, so betting is closed.";
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return (await response.json()) as T;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  const payload = (await response.json()) as T;
  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? String((payload as { error: unknown }).error)
        : `Request failed: ${response.status}`;
    throw new Error(message);
  }
  return payload;
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
