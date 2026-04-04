type PaginationBarProps = {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  pageSize?: number
  pageSizeOptions?: number[]
  onPageSizeChange?: (size: number) => void
}

export function PaginationBar({
  page,
  totalPages,
  onPageChange,
  pageSize,
  pageSizeOptions,
  onPageSizeChange,
}: PaginationBarProps) {
  if (totalPages === 0) return null

  const showDropdown = pageSizeOptions && pageSizeOptions.length > 0 && onPageSizeChange

  return (
    <div className={`flex items-center mt-4 ${showDropdown ? 'justify-between' : 'justify-end'}`}>
      {showDropdown && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-500">Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="border border-zinc-200 rounded-md text-sm px-2 py-1.5 text-zinc-600 bg-white focus:outline-none focus:ring-1 focus:ring-blue-700"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          aria-label="Previous page"
          className="text-sm font-medium text-zinc-500 hover:text-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          ← Prev
        </button>
        <span className="text-sm font-medium text-zinc-700">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          aria-label="Next page"
          className="text-sm font-medium text-zinc-500 hover:text-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  )
}
