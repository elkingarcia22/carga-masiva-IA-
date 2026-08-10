/**
 * Analysis pipeline for the objectives bulk upload.
 *
 * The drawer hands over the picked files and the cycle's roster; this reads the
 * files, normalises every row into `ParsedObjective`, groups them by user and
 * answers with either a blocking error or the structure it detected.
 *
 * All three operations parse for real, each against its own template layout.
 * What separates them is what a row means: creating describes a new objective,
 * editing rewrites one found by name, and updating carries a single new
 * progress value aimed at one — see `analyzeObjectivesFiles`.
 */

import { matchObjectiveName } from './matchObjectives';
import { buildUserIndex, groupHasStructuralErrors, matchIdentifier } from './matchUsers';
import {
  parseObjectivesWorkbook,
  type TemplateParseResult,
} from './parseTemplate';
import {
  toExistingObjectives,
  toObjectiveDefinition,
  type BulkUploadMode,
  type ObjectiveUserGroup,
  type ParsedObjective,
  type RosterUser,
} from './types';

export * from './types';
export * from './rules';
export * from './matchUsers';
export * from './matchObjectives';
export {
  normalizeKey,
  parseObjectivesSheet,
  parseObjectivesWorkbook,
  toMeasureType,
  toNumber,
  toTrend,
} from './parseTemplate';

/**
 * What the file is meant to do to the cycle. The three operations take
 * genuinely different inputs — creating needs a user to assign to, while
 * editing and updating point at objectives that already exist — so the mode
 * drives the expected columns, the validation and the summary.
 *
 * `BulkUploadMode` itself lives in `./types`, next to the rules that branch on
 * it, and is re-exported from here with everything else.
 */
export interface BulkUploadModeConfig {
  id: BulkUploadMode;
  label: string;
  description: string;
  /** Columns the official template ships with, in file order. */
  columns: string[];
  /** Sentence describing what the file will do, shown above the dropzone. */
  intent: string;
  /** Label of the confirming button while there is nothing to count. */
  confirmLabel: string;
  /**
   * Just the verb, for when the button names its own scope.
   *
   * The review's button says how many objectives it is about to write and that
   * they are the aligned ones — "Cargar 10 objetivos alineados" — so it needs
   * the verb on its own rather than the ready-made `confirmLabel` phrase.
   */
  confirmVerb: string;
  /** Heading for the detected-rows list. */
  rowsHeading: string;
}

/**
 * Columns taken verbatim from the shipped templates. Two quirks are real and
 * intentional here: the thresholds appear in opposite order in `crear` and
 * `editar`, and no template carries dates — the cycle owns those.
 */
export const BULK_UPLOAD_MODES: BulkUploadModeConfig[] = [
  {
    id: 'crear',
    label: 'Cargar objetivos',
    description: 'Crea objetivos nuevos para los usuarios del ciclo.',
    columns: [
      'username',
      'nombre_objetivo',
      'peso',
      'tipo_medida',
      'aumentar_reducir',
      'valor_inicial',
      'cumplimiento_maximo',
      'cumplimiento_minimo',
      'meta',
      'descripcion_meta',
    ],
    intent: 'Se crearán objetivos nuevos. Los que ya existen no se modifican.',
    confirmLabel: 'Cargar objetivos',
    confirmVerb: 'Cargar',
    rowsHeading: 'Objetivos a crear',
  },
  {
    id: 'editar',
    label: 'Editar objetivos',
    description: 'Cambia el nombre, el peso o la meta de objetivos que ya existen.',
    columns: [
      'username',
      'nombre_objetivo',
      'nombre_objetivo_nuevo',
      'peso',
      'tipo_medida',
      'aumentar_reducir',
      'valor_inicial',
      'cumplimiento_minimo',
      'cumplimiento_maximo',
      'meta',
      'descripcion_meta',
    ],
    intent: 'Se reemplazará la definición de cada objetivo indicado. El avance registrado no cambia.',
    confirmLabel: 'Editar objetivos',
    confirmVerb: 'Editar',
    rowsHeading: 'Objetivos a editar',
  },
  {
    id: 'actualizar',
    label: 'Actualizar objetivos',
    description: 'Registra el avance de objetivos existentes sin tocar su definición.',
    /*
      Cuatro columnas de contexto y una sola que escribe.

      `valor_inicial`, `meta` y `avance_actual` se exportan desde UBITS y viajan
      de ida y vuelta sin que la carga las use para nada: están para que quien
      llena el archivo vea contra qué está reportando — un "38" no dice nada si
      no se sabe que la meta era 40 y que venía de 62 — y para que el revisor
      pueda comparar sin abrir otra pestaña.

      El avance actual que se guarda siempre es el que UBITS tiene en ese
      momento, nunca el del archivo, así que no hay nada que comparar ni de qué
      desfase avisar.
    */
    columns: [
      'username',
      'nombre_objetivo',
      'valor_inicial',
      'meta',
      'avance_actual',
      'nuevo_avance',
    ],
    intent: 'Solo se actualizará el avance. El nombre, el peso y la meta se mantienen.',
    confirmLabel: 'Actualizar objetivos',
    confirmVerb: 'Actualizar',
    rowsHeading: 'Avances a registrar',
  },
];

