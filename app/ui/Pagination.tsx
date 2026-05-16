import Link from "next/link";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  query?: string;
  accent?: "olive" | "terracotta" | "slate";
}

export default function Pagination({
  currentPage,
  totalPages,
  query,
  accent = "olive",
}: PaginationProps) {
  const activeCls =
    accent === "terracotta" ? "bg-terracotta text-cream" :
    accent === "slate"      ? "bg-[#DFD9DE] text-brown"  :
    /* olive */               "bg-olive text-cream";
  if (totalPages <= 1) return null;

  const href = (page: number) => {
    const params = new URLSearchParams();
    if (query) params.set("query", query);
    params.set("page", String(page));
    return `/?${params.toString()}`;
  };

  const pages = getPageRange(currentPage, totalPages);

  return (
    <nav aria-label="Pagination" className="mt-20 flex items-center justify-center gap-2">
      <Link
        href={href(currentPage - 1)}
        aria-label="Previous page"
        aria-disabled={currentPage <= 1}
        className={`px-2 text-xs tracking-[0.15em] transition-colors ${
          currentPage <= 1
            ? "pointer-events-none text-brown/30"
            : "text-brown hover:text-olive"
        }`}
      >
        ← Prev
      </Link>

      {pages.map((page, i) =>
        page === "…" ? (
          <span key={`ellipsis-${i}`} className="px-1 text-xs text-brown/40">
            …
          </span>
        ) : (
          <Link
            key={page}
            href={href(page as number)}
            aria-label={`Page ${page}`}
            aria-current={page === currentPage ? "page" : undefined}
            className={`w-9 h-9 flex items-center justify-center text-xs tracking-[0.15em] font-medium transition-colors ${
              page === currentPage
                ? activeCls
                : "border border-tan text-brown hover:border-brown hover:bg-tan/30"
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
        className={`px-2 text-xs tracking-[0.15em] transition-colors ${
          currentPage >= totalPages
            ? "pointer-events-none text-brown/30"
            : "text-brown hover:text-olive"
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
