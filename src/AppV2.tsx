import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  LockKeyhole,
  PackageCheck,
  ScanLine,
  ShieldCheck,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type {
  DeliveryMarket,
  DeliveryMarketBundle,
  OrderSide,
  PrivateMarketQuote,
  PublicPaperOrder,
  RecipientAccessGrant,
  RecipientAccessPolicy,
} from "./shared/types";

const DEFAULT_TRACKING = "771234567890";
const DEFAULT_WALLET = "0x1111111111111111111111111111111111111111";
const DEFAULT_CLAIM = "AUSTIN-DENVER-RECIPIENT";

export default function AppV2() {
  const [trackingNumbers, setTrackingNumbers] = useState<string[]>([DEFAULT_TRACKING]);
  const [trackingNumber, setTrackingNumber] = useState(DEFAULT_TRACKING);
  const [trackingInput, setTrackingInput] = useState(DEFAULT_TRACKING);
  const [bundle, setBundle] = useState<DeliveryMarketBundle | null>(null);
  const [policy, setPolicy] = useState<RecipientAccessPolicy | null>(null);
  const [grant, setGrant] = useState<RecipientAccessGrant | null>(null);
  const [grantSecret, setGrantSecret] = useState<string | null>(null);
  const [ledger, setLedger] = useState<PublicPaperOrder[]>([]);
  const [selectedMarketId, setSelectedMarketId] = useState<string | null>(null);
  const [side, setSide] = useState<OrderSide>("YES");
  const [contracts, setContracts] = useState(5);
  const [quote, setQuote] = useState<PrivateMarketQuote | null>(null);
  const [walletAddress, setWalletAddress] = useState(DEFAULT_WALLET);
  const [claimCode, setClaimCode] = useState(DEFAULT_CLAIM);
  const [notice, setNotice] = useState("Loading demo…");
  const [loading, setLoading] = useState(true);
  const [startupWarnings, setStartupWarnings] = useState<string[]>([]);

  useEffect(() => {
    void loadStartup();
  }, []);

  useEffect(() => {
    void loadTracking(trackingNumber);
  }, [trackingNumber]);

  const selectedMarket = useMemo(
    () => bundle?.markets.find((market) => market.id === selectedMarketId) ?? bundle?.markets[0] ?? null,
    [bundle, selectedMarketId],
  );

  useEffect(() => {
    if (!selectedMarket) {
      setQuote(null);
      return;
    }
    setSelectedMarketId(selectedMarket.id);
    void refreshQuote(selectedMarket, side, contracts);
  }, [selectedMarket?.id, side, contracts]);

  async function loadStartup() {
    const warnings: string[] = [];
    const [trackingResult, ledgerResult] = await Promise.allSettled([
      fetchJson<{ trackingNumbers: string[] }>("/api/demo-tracking-numbers"),
      fetchJson<{ orders: PublicPaperOrder[] }>("/api/ledger"),
    ]);

    if (trackingResult.status === "fulfilled" && trackingResult.value.trackingNumbers.length) {
      setTrackingNumbers(trackingResult.value.trackingNumbers);
    } else if (trackingResult.status === "rejected") {
      warnings.push("Demo package list unavailable; the default fixture is still usable.");
    }

    if (ledgerResult.status === "fulfilled") {
      setLedger(ledgerResult.value.orders);
    } else {
      warnings.push("Recent paper bets are temporarily unavailable.");
    }

    setStartupWarnings(warnings);
  }

  async function loadTracking(nextTrackingNumber: string) {
    setLoading(true);
    setGrant(null);
    setGrantSecret(null);
    setQuote(null);

    try {
      const [bundleResult, policyResult] = await Promise.allSettled([
        fetchJson<DeliveryMarketBundle>(`/api/tracking/${nextTrackingNumber}`),
        fetchJson<{ policy: RecipientAccessPolicy }>(`/api/access/policy/${nextTrackingNumber}`),
      ]);

      if (bundleResult.status === "rejected") throw bundleResult.reason;
      setBundle(bundleResult.value);
      setSelectedMarketId(bundleResult.value.markets[0]?.id ?? null);

      if (policyResult.status === "fulfilled") {
        setPolicy(policyResult.value.policy);
        setWalletAddress(policyResult.value.policy.allowedWallets[0] ?? DEFAULT_WALLET);
        setClaimCode(policyResult.value.policy.demoClaimCode ?? DEFAULT_CLAIM);
      } else {
        setPolicy(null);
      }

      setNotice(statusHeadline(bundleResult.value));
    } catch (error) {
      setBundle(null);
      setPolicy(null);
      setNotice(error instanceof Error ? error.message : "Demo package lookup failed");
    } finally {
      setLoading(false);
    }
  }

  function submitLookup(event: FormEvent) {
    event.preventDefault();
    const next = trackingInput.trim();
    if (!next || next === trackingNumber) return;
    setTrackingNumber(next);
  }

  function chooseFixture(number: string) {
    setTrackingInput(number);
    setTrackingNumber(number);
  }

  async function refreshQuote(market: DeliveryMarket, orderSide: OrderSide, nextContracts: number) {
    try {
      const payload = await postJson<{ quote: PrivateMarketQuote }>("/api/amm/quote", {
        trackingNumber,
        marketId: market.id,
        side: orderSide,
        contracts: nextContracts,
      });
      setQuote(payload.quote);
    } catch {
      setQuote(null);
    }
  }

  async function ensureAccess() {
    if (grant?.status === "GRANTED" && grantSecret) return { grant, grantSecret };

    const payload = await postJson<{ grant: RecipientAccessGrant; accessGrantSecret?: string }>(
      "/api/access/claim",
      { trackingNumber, walletAddress, claimCode },
    );
    setGrant(payload.grant);
    setGrantSecret(payload.accessGrantSecret ?? null);
    if (payload.grant.status !== "GRANTED" || !payload.accessGrantSecret) {
      throw new Error(payload.grant.reason);
    }
    return { grant: payload.grant, grantSecret: payload.accessGrantSecret };
  }

  async function claimAccess() {
    try {
      const access = await ensureAccess();
      setNotice(access.grant.reason);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Package verification failed");
    }
  }

  async function placePaperBet() {
    if (!selectedMarket || selectedMarket.status !== "OPEN") return;
    try {
      const access = await ensureAccess();
      const payload = await postJson<{
        order: PublicPaperOrder;
        quote: PrivateMarketQuote;
        ledger: PublicPaperOrder[];
      }>("/api/private/orders", {
        trackingNumber,
        marketId: selectedMarket.id,
        side,
        contracts,
        accessGrantId: access.grant.id,
        accessGrantSecret: access.grantSecret,
      });
      setQuote(payload.quote);
      setLedger(payload.ledger);
      setNotice("Paper bet placed. No money moved.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Paper bet failed");
    }
  }

  const selectedPrice = quote?.limitPrice ?? (selectedMarket ? (side === "YES" ? selectedMarket.yesPrice : selectedMarket.noPrice) : 0);
  const paperCost = quote?.totalCostUsd ?? selectedPrice * contracts;
  const acceptedNotional = ledger.filter((order) => order.status === "ACCEPTED").reduce((sum, order) => sum + order.notionalUsd, 0);
  const paperBalance = Math.max(0, 10_000 - acceptedNotional);
  const openMarkets = bundle?.markets.filter((market) => market.status === "OPEN").length ?? 0;
  const accessGranted = grant?.status === "GRANTED";

  return (
    <div className="dm-shell">
      <header className="dm-topbar">
        <div className="dm-brand">
          <div className="dm-mark"><PackageCheck size={22} /></div>
          <div>
            <p className="dm-eyebrow">Delivery Markets Lab</p>
            <h1>Delivery Window Prediction Demo</h1>
          </div>
        </div>
        <div className="dm-safe-pill"><ShieldCheck size={17} /> Practice bets only</div>
      </header>

      <main className="dm-main">
        <section className="dm-hero">
          <div>
            <p className="dm-eyebrow">Paper-money meeting demo</p>
            <h2>This is a paper-money demo for the meeting.</h2>
            <p>Synthetic package data. No FedEx API connection. No real funds. No live exchange order can be sent.</p>
          </div>
          <div className="dm-boundary-grid">
            <Boundary label="Data" value="Synthetic only" />
            <Boundary label="Money" value="Paper only" />
            <Boundary label="Runtime" value="Standalone service" />
          </div>
        </section>

        {startupWarnings.length ? (
          <div className="dm-warning" role="status">{startupWarnings.join(" ")}</div>
        ) : null}

        <div className="dm-layout">
          <aside className="dm-sidebar">
            <section className="dm-panel">
              <p className="dm-section-label">Choose demo package</p>
              <form className="dm-search" onSubmit={submitLookup}>
                <ScanLine size={18} />
                <input aria-label="Tracking number" value={trackingInput} onChange={(event) => setTrackingInput(event.target.value)} />
                <button type="submit">Load</button>
              </form>
              <div className="dm-fixtures">
                {trackingNumbers.map((number) => (
                  <button key={number} className={number === trackingNumber ? "active" : ""} onClick={() => chooseFixture(number)} type="button">
                    {number}
                  </button>
                ))}
              </div>
            </section>

            <section className="dm-panel">
              <p className="dm-section-label">Demo recipient gate</p>
              <label>Demo wallet</label>
              <input value={walletAddress} onChange={(event) => setWalletAddress(event.target.value)} />
              <label>Demo claim code</label>
              <input value={claimCode} onChange={(event) => setClaimCode(event.target.value)} />
              <button className="dm-secondary" onClick={() => void claimAccess()} type="button">
                <LockKeyhole size={16} /> {accessGranted ? "Package Verified" : "Verify Package"}
              </button>
              <p className={accessGranted ? "dm-access granted" : "dm-access"}>
                {grant?.reason ?? policy?.packageAlias ?? "Auto-filled synthetic recipient fixture"}
              </p>
            </section>
          </aside>

          <div className="dm-workspace">
            <section className="dm-route-head">
              <div>
                <p className="dm-eyebrow">Bet on this synthetic delivery</p>
                <h2>{bundle ? `${bundle.shipment.origin} → ${bundle.shipment.destination}` : "Loading package"}</h2>
                <p>{bundle?.shipment.service ?? "Synthetic demo fixture"}</p>
              </div>
              <div className={`dm-status ${bundle?.cutoff.status.toLowerCase() ?? "open"}`}>
                {bundle?.cutoff.status === "OPEN" ? <Clock3 size={18} /> : <LockKeyhole size={18} />}
                {loading ? "Refreshing" : formatMarketStatus(bundle?.cutoff.status)}
              </div>
            </section>

            <section className="dm-stats">
              <Stat label="Paper balance" value={`$${paperBalance.toLocaleString("en-US", { maximumFractionDigits: 2 })}`} />
              <Stat label="Available bets" value={String(openMarkets)} />
              <Stat label="Current pick" value={`${formatCents(selectedPrice)} ${side}`} />
              <Stat label="Mode" value="Paper" />
            </section>

            {bundle ? (
              <>
                <section className="dm-journey">
                  <div>
                    <p className="dm-eyebrow">Package state</p>
                    <h2>{notice}</h2>
                    <p>{formatCutoffReason(bundle)}</p>
                  </div>
                  <div className="dm-route-line" aria-label="Synthetic package journey">
                    <span className="done">Origin</span><i /><span className={bundle.cutoff.status === "OPEN" ? "current" : "done"}>Cutoff</span><i /><span className={bundle.cutoff.status === "RESOLVED" ? "done" : ""}>Delivery</span>
                  </div>
                </section>

                <section className="dm-market-grid" aria-label="Prediction markets">
                  {bundle.markets.map((market) => (
                    <button className={selectedMarket?.id === market.id ? "dm-market selected" : "dm-market"} key={market.id} onClick={() => setSelectedMarketId(market.id)} type="button">
                      <span className={`dm-mini-status ${market.status.toLowerCase()}`}>{formatMarketStatus(market.status)}</span>
                      <strong>{market.question}</strong>
                      <div className="dm-price-pair"><span>YES {formatCents(market.yesPrice)}</span><span>NO {formatCents(market.noPrice)}</span></div>
                    </button>
                  ))}
                </section>

                <section className="dm-two-col">
                  <section className="dm-panel dm-ticket">
                    <p className="dm-section-label">Place a Paper Bet</p>
                    <h2>Place a Paper Bet</h2>
                    <p>{selectedMarket?.question ?? "Select a market"}</p>
                    <div className="dm-segmented">
                      <button className={side === "YES" ? "active" : ""} onClick={() => setSide("YES")} type="button">YES</button>
                      <button className={side === "NO" ? "active" : ""} onClick={() => setSide("NO")} type="button">NO</button>
                    </div>
                    <label htmlFor="contracts">Paper contracts</label>
                    <input id="contracts" min={1} max={100} type="number" value={contracts} onChange={(event) => setContracts(Math.max(1, Number(event.target.value) || 1))} />
                    <div className="dm-total"><span>Estimated paper cost</span><strong>${paperCost.toFixed(2)}</strong></div>
                    <button className="dm-primary" disabled={!selectedMarket || selectedMarket.status !== "OPEN"} onClick={() => void placePaperBet()} type="button">
                      <ArrowRight size={17} /> Place Paper Bet
                    </button>
                    <p className="dm-fineprint">Creates a practice ledger entry only. Nothing is signed, broadcast, or settled.</p>
                  </section>

                  <section className="dm-panel">
                    <p className="dm-section-label">Recent Paper Bets</p>
                    <h2>Recent Paper Bets</h2>
                    <div className="dm-ledger">
                      {ledger.length ? ledger.slice(0, 6).map((order) => (
                        <div key={order.id}>
                          <span className={order.status === "ACCEPTED" ? "ok" : "blocked"}>{order.status}</span>
                          <strong>{order.side} · {order.contracts} @ {formatCents(order.limitPrice)}</strong>
                          <small>Paper bet recorded. No money moved.</small>
                        </div>
                      )) : <p>No paper bets yet.</p>}
                    </div>
                  </section>
                </section>

                <section className="dm-panel">
                  <p className="dm-section-label">Package Updates</p>
                  <div className="dm-timeline">
                    {bundle.shipment.events.map((event) => (
                      <div key={`${event.timestamp}-${event.code}`}><CheckCircle2 size={16} /><span><strong>{event.label}</strong><small>{event.city}, {event.state} · {formatDateTime(event.timestamp)}</small></span></div>
                    ))}
                  </div>
                </section>
              </>
            ) : (
              <section className="dm-panel dm-empty"><ScanLine size={28} /><h2>No demo shipment loaded</h2><p>{notice}</p></section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function Boundary({ label, value }: { label: string; value: string }) {
  return <div><span>{label}</span><strong>{value}</strong></div>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div><span>{label}</span><strong>{value}</strong></div>;
}

function statusHeadline(bundle: DeliveryMarketBundle) {
  if (bundle.cutoff.status === "OPEN") return "Betting is open";
  if (bundle.cutoff.status === "RESOLVED") return "Package delivered";
  return "Betting is closed";
}

function formatMarketStatus(status?: DeliveryMarket["status"]) {
  if (status === "CUTOFF_LOCKED") return "Closed";
  if (status === "RESOLVED") return "Delivered";
  return "Open";
}

function formatCutoffReason(bundle: DeliveryMarketBundle) {
  if (bundle.cutoff.status === "OPEN") return "Paper predictions remain open until the synthetic package reaches the cutoff milestone.";
  if (bundle.cutoff.status === "RESOLVED") return "The synthetic delivery is complete, so the paper market is resolved.";
  return "The synthetic package reached the cutoff milestone, so new paper predictions are closed.";
}

function formatCents(value: number) {
  return `${Math.round(value * 100)}¢`;
}

function formatDateTime(input: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(input));
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return (await response.json()) as T;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = (await response.json()) as T;
  if (!response.ok) {
    const message = payload && typeof payload === "object" && "error" in payload ? String((payload as { error: unknown }).error) : `Request failed: ${response.status}`;
    throw new Error(message);
  }
  return payload;
}
