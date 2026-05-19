import { existsSync, readFileSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";
import type { Hono } from "hono";

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp"
};

export function installStaticRoutes(app: Hono, distDir = join(process.cwd(), "dist")) {
  app.get("*", (c) => {
    const pathname = new URL(c.req.url).pathname;
    if (pathname.startsWith("/api") || pathname === "/health") {
      return c.notFound();
    }

    const candidate = safeDistPath(distDir, pathname === "/" ? "/index.html" : pathname);
    const filePath = candidate && existsSync(candidate) ? candidate : join(distDir, "index.html");

    if (!existsSync(filePath)) {
      return c.json({ error: "Static build not found. Run npm run build first." }, 404);
    }

    const ext = extname(filePath);
    return c.body(readFileSync(filePath), 200, {
      "content-type": MIME_TYPES[ext] ?? "application/octet-stream"
    });
  });
}

function safeDistPath(distDir: string, pathname: string): string | null {
  const root = resolve(distDir);
  const normalized = resolve(join(root, pathname));
  const rel = relative(root, normalized);
  if (rel.startsWith("..") || rel === ".." || rel.startsWith("/")) return null;
  return normalized;
}
