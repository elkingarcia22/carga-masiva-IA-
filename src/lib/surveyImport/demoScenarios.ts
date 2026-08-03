/**
 * Demo scenario layer for the prototype's upload flow.
 *
 * The real parsing pipeline (`parseSurveyFiles`) stays the source of truth for
 * well-formed files. This module sits on top of it so a demo can reproduce the
 * error and atypical cases deterministically, keyed off the uploaded file's
 * name/type. If no scenario matches, the caller runs the real pipeline.
 *
 * Trigger convention (case-insensitive, checked on the file name/extension):
 *  - ext pdf/png/jpg            → simulated extraction (mock, clearly labelled)
 *  - name contains "pesado"     → "file too large" error
 *  - name contains "corrupto"   → "could not read file" error
 *  - name contains "sin-estructura" / "vacio" → recognized but no structure
 *  - name contains "participantes" + "sin respuestas" → participant roster with
 *    no per-person answers → forced anonymous (public option blocked)
 *  - name contains "participantes"  → participants WITH their own answers →
 *    public by default, plus the UBITS match breakdown
 *  - anything else              → null (run the real pipeline)
 *
 * Genuinely unsupported types (zip, docx, …) are already blocked earlier by
 * `validateFiles` at file-pick time, so they never reach here.
 */
import { getFileKind } from "@/components/upload/uploadUtils";
import { COMPARATIVE_SURVEYS_LIST } from "@/mocks/comparativeMocks";
import { DEMO_PARTICIPANT_ROSTER } from "@/mocks/participantsMocks";
import type {
  DetectedSurveyAnalysis,
  DetectedSurveyGroup,
  QuestionDetail,
  SectionDetail,
  SurveyImportResult,
} from "./types";

export type AnalyzeOutcome =
  | { kind: "error"; variant: "validation" | "parse"; title: string; detail: string }
  | { kind: "result"; result: SurveyImportResult; simulated?: boolean };

/**
 * True when we couldn't pull anything usable out of a file: no indicators, no
 * sections, no questions, no demographics. The UI shows a dedicated empty state
 * for this instead of a summary full of zeros/N-D.
 */
export function isEmptyAnalysis(a: DetectedSurveyAnalysis): boolean {
  return (
    a.questionsCount === 0 &&
    a.sections.length === 0 &&
    a.demographics.length === 0 &&
    a.participationRate == null &&
    a.totalRespondents == null &&
    a.favorability == null &&
    a.enps == null &&
    a.participants == null
  );
}

const nameHas = (files: File[], token: string): boolean =>
  files.some((f) => f.name.toLowerCase().includes(token));

const hasKind = (files: File[], ...kinds: string[]): boolean =>
  files.some((f) => kinds.includes(getFileKind(f)));

/** Builds section→count details from a list of questions. */
function sectionDetailsFrom(questions: QuestionDetail[]): SectionDetail[] {
  const counts = new Map<string, number>();
  questions.forEach((q) => {
    if (!q.section) return;
    counts.set(q.section, (counts.get(q.section) ?? 0) + 1);
  });
  return Array.from(counts.entries()).map(([name, questionCount]) => ({ name, questionCount }));
}

/** Fills a full analysis object from a partial one, so callers only set what matters. */
function makeAnalysis(partial: Partial<DetectedSurveyAnalysis>): DetectedSurveyAnalysis {
  const questionDetails = partial.questionDetails ?? [];
  return {
    participationRate: partial.participationRate ?? null,
    totalRespondents: partial.totalRespondents ?? null,
    totalInvited: partial.totalInvited ?? null,
    enps: partial.enps ?? null,
    enpsIsApproximate: partial.enpsIsApproximate ?? true,
    favorability: partial.favorability ?? null,
    demographics: partial.demographics ?? [],
    questionsCount: partial.questionsCount ?? questionDetails.length,
    questions: partial.questions ?? questionDetails.map((q) => q.text),
    sections: partial.sections ?? sectionDetailsFrom(questionDetails).map((s) => s.name),
    areaBreakdown: partial.areaBreakdown ?? [],
    sectionFavorability: partial.sectionFavorability ?? [],
    favorabilityBreakdown: partial.favorabilityBreakdown ?? null,
    npsBreakdown: partial.npsBreakdown ?? null,
    sectionDetails: partial.sectionDetails ?? sectionDetailsFrom(questionDetails),
    questionDetails,
    participants: partial.participants ?? null,
  };
}

/**
 * Canonical "structure extracted from a PDF/image" result. Mirrors the shape of
 * a real clima survey so the summary renders identically — the only difference
 * is the `simulated` flag the UI uses to show a clear "simulado" badge.
 */
