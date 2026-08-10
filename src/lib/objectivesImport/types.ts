/**
 * Canonical shape of an objective as UBITS stores it, plus the vocabulary the
 * official templates use to express it.
 *
 * Everything the importer reads — the three UBITS templates today, foreign
 * performance-evaluation files later — is normalised into `ParsedObjective`
 * before any rule runs, so validation and the review table only ever deal with
 * one shape.
 */

/**
 * What the file is meant to do to the cycle.
 *
 * Lives here rather than beside the template definitions because the groups and
 * the rules both have to branch on it: "actualizar" validates something entirely
 * different from the other two — see `validateProgressUpdate`.
 */
export type BulkUploadMode = 'crear' | 'editar' | 'actualizar';

/** Unit the objective is measured in. Mirrors the template's `tipo_medida` list. */
export type MeasureType = 'Dinero' | 'Porcentaje' | 'Numérico' | 'Se cumple / No se cumple';

export const MEASURE_TYPES: MeasureType[] = [
  'Dinero',
  'Porcentaje',
  'Numérico',
  'Se cumple / No se cumple',
];

/** Symbol shown inside the value inputs, matching the form in UBITS. */
export const MEASURE_SYMBOL: Record<MeasureType, string> = {
  Dinero: '$',
  Porcentaje: '%',
  'Numérico': '#',
  'Se cumple / No se cumple': '✓',
};

/** Direction the metric has to move. Template's `aumentar_reducir`. */
export type Trend = 'Aumentar' | 'Reducir';

export const TRENDS: Trend[] = ['Aumentar', 'Reducir'];

/**
 * The body of an objective: everything a reviewer can change about it.
 *
 * Split out from `ParsedObjective` because an objective that already exists in
 * UBITS needs a second copy of exactly these fields — the values the platform
 * stores today — so an adjustment can be told apart from the original and
 * undone. The identity fields (`id`, `sourceRow`, `username`) are deliberately
 * not here: those never change, so there is nothing to compare.
 *
 * `initialValue`, `minProgress` and `maxProgress` are nullable because the
 * template leaves them blank on purpose: a missing initial value switches the
 * compliance formula (rules R6b/R6c), and blank thresholds mean "no floor / no
 * ceiling" rather than zero.
 */
export interface ObjectiveDefinition {
  title: string;
  weightPercent: number;
  measureType: MeasureType;
  trend: Trend;
  initialValue: number | null;
  target: number;
  minProgress: number | null;
  maxProgress: number | null;
  /**
   * The template's `descripcion_meta`, carried through untouched.
   *
   * The only field here no rule validates and no total depends on, which is why
   * the review table stopped displaying it: on a row that already holds a name, a
   * state badge and eight numbers, it was the one thing competing for space
   * without ever being the reason a load succeeded or failed. It still loads
   * exactly as the file wrote it — the cost is that a typo in a description
   * cannot be caught here.
   */
  description: string;
}

/** Fields compared to decide whether a saved objective was adjusted. */
const DEFINITION_FIELDS: (keyof ObjectiveDefinition)[] = [
  'title',
  'weightPercent',
  'measureType',
  'trend',
  'initialValue',
  'target',
  'minProgress',
  'maxProgress',
  'description',
];

/** Copies just the editable body out of anything that carries one. */
export function toObjectiveDefinition(source: ObjectiveDefinition): ObjectiveDefinition {
  return {
    title: source.title,
    weightPercent: source.weightPercent,
    measureType: source.measureType,
    trend: source.trend,
    initialValue: source.initialValue,
    target: source.target,
    minProgress: source.minProgress,
    maxProgress: source.maxProgress,
    description: source.description,
  };
}

/**
 * How confident we are about the cycle objective a file row is editing.
 *
 * The same three-way answer the user matcher gives, for the same reason: an
 * objective is found by its NAME, and a name is not an identifier. Two objectives
 * can be called almost the same thing, and whoever filled the spreadsheet was
 * typing from memory.
 *
 *  - `matched`: the name is one the user already has, character for character
 *    once case and accents are set aside.
 *  - `possible`: a near-variant — a word dropped, a typo, half the phrase — so we
 *    propose one but a human has to confirm it.
 *  - `unmatched`: nothing close enough to propose. The row creates a new
 *    objective unless the reviewer points it at one by hand.
 */
