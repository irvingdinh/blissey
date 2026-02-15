import { expect, test } from "@playwright/test";

import { cleanAll } from "./helpers";

test.describe("Post Detail Page", () => {
  let postId: string;

  test.beforeEach(async ({ request }) => {
    await cleanAll(request);

    // Create a post with content
    const res = await request.post("http://localhost:3000/api/posts", {
      data: {
        content: JSON.stringify({
          blocks: [
            {
              type: "paragraph",
              data: { text: "Detail page test post" },
            },
            {
              type: "header",
              data: { text: "A heading", level: 2 },
            },
          ],
        }),
      },
    });
    const post = await res.json();
    postId = post.id;

    // Add a comment
    await request.post(`http://localhost:3000/api/posts/${postId}/comments`, {
      data: {
        content: JSON.stringify({
          blocks: [
            {
              type: "paragraph",
              data: { text: "First test comment" },
            },
          ],
        }),
      },
    });

    // Add a reaction to the post
    await request.post("http://localhost:3000/api/reactions", {
      data: {
        reactableType: "post",
        reactableId: postId,
        emoji: "👍",
      },
    });
  });

  test("renders post and comments on detail page", async ({ page }) => {
    await page.goto(`/posts/${postId}`);

    // Post content should render
    await expect(page.locator("text=Detail page test post")).toBeVisible();
    await expect(page.locator("text=A heading")).toBeVisible();

    // Post card should be present
    await expect(page.locator('[data-testid="post-card"]')).toBeVisible();

    // Comments section should be present
    await expect(
      page.locator('[data-testid="comments-section"]'),
    ).toBeVisible();
    await expect(page.locator("text=Comments (1)")).toBeVisible();

    // Comment content should render
    await expect(page.locator("text=First test comment")).toBeVisible();
  });

  test("shows post reactions", async ({ page }) => {
    await page.goto(`/posts/${postId}`);

    // Wait for post card
    await page.waitForSelector('[data-testid="post-card"]');

    // Reaction badge should show
    const reactionBadge = page
      .locator('[data-testid="reaction-badge"]')
      .first();
    await expect(reactionBadge).toBeVisible();
    await expect(reactionBadge).toContainText("👍");
  });

  test("opens write comment editor and submits comment", async ({ page }) => {
    await page.goto(`/posts/${postId}`);
    await page.waitForSelector('[data-testid="comments-section"]');

    // Click write comment button
    await page.click('[data-testid="write-comment-btn"]');

    // Fullscreen editor should appear
    await page.waitForSelector(".codex-editor", { timeout: 10000 });

    // Submit button should be present
    await expect(
      page.locator('[data-testid="submit-comment-btn"]'),
    ).toBeVisible();

    // Cancel button should be present
    await expect(page.locator("text=Cancel")).toBeVisible();
  });

  test("shows delete confirmation on comment", async ({ page }) => {
    await page.goto(`/posts/${postId}`);

    // Wait for comment to load
    await page.waitForSelector('[data-testid="delete-comment-btn"]');

    // Click delete
    await page.click('[data-testid="delete-comment-btn"]');

    // Confirm and cancel buttons should appear
    await expect(
      page.locator('[data-testid="confirm-delete-comment-btn"]'),
    ).toBeVisible();
  });

  test("scrolls to comments when navigated with #comments hash", async ({
    page,
  }) => {
    await page.goto(`/posts/${postId}#comments`);

    // Wait for comments section to load
    await page.waitForSelector('[data-testid="comments-section"]');

    // The comments section should be in view
    const commentsSection = page.locator('[data-testid="comments-section"]');
    await expect(commentsSection).toBeVisible();
  });

  test("shows edit button on comments", async ({ page }) => {
    await page.goto(`/posts/${postId}`);
    await page.waitForSelector('[data-testid="edit-comment-btn"]');

    await expect(
      page.locator('[data-testid="edit-comment-btn"]'),
    ).toBeVisible();
  });

  test("shows comment timestamps", async ({ page }) => {
    await page.goto(`/posts/${postId}`);
    await page.waitForSelector('[data-testid="comments-section"]');

    // Comment should have a relative timestamp
    const pageContent = await page.textContent("body");
    expect(pageContent).toContain("just now");
  });

  test("shows write comment button", async ({ page }) => {
    await page.goto(`/posts/${postId}`);
    await page.waitForSelector('[data-testid="comments-section"]');

    await expect(
      page.locator('[data-testid="write-comment-btn"]'),
    ).toBeVisible();
    await expect(page.locator("text=Write comment")).toBeVisible();
  });

  test("shows empty comments state for post without comments", async ({
    page,
    request,
  }) => {
    // Create a post with no comments
    const res = await request.post("http://localhost:3000/api/posts", {
      data: {
        content: JSON.stringify({
          blocks: [{ type: "paragraph", data: { text: "No comments post" } }],
        }),
      },
    });
    const newPost = await res.json();

    await page.goto(`/posts/${newPost.id}`);
    await page.waitForSelector('[data-testid="comments-section"]');

    await expect(page.locator("text=No comments yet.")).toBeVisible();
  });

  test("shows post not found for invalid id", async ({ page }) => {
    await page.goto("/posts/nonexistent-id-12345");

    await expect(page.locator("text=Post not found.")).toBeVisible();
    await expect(page.locator("text=Back to feed")).toBeVisible();
  });
});
