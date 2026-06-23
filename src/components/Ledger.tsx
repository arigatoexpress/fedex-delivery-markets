import { Activity } from "lucide-react";
import type { PublicPaperOrder } from "../shared/types";

interface LedgerProps {
  orders: PublicPaperOrder[];
}

export function Ledger({ orders }: LedgerProps) {
  return (
    <section className="rail-section inspector">
      <div className="section-heading">
        <h3>Recent Paper Bets</h3>
        <Activity size={18} />
      </div>
      <div className="ledger-list">
        {orders.length ? (
          orders.slice(0, 5).map((order) => (
            <div className="ledger-row" key={order.id}>
              <span className={order.status === "ACCEPTED" ? "accepted" : "blocked"}>
                {order.status}
              </span>
              <strong>
                {order.side} &middot; {order.contracts} @ {formatCents(order.limitPrice)}
              </strong>
              <small>Paper bet recorded. No money moved.</small>
            </div>
          ))
        ) : (
          <p>No paper bets yet.</p>
        )}
      </div>
    </section>
  );
}

function formatCents(value: number): string {
  return `${Math.round(value * 100)}&cent;`;
}
