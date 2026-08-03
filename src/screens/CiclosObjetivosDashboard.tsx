import * as React from "react";
import { Plus, MoreVertical, Eye, Pencil, Copy, Target, Archive, SearchX } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/feedback/EmptyState";
import { useShellChrome } from "@/components/layout";
import { CicloDetalleDashboard } from "@/screens/CicloDetalleDashboard";
import {
  CycleProgressBar,
  CycleStatusBadge,
  FilterButton,
  InlineSearch,
  DEFAULT_PAGE_SIZE,
  ListCard,
  RefreshButton,
  formatProgress,
} from "@/components/objetivos";
import {
  OBJECTIVE_CYCLES,
  OBJECTIVE_CYCLE_PERIODS,
  OBJECTIVE_CYCLE_STATUSES,
} from "@/mocks/objetivosMocks";
import type { ObjectiveCycleItem } from "@/mocks/types";

/**
 * CiclosObjetivosDashboard
 *
 * Main view of the "Ciclos de objetivos" tab: the company's objective cycles,
 * searchable and filterable, with the per-row actions that manage each one.
 */


/** Toggles a value in a selection set without mutating the original array. */
function toggleValue(selected: string[], value: string): string[] {
  return selected.includes(value)
    ? selected.filter((item) => item !== value)
    : [...selected, value];
}

