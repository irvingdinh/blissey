import { InlineContent } from "../InlineContent";

interface ImageBlockProps {
  data: {
    file: { url: string };
    caption?: string;
    withBorder?: boolean;
    stretched?: boolean;
    withBackground?: boolean;
  };
}

export function ImageBlock({ data }: ImageBlockProps) {
  return (
    <figure
      className={data.withBackground ? "rounded-lg bg-muted p-4" : undefined}
    >
      <img
        src={data.file.url}
        alt={data.caption || ""}
        className={[
          "rounded-lg",
          data.stretched ? "w-full" : "mx-auto max-w-full",
          data.withBorder ? "border border-border" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        loading="lazy"
        decoding="async"
      />
      {data.caption && (
        <figcaption className="mt-2 text-center text-sm text-muted-foreground">
          <InlineContent as="span" html={data.caption} />
        </figcaption>
      )}
    </figure>
  );
}
