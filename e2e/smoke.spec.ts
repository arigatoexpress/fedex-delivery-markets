import { test, expect } from "@playwright/test";

test.describe("frontend smoke", () => {
  test("homepage loads with brand and tracking search", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=Delivery Bet")).toBeVisible();
    await expect(page.locator("text=Paper Money Demo")).toBeVisible();
    await expect(page.locator("[aria-label='Tracking number']")).toBeVisible();
  });

  test("selecting a tracking number loads shipment details", async ({ page }) => {
    await page.goto("/");
    await page.click("text=771234567890");
    await expect(page.locator("text=Austin to Denver")).toBeVisible();
    await expect(page.locator("text=Betting is open")).toBeVisible();
  });

  test("placing a paper bet updates the ledger", async ({ page }) => {
    await page.goto("/");
    await page.click("text=771234567890");
    await page.waitForSelector(".market-card");
    await page.click(".market-card >> text=Pick YES");
    await page.click("text=Place Paper Bet");
    await expect(page.locator("text=Recent Paper Bets")).toBeVisible();
    await expect(page.locator("text=ACCEPTED").first()).toBeVisible();
  });
});
