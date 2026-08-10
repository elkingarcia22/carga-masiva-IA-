import * as React from "react";
import {
  AtSign,
  BadgeCheck,
  Check,
  ChevronDown,
  IdCard,
  Search,
  UserRound,
  UserRoundX,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  searchDirectory,
  type IdentifierType,
  type RosterUser,
  type UserMatchStatus,
} from "@/lib/objectivesImport";

/**
 * Picking the UBITS user behind a file identifier.
 *
 * The name itself is the control. A separate "change user" button read as a
 * secondary action, when reassigning is the whole point of this step — so the
 * identity doubles as the combobox that opens the directory.
 *
 * Every surface here leans on the same idea: a name alone cannot confirm an
 * identity. Two people share a name, and UBITS accepts three different kinds of
 * username, so the username, e-mail, area and leader travel with the name both
 * in the header and in each candidate row.
 */

/** One attribute of a user, rendered as icon + value. */
const DetailItem: React.FC<{
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  value?: string;
  label: string;
}> = ({ icon: Icon, value, label }) => {
  if (!value) return null;

  return (
    <span className="inline-flex items-center gap-1 min-w-0" title={`${label}: ${value}`}>
      <Icon className="h-3 w-3 shrink-0 text-text-secondary/40" strokeWidth={2.25} />
      <span className="truncate">{value}</span>
    </span>
  );
};

/**
 * The resolved user's attributes, shown so the reviewer can confirm the match is
 * the right person before anything is loaded.
 */
export const UserDetails: React.FC<{ user: RosterUser; className?: string }> = ({
  user,
  className,
}) => (
  <span
    className={cn(
      "flex items-center gap-x-3 gap-y-0.5 flex-wrap text-[10.5px] font-medium text-text-secondary/60",
      className
    )}
  >
    <DetailItem icon={UserRound} value={user.username} label="Username" />
    {user.email !== user.username && (
      <DetailItem icon={AtSign} value={user.email} label="Correo" />
    )}
    <DetailItem icon={IdCard} value={user.documentId} label="Documento" />
    <DetailItem icon={Users} value={user.area} label="Área" />
    <DetailItem icon={BadgeCheck} value={user.leader} label="Líder" />
  </span>
);

const IDENTIFIER_LABEL: Record<IdentifierType, string> = {
  correo: "correo",
  documento: "documento",
  username: "username",
  nombre: "nombre",
  telefono: "teléfono",
};

export interface UserIdentityPickerProps {
  /** Users to choose from: the cycle roster plus the wider UBITS directory. */
  candidates: RosterUser[];
  /** Currently assigned user, if any. */
  value?: RosterUser;
  /**
   * Candidate we are proposing but nobody has confirmed. Displayed in the
   * field like a real value, because the reviewer's decision is about that
   * person and reading their name out of a banner two rows down made it a
   * different question from the one the field was asking.
   */
  proposed?: RosterUser;
  onChange: (user: RosterUser | null) => void;
  /** Identifier the file used, i.e. the thing being resolved. */
  identifier: string;
  identifierType: IdentifierType;
  matchStatus: UserMatchStatus;
}

