# Testnet Runbook

This runbook is for a Robinhood Chain / Arbitrum-compatible testnet proof. It is not a live market launch path.

## Preconditions

- `npm run verify` passes.
- `npm run contracts:build` passes.
- Security/compliance reviews approve a testnet receipt deployment.
- The deployer key is a testnet-only key with no mainnet funds or production permissions.
- No real FedEx tracking numbers or customer records are used.

## Build Artifacts

```bash
npm run contracts:build
```

Outputs:

- `artifacts/contracts/DeliveryMarketResolver.json`
- `artifacts/contracts/PrivateDeliveryMarket.json`

These artifacts are generated and ignored by git.

## Wallet Readiness

The app supports read-only wallet probes for the public testnet wallet. The API
and frontend never hold keys, sign transactions, bridge assets, or move funds.

```bash
DELIVERY_MARKETS_TESTNET_WALLET_ADDRESS=0x... \
ROBINHOOD_CHAIN_RPC_URL=https://... \
npm run wallet:readiness
```

The same data is available at:

```bash
curl http://127.0.0.1:4747/api/wallet/readiness
```

Expected safe posture:

- `liveFundsAllowed` is `false`.
- `serverSideSigning` is `disabled`.
- Robinhood Chain requires testnet ETH only.
- Solana is reported as `not_required` unless a separate reviewed Solana rail is
  added.

## Deployment

The deploy script fails closed unless both deploy flags are set:

```bash
DEPLOY_CONTRACTS=true \
DEPLOY_PRIVATE_MARKET_CONTRACT=true \
ROBINHOOD_CHAIN_RPC_URL=https://... \
DEPLOYER_PRIVATE_KEY=0x... \
npm run deploy:robinhood:testnet
```

After deployment, set:

```bash
PRIVATE_MARKET_CONTRACT_ADDRESS=0x...
```

Then restart the API and check:

```bash
curl http://127.0.0.1:4747/api/testnet/deployment-plan
```

## Demo Flow

1. Open `http://127.0.0.1:5178`.
2. Use demo tracking number `771234567890`.
3. Claim recipient access with wallet `0x1111111111111111111111111111111111111111`.
4. Use claim code `AUSTIN-DENVER-RECIPIENT`.
5. Submit a private AMM paper order.
6. Inspect `createMarket` and `recordTrade` calldata previews.

## Hard Stops

- Do not use a mainnet private key.
- Do not send live SOL, ETH, USDC, or customer funds to this demo.
- Do not broadcast with customer data.
- Do not enable live exchange routing.
- Do not connect Robinhood/Polymarket live trading credentials.
- Do not treat testnet receipts as financial settlement.

## Evidence To Capture

- `npm run verify`
- `npm run contracts:build`
- `npm run browser:smoke`
- deployment transaction hash, if a testnet deployment is explicitly approved;
- explorer link for the deployed receipt contract;
- screenshot of the private AMM order and calldata preview.
