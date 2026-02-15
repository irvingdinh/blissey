import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { InlineContent } from "../InlineContent";

interface TableBlockProps {
  data: {
    withHeadings?: boolean;
    content: string[][];
  };
}

export function TableBlock({ data }: TableBlockProps) {
  const rows = data.content;
  if (!rows || rows.length === 0) return null;

  const hasHeader = data.withHeadings && rows.length > 1;
  const headerRow = hasHeader ? rows[0] : null;
  const bodyRows = hasHeader ? rows.slice(1) : rows;

  return (
    <Table>
      {headerRow && (
        <TableHeader>
          <TableRow>
            {headerRow.map((cell, i) => (
              <TableHead key={i}>
                <InlineContent as="span" html={cell} />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
      )}
      <TableBody>
        {bodyRows.map((row, rowIdx) => (
          <TableRow key={rowIdx}>
            {row.map((cell, cellIdx) => (
              <TableCell key={cellIdx}>
                <InlineContent as="span" html={cell} />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
