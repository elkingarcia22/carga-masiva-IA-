import * as React from "react";
import { Plus, SearchX } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
  DEFAULT_PAGE_SIZE,
  FilterButton,
  InlineSearch,
  ListCard,
  RefreshButton,
} from "@/components/objetivos";
import { USERS_WITHOUT_OBJECTIVES, USER_AREAS } from "@/mocks/objetivosMocks";
import type { UserWithoutObjectives } from "@/mocks/types";

/**
 * UsuariosSinObjetivosDashboard
 *
 * Main view of the "Usuarios sin objetivos" tab: collaborators who have no
 * objectives assigned yet, with a per-row shortcut to create them.
 */

function toggleValue(selected: string[], value: string): string[] {
  return selected.includes(value)
    ? selected.filter((item) => item !== value)
    : [...selected, value];
}

export const UsuariosSinObjetivosDashboard: React.FC = () => {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [areaFilters, setAreaFilters] = React.useState<string[]>([]);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState<number>(DEFAULT_PAGE_SIZE);
  // Held in state so refreshing re-reads its source, mirroring a future refetch.
  const [users, setUsers] = React.useState<UserWithoutObjectives[]>(USERS_WITHOUT_OBJECTIVES);

  const filteredUsers = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return users.filter((user) => {
      // Matches the placeholder's promise: username, name or email.
      if (
        query &&
        !user.username.toLowerCase().includes(query) &&
        !user.name.toLowerCase().includes(query) &&
        !user.email.toLowerCase().includes(query)
      ) {
        return false;
      }
      if (areaFilters.length > 0 && !areaFilters.includes(user.area)) return false;
      return true;
    });
  }, [users, searchQuery, areaFilters]);

  const pageCount = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  // Clamped on read so narrowing the results can't leave the view on an empty page.
  const safePage = Math.min(page, pageCount);

  const visibleUsers = React.useMemo(
    () => filteredUsers.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filteredUsers, safePage, pageSize]
  );

  const hasActiveFilters = areaFilters.length > 0 || searchQuery !== "";

  const handleRefresh = () => {
    setUsers([...USERS_WITHOUT_OBJECTIVES]);
    setPage(1);
    toast.success("Lista de usuarios actualizada");
  };

  return (
    <ListCard
      title="Lista de usuarios sin objetivos"
      subtitle={`${filteredUsers.length.toLocaleString("es-CO")} ${filteredUsers.length === 1 ? "usuario" : "usuarios"}`}
      description="Estos son los colaboradores de tu empresa que aún no tienen objetivos asignados. Puedes buscarlos y filtrarlos para crearles objetivos desde la columna de acciones."
      toolbar={
        <>
          <InlineSearch
            value={searchQuery}
            onValueChange={(value) => {
              setSearchQuery(value);
              setPage(1);
            }}
            placeholder="Buscar por username, nombre o correo"
            label="Buscar usuario"
          />
          <FilterButton
            onClearAll={() => {
              setAreaFilters([]);
              setPage(1);
            }}
            groups={[
              {
                id: "area",
                label: "Área",
                options: USER_AREAS,
                selected: areaFilters,
                onToggle: (option) => {
                  setAreaFilters((prev) => toggleValue(prev, option));
                  setPage(1);
                },
              },
            ]}
          />
          <RefreshButton onRefresh={handleRefresh} label="Actualizar usuarios" />
        </>
      }
      pagination={{
        page: safePage,
        pageCount,
        totalItems: filteredUsers.length,
        pageSize,
        onPageChange: setPage,
        onPageSizeChange: (size) => {
          setPageSize(size);
          setPage(1);
        },
      }}
    >
      {visibleUsers.length === 0 ? (
        <EmptyState
          title="Ningún usuario coincide"
          description={
            hasActiveFilters
              ? "Ajusta la búsqueda o quita algunos filtros para ver más usuarios."
              : "Todos los colaboradores de tu empresa ya tienen objetivos asignados."
          }
          icon={SearchX}
          className="border-none bg-transparent py-20"
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-border/40 bg-muted/20">
              <TableHead className="text-[11px] font-bold text-text-secondary tracking-tight py-4 px-8">
                Username
              </TableHead>
              <TableHead className="text-[11px] font-bold text-text-secondary tracking-tight py-4">
                Nombre
              </TableHead>
              <TableHead className="text-[11px] font-bold text-text-secondary tracking-tight py-4">
                Correo
              </TableHead>
              <TableHead className="text-[11px] font-bold text-text-secondary tracking-tight py-4">
                Área
              </TableHead>
              <TableHead className="text-[11px] font-bold text-text-secondary tracking-tight py-4">
                Líder
              </TableHead>
              <TableHead className="text-[11px] font-bold text-text-secondary tracking-tight py-4 text-right pr-8">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleUsers.map((user) => (
              <TableRow
                key={user.id}
                className="border-b border-border/40 transition-colors group hover:bg-muted/20"
              >
                <TableCell className="py-4 px-8 text-[12px] font-bold text-text-primary max-w-[200px]">
                  <span className="block truncate">{user.username}</span>
                </TableCell>
                <TableCell className="text-[11px] font-bold text-text-secondary/80 max-w-[200px]">
                  <span className="block truncate">{user.name}</span>
                </TableCell>
                <TableCell className="text-[11px] font-medium text-text-secondary/60 max-w-[240px]">
                  <span className="block truncate">{user.email}</span>
                </TableCell>
                <TableCell className="text-[11px] font-bold text-text-secondary/70 whitespace-nowrap">
                  {user.area}
                </TableCell>
                <TableCell className="text-[11px] font-medium text-text-secondary/60 max-w-[200px]">
                  {user.leader ? (
                    <span className="block truncate">{user.leader}</span>
                  ) : (
                    <span className="text-text-secondary/25">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right pr-8">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toast.info(`Crear objetivos · ${user.name}`)}
                    className="h-8 px-2.5 gap-1.5 text-[11px] font-bold text-primary rounded-lg hover:bg-primary/5 whitespace-nowrap"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Crear objetivos</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </ListCard>
  );
};