export type ObjectiveMatchStatus = 'matched' | 'possible' | 'unmatched';

/**
 * Which objective of the cycle a file row is going to rewrite.
 *
 * Only ever set on the rows of an *edit* load. Creating objectives has nothing
 * to link — every row is new by definition — so the absence of `link` is what
 * tells the weight rule, the review table and the load which kind of file they
 * are looking at, without any of them being told the mode.
 */
export interface ObjectiveLink {
  status: ObjectiveMatchStatus;
  /**
   * Id of the entry in the group's `existing` list this row rewrites.
   *
   * Absent means the row creates a new objective — either because nothing
   * matched, or because the reviewer said so.
   */
  targetId?: string;
  /** Candidate offered when the name did not match outright. */
  suggestionId?: string;
  /** Short label for what produced the candidate: "nombre parecido". */
  basis?: string;
  /** The sentence behind that label, for the tooltip. */
  reason?: string;
  /** True once a human confirmed the target, changed it, or chose to create it new. */
  isManual: boolean;
  /**
   * The name the file used to find the objective — its `nombre_objetivo` column.
   *
   * Kept apart from `title`, which is what the objective will be *called* after
   * the edit: the edit template renames through `nombre_objetivo_nuevo`, so the
   * two are different strings on any row that renames, and the picker has to be
   * able to say which one it searched for.
   */
  lookupTitle: string;
}

/**
 * One objective the review is working on — a row read from a file, or one the
 * user already has in the cycle.
 */
export interface ParsedObjective extends ObjectiveDefinition {
  /** Stable id for React keys and edits; derived from file + row, not from UBITS. */
  id: string;
  /**
   * 1-based row in the source sheet, so a message can point back at the file.
   * `0` on objectives that did not come from one.
   */
  sourceRow: number;
  /** Identifier as written in the file: email, document number or username. */
  username: string;
  /**
   * Progress already recorded in UBITS for the objective this row is about.
   *
   * Always read live off the linked target, never off the file — the
   * template's `avance_actual` column is context for whoever fills it in, not
   * a source this app trusts.
   */
  currentProgress?: number | null;
  /**
   * The progress an "actualizar" row wants to record — the one field of that
   * template that actually writes anything.
   *
   * `undefined` on every create and edit row, which is what marks this row as
   * belonging to a progress load at all; `null` when the column was left blank,
   * which is an error rather than an absence.
   */
  newProgress?: number | null;
  /**
   * Set only on objectives that ALREADY exist in UBITS, holding their values as
   * the platform stores them right now.
   *
   * Its presence is what makes a row "already created" rather than "about to be
   * created", and comparing against it is what turns an edit into a fact the UI
   * can state — "este peso pasa de 40% a 25%, se actualizará al cargar" — and
   * can undo. A file row has no `saved`, because it has no before.
   */
  saved?: ObjectiveDefinition;
  /**
   * Set only on the rows of an edit load: which existing objective this one
   * rewrites. See `ObjectiveLink`.
   */
  link?: ObjectiveLink;
}

/** True for a file row that is editing an objective rather than creating one. */
export function isLinkedRow(objective: ParsedObjective): boolean {
  return objective.link !== undefined;
}

/** True when this row will rewrite an objective the user already has. */
export function willUpdateObjective(objective: ParsedObjective): boolean {
  return objective.link?.targetId !== undefined;
}

/**
 * True when an edit row is going to add an objective instead of changing one.
 *
 * Not an error on its own: a file can legitimately name something the user does
 * not have yet, and creating it is the sensible default. It is stated loudly all
 * the same, because "editar" is not what the reviewer asked for.
 */
export function willCreateObjective(objective: ParsedObjective): boolean {
  return objective.link !== undefined && objective.link.targetId === undefined;
}

/** True while a proposed objective link is still waiting on a human. */
export function isObjectiveLinkPending(objective: ParsedObjective): boolean {
  return objective.link?.status === 'possible';
}

/** True for an objective that already exists in UBITS. */
export function isSavedObjective(objective: ParsedObjective): boolean {
  return objective.saved !== undefined;
}

/**
 * True when a saved objective has been changed away from what UBITS stores.
 *
 * Always false for a file row: there is nothing it could differ from.
 */
