import * as React from "react";
import {
  AlertTriangle,
  ChevronsDownUp,
  CircleCheck,
  Info,
  SearchX,
  UserRoundSearch,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ObjectiveGroupHeader } from "./ObjectiveGroupHeader";
import { ObjectiveReviewRow } from "./ObjectiveReviewRow";
import { FilterButton, InlineSearch } from "./ListToolbar";
import {
  MEASURE_TYPES,
  TRENDS,
  bucketForGroup,
  describeGroupWeight,
  groupDisplayName,
  groupTargetedIds,
  groupUntouchedObjectives,
  type BulkUploadMode,
  type GroupBucket,
  type MeasureType,
  type ObjectiveUserGroup,
  type ParsedObjective,
  type RosterUser,
  type Trend,
} from "@/lib/objectivesImport";

/**
 * ObjectivesReviewTable
 *
 * What the file turned into, grouped by the user each objective belongs to and
 * editable in place. This is the step where the load stops being a black box:
 * every field UBITS stores is visible and the rules run live on each keystroke.
 *
 * The three tabs split the work by what is blocking it, not by data type:
 * objectives whose person and numbers are both settled, identities we can only
 * propose, and everything unloadable — rows whose data UBITS would reject plus
 * identifiers with nobody to point at, since the objectives module cannot create
 * people. They are ordered by how hard each blocker is, so a group drops down a
 * tab as it gets resolved and the queue drains in the order the work happens.
 *
 * Two decisions drive the look, both aimed at reading as data rather than as a
 * 130-field form:
 *
 * - Cells are quiet. A border and a surface only appear on hover and focus, so
 *   the default state is text. Outlining every input at rest turns the table
 *   into a wall of boxes at this column count.
 * - Colour marks exceptions only. A weight that adds up gets a plain number; a
 *   weight that does not gets the pill. When every row is tinted green nothing
 *   stands out, which defeats the point of the review step.
 *
 * There is no per-row approval. Reviewing every objective one by one to say
 * "yes" was ceremony: what actually decides whether a row loads is whether its
 * data is valid and its person is known, and the table already shows both. The
 * only per-row action left is removing a row from the load.
 *
 * A card can hold two kinds of row. Everything the file brings, and — when the
 * resolved user already has objectives in this cycle — those too, in the same
 * table and just as editable. They are there because the 100% rule spans both:
 * a spotless file cannot load against somebody whose existing objectives already
 * claim the whole 100%, and the only way to make room is to see both halves and
 * decide which weights come down. `ObjectiveReviewRow` renders either kind.
 *
 * An edit load asks one more question per row, and it is the harder one: *which*
 * objective is this about. The file answers it in prose — a name somebody typed —
 * so the answer is a match rather than a lookup, and the row's own name is the
 * control that settles it. That also changes the arithmetic: a row rewriting an
 * objective replaces its weight instead of adding to it, which is why the
 * untouched objectives and the rewritten ones are counted differently.
 *
 * Whichever kind of load it is, the card is one list. What each row is — already
 * in UBITS, about to be created, rewriting something, left alone — is said by a
 * chip on the row itself rather than by headings above groups of them, because a
 * heading scrolls away from the rows it describes and these cards get long.
 */

/**
 * Column widths, shared by the header table and every group's body table so the
 * two line up. `table-fixed` plus an explicit colgroup is what keeps them in
 * step — without it each accordion would size its columns independently.
 *
 * A progress load gets its own, shorter set. It is not the same table with a
 * column bolted on: eight of the eleven fields it would show are ones that load
 * cannot write, and putting a wall of read-only numbers around the single
 * editable cell is what would hide it.
 */
const TableColumns: React.FC<{ isProgressLoad: boolean }> = ({ isProgressLoad }) =>
  isProgressLoad ? (
    <colgroup>
      <col style={{ width: 34 }} />
      <col style={{ width: 300 }} />
      <col style={{ width: 128 }} />
      <col style={{ width: 112 }} />
      <col style={{ width: 92 }} />
      <col style={{ width: 92 }} />
      <col style={{ width: 104 }} />
      <col style={{ width: 104 }} />
      <col style={{ width: 100 }} />
      <col style={{ width: 74 }} />
    </colgroup>
  ) : (
    <colgroup>
      <col style={{ width: 34 }} />
      <col style={{ width: 268 }} />
      {/* Medida. Sized for the three short values, not for the long one: widening
          it enough to fit "Se cumple / No se cumple" whole cost 28px of every row
          to spare one value an ellipsis, and pushed the numeric columns further
          out of view. It truncates instead — cleanly, with room before the
          chevron — and the full name is in the control's tooltip and its list. */}
      <col style={{ width: 128 }} />
      <col style={{ width: 112 }} />
      <col style={{ width: 88 }} />
      <col style={{ width: 88 }} />
      <col style={{ width: 80 }} />
      <col style={{ width: 80 }} />
      <col style={{ width: 68 }} />
      <col style={{ width: 74 }} />
    </colgroup>
  );

/**
 * The one question on screen, whatever kind it is.
 *
 * Removals and merges share this slot because they share a rule: only one may
 * be open at a time, and while one is, the rest of the review stops responding.
 */
type PendingQuestion =
  | { kind: "row"; id: string }
  | { kind: "group"; identifier: string }
  | { kind: "merge"; identifier: string; user: RosterUser; targetIdentifier: string };

/** A group paired with the subset of its objectives the filters let through. */
interface VisibleGroup {
  group: ObjectiveUserGroup;
  objectives: ParsedObjective[];
}

/** Empty bucket map, the seed for every per-tab reduction. */
const EMPTY_BUCKETS: Record<GroupBucket, ObjectiveUserGroup[]> = {
  alineados: [],
  asociaciones: [],
  sinAlinear: [],
  errores: [],
};

