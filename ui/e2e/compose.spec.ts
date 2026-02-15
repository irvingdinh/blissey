import { expect, test } from "@playwright/test";

test.describe("Compose Page", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ request }) => {
    // Clean up existing drafts
    const draftsRes = await request.get("http://localhost:3000/api/drafts");
    const drafts = await draftsRes.json();
    for (const draft of drafts) {
      await request.delete(`http://localhost:3000/api/drafts/${draft.id}`);
    }

    // Clean up existing posts
    const postsRes = await request.get(
      "http://localhost:3000/api/posts?limit=100",
    );
    const postsBody = await postsRes.json();
    for (const post of postsBody.data ?? []) {
      await request.delete(`http://localhost:3000/api/posts/${post.id}`);
    }
  });

  test("renders fullscreen editor with toolbar", async ({ page }) => {
    await page.goto("/compose");

    await expect(page.locator("text=Back")).toBeVisible();
    await expect(page.locator("text=Publish")).toBeVisible();
    await expect(page.locator('[title="Drafts"]')).toBeVisible();
    await expect(page.locator('[title="Add gallery images"]')).toBeVisible();
    await expect(page.locator('[title="Add audio/video"]')).toBeVisible();
  });

  test("back button navigates away from compose", async ({ page }) => {
    await page.goto("/");
    await page.click('a:has-text("Compose")');
    await expect(page).toHaveURL(/\/compose/);

    await page.click("text=Back");
    await expect(page).toHaveURL("/");
  });

  test("can type in editor and content appears", async ({ page }) => {
    await page.goto("/compose");
    await page.waitForSelector(".codex-editor", { timeout: 10000 });

    const editor = page.locator(".codex-editor__redactor");
    await editor.click();
    await page.keyboard.type("My test post content");

    await expect(page.locator("text=My test post content")).toBeVisible();
  });

  test("autosaves content as a draft", async ({ page }) => {
    await page.goto("/compose");
    await page.waitForSelector(".codex-editor", { timeout: 10000 });

    const editor = page.locator(".codex-editor__redactor");
    await editor.click();
    await page.keyboard.type("Autosaved draft content");

    // Wait for autosave indicator to appear
    await expect(page.locator("text=Draft saved")).toBeVisible({
      timeout: 10000,
    });

    // Open drafts panel to verify the draft exists
    await page.click('[title="Drafts"]');
    await expect(
      page.locator("text=Autosaved draft content").first(),
    ).toBeVisible({ timeout: 5000 });
  });

  test("publishes a post and navigates to feed", async ({ page }) => {
    await page.goto("/compose");
    await page.waitForSelector(".codex-editor", { timeout: 10000 });

    const editor = page.locator(".codex-editor__redactor");
    await editor.click();
    await page.keyboard.type("Published post from compose");

    await page.click("text=Publish");

    await expect(page).toHaveURL("/", { timeout: 5000 });

    // Post should appear in the feed (use .first() in case of multiple matches)
    await expect(
      page.locator("text=Published post from compose").first(),
    ).toBeVisible();
  });

  test("opens drafts panel and shows empty state", async ({ page }) => {
    await page.goto("/compose");
    await page.waitForSelector(".codex-editor", { timeout: 10000 });

    await page.click('[title="Drafts"]');

    await expect(page.locator("text=No drafts")).toBeVisible({
      timeout: 5000,
    });
  });

  test("can load a draft from the drafts panel", async ({ page, request }) => {
    // Create a draft via API
    await request.post("http://localhost:3000/api/drafts", {
      data: {
        content: JSON.stringify({
          blocks: [
            {
              type: "paragraph",
              data: { text: "Saved draft to load" },
            },
          ],
        }),
      },
    });

    await page.goto("/compose");
    await page.waitForSelector(".codex-editor", { timeout: 10000 });

    // Open drafts panel
    await page.click('[title="Drafts"]');

    // Should show the draft
    await expect(page.locator("text=Saved draft to load").first()).toBeVisible({
      timeout: 5000,
    });

    // Click to load the draft
    await page.locator("text=Saved draft to load").first().click();

    // Editor should show "Draft loaded" toast
    await expect(page.locator("text=Draft loaded")).toBeVisible({
      timeout: 5000,
    });

    // Drafts panel should close
    await expect(
      page.locator('[data-testid="drafts-panel"]'),
    ).not.toBeVisible();
  });

  test("full compose workflow: type, autosave, reload, load draft, publish", async ({
    page,
  }) => {
    // Step 1: Type content and let it autosave
    await page.goto("/compose");
    await page.waitForSelector(".codex-editor", { timeout: 10000 });

    const editor = page.locator(".codex-editor__redactor");
    await editor.click();
    await page.keyboard.type("Full workflow test post");

    // Wait for autosave
    await page.waitForSelector("text=Draft saved", { timeout: 10000 });

    // Step 2: Reload the page to simulate closing and reopening
    await page.goto("/compose");
    await page.waitForSelector(".codex-editor", { timeout: 10000 });

    // Step 3: Open drafts and load the saved draft
    await page.click('[title="Drafts"]');
    await expect(
      page.locator("text=Full workflow test post").first(),
    ).toBeVisible({
      timeout: 5000,
    });
    await page.locator("text=Full workflow test post").first().click();

    // Step 4: Wait for draft to load
    await expect(page.locator("text=Draft loaded")).toBeVisible({
      timeout: 5000,
    });

    // Step 5: Publish
    await page.click("text=Publish");
    await expect(page).toHaveURL("/", { timeout: 5000 });

    // Step 6: Verify post appears in feed
    await expect(
      page.locator("text=Full workflow test post").first(),
    ).toBeVisible();

    // Step 7: Verify the published post is visible in the feed
    await page.waitForSelector('[data-testid="post-card"]', { timeout: 5000 });
  });
});
