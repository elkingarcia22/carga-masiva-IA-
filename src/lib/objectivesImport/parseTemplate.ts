/**
 * Reads the official UBITS objectives templates for real (no mocking).
 *
 * Columns are located by name rather than by position, which is not pedantry:
 * the shipped templates disagree with each other. `create-goals-template` orders
 * the thresholds `cumplimiento_maximo, cumplimiento_minimo` while
 * `edite-goals-template` orders them the other way round, so anything reading by
 * index would silently swap a floor for a ceiling.
 *
 * Header matching is accent- and case-insensitive and tolerates spaces instead
 * of underscores, so a file re-saved by hand still lands.
 */

import * as XLSX from 'xlsx';
import type { MeasureType, ParsedObjective, Trend } from './types';

/** Accepted spellings per canonical column. First match in the row wins. */
const COLUMN_ALIASES: Record<string, string[]> = {
  username: ['username', 'usuario', 'user', 'correo', 'email', 'documento'],
  title: ['nombre_objetivo', 'objetivo', 'titulo', 'nombre_del_objetivo'],
  newTitle: ['nombre_objetivo_nuevo'],
  weight: ['peso', 'peso_porcentaje', 'ponderacion'],
  measureType: ['tipo_medida', 'tipo_de_medida', 'medida'],
  trend: ['aumentar_reducir', 'tendencia', 'direccion'],
  initialValue: ['valor_inicial', 'inicial'],
  minProgress: ['cumplimiento_minimo', 'minimo_avance', 'avance_minimo', 'minimo'],
  maxProgress: ['cumplimiento_maximo', 'maximo_avance', 'avance_maximo', 'maximo'],
  target: ['meta', 'target'],
  description: ['descripcion_meta', 'descripcion', 'descripcion_objetivo'],
  currentProgress: ['avance_actual', 'avance'],
  newProgress: ['nuevo_avance', 'avance_nuevo', 'avance_a_registrar'],
};

/** Columns without which a sheet is not an objectives template. */
const REQUIRED_COLUMNS = ['username', 'title'] as const;

/** Rows scanned looking for the header before giving up. */
const HEADER_SEARCH_DEPTH = 25;
/** Consecutive blank rows that end the data block. */
const BLANK_ROW_RUN_LIMIT = 15;

/** `Tipo de medida` → canonical value. Keys are already normalised. */
const MEASURE_TYPE_ALIASES: Array<[MeasureType, string[]]> = [
  ['Dinero', ['dinero', 'money', 'moneda', 'currency', 'monto', 'valor']],
  ['Porcentaje', ['porcentaje', 'porcentual', 'percent', 'percentage', 'pct']],
  ['Numérico', ['numerico', 'numero', 'number', 'cantidad', 'unidades', 'num']],
  [
    'Se cumple / No se cumple',
    ['se_cumple_no_se_cumple', 'se_cumple', 'cumple', 'binario', 'si_no', 'boolean', 'booleano'],
  ],
];

/**
 * `Aumentar/Reducir` → canonical value. `directo`/`inverso` are included because
 * that is the wording performance-evaluation files use for the same idea.
 */
const TREND_ALIASES: Array<[Trend, string[]]> = [
  ['Aumentar', ['aumentar', 'incremento', 'incrementar', 'subir', 'directo', 'increase', 'up']],
  ['Reducir', ['reducir', 'decremento', 'disminuir', 'bajar', 'inverso', 'decrease', 'down']],
];

