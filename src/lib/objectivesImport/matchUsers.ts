/**
 * Resolving the file's `username` column against UBITS users.
 *
 * The column is polymorphic on purpose: UBITS accepts a corporate e-mail, a
 * document number or an assigned nickname as the username, so the same file can
 * name three people three different ways. Matching therefore cannot be a single
 * dictionary lookup — it tries each shape, and when nothing lands exactly it
 * looks for a near-variant it can *propose* rather than silently guessing.
 *
 * The three outcomes map straight onto the three tabs of the review step:
 * confirmed matches are ready to load, proposals need a human to confirm, and
 * rows whose data breaks a rule need fixing first.
 */

import {
  groupWeightTotal,
  isObjectiveValid,
  isProgressUpdateValid,
  TOTAL_WEIGHT_PERCENT,
} from './rules';
import {
  groupResultingObjectives,
  isObjectiveLinkPending,
  type IdentifierType,
  type ObjectiveUserGroup,
  type RosterUser,
  type UserMatchStatus,
} from './types';

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Lowercased, accent-stripped and single-spaced, for comparing names.
 *
 * "MARTA  FORERO" and "Marta Forero" are the same person, and so is "Cristián"
 * typed without its accent — which happens constantly in spreadsheets, because
 * whoever filled the column was typing from memory rather than copying.
 */
function normalizeName(value: string): string {
  return normalize(value)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ');
}

/** Digits only, so "16.506.333-3" and "165063333" compare equal. */
function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

function localPart(value: string): string {
  return normalize(value).split('@')[0] ?? '';
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/**
 * A document number is all digits once punctuation is dropped, and long enough
 * that we are not mistaking an employee code like "12" for an ID. Short numeric
 * codes stay classified as usernames, which is what UBITS treats them as.
 */
function isDocument(value: string): boolean {
  const digits = digitsOnly(value);
  return digits.length >= 5 && digits === value.replace(/[.\-\s]/g, '');
}

/**
 * Two or more words of letters only, which in this column means somebody typed
 * a person's name instead of an identifier.
 *
 * A single word is left as `username`: "martica" is a real UBITS username, and
 * guessing it is a first name would mislabel a match that is actually exact.
 */
function isPersonName(value: string): boolean {
  return /^\p{L}[\p{L}'.-]*(?:\s+\p{L}[\p{L}'.-]*)+$/u.test(value.trim());
}

export function detectIdentifierType(identifier: string): IdentifierType {
  if (isEmail(identifier)) return 'correo';
  if (isDocument(identifier)) return 'documento';
  if (isPersonName(identifier)) return 'nombre';
  return 'username';
}

/**
 * Lookup tables built once per analysis.
 *
 * Exact indexes decide a `matched`; the loose ones only ever produce a
 * `possible`, so a coincidence on an e-mail local part can never quietly
 * become a confirmed identity.
 */
interface UserIndex {
  byUsername: Map<string, RosterUser>;
  byEmail: Map<string, RosterUser>;
  byDocument: Map<string, RosterUser>;
  /** Local part of each user's e-mail and of e-mail-shaped usernames. */
  byLocalPart: Map<string, RosterUser>;
  /**
   * Everyone answering to a given full name — a list, not a single user,
   * because namesakes are exactly the reason a name can never confirm an
   * identity on its own.
   */
  byName: Map<string, RosterUser[]>;
  byPhone: Map<string, RosterUser>;
}

/**
 * Cycle members are indexed last so they win on collision: when the same
 * person appears both in the cycle and in the wider directory, the review has
 * to report them as already on the cycle.
 */
export function buildUserIndex(candidates: RosterUser[]): UserIndex {
  const index: UserIndex = {
    byUsername: new Map(),
    byEmail: new Map(),
    byDocument: new Map(),
    byLocalPart: new Map(),
    byName: new Map(),
    byPhone: new Map(),
  };

  const ordered = [...candidates].sort(
    (left, right) => Number(left.onCycle ?? false) - Number(right.onCycle ?? false)
  );

  ordered.forEach((user) => {
    const username = normalize(user.username);
    if (username !== '') index.byUsername.set(username, user);

    if (user.email) {
      const email = normalize(user.email);
      if (email !== '') index.byEmail.set(email, user);
      index.byLocalPart.set(localPart(email), user);
    }

    if (user.documentId) {
      const document = digitsOnly(user.documentId);
      if (document !== '') index.byDocument.set(document, user);
    }

    // An e-mail-shaped username also answers to its local part.
    if (username.includes('@')) index.byLocalPart.set(localPart(username), user);

    const name = normalizeName(user.name);
    if (name !== '') index.byName.set(name, [...(index.byName.get(name) ?? []), user]);

    if (user.phone) {
      const phone = digitsOnly(user.phone);
      if (phone !== '') index.byPhone.set(phone, user);
    }
  });

  return index;
}

