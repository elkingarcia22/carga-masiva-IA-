import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PAGE_SIZE_OPTIONS } from "./pageSize";

/**
 * The card every objectives list lives in: a titled header with its own action
 * cluster, a scrollable body, and a pagination footer. Extracted because the
 * cycles list and the users list share this exact chrome — only the toolbar and
 * the table inside differ.
 */
interface ListCardProps {
  title: string;
  /** Line under the title, typically the result count. */
  subtitle: string;
  /** Icon-only actions (search, filter, refresh) shown before the divider. */
  toolbar?: React.ReactNode;
  /** Emphasised action for the surface, e.g. "Crear ciclo de objetivos". */
  primaryAction?: React.ReactNode;
  /** Optional explainer between the header and the table. */
  description?: string;
  children: React.ReactNode;
  pagination?: PaginationProps;
}

interface PaginationProps {
  page: number;
  pageCount: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  /** Omit to render a fixed page size with no selector. */
  onPageSizeChange?: (pageSize: number) => void;
}

export const ListCard: React.FC<ListCardProps> = ({
  title,
  subtitle,
  toolbar,
  primaryAction,
  description,
  children,
  pagination,
}) => (
  <div className="flex flex-col h-full bg-surface rounded-xl border border-border/60 overflow-hidden shadow-sm">
    <div className="flex items-start justify-between gap-6 px-8 py-6 border-b border-border/40 bg-surface">
      <div className="flex flex-col min-w-0">
        <h2 className="text-xl font-bold text-text-primary tracking-tight">{title}</h2>
        <span className="text-[11px] font-medium text-text-secondary/40 tracking-tight">{subtitle}</span>
        {description && (
          <p className="mt-2 text-[12px] font-medium text-text-secondary/60 leading-snug max-w-2xl">
            {description}
          </p>
        )}
      </div>

      <div className="flex items-center gap-6 shrink-0">
        {toolbar && (
          <div className={cn("flex items-center gap-2", primaryAction && "border-r border-border/40 pr-6")}>
            {toolbar}
          </div>
        )}
        {primaryAction}
      </div>
    </div>

    <div className="flex-1 overflow-auto">{children}</div>

    {pagination && <ListPagination {...pagination} />}
  </div>
);

/**
 * Windowed page numbers around the current page, so a 111-item list doesn't
 * render 12 buttons. First and last stay reachable via the arrows.
 */
function getVisiblePages(page: number, pageCount: number): number[] {
  const window = 2;
  const from = Math.max(1, Math.min(page - window, pageCount - window * 2));
  const to = Math.min(pageCount, Math.max(page + window, window * 2 + 1));
  return Array.from({ length: to - from + 1 }, (_unused, index) => from + index);
}

const ListPagination: React.FC<PaginationProps> = ({
  page,
  pageCount,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}) => {
  const firstItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, totalItems);

  return (
    <div className="px-8 py-4 flex items-center justify-between gap-4 border-t border-border/60 bg-surface">
      <div className="flex items-center gap-4 min-w-[200px]">
        <span className="text-[11px] font-bold text-text-secondary/60 tabular-nums whitespace-nowrap">
          Mostrando {firstItem}-{lastItem} de {totalItems.toLocaleString('es-CO')}
        </span>
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-text-secondary/40 whitespace-nowrap">
            {/* Our Select, not the browser's: this footer sits under every list
                in the module, so the one control that was rendering as an OS
                dropdown was also the most repeated. */}
            <Select
              value={String(pageSize)}
              onValueChange={(next) => onPageSizeChange(Number(next))}
            >
              <SelectTrigger
                aria-label="Filas por página"
                className="h-7 w-auto gap-1 pl-2 pr-1.5 rounded-lg border-border/60 bg-surface text-[11px] font-bold text-text-secondary tabular-nums [&>svg]:size-3"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="start">
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <SelectItem
                    key={option}
                    value={String(option)}
                    className="text-[11px] font-bold tabular-nums"
                  >
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            por página
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          aria-label="Página anterior"
          className="h-9 w-9 border-2 rounded-lg disabled:opacity-50"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-1.5 px-2">
          {getVisiblePages(page, pageCount).map((visiblePage) => (
            <Button
              key={visiblePage}
              variant={visiblePage === page ? "outline" : "ghost"}
              aria-current={visiblePage === page ? "page" : undefined}
              className={cn(
                "h-9 w-9 p-0 text-xs rounded-lg tabular-nums",
                visiblePage === page
                  ? "bg-primary/5 border-2 border-primary text-primary font-extrabold"
                  : "text-text-secondary/60 font-bold hover:bg-muted"
              )}
              onClick={() => onPageChange(visiblePage)}
            >
              {visiblePage}
            </Button>
          ))}
        </div>
        <Button
          variant="outline"
          size="icon"
          aria-label="Página siguiente"
          className="h-9 w-9 border-2 rounded-lg disabled:opacity-50"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4 text-text-primary" />
        </Button>
      </div>
      <div className="text-[11px] font-bold text-text-secondary/40 tabular-nums min-w-[200px] text-right whitespace-nowrap">
        Página {page} de {pageCount}
      </div>
    </div>
  );
};
