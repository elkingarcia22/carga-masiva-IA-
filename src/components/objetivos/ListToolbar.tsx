import * as React from "react";
import { Search, X, RotateCw, Filter, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Toolbar controls shared by both objectives lists. Each is a real control, not
 * a decorative icon: the search expands in place and filters as you type, the
 * filter popover drives the list's own predicates, and refresh reports back.
 */

/**
 * Icon button that expands into a search field, keeping the collapsed header
 * dense while still offering a full-width input once it is actually needed.
 * Collapsing clears the query so the list never stays filtered by something
 * the user can no longer see.
 */
export const InlineSearch: React.FC<{
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  /** Announced label for the collapsed trigger. */
  label: string;
}> = ({ value, onValueChange, placeholder, label }) => {
  // Starts expanded when a query is already in play. The list would otherwise
  // come back from a detail view still filtered but with the box collapsed,
  // leaving no visible reason why only some rows are showing.
  const [isOpen, setIsOpen] = React.useState(() => value !== "");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const close = () => {
    setIsOpen(false);
    onValueChange("");
  };

  if (!isOpen) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={label}
            onClick={() => setIsOpen(true)}
            className="h-10 w-10 text-text-secondary hover:bg-muted/50 rounded-full transition-all hover:scale-110"
          >
            <Search className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <span>{label}</span>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="relative w-[260px] animate-in fade-in-0 slide-in-from-right-2 duration-200">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary/50 pointer-events-none" />
      <Input
        ref={inputRef}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") close();
        }}
        placeholder={placeholder}
        aria-label={label}
        className="h-10 pl-9 pr-9 rounded-full text-xs font-medium border-border/60 bg-surface-muted/30 focus-visible:ring-primary/30"
      />
      <button
        type="button"
        aria-label="Cerrar búsqueda"
        onClick={close}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full flex items-center justify-center text-text-secondary/50 hover:text-text-primary hover:bg-muted/60 transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

/**
 * Refresh with visible feedback. The spin is tied to a short pending window so
 * the press reads as "something happened" even when the mock data is instant.
 */
export const RefreshButton: React.FC<{ onRefresh: () => void; label?: string }> = ({
  onRefresh,
  label = "Actualizar lista",
}) => {
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  React.useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const handleClick = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    onRefresh();
    timeoutRef.current = setTimeout(() => setIsRefreshing(false), 700);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={label}
          onClick={handleClick}
          className="h-10 w-10 text-text-secondary hover:bg-muted/50 rounded-full transition-all hover:scale-110"
        >
          <RotateCw className={cn("h-5 w-5 transition-transform", isRefreshing && "animate-spin")} />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">
        <span>{label}</span>
      </TooltipContent>
    </Tooltip>
  );
};

export interface FilterGroup {
  id: string;
  label: string;
  options: string[];
  /** Empty means "all" — no predicate applied for this group. */
  selected: string[];
  onToggle: (option: string) => void;
}

/**
 * Multi-group filter popover. Groups are independent OR-sets, combined with AND
 * across groups — the behaviour list filters are expected to have. The trigger
 * carries a count so an active filter is visible with the popover closed.
 */
export const FilterButton: React.FC<{
  groups: FilterGroup[];
  onClearAll: () => void;
}> = ({ groups, onClearAll }) => {
  const activeCount = groups.reduce((total, group) => total + group.selected.length, 0);

  return (
    <Popover modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Filtrar"
          className={cn(
            "relative h-10 w-10 rounded-full transition-all hover:scale-110 hover:bg-muted/50",
            activeCount > 0 ? "text-primary bg-primary/5" : "text-text-secondary"
          )}
        >
          <Filter className="h-5 w-5" />
          {activeCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-primary text-text-inverse text-[9px] font-extrabold flex items-center justify-center tabular-nums">
              {activeCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-72 p-0 rounded-2xl border border-border/40 shadow-2xl overflow-hidden z-[100]"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
          <span className="text-[10px] font-bold text-text-secondary/40 uppercase tracking-widest">
            Filtros
          </span>
          {activeCount > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              className="text-[11px] font-bold text-primary hover:underline"
            >
              Limpiar
            </button>
          )}
        </div>

        <div className="max-h-[340px] overflow-y-auto p-2 space-y-1">
          {groups.map((group) => (
            <div key={group.id} className="px-1 py-1.5">
              <p className="px-2 pb-1.5 text-[11px] font-bold text-text-primary tracking-tight">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.options.map((option) => {
                  const isSelected = group.selected.includes(option);
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => group.onToggle(option)}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-left transition-colors",
                        isSelected ? "bg-primary/5" : "hover:bg-muted/60"
                      )}
                    >
                      <span
                        className={cn(
                          "h-4 w-4 rounded border-[1.5px] flex items-center justify-center shrink-0 transition-all",
                          isSelected
                            ? "bg-primary border-primary text-text-inverse"
                            : "border-border-strong/40 bg-surface-muted"
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3" strokeWidth={3} />}
                      </span>
                      <span
                        className={cn(
                          "text-[12px] font-semibold truncate",
                          isSelected ? "text-primary" : "text-text-secondary"
                        )}
                      >
                        {option}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
