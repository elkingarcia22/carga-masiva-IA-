import * as XLSX from "xlsx";
import type { ParsedSurveyFile, SurveyFileFormat } from "./types";
import { parseRawFormat } from "./parseRawFormat";
import { parseGerenciaReport } from "./parseGerenciaReport";

function detectFormat(workbook: XLSX.WorkBook): SurveyFileFormat {
  const sheets = workbook.SheetNames;
  if (sheets.includes("answers") && sheets.includes("colaboradores")) return "raw";
  if (sheets.some((s) => s === "Clima" || s === "Engagement" || s === "eNPS")) return "gerencia-report";
  return "unknown";
}

function emptyParsedFile(fileName: string): ParsedSurveyFile {
  return {
    fileName,
    format: "unknown",
    isConsolidatedTotal: false,
    surveyName: null,
    surveyYear: null,
    respondents: null,
    invited: null,
    sections: [],
    questions: [],
    demographics: [],
    favorabilityPositivePct: null,
    enps: null,
    enpsApproxPositivePct: null,
    reportDate: null,
    areaBreakdown: [],
    sectionFavorability: [],
    favorabilityBreakdown: null,
    npsBreakdown: null,
    sectionDetails: [],
    questionDetails: [],
  };
}

export async function parseSurveyFile(file: File): Promise<ParsedSurveyFile> {
  const buffer = await file.arrayBuffer();

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: "array" });
  } catch {
    return emptyParsedFile(file.name);
  }

  const format = detectFormat(workbook);
  if (format === "raw") return parseRawFormat(file.name, workbook);
  if (format === "gerencia-report") return parseGerenciaReport(file.name, workbook);
  return emptyParsedFile(file.name);
}
