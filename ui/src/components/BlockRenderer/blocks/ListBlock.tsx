import { InlineContent } from "../InlineContent";

interface ListItem {
  content: string;
  items?: ListItem[];
}

interface ListBlockProps {
  data: {
    style: "ordered" | "unordered";
    items: (string | ListItem)[];
  };
}

function normalizeItem(item: string | ListItem): ListItem {
  if (typeof item === "string") {
    return { content: item, items: [] };
  }
  return item;
}

function ListItems({
  items,
  ordered,
}: {
  items: (string | ListItem)[];
  ordered: boolean;
}) {
  const Tag = ordered ? "ol" : "ul";

  return (
    <Tag className={ordered ? "list-decimal pl-6" : "list-disc pl-6"}>
      {items.map((rawItem, i) => {
        const item = normalizeItem(rawItem);
        return (
          <li key={i} className="leading-relaxed">
            <InlineContent as="span" html={item.content} />
            {item.items && item.items.length > 0 && (
              <ListItems items={item.items} ordered={ordered} />
            )}
          </li>
        );
      })}
    </Tag>
  );
}

export function ListBlock({ data }: ListBlockProps) {
  return <ListItems items={data.items} ordered={data.style === "ordered"} />;
}