export interface IdentifierMatch {
  status: UserMatchStatus;
  identifierType: IdentifierType;
  /** Set when the status is `matched`. */
  user?: RosterUser;
  /** Set when the status is `possible`. */
  suggestion?: RosterUser;
  /**
   * Two or three words naming the datum that produced the proposal — "nombre",
   * "teléfono", "documento". Shown on the card, where there is only room for a
   * label; `reason` is the sentence behind it.
   */
  basis?: string;
  /** Why we are proposing this candidate, shown next to the suggestion. */
  reason?: string;
}

/**
 * Resolves one file identifier.
 *
 * Two tiers, and the line between them is what the whole review is organised
 * around.
 *
 * The first tier is the two things a person can log into UBITS with: their
 * username and their corporate e-mail. Either one hits and the person is
 * settled, no questions asked.
 *
 * Everything else only proposes. The document number belongs here despite
 * identifying a person perfectly well off-platform, because UBITS does not
 * authenticate anyone by it — two records can carry the same number after a
 * migration, and a file's document column is as likely to hold a typo as a
 * truth. Same for the name (two people are called Marta Forero), the phone
 * (numbers get reassigned) and a personal address sharing its local part with
 * a corporate one. Each points at somebody; none is proof; a human confirms.
 */
export function matchIdentifier(identifier: string, index: UserIndex): IdentifierMatch {
  const identifierType = detectIdentifierType(identifier);
  const key = normalize(identifier);

  if (key === '') {
    return { status: 'unmatched', identifierType };
  }

  const exact = index.byUsername.get(key) ?? index.byEmail.get(key);

  if (exact) {
    return { status: 'matched', identifierType, user: exact };
  }

  // --- Nothing logged in exactly; look for a candidate worth proposing ------

  if (identifierType === 'nombre') {
    // The plain case the reviewer will meet most: someone typed the person's
    // name in a column meant for their username.
    const namesakes = index.byName.get(normalizeName(identifier));
    if (namesakes && namesakes.length > 0) {
      return {
        status: 'possible',
        identifierType,
        suggestion: namesakes[0],
        basis: namesakes.length === 1 ? 'nombre' : `nombre · ${namesakes.length} homónimos`,
        reason:
          namesakes.length === 1
            ? 'El archivo trae el nombre, no un username. Coincide con esta persona, pero dos usuarios pueden llamarse igual.'
            : `Hay ${namesakes.length} usuarios de UBITS con este mismo nombre. Revisa cuál es antes de confirmar.`,
      };
    }
  }

  const digits = digitsOnly(identifier);

  if (digits !== '') {
    // A phone arrives typed as a plain number, so it reaches here classified as
    // a document. Matching one re-labels the identifier for what it is.
    const byPhone = index.byPhone.get(digits);
    if (byPhone) {
      return {
        status: 'possible',
        identifierType: 'telefono',
        suggestion: byPhone,
        basis: 'teléfono',
        reason: `Es el teléfono registrado de "${byPhone.name}". Un número puede haber cambiado de dueño, así que conviene confirmarlo.`,
      };
    }

    const byDocument = index.byDocument.get(digits);
    if (byDocument) {
      return {
        status: 'possible',
        identifierType: 'documento',
        suggestion: byDocument,
        basis: 'documento',
        reason: `Es el documento de "${byDocument.name}". UBITS solo identifica a una persona por su username o su correo, así que el documento hay que confirmarlo.`,
      };
    }
  }

  if (identifierType === 'correo') {
    const local = localPart(key);
    // Same local part on another domain: "martica@gmail.com" vs username
    // "martica", or a personal address of someone whose corporate mail we know.
    const byUsername = index.byUsername.get(local);
    if (byUsername) {
      return {
        status: 'possible',
        identifierType,
        suggestion: byUsername,
        basis: 'parte del correo',
        reason: `El usuario "${byUsername.username}" coincide con la parte inicial de este correo.`,
      };
    }

    const byLocal = index.byLocalPart.get(local);
    if (byLocal) {
      return {
        status: 'possible',
        identifierType,
        suggestion: byLocal,
        basis: 'parte del correo',
        reason: `El correo de "${byLocal.name}" usa la misma parte inicial en otro dominio.`,
      };
    }
  }

  if (identifierType === 'username') {
    // A bare nickname that happens to be someone's e-mail local part.
    const byLocal = index.byLocalPart.get(key);
    if (byLocal) {
      return {
        status: 'possible',
        identifierType,
        suggestion: byLocal,
        basis: 'parte del correo',
        reason: `Coincide con la parte inicial del correo de "${byLocal.name}".`,
      };
    }
  }

  if (identifierType === 'documento') {
    // Document typed with different punctuation, or with a check digit the
    // directory does not store.
    const trimmed = digits.slice(0, -1);
    const candidate = index.byDocument.get(trimmed) ?? index.byDocument.get(digits.slice(1));
    if (candidate) {
      return {
        status: 'possible',
        identifierType,
        suggestion: candidate,
        basis: 'documento parecido',
        reason: `El documento de "${candidate.name}" es casi idéntico (${candidate.documentId}).`,
      };
    }
  }

  return { status: 'unmatched', identifierType };
}

