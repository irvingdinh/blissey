import { InlineContent } from "../InlineContent";

interface HeadingBlockProps {
  data: { text: string; level: number };
}

const headingStyles: Record<number, string> = {
  1: "text-3xl font-bold",
  2: "text-2xl font-bold",
  3: "text-xl font-semibold",
  4: "text-lg font-semibold",
  5: "text-base font-semibold",
  6: "text-sm font-semibold uppercase tracking-wide",
};

export function HeadingBlock({ data }: HeadingBlockProps) {
  const level = Math.min(Math.max(data.level || 2, 1), 6);
  const Tag = `h${level}` as keyof React.JSX.IntrinsicElements;

  return (
    <InlineContent as={Tag} html={data.text} className={headingStyles[level]} />
  );
}
