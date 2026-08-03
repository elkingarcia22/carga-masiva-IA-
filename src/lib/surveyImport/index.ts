export * from "./types";
export { parseSurveyFile } from "./parseFile";
export { aggregateParsedFiles } from "./aggregate";
export { inferDateRangeFromName } from "./inferDates";
export {
  resolveDemoScenario,
  buildMockExtractionResult,
  buildEmptyStructureResult,
  buildParticipantsWithAnswersResult,
  buildParticipantsWithoutAnswersResult,
  findExistingDuplicate,
  isEmptyAnalysis,
} from "./demoScenarios";
export type { AnalyzeOutcome } from "./demoScenarios";
export {
  publicVisibilityBlock,
  PUBLIC_VISIBILITY_BLOCK_MESSAGE,
  splitParticipantsByMatch,
  effectiveMatchStatus,
  linkedUsernames,
  identifierTypeLabel,
} from "./visibility";
export type {
  PublicVisibilityBlock,
  ParticipantMatchSplit,
  ParticipantResolution,
  ParticipantResolutions,
} from "./visibility";

import type { SurveyImportResult } from "./types";
import { parseSurveyFile } from "./parseFile";
import { aggregateParsedFiles } from "./aggregate";
import { resolveDemoScenario, type AnalyzeOutcome } from "./demoScenarios";

export async function parseSurveyFiles(files: File[]): Promise<SurveyImportResult> {
  const parsed = await Promise.all(files.map((file) => parseSurveyFile(file)));
  return aggregateParsedFiles(parsed);
}

/**
 * Entry point for the upload flow: returns a forced demo scenario when the
 * uploaded files match one (see `resolveDemoScenario`), otherwise runs the real
 * parsing pipeline and wraps its result. The screen consumes a single unified
 * `AnalyzeOutcome`.
 */
export async function analyzeUploaded(files: File[]): Promise<AnalyzeOutcome> {
  const scenario = resolveDemoScenario(files);
  if (scenario) return scenario;
  const result = await parseSurveyFiles(files);
  return { kind: "result", result };
}
