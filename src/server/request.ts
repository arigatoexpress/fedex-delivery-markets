import type { Context } from "hono";
import type { z } from "zod";

export const DEFAULT_JSON_BODY_LIMIT_BYTES = Number(
  process.env.MAX_JSON_BODY_BYTES ?? 16 * 1024
);

export type ParsedBody<T> =
  | { ok: true; data: T }
  | { ok: false; status: 400 | 413; payload: unknown };

export async function parseLimitedJson<TSchema extends z.ZodTypeAny>(
  c: Context,
  schema: TSchema,
  maxBytes = DEFAULT_JSON_BODY_LIMIT_BYTES
): Promise<ParsedBody<z.infer<TSchema>>> {
  const contentLength = Number(c.req.header("content-length") ?? 0);
  if (contentLength > maxBytes) {
    return {
      ok: false,
      status: 413,
      payload: {
        error: "Request body too large",
        maxBytes
      }
    };
  }

  const text = await c.req.text();
  if (Buffer.byteLength(text, "utf8") > maxBytes) {
    return {
      ok: false,
      status: 413,
      payload: {
        error: "Request body too large",
        maxBytes
      }
    };
  }

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return {
      ok: false,
      status: 400,
      payload: {
        error: "Invalid JSON body"
      }
    };
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      payload: {
        error: "Invalid request body",
        details: parsed.error.flatten()
      }
    };
  }

  return { ok: true, data: parsed.data };
}
