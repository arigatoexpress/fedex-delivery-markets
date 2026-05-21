import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const baseUrl = process.env.DELIVERY_MARKETS_BASE_URL ?? "http://127.0.0.1:5178";
mkdirSync("artifacts", { recursive: true });

const errors = [];
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.on("console", (msg) => {
  const text = msg.text();
  if (msg.type() === "error" && !text.includes("Failed to load resource")) errors.push(text);
});
page.on("pageerror", (error) => errors.push(error.message));
page.on("response", (response) => {
  if (response.status() >= 400 && !response.url().endsWith("/favicon.ico")) {
    errors.push(`${response.status()} ${response.url()}`);
  }
});

await page.goto(baseUrl, { waitUntil: "networkidle" });
await page.getByText("Practice bets only").waitFor({ timeout: 5000 });
await page.getByText("This is a paper-money demo for the meeting.").waitFor({ timeout: 5000 });
await page.getByRole("heading", { name: /Place a Paper Bet/i }).waitFor({ timeout: 5000 });
const rightRail = page.locator(".right-rail");
await rightRail.getByRole("button", { name: /Place Paper Bet/i }).click();
await page.getByText("Paper bet placed. No money moved.").waitFor({ timeout: 5000 });
await page.getByText("Recent Paper Bets").waitFor({ timeout: 5000 });
await page.getByRole("button", { name: /882345678901/i }).click();
await page.getByRole("heading", { name: /Betting is closed/i }).waitFor({ timeout: 5000 });
await page.screenshot({ path: "artifacts/browser-smoke-desktop.png", fullPage: true });

await browser.close();

if (errors.length) {
  console.error(JSON.stringify({ ok: false, errors }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, baseUrl }, null, 2));
