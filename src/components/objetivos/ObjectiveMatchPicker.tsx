import * as React from "react";
import { Check, ChevronDown, FilePlus2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  MEASURE_SYMBOL,
  searchObjectives,
  type ObjectiveLink,
  type ParsedObjective,
} from "@/lib/objectivesImport";

/**
 * Picking which of the user's objectives an edit row rewrites.
 *
 * The sibling of `UserIdentityPicker`, one level down and on the same principle:
 * **the name is the control**. There the person's name opens the directory; here
 * the objective's name opens that user's objectives. Neither gets a separate
 * "cambiar" affordance, because in both cases reassigning is not a side errand —
 * it is the main thing this step exists to do.
 *
 * That principle is why this is not a column of its own. A mapping column made the
 * row read as two objectives sitting side by side, when there is only one: the
 * row's name IS the answer to "which objective is this", so the question belongs
 * where the name already is.
 *
 * What it adds over the user picker is a fourth answer. An identifier with nobody
 * behind it is a dead end — this module cannot create people — but an objective
 * with nothing behind it has a perfectly good outcome: load it as a new objective.
 * So "Crear como nuevo" is a first-class option rather than a failure state.
 */

/** One line of the objective's numbers, for telling near-identical names apart. */
const ObjectiveFacts: React.FC<{ objective: ParsedObjective }> = ({ objective }) => (
  <span className="flex items-center gap-x-2.5 gap-y-0.5 flex-wrap text-[10.5px] font-medium text-text-secondary/60">
    <span className="tabular-nums">Peso {objective.weightPercent}%</span>
    <span>
      {MEASURE_SYMBOL[objective.measureType]} {objective.measureType}
    </span>
    <span className="tabular-nums">
      {objective.trend === "Aumentar" ? "↗" : "↘"} Meta {objective.target}
    </span>
  </span>
);

export interface ObjectiveMatchPickerProps {
  /**
   * The row's own name — what the objective will be called after the edit.
   *
   * This, not the target's name, is what the trigger shows: it is the row's
   * identity, it is where the reader's eye already is, and on a row that renames
   * it is the only place the new name appears at all. Which objective it rewrites
   * is one click away, in the panel, and summarised by the chip beside it.
   */
  title: string;
  link: ObjectiveLink;
  /** The user's objectives in this cycle — everything this row could point at. */
  candidates: ParsedObjective[];
  /** Ids already claimed by other rows of the same file, which cannot be reused. */
  takenIds: ReadonlySet<string>;
  /** `null` means "stop rewriting anything and create it new". */
  onChange: (targetId: string | null) => void;
  /** False while the group has no user, so there is nothing to search inside. */
  enabled: boolean;
  /**
   * Whether "crear como objetivo nuevo" is one of the answers.
   *
   * It is on an edit load and it is not on a progress one: there, the row is a
   * number aimed at an objective, and an objective that does not exist yet has
   * no progress to report. Offering it anyway would be offering a button that
   * cannot do what it says.
   */
  allowCreateNew?: boolean;
}

