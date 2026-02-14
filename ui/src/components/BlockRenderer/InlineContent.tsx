import { sanitizeInlineHtml } from "./parse-inline";

interface InlineContentProps {
  html: string;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
}

export function InlineContent({
  html,
  className,
  as: Tag = "span",
}: InlineContentProps) {
  return (
    <Tag
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizeInlineHtml(html) }}
    />
  );
}