export const UserIdentityPicker: React.FC<UserIdentityPickerProps> = ({
  candidates,
  value,
  proposed,
  onChange,
  identifier,
  identifierType,
  matchStatus,
}) => {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const results = React.useMemo(() => searchDirectory(candidates, query, 40), [candidates, query]);

  const closePanel = () => {
    setOpen(false);
    setQuery("");
  };

  const select = (user: RosterUser | null) => {
    onChange(user);
    closePanel();
  };

  const isResolved = matchStatus === "matched" && value !== undefined;

  /**
   * Whoever the field is naming right now.
   *
   * `proposed` wins over `value`: it is either the matcher's candidate or a
   * person the reviewer just picked and has not confirmed, and in both cases it
   * is the identity the field is currently putting forward. Showing the old
   * confirmed user underneath a pending change would name the wrong person.
   */
  const shownUser = proposed ?? value;
  /** Nothing to name yet — the field is still the question, so it is outlined. */
  const isEmpty = matchStatus === "unmatched" && shownUser === undefined;

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <PopoverTrigger asChild>
        {/* Styled as a field rather than a button: this is where the user's
            identity is chosen, so it should look editable at rest. */}
        <button
          type="button"
          aria-label={
            isResolved
              ? `Usuario asociado a ${identifier}. Clic para cambiarlo.`
              : `${identifier} no tiene usuario asociado. Clic para elegir uno.`
          }
          className={cn(
            "group/id flex items-center gap-1.5 min-w-0 max-w-full h-8 pl-2 pr-1.5 rounded-lg border text-left transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
            // An empty field is the one state that outlines itself, because
            // there the field IS the pending decision. Brand blue, not red: a
            // person the directory has not got yet is work to do, not a fault
            // in the file — which is also why that case has a tab of its own
            // instead of living among the data errors. Once it names somebody,
            // confirmed or not, it goes back to looking like a field; the chip
            // beside it is what says whether that name is settled.
            isEmpty
              ? "border-primary/50 bg-primary/[0.04] hover:border-primary"
              : "border-transparent hover:border-border/60 hover:bg-surface-muted/60"
          )}
        >
          {/* No icon in the field. The card already opens with a person badge
              two centimetres to the left, so a second user glyph inside the
              control said nothing new and pushed the name off-centre. */}
          <span
            className={cn(
              "text-[12.5px] font-bold truncate",
              isEmpty ? "text-primary" : "text-text-primary"
            )}
          >
            {shownUser?.name ?? (isEmpty ? "Selecciona un usuario" : identifier)}
          </span>

          <ChevronDown
            className="h-3 w-3 shrink-0 text-text-secondary/30 group-hover/id:text-text-secondary/60 transition-colors"
            strokeWidth={2.5}
          />
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-[380px] p-0 overflow-hidden">
        <div className="px-3 py-2.5 border-b border-border/50">
          <p className="text-[11px] font-medium text-text-secondary/70">
            El archivo lo identifica por {IDENTIFIER_LABEL[identifierType]} como{" "}
            <span className="font-bold text-text-primary break-all">{identifier}</span>
          </p>
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-secondary/40" />
            <input
              type="search"
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nombre, username, correo o documento"
              aria-label="Buscar usuario de UBITS"
              className="w-full h-8 pl-8 pr-2.5 rounded-lg border border-border/60 bg-surface text-[12px] font-medium text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>

        <div className="max-h-[300px] overflow-y-auto py-1">
          {results.length === 0 ? (
            <div className="px-3 py-6 text-center">
              <p className="text-[11px] font-medium text-text-secondary/60">
                Ningún usuario de UBITS coincide con "{query}".
              </p>
            </div>
          ) : (
            results.map((user) => {
              const isSelected = value?.username === user.username;

              return (
                <button
                  key={user.username}
                  type="button"
                  onClick={() => select(user)}
                  className={cn(
                    "w-full flex items-start gap-2 px-3 py-2 text-left transition-colors",
                    isSelected ? "bg-primary/5" : "hover:bg-surface-muted/60"
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 h-3.5 w-3.5 shrink-0",
                      isSelected ? "text-primary" : "text-transparent"
                    )}
                  >
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="text-[12px] font-bold text-text-primary truncate">
                        {user.name}
                      </span>
                      {user.onCycle && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-status-positive/10 text-status-positive shrink-0">
                          En el ciclo
                        </span>
                      )}
                    </span>
                    <UserDetails user={user} className="mt-0.5" />
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* The one way out that is not "pick this list item": park the
            group as unresolved rather than load it against the wrong
            user.

            `p-2` for the same reason as the objective picker's footer: the panel's
            radius is 20px, and a child only nests cleanly when its own radius is
            at least `parentRadius - inset`. At 4px of inset the 14px button fell
            short of the 16px budget and its hover fill ran into the corners. */}
        {value && (
          <div className="border-t border-border/50 p-2 flex flex-col">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => select(null)}
              className="w-full h-8 justify-start px-2 text-[11px] font-bold gap-1.5 rounded-md text-text-secondary/70 hover:text-status-negative hover:bg-status-negative/10"
            >
              <UserRoundX className="h-3.5 w-3.5" strokeWidth={2.25} />
              Dejar sin asociar
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
