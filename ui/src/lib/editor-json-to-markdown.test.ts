import { editorJsonToMarkdown } from "./editor-json-to-markdown";

function makeContent(blocks: object[]): string {
  return JSON.stringify({ blocks });
}

describe("editorJsonToMarkdown", () => {
  it("returns empty string for invalid JSON", () => {
    expect(editorJsonToMarkdown("not json")).toBe("");
  });

  it("returns empty string for empty blocks", () => {
    expect(editorJsonToMarkdown(makeContent([]))).toBe("");
  });

  describe("paragraph", () => {
    it("converts a simple paragraph", () => {
      const content = makeContent([
        { type: "paragraph", data: { text: "Hello world" } },
      ]);
      expect(editorJsonToMarkdown(content)).toBe("Hello world");
    });

    it("converts bold inline formatting", () => {
      const content = makeContent([
        { type: "paragraph", data: { text: "This is <b>bold</b> text" } },
      ]);
      expect(editorJsonToMarkdown(content)).toBe("This is **bold** text");
    });

    it("converts italic inline formatting", () => {
      const content = makeContent([
        { type: "paragraph", data: { text: "This is <i>italic</i> text" } },
      ]);
      expect(editorJsonToMarkdown(content)).toBe("This is *italic* text");
    });

    it("converts inline code", () => {
      const content = makeContent([
        {
          type: "paragraph",
          data: { text: "Use <code>const x = 1</code> here" },
        },
      ]);
      expect(editorJsonToMarkdown(content)).toBe("Use `const x = 1` here");
    });

    it("converts links", () => {
      const content = makeContent([
        {
          type: "paragraph",
          data: {
            text: 'Visit <a href="https://example.com">Example</a> site',
          },
        },
      ]);
      expect(editorJsonToMarkdown(content)).toBe(
        "Visit [Example](https://example.com) site",
      );
    });

    it("converts strikethrough", () => {
      const content = makeContent([
        { type: "paragraph", data: { text: "This is <s>deleted</s> text" } },
      ]);
      expect(editorJsonToMarkdown(content)).toBe("This is ~~deleted~~ text");
    });

    it("strips underline tags (no markdown equivalent)", () => {
      const content = makeContent([
        { type: "paragraph", data: { text: "This is <u>underlined</u> text" } },
      ]);
      expect(editorJsonToMarkdown(content)).toBe("This is underlined text");
    });

    it("strips mark tags", () => {
      const content = makeContent([
        {
          type: "paragraph",
          data: { text: "This is <mark>highlighted</mark> text" },
        },
      ]);
      expect(editorJsonToMarkdown(content)).toBe("This is highlighted text");
    });

    it("handles nested inline formatting", () => {
      const content = makeContent([
        {
          type: "paragraph",
          data: { text: "<b><i>bold italic</i></b>" },
        },
      ]);
      expect(editorJsonToMarkdown(content)).toBe("***bold italic***");
    });

    it("converts <br> to newlines", () => {
      const content = makeContent([
        { type: "paragraph", data: { text: "Line 1<br>Line 2" } },
      ]);
      expect(editorJsonToMarkdown(content)).toBe("Line 1\nLine 2");
    });

    it("decodes HTML entities", () => {
      const content = makeContent([
        { type: "paragraph", data: { text: "A &amp; B &lt; C &gt; D" } },
      ]);
      expect(editorJsonToMarkdown(content)).toBe("A & B < C > D");
    });
  });

  describe("header", () => {
    it("converts h1", () => {
      const content = makeContent([
        { type: "header", data: { text: "Title", level: 1 } },
      ]);
      expect(editorJsonToMarkdown(content)).toBe("# Title");
    });

    it("converts h2", () => {
      const content = makeContent([
        { type: "header", data: { text: "Subtitle", level: 2 } },
      ]);
      expect(editorJsonToMarkdown(content)).toBe("## Subtitle");
    });

    it("converts h3", () => {
      const content = makeContent([
        { type: "header", data: { text: "Section", level: 3 } },
      ]);
      expect(editorJsonToMarkdown(content)).toBe("### Section");
    });

    it("converts h6", () => {
      const content = makeContent([
        { type: "header", data: { text: "Minor", level: 6 } },
      ]);
      expect(editorJsonToMarkdown(content)).toBe("###### Minor");
    });

    it("defaults to h2 when no level specified", () => {
      const content = makeContent([
        { type: "header", data: { text: "Default" } },
      ]);
      expect(editorJsonToMarkdown(content)).toBe("## Default");
    });

    it("handles inline formatting in headings", () => {
      const content = makeContent([
        { type: "header", data: { text: "The <b>Bold</b> Title", level: 1 } },
      ]);
      expect(editorJsonToMarkdown(content)).toBe("# The **Bold** Title");
    });
  });

  describe("quote", () => {
    it("converts a simple quote", () => {
      const content = makeContent([
        { type: "quote", data: { text: "To be or not to be" } },
      ]);
      expect(editorJsonToMarkdown(content)).toBe("> To be or not to be");
    });

    it("converts a quote with caption", () => {
      const content = makeContent([
        {
          type: "quote",
          data: { text: "To be or not to be", caption: "Shakespeare" },
        },
      ]);
      expect(editorJsonToMarkdown(content)).toBe(
        "> To be or not to be\n> \u2014 Shakespeare",
      );
    });

    it("handles multiline quotes", () => {
      const content = makeContent([
        {
          type: "quote",
          data: { text: "Line one<br>Line two" },
        },
      ]);
      expect(editorJsonToMarkdown(content)).toBe("> Line one\n> Line two");
    });
  });

  describe("list", () => {
    it("converts an unordered list", () => {
      const content = makeContent([
        {
          type: "list",
          data: { style: "unordered", items: ["Apple", "Banana", "Cherry"] },
        },
      ]);
      expect(editorJsonToMarkdown(content)).toBe("- Apple\n- Banana\n- Cherry");
    });

    it("converts an ordered list", () => {
      const content = makeContent([
        {
          type: "list",
          data: { style: "ordered", items: ["First", "Second", "Third"] },
        },
      ]);
      expect(editorJsonToMarkdown(content)).toBe(
        "1. First\n2. Second\n3. Third",
      );
    });

    it("converts nested list items (object format)", () => {
      const content = makeContent([
        {
          type: "list",
          data: {
            style: "unordered",
            items: [
              {
                content: "Parent",
                items: [{ content: "Child 1" }, { content: "Child 2" }],
              },
              "Sibling",
            ],
          },
        },
      ]);
      expect(editorJsonToMarkdown(content)).toBe(
        "- Parent\n  - Child 1\n  - Child 2\n- Sibling",
      );
    });

    it("handles inline formatting in list items", () => {
      const content = makeContent([
        {
          type: "list",
          data: {
            style: "unordered",
            items: ["<b>Bold</b> item", "Normal item"],
          },
        },
      ]);
      expect(editorJsonToMarkdown(content)).toBe(
        "- **Bold** item\n- Normal item",
      );
    });
  });

  describe("checklist", () => {
    it("converts checklist items", () => {
      const content = makeContent([
        {
          type: "checklist",
          data: {
            items: [
              { text: "Done task", checked: true },
              { text: "Pending task", checked: false },
            ],
          },
        },
      ]);
      expect(editorJsonToMarkdown(content)).toBe(
        "- [x] Done task\n- [ ] Pending task",
      );
    });

    it("handles inline formatting in checklist items", () => {
      const content = makeContent([
        {
          type: "checklist",
          data: {
            items: [{ text: "<b>Important</b> task", checked: false }],
          },
        },
      ]);
      expect(editorJsonToMarkdown(content)).toBe("- [ ] **Important** task");
    });
  });

  describe("code", () => {
    it("converts a code block", () => {
      const content = makeContent([
        { type: "code", data: { code: "const x = 1;\nconsole.log(x);" } },
      ]);
      expect(editorJsonToMarkdown(content)).toBe(
        "```\nconst x = 1;\nconsole.log(x);\n```",
      );
    });

    it("handles empty code block", () => {
      const content = makeContent([{ type: "code", data: { code: "" } }]);
      expect(editorJsonToMarkdown(content)).toBe("```\n\n```");
    });
  });

  describe("delimiter", () => {
    it("converts to horizontal rule", () => {
      const content = makeContent([{ type: "delimiter", data: {} }]);
      expect(editorJsonToMarkdown(content)).toBe("---");
    });
  });

  describe("image", () => {
    it("converts an image with caption", () => {
      const content = makeContent([
        {
          type: "image",
          data: {
            file: { url: "/uploads/photo.jpg" },
            caption: "A beautiful photo",
          },
        },
      ]);
      expect(editorJsonToMarkdown(content)).toBe(
        "![A beautiful photo](/uploads/photo.jpg)",
      );
    });

    it("converts an image without caption", () => {
      const content = makeContent([
        {
          type: "image",
          data: { file: { url: "/uploads/photo.jpg" } },
        },
      ]);
      expect(editorJsonToMarkdown(content)).toBe("![](/uploads/photo.jpg)");
    });
  });

  describe("embed", () => {
    it("converts an embed with caption", () => {
      const content = makeContent([
        {
          type: "embed",
          data: {
            service: "youtube",
            source: "https://youtube.com/watch?v=abc",
            embed: "https://youtube.com/embed/abc",
            caption: "My video",
          },
        },
      ]);
      expect(editorJsonToMarkdown(content)).toBe(
        "[My video](https://youtube.com/watch?v=abc)",
      );
    });

    it("converts an embed without caption", () => {
      const content = makeContent([
        {
          type: "embed",
          data: {
            service: "youtube",
            source: "https://youtube.com/watch?v=abc",
            embed: "https://youtube.com/embed/abc",
          },
        },
      ]);
      expect(editorJsonToMarkdown(content)).toBe(
        "https://youtube.com/watch?v=abc",
      );
    });
  });

  describe("table", () => {
    it("converts a table with headings", () => {
      const content = makeContent([
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
      ]);
      expect(editorJsonToMarkdown(content)).toBe(
        "| Name | Age |\n| --- | --- |\n| Alice | 30 |\n| Bob | 25 |",
      );
    });

    it("converts a table without headings", () => {
      const content = makeContent([
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
      ]);
      expect(editorJsonToMarkdown(content)).toBe("| A | B |\n| C | D |");
    });

    it("handles inline formatting in table cells", () => {
      const content = makeContent([
        {
          type: "table",
          data: {
            withHeadings: true,
            content: [
              ["<b>Header</b>", "Value"],
              ["Data", "<i>Italic</i>"],
            ],
          },
        },
      ]);
      expect(editorJsonToMarkdown(content)).toBe(
        "| **Header** | Value |\n| --- | --- |\n| Data | *Italic* |",
      );
    });

    it("returns empty for empty table", () => {
      const content = makeContent([{ type: "table", data: { content: [] } }]);
      expect(editorJsonToMarkdown(content)).toBe("");
    });
  });

  describe("warning", () => {
    it("converts a warning block", () => {
      const content = makeContent([
        {
          type: "warning",
          data: { title: "Warning", message: "Be careful here" },
        },
      ]);
      expect(editorJsonToMarkdown(content)).toBe(
        "> **Warning**: Be careful here",
      );
    });

    it("handles inline formatting in warning", () => {
      const content = makeContent([
        {
          type: "warning",
          data: { title: "Note", message: "Use <code>npm</code> instead" },
        },
      ]);
      expect(editorJsonToMarkdown(content)).toBe(
        "> **Note**: Use `npm` instead",
      );
    });
  });

  describe("unknown block type", () => {
    it("skips unknown block types", () => {
      const content = makeContent([
        { type: "paragraph", data: { text: "Before" } },
        { type: "unknownBlock", data: { foo: "bar" } },
        { type: "paragraph", data: { text: "After" } },
      ]);
      expect(editorJsonToMarkdown(content)).toBe("Before\n\nAfter");
    });
  });

  describe("multiple blocks", () => {
    it("joins blocks with double newlines", () => {
      const content = makeContent([
        { type: "header", data: { text: "Title", level: 1 } },
        { type: "paragraph", data: { text: "Some text" } },
        { type: "delimiter", data: {} },
        { type: "paragraph", data: { text: "More text" } },
      ]);
      expect(editorJsonToMarkdown(content)).toBe(
        "# Title\n\nSome text\n\n---\n\nMore text",
      );
    });

    it("handles a complex document", () => {
      const content = makeContent([
        { type: "header", data: { text: "My Post", level: 1 } },
        {
          type: "paragraph",
          data: { text: "This is a <b>great</b> post about <i>coding</i>." },
        },
        {
          type: "list",
          data: {
            style: "unordered",
            items: ["Point 1", "Point 2"],
          },
        },
        {
          type: "code",
          data: { code: "console.log('hello');" },
        },
        {
          type: "quote",
          data: {
            text: "Stay hungry, stay foolish",
            caption: "Steve Jobs",
          },
        },
      ]);

      const expected = [
        "# My Post",
        "",
        "This is a **great** post about *coding*.",
        "",
        "- Point 1\n- Point 2",
        "",
        "```\nconsole.log('hello');\n```",
        "",
        "> Stay hungry, stay foolish\n> \u2014 Steve Jobs",
      ].join("\n");

      expect(editorJsonToMarkdown(content)).toBe(expected);
    });
  });
});
