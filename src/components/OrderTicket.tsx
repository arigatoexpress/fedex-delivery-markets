import { ArrowRight, Ban, CheckCircle2, CircleDollarSign, LockKeyhole } from "lucide-react";
import type { DeliveryMarket, OrderSide, PrivateMarketQuote } from "../shared/types";

interface OrderTicketProps {
  selectedMarket: DeliveryMarket | null;
  orderSide: OrderSide;
  contracts: number;
  selectedPrice: number;
  notional: number;
  quote: PrivateMarketQuote | null;
  onSideChange: (side: OrderSide) => void;
  onContractsChange: (contracts: number) => void;
  onSubmit: (market: DeliveryMarket, side: OrderSide) => void;
  onVerify: () => void;
  accessGranted: boolean;
  idSuffix?: string;
  extraClass?: string;
}

export function OrderTicket({
  selectedMarket,
  orderSide,
  contracts,
  selectedPrice,
  notional,
  quote,
  onSideChange,
  onContractsChange,
  onSubmit,
  onVerify,
  accessGranted,
  idSuffix = "",
  extraClass = ""
}: OrderTicketProps) {
  return (
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
              onClick={() => onSideChange("YES")}
              type="button"
            >
              YES
            </button>
            <button
              className={orderSide === "NO" ? "active" : ""}
              onClick={() => onSideChange("NO")}
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
            onChange={(event) => onContractsChange(Number(event.target.value))}
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
            onClick={() => onSubmit(selectedMarket, orderSide)}
            type="button"
          >
            <ArrowRight size={17} />
            Place Paper Bet
          </button>
          <button
            className="secondary-action"
            disabled={accessGranted}
            onClick={() => onVerify()}
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
}

function formatCents(value: number): string {
  return `${Math.round(value * 100)}&cent;`;
}