/** Lowercases, drops accents and collapses punctuation into single underscores. */
export function normalizeKey(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function matchAlias(normalized: string, aliases: string[]): boolean {
  return aliases.includes(normalized);
}

/**
 * Reads a number out of a cell that may be a real number, a percentage string,
 * or a Spanish-formatted decimal. Returns null for blanks so a missing initial
 * value stays distinguishable from a zero.
 */
export function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'boolean') return value ? 1 : 0;

  const text = String(value).trim();
  if (text === '') return null;

  const isNegative = /^\(.*\)$/.test(text) || text.startsWith('-');
  // Strip currency marks, percent signs, spaces and non-breaking spaces. The
  // NBSP is written as an escape rather than pasted literally: Excel exports it
  // constantly, but a literal one here is invisible to whoever reads this next.
  let cleaned = text.replace(/[()\s\u00A0$%#]/g, '').replace(/^[-+]/, '');
  if (cleaned === '') return null;

  const hasDot = cleaned.includes('.');
  const hasComma = cleaned.includes(',');

  if (hasDot && hasComma) {
    // Whichever separator comes last is the decimal one.
    const decimalSeparator = cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.') ? ',' : '.';
    const thousandsSeparator = decimalSeparator === ',' ? '.' : ',';
    cleaned = cleaned.split(thousandsSeparator).join('');
    cleaned = cleaned.replace(decimalSeparator, '.');
  } else if (hasComma) {
    // "1,234" is a thousands group; "13,7" is a Spanish decimal.
    cleaned = /^\d{1,3}(,\d{3})+$/.test(cleaned)
      ? cleaned.split(',').join('')
      : cleaned.replace(',', '.');
  } else if (hasDot && /^\d{1,3}(\.\d{3})+$/.test(cleaned)) {
    cleaned = cleaned.split('.').join('');
  }

  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed)) return null;
  return isNegative ? -Math.abs(parsed) : parsed;
}

function toText(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).replace(/\s+/g, ' ').trim();
}

export function toMeasureType(value: unknown): MeasureType | null {
  const normalized = normalizeKey(value);
  if (normalized === '') return null;
  for (const [canonical, aliases] of MEASURE_TYPE_ALIASES) {
    if (aliases.some((alias) => normalized === alias || normalized.startsWith(alias))) {
      return canonical;
    }
  }
  return null;
}

export function toTrend(value: unknown): Trend | null {
  const normalized = normalizeKey(value);
  if (normalized === '') return null;
  for (const [canonical, aliases] of TREND_ALIASES) {
    if (aliases.some((alias) => normalized === alias || normalized.startsWith(alias))) {
      return canonical;
    }
  }
  return null;
}

type ColumnMap = Partial<Record<keyof typeof COLUMN_ALIASES, number>>;

interface HeaderLocation {
  rowIndex: number;
  columns: ColumnMap;
}

/** Finds the header row and maps each canonical column to its position. */
function locateHeader(rows: unknown[][]): HeaderLocation | null {
  const depth = Math.min(rows.length, HEADER_SEARCH_DEPTH);

  for (let rowIndex = 0; rowIndex < depth; rowIndex++) {
    const row = rows[rowIndex];
    if (!Array.isArray(row)) continue;

    const columns: ColumnMap = {};
    row.forEach((cell, columnIndex) => {
      const normalized = normalizeKey(cell);
      if (normalized === '') return;
      for (const [canonical, aliases] of Object.entries(COLUMN_ALIASES)) {
        const key = canonical as keyof typeof COLUMN_ALIASES;
        if (columns[key] === undefined && matchAlias(normalized, aliases)) {
          columns[key] = columnIndex;
          return;
        }
      }
    });

    if (REQUIRED_COLUMNS.every((column) => columns[column] !== undefined)) {
      return { rowIndex, columns };
    }
  }

  return null;
}

/**
 * Which template the sheet turned out to be, read off its columns alone.
 *
 * Only the two columns that exist in exactly one template are reported, because
 * they are the only ones that identify a file rather than merely fit it. The
 * three templates overlap almost completely — `editar` is `crear` plus a rename
 * column — so "has the columns of X" proves nothing on its own, while "has
 * `nuevo_avance`" can only come from an update file.
 *
 * Read before the mode is consulted, so the answer is about the file and not
 * about what the user said the file was.
 */
export interface TemplateSignature {
  /** `nuevo_avance` — only the "actualizar" template carries it. */
  hasNewProgress: boolean;
  /** `nombre_objetivo_nuevo` — only the "editar" template carries it. */
  hasNewTitle: boolean;
}

export interface TemplateParseResult {
  sheetName: string;
  objectives: ParsedObjective[];
  /** Rows found but dropped because they had no username or no title. */
  skippedRows: number;
  /** Things worth telling the user about how the file was read. */
  notes: string[];
  /** What the columns say this file is, regardless of the chosen operation. */
  signature: TemplateSignature;
}

