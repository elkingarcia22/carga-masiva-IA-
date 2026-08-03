import * as XLSX from "xlsx";
import type {
  AreaParticipation,
  FavorabilityBreakdown,
  NpsBreakdown,
  ParsedSurveyFile,
  QuestionDetail,
  SectionDetail,
  SectionFavorability,
} from "./types";
import { sheetRows, cellText, findRowIndex, extractYear, dedupeStrings, titleCase, parseSpanishReportDate } from "./xlsxUtils";

const REPORT_SHEETS = ["Clima", "Engagement", "eNPS"] as const;

/** Builds a neg/neu/pos breakdown, dropping it entirely if no part is a finite number. */
function toBreakdown(neg: number, neu: number, pos: number): FavorabilityBreakdown | null {
  if (![neg, neu, pos].every((n) => Number.isFinite(n))) return null;
  return {
    desfavorable: Math.round(neg * 10) / 10,
    neutral: Math.round(neu * 10) / 10,
    favorable: Math.round(pos * 10) / 10,
  };
}

/** Reinterprets a neg/neu/pos split as an eNPS detractor/passive/promoter split. */
function toNps(breakdown: FavorabilityBreakdown | null): NpsBreakdown | null {
  if (!breakdown) return null;
  return { detractores: breakdown.desfavorable, neutrales: breakdown.neutral, promotores: breakdown.favorable };
}

/** Dedupes questions by text (case-insensitive), keeping the variant that carries a section. */
export function dedupeQuestionDetails(details: QuestionDetail[]): QuestionDetail[] {
  const byText = new Map<string, QuestionDetail>();
  details.forEach((qd) => {
    const key = qd.text.trim().toLowerCase();
    const existing = byText.get(key);
    if (!existing) byText.set(key, qd);
    else if (!existing.section && qd.section) byText.set(key, { ...existing, section: qd.section });
  });
  return Array.from(byText.values());
}

interface ByAreaSheetResult {
  respondents: number | null;
  invited: number | null;
  indicatorPositivePct: number | null;
  /** Full negative/neutral/positive split for the key indicator on this sheet. */
  indicatorBreakdown: FavorabilityBreakdown | null;
  sections: string[];
  sectionDetails: SectionDetail[];
  questions: string[];
  questionDetails: QuestionDetail[];
  areaBreakdown: AreaParticipation[];
  sectionFavorability: SectionFavorability[];
}

/** Parses the "Resultados Generales" pivot: rows = areas, columns = Dimension → Pregunta groups. */
function parseByAreaSheet(rows: unknown[][]): ByAreaSheetResult | null {
  const headerRowIdx = findRowIndex(rows, "Área:");
  if (headerRowIdx < 1) return null;

  const groupRow = rows[headerRowIdx - 1] ?? [];
  const headerRow = rows[headerRowIdx] ?? [];
  const colCount = Math.max(groupRow.length, headerRow.length);

  let indicatorCol = -1;
  const sections: string[] = [];
  const sectionDetails: SectionDetail[] = [];
  const questions: string[] = [];
  const questionDetails: QuestionDetail[] = [];
  let currentSection: string | null = null;
  const dimensionCols: { col: number; name: string }[] = [];

  for (let c = 0; c < colCount; c++) {
    const groupLabel = cellText(groupRow[c]);
    const headerLabel = cellText(headerRow[c]);
    if (groupLabel === "Indicador Clave") indicatorCol = c;
    if (groupLabel === "Dimension" && headerLabel) {
      sections.push(headerLabel);
      sectionDetails.push({ name: headerLabel, questionCount: 0 });
      dimensionCols.push({ col: c, name: headerLabel });
      currentSection = headerLabel;
    }
    if (groupLabel === "Pregunta" && headerLabel) {
      questions.push(headerLabel);
      questionDetails.push({ text: headerLabel, section: currentSection });
      // Columns run Dimension → its Preguntas → next Dimension, so each question
      // belongs to the section that most recently opened.
      if (sectionDetails.length > 0) sectionDetails[sectionDetails.length - 1].questionCount += 1;
    }
  }

  // Data rows come in blocks of 3 (Negativa / Neutra / Positiva). The first
  // block is the file's own top-level area/department (its overall scope);
  // subsequent blocks are its internal sub-areas — real data, kept here only
  // for display, since summing them on top of the top block would double
  // count the same people.
  const areaBreakdown: AreaParticipation[] = [];
  let i = headerRowIdx + 1;
  while (i < rows.length && cellText(rows[i]?.[0])) {
    const area = cellText(rows[i][0]);
    const respondentsRaw = Number(rows[i][2]);
    const invitedRaw = Number(rows[i][3]);
    if (Number.isFinite(respondentsRaw) && Number.isFinite(invitedRaw) && invitedRaw > 0) {
      areaBreakdown.push({
        area,
        respondents: respondentsRaw,
        invited: invitedRaw,
        participationRate: Math.round((respondentsRaw / invitedRaw) * 1000) / 10,
      });
    }
    i += 3;
  }

  // The first data block holds the top-level scope's three rows in order:
  // Percepción Negativa / Neutra / Positiva.
  const topNegativaRow = rows[headerRowIdx + 1] ?? [];
  const topNeutraRow = rows[headerRowIdx + 2] ?? [];
  const topPositivaRow = rows[headerRowIdx + 3] ?? [];
  const indicatorRaw = indicatorCol >= 0 ? Number(topPositivaRow[indicatorCol]) : NaN;
  const indicatorBreakdown =
    indicatorCol >= 0
      ? toBreakdown(Number(topNegativaRow[indicatorCol]), Number(topNeutraRow[indicatorCol]), Number(topPositivaRow[indicatorCol]))
      : null;

  const sectionFavorability: SectionFavorability[] = dimensionCols.reduce<SectionFavorability[]>((acc, { col, name }) => {
    const value = Number(topPositivaRow[col]);
    if (Number.isFinite(value)) acc.push({ section: name, positivePct: value });
    return acc;
  }, []);

  return {
    respondents: areaBreakdown[0]?.respondents ?? null,
    invited: areaBreakdown[0]?.invited ?? null,
    indicatorPositivePct: Number.isFinite(indicatorRaw) ? indicatorRaw : null,
    indicatorBreakdown,
    sections,
    sectionDetails,
    questions,
    questionDetails,
    areaBreakdown,
    sectionFavorability,
  };
}

