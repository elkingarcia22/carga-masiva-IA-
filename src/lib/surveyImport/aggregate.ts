import type {
  AreaParticipation,
  DetectedSurveyGroup,
  FavorabilityBreakdown,
  NpsBreakdown,
  ParsedSurveyFile,
  SectionDetail,
  SectionFavorability,
  SurveyImportResult,
} from "./types";
import { dedupeStrings, dedupeStringsCaseInsensitive } from "./xlsxUtils";
import { inferDateRangeFromName } from "./inferDates";
import { dedupeQuestionDetails } from "./parseGerenciaReport";

/** Averages each named part of a neg/neu/pos-style breakdown across files, weighted by respondents. */
function weightedBreakdown<T extends object>(
  files: ParsedSurveyFile[],
  pick: (f: ParsedSurveyFile) => T | null,
  keys: (keyof T)[]
): T | null {
  const withValue = files.filter((f) => pick(f) != null && f.respondents);
  const totalWeight = withValue.reduce((sum, f) => sum + (f.respondents ?? 0), 0);
  if (totalWeight === 0) return null;

  const result = {} as Record<keyof T, number>;
  keys.forEach((key) => {
    const weightedSum = withValue.reduce(
      (sum, f) => sum + ((pick(f) as T)[key] as unknown as number) * (f.respondents ?? 0),
      0
    );
    result[key] = Math.round((weightedSum / totalWeight) * 10) / 10;
  });
  return result as T;
}

/** Averages each dimension's % positive perception across departments, weighted by their respondents. */
function aggregateSectionFavorability(files: ParsedSurveyFile[]): SectionFavorability[] {
  const bySection = new Map<string, { weightedSum: number; weight: number }>();
  files.forEach((f) => {
    if (!f.respondents) return;
    f.sectionFavorability.forEach(({ section, positivePct }) => {
      const entry = bySection.get(section) ?? { weightedSum: 0, weight: 0 };
      entry.weightedSum += positivePct * (f.respondents as number);
      entry.weight += f.respondents as number;
      bySection.set(section, entry);
    });
  });

  return Array.from(bySection.entries()).map(([section, { weightedSum, weight }]) => ({
    section,
    positivePct: weight > 0 ? Math.round((weightedSum / weight) * 10) / 10 : 0,
  }));
}

/**
 * Suggests a start/end date range so the confirmation form is never blank,
 * ranked by how much we actually know: a quarter/month named in the survey
 * (most precise) → the report's own generation date (the month it was
 * generated in, closing on that date) → the bare calendar year as a last
 * resort. Always just a starting point — the user reviews and can adjust it.
 */
function suggestDateRange(
  groupFiles: ParsedSurveyFile[],
  suggestedName: string,
  year: number | null
): { start: Date; end: Date } | null {
  const fromName = inferDateRangeFromName(suggestedName);
  if (fromName) return fromName;

  const reportDates = groupFiles.map((f) => f.reportDate).filter((d): d is Date => d != null);
  if (reportDates.length > 0) {
    const latest = reportDates.reduce((a, b) => (a > b ? a : b));
    return { start: new Date(latest.getFullYear(), latest.getMonth(), 1), end: latest };
  }

  if (year) {
    return { start: new Date(year, 0, 1), end: new Date(year, 11, 31) };
  }

  return null;
}

function guessDisplayName(files: ParsedSurveyFile[]): string {
  const named = files.find((f) => f.surveyName);
  if (named?.surveyName) {
    return named.surveyYear ? `${named.surveyName} ${named.surveyYear}` : named.surveyName;
  }

  const raw = files.find((f) => f.format === "raw");
  const source = raw ?? files[0];
  return source ? source.fileName.replace(/\.(xlsx|xls|csv)$/i, "").replace(/[_-]+/g, " ").trim() : "Encuesta";
}

/** Averages a metric across files weighted by how many respondents each file represents. */
function weightedAverage(files: ParsedSurveyFile[], pick: (f: ParsedSurveyFile) => number | null): number | null {
  const withValue = files.filter((f) => pick(f) != null && f.respondents);
  const totalWeight = withValue.reduce((sum, f) => sum + (f.respondents ?? 0), 0);
  if (totalWeight === 0) return null;

  const weightedSum = withValue.reduce((sum, f) => sum + (pick(f) as number) * (f.respondents ?? 0), 0);
  return Math.round((weightedSum / totalWeight) * 10) / 10;
}

