import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { vi } from "vitest";

import TrashPage from "./TrashPage";

function makeTrashedPost(overrides: Record<string, unknown> = {}) {
  return {
    id: "post-1",
    content: JSON.stringify({
      blocks: [{ type: "paragraph", data: { text: "Deleted post content" } }],
    }),
    createdAt: "2026-02-10T10:00:00.000Z",
    deletedAt: "2026-02-14T10:00:00.000Z",
    daysRemaining: 2,
    ...overrides,
  };
}

function renderTrashPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <TrashPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("TrashPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("shows loading spinner while fetching", () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockReturnValue(
      new Promise(() => {}),
    );
    renderTrashPage();
    expect(screen.getByTestId("spinner")).toBeInTheDocument();
  });

  it("shows empty state when trash is empty", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    renderTrashPage();

    await waitFor(() => {
      expect(screen.getByTestId("trash-empty")).toBeInTheDocument();
      expect(screen.getByText("Trash is empty.")).toBeInTheDocument();
    });
  });

  it("renders trashed posts with preview text", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([makeTrashedPost()]),
    });

    renderTrashPage();

    await waitFor(() => {
      expect(screen.getByTestId("trash-item")).toBeInTheDocument();
      expect(screen.getByText("Deleted post content")).toBeInTheDocument();
    });
  });

  it("shows days remaining badge", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([makeTrashedPost({ daysRemaining: 2 })]),
    });

    renderTrashPage();

    await waitFor(() => {
      expect(screen.getByTestId("days-remaining")).toHaveTextContent(
        "2 days left",
      );
    });
  });

  it("shows singular 'day' when 1 day remaining", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([makeTrashedPost({ daysRemaining: 1 })]),
    });

    renderTrashPage();

    await waitFor(() => {
      expect(screen.getByTestId("days-remaining")).toHaveTextContent(
        "1 day left",
      );
    });
  });

  it("shows 'Expires today' when 0 days remaining", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([makeTrashedPost({ daysRemaining: 0 })]),
    });

    renderTrashPage();

    await waitFor(() => {
      expect(screen.getByTestId("days-remaining")).toHaveTextContent(
        "Expires today",
      );
    });
  });

  it("uses destructive badge when 1 or fewer days remaining", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([makeTrashedPost({ daysRemaining: 1 })]),
    });

    renderTrashPage();

    await waitFor(() => {
      const badge = screen.getByTestId("days-remaining");
      expect(badge.className).toContain("bg-destructive");
    });
  });

  it("uses warning badge when more than 1 day remaining", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([makeTrashedPost({ daysRemaining: 2 })]),
    });

    renderTrashPage();

    await waitFor(() => {
      const badge = screen.getByTestId("days-remaining");
      expect(badge.className).toContain("text-amber-700");
    });
  });

  it("shows deletion date", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([makeTrashedPost()]),
    });

    renderTrashPage();

    await waitFor(() => {
      const metaText = screen.getByText(/Deleted Feb/);
      expect(metaText).toBeInTheDocument();
    });
  });

  it("expands post content when clicking preview", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([makeTrashedPost()]),
    });

    renderTrashPage();

    await waitFor(() => {
      expect(screen.getByTestId("trash-preview")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("trash-preview"));

    await waitFor(() => {
      expect(screen.getByText("Collapse")).toBeInTheDocument();
    });
  });

  it("collapses expanded content", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([makeTrashedPost()]),
    });

    renderTrashPage();

    await waitFor(() => {
      expect(screen.getByTestId("trash-preview")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("trash-preview"));

    await waitFor(() => {
      expect(screen.getByText("Collapse")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Collapse"));

    await waitFor(() => {
      expect(screen.getByTestId("trash-preview")).toBeInTheDocument();
    });
  });

  it("restores a post and shows success toast", async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([makeTrashedPost()]),
      })
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

    renderTrashPage();

    await waitFor(() => {
      expect(screen.getByTestId("restore-btn")).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId("restore-btn"));
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/trash/post-1/restore", {
        method: "POST",
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId("restore-toast")).toBeInTheDocument();
      expect(
        screen.getByText("Post restored successfully."),
      ).toBeInTheDocument();
    });
  });

  it("shows 'Empty post' for content without text blocks", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve([
          makeTrashedPost({
            content: JSON.stringify({ blocks: [] }),
          }),
        ]),
    });

    renderTrashPage();

    await waitFor(() => {
      expect(screen.getByText("Empty post")).toBeInTheDocument();
    });
  });

  it("renders multiple trashed posts", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve([
          makeTrashedPost({ id: "p1" }),
          makeTrashedPost({ id: "p2" }),
          makeTrashedPost({ id: "p3" }),
        ]),
    });

    renderTrashPage();

    await waitFor(() => {
      const items = screen.getAllByTestId("trash-item");
      expect(items).toHaveLength(3);
    });
  });

  it("renders the page title", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    renderTrashPage();

    await waitFor(() => {
      expect(screen.getByText("Trash")).toBeInTheDocument();
    });
  });
});
