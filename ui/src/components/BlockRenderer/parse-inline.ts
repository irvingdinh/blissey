/**
 * Parses Editor.js inline markup (HTML tags) into React-safe HTML.
 * Editor.js uses HTML tags for inline formatting:
 * - <b>bold</b>
 * - <i>italic</i>
 * - <code>inline code</code>
 * - <a href="...">link</a>
 * - <u>underline</u>
 * - <s>strikethrough</s>
 * - <mark>highlight</mark>
 *
 * We sanitize the input to only allow these specific tags.
 */

const ALLOWED_TAGS = ["b", "i", "code", "a", "u", "s", "mark", "br"];

const TAG_REGEX = /<\/?([a-z]+)(\s[^>]*)?\s*\/?>/gi;
const HREF_REGEX = /href="([^"]*)"/i;

export function sanitizeInlineHtml(html: string): string {
  return html.replace(TAG_REGEX, (match, tagName: string) => {
    const lower = tagName.toLowerCase();
    if (!ALLOWED_TAGS.includes(lower)) {
      return "";
    }

    // For anchor tags, only allow href attribute with safe protocols
    if (lower === "a" && match.includes("href=")) {
      const hrefMatch = match.match(HREF_REGEX);
      if (hrefMatch) {
        const rawHref = hrefMatch[1];
        // Block dangerous protocols
        const protocol = rawHref.trim().toLowerCase();
        if (
          protocol.startsWith("javascript:") ||
          protocol.startsWith("data:") ||
          protocol.startsWith("vbscript:")
        ) {
          return "<a>";
        }
        const href = rawHref.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
        return `<a href="${href}" target="_blank" rel="noopener noreferrer">`;
      }
    }

    // Self-closing tags
    if (lower === "br") {
      return "<br />";
    }

    // Opening or closing tags without attributes
    if (match.startsWith("</")) {
      return `</${lower}>`;
    }
    return `<${lower}>`;
  });
}
