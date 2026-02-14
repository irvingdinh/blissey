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
    <div className="overflow-x-auto">
      <table className="table table-sm">
        {headerRow && (
          <thead>
            <tr>
              {headerRow.map((cell, i) => (
                <th key={i}>
                  <InlineContent as="span" html={cell} />
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {bodyRows.map((row, rowIdx) => (
            <tr key={rowIdx}>
              {row.map((cell, cellIdx) => (
                <td key={cellIdx}>
                  <InlineContent as="span" html={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