export const ObjectiveMatchPicker: React.FC<ObjectiveMatchPickerProps> = ({
  title,
  link,
  candidates,
  takenIds,
  onChange,
  enabled,
  allowCreateNew = true,
}) => {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const byId = React.useMemo(
    () => new Map(candidates.map((objective) => [objective.id, objective])),
    [candidates]
  );

  /** The objective this row is aimed at: the confirmed target, or the candidate. */
  const shown = link.targetId
    ? byId.get(link.targetId)
    : link.suggestionId
      ? byId.get(link.suggestionId)
      : undefined;

  const isPending = link.status === "possible";
  /** Nothing to rewrite: this row is going to add an objective. */
  const isCreating = link.targetId === undefined && !isPending;

  const results = React.useMemo(
    () =>
      searchObjectives(
        // An objective another row is already rewriting is not offered: two edits
        // to one objective would race, and the second would silently win.
        candidates.filter(
          (objective) => !takenIds.has(objective.id) || objective.id === link.targetId
        ),
        query
      ),
    [candidates, takenIds, link.targetId, query]
  );

  const select = (targetId: string | null) => {
    onChange(targetId);
    setOpen(false);
    setQuery("");
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <PopoverTrigger asChild>
        {/* Sized and weighted like the title input it replaces, so a card of edit
            rows and a card of create rows read as the same table. What marks it as
            a control is the chevron and the border on hover — the same quiet-at-rest
            treatment every other cell has. */}
        <button
          type="button"
          disabled={!enabled}
          aria-label={
            shown
              ? `${title}. Corresponde a “${shown.title}” en UBITS. Clic para cambiar a qué objetivo apunta.`
              : allowCreateNew
                ? `${title}. No se encontró en UBITS, se creará nuevo. Clic para asociarlo a uno existente.`
                : `${title}. No se encontró en UBITS. Clic para elegir a qué objetivo corresponde.`
          }
          title={
            isPending
              ? link.reason
              : shown
                ? `Corresponde a “${shown.title}”. Clic para cambiarlo.`
                : allowCreateNew
                  ? `“${link.lookupTitle}” no existe en UBITS: se creará como objetivo nuevo. Clic para asociarlo a uno existente.`
                  : `“${link.lookupTitle}” no existe en UBITS. Clic para elegir a cuál corresponde.`
          }
          className={cn(
            "group/link flex items-center gap-1 w-full min-w-0 h-7 px-1.5 rounded-md border text-left transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            // The pending decision is already flagged by the row's "Por confirmar"
            // chip, so the name control itself stays as quiet as every other row.
            isPending ? "border-border/50 bg-surface" : "border-transparent",
            "hover:border-border/50 hover:bg-surface"
          )}
        >
          <span className="flex-1 min-w-0 truncate text-[12px] font-semibold text-text-primary">
            {title}
          </span>

          <ChevronDown
            className="h-3 w-3 shrink-0 text-text-secondary/30 group-hover/link:text-text-secondary/60 transition-colors"
            strokeWidth={2.5}
          />
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-[420px] p-0 overflow-hidden">
        <div className="px-3 py-2.5 border-b border-border/50">
          {/*
            Three states, three different things worth saying — and "el archivo
            busca X" was being said in all three, whether or not a search was
            still the point.

            Pending is a proposal, not a search report: the reviewer does not
            need the exact string that failed to match, they need to know this
            is a guess by name and it wants a yes or a different pick. Creating
            has nothing to report at all — nothing looked close enough to
            propose, so the panel is just the search box, silently.
          */}
          {isPending ? (
            <p className="text-[11px] font-medium text-text-secondary/70">
              Te proponemos esta asociación por nombre. Confírmala o elige otra.
            </p>
          ) : isCreating ? null : (
            <p className="text-[11px] font-medium text-text-secondary/70">
              El archivo busca{" "}
              <span className="font-bold text-text-primary break-words">
                “{link.lookupTitle}”
              </span>
            </p>
          )}
          <div className="relative mt-3">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-secondary/40" />
            <input
              type="search"
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar entre los objetivos de este usuario"
              aria-label="Buscar objetivo del usuario"
              className="w-full h-8 pl-8 pr-2.5 rounded-lg border border-border/60 bg-surface text-[12px] font-medium text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>

        <div className="max-h-[260px] overflow-y-auto py-1">
          {results.length === 0 ? (
            <div className="px-3 py-5 text-center">
              <p className="text-[11px] font-medium text-text-secondary/60">
                {candidates.length === 0
                  ? "Este usuario todavía no tiene objetivos en el ciclo."
                  : `Ninguno de sus objetivos coincide con "${query}".`}
              </p>
            </div>
          ) : (
            results.map((objective) => {
              const isSelected = objective.id === link.targetId;
              const isSuggested = objective.id === link.suggestionId && isPending;

              return (
                <button
                  key={objective.id}
                  type="button"
                  onClick={() => select(objective.id)}
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
                        {objective.title}
                      </span>
                      {isSuggested && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-status-warning/15 text-status-warning shrink-0">
                          Propuesto
                        </span>
                      )}
                    </span>
                    <ObjectiveFacts objective={objective} />
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* The answer the user picker has no equivalent of: stop looking, and let
            the row load as something new. Always available, because "no existe
            todavía" is a legitimate reading of any edit row — not just of the
            ones the matcher failed on.

            `p-2` and not `p-1`: this button is the only filled thing that reaches
            the panel's bottom corners, and in this theme the panel's radius is
            20px. A rounded box only nests cleanly when the child's radius is at
            least `parentRadius - inset`: at 4px of inset that budget was 16px
            against the button's 14px, so its corners poked into the curve and it
            read as a rectangle being clipped. 8px of inset drops the budget to
            12px, which the 14px button clears. */}
        {allowCreateNew && (
          <div className="border-t border-border/50 p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => select(null)}
              className={cn(
                "w-full h-8 justify-start px-2 text-[11px] font-bold gap-1.5 rounded-md",
                isCreating
                  ? "text-primary bg-primary/5"
                  : "text-text-secondary/70 hover:text-primary hover:bg-primary/10"
              )}
            >
              <FilePlus2 className="h-3.5 w-3.5" strokeWidth={2.25} />
              {isCreating ? "Se creará como objetivo nuevo" : "Crear como objetivo nuevo"}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
