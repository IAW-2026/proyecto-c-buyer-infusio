import Link from "next/link";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  query?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  query,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const href = (page: number) => {
    const params = new URLSearchParams();
    if (query) params.set("query", query);
    params.set("page", String(page));
    return `/?${params.toString()}`;
  };

  const pages = getPageRange(currentPage, totalPages);

  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-1">
      <Link
        href={href(currentPage - 1)}
        aria-label="Previous page"
        aria-disabled={currentPage <= 1}
        className={`rounded px-3 py-2 text-sm font-medium ${
          currentPage <= 1
            ? "pointer-events-none text-gray-300"
            : "text-gray-700 hover:bg-gray-100"
        }`}
      >
        ← Prev
      </Link>

      {pages.map((page, i) =>
        page === "…" ? (
          <span key={`ellipsis-${i}`} className="px-2 py-2 text-sm text-gray-400">
            …
          </span>
        ) : (
          <Link
            key={page}
            href={href(page as number)}
            aria-label={`Page ${page}`}
            aria-current={page === currentPage ? "page" : undefined}
            className={`rounded px-3 py-2 text-sm font-medium ${
              page === currentPage
                ? "bg-green-700 text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            {page}
          </Link>
        )
      )}

      <Link
        href={href(currentPage + 1)}
        aria-label="Next page"
        aria-disabled={currentPage >= totalPages}
        className={`rounded px-3 py-2 text-sm font-medium ${
          currentPage >= totalPages
            ? "pointer-events-none text-gray-300"
            : "text-gray-700 hover:bg-gray-100"
        }`}
      >
        Next →
      </Link>
    </nav>
  );
}

function getPageRange(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "…", total];
  if (current >= total - 3) return [1, "…", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "…", current - 1, current, current + 1, "…", total];
}
