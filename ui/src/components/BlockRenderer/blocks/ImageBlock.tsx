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
      className={data.withBackground ? "rounded-lg bg-base-200 p-4" : undefined}
    >
      <img
        src={data.file.url}
        alt={data.caption || ""}
        className={[
          "rounded-lg",
          data.stretched ? "w-full" : "mx-auto max-w-full",
          data.withBorder ? "border border-base-300" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        loading="lazy"
      />
      {data.caption && (
        <figcaption className="mt-2 text-center text-sm text-base-content/60">
          <InlineContent as="span" html={data.caption} />
        </figcaption>
      )}
    </figure>
  );
}
