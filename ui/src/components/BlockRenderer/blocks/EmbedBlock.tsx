import { InlineContent } from "../InlineContent";

interface EmbedBlockProps {
  data: {
    service: string;
    source: string;
    embed: string;
    width?: number;
    height?: number;
    caption?: string;
  };
}

export function EmbedBlock({ data }: EmbedBlockProps) {
  return (
    <figure>
      <div className="relative w-full overflow-hidden rounded-lg pt-[56.25%]">
        <iframe
          src={data.embed}
          className="absolute inset-0 h-full w-full"
          allowFullScreen
          title={data.caption || data.service}
        />
      </div>
      {data.caption && (
        <figcaption className="mt-2 text-center text-sm text-muted-foreground">
          <InlineContent as="span" html={data.caption} />
        </figcaption>
      )}
    </figure>
  );
}
