import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const baseUrl = process.env.DELIVERY_MARKETS_BASE_URL ?? "http://127.0.0.1:5178";
mkdirSync("artifacts", { recursive: true });

const errors = [];
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text());
});
page.on("pageerror", (error) => errors.push(error.message));

await page.goto(baseUrl, { waitUntil: "networkidle" });
await page.getByText("Paper-only simulation").waitFor({ timeout: 5000 });
await page.getByRole("button", { name: /Paper YES/i }).first().click();
await page.getByRole("heading", { name: /Paper order accepted/i }).waitFor({ timeout: 5000 });
await page.getByRole("button", { name: /882345678901/i }).click();
await page.getByRole("heading", { name: /Locked at hub cutoff/i }).waitFor({ timeout: 5000 });
await page.screenshot({ path: "artifacts/browser-smoke-desktop.png", fullPage: true });

await browser.close();

if (errors.length) {
  console.error(JSON.stringify({ ok: false, errors }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, baseUrl }, null, 2));
