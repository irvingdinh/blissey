import { sanitizeInlineHtml } from "./parse-inline";

describe("sanitizeInlineHtml", () => {
  it("passes through plain text", () => {
    expect(sanitizeInlineHtml("Hello world")).toBe("Hello world");
  });

  it("allows bold tags", () => {
    expect(sanitizeInlineHtml("<b>bold</b>")).toBe("<b>bold</b>");
  });

  it("allows italic tags", () => {
    expect(sanitizeInlineHtml("<i>italic</i>")).toBe("<i>italic</i>");
  });

  it("allows code tags", () => {
    expect(sanitizeInlineHtml("<code>code</code>")).toBe("<code>code</code>");
  });

  it("allows underline tags", () => {
    expect(sanitizeInlineHtml("<u>underline</u>")).toBe("<u>underline</u>");
  });

  it("allows strikethrough tags", () => {
    expect(sanitizeInlineHtml("<s>strike</s>")).toBe("<s>strike</s>");
  });

  it("allows mark tags", () => {
    expect(sanitizeInlineHtml("<mark>highlight</mark>")).toBe(
      "<mark>highlight</mark>",
    );
  });

  it("allows anchor tags with href", () => {
    const input = '<a href="https://example.com">link</a>';
    expect(sanitizeInlineHtml(input)).toBe(
      '<a href="https://example.com" target="_blank" rel="noopener noreferrer">link</a>',
    );
  });

  it("allows br tags", () => {
    expect(sanitizeInlineHtml("line1<br>line2")).toBe("line1<br />line2");
  });

  it("strips disallowed tags", () => {
    expect(sanitizeInlineHtml("<script>alert(1)</script>")).toBe("alert(1)");
  });

  it("strips div tags", () => {
    expect(sanitizeInlineHtml("<div>content</div>")).toBe("content");
  });

  it("handles nested allowed tags", () => {
    expect(sanitizeInlineHtml("<b><i>bold italic</i></b>")).toBe(
      "<b><i>bold italic</i></b>",
    );
  });

  it("handles mixed content", () => {
    const input = 'Hello <b>bold</b> and <a href="/test">link</a> world';
    const expected =
      'Hello <b>bold</b> and <a href="/test" target="_blank" rel="noopener noreferrer">link</a> world';
    expect(sanitizeInlineHtml(input)).toBe(expected);
  });

  it("blocks javascript: protocol in href", () => {
    const input = '<a href="javascript:alert(1)">click</a>';
    expect(sanitizeInlineHtml(input)).toBe("<a>click</a>");
  });

  it("blocks data: protocol in href", () => {
    const input = '<a href="data:text/html,hello">x</a>';
    expect(sanitizeInlineHtml(input)).toBe("<a>x</a>");
  });

  it("blocks vbscript: protocol in href", () => {
    const input = '<a href="vbscript:msgbox">x</a>';
    expect(sanitizeInlineHtml(input)).toBe("<a>x</a>");
  });

  it("strips img tags with event handlers", () => {
    expect(sanitizeInlineHtml('<img onerror="alert(1)">')).toBe("");
  });
});
