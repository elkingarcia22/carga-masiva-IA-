/**
 * Rule that decides whether a detected survey can be loaded as "pública".
 *
 * A public (named) survey shows who answered what, so it is only possible when
 * the uploaded files carry individual participants **and** each participant's
 * own answers. Anything else — aggregated reports, or a participant roster with
 * no per-person answers — can only be loaded as anonymous, and the UI blocks
 * the choice instead of letting the user pick something we can't honor.
 */
import type { DetectedParticipant, DetectedSurveyAnalysis, ParticipantMatchStatus } from "./types";

export type PublicVisibilityBlock = "no-participants" | "answers-not-linked";

/** Why this survey can't be public, or null when it can. */
export function publicVisibilityBlock(analysis: DetectedSurveyAnalysis): PublicVisibilityBlock | null {
  const detection = analysis.participants;
  if (!detection || detection.participants.length === 0) return "no-participants";
  if (!detection.answersLinked) return "answers-not-linked";
  return null;
}

/** User-facing explanation for each reason the public option is unavailable. */
export const PUBLIC_VISIBILITY_BLOCK_MESSAGE: Record<PublicVisibilityBlock, string> = {
  "no-participants":
    "Los archivos traen resultados agregados, no participantes con sus respuestas individuales. Por eso esta encuesta solo puede cargarse como anónima.",
  "answers-not-linked":
    "Detectamos participantes, pero sus respuestas no están asociadas a cada participante. Sin ese vínculo la encuesta solo puede cargarse como anónima.",
};

/**
 * What the reviewer decided about a participant: either tie it to a specific
 * UBITS user (the suggested one, or any other picked from the directory), or
 * leave it without a user, created inside the survey.
 */
export type ParticipantResolution =
  | { kind: "linked"; username: string }
  | { kind: "separate" };

/** Decisions taken so far, keyed by the participant's `identifier`. */
export type ParticipantResolutions = Record<string, ParticipantResolution>;

export interface ParticipantMatchSplit {
  total: number;
  /** Resolved to a UBITS user: automatically, or by the reviewer's decision. */
  matched: DetectedParticipant[];
  /** Name-only candidates still waiting for a decision. */
  possible: DetectedParticipant[];
  /** No UBITS user behind them — created inside the survey only. */
  unmatched: DetectedParticipant[];
}

/**
 * Where a participant lands once the reviewer's decisions are applied.
 *
 * A `possible` match is never resolved automatically: until someone confirms or
 * rejects it, it stays pending. Every other status can be corrected — an
 * automatic match is a strong guess, not a fact, so rejecting it drops the
 * participant to `unmatched`, and linking any row by hand makes it `matched`.
 */
export function effectiveMatchStatus(
  participant: DetectedParticipant,
  resolutions: ParticipantResolutions = {}
): ParticipantMatchStatus {
  const decision = resolutions[participant.identifier];
  if (decision?.kind === "linked") return "matched";
  if (decision?.kind === "separate") return "unmatched";

  return participant.matchStatus;
}

/**
 * Groups detected participants into the three scenarios the review step shows,
 * honoring the decisions already taken. Unmatched participants are still loaded
 * — they just live inside the survey instead of being linked to a UBITS user.
 */
export function splitParticipantsByMatch(
  participants: DetectedParticipant[],
  resolutions: ParticipantResolutions = {}
): ParticipantMatchSplit {
  const byStatus = (status: ParticipantMatchStatus) =>
    participants.filter((p) => effectiveMatchStatus(p, resolutions) === status);

  return {
    total: participants.length,
    matched: byStatus("matched"),
    possible: byStatus("possible"),
    unmatched: byStatus("unmatched"),
  };
}

/**
 * UBITS users already tied to a participant in this batch — matched
 * automatically (where the identifier IS the user's key) or linked by hand. Lets
 * the directory picker stop one user being attached to two participants.
 *
 * A decision always overrides the automatic match, so rejecting or re-pointing
 * one frees the user it had taken.
 */
export function linkedUsernames(
  participants: DetectedParticipant[],
  resolutions: ParticipantResolutions = {}
): Set<string> {
  const taken = new Set<string>();
  participants.forEach((participant) => {
    const decision = resolutions[participant.identifier];
    if (decision?.kind === "linked") {
      taken.add(decision.username);
      return;
    }
    if (decision?.kind === "separate") return;
    if (participant.matchStatus === "matched") taken.add(participant.identifier);
  });
  return taken;
}

const IDENTIFIER_TYPE_LABEL: Record<DetectedParticipant["identifierType"], string> = {
  correo: "Correo",
  numero: "Número de documento",
  username: "Username asignado",
};

/** Human label for the kind of username a participant was identified with. */
export function identifierTypeLabel(type: DetectedParticipant["identifierType"]): string {
  return IDENTIFIER_TYPE_LABEL[type];
}