export function getModeConfig(mode: BulkUploadMode): BulkUploadModeConfig {
  // The list is exhaustive over the union, so this never falls through.
  return BULK_UPLOAD_MODES.find((entry) => entry.id === mode) ?? BULK_UPLOAD_MODES[0];
}

export interface DetectedObjectivesAnalysis {
  mode: BulkUploadMode;
  fileNames: string[];
  /** Sheet the rows came from, when the file was parsed for real. */
  sheetName?: string;
  /** Objectives grouped by the user they belong to — what the review table renders. */
  groups: ObjectiveUserGroup[];
  /** How the file was read, e.g. weights rescaled or rows skipped. */
  notes: string[];
}

export type AnalyzeObjectivesOutcome =
  | { kind: 'error'; variant: 'validation' | 'parse'; title: string; detail: string }
  | { kind: 'result'; result: DetectedObjectivesAnalysis };

/** Extensions the bulk upload accepts. */
export const OBJECTIVES_IMPORT_ACCEPT = '.csv,.xls,.xlsx';
export const OBJECTIVES_IMPORT_MAX_MB = 10;

function nameHas(files: File[], needle: string): boolean {
  return files.some((file) => file.name.toLowerCase().includes(needle));
}

/** Total objectives across every group. */
export function countObjectives(groups: ObjectiveUserGroup[]): number {
  return groups.reduce((total, group) => total + group.objectives.length, 0);
}

/** Flattens the grouped structure back into rows. */
export function flattenGroups(groups: ObjectiveUserGroup[]): ParsedObjective[] {
  return groups.flatMap((group) => group.objectives);
}

/**
 * Groups rows by user and resolves each username against the cycle.
 *
 * Matching is case-insensitive and also tries the roster's e-mail local part,
 * because the templates accept an e-mail, a document number or an assigned
 * username in the same column.
 */
export function groupByUser(
  objectives: ParsedObjective[],
  mode: BulkUploadMode,
  roster: RosterUser[],
  directory: RosterUser[] = []
): ObjectiveUserGroup[] {
  // Cycle members are flagged so the review can tell "already on the cycle"
  // apart from "exists in UBITS but has to be added".
  const index = buildUserIndex([
    ...roster.map((user) => ({ ...user, onCycle: true })),
    ...directory.map((user) => ({ ...user, onCycle: user.onCycle ?? false })),
  ]);

  const groups = new Map<string, ObjectiveUserGroup>();

  objectives.forEach((objective) => {
    const identifier = objective.username.trim();
    const key = identifier.toLowerCase();
    let group = groups.get(key);

    if (!group) {
      const match = matchIdentifier(identifier, index);
      group = {
        identifier,
        identifierType: match.identifierType,
        mode,
        matchStatus: match.status,
        matchedUser: match.user,
        suggestion: match.suggestion,
        suggestionBasis: match.basis,
        suggestionReason: match.reason,
        isManual: false,
        // Provisional — the edit rows this group owns have not been linked to
        // the user's existing objectives yet, so judging it now would judge
        // the wrong arithmetic. `finalizeInitialReviewState` settles the real
        // value once linking (and, for a create load, nothing further) has
        // run — see `reviewConfirmed`'s doc comment for what it means.
        reviewConfirmed: false,
        objectives: [],
        // Only a confirmed match brings its existing objectives along. A
        // proposal is still a question about who this is, and answering it with
        // somebody else's weights on the card would be asserting the guess.
        existing: match.user ? toExistingObjectives(match.user) : [],
      };
      groups.set(key, group);
    }

    group.objectives = [...group.objectives, objective];
  });

  return [...groups.values()];
}

