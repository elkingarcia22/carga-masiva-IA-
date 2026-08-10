import * as React from "react";
import {
  AlertTriangle,
  CircleCheck,
  Equal,
  FilePlus2,
  HelpCircle,
  Info,
  PencilLine,
  Trash2,
  Undo2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ObjectiveMatchPicker } from "./ObjectiveMatchPicker";
import {
  MEASURE_SYMBOL,
  MEASURE_TYPES,
  TRENDS,
  computeCompliance,
  hasSavedEdits,
  toNumber,
  validateObjective,
  validateProgressUpdate,
  type MeasureType,
  type ObjectiveField,
  type ParsedObjective,
  type RuleViolation,
  type Trend,
} from "@/lib/objectivesImport";

/**
 * One objective in the review, editable in place.
 *
 * The same row serves both kinds the card can hold — a line the file is about
 * to create, and an objective the user already has in UBITS — because they are
 * the same object with the same rules, and a reviewer freeing up weight moves
 * between them constantly. Only three things differ, and each is derived from
 * the row itself rather than from a mode flag:
 *
 *  - A saved objective cannot be "removed from the load": it is not in the load.
 *    Its actions cell offers to undo an adjustment instead.
 *  - It carries a chip saying whether it is untouched or about to be updated,
 *    which is the only way the reviewer can tell that lowering a weight here
 *    writes back to UBITS.
 *  - It sits on a faint surface, so the two halves of a mixed card read as two
 *    groups without a second table or a second header.
 *
 * Two decisions carried over from the table this used to live in, both aimed at
 * reading as data rather than as a 130-field form: cells are quiet — a border
 * and a surface only appear on hover and focus — and colour marks exceptions
 * only.
 */

/** Fields a rule can point at, so the offending input can be outlined. */
type ViolationsByField = Partial<Record<ObjectiveField, RuleViolation[]>>;

function groupViolations(violations: RuleViolation[]): ViolationsByField {
  return violations.reduce<ViolationsByField>((grouped, violation) => {
    const existing = grouped[violation.field] ?? [];
    return { ...grouped, [violation.field]: [...existing, violation] };
  }, {});
}

/** Title length UBITS accepts. Only surfaced when a row gets close to it. */
const TITLE_LIMIT = 150;
const TITLE_WARN_AT = 130;

/**
 * The badge under a row's name, saying what the row is and what loading it does.
 *
 * White, except for the one that is a pending question: "Por confirmar" is the
 * only outcome that still needs the reviewer to act, so it is the only one that
 * keeps the amber. The name control above it stays as quiet as every other row's —
 * the card already sits in "Con errores" until the question is settled, and
 * outlining both the badge and the field it belongs to said the same thing twice.
 *
 * The icon is required rather than optional for the same reason: what separates
 * these six is a glyph each, so a badge without one reads as a different kind of
 * thing from its neighbours instead of another value of the same field.
 */
interface ObjectiveRowChip {
  label: string;
  /** The sentence behind the label, including whatever the label had no room for. */
  hint: string;
  icon: React.ReactNode;
  /**
   * "Por confirmar" is the one open question left on the row, so it is the one
   * chip that still gets colour — every other outcome is a settled fact, even
   * the ones that block. A row pointing at no objective is an error, but it is
   * an error the row states in red underneath like every other error in this
   * table; painting the chip too would be the same fact in two places and a
   * third chip colour the other two operations never show.
   */
  tone?: "warning";
}

/**
 * Editable cell at rest: no border, no fill. The control reveals itself on
 * hover and commits to a surface on focus.
 */
const QUIET_CELL =
  "w-full h-7 px-1.5 rounded-md border border-transparent bg-transparent text-[12px] " +
  "text-text-primary transition-colors hover:border-border/50 hover:bg-surface " +
  "focus:outline-none focus:bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20";

/**
 * Stand-in violation used to outline the weight cells of a user whose weights
 * add up to more than 100%.
 *
 * Falling short never reaches this: under 100% is not a rule UBITS rejects, so
 * marking those cells the same way would flag numbers that are not actually
 * wrong. The gap belongs to the set, not to any one row, so it never comes back
 * from `validateObjective`. Marking the cells is still right — those are the
 * numbers to change — but the sentence explaining it is printed once for the
 * whole card, which is why this carries no message of its own.
 */
