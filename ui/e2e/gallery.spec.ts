import { expect, test } from "@playwright/test";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

import { cleanAll } from "./helpers";

const API = "http://localhost:3000";

// Create a minimal valid PNG (1x1 pixel, red)
function createTestPng(): string {
  const dir = join(tmpdir(), "blissey-e2e");
  mkdirSync(dir, { recursive: true });
  const filePath = join(dir, "test-gallery.png");
  // Minimal 1x1 PNG
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
    "base64",
  );
  writeFileSync(filePath, png);
  return filePath;
}

async function seedPostWithGallery(
  request: ReturnType<typeof test.info>["_request"] extends undefined
    ? never
    : // eslint-disable-next-line @typescript-eslint/no-explicit-any
      any,
  imageCount: number,
) {
  // Create a post
  const postRes = await request.post(`${API}/api/posts`, {
    data: {
      content: JSON.stringify({
        blocks: [{ type: "paragraph", data: { text: "Gallery test post" } }],
      }),
    },
  });
  const post = await postRes.json();

  // Upload gallery images
  const testPng = createTestPng();
  for (let i = 0; i < imageCount; i++) {
    await request.post(`${API}/api/attachments`, {
      multipart: {
        file: {
          name: `gallery-${i}.png`,
          mimeType: "image/png",
          buffer: readFileSync(testPng),
        },
        attachable_type: "post",
        attachable_id: post.id,
        category: "gallery",
      },
    });
  }

  return post;
}

test.describe("Gallery Carousel & Lightbox", () => {
  test.beforeEach(async ({ request }) => {
    await cleanAll(request);
    await seedPostWithGallery(request, 3);
  });

  test("renders gallery carousel in post card", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="gallery-carousel"]');
    const carousel = page.locator('[data-testid="gallery-carousel"]').first();
    await expect(carousel).toBeVisible();
  });

  test("shows dot indicators for multiple images", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="gallery-carousel"]');
    const dots = page.locator('[data-testid="carousel-dots"]').first();
    await expect(dots).toBeVisible();

    // Should have 3 dots
    const dotButtons = dots.locator("button");
    await expect(dotButtons).toHaveCount(3);
  });

  test("navigates images with next/prev arrows on desktop", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="gallery-carousel"]');

    const carousel = page.locator('[data-testid="gallery-carousel"]').first();

    // Hover to show arrows
    await carousel.hover();

    // Should show next arrow but not prev (on first image)
    await expect(
      carousel.locator('[data-testid="carousel-next"]'),
    ).toBeVisible();

    // Click next
    await carousel.locator('[data-testid="carousel-next"]').click();
    await carousel.hover();

    // Now both arrows visible
    await expect(
      carousel.locator('[data-testid="carousel-prev"]'),
    ).toBeVisible();
    await expect(
      carousel.locator('[data-testid="carousel-next"]'),
    ).toBeVisible();
  });

  test("opens lightbox when clicking an image", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="gallery-carousel"]');

    // Click first image
    await page.locator('[data-testid="gallery-image-0"]').first().click();

    // Lightbox should appear
    await expect(page.locator('[data-testid="lightbox"]')).toBeVisible();
    await expect(page.locator('[data-testid="lightbox-image"]')).toBeVisible();
    await expect(page.locator('[data-testid="lightbox-counter"]')).toHaveText(
      "1 / 3",
    );
  });

  test("navigates images in lightbox", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="gallery-carousel"]');

    // Open lightbox
    await page.locator('[data-testid="gallery-image-0"]').first().click();
    await expect(page.locator('[data-testid="lightbox"]')).toBeVisible();

    // Navigate forward
    await page.locator('[data-testid="lightbox-next"]').click();
    await expect(page.locator('[data-testid="lightbox-counter"]')).toHaveText(
      "2 / 3",
    );

    // Navigate forward again
    await page.locator('[data-testid="lightbox-next"]').click();
    await expect(page.locator('[data-testid="lightbox-counter"]')).toHaveText(
      "3 / 3",
    );

    // Navigate backward
    await page.locator('[data-testid="lightbox-prev"]').click();
    await expect(page.locator('[data-testid="lightbox-counter"]')).toHaveText(
      "2 / 3",
    );
  });

  test("closes lightbox with close button", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="gallery-carousel"]');

    // Open lightbox
    await page.locator('[data-testid="gallery-image-0"]').first().click();
    await expect(page.locator('[data-testid="lightbox"]')).toBeVisible();

    // Close
    await page.locator('[data-testid="lightbox-close"]').click();
    await expect(page.locator('[data-testid="lightbox"]')).not.toBeVisible();
  });

  test("closes lightbox with Escape key", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="gallery-carousel"]');

    // Open lightbox
    await page.locator('[data-testid="gallery-image-0"]').first().click();
    await expect(page.locator('[data-testid="lightbox"]')).toBeVisible();

    // Press Escape
    await page.keyboard.press("Escape");
    await expect(page.locator('[data-testid="lightbox"]')).not.toBeVisible();
  });

  test("navigates lightbox with keyboard arrows", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="gallery-carousel"]');

    // Open lightbox
    await page.locator('[data-testid="gallery-image-0"]').first().click();
    await expect(page.locator('[data-testid="lightbox"]')).toBeVisible();
    await expect(page.locator('[data-testid="lightbox-counter"]')).toHaveText(
      "1 / 3",
    );

    // Arrow right
    await page.keyboard.press("ArrowRight");
    await expect(page.locator('[data-testid="lightbox-counter"]')).toHaveText(
      "2 / 3",
    );

    // Arrow left
    await page.keyboard.press("ArrowLeft");
    await expect(page.locator('[data-testid="lightbox-counter"]')).toHaveText(
      "1 / 3",
    );
  });
});
