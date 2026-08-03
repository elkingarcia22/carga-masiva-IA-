import * as React from "react";
import {
  ArrowLeft,
  BarChart3,
  ChevronDown,
  FileDown,
  FileText,
  HelpCircle,
  Layers,
  Pencil,
  Plus,
  SearchX,
  Target,
  Trash2,
  UserMinus,
  Weight,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { EmptyState } from "@/components/feedback/EmptyState";
import {
  AssignedProgressBar,
  AssignedStatusBadge,
  CycleSummaryBar,
  FilterButton,
  InlineSearch,
  ListCard,
  PerformanceIndicator,
  RefreshButton,
  formatProgress,
} from "@/components/objetivos";
import {
  ASSIGNED_USER_STATUSES,
  PERFORMANCE_LEVELS,
  getAssignedUsers,
} from "@/mocks/objetivosMocks";
import type { AssignedUser, ObjectiveCycleItem } from "@/mocks/types";

/**
 * CicloDetalleDashboard
 *
 * Detail view for a single cycle: its overall advance plus the roster of users
 * assigned to it, with the per-user objective management the list can't offer.
 */

const PAGE_SIZE = 16;

function toggleValue(selected: string[], value: string): string[] {
  return selected.includes(value)
    ? selected.filter((item) => item !== value)
    : [...selected, value];
}

/** Cycle-wide reporting and exports — scoped to the cycle, not to a selection. */
const CYCLE_ACTIONS = [
  { icon: FileText, label: "Ver reporte" },
  { icon: BarChart3, label: "Niveles de desempeño" },
  { icon: FileDown, label: "Descargar detalle del ciclo" },
  { icon: FileDown, label: "Descargar progreso del ciclo" },
] as const;

/** Actions that only make sense against a set of selected users. */
const BULK_ACTIONS = [
  { icon: Plus, label: "Crear objetivos", tone: "default" as const },
  { icon: Weight, label: "Reasignar pesos", tone: "default" as const },
  { icon: Layers, label: "Duplicar objetivos de otro ciclo", tone: "default" as const },
  { icon: FileDown, label: "Descargar seleccionados", tone: "default" as const },
  { icon: UserMinus, label: "Quitar del ciclo", tone: "destructive" as const },
] as const;

interface CicloDetalleDashboardProps {
  cycle: ObjectiveCycleItem;
  onBack: () => void;
}

export const CicloDetalleDashboard: React.FC<CicloDetalleDashboardProps> = ({ cycle, onBack }) => {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilters, setStatusFilters] = React.useState<string[]>([]);
  const [performanceFilters, setPerformanceFilters] = React.useState<string[]>([]);
  const [page, setPage] = React.useState(1);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  // Held in state so refreshing re-reads its source, mirroring a future refetch.
  const [users, setUsers] = React.useState<AssignedUser[]>(() => getAssignedUsers(cycle));

  const filteredUsers = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return users.filter((user) => {
      if (
        query &&
        !user.username.toLowerCase().includes(query) &&
        !user.name.toLowerCase().includes(query) &&
        !user.email.toLowerCase().includes(query)
      ) {
        return false;
      }
      if (statusFilters.length > 0 && !statusFilters.includes(user.status)) return false;
      if (performanceFilters.length > 0 && !performanceFilters.includes(user.performance)) {
        return false;
      }
      return true;
    });
  }, [users, searchQuery, statusFilters, performanceFilters]);

  const pageCount = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);

  const visibleUsers = React.useMemo(
    () => filteredUsers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filteredUsers, safePage]
  );

  // Selection is scoped to what is currently visible, so a header checkbox can
  // never silently act on rows the user has filtered out.
  const visibleIds = visibleUsers.map((user) => user.id);
  const selectedVisibleCount = visibleIds.filter((id) => selectedIds.includes(id)).length;
  const areAllVisibleSelected = visibleIds.length > 0 && selectedVisibleCount === visibleIds.length;

  const toggleAllVisible = () => {
    setSelectedIds((prev) =>
      areAllVisibleSelected
        ? prev.filter((id) => !visibleIds.includes(id))
        : [...new Set([...prev, ...visibleIds])]
    );
  };

  const hasActiveFilters =
    statusFilters.length > 0 || performanceFilters.length > 0 || searchQuery !== "";

  const handleRefresh = () => {
    setUsers(getAssignedUsers(cycle));
    setSelectedIds([]);
    setPage(1);
    toast.success("Lista de usuarios asignados actualizada");
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Cycle header: identity on the left, cycle-wide actions opposite it. */}
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Volver a la lista de ciclos"
              onClick={onBack}
              className="h-9 w-9 shrink-0 rounded-full text-text-secondary hover:bg-muted/60 hover:text-text-primary transition-all"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight truncate">
              {cycle.name}
            </h1>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="shrink-0 text-text-secondary/40 hover:text-text-secondary transition-colors cursor-help">
                  <HelpCircle className="h-4 w-4" />
                </span>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-[260px]">
                <span>
                  Ciclo {cycle.period.toLowerCase()} · {cycle.startDate} a {cycle.endDate}
                </span>
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="mt-2 ml-12 text-[13px] font-medium text-text-secondary/70 leading-snug max-w-3xl">
            Aquí puedes ver el progreso general de este ciclo, también puedes ver y buscar los
            usuarios asignados y gestionar sus objetivos.
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="h-10 px-4 gap-2 shrink-0 text-xs font-semibold rounded-xl border-border/60 hover:bg-primary/5 hover:border-primary/50 hover:text-primary transition-all shadow-sm active:scale-95 group"
            >
              <span>Acciones del ciclo</span>
              <ChevronDown className="h-4 w-4 opacity-50 group-data-[state=open]:rotate-180 transition-transform duration-200" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="w-64 p-1.5 rounded-xl border border-border/40 shadow-2xl z-[100]"
          >
            {CYCLE_ACTIONS.map(({ icon: Icon, label }) => (
              <DropdownMenuItem
                key={label}
                onSelect={() => toast.info(`${label} · ${cycle.name}`)}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer text-[12px] font-semibold focus:bg-primary/5 focus:text-primary outline-none"
              >
                <Icon className="h-4 w-4 opacity-60 shrink-0" />
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CycleSummaryBar progress={cycle.progress} users={users} />

      <ListCard
        title="Lista de usuarios asignados"
        subtitle={`${filteredUsers.length} ${filteredUsers.length === 1 ? "usuario asignado" : "usuarios asignados"} al ciclo`}
        description="En esta lista puedes ver el número de objetivos, el peso asignado y el progreso de cada usuario, también puedes gestionar los objetivos desde la columna de acciones."
        toolbar={
          <>
            <InlineSearch
              value={searchQuery}
              onValueChange={(value) => {
                setSearchQuery(value);
                setPage(1);
              }}
              placeholder="Buscar por username, nombre o correo"
              label="Buscar usuario asignado"
            />
            <FilterButton
              onClearAll={() => {
                setStatusFilters([]);
                setPerformanceFilters([]);
                setPage(1);
              }}
              groups={[
                {
                  id: "estado",
                  label: "Estado",
                  options: ASSIGNED_USER_STATUSES,
                  selected: statusFilters,
                  onToggle: (option) => {
                    setStatusFilters((prev) => toggleValue(prev, option));
                    setPage(1);
                  },
                },
                {
                  id: "desempeno",
                  label: "Desempeño",
                  options: PERFORMANCE_LEVELS,
                  selected: performanceFilters,
                  onToggle: (option) => {
                    setPerformanceFilters((prev) => toggleValue(prev, option));
                    setPage(1);
                  },
                },
              ]}
            />
            <RefreshButton onRefresh={handleRefresh} label="Actualizar usuarios asignados" />
          </>
        }
        primaryAction={
          <div className="flex items-center gap-2">
            <BulkActionsButton
              selectedCount={selectedIds.length}
              onClearSelection={() => setSelectedIds([])}
            />
            <Button
              className="h-10 px-5 gap-2 text-xs font-semibold rounded-xl shadow-lg active:scale-95"
              onClick={() => toast.info(`Crear objetivo · ${cycle.name}`)}
            >
              <Plus className="h-4 w-4" />
              <span>Crear objetivo</span>
            </Button>
          </div>
        }
        pagination={{
          page: safePage,
          pageCount,
          totalItems: filteredUsers.length,
          pageSize: PAGE_SIZE,
          onPageChange: setPage,
        }}
      >
        {visibleUsers.length === 0 ? (
          <EmptyState
            title={hasActiveFilters ? "Ningún usuario coincide" : "Sin usuarios asignados"}
            description={
              hasActiveFilters
                ? "Ajusta la búsqueda o quita algunos filtros para ver más usuarios."
                : "Este ciclo todavía no tiene objetivos ni usuarios asignados. Crea el primer objetivo para empezar."
            }
            icon={hasActiveFilters ? SearchX : Target}
            className="border-none bg-transparent py-20"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-border/40 bg-muted/20">
                <TableHead className="w-[40px] pl-6 pr-2">
                  <Checkbox
                    checked={areAllVisibleSelected}
                    onCheckedChange={toggleAllVisible}
                    aria-label="Seleccionar todos los usuarios visibles"
                    className="border-border/60"
                  />
                </TableHead>
                {[
                  { label: "Username", className: "" },
                  { label: "Nombre de usuario", className: "" },
                  { label: "Correo", className: "" },
                  { label: "Estado", className: "" },
                  { label: "# Objetivos", className: "text-center" },
                  { label: "% Peso asignado", className: "text-right" },
                  { label: "Progreso", className: "" },
                  { label: "% Avance", className: "text-right" },
                  { label: "Desempeño", className: "" },
                  { label: "Acciones", className: "text-right pr-8" },
                ].map(({ label, className }) => (
                  <TableHead
                    key={label}
                    className={cn(
                      "text-[11px] font-bold text-text-secondary tracking-tight py-4 whitespace-nowrap",
                      className
                    )}
                  >
                    {label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleUsers.map((user) => {
                const isSelected = selectedIds.includes(user.id);
                return (
                  <TableRow
                    key={user.id}
                    data-state={isSelected ? "selected" : undefined}
                    className={cn(
                      "border-b border-border/40 transition-colors group",
                      isSelected ? "bg-primary/5" : "hover:bg-muted/20"
                    )}
                  >
                    <TableCell className="pl-6 pr-2 py-4">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() =>
                          setSelectedIds((prev) => toggleValue(prev, user.id))
                        }
                        aria-label={`Seleccionar ${user.name}`}
                        className="border-border/60"
                      />
                    </TableCell>
                    <TableCell className="py-4 text-[12px] font-bold text-text-primary max-w-[150px]">
                      <span className="block truncate">{user.username}</span>
                    </TableCell>
                    <TableCell className="text-[11px] font-bold text-text-secondary/80 max-w-[150px]">
                      <span className="block truncate">{user.name}</span>
                    </TableCell>
                    <TableCell className="text-[11px] font-medium text-text-secondary/60 max-w-[170px]">
                      <span className="block truncate">{user.email}</span>
                    </TableCell>
                    <TableCell>
                      <AssignedStatusBadge status={user.status} />
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-[11px] font-extrabold text-center tabular-nums",
                        user.objectivesCount === 0 ? "text-text-secondary/30" : "text-text-primary"
                      )}
                    >
                      {user.objectivesCount}
                    </TableCell>
                    <TableCell className="text-[11px] font-bold text-text-secondary/70 text-right tabular-nums">
                      {user.weightPercent}%
                    </TableCell>
                    <TableCell className="min-w-[110px]">
                      <AssignedProgressBar
                        progress={user.progress}
                        completedProgress={user.completedProgress}
                      />
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-[11px] font-bold text-right tabular-nums whitespace-nowrap",
                        user.progress <= 0 ? "text-text-secondary/40" : "text-text-primary"
                      )}
                    >
                      {formatProgress(user.progress)}
                    </TableCell>
                    <TableCell>
                      <PerformanceIndicator level={user.performance} />
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <AssignedUserRowActions user={user} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </ListCard>
    </div>
  );
};

/**
 * Bulk actions act on the checkbox selection, so the trigger stays disabled
 * until something is selected and carries the count once it is — otherwise
 * pressing it would raise the question "applied to what?".
 */
const BulkActionsButton: React.FC<{
  selectedCount: number;
  onClearSelection: () => void;
}> = ({ selectedCount, onClearSelection }) => {
  const isDisabled = selectedCount === 0;

  const trigger = (
    <Button
      variant="outline"
      disabled={isDisabled}
      className="h-10 px-4 gap-2 text-xs font-semibold rounded-xl border-border/60 text-text-secondary hover:bg-primary/5 hover:border-primary/50 hover:text-primary transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
    >
      <span>Acciones masivas</span>
      {selectedCount > 0 && (
        <span className="h-5 min-w-5 px-1 rounded-full bg-primary text-text-inverse text-[10px] font-extrabold flex items-center justify-center tabular-nums">
          {selectedCount}
        </span>
      )}
      <ChevronDown className="h-4 w-4 opacity-50 group-data-[state=open]:rotate-180 transition-transform duration-200" />
    </Button>
  );

  if (isDisabled) {
    return (
      <Tooltip>
        {/* A disabled button emits no pointer events, so the tooltip needs a wrapper. */}
        <TooltipTrigger asChild>
          <span className="inline-flex">{trigger}</span>
        </TooltipTrigger>
        <TooltipContent side="top">
          <span>Selecciona usuarios para aplicar acciones masivas</span>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-72 p-1.5 rounded-xl border border-border/40 shadow-2xl z-[100]"
      >
        <DropdownMenuLabel className="px-2.5 py-1.5 text-[10px] font-bold text-text-secondary/40 uppercase tracking-widest">
          {selectedCount} {selectedCount === 1 ? "usuario seleccionado" : "usuarios seleccionados"}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border/40 mx-1 my-1" />
        {BULK_ACTIONS.map(({ icon: Icon, label, tone }) => (
          <DropdownMenuItem
            key={label}
            onSelect={() => toast.info(`${label} · ${selectedCount} usuarios`)}
            className={cn(
              "flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer text-[12px] font-semibold outline-none",
              tone === "destructive"
                ? "text-destructive focus:bg-destructive/5 focus:text-destructive"
                : "focus:bg-primary/5 focus:text-primary"
            )}
          >
            <Icon className="h-4 w-4 opacity-60 shrink-0" />
            {label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator className="bg-border/40 mx-1 my-1" />
        <DropdownMenuItem
          onSelect={onClearSelection}
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer text-[12px] font-semibold text-text-secondary/70 focus:bg-muted outline-none"
        >
          <Trash2 className="h-4 w-4 opacity-60 shrink-0" />
          Limpiar selección
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

/** Per-user objective management — the "Acciones" column of the roster. */
const AssignedUserRowActions: React.FC<{ user: AssignedUser }> = ({ user }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button
        variant="ghost"
        size="sm"
        aria-label={`Acciones de ${user.name}`}
        className="h-8 px-2.5 gap-1.5 text-[11px] font-bold text-text-secondary rounded-lg hover:bg-muted group/actions"
      >
        <span>Acciones</span>
        <ChevronDown className="h-3.5 w-3.5 opacity-50 group-data-[state=open]/actions:rotate-180 transition-transform" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent
      align="end"
      sideOffset={6}
      className="w-56 p-1.5 rounded-xl border border-border/40 shadow-2xl z-[100]"
    >
      <DropdownMenuLabel className="px-2.5 py-1.5 text-[10px] font-bold text-text-secondary/40 uppercase tracking-widest">
        Gestionar objetivos
      </DropdownMenuLabel>
      <DropdownMenuSeparator className="bg-border/40 mx-1 my-1" />
      {[
        { icon: Target, label: "Ver objetivos" },
        { icon: Plus, label: "Crear objetivo" },
        { icon: Pencil, label: "Editar pesos" },
        { icon: FileDown, label: "Descargar progreso" },
      ].map(({ icon: Icon, label }) => (
        <DropdownMenuItem
          key={label}
          onSelect={() => toast.info(`${label} · ${user.name}`)}
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer text-[12px] font-semibold focus:bg-primary/5 focus:text-primary outline-none"
        >
          <Icon className="h-4 w-4 opacity-60 shrink-0" />
          {label}
        </DropdownMenuItem>
      ))}
      <DropdownMenuSeparator className="bg-border/40 mx-1 my-1" />
      <DropdownMenuItem
        onSelect={() => toast.info(`Quitar del ciclo · ${user.name}`)}
        className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer text-[12px] font-semibold text-destructive focus:bg-destructive/5 focus:text-destructive outline-none"
      >
        <UserMinus className="h-4 w-4 opacity-60 shrink-0" />
        Quitar del ciclo
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);
