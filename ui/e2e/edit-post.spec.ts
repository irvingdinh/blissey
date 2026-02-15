import { expect, test } from "@playwright/test";

test.describe("Edit Post Page", () => {
  test.describe.configure({ mode: "serial" });

  let postId: string;

  test.beforeEach(async ({ request }) => {
    // Clean up existing posts
    const postsRes = await request.get(
      "http://localhost:3000/api/posts?limit=100",
    );
    const postsBody = await postsRes.json();
    for (const post of postsBody.data ?? []) {
      await request.delete(`http://localhost:3000/api/posts/${post.id}`);
    }

    // Clean up trashed posts
    const trashRes = await request.get("http://localhost:3000/api/trash");
    const trashBody = await trashRes.json();
    for (const post of trashBody ?? []) {
      await request.post(`http://localhost:3000/api/trash/${post.id}/restore`);
      await request.delete(`http://localhost:3000/api/posts/${post.id}`);
    }

    // Create a test post via API
    const createRes = await request.post("http://localhost:3000/api/posts", {
      data: {
        content: JSON.stringify({
          blocks: [
            {
              type: "paragraph",
              data: { text: "Original post content for editing" },
            },
          ],
        }),
      },
    });
    const created = await createRes.json();
    postId = created.id;
  });

  test("renders fullscreen editor with toolbar and post content", async ({
    page,
  }) => {
    await page.goto(`/posts/${postId}/edit`);
    await page.waitForSelector(".codex-editor", { timeout: 10000 });

    // Should show toolbar buttons
    await expect(page.locator("text=Back")).toBeVisible();
    await expect(page.locator("text=Save")).toBeVisible();
    await expect(page.locator('[title="Add gallery images"]')).toBeVisible();
    await expect(page.locator('[title="Add audio/video"]')).toBeVisible();

    // Should load existing content
    await expect(
      page.locator("text=Original post content for editing"),
    ).toBeVisible({ timeout: 10000 });
  });

  test("back button navigates away from edit page", async ({ page }) => {
    await page.goto(`/posts/${postId}`);
    await page.waitForSelector('[data-testid="post-card"]', { timeout: 10000 });

    // Navigate to edit page from post detail
    await page.click('a[href*="/edit"]');
    await expect(page).toHaveURL(new RegExp(`/posts/${postId}/edit`));

    await page.waitForSelector(".codex-editor", { timeout: 10000 });

    await page.click("text=Back");
    // Should go back to post detail
    await expect(page).toHaveURL(/\/posts\/[^/]+$/);
  });

  test("can modify content and save", async ({ page }) => {
    await page.goto(`/posts/${postId}/edit`);
    await page.waitForSelector(".codex-editor", { timeout: 10000 });

    // Wait for existing content to load
    await expect(
      page.locator("text=Original post content for editing"),
    ).toBeVisible({ timeout: 10000 });

    // Click at the end of the existing text and add more content
    const contentBlock = page.locator(
      ".ce-paragraph:has-text('Original post content for editing')",
    );
    await contentBlock.click();

    // Press Enter to create a new block
    await page.keyboard.press("Enter");
    await page.keyboard.type("Added content during edit");

    // Save
    await page.click("text=Save");

    // Should navigate to the post detail page
    await expect(page).toHaveURL(/\/posts\/[^/]+$/, {
      timeout: 5000,
    });

    // Verify the updated content is displayed
    await expect(
      page.locator("text=Added content during edit").first(),
    ).toBeVisible({ timeout: 5000 });
  });

  test("navigating from feed edit button opens edit page with content", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="post-card"]', { timeout: 10000 });

    // Wait for the post content to be visible to ensure full render
    await expect(
      page.locator("text=Original post content for editing").first(),
    ).toBeVisible({ timeout: 10000 });

    // Click the edit button (pencil icon link) — use first() since there's only one post
    await page.locator('a[href*="/edit"]').first().click();

    await expect(page).toHaveURL(/\/posts\/.*\/edit/);
    await page.waitForSelector(".codex-editor", { timeout: 10000 });

    // Should show the original post content
    await expect(
      page.locator("text=Original post content for editing"),
    ).toBeVisible({ timeout: 10000 });
  });

  test("full edit workflow: edit from feed, modify, save, verify in feed", async ({
    page,
  }) => {
    // Step 1: Go to feed
    await page.goto("/");
    await page.waitForSelector('[data-testid="post-card"]', { timeout: 10000 });

    // Verify original content
    await expect(
      page.locator("text=Original post content for editing").first(),
    ).toBeVisible();

    // Step 2: Click edit button
    await page.locator('a[href*="/edit"]').first().click();
    await page.waitForSelector(".codex-editor", { timeout: 10000 });

    // Step 3: Wait for content to load
    await expect(
      page.locator("text=Original post content for editing"),
    ).toBeVisible({ timeout: 10000 });

    // Step 4: Add new content
    const contentBlock = page.locator(
      ".ce-paragraph:has-text('Original post content for editing')",
    );
    await contentBlock.click();
    await page.keyboard.press("Enter");
    await page.keyboard.type("Updated via edit workflow");

    // Step 5: Save
    await page.click("text=Save");

    // Step 6: Should navigate to post detail
    await expect(page).toHaveURL(/\/posts\/[^/]+$/, {
      timeout: 5000,
    });

    // Step 7: Navigate back to feed and verify
    await page.goto("/");
    await page.waitForSelector('[data-testid="post-card"]', { timeout: 10000 });
    await expect(
      page.locator("text=Updated via edit workflow").first(),
    ).toBeVisible({ timeout: 5000 });
  });
});
