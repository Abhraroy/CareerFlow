import React from 'react'
import { LuChevronLeft, LuChevronRight } from '../icons'

interface JobsPaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
}

export function JobsPagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange
}: JobsPaginationProps): React.JSX.Element {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  if (totalPages <= 1 && totalItems <= itemsPerPage) {
    return (
      <div className="flex items-center justify-between px-5 py-3 border-t border-black/5 dark:border-white/10 text-xs text-neutral-500 dark:text-neutral-400">
        <span>
          Showing {totalItems} {totalItems === 1 ? 'job' : 'jobs'}
        </span>
      </div>
    )
  }

  // Generate visible page numbers
  const pages: number[] = []
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      pages.push(i)
    }
  }

  return (
    <div className="flex items-center justify-between px-5 py-3.5 border-t border-black/5 dark:border-white/10 text-xs select-none bg-neutral-50/50 dark:bg-[#1A1A1D]/50">
      {/* Left Item Counter */}
      <span className="text-neutral-500 dark:text-neutral-400 font-medium">
        Showing <span className="text-neutral-900 dark:text-white font-bold">{startItem}</span> to{' '}
        <span className="text-neutral-900 dark:text-white font-bold">{endItem}</span> of{' '}
        <span className="text-neutral-900 dark:text-white font-bold">{totalItems}</span> jobs
      </span>

      {/* Center/Right Pagination Controls */}
      <div className="flex items-center gap-1.5">
        {/* Previous Button */}
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Previous Page"
          className="flex items-center justify-center w-7 h-7 rounded-xl border border-black/5 dark:border-white/10 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
        >
          <LuChevronLeft className="w-4 h-4" />
        </button>

        {/* Page numbers with ellipsis */}
        {pages.map((pageNum, idx) => {
          const prevPage = pages[idx - 1]
          const showEllipsis = prevPage && pageNum - prevPage > 1

          return (
            <React.Fragment key={pageNum}>
              {showEllipsis && (
                <span className="px-1 text-neutral-400 text-xs">...</span>
              )}
              <button
                type="button"
                onClick={() => onPageChange(pageNum)}
                className={`min-w-[28px] h-7 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  currentPage === pageNum
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/[0.06] border border-transparent'
                }`}
              >
                {pageNum}
              </button>
            </React.Fragment>
          )
        })}

        {/* Next Button */}
        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Next Page"
          className="flex items-center justify-center w-7 h-7 rounded-xl border border-black/5 dark:border-white/10 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
        >
          <LuChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