/** Builds the analysis for a single survey wave (one group of files sharing the same year). */
function buildGroup(groupKey: string, groupFiles: ParsedSurveyFile[]): DetectedSurveyGroup {
  const consolidatedTotal = groupFiles.find((f) => f.isConsolidatedTotal);
  const rawFile = groupFiles.find((f) => f.format === "raw");
  const areaReports = groupFiles.filter((f) => f.format === "gerencia-report" && !f.isConsolidatedTotal);

  // Participation: prefer the exact respondent-level source; otherwise sum
  // per-department breakdowns (disjoint groups of people, safe to add up).
  // The consolidated total is intentionally excluded from the sum — adding
  // it on top of the per-department files would double count everyone.
  let totalRespondents: number | null = null;
  let totalInvited: number | null = null;
  if (rawFile?.respondents != null && rawFile.invited) {
    totalRespondents = rawFile.respondents;
    totalInvited = rawFile.invited;
  } else {
    const withCounts = areaReports.filter((f) => f.respondents != null && f.invited != null);
    if (withCounts.length > 0) {
      totalRespondents = withCounts.reduce((sum, f) => sum + (f.respondents ?? 0), 0);
      totalInvited = withCounts.reduce((sum, f) => sum + (f.invited ?? 0), 0);
    }
  }

  const participationRate =
    totalRespondents != null && totalInvited ? Math.round((totalRespondents / totalInvited) * 1000) / 10 : null;

  const sections = dedupeStrings(groupFiles.flatMap((f) => f.sections));
  // Ordered so section-bearing sources win during dedupe: the consolidated
  // total groups questions by dimension, then per-area reports, then the raw
  // file (which carries no section). Questions and their count both derive
  // from this single deduped list so they never drift apart.
  const questionDetails = dedupeQuestionDetails([
    ...(consolidatedTotal?.questionDetails ?? []),
    ...areaReports.flatMap((f) => f.questionDetails),
    ...(rawFile?.questionDetails ?? []),
  ]);
  const questions = questionDetails.map((q) => q.text);
  const demographics = dedupeStringsCaseInsensitive(groupFiles.flatMap((f) => f.demographics));

  const favorability =
    consolidatedTotal?.favorabilityPositivePct ?? weightedAverage(areaReports, (f) => f.favorabilityPositivePct);

  // Real per-department participation and per-dimension favorability — not
  // just the aggregate numbers above, but the actual breakdown found in the
  // source files (e.g. "Comercial: 97.1%", "Seguridad: 82.9%").
  const areaBreakdown: AreaParticipation[] = areaReports
    .map((f) => f.areaBreakdown[0])
    .filter((entry): entry is AreaParticipation => entry != null);

  const sectionFavorability: SectionFavorability[] = consolidatedTotal?.sectionFavorability.length
    ? consolidatedTotal.sectionFavorability
    : aggregateSectionFavorability(areaReports);

  let enps: number | null;
  let enpsIsApproximate = true;
  if (rawFile?.enps != null) {
    enps = rawFile.enps;
    enpsIsApproximate = false;
  } else {
    enps = consolidatedTotal?.enpsApproxPositivePct ?? weightedAverage(areaReports, (f) => f.enpsApproxPositivePct);
  }

  // Perception splits: the consolidated total speaks for the whole company, so
  // it wins; otherwise fold the per-department reports weighted by respondents.
  const favorabilityBreakdown: FavorabilityBreakdown | null =
    consolidatedTotal?.favorabilityBreakdown ??
    weightedBreakdown(areaReports, (f) => f.favorabilityBreakdown, ["desfavorable", "neutral", "favorable"]);

  // Prefer the raw file's true promoter/passive/detractor split, then the
  // consolidated report, then a weighted fold of the department reports.
  const npsBreakdown: NpsBreakdown | null =
    rawFile?.npsBreakdown ??
    consolidatedTotal?.npsBreakdown ??
    weightedBreakdown(areaReports, (f) => f.npsBreakdown, ["detractores", "neutrales", "promotores"]);

  // Section→question-count map: every source file shares the same structure,
  // so take the richest one available and fall back to bare section names.
  const sectionDetails: SectionDetail[] =
    consolidatedTotal?.sectionDetails.length
      ? consolidatedTotal.sectionDetails
      : groupFiles.find((f) => f.sectionDetails.length > 0)?.sectionDetails ??
        sections.map((name) => ({ name, questionCount: 0 }));

  const suggestedSurveyName = guessDisplayName(groupFiles);
  const surveyYear = groupFiles.find((f) => f.surveyYear != null)?.surveyYear ?? null;
  const suggestedRange = suggestDateRange(groupFiles, suggestedSurveyName, surveyYear);

  return {
    groupKey,
    suggestedSurveyName,
    surveyYear,
    suggestedStartDate: suggestedRange?.start ?? null,
    suggestedEndDate: suggestedRange?.end ?? null,
    fileNames: groupFiles.map((f) => f.fileName),
    analysis: {
      participationRate,
      totalRespondents,
      totalInvited,
      enps,
      enpsIsApproximate,
      favorability,
      demographics,
      questionsCount: questions.length,
      questions,
      sections,
      areaBreakdown,
      sectionFavorability,
      favorabilityBreakdown,
      npsBreakdown,
      sectionDetails,
      questionDetails,
      // Every format the real pipeline reads today is aggregated: the reports
      // carry no roster, and the raw export's rows are already anonymized. With
      // no participant tied to their own answers, the survey can't be public.
      participants: null,
    },
  };
}

/**
 * Groups every parsed file by survey wave (year) and builds an independent
 * analysis per group — different waves of the same survey (e.g. 2024 vs
 * 2025) are never merged together, but neither are they discarded: each
 * becomes its own reviewable candidate the user can choose to load.
 */
export function aggregateParsedFiles(files: ParsedSurveyFile[]): SurveyImportResult {
  const recognized = files.filter((f) => f.format !== "unknown");
  const unrecognizedFiles = files
    .filter((f) => f.format === "unknown")
    .map((f) => ({ fileName: f.fileName, reason: "No se reconoció el formato del archivo; fue ignorado." }));

  const byYear = new Map<string, ParsedSurveyFile[]>();
  recognized.forEach((f) => {
    const key = f.surveyYear ? String(f.surveyYear) : "unknown-year";
    byYear.set(key, [...(byYear.get(key) ?? []), f]);
  });

  const groups = Array.from(byYear.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .map(([groupKey, groupFiles]) => buildGroup(groupKey, groupFiles));

  return { groups, unrecognizedFiles };
}