/** Free-text search over every way a user can be named. */
export function searchDirectory(
  candidates: RosterUser[],
  query: string,
  limit = 8
): RosterUser[] {
  const needle = normalize(query);
  if (needle === '') return candidates.slice(0, limit);

  const digits = digitsOnly(query);

  return candidates
    .filter((user) => {
      if (normalize(user.name).includes(needle)) return true;
      if (normalize(user.username).includes(needle)) return true;
      if (user.email && normalize(user.email).includes(needle)) return true;
      if (user.area && normalize(user.area).includes(needle)) return true;
      return digits !== '' && Boolean(user.documentId) && digitsOnly(user.documentId!).includes(digits);
    })
    .slice(0, limit);
}

// --- Bucketing the groups for the review tabs ------------------------------

export type GroupBucket = 'alineados' | 'asociaciones' | 'sinAlinear' | 'errores';

/**
 * True when the group's data breaks a rule UBITS would reject.
 *
 * Weight is checked at group level because the 100% rule is about everything a
 * person carries, not about a single objective — a group whose rows are each
 * valid can still be unloadable because the weights do not add up.
 *
 * "Everything a person carries" includes the objectives they already have in
 * the cycle, which is why both this and the total run over
 * `groupAllObjectives`: a file that is flawless on its own still cannot load
 * against somebody whose existing objectives already claim the full 100%, and a
 * reviewer who adjusts one of those existing rows into an invalid state has to
 * be stopped just the same.
 *
 * Only an excess blocks. A total under 100% is the normal, mid-review state of
 * a card that has not been given all its weight yet — a file can legitimately
 * leave room for objectives that land in a later load — so it is left for the
 * reviewer to judge, never something the review forces shut on its own. Going
 * over is the one total no amount of "not yet" explains: UBITS cannot accept
 * more than 100%, so that is the only shape this rejects outright.
 */
export function groupHasStructuralErrors(group: ObjectiveUserGroup): boolean {
  // An edit or progress row whose objective we could only guess at. Not a data
  // problem, but it blocks for a harder reason than one: loading it would write
  // to whichever objective the guess landed on, and the reviewer never said it
  // was that one.
  if (group.objectives.some(isObjectiveLinkPending)) return true;

  /*
    A progress load is judged on entirely different terms, because it changes
    nothing this function normally polices.

    It cannot break an objective's shape — it never writes one — so validating
    the definition would only surface complaints about data UBITS already
    accepted and this file has no way to fix. It cannot move a weight either, so
    the 100% rule has nothing to say: whatever the person carries, they carried
    it before the file arrived and will carry it after.

    What it *can* get wrong is the number it came to write, and the one thing it
    cannot do at all is write to an objective that does not exist — which on a
    create or edit load is a perfectly good outcome ("créalo nuevo") and here is
    a dead end.
  */
  if (group.mode === 'actualizar') {
    return group.objectives.some(
      (objective) => objective.link?.targetId === undefined || !isProgressUpdateValid(objective)
    );
  }

  if (groupResultingObjectives(group).some((objective) => !isObjectiveValid(objective))) return true;
  return groupWeightTotal(group) > TOTAL_WEIGHT_PERCENT;
}

/**
 * Which tab a group belongs to.
 *
 * Whether the person is known decides first, and it decides alone. An
 * identifier with nobody behind it goes to `sinAlinear` however its numbers
 * look, because until someone owns those objectives there is nothing to fix
 * them *for* — and because that tab is meant to hold one kind of task and one
 * only. The card's rule violations are not shown while it sits there; the
 * review reveals them the moment a user is picked, and the group lands in
 * `errores` or in `alineados` depending on what they turn out to be.
 *
 * `sinAlinear` exists because a missing user is not a defect: it is usually a
 * contractor, a new hire or a personal address, and the fix is a decision
 * rather than a repair. It used to sit among the errors, which framed a routine
 * step as damage and buried it under red.
 *
 * So the queue drains identity first, data second: sinAlinear/asociaciones →
 * errores → alineados.
 *
 * Data being valid is necessary for `alineados` but never sufficient on its
 * own — `reviewConfirmed` still has to be true. A card does not get to load
 * on the strength of whatever its last keystroke happened to leave behind; it
 * loads because a human looked at it once everything checked out and said so
 * with the "Confirmar" button. Until then a clean card sits in `errores` with
 * nothing left to report but that button.
 */
export function bucketForGroup(group: ObjectiveUserGroup): GroupBucket {
  if (group.matchStatus === 'unmatched') return 'sinAlinear';
  if (group.matchStatus === 'possible') return 'asociaciones';
  if (groupHasStructuralErrors(group)) return 'errores';
  return group.reviewConfirmed ? 'alineados' : 'errores';
}

export function bucketCounts(groups: ObjectiveUserGroup[]): Record<GroupBucket, number> {
  return groups.reduce<Record<GroupBucket, number>>(
    (counts, group) => {
      const bucket = bucketForGroup(group);
      return { ...counts, [bucket]: counts[bucket] + 1 };
    },
    { alineados: 0, asociaciones: 0, sinAlinear: 0, errores: 0 }
  );
}