interface ByDemographicResult {
  demographics: string[];
  sections: string[];
  sectionDetails: SectionDetail[];
  questions: string[];
  questionDetails: QuestionDetail[];
  indicatorPositivePct: number | null;
  indicatorBreakdown: FavorabilityBreakdown | null;
  /** "Total de respuestas" for the company-wide (EMPRESA) column. */
  respondents: number | null;
}

/** Parses the "Reporte específico de opcionales" cross-tab: rows = items, columns = demographic segments. */
function parseByDemographicSheet(rows: unknown[][]): ByDemographicResult | null {
  const headerRowIdx = findRowIndex(rows, "Tipo de item", "Item");
  if (headerRowIdx < 2) return null;

  const categoryHeaderRow = (rows[headerRowIdx - 2] ?? []).map(cellText);
  const demographics = dedupeStrings(categoryHeaderRow.filter(Boolean).map(titleCase));

  const sections: string[] = [];
  const sectionDetails: SectionDetail[] = [];
  const questions: string[] = [];
  const questionDetails: QuestionDetail[] = [];
  let currentSection: string | null = null;
  let empresaCol = -1;
  categoryHeaderRow.forEach((label, c) => {
    if (label === "EMPRESA" && empresaCol === -1) empresaCol = c;
  });

  let indicatorPositivePct: number | null = null;
  let indicatorBreakdown: FavorabilityBreakdown | null = null;
  let respondents: number | null = null;

  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const row = rows[i] ?? [];
    const type = cellText(row[0]);
    const text = cellText(row[1]);
    if (!text) continue;
    if (type === "Dimension") {
      sections.push(text);
      sectionDetails.push({ name: text, questionCount: 0 });
      currentSection = text;
    }
    if (type === "Pregunta") {
      questions.push(text);
      questionDetails.push({ text, section: currentSection });
      if (sectionDetails.length > 0) sectionDetails[sectionDetails.length - 1].questionCount += 1;
    }
    if (type === "Indicador Clave" && empresaCol >= 0) {
      // Column layout per segment block is [Negativa, Neutra, Positiva, Total de respuestas].
      const positiveRaw = Number(row[empresaCol + 2]);
      if (Number.isFinite(positiveRaw)) indicatorPositivePct = positiveRaw;
      indicatorBreakdown = toBreakdown(
        Number(row[empresaCol]),
        Number(row[empresaCol + 1]),
        Number(row[empresaCol + 2])
      );
      const totalRaw = Number(row[empresaCol + 3]);
      if (Number.isFinite(totalRaw)) respondents = totalRaw;
    }
  }

  return { demographics, sections, sectionDetails, questions, questionDetails, indicatorPositivePct, indicatorBreakdown, respondents };
}

