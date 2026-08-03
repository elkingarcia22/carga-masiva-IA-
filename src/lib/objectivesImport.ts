/**
 * Mock analysis pipeline for the objectives bulk upload.
 *
 * Mirrors how the historical survey load works: the drawer hands over the picked
 * files, this reads them (here, simulated) and answers with either a blocking
 * error, an empty result, or the structure it detected. Outcomes are driven by
 * the file name so the demo files under `demo-samples/` can walk through every
 * state without needing real parsing.
 */

/** A row the file asks us to create, resolved against the cycle's roster. */
export interface DetectedObjectiveRow {
  /** Identifier as written in the file (username or email). */
  identifier: string;
  /** Display name, when the file carries one. */
  name?: string;
  objectiveTitle: string;
  weightPercent: number;
  /** False when the identifier matched nobody in the cycle. */
  isKnownUser: boolean;
}

export interface ObjectivesImportWarning {
  id: string;
  title: string;
  detail: string;
  severity: 'warning' | 'info';
}

export interface DetectedObjectivesAnalysis {
  fileNames: string[];
  rows: DetectedObjectiveRow[];
  /** Distinct users the file touches. */
  userCount: number;
  /** Users already on the cycle's roster. */
  knownUserCount: number;
  /** Identifiers we could not resolve — these become new assignments. */
  unknownIdentifiers: string[];
  warnings: ObjectivesImportWarning[];
}

export type AnalyzeObjectivesOutcome =
  | { kind: 'error'; variant: 'validation' | 'parse'; title: string; detail: string }
  | { kind: 'result'; result: DetectedObjectivesAnalysis };

/** Extensions the bulk upload accepts. */
export const OBJECTIVES_IMPORT_ACCEPT = '.csv,.xls,.xlsx';
export const OBJECTIVES_IMPORT_MAX_MB = 10;

/** Columns the template ships with, shown to the user before they upload. */
export const OBJECTIVES_TEMPLATE_COLUMNS = [
  'Username',
  'Nombre del objetivo',
  'Peso (%)',
  'Meta',
  'Fecha de cierre',
];

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

/**
 * Builds the structure the file "contains". Some identifiers are deliberately
 * left unresolved so the summary has something worth reviewing — a bulk upload
 * that always reports a clean match teaches the user nothing about the step.
 */
function buildAnalysis(files: File[], rosterIdentifiers: string[]): DetectedObjectivesAnalysis {
  const random = createRandom(seedFrom(files.map((file) => file.name).join('|')));
  const rowCount = 12 + Math.floor(random() * 20);

  const rows: DetectedObjectiveRow[] = Array.from({ length: rowCount }, (_unused, index) => {
    // Roughly one in six rows points at somebody outside the cycle.
    const isKnownUser = rosterIdentifiers.length > 0 && random() > 0.16;
    const identifier = isKnownUser
      ? rosterIdentifiers[Math.floor(random() * rosterIdentifiers.length)]
      : `nuevo.usuario${index + 1}@example.co`;

    return {
      identifier,
      objectiveTitle: SAMPLE_OBJECTIVES[Math.floor(random() * SAMPLE_OBJECTIVES.length)],
      weightPercent: Math.round((5 + random() * 25) * 100) / 100,
      isKnownUser,
    };
  });

  const unknownIdentifiers = [...new Set(rows.filter((row) => !row.isKnownUser).map((row) => row.identifier))];
  const knownIdentifiers = new Set(rows.filter((row) => row.isKnownUser).map((row) => row.identifier));

  const warnings: ObjectivesImportWarning[] = [];

  if (unknownIdentifiers.length > 0) {
    warnings.push({
      id: 'unknown-users',
      severity: 'warning',
      title: `${unknownIdentifiers.length} ${unknownIdentifiers.length === 1 ? 'usuario no está' : 'usuarios no están'} en el ciclo`,
      detail: 'Se agregarán al ciclo junto con sus objetivos al confirmar la carga.',
    });
  }

  // Weights per user rarely land on exactly 100 in a hand-made file.
  const overweightUsers = [...knownIdentifiers].filter((identifier) => {
    const total = rows
      .filter((row) => row.identifier === identifier)
      .reduce((sum, row) => sum + row.weightPercent, 0);
    return total > 100;
  });

  if (overweightUsers.length > 0) {
    warnings.push({
      id: 'weights-over-100',
      severity: 'warning',
      title: `${overweightUsers.length} ${overweightUsers.length === 1 ? 'usuario supera' : 'usuarios superan'} el 100% de peso`,
      detail: 'Revisa la columna "Peso (%)" — los pesos de cada usuario deberían sumar 100.',
    });
  }

  warnings.push({
    id: 'existing-objectives',
    severity: 'info',
    title: 'Los objetivos existentes no se modifican',
    detail: 'Esta carga agrega objetivos nuevos; no reemplaza ni borra los que ya están en el ciclo.',
  });

  return {
    fileNames: files.map((file) => file.name),
    rows,
    userCount: knownIdentifiers.size + unknownIdentifiers.length,
    knownUserCount: knownIdentifiers.size,
    unknownIdentifiers,
    warnings,
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
        fileNames: files.map((file) => file.name),
        rows: [],
        userCount: 0,
        knownUserCount: 0,
        unknownIdentifiers: [],
        warnings: [],
      },
    };
  }

  return { kind: 'result', result: buildAnalysis(files, rosterIdentifiers) };
}