/**
 * Reading order of the tabs, which is also the order the work drains in: settle
 * who each user is, then fix their data, then load.
 *
 * Identity leads because it gates everything after it — a card with no user
 * does not show its rule violations yet, so it cannot be in `errores` until it
 * has one. Within identity, the users with nobody at all come before the ones
 * that already have a candidate to accept: they are the ones needing real work,
 * and confirming a proposal is a click. Reading the tabs left to right walks
 * the same path a card walks.
 */
const TAB_ORDER: GroupBucket[] = ["sinAlinear", "asociaciones", "errores", "alineados"];

const TAB_META: Record<
  GroupBucket,
  /* `label` names the tab; `listTitle` names what the tab is showing, and heads
     the list below it the way every other list in the module is headed.
     `emptyTitle` and `empty` are what the tab says when it holds nothing — a
     state the reviewer can now reach on purpose, by clicking a badge that says 0
     to check that the tab really is clear. */
  { label: string; listTitle: string; emptyTitle: string; empty: string }
/* Declared in the order the tabs are shown, so the file reads like the UI. */
> = {
  /**
   * Not an error tab, and nothing in it reads as one.
   *
   * These identifiers are simply people UBITS does not know yet — a contractor,
   * a new hire, a personal address. A card here may well have rule violations
   * too, but they stay hidden until it has an owner: showing them would put two
   * unrelated jobs on one card and drown the only one that can be done now. The
   * review reveals them the moment a user is picked.
   */
  sinAlinear: {
    label: "Sin alinear",
    listTitle: "Lista de usuarios sin alinear",
    emptyTitle: "Todos los usuarios están alineados",
    empty:
      "Cada identificador del archivo apunta a un usuario de UBITS, así que no hay nadie por elegir a mano.",
  },
  // The bucket key stays `asociaciones` while the label follows the product's
  // wording: it holds proposals waiting on a human either way.
  asociaciones: {
    label: "Posible alineación",
    listTitle: "Lista de usuarios con posible alineación",
    emptyTitle: "No hay nada por confirmar",
    empty:
      "Todos los identificadores del archivo coincidieron por username, correo o documento, así que ninguno quedó como propuesta.",
  },
  errores: {
    label: "Con errores",
    listTitle: "Lista de usuarios con errores",
    emptyTitle: "Ningún dato por corregir",
    empty:
      "Los pesos suman 100% y ninguna fila con usuario tiene datos que UBITS vaya a rechazar.",
  },
  alineados: {
    /*
      The one empty tab that is bad news: nothing can load. So it is the only one
      whose empty state points back at the work instead of congratulating the
      reviewer for having none left.
    */
    label: "Alineados",
    listTitle: "Lista de objetivos alineados",
    emptyTitle: "Todavía no hay nada listo para cargar",
    empty:
      "Ningún usuario tiene a la vez su persona resuelta, sus datos válidos y sus pesos en 100%. Revisa las otras pestañas.",
  },
};

export interface ObjectivesReviewTableProps {
  groups: ObjectiveUserGroup[];
  mode: BulkUploadMode;
  /** Everyone the identifier can be assigned to: cycle roster + UBITS directory. */
  candidates: RosterUser[];
  onDelete: (id: string) => void;
  onDeleteMany: (ids: string[]) => void;
  onChange: (id: string, patch: Partial<ParsedObjective>) => void;
  /** Assigns (or clears) the UBITS user a file identifier resolves to. */
  onAssignUser: (identifier: string, user: RosterUser | null) => void;
  /**
   * The reviewer's explicit "yes, load this" for a card whose identity was
   * never in question, once its data has nothing left to fix. `onAssignUser`
   * carries this meaning for a card still settling who it is; this is the
   * same click for the one case that has no identity left to settle.
   */
  onConfirmReady: (identifier: string) => void;
  /**
   * Folds one identifier's objectives into another group's, for when two rows
   * of the file turn out to name the same person.
   */
  onMergeGroups?: (sourceIdentifier: string, targetIdentifier: string) => void;
  /**
   * Points one edit row at a different objective of the same user, or at none —
   * `null` meaning "load it as a new objective instead of rewriting one".
   *
   * Only ever called on an edit load. Absent means the picker renders read-only,
   * which is what a create load wants: there is nothing to point at.
   */
  onRelinkObjective?: (objectiveId: string, targetId: string | null) => void;
  /**
   * Fires whenever a removal question opens or closes, so the drawer can freeze
   * its footer for as long as one is up. The review can inert its own subtree,
   * but the buttons that finish the load live outside it.
   */
  onConfirmingChange?: (isConfirming: boolean) => void;
}

