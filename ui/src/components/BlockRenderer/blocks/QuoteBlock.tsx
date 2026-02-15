import { InlineContent } from "../InlineContent";

interface QuoteBlockProps {
  data: { text: string; caption?: string };
}

export function QuoteBlock({ data }: QuoteBlockProps) {
  return (
    <blockquote className="border-l-4 border-primary pl-4 italic">
      <InlineContent as="p" html={data.text} className="leading-relaxed" />
      {data.caption && (
        <InlineContent
          as="cite"
          html={data.caption}
          className="mt-1 block text-sm not-italic text-muted-foreground"
        />
      )}
    </blockquote>
  );
}
