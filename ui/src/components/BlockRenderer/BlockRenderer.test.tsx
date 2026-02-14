import type { OutputBlockData } from "@editorjs/editorjs";
import { render, screen } from "@testing-library/react";

import { BlockRenderer } from "./BlockRenderer";

describe("BlockRenderer", () => {
  it("renders nothing for empty blocks array", () => {
    const { container } = render(<BlockRenderer blocks={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing for undefined blocks", () => {
    const { container } = render(
      <BlockRenderer blocks={undefined as unknown as OutputBlockData[]} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders a paragraph block", () => {
    const blocks: OutputBlockData[] = [
      { type: "paragraph", data: { text: "Hello world" } },
    ];
    render(<BlockRenderer blocks={blocks} />);
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("renders a heading block", () => {
    const blocks: OutputBlockData[] = [
      { type: "header", data: { text: "My Title", level: 1 } },
    ];
    render(<BlockRenderer blocks={blocks} />);
    const heading = screen.getByText("My Title");
    expect(heading.tagName).toBe("H1");
  });

  it("renders heading levels 1-6", () => {
    for (let level = 1; level <= 6; level++) {
      const blocks: OutputBlockData[] = [
        { type: "header", data: { text: `Heading ${level}`, level } },
      ];
      const { unmount } = render(<BlockRenderer blocks={blocks} />);
      const heading = screen.getByText(`Heading ${level}`);
      expect(heading.tagName).toBe(`H${level}`);
      unmount();
    }
  });

  it("renders a quote block with caption", () => {
    const blocks: OutputBlockData[] = [
      {
        type: "quote",
        data: { text: "To be or not to be", caption: "Shakespeare" },
      },
    ];
    render(<BlockRenderer blocks={blocks} />);
    expect(screen.getByText("To be or not to be")).toBeInTheDocument();
    expect(screen.getByText("Shakespeare")).toBeInTheDocument();
  });

  it("renders an unordered list", () => {
    const blocks: OutputBlockData[] = [
      {
        type: "list",
        data: {
          style: "unordered",
          items: [
            { content: "Item 1", items: [] },
            { content: "Item 2", items: [] },
          ],
        },
      },
    ];
    render(<BlockRenderer blocks={blocks} />);
    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
  });

  it("renders an ordered list", () => {
    const blocks: OutputBlockData[] = [
      {
        type: "list",
        data: {
          style: "ordered",
          items: [
            { content: "First", items: [] },
            { content: "Second", items: [] },
          ],
        },
      },
    ];
    const { container } = render(<BlockRenderer blocks={blocks} />);
    expect(container.querySelector("ol")).toBeInTheDocument();
  });

  it("renders nested list items", () => {
    const blocks: OutputBlockData[] = [
      {
        type: "list",
        data: {
          style: "unordered",
          items: [
            {
              content: "Parent",
              items: [{ content: "Child", items: [] }],
            },
          ],
        },
      },
    ];
    render(<BlockRenderer blocks={blocks} />);
    expect(screen.getByText("Parent")).toBeInTheDocument();
    expect(screen.getByText("Child")).toBeInTheDocument();
  });

  it("renders a checklist", () => {
    const blocks: OutputBlockData[] = [
      {
        type: "checklist",
        data: {
          items: [
            { text: "Done task", checked: true },
            { text: "Pending task", checked: false },
          ],
        },
      },
    ];
    render(<BlockRenderer blocks={blocks} />);
    expect(screen.getByText("Done task")).toBeInTheDocument();
    expect(screen.getByText("Pending task")).toBeInTheDocument();

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();
  });

  it("renders a code block", () => {
    const blocks: OutputBlockData[] = [
      { type: "code", data: { code: "const x = 42;" } },
    ];
    render(<BlockRenderer blocks={blocks} />);
    expect(screen.getByText("const x = 42;")).toBeInTheDocument();
  });

  it("renders a delimiter", () => {
    const blocks: OutputBlockData[] = [{ type: "delimiter", data: {} }];
    const { container } = render(<BlockRenderer blocks={blocks} />);
    expect(container.querySelector("hr")).toBeInTheDocument();
  });

  it("renders an image block", () => {
    const blocks: OutputBlockData[] = [
      {
        type: "image",
        data: {
          file: { url: "/uploads/test.jpg" },
          caption: "Test image",
        },
      },
    ];
    render(<BlockRenderer blocks={blocks} />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "/uploads/test.jpg");
    expect(screen.getByText("Test image")).toBeInTheDocument();
  });

  it("renders an image with stretched style", () => {
    const blocks: OutputBlockData[] = [
      {
        type: "image",
        data: {
          file: { url: "/uploads/test.jpg" },
          stretched: true,
        },
      },
    ];
    const { container } = render(<BlockRenderer blocks={blocks} />);
    const img = container.querySelector("img");
    expect(img).toBeInTheDocument();
    expect(img!.className).toContain("w-full");
  });

  it("renders an embed block", () => {
    const blocks: OutputBlockData[] = [
      {
        type: "embed",
        data: {
          service: "youtube",
          source: "https://youtube.com/watch?v=abc",
          embed: "https://www.youtube.com/embed/abc",
          caption: "My video",
        },
      },
    ];
    render(<BlockRenderer blocks={blocks} />);
    const iframe = document.querySelector("iframe");
    expect(iframe).toBeInTheDocument();
    expect(iframe!.getAttribute("src")).toBe(
      "https://www.youtube.com/embed/abc",
    );
    expect(screen.getByText("My video")).toBeInTheDocument();
  });

  it("renders a table block with headers", () => {
    const blocks: OutputBlockData[] = [
      {
        type: "table",
        data: {
          withHeadings: true,
          content: [
            ["Name", "Age"],
            ["Alice", "30"],
            ["Bob", "25"],
          ],
        },
      },
    ];
    render(<BlockRenderer blocks={blocks} />);
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("renders a table block without headers", () => {
    const blocks: OutputBlockData[] = [
      {
        type: "table",
        data: {
          withHeadings: false,
          content: [
            ["A", "B"],
            ["C", "D"],
          ],
        },
      },
    ];
    const { container } = render(<BlockRenderer blocks={blocks} />);
    expect(container.querySelector("thead")).not.toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("renders a warning block", () => {
    const blocks: OutputBlockData[] = [
      {
        type: "warning",
        data: { title: "Caution", message: "Be careful here" },
      },
    ];
    render(<BlockRenderer blocks={blocks} />);
    expect(screen.getByText("Caution")).toBeInTheDocument();
    expect(screen.getByText("Be careful here")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("skips unknown block types", () => {
    const blocks: OutputBlockData[] = [
      { type: "unknown-thing", data: { text: "Invisible" } },
      { type: "paragraph", data: { text: "Visible" } },
    ];
    render(<BlockRenderer blocks={blocks} />);
    expect(screen.queryByText("Invisible")).not.toBeInTheDocument();
    expect(screen.getByText("Visible")).toBeInTheDocument();
  });

  it("renders multiple blocks in order", () => {
    const blocks: OutputBlockData[] = [
      { type: "header", data: { text: "Title", level: 2 } },
      { type: "paragraph", data: { text: "Body text" } },
      { type: "delimiter", data: {} },
      { type: "paragraph", data: { text: "After delimiter" } },
    ];
    const { container } = render(<BlockRenderer blocks={blocks} />);
    const children = container.firstChild!.childNodes;
    expect(children).toHaveLength(4);
  });

  it("renders inline formatting in paragraphs", () => {
    const blocks: OutputBlockData[] = [
      {
        type: "paragraph",
        data: { text: "Hello <b>bold</b> and <i>italic</i> text" },
      },
    ];
    const { container } = render(<BlockRenderer blocks={blocks} />);
    expect(container.querySelector("b")).toBeInTheDocument();
    expect(container.querySelector("b")!.textContent).toBe("bold");
    expect(container.querySelector("i")).toBeInTheDocument();
    expect(container.querySelector("i")!.textContent).toBe("italic");
  });

  it("uses block id as key when available", () => {
    const blocks: OutputBlockData[] = [
      { id: "abc123", type: "paragraph", data: { text: "With ID" } },
    ];
    render(<BlockRenderer blocks={blocks} />);
    expect(screen.getByText("With ID")).toBeInTheDocument();
  });

  it("renders list with string items (legacy format)", () => {
    const blocks: OutputBlockData[] = [
      {
        type: "list",
        data: {
          style: "unordered",
          items: ["Simple item 1", "Simple item 2"],
        },
      },
    ];
    render(<BlockRenderer blocks={blocks} />);
    expect(screen.getByText("Simple item 1")).toBeInTheDocument();
    expect(screen.getByText("Simple item 2")).toBeInTheDocument();
  });
});