export function buildMockExtractionResult(fileName: string): SurveyImportResult {
  const questionDetails: QuestionDetail[] = [
    { text: "Mi jefatura me da retroalimentación oportuna sobre mi trabajo.", section: "Liderazgo" },
    { text: "Confío en las decisiones que toma el equipo directivo.", section: "Liderazgo" },
    { text: "La comunicación entre áreas es clara y oportuna.", section: "Comunicación" },
    { text: "Recibo la información que necesito para hacer bien mi trabajo.", section: "Comunicación" },
    { text: "Tengo oportunidades reales de crecimiento en la empresa.", section: "Desarrollo" },
    { text: "Recibo capacitación suficiente para mi rol.", section: "Desarrollo" },
    { text: "Mi carga de trabajo me permite mantener un buen equilibrio de vida.", section: "Bienestar" },
    { text: "Me siento seguro y respetado en mi entorno de trabajo.", section: "Bienestar" },
    // Section-less eNPS driver + one standalone opinion question.
    { text: "En una escala de 0 a 10, ¿qué tan probable es que recomiendes a la empresa como un buen lugar para trabajar?", section: null },
    { text: "¿Qué es lo que más valoras de trabajar aquí? (respuesta abierta)", section: null },
  ];

  const analysis = makeAnalysis({
    participationRate: 88.2,
    totalRespondents: 312,
    totalInvited: 354,
    enps: 42,
    enpsIsApproximate: true,
    favorability: 74,
    demographics: ["Área", "Antigüedad", "Sede"],
    questionDetails,
    favorabilityBreakdown: { desfavorable: 11, neutral: 15, favorable: 74 },
    npsBreakdown: { detractores: 18, neutrales: 22, promotores: 60 },
  });

  const group: DetectedSurveyGroup = {
    groupKey: "2025",
    suggestedSurveyName: "Encuesta de Clima 2025",
    surveyYear: 2025,
    suggestedStartDate: new Date(2025, 0, 15),
    suggestedEndDate: new Date(2025, 0, 30),
    fileNames: [fileName],
    analysis,
  };

  return { groups: [group], unrecognizedFiles: [] };
}

/**
 * A file whose format was recognized but from which no structure could be
 * mapped — every metric/section/question comes back empty. The summary already
 * renders "No se detectaron secciones ni preguntas" for this case.
 */
export function buildEmptyStructureResult(fileName: string): SurveyImportResult {
  const baseName = fileName.replace(/\.(xlsx|xls|csv|pdf|png|jpe?g)$/i, "").replace(/[_-]+/g, " ").trim();
  const group: DetectedSurveyGroup = {
    groupKey: "unknown-year",
    suggestedSurveyName: baseName || "Encuesta",
    surveyYear: null,
    suggestedStartDate: null,
    suggestedEndDate: null,
    fileNames: [fileName],
    analysis: makeAnalysis({}),
  };
  return { groups: [group], unrecognizedFiles: [] };
}

/**
 * Clima structure shared by both participant-level scenarios, so the only
 * difference between them is whether the answers are tied to each person.
 * Mirrors the question set written into the generated .xlsx files.
 */
const PARTICIPANT_QUESTION_DETAILS: QuestionDetail[] = [
  { text: "Mi jefatura me entrega retroalimentación oportuna sobre mi trabajo.", section: "Liderazgo" },
  { text: "Confío en las decisiones que toma el equipo directivo.", section: "Liderazgo" },
  { text: "Mi jefatura reconoce el trabajo bien hecho.", section: "Liderazgo" },
  { text: "La comunicación entre áreas es clara y oportuna.", section: "Comunicación" },
  { text: "Recibo la información que necesito para hacer bien mi trabajo.", section: "Comunicación" },
  { text: "Tengo oportunidades reales de crecimiento en la empresa.", section: "Desarrollo" },
  { text: "Recibo capacitación suficiente para mi rol.", section: "Desarrollo" },
  { text: "Mi carga de trabajo me permite mantener un buen equilibrio de vida.", section: "Bienestar" },
  { text: "Me siento seguro y respetado en mi entorno de trabajo.", section: "Bienestar" },
  // Section-less eNPS driver + one standalone open question.
  { text: "En una escala de 0 a 10, ¿qué tan probable es que recomiendes a la empresa como un buen lugar para trabajar?", section: null },
  { text: "Cuéntanos con tus palabras qué mejorarías de la empresa (comentario).", section: null },
];

/**
 * Files that bring one row per person **with that person's own answers**. This
 * is the only shape that supports a public (named) load, so the summary gains a
 * "Participantes" block and the visibility defaults to pública.
 *
 * Because the answers are per-person, participation and eNPS are exact rather
 * than approximated from aggregated buckets.
 */