export function hasSavedEdits(objective: ParsedObjective): boolean {
  const { saved } = objective;
  if (!saved) return false;
  return DEFINITION_FIELDS.some((field) => objective[field] !== saved[field]);
}

/**
 * What kind of identifier the file used in the `username` column.
 *
 * The first three are what UBITS accepts *as* a username, so the column is
 * genuinely polymorphic: the same cycle can hold a person identified by their
 * corporate e-mail, another by their document number and a third by a nickname.
 * Any of them resolves the person outright.
 *
 * `nombre` and `telefono` are different in kind. UBITS does not accept them as
 * usernames, but files carry them anyway — someone types "Marta Forero" or a
 * mobile number in the column — and both can be traced back to a person. Never
 * conclusively, though: two people share a name and phones get reassigned, so
 * they can only ever produce a proposal for a human to confirm.
 */
export type IdentifierType = 'correo' | 'documento' | 'username' | 'nombre' | 'telefono';

/**
 * How confident we are about the UBITS user behind a file identifier.
 *
 *  - `matched`: the identifier is a UBITS username, e-mail or document number.
 *  - `possible`: it is a near-variant of one — same local part on another
 *    domain, a document with different punctuation — so we propose a candidate
 *    but a human has to confirm it.
 *  - `unmatched`: nothing to propose; the user has to be picked by hand.
 */
export type UserMatchStatus = 'matched' | 'possible' | 'unmatched';

/**
 * A UBITS user the file's rows can be matched against.
 *
 * `username` is the canonical identifier and may itself look like an e-mail or
 * a number; `email` and `documentId` are the other two ways the same person can
 * be named in a file.
 */
export interface RosterUser {
  username: string;
  name: string;
  email?: string;
  /** Identification / document number, when the directory knows it. */
  documentId?: string;
  /** True when the user is already assigned to the cycle being loaded. */
  onCycle?: boolean;
  /** Area or team, shown in the picker to tell namesakes apart. */
  area?: string;
  /** Direct leader, absent when the user sits at the top of their branch. */
  leader?: string;
  /**
   * Contact number, when the directory has one.
   *
   * Never an identity on its own — numbers get reassigned between people — but
   * enough to propose a candidate when a file names someone by phone.
   */
  phone?: string;
  /**
   * Objectives this person ALREADY has in the cycle being loaded.
   *
   * Travels with the user rather than being looked up separately, because it is
   * only knowable once the identifier has resolved to somebody — and the review
   * resolves identifiers at two different moments: when the file is parsed, and
   * again every time a reviewer picks a user by hand.
   *
   * It matters because the 100% rule is about everything a person carries, not
   * about what one file brings. Someone already at 100% cannot receive a single
   * new objective until weight is freed up somewhere, and the reviewer can only
   * decide where if they can see both sides.
   */
  cycleObjectives?: CycleObjective[];
}

/** An objective the user already has in the cycle, as UBITS stores it. */
export interface CycleObjective extends ObjectiveDefinition {
  /** The id UBITS knows it by, so an adjustment can be sent back to the right one. */
  id: string;
  /**
   * Progress recorded against it today — the number an "actualizar" load
   * replaces, and the one it is worth comparing the new value to.
   *
   * Absent on an objective nobody has reported on yet, which is different from
   * zero: "nadie ha reportado" and "reportó cero" produce the same compliance
   * but not the same question about a file that arrives claiming otherwise.
   */
  currentProgress?: number | null;
}

