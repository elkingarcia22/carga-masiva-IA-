import * as React from "react"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { cn } from "@/lib/utils"

interface PaginationShellProps {
  page: number
  pageCount: number
  totalItems?: number
  pageSize?: number
  onPageChange?: (page: number) => void
  showSummary?: boolean
  className?: string
}

/**
 * PaginationShell
 * 
 * UBITS Enterprise wrapper for list/table pagination.
 * Handles page logic and summary display without business logic or routing dependencies.
 */
export function PaginationShell({
  page,
  pageCount,
  totalItems,
  pageSize,
  onPageChange,
  showSummary = true,
  className,
}: PaginationShellProps) {
  
  const handlePageChange = (e: React.MouseEvent, targetPage: number) => {
    e.preventDefault()
    if (targetPage >= 1 && targetPage <= pageCount) {
      onPageChange?.(targetPage)
    }
  }

  // Generate page numbers to show (simple logic for demo/starter)
  const getPages = () => {
    const pages = []
    const delta = 1 // Show current, 1 before, 1 after
    
    for (let i = Math.max(1, page - delta); i <= Math.min(pageCount, page + delta); i++) {
      pages.push(i)
    }
    
    return pages
  }

  const pages = getPages()
  const showEllipsisStart = pages[0] > 1
  const showEllipsisEnd = pages[pages.length - 1] < pageCount

  return (
    <div className={cn("flex flex-col sm:flex-row items-center justify-between gap-4 py-4", className)}>
      {/* Summary Area */}
      {showSummary && (
        <div className="text-sm text-muted-foreground order-2 sm:order-1">
          {totalItems ? (
            <span>
              Mostrando {Math.min(totalItems, (page - 1) * (pageSize || 1) + 1)} - {Math.min(totalItems, page * (pageSize || 1))} de {totalItems} resultados
            </span>
          ) : (
            <span>Página {page} de {pageCount}</span>
          )}
        </div>
      )}

      {/* Navigation Area */}
      <Pagination className="mx-0 w-auto order-1 sm:order-2">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              href="#" 
              onClick={(e) => handlePageChange(e, page - 1)}
              aria-disabled={page <= 1}
              className={cn(page <= 1 && "pointer-events-none opacity-50")}
              text="Anterior"
            />
          </PaginationItem>

          {showEllipsisStart && (
            <>
              <PaginationItem>
                <PaginationLink href="#" onClick={(e) => handlePageChange(e, 1)}>1</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            </>
          )}

          {pages.map((p) => (
            <PaginationItem key={p}>
              <PaginationLink 
                href="#" 
                isActive={p === page}
                onClick={(e) => handlePageChange(e, p)}
              >
                {p}
              </PaginationLink>
            </PaginationItem>
          ))}

          {showEllipsisEnd && (
            <>
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#" onClick={(e) => handlePageChange(e, pageCount)}>{pageCount}</PaginationLink>
              </PaginationItem>
            </>
          )}

          <PaginationItem>
            <PaginationNext 
              href="#" 
              onClick={(e) => handlePageChange(e, page + 1)}
              aria-disabled={page >= pageCount}
              className={cn(page >= pageCount && "pointer-events-none opacity-50")}
              text="Siguiente"
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
