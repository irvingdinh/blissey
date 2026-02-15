import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { vi } from "vitest";

import EditPostPage from "./EditPostPage";

function makePost(overrides: Record<string, unknown> = {}) {
  return {
    id: "post-1",
    content: JSON.stringify({
      blocks: [{ type: "paragraph", data: { text: "Existing content" } }],
    }),
    createdAt: "2026-02-10T10:00:00.000Z",
    updatedAt: "2026-02-10T10:00:00.000Z",
    reactions: [],
    commentCount: 0,
    attachments: [],
    ...overrides,
  };
}

function renderPage(initialPath = "/posts/post-1/edit") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/posts/:id/edit" element={<EditPostPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("EditPostPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("shows loading spinner while fetching", () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockReturnValue(
      new Promise(() => {}),
    );
    renderPage();
    expect(document.querySelector(".loading-spinner")).toBeInTheDocument();
  });

  it("fetches post data on mount", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(makePost()),
    });

    renderPage();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/posts/post-1");
    });
  });

  it("renders editor after loading post", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(makePost()),
    });

    renderPage();

    await waitFor(() => {
      // Loading spinner should disappear
      expect(
        document.querySelector(".loading-spinner"),
      ).not.toBeInTheDocument();
    });
  });

  it("shows back button", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(makePost()),
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId("back-btn")).toBeInTheDocument();
      expect(screen.getByText("Back")).toBeInTheDocument();
    });
  });

  it("shows save button", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(makePost()),
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId("save-btn")).toBeInTheDocument();
      expect(screen.getByText("Save")).toBeInTheDocument();
    });
  });

  it("shows gallery upload button", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(makePost()),
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId("gallery-upload-btn")).toBeInTheDocument();
    });
  });

  it("shows file upload button", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(makePost()),
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId("file-upload-btn")).toBeInTheDocument();
    });
  });

  it("displays gallery attachments from post", async () => {
    const postWithGallery = makePost({
      attachments: [
        {
          id: "att-1",
          category: "gallery",
          fileName: "photo.jpg",
          filePath: "images/photo.jpg",
          fileSize: 2048,
          mimeType: "image/jpeg",
          thumbnailPath: "thumbnails/photo.jpg",
        },
      ],
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(postWithGallery),
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId("gallery-preview")).toBeInTheDocument();
      const img = screen.getByAltText("photo.jpg");
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("src", "/uploads/thumbnails/photo.jpg");
    });
  });

  it("displays file attachments from post", async () => {
    const postWithFile = makePost({
      attachments: [
        {
          id: "att-2",
          category: "attachment",
          fileName: "audio.mp3",
          filePath: "files/audio.mp3",
          fileSize: 4096,
          mimeType: "audio/mpeg",
          thumbnailPath: null,
        },
      ],
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(postWithFile),
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId("file-preview")).toBeInTheDocument();
      expect(screen.getByText("audio.mp3")).toBeInTheDocument();
      expect(screen.getByText("4 KB")).toBeInTheDocument();
    });
  });

  it("shows toast on fetch failure", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({}),
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Failed to load post")).toBeInTheDocument();
    });
  });

  it("shows remove button for gallery attachments", async () => {
    const postWithGallery = makePost({
      attachments: [
        {
          id: "att-1",
          category: "gallery",
          fileName: "photo.jpg",
          filePath: "images/photo.jpg",
          fileSize: 2048,
          mimeType: "image/jpeg",
          thumbnailPath: null,
        },
      ],
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(postWithGallery),
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId("remove-gallery-att-1")).toBeInTheDocument();
    });
  });

  it("shows remove button for file attachments", async () => {
    const postWithFile = makePost({
      attachments: [
        {
          id: "att-2",
          category: "attachment",
          fileName: "audio.mp3",
          filePath: "files/audio.mp3",
          fileSize: 4096,
          mimeType: "audio/mpeg",
          thumbnailPath: null,
        },
      ],
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(postWithFile),
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId("remove-file-att-2")).toBeInTheDocument();
    });
  });
});
