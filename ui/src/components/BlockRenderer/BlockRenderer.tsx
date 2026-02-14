import type { OutputBlockData } from "@editorjs/editorjs";

import {
  ChecklistBlock,
  CodeBlock,
  DelimiterBlock,
  EmbedBlock,
  HeadingBlock,
  ImageBlock,
  ListBlock,
  ParagraphBlock,
  QuoteBlock,
  TableBlock,
  WarningBlock,
} from "./blocks";

interface BlockRendererProps {
  blocks: OutputBlockData[];
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function renderBlock(block: OutputBlockData) {
  const d = block.data as any;
  switch (block.type) {
    case "paragraph":
      return <ParagraphBlock data={d} />;
    case "header":
      return <HeadingBlock data={d} />;
    case "quote":
      return <QuoteBlock data={d} />;
    case "list":
      return <ListBlock data={d} />;
    case "checklist":
      return <ChecklistBlock data={d} />;
    case "code":
      return <CodeBlock data={d} />;
    case "delimiter":
      return <DelimiterBlock />;
    case "image":
      return <ImageBlock data={d} />;
    case "embed":
      return <EmbedBlock data={d} />;
    case "table":
      return <TableBlock data={d} />;
    case "warning":
      return <WarningBlock data={d} />;
    default:
      return null;
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function BlockRenderer({ blocks }: BlockRendererProps) {
  if (!blocks || blocks.length === 0) return null;

  return (
    <div className="space-y-4">
      {blocks.map((block, index) => (
        <div key={block.id ?? index}>{renderBlock(block)}</div>
      ))}
    </div>
  );
}