const WEIGHT_TOTAL_MARK: RuleViolation = {
  rule: "PESO_TOTAL",
  field: "weightPercent",
  message: "",
  severity: "error",
};

/** A cell the rules flagged keeps its outline at rest — that is the exception. */
function fieldStateClass(violations: RuleViolation[] | undefined): string {
  if (!violations || violations.length === 0) return "";
  return violations.some((violation) => violation.severity === "error")
    ? "border-status-negative/60 bg-status-negative/5 hover:border-status-negative"
    : "border-status-warning/60 bg-status-warning/5 hover:border-status-warning";
}

interface NumberCellProps {
  value: number | null;
  onChange: (next: number | null) => void;
  /** When false, clearing the field yields NaN so validation flags it. */
  allowEmpty?: boolean;
  ariaLabel: string;
  violations?: RuleViolation[];
}

/**
 * Numeric cell that keeps a local draft while focused.
 *
 * Without the draft, typing "-" or "1," would be parsed, rejected and echoed
 * back, so the field would fight the user mid-number.
 */
const NumberCell: React.FC<NumberCellProps> = ({
  value,
  onChange,
  allowEmpty = true,
  ariaLabel,
  violations,
}) => {
  const [draft, setDraft] = React.useState<string | null>(null);

  const canonical = value === null || Number.isNaN(value) ? "" : String(value);
  const display = draft ?? canonical;

  return (
    <input
      type="text"
      inputMode="decimal"
      aria-label={ariaLabel}
      value={display}
      placeholder="—"
      onChange={(event) => {
        const raw = event.target.value;
        setDraft(raw);
        if (raw.trim() === "") {
          onChange(allowEmpty ? null : NaN);
          return;
        }
        onChange(toNumber(raw) ?? NaN);
      }}
      onBlur={() => setDraft(null)}
      className={cn(
        QUIET_CELL,
        "text-right tabular-nums placeholder:text-text-secondary/30",
        fieldStateClass(violations)
      )}
    />
  );
};

interface QuietSelectProps<T extends string> {
  value: T;
  options: readonly T[];
  onChange: (next: T) => void;
  ariaLabel: string;
  violations?: RuleViolation[];
  renderOption: (option: T) => string;
}

/**
 * The design system's Select, shrunk to cell size.
 *
 * These were native `<select>` elements, on the theory that a portalled
 * dropdown per row would fight the drawer's scroll. It does not — Radix repins
 * on scroll — and the cost of the shortcut was that every measure and direction
 * cell rendered the operating system's own list: system fonts, system
 * highlight, no tokens, and a different look on every machine the demo ran on.
 * A control the reviewer touches on every row is not the place to hand the
 * rendering to the OS.
 */