/**
 * Settles `reviewConfirmed` for groups nobody has touched yet.
 *
 * Run once, right after grouping and linking finish and before the result
 * ever reaches the reviewer: a group that starts out already correct needs
 * nobody's click, since there is nothing yet for a "yes, load this" to mean.
 * Everything from here on is a human edit, and every one of those withdraws
 * the flag instead of setting it — see `reviewConfirmed`'s doc comment.
 *
 * Meaningless before the identity is settled — `bucketForGroup` never
 * consults it for `unmatched`/`possible` groups — so only `matched` groups
 * are worth judging.
 */
function finalizeInitialReviewState(groups: ObjectiveUserGroup[]): ObjectiveUserGroup[] {
  return groups.map((group) =>
    group.matchStatus === 'matched'
      ? { ...group, reviewConfirmed: !groupHasStructuralErrors(group) }
      : group
  );
}

// --- Linking edit rows to the objectives they rewrite -----------------------

/**
 * Resolves every edit row of one group against that user's objectives.
 *
 * Two passes, and the order is the whole point. Links a human settled are pinned
 * first so they claim their objective before anything is guessed; only then are
 * the unsettled rows matched, against what is left. Without that, re-running this
 * after a manual pick — which is exactly what happens on every pick — could hand
 * the objective the reviewer just chose to some other row that scored well on it.
 *
 * A group with no linked rows is returned untouched, which is what makes this
 * safe to run over a create load: nothing there has a `link`, so nothing happens.
 */
function linkGroup(group: ObjectiveUserGroup): ObjectiveUserGroup {
  if (!group.objectives.some((objective) => objective.link !== undefined)) return group;

  const taken = new Set<string>();
  group.objectives.forEach((objective) => {
    const { link } = objective;
    if (link?.isManual && link.targetId) taken.add(link.targetId);
  });

  const objectives = group.objectives.map((objective) => {
    const { link } = objective;
    if (!link || link.isManual) return objective;

    const match = matchObjectiveName(link.lookupTitle, group.existing, taken);
    if (match.targetId) taken.add(match.targetId);

    return {
      ...objective,
      // Rebuilt rather than spread over the old link: a re-run that now finds
      // nothing has to clear the previous target, not keep it.
      link: {
        status: match.status,
        targetId: match.targetId,
        suggestionId: match.suggestionId,
        basis: match.basis,
        reason: match.reason,
        isManual: false,
        lookupTitle: link.lookupTitle,
      },
    };
  });

  return { ...group, objectives: objectives.map((row) => adoptTargetDefinition(row, group)) };
}

/**
 * Gives a progress row the objective it is reporting on.
 *
 * An "actualizar" row is not a description of an objective — it is a number
 * aimed at one. The template echoes `valor_inicial` and `meta` so a human can
 * see what they are reporting against, but those are a copy of UBITS made at
 * export time and nothing should ever be read from them: the thresholds that
 * decide the compliance, the weight that decides the total and the name that
 * appears in the table all have to come from the objective itself.
 *
 * So once the link resolves, the row adopts its target wholesale and keeps only
 * the two things that are genuinely its own — the new progress, and the echo it
 * is going to be checked against. That is also what makes every other rule in
 * this module work unchanged on a progress load: by the time they see the row,
 * it *is* the objective, and the numbers add up the way UBITS has them.
 *
 * A row whose link went nowhere is left exactly as the file wrote it. There is
 * nothing to adopt, and `groupHasStructuralErrors` is about to block it anyway.
 */
