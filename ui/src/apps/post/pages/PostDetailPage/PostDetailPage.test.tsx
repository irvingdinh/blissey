import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { vi } from "vitest";

import PostDetailPage from "./PostDetailPage";

function makePost(overrides: Record<string, unknown> = {}) {
  return {
    id: "post-1",
    content: JSON.stringify({
      blocks: [{ type: "paragraph", data: { text: "Hello world" } }],
    }),
    createdAt: "2026-02-10T10:00:00.000Z",
    updatedAt: "2026-02-10T10:00:00.000Z",
    reactions: [],
    commentCount: 0,
    attachments: [],
    ...overrides,
  };
}

function makeComment(overrides: Record<string, unknown> = {}) {
  return {
    id: "comment-1",
    postId: "post-1",
    content: JSON.stringify({
      blocks: [{ type: "paragraph", data: { text: "Nice post!" } }],
    }),
    createdAt: "2026-02-10T12:00:00.000Z",
    updatedAt: "2026-02-10T12:00:00.000Z",
    reactions: [],
    ...overrides,
  };
}

function renderPage(initialPath = "/posts/post-1") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/posts/:id" element={<PostDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("PostDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("shows loading spinner while fetching", () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockReturnValue(
      new Promise(() => {}),
    );
    renderPage();
    expect(screen.getByTestId("spinner")).toBeInTheDocument();
  });

  it("shows post not found when post does not exist", async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve([]),
      });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Post not found.")).toBeInTheDocument();
    });
  });

  it("renders post content with PostCard", async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(makePost()),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId("post-card")).toBeInTheDocument();
      expect(screen.getByText("Hello world")).toBeInTheDocument();
    });
  });

  it("renders comments section header", async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(makePost()),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId("comments-section")).toBeInTheDocument();
      expect(screen.getByText("Comments")).toBeInTheDocument();
    });
  });

  it("shows empty comments message when no comments", async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(makePost()),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("No comments yet.")).toBeInTheDocument();
    });
  });

  it("renders comments with content", async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(makePost({ commentCount: 1 })),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([makeComment()]),
      });

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId("comment-comment-1")).toBeInTheDocument();
      expect(screen.getByText("Nice post!")).toBeInTheDocument();
    });
  });

  it("shows comment count in header", async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(makePost({ commentCount: 2 })),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve([
            makeComment({ id: "c1" }),
            makeComment({ id: "c2" }),
          ]),
      });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Comments (2)")).toBeInTheDocument();
    });
  });

  it("shows write comment button", async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(makePost()),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId("write-comment-btn")).toBeInTheDocument();
    });
  });

  it("renders comment reactions", async () => {
    const commentWithReactions = makeComment({
      reactions: [{ emoji: "👍", count: 3, ids: ["r1", "r2", "r3"] }],
    });

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(makePost()),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([commentWithReactions]),
      });

    renderPage();

    await waitFor(() => {
      const badges = screen.getAllByTestId("reaction-badge");
      expect(badges.length).toBeGreaterThanOrEqual(1);
      expect(badges[0]).toHaveTextContent("👍 3");
    });
  });

  it("renders edit and delete buttons on comments", async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(makePost()),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([makeComment()]),
      });

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId("edit-comment-btn")).toBeInTheDocument();
      expect(screen.getByTestId("delete-comment-btn")).toBeInTheDocument();
    });
  });

  it("shows delete confirmation on comment delete", async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(makePost()),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([makeComment()]),
      });

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId("delete-comment-btn")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("delete-comment-btn"));

    await waitFor(() => {
      expect(
        screen.getByTestId("confirm-delete-comment-btn"),
      ).toBeInTheDocument();
    });
  });

  it("deletes a comment after confirmation", async () => {
    let callCount = 0;
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      (url: string, opts?: RequestInit) => {
        callCount++;
        if (opts?.method === "DELETE") {
          return Promise.resolve({ ok: true });
        }
        if (typeof url === "string" && url.includes("/comments")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(callCount <= 2 ? [makeComment()] : []),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(makePost()),
        });
      },
    );

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId("delete-comment-btn")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("delete-comment-btn"));

    await waitFor(() => {
      expect(
        screen.getByTestId("confirm-delete-comment-btn"),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("confirm-delete-comment-btn"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/comments/comment-1", {
        method: "DELETE",
      });
    });
  });

  it("shows back to feed button when post not found", async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve([]),
      });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Back to feed")).toBeInTheDocument();
    });
  });

  it("renders comment timestamps", async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(makePost()),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([makeComment()]),
      });

    renderPage();

    await waitFor(() => {
      // The comment has a relative timestamp
      const commentEl = screen.getByTestId("comment-comment-1");
      expect(commentEl).toBeInTheDocument();
      // It should contain some time text (e.g. "5d ago" or similar)
      expect(commentEl.textContent).toMatch(/(ago|just now)/);
    });
  });
});
