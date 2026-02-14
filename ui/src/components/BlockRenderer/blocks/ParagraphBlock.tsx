import { InlineContent } from "../InlineContent";

interface ParagraphBlockProps {
  data: { text: string };
}

export function ParagraphBlock({ data }: ParagraphBlockProps) {
  return (
    <InlineContent
      as="p"
      html={data.text}
      className="leading-relaxed [&_a]:link [&_a]:link-primary [&_code]:bg-base-200 [&_code]:rounded [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm [&_code]:font-mono"
    />
  );
}
