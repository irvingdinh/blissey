import { Checkbox } from "@/components/ui/checkbox";

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
          <Checkbox checked={item.checked} className="mt-0.5" aria-readonly />
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
