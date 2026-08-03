/**
 * Mock analysis pipeline for the objectives bulk upload.
 *
 * Mirrors how the historical survey load works: the drawer hands over the picked
 * files, this reads them (here, simulated) and answers with either a blocking
 * error, an empty result, or the structure it detected. Outcomes are driven by
 * the file name so the demo files under `demo-samples/` can walk through every
 * state without needing real parsing.
 */

/**
 * What the file is meant to do to the cycle. The three operations take
 * genuinely different inputs — creating needs a user to assign to, while
 * editing and updating need to point at objectives that already exist — so the
 * mode drives the expected columns, the validation and the summary, not just
 * the wording.
 */
export type BulkUploadMode = 'crear' | 'editar' | 'actualizar';

export interface BulkUploadModeConfig {
  id: BulkUploadMode;
  label: string;
  description: string;
  /** Columns the template ships with for this operation. */
  columns: string[];
  /** Sentence describing what the file will do, shown above the dropzone. */
  intent: string;
  /** Label of the confirming button. */
  confirmLabel: string;
  /** Heading for the detected-rows list. */
  rowsHeading: string;
  /** What an unresolved row means for this operation. */
  unresolvedLabel: string;
}

export const BULK_UPLOAD_MODES: BulkUploadModeConfig[] = [
  {
    id: 'crear',
    label: 'Cargar objetivos',
    description: 'Crea objetivos nuevos para los usuarios del ciclo.',
    columns: ['Username', 'Nombre del objetivo', 'Peso (%)', 'Meta', 'Fecha de cierre'],
    intent: 'Se crearán objetivos nuevos. Los que ya existen no se modifican.',
    confirmLabel: 'Cargar objetivos',
    rowsHeading: 'Objetivos a crear',
    unresolvedLabel: 'Nuevo en el ciclo',
  },
  {
    id: 'editar',
    label: 'Editar objetivos',
    description: 'Cambia el nombre, el peso o la meta de objetivos que ya existen.',
    columns: ['ID del objetivo', 'Nombre del objetivo', 'Peso (%)', 'Meta', 'Fecha de cierre'],
    intent: 'Se reemplazará la definición de cada objetivo indicado. El avance registrado no cambia.',
    confirmLabel: 'Editar objetivos',
    rowsHeading: 'Objetivos a editar',
    unresolvedLabel: 'No existe en el ciclo',
  },
  {
    id: 'actualizar',
    label: 'Actualizar objetivos',
    description: 'Registra el avance de objetivos existentes sin tocar su definición.',
    columns: ['ID del objetivo', 'Avance (%)', 'Comentario'],
    intent: 'Solo se actualizará el avance. El nombre, el peso y la meta se mantienen.',
    confirmLabel: 'Actualizar objetivos',
    rowsHeading: 'Objetivos a actualizar',
    unresolvedLabel: 'No existe en el ciclo',
  },
];

export function getModeConfig(mode: BulkUploadMode): BulkUploadModeConfig {
  // The list is exhaustive over the union, so this never falls through.
  return BULK_UPLOAD_MODES.find((entry) => entry.id === mode) ?? BULK_UPLOAD_MODES[0];
}

/** A row the file asks us to act on, resolved against the cycle. */
export interface DetectedObjectiveRow {
  /** Identifier as written in the file: a username when creating, an objective id otherwise. */
  identifier: string;
  objectiveTitle: string;
  /** Present when creating or editing. */
  weightPercent?: number;
  /** Present when updating progress. */
  progressPercent?: number;
  /**
   * False when the row points at something we could not find — a user outside
   * the cycle when creating, or an objective that does not exist otherwise.
   */
  isResolved: boolean;
}

export interface ObjectivesImportWarning {
  id: string;
  title: string;
  detail: string;
  severity: 'warning' | 'info';
}

