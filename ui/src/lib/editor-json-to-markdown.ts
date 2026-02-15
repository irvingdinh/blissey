import type { OutputBlockData } from "@editorjs/editorjs";

/**
 * Converts Editor.js inline HTML formatting to Markdown.
 * Editor.js uses HTML tags: <b>, <i>, <code>, <a>, <u>, <s>, <mark>
 */
function inlineToMarkdown(html: string): string {
  let md = html;

  // Replace <br> / <br /> with newlines
  md = md.replace(/<br\s*\/?>/gi, "\n");

  // Bold: <b>text</b>
  md = md.replace(/<b>([\s\S]*?)<\/b>/gi, "**$1**");

  // Italic: <i>text</i>
  md = md.replace(/<i>([\s\S]*?)<\/i>/gi, "*$1*");

  // Inline code: <code>text</code>
  md = md.replace(/<code>([\s\S]*?)<\/code>/gi, "`$1`");

  // Links: <a href="url">text</a>
  md = md.replace(/<a\s+href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, "[$2]($1)");

  // Strikethrough: <s>text</s>
  md = md.replace(/<s>([\s\S]*?)<\/s>/gi, "~~$1~~");

  // Underline and mark have no standard Markdown equivalent - strip tags
  md = md.replace(/<\/?(u|mark)>/gi, "");

  // Strip any remaining HTML tags
  md = md.replace(/<[^>]+>/g, "");

  // Decode common HTML entities
  md = md.replace(/&amp;/g, "&");
  md = md.replace(/&lt;/g, "<");
  md = md.replace(/&gt;/g, ">");
  md = md.replace(/&quot;/g, '"');
  md = md.replace(/&#39;/g, "'");
  md = md.replace(/&nbsp;/g, " ");

  return md;
}

interface ListItem {
  content: string;
  items?: ListItem[];
}

function normalizeListItem(item: string | ListItem): ListItem {
  if (typeof item === "string") {
    return { content: item, items: [] };
  }
  return item;
}

function renderListItems(
  items: (string | ListItem)[],
  ordered: boolean,
  indent: number,
): string {
  const lines: string[] = [];
  const prefix = "  ".repeat(indent);

  items.forEach((rawItem, i) => {
    const item = normalizeListItem(rawItem);
    const bullet = ordered ? `${i + 1}. ` : "- ";
    lines.push(`${prefix}${bullet}${inlineToMarkdown(item.content)}`);

    if (item.items && item.items.length > 0) {
      lines.push(renderListItems(item.items, ordered, indent + 1));
    }
  });

  return lines.join("\n");
}

function blockToMarkdown(block: OutputBlockData): string {
  const data = block.data as Record<string, unknown>;

  switch (block.type) {
    case "paragraph": {
      return inlineToMarkdown((data.text as string) || "");
    }

    case "header": {
      const level = Math.min(Math.max((data.level as number) || 2, 1), 6);
      const hashes = "#".repeat(level);
      return `${hashes} ${inlineToMarkdown((data.text as string) || "")}`;
    }

    case "quote": {
      const text = inlineToMarkdown((data.text as string) || "");
      const lines = text.split("\n").map((line) => `> ${line}`);
      if (data.caption) {
        lines.push(`> \u2014 ${inlineToMarkdown(data.caption as string)}`);
      }
      return lines.join("\n");
    }

    case "list": {
      const ordered = (data.style as string) === "ordered";
      const items = (data.items as (string | ListItem)[]) || [];
      return renderListItems(items, ordered, 0);
    }

    case "checklist": {
      const items = (data.items as { text: string; checked: boolean }[]) || [];
      return items
        .map((item) => {
          const check = item.checked ? "[x]" : "[ ]";
          return `- ${check} ${inlineToMarkdown(item.text)}`;
        })
        .join("\n");
    }

    case "code": {
      const code = (data.code as string) || "";
      return `\`\`\`\n${code}\n\`\`\``;
    }

    case "delimiter": {
      return "---";
    }

    case "image": {
      const file = data.file as { url: string } | undefined;
      const url = file?.url || "";
      const caption = inlineToMarkdown((data.caption as string) || "");
      return `![${caption}](${url})`;
    }

    case "embed": {
      const source = (data.source as string) || (data.embed as string) || "";
      const caption = data.caption
        ? inlineToMarkdown(data.caption as string)
        : "";
      return caption ? `[${caption}](${source})` : source;
    }

    case "table": {
      const content = (data.content as string[][]) || [];
      if (content.length === 0) return "";

      const withHeadings = data.withHeadings as boolean;
      const rows = content.map((row) =>
        row.map((cell) => inlineToMarkdown(cell)),
      );

      const lines: string[] = [];
      if (withHeadings && rows.length > 1) {
        lines.push(`| ${rows[0].join(" | ")} |`);
        lines.push(`| ${rows[0].map(() => "---").join(" | ")} |`);
        for (let i = 1; i < rows.length; i++) {
          lines.push(`| ${rows[i].join(" | ")} |`);
        }
      } else {
        for (const row of rows) {
          lines.push(`| ${row.join(" | ")} |`);
        }
      }
      return lines.join("\n");
    }

    case "warning": {
      const title = inlineToMarkdown((data.title as string) || "");
      const message = inlineToMarkdown((data.message as string) || "");
      return `> **${title}**: ${message}`;
    }

    default:
      return "";
  }
}

/**
 * Converts Editor.js JSON content string to Markdown.
 * Accepts either the raw content string (JSON) or a parsed blocks array.
 */
export function editorJsonToMarkdown(content: string): string {
  let blocks: OutputBlockData[];
  try {
    const parsed = JSON.parse(content);
    blocks = parsed?.blocks ?? [];
  } catch {
    return "";
  }

  return blocks
    .map((block) => blockToMarkdown(block))
    .filter((line) => line !== "")
    .join("\n\n");
}