/** One row's action menu — the "Acciones" column of the reference list. */
const CycleRowActions: React.FC<{
  cycle: ObjectiveCycleItem;
  onOpen: () => void;
}> = ({ cycle, onOpen }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button
        variant="ghost"
        size="sm"
        aria-label={`Acciones de ${cycle.name}`}
        className="h-8 px-2.5 gap-1.5 text-[11px] font-bold text-text-secondary rounded-lg hover:bg-muted group/actions"
      >
        <span>Acciones</span>
        <MoreVertical className="h-3.5 w-3.5 opacity-50" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent
      align="end"
      sideOffset={6}
      className="w-56 p-1.5 rounded-xl border border-border/40 shadow-2xl z-[100]"
    >
      <DropdownMenuLabel className="px-2.5 py-1.5 text-[10px] font-bold text-text-secondary/40 uppercase tracking-widest">
        Gestionar ciclo
      </DropdownMenuLabel>
      <DropdownMenuSeparator className="bg-border/40 mx-1 my-1" />
      {[
        { icon: Eye, label: "Ver detalle", onSelect: onOpen },
        { icon: Target, label: "Ver objetivos", onSelect: onOpen },
        { icon: Pencil, label: "Editar ciclo" },
        { icon: Copy, label: "Duplicar ciclo" },
      ].map(({ icon: Icon, label, onSelect }) => (
        <DropdownMenuItem
          key={label}
          onSelect={onSelect ?? (() => toast.info(`${label} · ${cycle.name}`))}
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer text-[12px] font-semibold focus:bg-primary/5 focus:text-primary outline-none"
        >
          <Icon className="h-4 w-4 opacity-60" />
          {label}
        </DropdownMenuItem>
      ))}
      <DropdownMenuSeparator className="bg-border/40 mx-1 my-1" />
      <DropdownMenuItem
        onSelect={() => toast.info(`Archivar · ${cycle.name}`)}
        className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer text-[12px] font-semibold text-destructive focus:bg-destructive/5 focus:text-destructive outline-none"
      >
        <Archive className="h-4 w-4 opacity-60" />
        Archivar ciclo
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

export const CiclosObjetivosDashboard: React.FC = () => {
  // The open cycle, or null while the list is showing. Kept here rather than in
  // the shell so the list's own search, filters and page survive a round trip
  // into a cycle and back out.
  const [openCycle, setOpenCycle] = React.useState<ObjectiveCycleItem | null>(null);
  const { setChromeHidden } = useShellChrome();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [periodFilters, setPeriodFilters] = React.useState<string[]>([]);
  const [statusFilters, setStatusFilters] = React.useState<string[]>([]);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState<number>(DEFAULT_PAGE_SIZE);
  // The list the table renders. Held in state (rather than read straight from
  // the mock) so refreshing genuinely re-reads its source, the way a refetch
  // would once this is wired to the API.
  const [cycles, setCycles] = React.useState<ObjectiveCycleItem[]>(OBJECTIVE_CYCLES);

  // Safety net: with the tabs hidden there is no way out but the back button, so
  // unmounting mid-detail would leave the shell stranded without navigation.
  React.useEffect(() => () => setChromeHidden(false), [setChromeHidden]);

  const filteredCycles = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return cycles.filter((cycle) => {
      if (query && !cycle.name.toLowerCase().includes(query)) return false;
      if (periodFilters.length > 0 && !periodFilters.includes(cycle.period)) return false;
      if (statusFilters.length > 0 && !statusFilters.includes(cycle.status)) return false;
      return true;
    });
  }, [cycles, searchQuery, periodFilters, statusFilters]);

  const pageCount = Math.max(1, Math.ceil(filteredCycles.length / pageSize));
  // Narrowing the results can leave `page` past the end of the list. Clamping on
  // read keeps that a derived value instead of a second source of truth.
  const safePage = Math.min(page, pageCount);

  const visibleCycles = React.useMemo(
    () => filteredCycles.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filteredCycles, safePage, pageSize]
  );

  const hasActiveFilters = periodFilters.length > 0 || statusFilters.length > 0 || searchQuery !== "";

  const clearFilters = () => {
    setPeriodFilters([]);
    setStatusFilters([]);
    setPage(1);
  };

  const handleRefresh = () => {
    setCycles([...OBJECTIVE_CYCLES]);
    setPage(1);
    toast.success("Lista de ciclos actualizada");
  };

  /**
   * Opening a cycle hands the whole content area to its detail, so the section
   * tabs and actions go with it. Both state changes happen in the same handler —
   * no effect, no extra render pass.
   */
  const openCycleDetail = (cycle: ObjectiveCycleItem) => {
    setOpenCycle(cycle);
    setChromeHidden(true);
  };

  const closeCycleDetail = () => {
    setOpenCycle(null);
    setChromeHidden(false);
  };

  if (openCycle) {
    return <CicloDetalleDashboard cycle={openCycle} onBack={closeCycleDetail} />;
  }

  return (
    <ListCard
      title="Lista de ciclos"
      subtitle={`${filteredCycles.length.toLocaleString("es-CO")} ${filteredCycles.length === 1 ? "ciclo" : "ciclos"}`}
      description="Estos son los ciclos de objetivos de tu empresa. Puedes buscarlos y usar los filtros para ver sus detalles y gestionarlos desde la columna de acciones."
      toolbar={
        <>
          <InlineSearch
            value={searchQuery}
            onValueChange={(value) => {
              setSearchQuery(value);
              setPage(1);
            }}
            placeholder="Buscar por nombre del ciclo"
            label="Buscar ciclo"
          />
          <FilterButton
            onClearAll={clearFilters}
            groups={[
              {
                id: "periodo",
                label: "Periodo",
                options: OBJECTIVE_CYCLE_PERIODS,
                selected: periodFilters,
                onToggle: (option) => {
                  setPeriodFilters((prev) => toggleValue(prev, option));
                  setPage(1);
                },
              },
              {
                id: "estado",
                label: "Estado",
                options: OBJECTIVE_CYCLE_STATUSES,
                selected: statusFilters,
                onToggle: (option) => {
                  setStatusFilters((prev) => toggleValue(prev, option));
                  setPage(1);
                },
              },
            ]}
          />
          <RefreshButton onRefresh={handleRefresh} label="Actualizar ciclos" />
        </>
      }
      primaryAction={
        <Button
          className="h-10 px-5 gap-2 text-xs font-semibold rounded-xl shadow-lg active:scale-95"
          onClick={() => toast.info("Crear ciclo de objetivos")}
        >
          <Plus className="h-4 w-4" />
          <span>Crear ciclo de objetivos</span>
        </Button>
      }
      pagination={{
        page: safePage,
        pageCount,
        totalItems: filteredCycles.length,
        pageSize,
        onPageChange: setPage,
        onPageSizeChange: (size) => {
          setPageSize(size);
          setPage(1);
        },
      }}
    >
      {visibleCycles.length === 0 ? (
        <EmptyState
          title="Ningún ciclo coincide"
          description={
            hasActiveFilters
              ? "Ajusta la búsqueda o quita algunos filtros para ver más ciclos."
              : "Aún no hay ciclos de objetivos creados en tu empresa."
          }
          icon={SearchX}
          className="border-none bg-transparent py-20"
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-border/40 bg-muted/20">
              <TableHead className="text-[11px] font-bold text-text-secondary tracking-tight py-4 px-8">
                Nombre
              </TableHead>
              <TableHead className="text-[11px] font-bold text-text-secondary tracking-tight py-4">
                Periodo
              </TableHead>
              <TableHead className="text-[11px] font-bold text-text-secondary tracking-tight py-4">
                Fecha inicio
              </TableHead>
              <TableHead className="text-[11px] font-bold text-text-secondary tracking-tight py-4">
                Fecha cierre
              </TableHead>
              <TableHead className="text-[11px] font-bold text-text-secondary tracking-tight py-4">
                Estado
              </TableHead>
              <TableHead className="text-[11px] font-bold text-text-secondary tracking-tight py-4 text-center">
                # objetivos
              </TableHead>
              <TableHead className="text-[11px] font-bold text-text-secondary tracking-tight py-4">
                Progreso
              </TableHead>
              <TableHead className="text-[11px] font-bold text-text-secondary tracking-tight py-4 text-right">
                % avance
              </TableHead>
              <TableHead className="text-[11px] font-bold text-text-secondary tracking-tight py-4 text-right pr-8">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleCycles.map((cycle) => (
              <TableRow
                key={cycle.id}
                className="border-b border-border/40 transition-colors group hover:bg-muted/20"
              >
                <TableCell className="py-4 px-8 max-w-[280px]">
                  <button
                    type="button"
                    onClick={() => openCycleDetail(cycle)}
                    className="text-left text-[12px] font-bold text-text-primary line-clamp-2 rounded-sm transition-colors hover:text-primary hover:underline decoration-primary/40 underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    {cycle.name}
                  </button>
                </TableCell>
                <TableCell className="text-[11px] font-bold text-text-secondary/70 whitespace-nowrap">
                  {cycle.period}
                </TableCell>
                <TableCell className="text-[11px] font-bold text-text-secondary/60 whitespace-nowrap">
                  {cycle.startDate}
                </TableCell>
                <TableCell className="text-[11px] font-bold text-text-secondary/60 whitespace-nowrap">
                  {cycle.endDate}
                </TableCell>
                <TableCell>
                  <CycleStatusBadge status={cycle.status} />
                </TableCell>
                <TableCell
                  className={cn(
                    "text-[11px] font-extrabold text-center tabular-nums",
                    cycle.objectivesCount === 0 ? "text-text-secondary/30" : "text-text-primary"
                  )}
                >
                  {cycle.objectivesCount}
                </TableCell>
                <TableCell className="min-w-[140px]">
                  <CycleProgressBar progress={cycle.progress} />
                </TableCell>
                <TableCell
                  className={cn(
                    "text-[11px] font-bold text-right tabular-nums whitespace-nowrap",
                    cycle.progress <= 0 ? "text-text-secondary/40" : "text-text-primary"
                  )}
                >
                  {formatProgress(cycle.progress)}
                </TableCell>
                <TableCell className="text-right pr-8">
                  <CycleRowActions cycle={cycle} onOpen={() => openCycleDetail(cycle)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </ListCard>
  );
};