/** Objectives of a single file identifier, grouped for the review table. */
export interface ObjectiveUserGroup {
  /**
   * Identifier exactly as the file wrote it. Stays the group's stable key even
   * after a human reassigns it, so reassigning cannot merge or lose groups.
   */
  identifier: string;
  identifierType: IdentifierType;
  /**
   * What the load is doing, carried on the group because the rules branch on
   * it: an "actualizar" group is judged on its progress values, and on nothing
   * a create or edit group is judged on. Every group of one load shares it.
   */
  mode: BulkUploadMode;
  matchStatus: UserMatchStatus;
  /** The UBITS user these objectives will load against, once resolved. */
  matchedUser?: RosterUser;
  /** Candidate offered when the identifier did not match exactly. */
  suggestion?: RosterUser;
  /** Short label for the datum that produced the candidate: "nombre", "teléfono". */
  suggestionBasis?: string;
  /** The sentence behind that label, for the tooltip. */
  suggestionReason?: string;
  /** True once a human picked or confirmed the user by hand. */
  isManual: boolean;
  /**
   * True once a human has pressed "Confirmar" with nothing left to fix.
   *
   * A card never reaches `alineados` on data becoming valid by itself — that
   * would load whatever the reviewer's last keystroke happened to leave behind
   * the instant it stopped tripping a rule, without anyone actually saying
   * "yes, load this". The click is what says it, so it is the only thing that
   * moves a card into the tab the load reads from. Any further edit to this
   * group withdraws it: a change after confirming is a change nobody has
   * agreed to yet.
   */
  reviewConfirmed: boolean;
  /** The file's rows — what the load will create. */
  objectives: ParsedObjective[];
  /**
   * What the resolved user already has in the cycle, pulled in for context.
   *
   * Kept apart from `objectives` rather than mixed into it, so that every count,
   * every summary and the load itself keep meaning "what this file will write"
   * without having to filter. What the two arrays share is the weight rule: it
   * is judged over both, because that is the total UBITS will end up with.
   *
   * Empty until the identity is settled — a card with nobody behind it has no
   * "already has" to speak of — and empties again if the user is cleared.
   */
  existing: ParsedObjective[];
}

/**
 * Ids of the user's existing objectives that a row of the file is going to
 * rewrite. Always empty on a create load, where no row links to anything.
 */
export function groupTargetedIds(group: ObjectiveUserGroup): Set<string> {
  return new Set(
    group.objectives
      .map((objective) => objective.link?.targetId)
      .filter((id): id is string => id !== undefined)
  );
}

/**
 * The user's existing objectives that the file leaves alone.
 *
 * On a create load that is all of them; on an edit load it is the ones no row
 * points at. Either way they are the objectives whose weight survives the load
 * untouched, which is why the 100% rule counts them and the rewritten ones only
 * through the row replacing them.
 */
export function groupUntouchedObjectives(group: ObjectiveUserGroup): ParsedObjective[] {
  const targeted = groupTargetedIds(group);
  return group.existing.filter((objective) => !targeted.has(objective.id));
}

/**
 * Everything the user will be carrying once the load finishes.
 *
 * The one set the 100% rule and the validation should ever be measured over: the
 * objectives the file does not touch, plus every row the file brings — whether
 * that row creates something new or replaces something that was already there.
 * Counting a rewritten objective *and* the row rewriting it would double its
 * weight, which is the whole reason this is not simply `existing + objectives`.
 */
export function groupResultingObjectives(group: ObjectiveUserGroup): ParsedObjective[] {
  return [...groupUntouchedObjectives(group), ...group.objectives];
}

/**
 * The user's existing objectives, in the shape the review table edits.
 *
 * Ids are namespaced so a UBITS objective can never collide with a file row in
 * the same React list, and `sourceRow` is 0 because there is no file row to
 * point back at.
 */
export function toExistingObjectives(user: RosterUser): ParsedObjective[] {
  return (user.cycleObjectives ?? []).map((objective) => ({
    ...toObjectiveDefinition(objective),
    id: `ubits:${user.username}:${objective.id}`,
    sourceRow: 0,
    username: user.username,
    currentProgress: objective.currentProgress ?? null,
    saved: toObjectiveDefinition(objective),
  }));
}

/**
 * True for a row of an "actualizar" load.
 *
 * Asked of the row rather than of the mode wherever a row is all there is —
 * the review row, a single violation — and it is answerable there because only
 * that template's parser sets `newProgress` at all, blank cell included.
 */
export function isProgressRow(objective: ParsedObjective): boolean {
  return objective.newProgress !== undefined;
}

/** Resolved username a group will load against, or the raw identifier. */
export function groupUsername(group: ObjectiveUserGroup): string {
  return group.matchedUser?.username ?? group.identifier;
}

/** Display name for a group: the UBITS name once known, else the identifier. */
export function groupDisplayName(group: ObjectiveUserGroup): string {
  return group.matchedUser?.name ?? group.identifier;
}

/** True when the resolved user is already assigned to the cycle. */
export function isGroupOnCycle(group: ObjectiveUserGroup): boolean {
  return group.matchedUser?.onCycle === true;
}
