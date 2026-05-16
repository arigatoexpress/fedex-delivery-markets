import type { Context, Next } from "hono";

export function adminAuthConfigured(): boolean {
  return Boolean(process.env.DELIVERY_MARKETS_ADMIN_TOKEN);
}

export async function requireAdmin(c: Context, next: Next) {
  const configuredToken = process.env.DELIVERY_MARKETS_ADMIN_TOKEN;
  if (!configuredToken) {
    c.header("x-delivery-markets-auth", "dev-open-admin");
    await next();
    return;
  }

  const header = c.req.header("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";

  if (token !== configuredToken) {
    return c.json(
      {
        error: "Admin token required",
        authConfigured: true
      },
      401
    );
  }

  await next();
}
