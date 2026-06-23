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
import { MarketCard } from "./components/MarketCard";
import { OrderTicket } from "./components/OrderTicket";
import { RouteMap } from "./components/RouteMap";
import { Ledger } from "./components/Ledger";
import { AccessTicket } from "./components/AccessTicket";
import { fetchJson, postJson, formatCents, formatDate, formatDateTime, formatMarketStatus, formatPercent } from "./shared/format";

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
          <OrderTicket
            selectedMarket={selectedMarket}
            orderSide={orderSide}
            contracts={contracts}
            selectedPrice={selectedPrice}
            notional={notional}
            quote={quote}
            onSideChange={setOrderSide}
            onContractsChange={setContracts}
            onSubmit={submitPrivateOrder}
            onVerify={claimRecipientAccess}
            accessGranted={accessGranted}
            idSuffix="mobile"
            extraClass="mobile-ticket"
          />
          <AccessTicket
            walletAddress={walletAddress}
            claimCode={claimCode}
            accessGranted={accessGranted}
            accessGrant={accessGrant}
            onWalletChange={setWalletAddress}
            onClaimCodeChange={setClaimCode}
            onConnectWallet={connectWallet}
            onClaimAccess={claimRecipientAccess}
            idSuffix="mobile"
            extraClass="mobile-ticket"
          />
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
                <MarketCard
                  key={market.id}
                  market={market}
                  selected={selectedMarketId === market.id}
                  onSelect={() => setSelectedMarketId(market.id)}
                  onPickYes={(event) => {
                    event.stopPropagation();
                    setSelectedMarketId(market.id);
                    setOrderSide("YES");
                    void refreshQuote(market, "YES", contracts, bundle.shipment.trackingNumber);
                  }}
                  onPickNo={(event) => {
                    event.stopPropagation();
                    setSelectedMarketId(market.id);
                    setOrderSide("NO");
                    void refreshQuote(market, "NO", contracts, bundle.shipment.trackingNumber);
                  }}
                />
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
                          {event.facility} &middot; {event.city}, {event.state} &middot; {formatDateTime(event.timestamp)}
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
        <OrderTicket
          selectedMarket={selectedMarket}
          orderSide={orderSide}
          contracts={contracts}
          selectedPrice={selectedPrice}
          notional={notional}
          quote={quote}
          onSideChange={setOrderSide}
          onContractsChange={setContracts}
          onSubmit={submitPrivateOrder}
          onVerify={claimRecipientAccess}
          accessGranted={accessGranted}
          idSuffix="desktop"
          extraClass="desktop-ticket"
        />
        <AccessTicket
          walletAddress={walletAddress}
          claimCode={claimCode}
          accessGranted={accessGranted}
          accessGrant={accessGrant}
          onWalletChange={setWalletAddress}
          onClaimCodeChange={setClaimCode}
          onConnectWallet={connectWallet}
          onClaimAccess={claimRecipientAccess}
          idSuffix="desktop"
          extraClass="desktop-ticket"
        />

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

        <Ledger orders={ledger} />
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

function formatCutoffReason(bundle: DeliveryMarketBundle): string {
  if (bundle.cutoff.status === "OPEN") {
    return "Betting is open until this package reaches the cutoff point.";
  }
  if (bundle.cutoff.status === "RESOLVED") {
    return "The delivery is complete, so the paper market is resolved.";
  }
  return "This package has reached the cutoff point, so betting is closed.";
}