export interface DetectedObjectivesAnalysis {
  mode: BulkUploadMode;
  fileNames: string[];
  rows: DetectedObjectiveRow[];
  /** Distinct users the file touches. */
  userCount: number;
  /** Rows we could not match against the cycle. */
  unresolvedCount: number;
  warnings: ObjectivesImportWarning[];
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

const SAMPLE_OBJECTIVES = [
  'Aumentar la retención de clientes',
  'Reducir el tiempo de respuesta del equipo',
  'Lanzar el nuevo módulo de reportes',
  'Mejorar el NPS del área',
  'Cerrar el plan de formación del equipo',
  'Optimizar el costo por adquisición',
  'Documentar los procesos críticos',
  'Incrementar la cobertura de pruebas',
];

/**
 * Deterministic pseudo-random source so the same file always produces the same
 * detected structure — a demo that reshuffles on every retry is hard to trust.
 */
function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFrom(text: string): number {
  return [...text].reduce((total, char) => (total * 31 + char.charCodeAt(0)) >>> 0, 11);
}

/** Warnings that only make sense for the operation being performed. */
function buildWarnings(
  mode: BulkUploadMode,
  rows: DetectedObjectiveRow[],
  unresolved: string[]
): ObjectivesImportWarning[] {
  const warnings: ObjectivesImportWarning[] = [];

  if (unresolved.length > 0) {
    warnings.push(
      mode === 'crear'
        ? {
            id: 'unknown-users',
            severity: 'warning',
            title: `${unresolved.length} ${unresolved.length === 1 ? 'usuario no está' : 'usuarios no están'} en el ciclo`,
            detail: 'Se agregarán al ciclo junto con sus objetivos al confirmar la carga.',
          }
        : {
            id: 'unknown-objectives',
            severity: 'warning',
            title: `${unresolved.length} ${unresolved.length === 1 ? 'objetivo no existe' : 'objetivos no existen'} en el ciclo`,
            detail: 'Esas filas se omitirán. Revisa la columna "ID del objetivo" en tu archivo.',
          }
    );
  }

  if (mode === 'actualizar') {
    const overAchieved = rows.filter((row) => (row.progressPercent ?? 0) > 100).length;
    if (overAchieved > 0) {
      warnings.push({
        id: 'progress-over-100',
        severity: 'warning',
        title: `${overAchieved} ${overAchieved === 1 ? 'objetivo supera' : 'objetivos superan'} el 100% de avance`,
        detail: 'Se registrarán tal cual. Verifica que sea intencional y no un error de la meta.',
      });
    }
    warnings.push({
      id: 'definition-untouched',
      severity: 'info',
      title: 'La definición no se modifica',
      detail: 'Esta carga solo actualiza el avance; nombre, peso y meta se mantienen.',
    });
    return warnings;
  }

  // Creating and editing both write weights, so both can break the 100% rule.
  const byUser = new Map<string, number>();
  for (const row of rows) {
    if (!row.isResolved) continue;
    byUser.set(row.identifier, (byUser.get(row.identifier) ?? 0) + (row.weightPercent ?? 0));
  }
  const overweight = [...byUser.values()].filter((total) => total > 100).length;

  if (overweight > 0) {
    warnings.push({
      id: 'weights-over-100',
      severity: 'warning',
      title: `${overweight} ${overweight === 1 ? 'usuario supera' : 'usuarios superan'} el 100% de peso`,
      detail: 'Revisa la columna "Peso (%)" — los pesos de cada usuario deberían sumar 100.',
    });
  }

  warnings.push(
    mode === 'crear'
      ? {
          id: 'existing-objectives',
          severity: 'info',
          title: 'Los objetivos existentes no se modifican',
          detail: 'Esta carga agrega objetivos nuevos; no reemplaza ni borra los que ya están en el ciclo.',
        }
      : {
          id: 'progress-kept',
          severity: 'info',
          title: 'El avance registrado se mantiene',
          detail: 'Editar la definición de un objetivo no reinicia el avance que ya tenía.',
        }
  );

  return warnings;
}

/**
 * Builds the structure the file "contains". Some rows are deliberately left
 * unresolved so the summary has something worth reviewing — a bulk upload that
 * always reports a clean match teaches the user nothing about the step.
 */
function buildAnalysis(
  files: File[],
  mode: BulkUploadMode,
  rosterIdentifiers: string[]
): DetectedObjectivesAnalysis {
  const random = createRandom(seedFrom(`${mode}|${files.map((file) => file.name).join('|')}`));
  const rowCount = 12 + Math.floor(random() * 20);
  const isCreate = mode === 'crear';

  const rows: DetectedObjectiveRow[] = Array.from({ length: rowCount }, (_unused, index) => {
    // Roughly one in six rows points at something we cannot resolve.
    const isResolved = rosterIdentifiers.length > 0 && random() > 0.16;
    const identifier = isResolved
      ? rosterIdentifiers[Math.floor(random() * rosterIdentifiers.length)]
      : isCreate
        ? `nuevo.usuario${index + 1}@example.co`
        : `OBJ-${9000 + index}`;

    return {
      identifier,
      objectiveTitle: SAMPLE_OBJECTIVES[Math.floor(random() * SAMPLE_OBJECTIVES.length)],
      ...(mode === 'actualizar'
        ? { progressPercent: Math.round(random() * 118 * 100) / 100 }
        : { weightPercent: Math.round((5 + random() * 25) * 100) / 100 }),
      isResolved,
    };
  });

  const unresolved = [...new Set(rows.filter((row) => !row.isResolved).map((row) => row.identifier))];
  const distinctUsers = new Set(rows.filter((row) => row.isResolved).map((row) => row.identifier));

  return {
    mode,
    fileNames: files.map((file) => file.name),
    rows,
    userCount: distinctUsers.size + (isCreate ? unresolved.length : 0),
    unresolvedCount: unresolved.length,
    warnings: buildWarnings(mode, rows, unresolved),
  };
}

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

/**
 * Reads the picked files and reports what they contain. The delay stands in for
 * real parsing work so the drawer's progress overlay has something to cover.
 */
export async function analyzeObjectivesFiles(
  files: File[],
  mode: BulkUploadMode,
  rosterIdentifiers: string[]
): Promise<AnalyzeObjectivesOutcome> {
  await new Promise((resolve) => setTimeout(resolve, 400));

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

  if (nameHas(files, 'sin-estructura') || nameHas(files, 'vacio') || nameHas(files, 'vacío')) {
    return {
      kind: 'result',
      result: {
        mode,
        fileNames: files.map((file) => file.name),
        rows: [],
        userCount: 0,
        unresolvedCount: 0,
        warnings: [],
      },
    };
  }

  return { kind: 'result', result: buildAnalysis(files, mode, rosterIdentifiers) };
}
