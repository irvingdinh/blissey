import type { OutputData } from "@editorjs/editorjs";
import { act, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { vi } from "vitest";

import type { EditorWrapperHandle } from "./EditorWrapper";
import EditorWrapper from "./EditorWrapper";

interface MockInstance {
  save: ReturnType<typeof vi.fn>;
  render: ReturnType<typeof vi.fn>;
  destroy: ReturnType<typeof vi.fn>;
}

let lastInstance: MockInstance | null = null;
let capturedConfig: Record<string, unknown> | null = null;

vi.mock("@editorjs/editorjs", () => {
  // Use a named function (not arrow) so it can be used with `new`
  function MockEditorJS(config: Record<string, unknown>) {
    capturedConfig = config;
    const instance: MockInstance = {
      save: vi.fn().mockResolvedValue({
        time: 1,
        blocks: [{ type: "paragraph", data: { text: "Hello" } }],
      }),
      render: vi.fn().mockResolvedValue(undefined),
      destroy: vi.fn(),
    };
    lastInstance = instance;
    setTimeout(() => {
      (config.onReady as () => void)?.();
    }, 0);
    return instance;
  }
  return { default: MockEditorJS };
});

vi.mock("@editorjs/header", () => ({ default: class {} }));
vi.mock("@editorjs/quote", () => ({ default: class {} }));
vi.mock("@editorjs/list", () => ({ default: class {} }));
vi.mock("@editorjs/checklist", () => ({ default: class {} }));
vi.mock("@editorjs/code", () => ({ default: class {} }));
vi.mock("@editorjs/delimiter", () => ({ default: class {} }));
vi.mock("@editorjs/image", () => ({ default: class {} }));
vi.mock("@editorjs/embed", () => ({ default: class {} }));
vi.mock("@editorjs/table", () => ({ default: class {} }));
vi.mock("@editorjs/warning", () => ({ default: class {} }));

async function waitForEditorReady() {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 10));
  });
}

describe("EditorWrapper", () => {
  beforeEach(() => {
    capturedConfig = null;
    lastInstance = null;
  });

  afterEach(async () => {
    // Flush all pending async effects from previous renders
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });
  });

  it("renders a container div", () => {
    const { container } = render(<EditorWrapper />);
    expect(container.querySelector("div")).toBeInTheDocument();
  });

  it("renders fullscreen layout with toolbar", () => {
    render(
      <EditorWrapper
        fullscreen
        toolbar={{
          left: <button>Back</button>,
          right: <button>Publish</button>,
        }}
      />,
    );
    expect(screen.getByText("Back")).toBeInTheDocument();
    expect(screen.getByText("Publish")).toBeInTheDocument();
  });

  it("does not render toolbar in non-fullscreen mode", () => {
    render(
      <EditorWrapper
        toolbar={{
          left: <button>Back</button>,
          right: <button>Publish</button>,
        }}
      />,
    );
    expect(screen.queryByText("Back")).not.toBeInTheDocument();
  });

  it("exposes getData via ref", async () => {
    const ref = createRef<EditorWrapperHandle>();

    await act(async () => {
      render(<EditorWrapper ref={ref} />);
    });
    await waitForEditorReady();

    const data = await ref.current!.getData();
    expect(data.blocks).toHaveLength(1);
    expect(data.blocks[0].type).toBe("paragraph");
    expect(lastInstance!.save).toHaveBeenCalled();
  });

  it("exposes setData via ref", async () => {
    const ref = createRef<EditorWrapperHandle>();
    render(<EditorWrapper ref={ref} />);

    await waitForEditorReady();

    const newData: OutputData = {
      time: 2,
      blocks: [{ type: "header", data: { text: "Title", level: 2 } }],
    };
    await ref.current!.setData(newData);
    expect(lastInstance!.render).toHaveBeenCalledWith(newData);
  });

  it("calls onChange when editor content changes", async () => {
    const handleChange = vi.fn();
    render(<EditorWrapper onChange={handleChange} />);

    await waitForEditorReady();

    expect(capturedConfig).not.toBeNull();
    const onChangeFn = capturedConfig!.onChange as (api: {
      saver: { save: () => Promise<OutputData> };
    }) => Promise<void>;
    await act(async () => {
      await onChangeFn({ saver: { save: lastInstance!.save } });
    });

    expect(handleChange).toHaveBeenCalledWith({
      time: 1,
      blocks: [{ type: "paragraph", data: { text: "Hello" } }],
    });
  });

  it("destroys editor on unmount", async () => {
    const { unmount } = render(<EditorWrapper />);

    await waitForEditorReady();

    unmount();
    expect(lastInstance!.destroy).toHaveBeenCalled();
  });

  it("initializes with all block tools", async () => {
    render(<EditorWrapper />);

    await waitForEditorReady();

    expect(capturedConfig).not.toBeNull();
    const tools = capturedConfig!.tools as Record<string, unknown>;
    const expectedTools = [
      "header",
      "quote",
      "list",
      "checklist",
      "code",
      "delimiter",
      "image",
      "embed",
      "table",
      "warning",
    ];
    for (const tool of expectedTools) {
      expect(tools).toHaveProperty(tool);
    }
  });

  it("passes initial data to editor", async () => {
    const initialData: OutputData = {
      time: 0,
      blocks: [{ type: "paragraph", data: { text: "Initial" } }],
    };
    render(<EditorWrapper initialData={initialData} />);

    await waitForEditorReady();

    expect(capturedConfig!.data).toEqual(initialData);
  });
});
