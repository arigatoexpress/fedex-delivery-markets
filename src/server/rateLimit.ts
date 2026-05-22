import type { Context, Next } from "hono";

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export function rateLimit(options: { windowMs: number; max: number }) {
  return async (c: Context, next: Next) => {
    if (!["POST", "PUT", "PATCH", "DELETE"].includes(c.req.method)) {
      await next();
      return;
    }

    const now = Date.now();
    const key = `${clientKey(c)}:${new URL(c.req.url).pathname}`;
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + options.windowMs });
      c.header("ratelimit-limit", String(options.max));
      c.header("ratelimit-remaining", String(options.max - 1));
      await next();
      return;
    }

    if (bucket.count >= options.max) {
      c.header("ratelimit-limit", String(options.max));
      c.header("ratelimit-remaining", "0");
      c.header("retry-after", String(Math.ceil((bucket.resetAt - now) / 1000)));
      return c.json({ error: "Rate limit exceeded" }, 429);
    }

    bucket.count += 1;
    c.header("ratelimit-limit", String(options.max));
    c.header("ratelimit-remaining", String(options.max - bucket.count));
    await next();
  };
}

function clientKey(c: Context): string {
  const forwarded = c.req.header("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || c.req.header("cf-connecting-ip") || "local";
}
