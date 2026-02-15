import { InlineContent } from "../InlineContent";

interface ParagraphBlockProps {
  data: { text: string };
}

export function ParagraphBlock({ data }: ParagraphBlockProps) {
  return (
    <InlineContent
      as="p"
      html={data.text}
      className="leading-relaxed [&_a]:text-primary [&_a]:underline [&_code]:bg-muted [&_code]:rounded [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm [&_code]:font-mono"
    />
  );
}