function QuietSelect<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  violations,
  renderOption,
}: QuietSelectProps<T>) {
  return (
    <Select value={value} onValueChange={(next) => onChange(next as T)}>
      <SelectTrigger
        aria-label={ariaLabel}
        // The full name, for whatever the column is too narrow to finish showing.
        title={renderOption(value)}
        // Same quiet-at-rest treatment as the text cells beside it: the border
        // and surface only appear on hover and focus.
        className={cn(
          "h-7 w-full gap-1 px-1.5 rounded-md border border-transparent bg-transparent dark:bg-transparent",
          "text-[12px] text-text-primary transition-colors cursor-pointer",
          "hover:border-border/50 hover:bg-surface",
          "focus:bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20",
          "[&>svg]:size-3 [&>svg]:shrink-0 [&>svg]:text-text-secondary/40",
          /*
            Let the label shrink instead of shoving the chevron.

            The shared trigger is `flex justify-between` with `line-clamp-1` on the
            value, which clips overflow but does not make the value a shrinkable
            flex item — so a long label grew to its full width, pushed right up
            against the chevron and ellipsed there. Every control was the same
            width, yet the row with the long value read as misaligned because its
            text had no margin where every other row had 60-85px of it.

            `flex-1 min-w-0` is what makes it yield; `truncate` puts the ellipsis
            where the box actually ends; and `gap-1` above guarantees the text can
            never touch the chevron even at the exact width where it wraps.

            With that in place the long value can simply be shown in full and cut
            where it runs out of room. Abbreviating it instead — "Se cumple" for
            "Se cumple / No se cumple" — did keep every cell tidy, but it hid the
            half of the name that says what the other outcome is, to save a few
            pixels the column can afford to give.
          */
          "[&>span]:flex-1 [&>span]:min-w-0 [&>span]:truncate [&>span]:text-left",
          fieldStateClass(violations)
        )}
      >
        <SelectValue>{renderOption(value)}</SelectValue>
      </SelectTrigger>
      <SelectContent position="popper" align="start" className="min-w-[--radix-select-trigger-width]">
        {options.map((option) => (
          <SelectItem key={option} value={option} className="text-[12px]">
            {renderOption(option)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * A value the load can read but not write.
 *
 * Identical to `QUIET_CELL` at rest — same height, padding, size and colour —
 * and that is the whole point: a progress row has to read as the same table as
 * a create or edit row, not as a greyed-out version of one. The only thing it
 * lacks is what a quiet cell only shows on hover anyway, so the difference
 * surfaces exactly when the reviewer reaches for it and never before.
 */
const ReadOnlyCell: React.FC<{
  children: React.ReactNode;
  align?: "left" | "right";
  title?: string;
}> = ({ children, align = "left", title }) => (
  <span
    title={title}
    className={cn(
      "block h-7 px-1.5 leading-7 text-[12px] text-text-primary truncate",
      align === "right" && "text-right tabular-nums"
    )}
  >
    {children}
  </span>
);

/** A number as the table shows it, with an em dash standing in for "no hay". */
function formatValue(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "—";
  return String(value);
}

/**
 * What the new progress will actually score.
 *
 * The reason the reviewer is reading this table at all: a raw number means
 * nothing on its own — 38 against a target of 40 is either 95% or 0%, depending
 * on a minimum three columns to the left — and doing that arithmetic forty times
 * by hand is exactly what a bulk load is supposed to avoid.
 *
 * Rendered as plainly as every other number here. Colouring the zero red and
 * the hundred green was tempting and wrong: in this table colour marks
 * exceptions, a full 100% is not one, and the zero already has an amber R4
 * message under the row saying why it is a zero. Two tellings of one fact, in
 * a palette the other two operations never use.
 */
const ComplianceCell: React.FC<{ objective: ParsedObjective }> = ({ objective }) => {
  const { newProgress } = objective;

  if (newProgress === null || newProgress === undefined || !Number.isFinite(newProgress)) {
    return <ReadOnlyCell align="right">—</ReadOnlyCell>;
  }

  const compliance = computeCompliance({
    trend: objective.trend,
    initialValue: objective.initialValue,
    target: objective.target,
    minProgress: objective.minProgress,
    maxProgress: objective.maxProgress,
    progress: newProgress,
  });

  return <ReadOnlyCell align="right">{Math.round(compliance * 10) / 10}%</ReadOnlyCell>;
};

export interface ObjectiveReviewRowProps {
  objective: ParsedObjective;
  /** 1-based position within its own half of the card. */
  index: number;
  columnCount: number;
  /**
   * True on an "actualizar" load, where the row shows the objective as UBITS
   * has it and offers exactly one editable cell: the progress to record.
   */
  isProgressLoad: boolean;
  /**
   * True on an edit load.
   *
   * Passed rather than derived from `objective.link`, because the rows that have
   * no link are exactly the ones that need it: an existing objective the file does
   * not touch has to say "Sin cambios", and it can only know that is the right
   * words if it knows the file was an edit file at all.
   */
  isEditLoad: boolean;
  /** What an edit row can be pointed at: the user's objectives in this cycle. */
  linkCandidates?: ParsedObjective[];
  /** Objectives other rows are already rewriting, so this one cannot take them. */
  takenLinkIds?: ReadonlySet<string>;
  /** Points this row at another objective, or at none (`null` — create it new). */
  onRelink?: (targetId: string | null) => void;
  /**
   * Whether this card reports rule violations yet.
   *
   * False while nobody owns the objectives: that card is asking who they belong
   * to, and answering a second question at the same time is what made the old
   * error tab unreadable. Picking a user turns it on and re-files the card.
   */
  rulesVisible: boolean;
  /** True when the user's weights add up to more than 100%, so every weight cell is outlined. */
  isWeightOverTotal: boolean;
  onChange: (patch: Partial<ParsedObjective>) => void;
  /**
   * Everything about taking this row out of the load — absent, as a whole, on
   * objectives that already exist in UBITS.
   *
   * One optional group rather than four loose props, because they are only ever
   * meaningful together: a row that cannot be removed has no button, and can
   * never be the row being asked about. Deleting an objective UBITS already has
   * is a different action on a different screen.
   */
  removal?: {
    isConfirming: boolean;
    onRequest: () => void;
    onConfirm: () => void;
    onCancel: () => void;
  };
  /** Frozen and dimmed because another row of this card holds the open question. */
  isIdle: boolean;
}

export const ObjectiveReviewRow: React.FC<ObjectiveReviewRowProps> = ({
  objective,
  index,
  columnCount,
  isProgressLoad,
  isEditLoad,
  linkCandidates = [],
  takenLinkIds,
  onRelink,
  rulesVisible,
  isWeightOverTotal,
  onChange,
  removal,
  isIdle,
}) => {
  const isSaved = objective.saved !== undefined;
  const isAdjusted = hasSavedEdits(objective);
  /**
   * Whether this row knows which objective it is about.
   *
   * On a progress load it gates most of the row: until the link resolves, the
   * objective's own fields have not been copied in yet and anything shown in
   * their place would be the file's unverified echo.
   */
  const hasTarget = objective.link?.targetId !== undefined;

  /*
    A progress row is judged on the number it came to write, and on nothing
    else — see `validateProgressUpdate`. Running the definition rules over it
    would report on an objective UBITS already accepted and this load cannot
    change, which is somebody else's problem shown on the wrong screen.
  */
  const violations = !rulesVisible
    ? []
    : isProgressLoad
      ? validateProgressUpdate(objective)
      : validateObjective(objective);
  const byField = groupViolations(violations);
  const nearTitleLimit = rulesVisible && objective.title.length >= TITLE_WARN_AT;

  /**
   * The one badge that says what this row is and what loading it will do.
   *
   * The outcomes across the three kinds of load collapse into one slot because
   * the reader only ever needs the answer for the row in front of them:
   *
   *   edit load, row rewrites something   → "Con cambios"
   *   edit load, row rewrites nothing     → "Se creará nuevo"
   *   edit load, proposal unconfirmed     → "Por confirmar"
   *   edit load, objective left alone     → "Sin cambios", or "Con cambios" once
   *                                         a reviewer adjusts it by hand
   *   create load, objective already there → "Ya en UBITS" / "Se actualizará"
   *   create load, row from the file       → nothing. Everything is new there, and
   *                                          a badge true of every row says nothing
   *                                          about any of them.
   *   progress load, objective found       → nothing, for that same reason: every
   *                                          row that works looks like this one.
   *   progress load, proposal unconfirmed  → "Por confirmar"
   *   progress load, nothing found         → "No existe en UBITS", and in red. It
   *                                          is the one place the three loads
   *                                          genuinely disagree: creating what is
   *                                          missing is the sensible default for
   *                                          the other two and impossible here,
   *                                          because there is no objective to
   *                                          report progress against.
   */
  const targetTitle = objective.link?.targetId
    ? linkCandidates.find((candidate) => candidate.id === objective.link?.targetId)?.title
    : undefined;

  const chip: ObjectiveRowChip | null = isProgressLoad
    ? objective.link?.status === "possible"
      ? {
          label: "Por confirmar",
          hint:
            objective.link.reason ??
            "Solo pudimos proponer a qué objetivo corresponde. Ábrelo para confirmarlo.",
          icon: <HelpCircle className="h-2.5 w-2.5" strokeWidth={2.5} />,
          tone: "warning",
        }
      : targetTitle !== undefined
        ? null
        : {
            label: "No existe en UBITS",
            hint: `Ningún objetivo de esta persona se llama “${objective.link?.lookupTitle ?? objective.title}”. No se puede registrar avance sobre un objetivo que no existe: ábrelo y elige a cuál corresponde, o quita la fila.`,
            icon: <AlertTriangle className="h-2.5 w-2.5" strokeWidth={2.5} />,
          }
    : objective.link
      ? objective.link.status === "possible"
        ? {
            label: "Por confirmar",
            hint:
              objective.link.reason ??
              "Solo pudimos proponer a qué objetivo corresponde. Ábrelo para confirmarlo.",
            icon: <HelpCircle className="h-2.5 w-2.5" strokeWidth={2.5} />,
            tone: "warning",
          }
        : targetTitle !== undefined
          ? {
              label: "Con cambios",
              hint: `Reescribe “${targetTitle}” en UBITS con los valores de esta fila.`,
              icon: <PencilLine className="h-2.5 w-2.5" strokeWidth={2.5} />,
            }
          : {
              label: "Nuevo objetivo",
              hint: `“${objective.link.lookupTitle}” no existe en UBITS, así que esta fila lo creará. Ábrelo para asociarlo a uno que ya exista.`,
              icon: <FilePlus2 className="h-2.5 w-2.5" strokeWidth={2.5} />,
            }
      : !isSaved
        ? null
        : isEditLoad
          ? isAdjusted
            ? {
                label: "Con cambios",
                hint: "Ninguna fila del archivo lo toca, pero lo estás ajustando a mano: al cargar se actualizará.",
                icon: <PencilLine className="h-2.5 w-2.5" strokeWidth={2.5} />,
              }
            : {
                label: "Sin cambios",
                hint: "Ninguna fila del archivo lo toca. Se queda como está, pero cuenta para el 100%.",
                icon: <Equal className="h-2.5 w-2.5" strokeWidth={2.5} />,
              }
          : isAdjusted
            ? {
                label: "Se actualizará",
                hint: "Ya existe en UBITS y lo estás ajustando: al cargar se actualizará con estos valores.",
                icon: <PencilLine className="h-2.5 w-2.5" strokeWidth={2.5} />,
              }
            : {
                label: "Ya en UBITS",
                hint: "Este objetivo ya existe en UBITS. No se va a crear de nuevo; solo se actualizará si lo ajustas.",
                icon: <CircleCheck className="h-2.5 w-2.5" strokeWidth={2.5} />,
              };

  /*
    Asking to remove one objective swaps the row for the question, the same way
    asking to remove a user swaps the header's chips for it.

    The row used to answer with a red tick and a cross in the actions cell,
    which nobody could read: two bare glyphs where one means "delete" and the
    other means "don't" is a coin toss, and the destructive one was the one that
    looked like approval. Words are the fix, and the row's title travels inside
    the question so it still says what is being removed.
  */
  if (removal?.isConfirming) {
    return (
      <tr className="border-t border-border/25 first:border-t-0 bg-status-negative/[0.06]">
        <td className="pl-3 pr-1 py-2 text-right align-middle">
          <span className="text-[10px] font-medium text-text-secondary/35 tabular-nums">
            {index}
          </span>
        </td>
        <td colSpan={columnCount - 1} className="px-2 py-2 align-middle">
          <div className="flex items-center gap-2">
            <span className="text-[11.5px] font-bold text-status-negative min-w-0 truncate">
              ¿Quitar “
              {objective.title.trim() === "" ? "este objetivo" : objective.title}” de la carga?
            </span>
            <div className="flex items-center gap-2 ml-auto shrink-0">
              <Button
                type="button"
                size="sm"
                autoFocus
                onClick={removal.onConfirm}
                className="h-7 px-2.5 text-[11px] font-bold gap-1 bg-status-negative text-text-inverse hover:bg-status-negative/90"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
                Quitar
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={removal.onCancel}
                className="h-7 px-2 text-[11px] font-bold text-text-secondary/70 hover:text-text-primary"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <>
      {/*
        A row that breaks a rule stays a normal row.

        It used to get a tint and a left accent on top of the outlined field and
        the red message below it — four signals for one problem, which turned a
        card with two bad rows into a block of red and made the actual offending
        cell harder to find, not easier. Colour now marks only the field that is
        wrong and the sentence that explains it.

        The faint surface on a saved objective is the one exception, and it is
        not colour: it is what separates "what UBITS already has" from "what the
        file brings" inside a single table, so the section labels above them have
        something to label.
      */}
      <tr
        inert={isIdle || undefined}
        className={cn(
          // The header already draws a rule, so the first row must not add a
          // second one.
          "group border-t border-border/25 first:border-t-0 transition-opacity transition-colors",
          isSaved && "bg-surface-muted/40",
          isIdle ? "opacity-50" : isSaved ? "hover:bg-surface-muted/70" : "hover:bg-surface-muted/40"
        )}
      >
        <td className="pl-3 pr-1 py-1.5 text-right align-middle">
          {/* The objective's position within this half of the card, not its row
              in the spreadsheet: the card is scoped to one person, so a file row
              read as a jumbled sequence ("20, 21") with no meaning inside the
              card. The file row is still one hover away, which is all it is
              needed for — tracing a row back to the source. An objective already
              in UBITS has no file row to trace. */}
          <span
            className="text-[10px] font-medium text-text-secondary/35 tabular-nums"
            title={isSaved ? undefined : `Fila ${objective.sourceRow} del archivo`}
          >
            {index}
          </span>
        </td>

        {/* Title and description share a cell: they are one idea, and splitting
            them would cost a column the table cannot spare. */}
        <td className="px-2 py-1.5 align-middle">
          {/*
            On an edit row the name IS the control.

            Same principle as the user picker one cell to the left: reassigning is
            the main thing this step exists to do, so it happens where the reader's
            eye already is rather than in a column of its own. The trade-off is that
            an edit row's title cannot be retyped here — which is honest, because on
            an edit load the name is not free text, it is the answer to "which
            objective is this".
          */}
          {objective.link && onRelink ? (
            <ObjectiveMatchPicker
              title={objective.title}
              link={objective.link}
              candidates={linkCandidates}
              takenIds={takenLinkIds ?? new Set()}
              onChange={onRelink}
              // Nothing to search inside until the card has an owner.
              enabled={rulesVisible}
              allowCreateNew={!isProgressLoad}
            />
          ) : (
            <input
              type="text"
              aria-label={`Título del objetivo ${index}`}
              value={objective.title}
              maxLength={400}
              onChange={(event) => onChange({ title: event.target.value })}
              className={cn(QUIET_CELL, "font-semibold", fieldStateClass(byField.title))}
            />
          )}
          {/* `mt-1` is not decoration: the name above is a control with its own
              hover border, and with the two rows flush the badge read as part of
              that control rather than as a note about it. */}
          <div className="flex items-center gap-1.5 pl-1.5 mt-1">
            {/*
              What this row is, and what loading it will do.

              The whole second line now, and it used to share it with the
              objective's description. The description lost that argument: it is
              the one field on the row no rule looks at and no total depends on,
              and next to a state badge it read as competing with it rather than
              as an aside. It still loads exactly as the file wrote it — the
              review simply stopped showing it, which is the trade: nobody can
              proof-read a description here any more.

              This badge is also why the card needs no section headings. It used to
              be one of two things — "Ya en UBITS" or "Se actualizará" — which only
              answered the create load's question: is this new, or already there?
              An edit load asks a different one, because there everything is already
              there and what matters is whether the file *changes* it. Both
              vocabularies live here now, picked by which kind of load this is.

              It also carries the one fact the name above can no longer show: which
              objective a renaming row is rewriting. That goes in the tooltip, and
              in full in the picker's own panel.
            */}
            {chip && (
              <span
                className={cn(
                  "shrink-0 inline-flex items-center gap-1 pl-1.5 pr-2 py-0.5 rounded-full border text-[9.5px] font-bold whitespace-nowrap",
                  chip.tone === "warning"
                    ? "border-status-warning/60 bg-status-warning/10 text-status-warning"
                    : "border-border/60 bg-surface text-text-secondary/65"
                )}
                title={chip.hint}
              >
                {chip.icon}
                {chip.label}
              </span>
            )}

            {/* The counter is noise on a 40-character title; it only matters
                near the limit. */}
            {nearTitleLimit && (
              <span
                className={cn(
                  "text-[10px] font-bold tabular-nums shrink-0",
                  objective.title.length > TITLE_LIMIT
                    ? "text-status-negative"
                    : "text-status-warning"
                )}
              >
                {objective.title.length}/{TITLE_LIMIT}
              </span>
            )}
          </div>
        </td>

        {/*
          A progress load shows the objective, it does not offer it for editing.

          Measure, direction, initial value and target are how the new number is
          read — 38 means nothing without "meta 40, venía de 62" beside it — but
          none of them is this load's to change, and rendering them as live
          inputs would say otherwise. They are plain text here; the single
          editable cell is the one this operation exists for.
        */}
        {isProgressLoad ? (
          <>
            {/*
              Everything in these four columns belongs to the objective, so a row
              that has not found one has nothing true to put in them.

              It would be easy to fill them from the file's own echo, and wrong:
              those numbers are an unverified claim about an objective we could
              not locate, and the measure and direction would be worse still —
              the progress template does not carry them at all, so what would
              show up is the parser's fallback ("Numérico", "Aumentar") wearing
              the same typeface as a fact. A dash says the only true thing
              available, which is that the row has to be pointed at something
              first.
            */}
            <td className="px-2 py-1.5 align-middle">
              <ReadOnlyCell title={hasTarget ? objective.measureType : undefined}>
                {hasTarget
                  ? `${MEASURE_SYMBOL[objective.measureType]} ${objective.measureType}`
                  : "—"}
              </ReadOnlyCell>
            </td>

            <td className="px-2 py-1.5 align-middle">
              <ReadOnlyCell>
                {!hasTarget ? "—" : objective.trend === "Aumentar" ? "↗ Aumentar" : "↘ Reducir"}
              </ReadOnlyCell>
            </td>

            <td className="px-2 py-1.5 align-middle">
              <ReadOnlyCell align="right">
                {hasTarget ? formatValue(objective.initialValue) : "—"}
              </ReadOnlyCell>
            </td>

            <td className="px-2 py-1.5 align-middle">
              <ReadOnlyCell align="right">
                {hasTarget ? formatValue(objective.target) : "—"}
              </ReadOnlyCell>
            </td>

            <td className="px-2 py-1.5 align-middle">
              <ReadOnlyCell
                align="right"
                title={
                  objective.currentProgress === null || objective.currentProgress === undefined
                    ? "Nadie ha reportado avance sobre este objetivo todavía."
                    : "Avance registrado hoy en UBITS, que es lo que esta carga reemplaza."
                }
              >
                {formatValue(objective.currentProgress ?? null)}
              </ReadOnlyCell>
            </td>

            {/* The one cell this whole operation is about. */}
            <td className="px-2 py-1.5 align-middle">
              <NumberCell
                ariaLabel={`Nuevo avance del objetivo ${index}`}
                value={objective.newProgress ?? null}
                violations={byField.newProgress}
                allowEmpty={false}
                onChange={(next) => onChange({ newProgress: next })}
              />
            </td>

            <td className="px-2 py-1.5 align-middle">
              {hasTarget ? (
                <ComplianceCell objective={objective} />
              ) : (
                <ReadOnlyCell align="right">—</ReadOnlyCell>
              )}
            </td>
          </>
        ) : (
          <>
            <td className="px-2 py-1.5 align-middle">
              <QuietSelect
                ariaLabel={`Tipo de medida del objetivo ${index}`}
                value={objective.measureType}
                options={MEASURE_TYPES}
                violations={byField.measureType}
                onChange={(next: MeasureType) => onChange({ measureType: next })}
                renderOption={(type) => `${MEASURE_SYMBOL[type]} ${type}`}
              />
            </td>

            <td className="px-2 py-1.5 align-middle">
              <QuietSelect
                ariaLabel={`Dirección del objetivo ${index}`}
                value={objective.trend}
                options={TRENDS}
                violations={byField.trend}
                onChange={(next: Trend) => onChange({ trend: next })}
                renderOption={(trend) => (trend === "Aumentar" ? "↗ Aumentar" : "↘ Reducir")}
              />
            </td>

            <td className="px-2 py-1.5 align-middle">
              <NumberCell
                ariaLabel={`Valor inicial del objetivo ${index}`}
                value={objective.initialValue}
                violations={byField.initialValue}
                onChange={(next) => onChange({ initialValue: next })}
              />
            </td>

            <td className="px-2 py-1.5 align-middle">
              <NumberCell
                ariaLabel={`Meta del objetivo ${index}`}
                value={objective.target}
                violations={byField.target}
                allowEmpty={false}
                onChange={(next) => onChange({ target: next === null ? NaN : next })}
              />
            </td>

            <td className="px-2 py-1.5 align-middle">
              <NumberCell
                ariaLabel={`Mínimo de avance del objetivo ${index}`}
                value={objective.minProgress}
                violations={byField.minProgress}
                onChange={(next) => onChange({ minProgress: next })}
              />
            </td>

            <td className="px-2 py-1.5 align-middle">
              <NumberCell
                ariaLabel={`Máximo de avance del objetivo ${index}`}
                value={objective.maxProgress}
                violations={byField.maxProgress}
                onChange={(next) => onChange({ maxProgress: next })}
              />
            </td>

            <td className="px-2 py-1.5 align-middle">
              <NumberCell
                ariaLabel={`Peso del objetivo ${index}`}
                value={objective.weightPercent}
                // Every weight of a user whose total runs over is outlined, not
                // just one: any of them can be the one that moves, so singling out
                // a row would be an arbitrary verdict. That now spans both halves
                // of the card, because the weight given up can just as well come
                // from one the user already had.
                violations={
                  isWeightOverTotal
                    ? [...(byField.weightPercent ?? []), WEIGHT_TOTAL_MARK]
                    : byField.weightPercent
                }
                allowEmpty={false}
                onChange={(next) => onChange({ weightPercent: next === null ? NaN : next })}
              />
            </td>
          </>
        )}

        {/*
          One action per kind of row, and only when it can do something.

          A file row can be dropped from the load. A saved objective cannot —
          it is already in UBITS — so the cell stays empty until the reviewer
          adjusts it, and then offers the one thing that is genuinely undoable:
          putting it back the way UBITS has it.
        */}
        <td className="px-2 py-1.5 align-middle">
          <div className="flex items-center justify-end gap-0.5">
            {removal && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Quitar de la carga el objetivo ${index}`}
                title="Quitar de la carga"
                onClick={removal.onRequest}
                className="h-7 w-7 rounded-md text-text-secondary/30 hover:text-status-negative hover:bg-status-negative/10"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
              </Button>
            )}

            {isSaved && isAdjusted && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Deshacer los cambios del objetivo ${index}`}
                title="Volver a los valores que tiene en UBITS"
                onClick={() => onChange({ ...objective.saved })}
                className="h-7 w-7 rounded-md text-text-secondary/40 hover:text-primary hover:bg-primary/10"
              >
                <Undo2 className="h-3.5 w-3.5" strokeWidth={2.25} />
              </Button>
            )}
          </div>
        </td>
      </tr>

      {violations.length > 0 && (
        <tr inert={isIdle || undefined} className={cn(isIdle && "opacity-50")}>
          <td />
          <td colSpan={columnCount - 1} className="px-2 pb-2 pt-0">
            <ul className="flex flex-wrap gap-x-4 gap-y-1">
              {violations.map((violation) => (
                <li
                  key={`${violation.rule}-${violation.field}`}
                  className={cn(
                    "flex items-start gap-1.5 text-[11px] font-medium",
                    violation.severity === "error"
                      ? "text-status-negative"
                      : "text-status-warning"
                  )}
                >
                  {violation.severity === "error" ? (
                    <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" strokeWidth={2.5} />
                  ) : (
                    <Info className="h-3 w-3 mt-0.5 shrink-0" strokeWidth={2.5} />
                  )}
                  <span>
                    <span className="font-bold">{violation.rule}</span> {violation.message}
                  </span>
                </li>
              ))}
            </ul>
          </td>
        </tr>
      )}
    </>
  );
};
