import * as XLSX from "xlsx";

export function sheetRows(ws: XLSX.WorkSheet): unknown[][] {
  return XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: true }) as unknown[][];
}

export function cellText(value: unknown): string {
  return value === null || value === undefined ? "" : String(value).trim();
}

/** Finds the first row index whose column A (and, if given, column B) matches the expected text. */
export function findRowIndex(rows: unknown[][], colA: string, colB?: string): number {
  for (let i = 0; i < rows.length; i++) {
    const a = cellText(rows[i]?.[0]);
    if (a !== colA) continue;
    if (colB !== undefined && cellText(rows[i]?.[1]) !== colB) continue;
    return i;
  }
  return -1;
}

export function extractYear(text: string): number | null {
  const match = text.match(/20\d{2}/);
  return match ? parseInt(match[0], 10) : null;
}

const SPANISH_MONTH_ABBR: Record<string, number> = {
  ENE: 0, FEB: 1, MAR: 2, ABR: 3, MAY: 4, JUN: 5,
  JUL: 6, AGO: 7, SEP: 8, OCT: 9, NOV: 10, DIC: 11,
};

/** Parses report-header dates like "Fecha: 26-MAR-2026" into a real Date. */
export function parseSpanishReportDate(text: string): Date | null {
  const match = text.match(/(\d{1,2})-([A-Za-zÁÉÍÓÚáéíóú]{3})-(\d{4})/);
  if (!match) return null;

  const month = SPANISH_MONTH_ABBR[match[2].toUpperCase()];
  if (month === undefined) return null;

  return new Date(parseInt(match[3], 10), month, parseInt(match[1], 10));
}

export function dedupeStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

/** Title-cases a label so the same demographic/dimension name matches across files regardless of source casing (e.g. "RANGO EDAD" vs "Rango Edad"). */
export function titleCase(text: string): string {
  return text
    .toLowerCase()
    .split(/\s+/)
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(" ");
}

/** Dedupes strings case-insensitively, keeping a single title-cased form per value. */
export function dedupeStringsCaseInsensitive(values: string[]): string[] {
  const seen = new Map<string, string>();
  values.forEach((v) => {
    const trimmed = v.trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase();
    if (!seen.has(key)) seen.set(key, titleCase(trimmed));
  });
  return Array.from(seen.values());
}
