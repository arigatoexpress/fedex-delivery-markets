import type { Context, Next } from "hono";

export function adminAuthConfigured(): boolean {
  return Boolean(process.env.DELIVERY_MARKETS_ADMIN_TOKEN);
}

export function devOpenAdminAllowed(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.ALLOW_DEV_OPEN_ADMIN === "true";
}

export function adminAuthMode(): "token" | "locked" | "dev-open" {
  if (adminAuthConfigured()) return "token";
  if (devOpenAdminAllowed()) return "dev-open";
  return "locked";
}

export async function requireAdmin(c: Context, next: Next) {
  const configuredToken = process.env.DELIVERY_MARKETS_ADMIN_TOKEN;
  if (!configuredToken) {
    if (devOpenAdminAllowed()) {
      c.header("x-delivery-markets-auth", "dev-open-admin");
      await next();
      return;
    }

    return c.json(
      {
        error: "Admin token required",
        authConfigured: false,
        failClosed: true
      },
      401
    );
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
