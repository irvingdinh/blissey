import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";

import type { Post } from "@/lib/types";

import { PostCard } from "./PostCard";

function makePost(overrides: Partial<Post> = {}): Post {
  return {
    id: "test-1",
    content: JSON.stringify({
      blocks: [{ type: "paragraph", data: { text: "Hello world" } }],
    }),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    reactions: [],
    commentCount: 0,
    attachments: [],
    ...overrides,
  };
}

function renderPostCard(post: Post) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <PostCard post={post} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("PostCard", () => {
  it("renders post content using BlockRenderer", () => {
    renderPostCard(makePost());
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("renders relative timestamp", () => {
    renderPostCard(makePost());
    expect(screen.getByText("just now")).toBeInTheDocument();
  });

  it("renders older timestamp as relative time", () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    renderPostCard(makePost({ createdAt: twoHoursAgo }));
    expect(screen.getByText("2h ago")).toBeInTheDocument();
  });

  it("renders reactions when present", () => {
    renderPostCard(
      makePost({
        reactions: [
          { emoji: "👍", count: 3, ids: ["r1", "r2", "r3"] },
          { emoji: "❤️", count: 1, ids: ["r4"] },
        ],
      }),
    );
    const badges = screen.getAllByTestId("reaction-badge");
    expect(badges).toHaveLength(2);
    expect(badges[0].textContent).toContain("👍");
    expect(badges[0].textContent).toContain("3");
    expect(badges[1].textContent).toContain("❤️");
  });

  it("renders add reaction button when no reactions exist", () => {
    renderPostCard(makePost({ reactions: [] }));
    expect(screen.getByTestId("add-reaction-btn")).toBeInTheDocument();
  });

  it("renders comment count", () => {
    renderPostCard(makePost({ commentCount: 5 }));
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("renders link to post comments", () => {
    const { container } = renderPostCard(makePost({ id: "abc123" }));
    const commentsLink = container.querySelector(
      'a[href="/posts/abc123#comments"]',
    );
    expect(commentsLink).toBeInTheDocument();
  });

  it("renders link to edit post", () => {
    const { container } = renderPostCard(makePost({ id: "abc123" }));
    const editLink = container.querySelector('a[href="/posts/abc123/edit"]');
    expect(editLink).toBeInTheDocument();
  });

  it("renders gallery carousel when gallery attachments exist", () => {
    renderPostCard(
      makePost({
        attachments: [
          {
            id: "att-1",
            category: "gallery",
            fileName: "photo.jpg",
            filePath: "2024/photo.jpg",
            fileSize: 1024,
            mimeType: "image/jpeg",
            thumbnailPath: "thumbnails/photo.jpg",
          },
        ],
      }),
    );
    expect(screen.getByTestId("gallery-carousel")).toBeInTheDocument();
    const img = screen.getByTestId("gallery-image-0");
    expect(img).toHaveAttribute("src", "/uploads/thumbnails/photo.jpg");
  });

  it("uses filePath when thumbnailPath is null in gallery", () => {
    renderPostCard(
      makePost({
        attachments: [
          {
            id: "att-1",
            category: "gallery",
            fileName: "photo.jpg",
            filePath: "2024/photo.jpg",
            fileSize: 1024,
            mimeType: "image/jpeg",
            thumbnailPath: null,
          },
        ],
      }),
    );
    const img = screen.getByTestId("gallery-image-0");
    expect(img).toHaveAttribute("src", "/uploads/2024/photo.jpg");
  });

  it("renders file attachments with name and size", () => {
    renderPostCard(
      makePost({
        attachments: [
          {
            id: "att-2",
            category: "attachment",
            fileName: "recording.mp3",
            filePath: "2024/recording.mp3",
            fileSize: 2048,
            mimeType: "audio/mpeg",
            thumbnailPath: null,
          },
        ],
      }),
    );
    expect(screen.getByText("recording.mp3")).toBeInTheDocument();
    expect(screen.getByText("2 KB")).toBeInTheDocument();
  });

  it("renders post-card test id", () => {
    renderPostCard(makePost());
    expect(screen.getByTestId("post-card")).toBeInTheDocument();
  });
});
