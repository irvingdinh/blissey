import { InlineContent } from "../InlineContent";

interface ChecklistItem {
  text: string;
  checked: boolean;
}

interface ChecklistBlockProps {
  data: { items: ChecklistItem[] };
}

export function ChecklistBlock({ data }: ChecklistBlockProps) {
  return (
    <div className="space-y-1">
      {data.items.map((item, i) => (
        <label key={i} className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={item.checked}
            readOnly
            className="checkbox checkbox-sm mt-0.5"
          />
          <InlineContent
            as="span"
            html={item.text}
            className={item.checked ? "line-through opacity-60" : ""}
          />
        </label>
      ))}
    </div>
  );
}