export function buildParticipantsWithAnswersResult(fileName: string): SurveyImportResult {
  const analysis = makeAnalysis({
    participationRate: 87.5,
    totalRespondents: DEMO_PARTICIPANT_ROSTER.length,
    totalInvited: 32,
    enps: 50,
    enpsIsApproximate: false,
    favorability: 74,
    demographics: ["Área", "Cargo", "Sede", "Antigüedad"],
    questionDetails: PARTICIPANT_QUESTION_DETAILS,
    favorabilityBreakdown: { desfavorable: 9, neutral: 17, favorable: 74 },
    // 18 promotores / 6 neutrales / 4 detractores sobre 28 respuestas → eNPS 50.
    npsBreakdown: { detractores: 14.3, neutrales: 21.4, promotores: 64.3 },
    participants: { answersLinked: true, participants: DEMO_PARTICIPANT_ROSTER },
  });

  const group: DetectedSurveyGroup = {
    groupKey: "2025",
    suggestedSurveyName: "Encuesta de Clima con participantes 2025",
    surveyYear: 2025,
    suggestedStartDate: new Date(2025, 2, 3),
    suggestedEndDate: new Date(2025, 2, 21),
    fileNames: [fileName],
    analysis,
  };

  return { groups: [group], unrecognizedFiles: [] };
}

/**
 * Files that list the participants but keep the results aggregated — nothing
 * ties a given answer back to a given person. The roster is still detected (and
 * still matched against UBITS), but the survey can only be loaded as anonymous.
 */
export function buildParticipantsWithoutAnswersResult(fileName: string): SurveyImportResult {
  const analysis = makeAnalysis({
    participationRate: 87.5,
    totalRespondents: DEMO_PARTICIPANT_ROSTER.length,
    totalInvited: 32,
    enps: 40,
    enpsIsApproximate: true,
    favorability: 71,
    demographics: ["Área", "Cargo", "Sede"],
    questionDetails: PARTICIPANT_QUESTION_DETAILS,
    favorabilityBreakdown: { desfavorable: 11, neutral: 18, favorable: 71 },
    npsBreakdown: { detractores: 18, neutrales: 24, promotores: 58 },
    participants: { answersLinked: false, participants: DEMO_PARTICIPANT_ROSTER },
  });

  const group: DetectedSurveyGroup = {
    groupKey: "2025",
    suggestedSurveyName: "Encuesta de Clima sin respuestas por participante 2025",
    surveyYear: 2025,
    suggestedStartDate: new Date(2025, 2, 3),
    suggestedEndDate: new Date(2025, 2, 21),
    fileNames: [fileName],
    analysis,
  };

  return { groups: [group], unrecognizedFiles: [] };
}

/**
 * Returns the name of an already-loaded survey that matches, or null.
 * A match is either an exact (normalized) name, or the same survey family
 * (name minus year/quarter) for the same year. Renaming to a genuinely
 * different name or year clears it, so the UI can gate on this reactively.
 */
export function findExistingDuplicate(name: string | null, year: number | null): string | null {
  if (!name) return null;
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const stem = (s: string) =>
    normalize(s).replace(/\b20\d{2}\b/g, "").replace(/\bq[1-4]\b/g, "").replace(/\s+/g, " ").trim();

  const yearMatch = name.match(/20\d{2}/);
  const effectiveYear = year ?? (yearMatch ? Number(yearMatch[0]) : null);
  const target = normalize(name);
  const targetStem = stem(name);

  const match = COMPARATIVE_SURVEYS_LIST.find((s) => {
    if (normalize(s.name) === target) return true;
    return (
      effectiveYear != null &&
      s.name.includes(String(effectiveYear)) &&
      targetStem.length > 0 &&
      stem(s.name) === targetStem
    );
  });
  return match ? match.name : null;
}

/**
 * Inspects the uploaded files and returns a forced demo outcome, or `null` to
 * signal "no scenario — run the real parsing pipeline".
 */
export function resolveDemoScenario(files: File[]): AnalyzeOutcome | null {
  if (files.length === 0) return null;

  if (nameHas(files, "pesado") || nameHas(files, "grande")) {
    return {
      kind: "error",
      variant: "validation",
      title: "Archivo demasiado grande",
      detail: "El archivo supera el límite de 10 MB. Comprímelo o divídelo e inténtalo de nuevo.",
    };
  }

  if (nameHas(files, "corrupto") || nameHas(files, "danado") || nameHas(files, "dañado")) {
    return {
      kind: "error",
      variant: "parse",
      title: "No pudimos leer el archivo",
      detail: "El archivo parece estar dañado o protegido con contraseña. Verifica que se haya exportado correctamente e inténtalo de nuevo.",
    };
  }

  if (nameHas(files, "sin-estructura") || nameHas(files, "sinestructura") || nameHas(files, "vacio") || nameHas(files, "vacío")) {
    return { kind: "result", result: buildEmptyStructureResult(files[0].name) };
  }

  // Participant-level files. The "no per-person answers" variant is checked
  // first: its name also contains "participantes", so the order decides.
  if (nameHas(files, "participantes")) {
    const withoutAnswers =
      nameHas(files, "sin respuestas") || nameHas(files, "sin-respuestas") || nameHas(files, "anonima") || nameHas(files, "anónima");
    return {
      kind: "result",
      result: withoutAnswers
        ? buildParticipantsWithoutAnswersResult(files[0].name)
        : buildParticipantsWithAnswersResult(files[0].name),
    };
  }

  if (hasKind(files, "pdf", "image")) {
    return { kind: "result", result: buildMockExtractionResult(files[0].name), simulated: true };
  }

  return null;
}