/**
 * Weights come in as either percentages (10 for 10%) or fractions (0.1), which
 * is how every performance-evaluation spreadsheet writes them. Deciding per file
 * rather than per row keeps a legitimate 1% from being read as 100%.
 *
 * The fraction reading only wins when no weight exceeds 1 *and* at least one
 * user's weights land on 1.0 — that pair of facts is what a fraction-scaled file
 * looks like, and a percentage-scaled file essentially never matches both.
 */
function shouldScaleWeights(rawWeights: Array<{ username: string; weight: number }>): boolean {
  const weights = rawWeights.filter((entry) => Number.isFinite(entry.weight));
  if (weights.length === 0) return false;
  if (weights.some((entry) => entry.weight > 1)) return false;

  const totals = new Map<string, number>();
  weights.forEach((entry) => {
    totals.set(entry.username, (totals.get(entry.username) ?? 0) + entry.weight);
  });

  return [...totals.values()].some((total) => Math.abs(total - 1) < 0.01);
}

/**
 * Parses one sheet as an objectives template.
 *
 * Returns null when the sheet has no recognisable header, which is how the
 * caller tells "this is a different kind of file" apart from "this template is
 * empty".
 */
export interface ParseOptions {
  /**
   * True for an edit load, where each row names an objective that should already
   * exist rather than describing a new one.
   *
   * All it does here is seed an unresolved `link` carrying the name the row
   * searched by; the matching itself needs the user resolved first, so it happens
   * later in `linkGroupObjectives`. Seeding it at parse time rather than inferring
   * it downstream is what lets every later stage tell an edit row from a create
   * row without being passed the mode.
   */
  linkByName?: boolean;
  /**
   * True for an "actualizar" load, whose rows record progress instead of
   * describing an objective.
   *
   * What it changes here is only what gets carried out of the sheet: the row's
   * `nuevo_avance` becomes `newProgress` — present even when blank, since a
   * blank one is the error this mode exists to catch — and its `avance_actual`
   * is kept as the file's own claim rather than as the truth. The definition
   * columns that template echoes are read too, but linking overwrites them with
   * UBITS's copy; see `linkGroup`.
   */
  progressUpdate?: boolean;
}

