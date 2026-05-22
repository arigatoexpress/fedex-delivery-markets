# Private AMM Math

The private market uses a binary $1 payout model: a YES share pays `$1` if the delivery event resolves true and `$0` otherwise. NO is the complement.

## LMSR Cost Function

The AMM uses a logarithmic market scoring rule:

```text
C(q_yes, q_no) = b * ln(exp(q_yes / b) + exp(q_no / b))
```

Where:

- `q_yes`, `q_no` are outstanding YES/NO share quantities.
- `b` is the liquidity parameter.
- higher `b` means deeper liquidity and lower slippage.
- lower `b` means prices move faster near cutoff.

The instantaneous YES probability is:

```text
p_yes = exp(q_yes / b) / (exp(q_yes / b) + exp(q_no / b))
```

The cost to buy `n` YES shares is:

```text
C(q_yes + n, q_no) - C(q_yes, q_no)
```

The cost to buy `n` NO shares is:

```text
C(q_yes, q_no + n) - C(q_yes, q_no)
```

## Initial Probability

Each delivery market starts from the fixture ETA probability:

```text
p0 = market.yesPrice
q_yes0 = b * ln(p0)
q_no0 = b * ln(1 - p0)
```

This initializes the LMSR so the first quote matches the estimated delivery probability.

## Theta Decay

Delivery markets become more adverse-selection prone as the package approaches the hub cutoff. The demo models this by shrinking liquidity and adding a time-risk spread:

```text
b(t) = max(8, b0 * (0.35 + 0.65 * remaining_fraction^1.3))
```

And the spread schedule is:

```text
>= 24h to cutoff: 35 bps
>= 12h to cutoff: 75 bps
>= 4h to cutoff: 140 bps
< 4h to cutoff: 240 bps
```

This is not option theta in the Black-Scholes sense. It is a prediction-market liquidity and information-risk model: the counterparty bot quotes tighter when there is time for broad information discovery and wider when late operational information may be asymmetric.

## Inventory Spread

The bot charges an additional spread when the next trade increases one-sided exposure:

```text
inventory_spread_bps = clamp(8 * directional_inventory, 0, 180)
```

Where `directional_inventory` is current YES inventory minus NO inventory for a YES buy, or the opposite for a NO buy.

## Quote Fields

- `spotPrice`: current side price before the trade.
- `averagePrice`: LMSR gross cost divided by contracts.
- `limitPrice`: average price plus theta and inventory spread.
- `grossCostUsd`: LMSR cost before spread.
- `spreadUsd`: time-risk and inventory spread.
- `totalCostUsd`: final paper notional.
- `beforeProbability` / `afterProbability`: YES probability before and after the trade.
- `liquidityParameter`: the active `b(t)` used for the quote.

## Production Notes

For a real venue, the quote engine needs:

- formal market-maker obligations and maximum exposure;
- audited custody, margin, collateral, and settlement flows;
- recipient eligibility enforcement outside the browser;
- dispute and correction procedures for delivery exceptions;
- model monitoring for operational-information leakage near hub cutoff.
