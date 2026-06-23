import { Ban, CheckCircle2 } from "lucide-react";
import type { DeliveryMarket, OrderSide } from "../shared/types";

interface MarketCardProps {
  market: DeliveryMarket;
  selected: boolean;
  onSelect: () => void;
  onPickYes: (event: React.MouseEvent) => void;
  onPickNo: (event: React.MouseEvent) => void;
}

function PriceTile({ label, price }: { label: string; price: number }) {
  return (
    <div className={label === "YES" ? "price-tile yes" : "price-tile no"}>
      <span>{label}</span>
      <strong>{formatCents(price)}</strong>
    </div>
  );
}

export function MarketCard({ market, selected, onSelect, onPickYes, onPickNo }: MarketCardProps) {
  return (
    <article
      className={selected ? "market-card selected" : "market-card"}
      key={market.id}
      onClick={onSelect}
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
          onClick={onPickYes}
          title="Pick YES"
          type="button"
        >
          <CheckCircle2 size={16} />
          Pick YES
        </button>
        <button
          disabled={market.status !== "OPEN"}
          onClick={onPickNo}
          title="Pick NO"
          type="button"
        >
          <Ban size={16} />
          Pick NO
        </button>
      </div>
    </article>
  );
}

function formatCents(value: number): string {
  return `${Math.round(value * 100)}&cent;`;
}

function formatMarketStatus(status: string): string {
  if (status === "CUTOFF_LOCKED") return "Closed";
  if (status === "RESOLVED") return "Delivered";
  return "Open";
}