export const ObjectivesReviewTable: React.FC<ObjectivesReviewTableProps> = ({
  groups,
  mode,
  candidates,
  onDelete,
  onDeleteMany,
  onChange,
  onAssignUser,
  onConfirmReady,
  onMergeGroups,
  onRelinkObjective,
  onConfirmingChange,
}) => {
  /** A load that only records progress; every other field is read-only context. */
  const isProgressLoad = mode === "actualizar";
  /**
   * Both editing and updating ask which objective each row is about — creating
   * has nothing to ask, since every row is new by definition.
   */
  const isEditLoad = mode === "editar";
  const columnCount = 10;

  /**
   * Both field filters are multi-select, empty meaning "all".
   *
   * They were single-value dropdowns with a "Todos los tipos" entry, which is
   * the shape a `<select>` forces rather than the question being asked — a
   * reviewer chasing the money objectives usually wants the percentages too.
   * Empty-is-all is also what `FilterButton` speaks, so the review now shares
   * the module's filter popover instead of keeping its own pair of selects.
   */
  const [query, setQuery] = React.useState("");
  const [measureFilters, setMeasureFilters] = React.useState<MeasureType[]>([]);
  const [trendFilters, setTrendFilters] = React.useState<Trend[]>([]);

  const groupsByBucket = React.useMemo(
    () =>
      groups.reduce<Record<GroupBucket, ObjectiveUserGroup[]>>((buckets, group) => {
        const bucket = bucketForGroup(group);
        return { ...buckets, [bucket]: [...buckets[bucket], group] };
      }, EMPTY_BUCKETS),
    [groups]
  );

  /** Opens on the tab that actually has work rather than always on "Alineados". */
  const [selectedTab, setSelectedTab] = React.useState<GroupBucket>(() => {
    const initial = groups.reduce<Record<GroupBucket, number>>(
      (counts, group) => {
        const bucket = bucketForGroup(group);
        return { ...counts, [bucket]: counts[bucket] + 1 };
      },
      { alineados: 0, asociaciones: 0, sinAlinear: 0, errores: 0 }
    );
    return TAB_ORDER.find((bucket) => initial[bucket] > 0) ?? "alineados";
  });

  /**
   * How full the open tab was last time we looked.
   *
   * This is what tells "the reviewer just emptied this tab" apart from "the
   * reviewer opened an empty tab on purpose", and the two need opposite
   * behaviour. Draining the tab you are working in should carry you to whatever
   * is still blocking — being stranded on an empty list you just cleared is
   * disorienting. But clicking a tab whose badge says 0 is a question, and the
   * answer is its empty state; silently redirecting to another tab made the click
   * look broken and left the reviewer unable to confirm that, say, nothing is
   * unaligned.
   *
   * Compared during render rather than in an effect: an effect would fire a
   * second render pass on every edit that empties a tab.
   */
  const [lastTabCount, setLastTabCount] = React.useState(
    () => groupsByBucket[selectedTab].length
  );
  const openTabCount = groupsByBucket[selectedTab].length;

  if (openTabCount !== lastTabCount) {
    setLastTabCount(openTabCount);
    if (openTabCount === 0 && lastTabCount > 0) {
      const next = TAB_ORDER.find((bucket) => groupsByBucket[bucket].length > 0);
      if (next) setSelectedTab(next);
    }
  }

  const tab = selectedTab;

  /**
   * Only the first user of the tab opens. A file can carry dozens of users, and
   * expanding all of them buries the controls under rows nobody has got to yet.
   */
  const collapseAllButFirst = (list: ObjectiveUserGroup[]): ReadonlySet<string> =>
    new Set(list.slice(1).map((group) => group.identifier));

  /**
   * Collapse state per tab, so each one keeps its own default and its own
   * history. An absent entry means "never touched here", which resolves to the
   * only-the-first-user default — that is what lets an auto-advanced tab open
   * correctly without an effect resetting anything.
   */
  const [collapsedByTab, setCollapsedByTab] = React.useState<
    Partial<Record<GroupBucket, ReadonlySet<string>>>
  >({});

  /**
   * The single removal awaiting a yes, whether it is one row or a whole user.
   *
   * One piece of state for both because there is only ever one question on
   * screen, and because answering it is the only thing the reviewer may do
   * while it is up — which the review can only enforce if it knows a question
   * is open, wherever it was raised.
   */
  const [pendingDelete, setPendingDelete] = React.useState<PendingQuestion | null>(null);
  const isConfirming = pendingDelete !== null;
  const cancelDelete = () => setPendingDelete(null);

  /**
   * Escape backs out of the question.
   *
   * Captured on `window`, which runs before the drawer's own handler: Radix
   * listens for Escape on the document, also in the capture phase, and it
   * registered first. Without winning that race, pressing Escape to abandon a
   * delete would close the drawer and discard the whole review.
   */
  React.useEffect(() => {
    if (!isConfirming) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      setPendingDelete(null);
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [isConfirming]);

  /** Lets the drawer freeze its own footer while a question is up. */
  React.useEffect(() => {
    onConfirmingChange?.(isConfirming);
  }, [isConfirming, onConfirmingChange]);

  const collapsed = collapsedByTab[tab] ?? collapseAllButFirst(groupsByBucket[tab]);

  const setCollapsed = (next: ReadonlySet<string>) =>
    setCollapsedByTab((current) => ({ ...current, [tab]: next }));

  /**
   * A click is honoured even on an empty tab — that is the whole point of the
   * empty states. `lastTabCount` is moved along with it so the drain-detection
   * above does not read the click as "the tab you were in just emptied" and
   * bounce straight back out.
   */
  const switchTab = (next: GroupBucket) => {
    setSelectedTab(next);
    setLastTabCount(groupsByBucket[next].length);
  };

  /**
   * Usernames two or more groups resolve to.
   *
   * Two different identifiers in the file can legitimately end up pointing at
   * the same person — a nickname on one row and a personal e-mail on another —
   * and once they do, that person's weights would be loaded twice and blow past
   * 100%. The group key stays the file identifier (so reassigning can never
   * merge or lose rows), which means the collision has to be reported here
   * rather than prevented by the grouping.
   */
  const duplicateUsernames = React.useMemo(() => {
    const seen = new Map<string, number>();
    groups.forEach((group) => {
      const username = group.matchedUser?.username;
      if (!username) return;
      seen.set(username, (seen.get(username) ?? 0) + 1);
    });
    return new Set([...seen.entries()].filter(([, count]) => count > 1).map(([name]) => name));
  }, [groups]);

  /**
   * The group already holding a given user, ignoring the one asking.
   *
   * Feeds the confirm step: pointing a second identifier at somebody who is
   * already in the load is allowed, but it has to be a decision rather than a
   * side effect, so the header stops and offers to merge.
   */
  const findGroupFor = React.useCallback(
    (identifier: string, username: string) =>
      groups.find(
        (candidate) =>
          candidate.identifier !== identifier && candidate.matchedUser?.username === username
      ),
    [groups]
  );

  const hasFilters =
    query.trim() !== "" || measureFilters.length > 0 || trendFilters.length > 0;

  /**
   * The user search matches the whole group, the field filters narrow the rows
   * inside it. A group whose rows are all filtered out drops away entirely —
   * showing an empty accordion would just be noise.
   */
  const visibleGroups = React.useMemo<VisibleGroup[]>(() => {
    const needle = query.trim().toLowerCase();

    return groupsByBucket[tab].reduce<VisibleGroup[]>((visible, group) => {
      const matchesUser =
        needle === "" ||
        groupDisplayName(group).toLowerCase().includes(needle) ||
        group.identifier.toLowerCase().includes(needle);

      if (!matchesUser) return visible;

      const objectives = group.objectives.filter(
        (objective) =>
          (measureFilters.length === 0 || measureFilters.includes(objective.measureType)) &&
          (trendFilters.length === 0 || trendFilters.includes(objective.trend))
      );

      return objectives.length === 0 ? visible : [...visible, { group, objectives }];
    }, []);
  }, [groupsByBucket, tab, query, measureFilters, trendFilters]);

  /**
   * Filtering is a search intent, so every match opens — a collapsed accordion
   * as the answer to a search would hide the very rows the user asked for.
   * Clearing the filters restores the only-the-first-user default.
   */
  const updateFilters = (next: {
    query?: string;
    measures?: MeasureType[];
    trends?: Trend[];
  }) => {
    const nextQuery = next.query ?? query;
    const nextMeasures = next.measures ?? measureFilters;
    const nextTrends = next.trends ?? trendFilters;

    setQuery(nextQuery);
    setMeasureFilters(nextMeasures);
    setTrendFilters(nextTrends);

    const isNarrowing =
      nextQuery.trim() !== "" || nextMeasures.length > 0 || nextTrends.length > 0;
    setCollapsed(isNarrowing ? new Set<string>() : collapseAllButFirst(groupsByBucket[tab]));
  };

  const clearFilters = () => updateFilters({ query: "", measures: [], trends: [] });

  /** Adds or removes one option, never mutating the array in place. */
  function toggleFilter<T extends string>(current: T[], option: T): T[] {
    return current.includes(option)
      ? current.filter((entry) => entry !== option)
      : [...current, option];
  }

  const toggleGroup = (identifier: string) => {
    const next = new Set(collapsed);
    if (next.has(identifier)) next.delete(identifier);
    else next.add(identifier);
    setCollapsed(next);
  };

  /** What the header counts: the tab's own totals, after search and filters. */
  const visibleUsers = visibleGroups.length;
  const visibleObjectives = visibleGroups.reduce(
    (total, entry) => total + entry.objectives.length,
    0
  );

  const allCollapsed =
    visibleGroups.length > 0 &&
    visibleGroups.every((entry) => collapsed.has(entry.group.identifier));

  const toggleAllGroups = () => {
    setCollapsed(
      allCollapsed ? new Set() : new Set(visibleGroups.map((entry) => entry.group.identifier))
    );
  };

  return (
    /*
      The review owns the drawer's height and scrolls only its cards.

      Tabs, toolbar and the tab's notice are the instruments for the list below
      them: scrolling them away meant losing the counts, the search and the tab
      you are in the moment you look at the third user, and every filter change
      sent you back to the top to see what it did. They stay put; the cards move
      under them. `min-h-0` is what makes that legal — without it the flex child
      refuses to shrink below its content and the whole panel scrolls again.
    */
    <div className="flex-1 min-h-0 flex flex-col gap-3">
      {/*
        Everything outside an open question goes inert.

        `inert` is what makes "answer this first" true rather than merely
        suggested: it drops the subtree out of the tab order, out of hit
        testing and out of the accessibility tree in one attribute. Dimming it
        alone would still let a stray click switch tabs or edit a cell behind
        the question, and the reviewer would come back to a card that had moved.
      */}
      {/* Tabs split the queue by what is blocking each user.

          Same strip as the drawer's own "Nueva carga / Cargas": one grid of
          equal columns on a solid `surface-muted` track, no border, and the
          active tab lifted on white with the brand colour. The review had its
          own lighter, outlined, shorter variant, so the two tab rows a reviewer
          sees thirty seconds apart in the same drawer did not look like the
          same control. */}
      <div
        role="tablist"
        aria-label="Estado de los usuarios detectados"
        inert={isConfirming || undefined}
        className={cn(
          "shrink-0 grid grid-cols-4 w-full h-11 p-1 gap-1 rounded-xl bg-surface-muted transition-opacity",
          isConfirming && "opacity-50"
        )}
      >
        {TAB_ORDER.map((bucket) => {
          const meta = TAB_META[bucket];
          const count = groupsByBucket[bucket].length;
          const isActive = bucket === tab;

          return (
            <button
              key={bucket}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => switchTab(bucket)}
              className={cn(
                "flex items-center justify-center gap-2 h-full px-2 rounded-lg text-[13px] font-bold tracking-tight transition-all",
                isActive
                  ? "bg-surface shadow-sm text-primary"
                  : "text-text-secondary/70 hover:text-text-primary"
              )}
            >
              <span className="truncate">{meta.label}</span>
              {/* A circle, not a pill: the counts here are one or two digits, so
                  a fixed round chip keeps the tabs the same width instead of
                  letting the badge stretch as groups drain between them.

                  Neutral in every tab. Four coloured chips in a row read as four
                  simultaneous alarms and made the strip the loudest thing in the
                  review, competing with the one card actually being worked on —
                  and green next to red next to amber says nothing that the tab
                  labels do not already say. The badge is a quantity; the label
                  carries the meaning. */}
              {/* The chip's fill is whatever the tab under it is not: white
                  tabs get the muted chip, muted tabs get the white one.
                  A single fill would vanish on one half of the strip. */}
              <span
                className={cn(
                  "inline-flex items-center justify-center h-[18px] min-w-[18px] px-1 rounded-full text-[10px] font-bold tabular-nums shrink-0",
                  isActive ? "bg-surface-muted" : "bg-surface",
                  count === 0 ? "text-text-secondary/40" : "text-text-secondary"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/*
        A list header, not a toolbar.

        It used to be a bordered, filled bar holding a permanent search box and
        two dropdowns — three boxes stacked between the tabs above and the cards
        below, all of them chrome around content that was still one scroll away.
        Now it reads like every other list in the module: the name of what you
        are looking at on the left with its count, the controls collapsed to
        icons on the right, and no frame around any of it. The same
        `InlineSearch` and `FilterButton` the cycles and users lists use, so the
        gesture is already learned by the time the drawer opens.
      */}
      <div
        inert={isConfirming || undefined}
        className={cn(
          "shrink-0 flex items-center justify-between gap-4 px-1 transition-opacity",
          isConfirming && "opacity-50"
        )}
      >
        <div className="flex items-baseline gap-2 min-w-0">
          <h3 className="text-[13px] font-bold text-text-primary tracking-tight truncate">
            {TAB_META[tab].listTitle}
          </h3>
          <span className="text-[11px] font-medium text-text-secondary/50 tabular-nums whitespace-nowrap">
            {visibleUsers} {visibleUsers === 1 ? "usuario" : "usuarios"} ·{" "}
            {visibleObjectives} {visibleObjectives === 1 ? "objetivo" : "objetivos"}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <InlineSearch
            value={query}
            onValueChange={(value) => updateFilters({ query: value })}
            placeholder="Buscar por nombre o identificador"
            label="Buscar usuario"
          />

          <FilterButton
            onClearAll={clearFilters}
            groups={[
              {
                id: "medida",
                label: "Tipo de medida",
                options: MEASURE_TYPES,
                selected: measureFilters,
                onToggle: (option) =>
                  updateFilters({
                    measures: toggleFilter(measureFilters, option as MeasureType),
                  }),
              },
              {
                id: "direccion",
                label: "Dirección",
                options: TRENDS,
                selected: trendFilters,
                onToggle: (option) =>
                  updateFilters({ trends: toggleFilter(trendFilters, option as Trend) }),
              },
            ]}
          />

          {/* Only while there is something to undo. A permanently visible
              "Limpiar" is a button that does nothing most of the time. */}
          {hasFilters && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Limpiar búsqueda y filtros"
                  onClick={clearFilters}
                  className="h-10 w-10 rounded-full text-text-secondary hover:bg-muted/50 transition-all hover:scale-110"
                >
                  <X className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <span>Limpiar búsqueda y filtros</span>
              </TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={allCollapsed ? "Expandir todos" : "Contraer todos"}
                onClick={toggleAllGroups}
                disabled={visibleGroups.length === 0}
                className="h-10 w-10 rounded-full text-text-secondary hover:bg-muted/50 transition-all hover:scale-110 disabled:opacity-40 disabled:hover:scale-100"
              >
                <ChevronsDownUp
                  className={cn("h-5 w-5 transition-transform", allCollapsed && "rotate-180")}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <span>{allCollapsed ? "Expandir todos" : "Contraer todos"}</span>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/*
        Why these are proposals and not matches.

        Without it the tab looks arbitrary: UBITS found the person, so why is it
        asking? The answer is that it did not find them by an identifier. A
        username, a corporate e-mail or a document number resolve outright —
        anything that lands here got here through a name, a phone or a
        near-miss, and none of those belongs to exactly one person for certain.
        Said once at the top of the tab, not repeated on every card.
      */}
      {tab === "asociaciones" && visibleGroups.length > 0 && (
        <div className="shrink-0 flex items-start gap-2 px-3 py-2.5 rounded-xl border border-primary/25 bg-primary/[0.05]">
          <Info className="h-3.5 w-3.5 mt-px shrink-0 text-primary" strokeWidth={2.5} />
          <p className="text-[11.5px] font-medium text-text-secondary">
            <span className="font-bold text-text-primary">
              Ninguno coincidió por username ni por correo
            </span>
            , que son los únicos datos con los que UBITS identifica a una persona. Los
            encontramos por nombre, documento o teléfono, así que confirma de quién se trata.
          </p>
        </div>
      )}

      {/*
        Said once for the tab, exactly like "Posible alineación" above.

        Every card here is the same situation — an identifier UBITS does not
        know — so repeating the sentence inside each one added a paragraph per
        user that said nothing the tab title did not already say, and pushed the
        identifier and its picker further down the card. The identifier itself
        is already in the header field; what needs explaining is only what to do
        about it, and that is common to all of them.
      */}
      {tab === "sinAlinear" && visibleGroups.length > 0 && (
        <div className="shrink-0 flex items-start gap-2 px-3 py-2.5 rounded-xl border border-primary/25 bg-primary/[0.05]">
          <UserRoundSearch
            className="h-3.5 w-3.5 mt-px shrink-0 text-primary"
            strokeWidth={2.5}
          />
          <p className="text-[11.5px] font-medium text-text-secondary">
            <span className="font-bold text-text-primary">
              Falta decir de quién son estos objetivos
            </span>
            : ningún usuario de UBITS coincide con estos identificadores. Abre{" "}
            <span className="font-bold">Selecciona un usuario</span> en cada tarjeta para
            elegirlo.
          </p>
        </div>
      )}

      {visibleGroups.length === 0 ? (
        /*
          Three different nothings, and they need different words.

          A tab that is empty because the work is done is good news and says so
          with a tick. A tab that is empty because the filters hid everything is
          the reviewer's own doing and offers the way back. And "Alineados" empty
          is neither — it means nothing can load yet, which is the one case worth
          a warning rather than a reassurance.
        */
        <div className="shrink-0 rounded-xl border border-border/60 bg-surface px-4 py-12 text-center">
          <span
            className={cn(
              "inline-flex h-10 w-10 items-center justify-center rounded-xl mb-3",
              hasFilters
                ? "bg-surface-muted text-text-secondary/50"
                : tab === "alineados"
                  ? "bg-status-warning/10 text-status-warning"
                  : "bg-status-positive/10 text-status-positive"
            )}
          >
            {hasFilters ? (
              <SearchX className="h-5 w-5" strokeWidth={2} />
            ) : tab === "alineados" ? (
              <AlertTriangle className="h-5 w-5" strokeWidth={2} />
            ) : (
              <CircleCheck className="h-5 w-5" strokeWidth={2} />
            )}
          </span>

          <p className="text-[13px] font-bold text-text-primary">
            {hasFilters ? "Ningún objetivo coincide" : TAB_META[tab].emptyTitle}
          </p>
          <p className="mt-1 mx-auto max-w-[420px] text-[11.5px] font-medium text-text-secondary/60">
            {hasFilters
              ? "Ajusta la búsqueda o los filtros para volver a ver los objetivos del archivo."
              : TAB_META[tab].empty}
          </p>

          {hasFilters && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="mt-3 h-8 px-3 text-[11px] font-bold rounded-lg"
            >
              Limpiar búsqueda y filtros
            </Button>
          )}
        </div>
      ) : (
        /* One scroller for every card, so they pan together and their columns
           stay visually aligned. Per-card scrollers would drift apart.

           It scrolls in both axes and it is the only thing in the review that
           scrolls at all: sideways for the eleven columns, downwards for the
           users, with the tabs and toolbar held above it. */
        <div className="flex-1 min-h-0 overflow-auto pb-0.5">
          {/* 1020px of columns plus the 12px the tables are inset on each side.
              Without the extra 24px the fixed layout would compress the columns
              to fit and the cards would stop lining up with each other — so this
              has to be kept in step with the colgroup above. */}
          <div className="min-w-[1044px] space-y-3">
            {visibleGroups.map(({ group, objectives }) => {
              const isCollapsed = collapsed.has(group.identifier);
              const visibleIds = objectives.map((objective) => objective.id);
              const displayName = groupDisplayName(group);

              /**
               * While nobody owns these objectives, the card reports nothing
               * about their data.
               *
               * One card, one job. A user this file names but UBITS does not
               * have needs a person picked; the state of their weights is a
               * question for after that, and answering both at once was what
               * made the old error tab unreadable. Nothing is lost by waiting —
               * picking the user re-runs every rule and drops the card into
               * "Con errores" if the numbers are wrong, or into "Alineados" if
               * they are not.
               */
              const isAwaitingUser = group.matchStatus === "unmatched";

              // Measured over the whole group, never over the filtered subset:
              // the 100% rule is about everything the person carries — the
              // objectives they already had included — and a filter hiding two
              // rows must not make the total look wrong.
              // Silent on a progress load for the same reason the header's
              // weight chip is: that load moves no weight, so every verdict this
              // sentence could reach is about something it did not cause.
              const weightNotice =
                isAwaitingUser || isProgressLoad ? null : describeGroupWeight(group);
              // Both halves of the card get their weight cells outlined, because
              // the number that has to move can be on either side. Only an
              // excess earns the outline — falling short is not a mistake, so
              // marking every weight cell over it would flag numbers that are
              // not actually wrong.
              const isWeightOverTotal = weightNotice !== null && weightNotice.tone === "error";
              /** This user came with objectives of their own, so the card has two halves. */
              const hasSaved = group.existing.length > 0;
              /** Objectives a row of the file is rewriting — never listed on their own. */
              const targetedIds = groupTargetedIds(group);
              const untouched = groupUntouchedObjectives(group);
              const isDuplicate =
                group.matchedUser !== undefined &&
                duplicateUsernames.has(group.matchedUser.username);

              // Which half of this card, if either, holds the open question.
              // Everything that is not it stops responding, at whatever
              // granularity keeps the question and its subject on screen
              // together: the card the row belongs to stays lit, its own
              // header does not.
              const isConfirmingThisGroup =
                pendingDelete?.kind === "group" &&
                pendingDelete.identifier === group.identifier;
              const isConfirmingRowHere =
                pendingDelete?.kind === "row" &&
                objectives.some((objective) => objective.id === pendingDelete.id);
              const mergeQuestion =
                pendingDelete?.kind === "merge" && pendingDelete.identifier === group.identifier
                  ? {
                      user: pendingDelete.user,
                      target: groups.find(
                        (candidate) => candidate.identifier === pendingDelete.targetIdentifier
                      )!,
                    }
                  : undefined;
              const isCardIdle =
                isConfirming &&
                !isConfirmingThisGroup &&
                !isConfirmingRowHere &&
                mergeQuestion === undefined;

              // The card border stays neutral in every state. Tinting the whole
              // container made a tab of unconfirmed users read as one solid block
              // of colour, which buried the one chip that actually says what to
              // do. Colour belongs on the offending field, chip or message —
              // never on the frame around them.
              return (
                <section
                  key={group.identifier}
                  inert={isCardIdle || undefined}
                  className={cn(
                    "rounded-xl border border-border/60 bg-surface overflow-hidden transition-opacity",
                    isCardIdle && "opacity-50"
                  )}
                >
                  {/* Frozen while one of this card's own rows is the question,
                      so the card stays readable but its controls cannot move
                      the ground under the answer. */}
                  <div
                    inert={isConfirmingRowHere || undefined}
                    className={cn("transition-opacity", isConfirmingRowHere && "opacity-50")}
                  >
                    <ObjectiveGroupHeader
                      group={group}
                      visibleObjectives={objectives}
                      candidates={candidates}
                      isDuplicate={isDuplicate}
                      isCollapsed={isCollapsed}
                      onToggle={() => toggleGroup(group.identifier)}
                      onAssignUser={(user) => onAssignUser(group.identifier, user)}
                      onConfirmReady={() => onConfirmReady(group.identifier)}
                      isConfirmingDelete={isConfirmingThisGroup}
                      onRequestDelete={() =>
                        setPendingDelete({ kind: "group", identifier: group.identifier })
                      }
                      onCancelDelete={cancelDelete}
                      onDeleteVisible={() => {
                        setPendingDelete(null);
                        onDeleteMany(visibleIds);
                      }}
                      showConfirm={bucketForGroup(group) !== "alineados"}
                      findGroupFor={(username) => findGroupFor(group.identifier, username)}
                      mergeQuestion={mergeQuestion}
                      onRequestMerge={(user, target) =>
                        setPendingDelete({
                          kind: "merge",
                          identifier: group.identifier,
                          user,
                          targetIdentifier: target.identifier,
                        })
                      }
                      onCancelMerge={cancelDelete}
                      onMerge={() => {
                        setPendingDelete(null);
                        onMergeGroups?.(group.identifier, mergeQuestion!.target.identifier);
                      }}
                    />
                  </div>

                  {/*
                    The proposal has no banner of its own any more.

                    It used to get a row below the header holding the candidate,
                    their attributes and a "Sí, es / No" pair. Three problems in
                    one: it doubled the height of every card in the tab, the two
                    bare answers read as a quiz rather than as an action, and it
                    asked about a person whose name was nowhere near the field
                    that actually holds the identity. All of it now lives in the
                    header — the proposed name in the field, their data in its
                    tooltip, and a single "Confirmar" beside the other actions.

                    The "sin alinear" notice moved out too, up to the top of the
                    tab: it says the same thing on every card there, so it is a
                    property of the tab rather than of any one user.
                  */}

                  {/* How this user's weights add up. Said once for the card,
                      because no single row is the one at fault — the outlined
                      weight cells below point at the numbers that can move, and
                      this says how far they have to move.

                      Three tones, because a card that carries objectives from
                      UBITS has three things worth saying and only one of them is
                      an error: the total is over (red, blocking), short (amber,
                      blocking but not alarming) or exactly right (neutral, and
                      worth stating — "ya tenía 60% y el archivo trae 40%" is the
                      whole reason the numbers on this card do not look like the
                      numbers on any other).

                      Only while the card is open. It talks about rows ("reparte
                      20% menos entre sus 2 objetivos") and points at the
                      outlined weight cells, so on a collapsed card it is
                      instructions for something not on screen — and a tab of
                      closed cards became a stack of red paragraphs. The header's
                      own weight chip already flags the total when closed. */}
                  {weightNotice && !isCollapsed && (
                    <div
                      inert={isConfirmingRowHere || undefined}
                      className={cn(
                        "px-3 py-2.5 transition-opacity",
                        isConfirmingRowHere && "opacity-50"
                      )}
                    >
                      <div
                        className={cn(
                          "flex items-start gap-2 px-2.5 py-2 rounded-lg border",
                          weightNotice.tone === "error" &&
                            "bg-status-negative/[0.05] border-status-negative/20",
                          weightNotice.tone === "warning" &&
                            "bg-status-warning/[0.06] border-status-warning/25",
                          weightNotice.tone === "info" &&
                            "bg-surface-muted/60 border-border/50"
                        )}
                      >
                        {weightNotice.tone === "info" ? (
                          <CircleCheck
                            className="h-3.5 w-3.5 mt-px shrink-0 text-text-secondary/50"
                            strokeWidth={2.5}
                          />
                        ) : (
                          <AlertTriangle
                            className={cn(
                              "h-3.5 w-3.5 mt-px shrink-0",
                              weightNotice.tone === "error"
                                ? "text-status-negative"
                                : "text-status-warning"
                            )}
                            strokeWidth={2.5}
                          />
                        )}
                        <p className="text-[11.5px] font-medium text-text-secondary">
                          <span
                            className={cn(
                              "font-bold",
                              weightNotice.tone === "error" && "text-status-negative",
                              weightNotice.tone === "warning" && "text-status-warning",
                              weightNotice.tone === "info" && "text-text-primary"
                            )}
                          >
                            {weightNotice.headline}
                          </span>{" "}
                          {weightNotice.detail}
                        </p>
                      </div>
                    </div>
                  )}

                  {/*
                    The table is inset, not bled to the card's edges.

                    A 12px rounded corner cuts visibly into anything that runs
                    flush against it, so the first column and the delete button
                    of the last row ended up sitting inside the curve while the
                    collapsed header above them kept a comfortable margin. The
                    padding here is the same `px-3` the header uses, so open and
                    closed cards share one left edge, and the row rules become
                    inset lines instead of chords across the corner.
                  */}
                  {!isCollapsed && (
                    <div
                      className="px-3 pt-2 pb-2.5"
                      inert={isConfirmingThisGroup || undefined}
                    >
                      <table className="w-full table-fixed border-collapse text-left">
                        <caption className="sr-only">
                          {isProgressLoad
                            ? `Avances de ${displayName}: las ${objectives.length} filas del archivo, con el objetivo de UBITS al que cada una reporta y el avance que registrará.`
                            : isEditLoad
                              ? `Objetivos de ${displayName}: las ${objectives.length} filas del archivo y los ${untouched.length} que el archivo no cambia, con el objetivo de UBITS que cada fila reescribe.`
                              : hasSaved
                                ? `Objetivos de ${displayName}: los ${untouched.length} que ya tiene en el ciclo y los ${objectives.length} del archivo, todos editables antes de cargar.`
                                : `Objetivos de ${displayName} detectados en el archivo, editables antes de cargarlos.`}
                        </caption>
                        <TableColumns isProgressLoad={isProgressLoad} />
                        {/* Each card carries its own header now that they are
                            detached: a single header floating above separated
                            cards would leave the lower ones unlabelled. The shared
                            colgroup is what keeps the columns aligned between
                            cards. */}
                        <thead>
                          <tr className="text-[10px] font-bold uppercase tracking-wider text-text-secondary/40 border-b border-border/40">
                            <th scope="col" className="pl-3 pr-1 py-1.5 text-right" title="Fila en el archivo">
                              #
                            </th>
                            <th scope="col" className="px-2 py-1.5">Objetivo</th>
                            <th scope="col" className="px-2 py-1.5">Medida</th>
                            <th scope="col" className="px-2 py-1.5">Dirección</th>
                            <th scope="col" className="px-2 py-1.5 text-right">Inicial</th>
                            <th scope="col" className="px-2 py-1.5 text-right">Meta</th>
                            {isProgressLoad ? (
                              <>
                                {/* The two that matter here, side by side and in
                                    that order: what UBITS has, and what replaces
                                    it. Reading one against the other is the whole
                                    review on this kind of load. */}
                                <th scope="col" className="px-2 py-1.5 text-right">
                                  Avance actual
                                </th>
                                <th scope="col" className="px-2 py-1.5 text-right">
                                  Nuevo avance
                                </th>
                                <th
                                  scope="col"
                                  className="px-2 py-1.5 text-right"
                                  title="Cumplimiento que quedará registrado con el nuevo avance"
                                >
                                  Cumplimiento
                                </th>
                              </>
                            ) : (
                              <>
                                <th scope="col" className="px-2 py-1.5 text-right">Mínimo</th>
                                <th scope="col" className="px-2 py-1.5 text-right">Máximo</th>
                                <th scope="col" className="px-2 py-1.5 text-right">Peso</th>
                              </>
                            )}
                            <th scope="col" className="px-2 py-1.5 text-center">
                              <span className="sr-only">Acciones</span>
                            </th>
                          </tr>
                        </thead>
                        {/*
                          One list, and the chips do the sorting.

                          There used to be labelled sections here — "Del archivo" and
                          "No los toca el archivo" — which split what is really one
                          set: everything this person will be carrying when the load
                          finishes. Two headings for that made the card read as two
                          tables whose weights had to be added by hand, and on an
                          edit load the split was arbitrary anyway, since a row that
                          rewrites an objective and the objective it rewrites are the
                          same thing seen twice. The per-row chip says which is which
                          and never scrolls away from the row it describes.

                          The file's rows come first because that is where the work
                          is; the untouched ones follow as the weight left over.
                        */}
                        <tbody>
                          {objectives.map((objective, indexInSection) => (
                            <ObjectiveReviewRow
                              key={objective.id}
                              objective={objective}
                              index={indexInSection + 1}
                              columnCount={columnCount}
                              isProgressLoad={isProgressLoad}
                              isEditLoad={isEditLoad}
                              linkCandidates={group.existing}
                              takenLinkIds={targetedIds}
                              onRelink={
                                onRelinkObjective
                                  ? (targetId) => onRelinkObjective(objective.id, targetId)
                                  : undefined
                              }
                              rulesVisible={!isAwaitingUser}
                              isWeightOverTotal={isWeightOverTotal}
                              onChange={(patch) => onChange(objective.id, patch)}
                              removal={{
                                isConfirming:
                                  pendingDelete?.kind === "row" &&
                                  pendingDelete.id === objective.id,
                                onRequest: () =>
                                  setPendingDelete({ kind: "row", id: objective.id }),
                                onConfirm: () => {
                                  setPendingDelete(null);
                                  onDelete(objective.id);
                                },
                                onCancel: cancelDelete,
                              }}
                              isIdle={isConfirmingRowHere}
                            />
                          ))}

                          {/* Only what the file leaves alone. An objective a row is
                              rewriting is already on screen as that row, and listing
                              it twice would double it in the reader's head exactly as
                              it would in the total.

                              A progress load lists none of them. There they are not
                              leftover weight to account for — that load moves no
                              weight — they are simply objectives nobody reported on,
                              and every column this table shows would be blank for
                              them. The card header still counts them, which is the
                              form the question "¿me faltó reportar alguno?" actually
                              takes. */}
                          {(isProgressLoad ? [] : untouched).map((objective, indexInSection) => (
                            <ObjectiveReviewRow
                              key={objective.id}
                              objective={objective}
                              index={objectives.length + indexInSection + 1}
                              columnCount={columnCount}
                              isProgressLoad={isProgressLoad}
                              isEditLoad={isEditLoad}
                              rulesVisible={!isAwaitingUser}
                              isWeightOverTotal={isWeightOverTotal}
                              onChange={(patch) => onChange(objective.id, patch)}
                              // No `removal`: these are not in the load, so there is
                              // nothing to take out of it.
                              isIdle={isConfirmingRowHere}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
