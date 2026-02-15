interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [1];

  if (current > 3) pages.push("...");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) pages.push("...");

  pages.push(total);
  return pages;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getPageNumbers(page, totalPages);

  return (
    <div className="join" data-testid="pagination">
      <button
        className="join-item btn btn-sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        aria-label="Previous page"
      >
        <span className="hidden sm:inline">Previous</span>
        <span className="sm:hidden">&lsaquo;</span>
      </button>
      {pages.map((p, i) =>
        p === "..." ? (
          <span
            key={`ellipsis-${i}`}
            className="join-item btn btn-sm btn-disabled hidden sm:inline-flex"
            aria-hidden="true"
          >
            ...
          </span>
        ) : (
          <button
            key={p}
            className={`join-item btn btn-sm ${p === page ? "btn-active" : ""}`}
            onClick={() => onPageChange(p)}
            aria-current={p === page ? "page" : undefined}
          >
            {p}
          </button>
        ),
      )}
      <button
        className="join-item btn btn-sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        aria-label="Next page"
      >
        <span className="hidden sm:inline">Next</span>
        <span className="sm:hidden">&rsaquo;</span>
      </button>
    </div>
  );
}
