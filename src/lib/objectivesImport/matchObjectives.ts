/**
 * Resolving an edit file's `nombre_objetivo` against the objectives a user
 * already has in the cycle.
 *
 * The edit template has no objective id — it names the thing to change in
 * prose — so this is the same problem the user matcher has, one level down and
 * strictly worse: a username is at least meant to be an identifier, while an
 * objective's name is a sentence somebody wrote once and retyped from memory
 * later. "Reducir el costo de infraestructura mensual" comes back as "Reducir
 * costos de infraestructura", and both are obviously the same objective to a
 * human and obviously different strings to a lookup.
 *
 * So the answer is three-way, exactly like `matchUsers`: an exact name resolves
 * outright, a near one is only ever *proposed*, and anything else is left for a
 * person to point at by hand — or to load as a new objective, which is the one
 * outcome this module cannot decide on its own.
 */

import type { ObjectiveMatchStatus, ParsedObjective } from './types';

/**
 * Lowercased, unaccented, depunctuated and single-spaced.
 *
 * Everything dropped here is something two spellings of the same objective
 * routinely disagree on and nobody means to distinguish: "Aumentar el NPS."
 * against "aumentar el nps", or "Ventas (netas)" against "ventas netas".
 */
function normalizeName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Words too common in an objective's name to carry any signal.
 *
 * Without this every objective in the cycle shares "el", "la" and "de" with
 * every other one, so the similarity score below would find half the list
 * "parecido" to whatever the file said.
 */
const STOP_WORDS = new Set([
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
  'de', 'del', 'al', 'a', 'en', 'y', 'o', 'con', 'por', 'para',
  'que', 'se', 'su', 'sus', 'lo', 'mas', 'sin',
]);

function meaningfulWords(normalized: string): string[] {
  return normalized.split(' ').filter((word) => word !== '' && !STOP_WORDS.has(word));
}

/**
 * How much two names have in common, 0 to 1.
 *
 * Jaccard over the meaningful words rather than a character distance, because
 * the way these names actually drift is by gaining and losing whole words —
 * "mensual" dropped, "promedio" added — and an edit distance charges for that by
 * the letter, so a dropped word on a short name scores the same as a completely
 * different objective.
 */
function wordOverlap(left: string[], right: string[]): number {
  if (left.length === 0 || right.length === 0) return 0;

  const rightSet = new Set(right);
  const shared = new Set(left.filter((word) => rightSet.has(word)));
  const union = new Set([...left, ...right]);
  return shared.size / union.size;
}

/**
 * Overlap a name needs before it is worth proposing.
 *
 * Two of three meaningful words in common lands at 0.5, which is where a dropped
 * or swapped word still reads as the same objective. Below that the proposal
 * starts being a guess, and a wrong proposal in this flow silently rewrites the
 * wrong objective — so anything under it is left as `unmatched`, where the worst
 * case is an objective created that should not have been.
 */
const PROPOSE_AT = 0.5;

export interface ObjectiveMatch {
  status: ObjectiveMatchStatus;
  /** Set when the status is `matched`. */
  targetId?: string;
  /** Set when the status is `possible`. */
  suggestionId?: string;
  /** Two or three words naming what produced the proposal. */
  basis?: string;
  /** Why we are proposing this one, for the tooltip. */
  reason?: string;
}

/**
 * Finds the objective an edit row is talking about.
 *
 * `taken` holds the objectives already claimed by earlier rows of the same file.
 * A file that names the same objective twice is a real mistake — two edits to one
 * objective, and the second would silently win — so the second row is not allowed
 * to resolve to it, and comes back needing a decision instead.
 */
export function matchObjectiveName(
  lookupTitle: string,
  candidates: ParsedObjective[],
  taken: ReadonlySet<string>
): ObjectiveMatch {
  const needle = normalizeName(lookupTitle);
  if (needle === '') return { status: 'unmatched' };

  const available = candidates.filter((candidate) => !taken.has(candidate.id));
  if (available.length === 0) return { status: 'unmatched' };

  const exact = available.find((candidate) => normalizeName(candidate.title) === needle);
  if (exact) return { status: 'matched', targetId: exact.id };

  const needleWords = meaningfulWords(needle);

  /*
    One pass, keeping the best candidate and whether a second one tied with it.

    The tie matters: if the file says "Reducir costos" and the user has both
    "Reducir costos de nube" and "Reducir costos de nómina", the two score the
    same and proposing either would be a coin toss dressed up as a suggestion.
    That case is reported as unmatched, so the picker asks instead of guessing.
  */
  let best: { candidate: ParsedObjective; score: number } | null = null;
  let isTied = false;

  available.forEach((candidate) => {
    const candidateNormalized = normalizeName(candidate.title);
    const contains =
      candidateNormalized.includes(needle) || needle.includes(candidateNormalized);
    const score = Math.max(
      wordOverlap(needleWords, meaningfulWords(candidateNormalized)),
      // One name sitting whole inside the other is strong evidence on its own —
      // it is what a truncated or extended name looks like — but not proof, so
      // it lands just above the proposal line rather than at the top.
      contains ? 0.75 : 0
    );

    if (score < PROPOSE_AT) return;
    if (!best || score > best.score) {
      best = { candidate, score };
      isTied = false;
      return;
    }
    if (score === best.score) isTied = true;
  });

  if (!best || isTied) return { status: 'unmatched' };

  const { candidate, score } = best as { candidate: ParsedObjective; score: number };

  return {
    status: 'possible',
    suggestionId: candidate.id,
    basis: score >= 0.75 ? 'nombre contenido' : 'nombre parecido',
    reason:
      score >= 0.75
        ? `El archivo dice “${lookupTitle}” y en UBITS existe “${candidate.title}”: uno contiene al otro, así que probablemente sea el mismo objetivo.`
        : `El archivo dice “${lookupTitle}” y en UBITS existe “${candidate.title}”: comparten la mayoría de las palabras, pero no son el mismo texto.`,
  };
}

/**
 * Objectives of the user that no row of the file claimed.
 *
 * What the picker offers when a reviewer goes to link a row by hand: an
 * objective already being rewritten by another row must not be offered to a
 * second one, or the load would send two conflicting edits to it.
 */
export function unclaimedObjectives(
  candidates: ParsedObjective[],
  taken: ReadonlySet<string>
): ParsedObjective[] {
  return candidates.filter((candidate) => !taken.has(candidate.id));
}

/** Case- and accent-insensitive name search, for the link picker's search box. */
export function searchObjectives(
  candidates: ParsedObjective[],
  query: string,
  limit = 40
): ParsedObjective[] {
  const needle = normalizeName(query);
  if (needle === '') return candidates.slice(0, limit);

  return candidates
    .filter((candidate) => normalizeName(candidate.title).includes(needle))
    .slice(0, limit);
}
