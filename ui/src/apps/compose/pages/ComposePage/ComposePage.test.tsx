import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { vi } from "vitest";

// Mock EditorWrapper
const mockGetData = vi.fn().mockResolvedValue({
  time: 1,
  blocks: [{ type: "paragraph", data: { text: "Hello" } }],
});
const mockSetData = vi.fn().mockResolvedValue(undefined);

vi.mock("@/components/EditorWrapper", async () => {
  const React = await import("react");
  const MockEditor = React.forwardRef(function MockEditor(
    props: {
      onChange?: (data: { time: number; blocks: unknown[] }) => void;
      toolbar?: {
        left?: React.ReactNode;
        right?: React.ReactNode;
        bottom?: React.ReactNode;
      };
      fullscreen?: boolean;
    },
    ref: React.Ref<{
      getData: typeof mockGetData;
      setData: typeof mockSetData;
    }>,
  ) {
    React.useImperativeHandle(ref, () => ({
      getData: mockGetData,
      setData: mockSetData,
    }));
    return (
      <div data-testid="editor-wrapper">
        {props.toolbar?.left}
        {props.toolbar?.right}
        {props.toolbar?.bottom}
        <button
          data-testid="trigger-change"
          onClick={() =>
            props.onChange?.({
              time: 1,
              blocks: [{ type: "paragraph", data: { text: "Hello" } }],
            })
          }
        />
      </div>
    );
  });
  return { default: MockEditor };
});

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return { ...actual, useNavigate: () => mockNavigate };
});

function renderComposePage() {
  return render(
    <MemoryRouter>
      <ComposePage />
    </MemoryRouter>,
  );
}

// Must import after mocks
const { default: ComposePage } = await import("./ComposePage");

describe("ComposePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the editor with toolbar buttons", () => {
    renderComposePage();
    expect(screen.getByText("Back")).toBeInTheDocument();
    expect(screen.getByText("Publish")).toBeInTheDocument();
    expect(screen.getByTestId("drafts-btn")).toBeInTheDocument();
    expect(screen.getByTestId("gallery-upload-btn")).toBeInTheDocument();
    expect(screen.getByTestId("file-upload-btn")).toBeInTheDocument();
  });

  it("navigates back when clicking Back button", () => {
    renderComposePage();
    fireEvent.click(screen.getByText("Back"));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  describe("autosave", () => {
    it("creates a new draft on first autosave", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: "draft-1" }),
      });

      renderComposePage();
      fireEvent.click(screen.getByTestId("trigger-change"));

      // Advance debounce timer
      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/drafts",
          expect.objectContaining({ method: "POST" }),
        );
      });
    });

    it("shows 'Draft saved' indicator after save", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: "draft-1" }),
      });

      renderComposePage();
      fireEvent.click(screen.getByTestId("trigger-change"));

      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.getByText("Draft saved")).toBeInTheDocument();
      });
    });
  });

  describe("publish", () => {
    it("publishes a post and navigates to feed", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: "post-1" }),
      });

      renderComposePage();
      await act(async () => {
        fireEvent.click(screen.getByTestId("publish-btn"));
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/posts",
          expect.objectContaining({ method: "POST" }),
        );
        expect(mockNavigate).toHaveBeenCalledWith("/");
      });
    });

    it("shows error toast when publish fails", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
      });

      renderComposePage();
      await act(async () => {
        fireEvent.click(screen.getByTestId("publish-btn"));
      });

      await waitFor(() => {
        expect(screen.getByText("Failed to publish")).toBeInTheDocument();
      });
    });

    it("shows error toast when publishing empty content", async () => {
      mockGetData.mockResolvedValueOnce({ time: 1, blocks: [] });

      renderComposePage();
      await act(async () => {
        fireEvent.click(screen.getByTestId("publish-btn"));
      });

      await waitFor(() => {
        expect(
          screen.getByText("Cannot publish empty post"),
        ).toBeInTheDocument();
      });
    });
  });

  describe("drafts panel", () => {
    it("opens drafts panel and shows drafts list", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              id: "d1",
              content: JSON.stringify({
                blocks: [{ type: "paragraph", data: { text: "My draft" } }],
              }),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ]),
      });

      renderComposePage();

      await act(async () => {
        fireEvent.click(screen.getByTestId("drafts-btn"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("drafts-panel")).toBeInTheDocument();
        expect(screen.getByText("Drafts")).toBeInTheDocument();
        expect(screen.getByText("My draft")).toBeInTheDocument();
      });
    });

    it("shows empty state when no drafts", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      renderComposePage();

      await act(async () => {
        fireEvent.click(screen.getByTestId("drafts-btn"));
      });

      await waitFor(() => {
        expect(screen.getByText("No drafts")).toBeInTheDocument();
      });
    });

    it("loads a draft into the editor", async () => {
      const draftContent = JSON.stringify({
        blocks: [{ type: "paragraph", data: { text: "Draft content" } }],
      });

      // First call: fetch drafts list
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve([
              {
                id: "d1",
                content: draftContent,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ]),
        })
        // Second call: fetch single draft with attachments
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              id: "d1",
              content: draftContent,
              attachments: [],
            }),
        });

      renderComposePage();

      await act(async () => {
        fireEvent.click(screen.getByTestId("drafts-btn"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("load-draft-d1")).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId("load-draft-d1"));
      });

      await waitFor(() => {
        expect(mockSetData).toHaveBeenCalled();
        // Drafts panel should close
        expect(screen.queryByTestId("drafts-panel")).not.toBeInTheDocument();
      });
    });

    it("deletes a draft from the list", async () => {
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve([
              {
                id: "d1",
                content: JSON.stringify({
                  blocks: [
                    { type: "paragraph", data: { text: "Draft to delete" } },
                  ],
                }),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ]),
        })
        .mockResolvedValueOnce({ ok: true });

      renderComposePage();

      await act(async () => {
        fireEvent.click(screen.getByTestId("drafts-btn"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("delete-draft-d1")).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId("delete-draft-d1"));
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/drafts/d1", {
          method: "DELETE",
        });
      });
    });
  });

  describe("draftPreview helper", () => {
    it("extracts text from paragraph blocks for preview", async () => {
      const content = JSON.stringify({
        blocks: [{ type: "paragraph", data: { text: "Preview text here" } }],
      });

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              id: "d1",
              content,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ]),
      });

      renderComposePage();

      await act(async () => {
        fireEvent.click(screen.getByTestId("drafts-btn"));
      });

      await waitFor(() => {
        expect(screen.getByText("Preview text here")).toBeInTheDocument();
      });
    });

    it("shows 'Empty draft' for content without text", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              id: "d2",
              content: JSON.stringify({ blocks: [] }),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ]),
      });

      renderComposePage();

      await act(async () => {
        fireEvent.click(screen.getByTestId("drafts-btn"));
      });

      await waitFor(() => {
        expect(screen.getByText("Empty draft")).toBeInTheDocument();
      });
    });
  });
});
