import type { APIRequestContext } from "@playwright/test";
import { expect, test } from "@playwright/test";

import { cleanAll, cleanTrash } from "./helpers";

async function createAndTrashPost(
  request: APIRequestContext,
  text: string,
): Promise<string> {
  const createRes = await request.post("http://localhost:3000/api/posts", {
    data: {
      content: JSON.stringify({
        blocks: [{ type: "paragraph", data: { text } }],
      }),
    },
  });
  const created = await createRes.json();
  await request.delete(`http://localhost:3000/api/posts/${created.id}`);
  return created.id;
}

test.describe("Trash Page", () => {
  test("shows empty state when no trashed posts", async ({ page, request }) => {
    await cleanAll(request);
    await cleanTrash(request);

    await page.goto("/trash");
    await expect(page.locator('[data-testid="trash-empty"]')).toBeVisible();
    await expect(page.locator("text=Trash is empty.")).toBeVisible();
  });

  test("navigates to trash from navbar", async ({ page }) => {
    await page.goto("/");
    await page.click('a:has-text("Trash")');
    await expect(page).toHaveURL(/\/trash/);
  });

  test("shows trashed post with preview and days remaining", async ({
    page,
    request,
  }) => {
    await cleanAll(request);
    await cleanTrash(request);
    await createAndTrashPost(request, "Preview test post");

    await page.goto("/trash");
    await page.waitForSelector('[data-testid="trash-item"]');

    const trashItem = page.locator('[data-testid="trash-item"]').first();
    await expect(trashItem).toBeVisible();

    const preview = trashItem.locator('[data-testid="trash-preview"]');
    await expect(preview).toContainText("Preview test post");

    const badge = trashItem.locator('[data-testid="days-remaining"]');
    await expect(badge).toBeVisible();
    await expect(badge).toContainText(/day|Expires/);

    const restoreBtn = trashItem.locator('[data-testid="restore-btn"]');
    await expect(restoreBtn).toBeVisible();
  });

  test("expands post content when clicking preview", async ({
    page,
    request,
  }) => {
    await cleanAll(request);
    await cleanTrash(request);
    await createAndTrashPost(request, "Expandable content");

    await page.goto("/trash");
    await page.waitForSelector('[data-testid="trash-item"]');

    const trashItem = page.locator('[data-testid="trash-item"]').first();
    const preview = trashItem.locator('[data-testid="trash-preview"]');
    await preview.click();

    await expect(trashItem.locator("text=Collapse")).toBeVisible();
  });

  test("restores a post from trash and it appears in feed", async ({
    page,
    request,
  }) => {
    await cleanAll(request);
    await cleanTrash(request);
    await createAndTrashPost(request, "Restore me please");

    await page.goto("/trash");
    await page.waitForSelector('[data-testid="trash-item"]');

    const restoreBtn = page
      .locator('[data-testid="trash-item"]')
      .first()
      .locator('[data-testid="restore-btn"]');
    await restoreBtn.click();

    // Should show success toast
    await expect(page.locator('[data-testid="restore-toast"]')).toBeVisible();
    await expect(
      page.locator("text=Post restored successfully."),
    ).toBeVisible();

    // Trash should now be empty
    await expect(page.locator('[data-testid="trash-empty"]')).toBeVisible();

    // Navigate to feed and verify post reappears
    await page.click('a:has-text("Home")');
    await page.waitForSelector('[data-testid="post-card"]');

    const pageContent = await page.textContent("body");
    expect(pageContent).toContain("Restore me please");
  });
});