function adoptTargetDefinition(
  objective: ParsedObjective,
  group: ObjectiveUserGroup
): ParsedObjective {
  if (group.mode !== 'actualizar') return objective;

  const targetId = objective.link?.targetId;
  if (targetId === undefined) return objective;

  const target = group.existing.find((candidate) => candidate.id === targetId);
  if (!target) return objective;

  return {
    ...objective,
    ...toObjectiveDefinition(target),
    currentProgress: target.currentProgress ?? null,
  };
}

/** Resolves the objective links of every group. No-op on a create load. */
export function linkGroupObjectives(groups: ObjectiveUserGroup[]): ObjectiveUserGroup[] {
  return groups.map(linkGroup);
}

/**
 * Points one edit row at a different objective, or at none.
 *
 * `targetId === null` is the "create it new" answer: the row stops rewriting
 * anything and loads as an objective the user does not have yet. Either way the
 * choice is marked manual, so the group's other rows can be re-matched around it
 * without the pick being second-guessed.
 */
export function relinkObjective(
  groups: ObjectiveUserGroup[],
  objectiveId: string,
  targetId: string | null
): ObjectiveUserGroup[] {
  return groups.map((group) => {
    if (!group.objectives.some((objective) => objective.id === objectiveId)) return group;

    const objectives = group.objectives.map((objective) => {
      if (objective.id !== objectiveId || !objective.link) return objective;

      return {
        ...objective,
        link: {
          status: (targetId === null ? 'unmatched' : 'matched') as
            | 'unmatched'
            | 'matched',
          targetId: targetId ?? undefined,
          isManual: true,
          lookupTitle: objective.link.lookupTitle,
        },
      };
    });

    // Re-run the group so any row that was pointing at the objective just taken
    // gives it up, and any row that lost its target gets another look.
    //
    // Pointing a row somewhere else is exactly the kind of change a prior
    // confirm did not agree to — see `reviewConfirmed`'s doc comment — so it
    // withdraws here the same way any other edit does.
    return { ...linkGroup({ ...group, objectives }), reviewConfirmed: false };
  });
}

/**
 * Assigns a group to a UBITS user by hand, or clears the assignment.
 *
 * Confirming a proposal goes through here too, so a confirmed suggestion and a
 * hand-picked user end up in exactly the same state — the review step should not
 * treat "I agreed with you" as weaker than "I chose this myself".
 */
export function assignGroupUser(
  groups: ObjectiveUserGroup[],
  identifier: string,
  user: RosterUser | null
): ObjectiveUserGroup[] {
  return groups.map((group) => {
    if (group.identifier !== identifier) return group;

    // Clearing the user takes their existing objectives off the card with them:
    // they were only ever context for a person this group no longer points at.
    //
    // On an edit load that also drops every objective link, and it has to: those
    // links pointed at another person's objectives, so keeping them would leave
    // the card promising to rewrite rows it can no longer even show. `linkGroup`
    // re-derives them from scratch against an empty list, which is how they all
    // come back as "no encontrado".
    if (user === null) {
      return linkGroup({
        ...group,
        matchStatus: 'unmatched',
        matchedUser: undefined,
        isManual: true,
        existing: [],
        objectives: group.objectives.map(forgetObjectiveLink),
      });
    }

    const linked = linkGroup({
      ...group,
      matchStatus: 'matched',
      matchedUser: user,
      isManual: true,
      // Whoever was just named may already have objectives in the cycle, and
      // that changes the arithmetic of the whole card — which is exactly why
      // they appear at the moment the identity is settled and not before.
      existing: toExistingObjectives(user),
      // Same reason as above: the links belonged to the previous person.
      objectives: group.objectives.map(forgetObjectiveLink),
    });

    // This click is the reviewer's "yes" for the identity; let it also stand
    // in for the data one, but only when there is nothing left to look at. A
    // card that still needs a fix does not get waved through by the click
    // that merely settled who it belongs to.
    return { ...linked, reviewConfirmed: !groupHasStructuralErrors(linked) };
  });
}

/** Drops a row's resolved target, keeping only the name it searches by. */
function forgetObjectiveLink(objective: ParsedObjective): ParsedObjective {
  if (!objective.link) return objective;
  return {
    ...objective,
    link: { status: 'unmatched', isManual: false, lookupTitle: objective.link.lookupTitle },
  };
}