function extractSurveyMeta(
  rows: unknown[][]
): { name: string | null; year: number | null; isTotal: boolean; reportDate: Date | null } {
  const areaLine = cellText(rows[1]?.[0]);
  const surveyLine = cellText(rows[2]?.[0]);
  const fechaLine = cellText(rows[4]?.[0]);
  const isTotal = /\(total\)/i.test(areaLine);
  const nameMatch = surveyLine.match(/Encuesta:?:?\s*(.+?)\.?$/i);
  // The matched name already carries its year (e.g. "Encuesta de Clima 2025"); strip it so
  // callers that append the year separately don't end up with it duplicated.
  const name = nameMatch ? nameMatch[1].replace(/\s*20\d{2}\s*$/, "").trim() : null;
  return { name, year: extractYear(surveyLine || areaLine), isTotal, reportDate: parseSpanishReportDate(fechaLine) };
}

/**
 * Parses the "Gerencia report" export format: one sheet per category
 * (Clima / Engagement / eNPS), each a formatted pivot table rather than raw
 * per-respondent rows. Covers both the by-area and by-demographic layouts
 * this export can come in.
 */
export function parseGerenciaReport(fileName: string, workbook: XLSX.WorkBook): ParsedSurveyFile {
  let respondents: number | null = null;
  let invited: number | null = null;
  let favorabilityPositivePct: number | null = null;
  let enpsApproxPositivePct: number | null = null;
  let favorabilityBreakdown: FavorabilityBreakdown | null = null;
  let npsBreakdown: NpsBreakdown | null = null;
  let areaBreakdown: AreaParticipation[] = [];
  let sectionFavorability: SectionFavorability[] = [];
  const sections: string[] = [];
  let sectionDetails: SectionDetail[] = [];
  const questions: string[] = [];
  const questionDetails: QuestionDetail[] = [];
  const demographics: string[] = [];
  let meta: { name: string | null; year: number | null; isTotal: boolean; reportDate: Date | null } = {
    name: null,
    year: null,
    isTotal: false,
    reportDate: null,
  };

  REPORT_SHEETS.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) return;
    const rows = sheetRows(sheet);

    if (sheetName === "Clima") meta = extractSurveyMeta(rows);

    const byArea = parseByAreaSheet(rows);
    const byDemographic = byArea ? null : parseByDemographicSheet(rows);

    if (byArea) {
      sections.push(...byArea.sections);
      questions.push(...byArea.questions);
      questionDetails.push(...byArea.questionDetails);
      if (sheetName === "Clima") {
        respondents = byArea.respondents;
        invited = byArea.invited;
        favorabilityPositivePct = byArea.indicatorPositivePct;
        favorabilityBreakdown = byArea.indicatorBreakdown;
        sectionDetails = byArea.sectionDetails;
        areaBreakdown = byArea.areaBreakdown;
        sectionFavorability = byArea.sectionFavorability;
      }
      if (sheetName === "eNPS") {
        enpsApproxPositivePct = byArea.indicatorPositivePct;
        npsBreakdown = toNps(byArea.indicatorBreakdown);
      }
    } else if (byDemographic) {
      sections.push(...byDemographic.sections);
      questions.push(...byDemographic.questions);
      questionDetails.push(...byDemographic.questionDetails);
      demographics.push(...byDemographic.demographics);
      if (sheetName === "Clima") {
        favorabilityPositivePct = byDemographic.indicatorPositivePct;
        favorabilityBreakdown = byDemographic.indicatorBreakdown;
        sectionDetails = byDemographic.sectionDetails;
        if (byDemographic.respondents != null) respondents = byDemographic.respondents;
      }
      if (sheetName === "eNPS") {
        enpsApproxPositivePct = byDemographic.indicatorPositivePct;
        npsBreakdown = toNps(byDemographic.indicatorBreakdown);
      }
    }
  });

  return {
    fileName,
    format: "gerencia-report",
    isConsolidatedTotal: meta.isTotal,
    surveyName: meta.name,
    surveyYear: meta.year ?? extractYear(fileName),
    respondents,
    invited,
    sections: dedupeStrings(sections),
    questions: dedupeStrings(questions),
    demographics: dedupeStrings(demographics),
    favorabilityPositivePct,
    enps: null,
    enpsApproxPositivePct,
    reportDate: meta.reportDate,
    areaBreakdown,
    sectionFavorability,
    favorabilityBreakdown,
    npsBreakdown,
    sectionDetails,
    questionDetails: dedupeQuestionDetails(questionDetails),
  };
}
