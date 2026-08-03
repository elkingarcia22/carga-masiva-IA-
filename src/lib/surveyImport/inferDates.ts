export interface InferredDateRange {
  start: Date;
  end: Date;
}

const QUARTER_RANGES: Record<number, [[number, number], [number, number]]> = {
  1: [[0, 1], [2, 31]],
  2: [[3, 1], [5, 30]],
  3: [[6, 1], [8, 30]],
  4: [[9, 1], [11, 31]],
};

const MONTH_NAMES: Record<string, number> = {
  enero: 0,
  febrero: 1,
  marzo: 2,
  abril: 3,
  mayo: 4,
  junio: 5,
  julio: 6,
  agosto: 7,
  septiembre: 8,
  setiembre: 8,
  octubre: 9,
  noviembre: 10,
  diciembre: 11,
};

function lastDayOfMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

/**
 * Infers a plausible survey start/end date range from its name, e.g.
 * "Clima Organizacional - Q1 2026" → Jan 1 – Mar 31, 2026, or
 * "Encuesta de Marzo 2025" → Mar 1 – Mar 31, 2025. Returns null when the
 * name doesn't carry a recognizable period; the result is only a suggestion
 * the user can still adjust.
 */
export function inferDateRangeFromName(name: string): InferredDateRange | null {
  const yearMatch = name.match(/20\d{2}/);
  if (!yearMatch) return null;
  const year = parseInt(yearMatch[0], 10);

  const quarterMatch = name.match(/\bQ([1-4])\b/i);
  if (quarterMatch) {
    const quarter = parseInt(quarterMatch[1], 10);
    const [[startMonth, startDay], [endMonth, endDay]] = QUARTER_RANGES[quarter];
    return {
      start: new Date(year, startMonth, startDay),
      end: new Date(year, endMonth, endDay),
    };
  }

  const monthMatch = name.toLowerCase().match(/enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre/);
  if (monthMatch) {
    const monthIndex = MONTH_NAMES[monthMatch[0]];
    return {
      start: new Date(year, monthIndex, 1),
      end: new Date(year, monthIndex, lastDayOfMonth(year, monthIndex)),
    };
  }

  return null;
}
