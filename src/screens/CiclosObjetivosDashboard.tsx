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
import {
  CycleProgressBar,
  CycleStatusBadge,
  FilterButton,
  InlineSearch,
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

const PAGE_SIZE = 12;

/** Toggles a value in a selection set without mutating the original array. */
function toggleValue(selected: string[], value: string): string[] {
  return selected.includes(value)
    ? selected.filter((item) => item !== value)
    : [...selected, value];
}

/** One row's action menu — the "Acciones" column of the reference list. */
const CycleRowActions: React.FC<{ cycle: ObjectiveCycleItem }> = ({ cycle }) => (
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
        { icon: Eye, label: "Ver detalle" },
        { icon: Target, label: "Ver objetivos" },
        { icon: Pencil, label: "Editar ciclo" },
        { icon: Copy, label: "Duplicar ciclo" },
      ].map(({ icon: Icon, label }) => (
        <DropdownMenuItem
          key={label}
          onSelect={() => toast.info(`${label} · ${cycle.name}`)}
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
  const [searchQuery, setSearchQuery] = React.useState("");
  const [periodFilters, setPeriodFilters] = React.useState<string[]>([]);
  const [statusFilters, setStatusFilters] = React.useState<string[]>([]);
  const [page, setPage] = React.useState(1);
  // The list the table renders. Held in state (rather than read straight from
  // the mock) so refreshing genuinely re-reads its source, the way a refetch
  // would once this is wired to the API.
  const [cycles, setCycles] = React.useState<ObjectiveCycleItem[]>(OBJECTIVE_CYCLES);

  const filteredCycles = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return cycles.filter((cycle) => {
      if (query && !cycle.name.toLowerCase().includes(query)) return false;
      if (periodFilters.length > 0 && !periodFilters.includes(cycle.period)) return false;
      if (statusFilters.length > 0 && !statusFilters.includes(cycle.status)) return false;
      return true;
    });
  }, [cycles, searchQuery, periodFilters, statusFilters]);

  const pageCount = Math.max(1, Math.ceil(filteredCycles.length / PAGE_SIZE));
  // Narrowing the results can leave `page` past the end of the list. Clamping on
  // read keeps that a derived value instead of a second source of truth.
  const safePage = Math.min(page, pageCount);

  const visibleCycles = React.useMemo(
    () => filteredCycles.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filteredCycles, safePage]
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
        pageSize: PAGE_SIZE,
        onPageChange: setPage,
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
                <TableCell className="py-4 px-8 text-[12px] font-bold text-text-primary max-w-[280px]">
                  <span className="line-clamp-2">{cycle.name}</span>
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
                  <CycleRowActions cycle={cycle} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </ListCard>
  );
};