export function parseObjectivesSheet(
  sheet: XLSX.WorkSheet,
  sheetName: string,
  idPrefix: string,
  options: ParseOptions = {}
): TemplateParseResult | null {
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: true }) as unknown[][];
  const header = locateHeader(rows);
  if (!header) return null;

  const { columns } = header;
  const cellAt = (row: unknown[], key: keyof typeof COLUMN_ALIASES): unknown => {
    const index = columns[key];
    return index === undefined ? null : row?.[index];
  };

  interface DraftRow {
    sourceRow: number;
    username: string;
    title: string;
    /** The `nombre_objetivo` cell verbatim — what an edit file searches UBITS by. */
    lookupTitle: string;
    rawWeight: number | null;
    measureType: MeasureType | null;
    trend: Trend | null;
    initialValue: number | null;
    target: number | null;
    minProgress: number | null;
    maxProgress: number | null;
    description: string;
    currentProgress: number | null;
    newProgress: number | null;
  }

  const drafts: DraftRow[] = [];
  let skippedRows = 0;
  let blankRun = 0;
  let unreadableMeasureTypes = 0;
  let unreadableTrends = 0;

  for (let rowIndex = header.rowIndex + 1; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    const isBlank = !Array.isArray(row) || row.every((cell) => toText(cell) === '');

    if (isBlank) {
      blankRun += 1;
      // A long gap means the data block ended; a short one is just a spacer.
      if (blankRun >= BLANK_ROW_RUN_LIMIT) break;
      continue;
    }
    blankRun = 0;

    const username = toText(cellAt(row, 'username'));
    // An edit file renames through `nombre_objetivo_nuevo`; the new name is the
    // one worth reviewing, so it wins when present. `nombre_objetivo` is kept
    // separately regardless, because on an edit load it is not a title at all —
    // it is the search term that has to find the objective in UBITS.
    const lookupTitle = toText(cellAt(row, 'title'));
    const newTitle = toText(cellAt(row, 'newTitle'));
    const title = newTitle !== '' ? newTitle : lookupTitle;

    if (username === '' || title === '') {
      skippedRows += 1;
      continue;
    }

    const measureType = toMeasureType(cellAt(row, 'measureType'));
    const trend = toTrend(cellAt(row, 'trend'));
    if (measureType === null && columns.measureType !== undefined) unreadableMeasureTypes += 1;
    if (trend === null && columns.trend !== undefined) unreadableTrends += 1;

    drafts.push({
      sourceRow: rowIndex + 1,
      username,
      title,
      lookupTitle,
      rawWeight: toNumber(cellAt(row, 'weight')),
      measureType,
      trend,
      initialValue: toNumber(cellAt(row, 'initialValue')),
      target: toNumber(cellAt(row, 'target')),
      minProgress: toNumber(cellAt(row, 'minProgress')),
      maxProgress: toNumber(cellAt(row, 'maxProgress')),
      description: toText(cellAt(row, 'description')),
      currentProgress: toNumber(cellAt(row, 'currentProgress')),
      newProgress: toNumber(cellAt(row, 'newProgress')),
    });
  }

  const scaleWeights = shouldScaleWeights(
    drafts.map((draft) => ({ username: draft.username, weight: draft.rawWeight ?? NaN }))
  );

  const objectives: ParsedObjective[] = drafts.map((draft, index) => ({
    id: `${idPrefix}-${draft.sourceRow}-${index}`,
    sourceRow: draft.sourceRow,
    username: draft.username,
    title: draft.title,
    weightPercent:
      draft.rawWeight === null
        ? NaN
        : Math.round((scaleWeights ? draft.rawWeight * 100 : draft.rawWeight) * 100) / 100,
    // A blank type is far more often "Numérico" than a broken row, and the review
    // table lets the user change it before anything is loaded.
    measureType: draft.measureType ?? 'Numérico',
    trend: draft.trend ?? 'Aumentar',
    initialValue: draft.initialValue,
    target: draft.target ?? NaN,
    minProgress: draft.minProgress,
    maxProgress: draft.maxProgress,
    description: draft.description,
    // On a progress load the sheet's `avance_actual` is only context for
    // whoever filled the file in — the real value is always read live off the
    // linked target, so it is left for linking to fill in.
    ...(options.progressUpdate
      ? { currentProgress: null, newProgress: draft.newProgress }
      : { currentProgress: draft.currentProgress }),
    ...(options.linkByName
      ? {
          link: {
            status: 'unmatched' as const,
            isManual: false,
            lookupTitle: draft.lookupTitle,
          },
        }
      : {}),
  }));

  const notes: string[] = [];
  if (scaleWeights) {
    notes.push('Los pesos venían como fracción (0,1) y se convirtieron a porcentaje (10%).');
  }
  if (unreadableMeasureTypes > 0) {
    notes.push(
      `${unreadableMeasureTypes} ${unreadableMeasureTypes === 1 ? 'fila no traía' : 'filas no traían'} un tipo de medida reconocible; se asumió "Numérico".`
    );
  }
  if (unreadableTrends > 0) {
    notes.push(
      `${unreadableTrends} ${unreadableTrends === 1 ? 'fila no traía' : 'filas no traían'} dirección reconocible; se asumió "Aumentar".`
    );
  }
  if (skippedRows > 0) {
    notes.push(
      `${skippedRows} ${skippedRows === 1 ? 'fila se omitió' : 'filas se omitieron'} por no tener usuario o título.`
    );
  }

  return {
    sheetName,
    objectives,
    skippedRows,
    notes,
    signature: {
      hasNewProgress: columns.newProgress !== undefined,
      hasNewTitle: columns.newTitle !== undefined,
    },
  };
}

/** Parses the first sheet that looks like an objectives template. */
export function parseObjectivesWorkbook(
  data: ArrayBuffer,
  idPrefix: string,
  options: ParseOptions = {}
): TemplateParseResult | null {
  const workbook = XLSX.read(data, { type: 'array' });

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;
    const result = parseObjectivesSheet(sheet, sheetName, idPrefix, options);
    // A recognisable header with no rows is still a template — report it as
    // empty rather than falling through to the next sheet.
    if (result) return result;
  }

  return null;
}
