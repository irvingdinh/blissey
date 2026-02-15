import { expect, test } from "@playwright/test";

import { cleanAll } from "./helpers";

test.describe("Feed Page", () => {
  test.beforeEach(async ({ request }) => {
    await cleanAll(request);

    // Seed posts via API
    for (let i = 1; i <= 3; i++) {
      await request.post("http://localhost:3000/api/posts", {
        data: {
          content: JSON.stringify({
            blocks: [
              {
                type: "paragraph",
                data: { text: `Test post number ${i}` },
              },
            ],
          }),
        },
      });
    }
  });

  test("renders feed with posts", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="post-card"]');

    const postCards = page.locator('[data-testid="post-card"]');
    await expect(postCards.first()).toBeVisible();

    // Posts should contain the seeded content
    const pageContent = await page.textContent("body");
    expect(pageContent).toContain("Test post number");
  });

  test("displays navigation links", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator('a:has-text("Home")')).toBeVisible();
    await expect(page.locator('a:has-text("Compose")')).toBeVisible();
    await expect(page.locator('a:has-text("Trash")')).toBeVisible();
  });

  test("navigates to compose page", async ({ page }) => {
    await page.goto("/");
    await page.click('a:has-text("Compose")');
    await expect(page).toHaveURL(/\/compose/);
  });

  test("post card shows comment count link", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="post-card"]');

    // Each post card should have a comments link
    const firstCard = page.locator('[data-testid="post-card"]').first();
    const commentsLink = firstCard.locator('a[href*="#comments"]');
    await expect(commentsLink).toBeVisible();
  });

  test("post card shows timestamp", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="post-card"]');

    // Should show relative timestamp like "just now"
    const pageContent = await page.textContent("body");
    expect(pageContent).toContain("just now");
  });

  test("shows empty state when no posts exist", async ({ page, request }) => {
    await cleanAll(request);

    await page.goto("/");
    await expect(page.locator("text=No posts yet.")).toBeVisible();
  });
});
