import type { Context, Next } from "hono";

export function securityHeaders() {
  return async (c: Context, next: Next) => {
    c.header("x-content-type-options", "nosniff");
    c.header("referrer-policy", "no-referrer");
    c.header("x-frame-options", "DENY");
    c.header(
      "permissions-policy",
      "camera=(), microphone=(), geolocation=(), payment=(), usb=()"
    );

    if (process.env.NODE_ENV === "production") {
      c.header(
        "content-security-policy",
        [
          "default-src 'self'",
          "script-src 'self'",
          "style-src 'self'",
          "img-src 'self' data:",
          "font-src 'self' data:",
          "connect-src 'self'",
          "frame-ancestors 'none'",
          "base-uri 'self'",
          "form-action 'self'"
        ].join("; ")
      );
    }

    await next();
  };
}