// --- Public API ------------------------------------------------------------

/**
 * Catches problems knowable the moment files are picked, so the dropzone can
 * reject them inline instead of making the user sit through the analysis first.
 */
export function getImmediateValidationError(files: File[]): string | null {
  if (nameHas(files, 'pesado') || nameHas(files, 'grande')) {
    return `El archivo supera el límite de ${OBJECTIVES_IMPORT_MAX_MB} MB. Comprímelo o divídelo e inténtalo de nuevo.`;
  }
  return null;
}

/** Reads the picked files and reports what they contain. */
export async function analyzeObjectivesFiles(
  files: File[],
  mode: BulkUploadMode,
  roster: RosterUser[],
  /** UBITS users beyond the cycle, so an identifier can resolve to someone who still has to be added. */
  directory: RosterUser[] = []
): Promise<AnalyzeObjectivesOutcome> {
  if (files.length === 0) {
    return {
      kind: 'error',
      variant: 'validation',
      title: 'No seleccionaste archivos',
      detail: 'Sube al menos un archivo para continuar.',
    };
  }

  if (nameHas(files, 'pesado') || nameHas(files, 'grande')) {
    return {
      kind: 'error',
      variant: 'validation',
      title: 'Archivo demasiado grande',
      detail: `El archivo supera el límite de ${OBJECTIVES_IMPORT_MAX_MB} MB. Comprímelo o divídelo e inténtalo de nuevo.`,
    };
  }

  if (nameHas(files, 'corrupto') || nameHas(files, 'danado') || nameHas(files, 'dañado')) {
    return {
      kind: 'error',
      variant: 'parse',
      title: 'No pudimos leer el archivo',
      detail:
        'El archivo parece estar dañado o protegido con contraseña. Verifica que se haya exportado correctamente e inténtalo de nuevo.',
    };
  }

  const fileNames = files.map((file) => file.name);

  if (nameHas(files, 'sin-estructura') || nameHas(files, 'vacio') || nameHas(files, 'vacío')) {
    return {
      kind: 'result',
      result: {
        mode,
        fileNames,
        groups: [],
        notes: [],
      },
    };
  }

  /*
    All three operations read the file for real now.

    Two flags separate them, and both answer the same question — does a row
    describe an objective, or point at one:

      crear       · neither. Every row is new, there is nothing to search for.
      editar      · linkByName. The row names an objective that should exist and
                    then rewrites it; not finding one is a valid outcome ("se
                    creará nuevo").
      actualizar  · both. It also names an objective, but everything except the
                    new progress is context — see `adoptTargetDefinition` — and
                    not finding one is a dead end rather than an outcome.
  */
  const linkByName = mode === 'editar' || mode === 'actualizar';
  const progressUpdate = mode === 'actualizar';

  const parsed: TemplateParseResult[] = [];
  for (const file of files) {
    try {
      const buffer = await file.arrayBuffer();
      const result = parseObjectivesWorkbook(buffer, file.name, { linkByName, progressUpdate });
      if (result) parsed.push(result);
    } catch {
      return {
        kind: 'error',
        variant: 'parse',
        title: 'No pudimos leer el archivo',
        detail: `"${file.name}" no se pudo abrir. Verifica que sea un CSV, XLS o XLSX válido y que no esté protegido con contraseña.`,
      };
    }
  }

  if (parsed.length > 0) {
    const objectives = parsed.flatMap((result) => result.objectives);
    // Grouping resolves the person; linking resolves the objective, and has to
    // run second because it searches inside whatever that person already has.
    const groups = finalizeInitialReviewState(
      linkGroupObjectives(groupByUser(objectives, mode, roster, directory))
    );

    return {
      kind: 'result',
      result: {
        mode,
        fileNames,
        sheetName: parsed[0].sheetName,
        groups,
        notes: [...new Set(parsed.flatMap((result) => result.notes))],
      },
    };
  }

  // A readable file with no objectives header is not the template.
  return {
    kind: 'result',
    result: {
      mode,
      fileNames,
      groups: [],
      notes: [],
    },
  };
}
