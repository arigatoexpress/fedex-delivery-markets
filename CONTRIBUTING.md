# Contributing to FedEx Delivery Markets

Thank you for your interest in improving this project. This is a **paper-only demo** and all contributions should preserve that safety posture.

## Getting Started

1. Clone the repository.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and configure any required values.
4. Run `npm run dev` to start the API and Vite dev server concurrently.

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start API and web dev servers |
| `npm run test` | Run all Vitest tests |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run build` | Build client and server |
| `npm run verify` | Run typecheck + test + build |
| `npm run browser:smoke` | Run browser smoke tests |

## Code Style

- TypeScript strict mode is enabled.
- Prefer explicit return types on public functions.
- Use `zod` for runtime validation of all API inputs.
- Use the existing `hono` patterns for new routes.
- Keep React components under 200 lines; decompose when they grow larger.

## Testing

- All API routes must have tests in `src/server/app.test.ts`.
- All new Solidity contracts must have compilation tests in `src/contracts/contract.test.ts`.
- Frontend smoke tests should be added to `e2e/smoke.spec.ts` using Playwright.
- Run `npm run verify` before opening a PR.

## Security Boundaries

**Hard rules:**
- Do not add real money movement.
- Do not add live FedEx API calls without privacy review.
- Do not expose private keys or deployer keys in source or tests.
- Do not modify the public demo site (`delivery-markets.sapphirealpha.xyz`) directly.
- All work is local code changes only.

## Opening Issues

- Use the issue tracker for bugs, features, and security concerns.
- Label security issues with `security`.
- Include reproduction steps for bugs.

## License

This project is provided as a demo. See the repository for license details.
