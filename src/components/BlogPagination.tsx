import Link from "next/link";
import { Icon } from "@/components/Icon";

/**
 * Numbered pagination for the blog listing.
 * Page 1 lives at /blog; pages 2+ live at /blog/page/N.
 */
export function BlogPagination({
  currentPage,
  totalPages,
  indexPath = "/blog",
  basePath = "/blog/page",
}: {
  currentPage: number;
  totalPages: number;
  indexPath?: string;
  basePath?: string;
}) {
  if (totalPages <= 1) return null;

  const href = (n: number) => (n === 1 ? indexPath : `${basePath}/${n}`);

  // Build a compact page list with ellipses: 1 … (c-1) c (c+1) … last
  const pages: (number | "...")[] = [];
  const add = (n: number) => pages.push(n);
  const window = 1; // neighbours on each side

  for (let n = 1; n <= totalPages; n++) {
    if (
      n === 1 ||
      n === totalPages ||
      (n >= currentPage - window && n <= currentPage + window)
    ) {
      add(n);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  const baseLink =
    "flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-sm transition";
  const inactive =
    "border-border-default text-text-secondary hover:border-accent hover:text-accent";
  const active =
    "border-accent bg-accent-soft text-accent font-semibold pointer-events-none";
  const disabled =
    "border-border-default text-text-muted opacity-40 pointer-events-none";

  return (
    <nav
      className="mx-auto mt-12 flex max-w-3xl items-center justify-center gap-1.5"
      aria-label="Blog pagination"
    >
      {/* Prev */}
      {currentPage > 1 ? (
        <Link href={href(currentPage - 1)} className={`${baseLink} ${inactive}`} aria-label="Previous page">
          <Icon name="arrow-left-s-line" size={16} />
        </Link>
      ) : (
        <span className={`${baseLink} ${disabled}`} aria-hidden="true">
          <Icon name="arrow-left-s-line" size={16} />
        </span>
      )}

      {/* Numbers */}
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`e${i}`} className="px-1 text-sm text-text-muted">
            &hellip;
          </span>
        ) : (
          <Link
            key={p}
            href={href(p)}
            className={`${baseLink} ${p === currentPage ? active : inactive}`}
            aria-current={p === currentPage ? "page" : undefined}
          >
            {p}
          </Link>
        )
      )}

      {/* Next */}
      {currentPage < totalPages ? (
        <Link href={href(currentPage + 1)} className={`${baseLink} ${inactive}`} aria-label="Next page">
          <Icon name="arrow-right-s-line" size={16} />
        </Link>
      ) : (
        <span className={`${baseLink} ${disabled}`} aria-hidden="true">
          <Icon name="arrow-right-s-line" size={16} />
        </span>
      )}
    </nav>
  );
}
