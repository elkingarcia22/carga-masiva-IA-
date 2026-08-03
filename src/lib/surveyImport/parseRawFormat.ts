import * as XLSX from "xlsx";
import type { NpsBreakdown, ParsedSurveyFile } from "./types";
import { sheetRows, cellText, extractYear, dedupeStrings, titleCase } from "./xlsxUtils";

const RECOMMENDATION_HINTS = ["0 a un 10", "0 a 10", "probable es que recomiendes"];

function demographicLabelFromColumn(columnName: string): string {
  return titleCase(columnName.replace(/^optional_/, "").replace(/#list$/, ""));
}

interface EnpsResult {
  enps: number | null;
  breakdown: NpsBreakdown | null;
}

/** Classifies raw 0-10 recommendation scores into a true eNPS plus its promoter/passive/detractor split. */
function computeEnpsFromScores(rawScores: number[]): EnpsResult {
  const finite = rawScores.filter((s) => Number.isFinite(s));
  if (finite.length === 0) return { enps: null, breakdown: null };

  const min = Math.min(...finite);
  const max = Math.max(...finite);
  // The 0-10 recommendation scale is sometimes exported shifted by one
  // (stored as 1-11 instead of 0-10, with 11 meaning the top score) —
  // detected here and corrected before classifying promoters/detractors.
  const scores = min >= 1 && max === 11 ? finite.map((s) => s - 1) : finite;
  if (scores.some((s) => s < 0 || s > 10)) return { enps: null, breakdown: null };

  const total = scores.length;
  const promoters = scores.filter((s) => s >= 9).length;
  const detractors = scores.filter((s) => s <= 6).length;
  const passives = total - promoters - detractors;
  const pct = (n: number) => Math.round((n / total) * 1000) / 10;

  return {
    enps: Math.round(((promoters - detractors) / total) * 100),
    breakdown: { promotores: pct(promoters), neutrales: pct(passives), detractores: pct(detractors) },
  };
}

/**
 * Parses the "raw" export format: one row per respondent (`answers`), a full
 * question catalog (`Dimensions`), and the complete employee roster
 * (`colaboradores`) — the only format that lets us compute exact
 * participation and a true eNPS score.
 */
export function parseRawFormat(fileName: string, workbook: XLSX.WorkBook): ParsedSurveyFile {
  const answersRows = sheetRows(workbook.Sheets["answers"]);
  const colaboradoresRows = sheetRows(workbook.Sheets["colaboradores"]);
  const dimensionsRows = workbook.Sheets["Dimensions"] ? sheetRows(workbook.Sheets["Dimensions"]) : [];

  const answersHeader = (answersRows[0] ?? []).map(cellText);
  const respondents = Math.max(answersRows.length - 1, 0);
  const invited = Math.max(colaboradoresRows.length - 1, 0);

  const demographics = dedupeStrings(
    answersHeader.filter((col) => col.startsWith("optional_")).map(demographicLabelFromColumn)
  );

  const questions = dedupeStrings(dimensionsRows.slice(1).map((row) => cellText(row?.[0])));

  // Try to compute a real eNPS from the recommendation question's raw 0-10 scores.
  let enps: number | null = null;
  let npsBreakdown: NpsBreakdown | null = null;
  const recommendationRow = dimensionsRows
    .slice(1)
    .find((row) => RECOMMENDATION_HINTS.some((hint) => cellText(row?.[0]).toLowerCase().includes(hint)));

  if (recommendationRow) {
    const identifier = cellText(recommendationRow[1]);
    const colIndex = answersHeader.indexOf(identifier);
    if (colIndex >= 0) {
      const scores = answersRows
        .slice(1)
        .map((row) => Number(row?.[colIndex]))
        .filter((n) => Number.isFinite(n));
      const result = computeEnpsFromScores(scores);
      enps = result.enps;
      npsBreakdown = result.breakdown;
    }
  }

  return {
    fileName,
    format: "raw",
    isConsolidatedTotal: false,
    surveyName: null,
    surveyYear: extractYear(fileName),
    respondents,
    invited,
    sections: [],
    questions,
    demographics,
    favorabilityPositivePct: null,
    enps,
    enpsApproxPositivePct: null,
    reportDate: null,
    areaBreakdown: [],
    sectionFavorability: [],
    // The raw export has no aggregated perception splits or dimension map, so
    // favorability and section counts are left to the report files in the batch.
    favorabilityBreakdown: null,
    npsBreakdown,
    sectionDetails: [],
    // No dimension map in the raw export, so questions carry no section here.
    questionDetails: questions.map((text) => ({ text, section: null })),
  };
}
