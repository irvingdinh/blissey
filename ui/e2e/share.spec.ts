import { expect, test } from "@playwright/test";

test.describe("Share Feature — Copy Post as Markdown", () => {
  let postId: string;

  test.beforeEach(async ({ request }) => {
    // Create a post with various block types
    const res = await request.post("http://localhost:3000/api/posts", {
      data: {
        content: JSON.stringify({
          blocks: [
            { type: "header", data: { text: "My Test Post", level: 1 } },
            {
              type: "paragraph",
              data: { text: "A paragraph with <b>bold</b> and <i>italic</i>." },
            },
            {
              type: "list",
              data: {
                style: "unordered",
                items: ["Item one", "Item two"],
              },
            },
            { type: "delimiter", data: {} },
            {
              type: "code",
              data: { code: "console.log('hello');" },
            },
          ],
        }),
      },
    });
    const body = await res.json();
    postId = body.id;
  });

  test.afterEach(async ({ request }) => {
    // Clean up: delete the post
    if (postId) {
      await request.delete(`http://localhost:3000/api/posts/${postId}`);
    }
  });

  test("share button copies markdown to clipboard and shows toast", async ({
    page,
    context,
  }) => {
    // Grant clipboard permissions
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    await page.goto("/");
    await page.waitForSelector('[data-testid="post-card"]');

    // Find the share button and click it
    const postCard = page.locator('[data-testid="post-card"]').first();
    const shareBtn = postCard.locator('[data-testid="share-btn"]');
    await expect(shareBtn).toBeVisible();
    await shareBtn.click();

    // Verify the toast appears
    const toast = page.locator('[data-testid="copied-toast"]');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText("Copied as Markdown");

    // Read clipboard content and verify it's markdown (not raw JSON)
    const clipboardText = await page.evaluate(() =>
      navigator.clipboard.readText(),
    );
    expect(clipboardText).toContain("# My Test Post");
    expect(clipboardText).toContain("A paragraph with **bold** and *italic*.");
    expect(clipboardText).toContain("- Item one");
    expect(clipboardText).toContain("- Item two");
    expect(clipboardText).toContain("---");
    expect(clipboardText).toContain("```\nconsole.log('hello');\n```");

    // Verify it does NOT contain raw JSON
    expect(clipboardText).not.toContain('"type"');
    expect(clipboardText).not.toContain('"blocks"');
  });

  test("toast disappears after a short time", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    await page.goto("/");
    await page.waitForSelector('[data-testid="post-card"]');

    const shareBtn = page
      .locator('[data-testid="post-card"]')
      .first()
      .locator('[data-testid="share-btn"]');
    await shareBtn.click();

    const toast = page.locator('[data-testid="copied-toast"]');
    await expect(toast).toBeVisible();

    // Wait for toast to disappear (2s timeout + buffer)
    await expect(toast).toBeHidden({ timeout: 5000 });
  });
});
