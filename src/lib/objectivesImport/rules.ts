/**
 * The objectives rule set (R0–R6), as documented in
 * "Tabla de reglas de cálculo actualizada — Objetivos" and its dummies guide.
 *
 * Two jobs live here and they are deliberately separate:
 *
 *  - `validateObjective` — the rules that BLOCK saving (R0b, R1, R2, R3, plus
 *    the field limits the form enforces: weight ≥ 1%, title ≤ 150).
 *  - `computeCompliance` — the rules that CALCULATE progress (R0a, R4, R5, R6).
 *
 * The guide's race analogy is the mental model: the objective is a track with a
 * start (initial value), a finish (target), an optional qualifying mark
 * (minimum) and an optional ceiling (maximum). For an increasing objective the
 * track reads start → min → target → max; for a decreasing one it reads in
 * reverse. Negative numbers are fine — only the relative order matters.
 */

import {
  groupResultingObjectives,
  groupUntouchedObjectives,
  type ObjectiveUserGroup,
  type ParsedObjective,
  type Trend,
} from './types';

export const TITLE_MAX_LENGTH = 150;
export const MIN_WEIGHT_PERCENT = 1;
export const TOTAL_WEIGHT_PERCENT = 100;

/** Fields the review table can highlight when a rule fails. */
export type ObjectiveField =
  | 'username'
  | 'title'
  | 'weightPercent'
  | 'measureType'
  | 'trend'
  | 'initialValue'
  | 'target'
  | 'minProgress'
  | 'maxProgress'
  | 'newProgress';

export interface RuleViolation {
  /** Rule id from the spec ("R1"), or a field-limit code ("PESO_MIN"). */
  rule: string;
  field: ObjectiveField;
  message: string;
  /** `error` blocks the row from being approved; `warning` only informs. */
  severity: 'error' | 'warning';
}

/**
 * Blocking validation for a single objective.
 *
 * Order matters: R3 (target equals initial) is checked before R1/R2 because
 * equality also trips them, and "la meta no puede ser igual al valor inicial"
 * is the message that actually explains the problem.
 */
export function validateObjective(objective: ParsedObjective): RuleViolation[] {
  const violations: RuleViolation[] = [];
  const { title, weightPercent, initialValue, target, minProgress, maxProgress, trend } = objective;

  if (title.trim() === '') {
    violations.push({
      rule: 'TITULO_VACIO',
      field: 'title',
      message: 'El objetivo necesita un título.',
      severity: 'error',
    });
  } else if (title.length > TITLE_MAX_LENGTH) {
    violations.push({
      rule: 'TITULO_MAX',
      field: 'title',
      message: `El título supera los ${TITLE_MAX_LENGTH} caracteres (tiene ${title.length}).`,
      severity: 'error',
    });
  }

  if (!Number.isFinite(weightPercent) || weightPercent < MIN_WEIGHT_PERCENT) {
    violations.push({
      rule: 'PESO_MIN',
      field: 'weightPercent',
      message: `El peso no puede ser inferior al ${MIN_WEIGHT_PERCENT}%.`,
      severity: 'error',
    });
  }

  if (!Number.isFinite(target)) {
    violations.push({
      rule: 'META_VACIA',
      field: 'target',
      message: 'La meta es obligatoria.',
      severity: 'error',
    });
    // Every rule below compares against the target, so there is nothing more to say.
    return violations;
  }

  if (initialValue === null) {
    // R0b — the formula divides by the target when there is no initial value.
    if (target === 0) {
      violations.push({
        rule: 'R0b',
        field: 'target',
        message: 'Sin valor inicial, la meta no puede ser 0.',
        severity: 'error',
      });
    }
  } else if (target === initialValue) {
    // R3
    violations.push({
      rule: 'R3',
      field: 'target',
      message: 'La meta no puede ser igual al valor inicial.',
      severity: 'error',
    });
  } else if (trend === 'Aumentar' && target < initialValue) {
    // R1
    violations.push({
      rule: 'R1',
      field: 'target',
      message: 'En metas de incremento, el valor meta debe ser mayor al valor inicial.',
      severity: 'error',
    });
  } else if (trend === 'Reducir' && target > initialValue) {
    // R2
    violations.push({
      rule: 'R2',
      field: 'target',
      message: 'En metas de reducción, el valor meta debe ser menor al valor inicial.',
      severity: 'error',
    });
  }

  /*
    Track-order checks for the optional thresholds. These do not block saving —
    the spec only defines R4/R5 as calculation behaviour — but a minimum past the
    target, or a ceiling short of it, always means a sign or column mix-up.

    Skipped entirely when the target is already wrong, and that is not a shortcut.
    The thresholds are positions on a track that runs from the initial value to
    the target, so measuring them against a target R1/R2/R3/R0b just rejected is
    measuring against a finish line that is not there. It produced verdicts that
    were pure noise: a row reading `inicial 11.5 · meta 14 · mínimo 8` in a
    reduction got R2 for the target *and* an amber R4 saying the minimum was
    unreachable — but the minimum is fine, and correcting the target to anything
    below 11.5 made the R4 vanish on its own. One broken field, two accusations,
    in two colours; the reviewer had no way to tell which one to chase.
  */
  const hasTargetError = violations.some((violation) => violation.field === 'target');

  if (!hasTargetError && minProgress !== null) {
    const minIsPastTarget = trend === 'Aumentar' ? minProgress > target : minProgress < target;
    if (minIsPastTarget) {
      violations.push({
        rule: 'R4',
        field: 'minProgress',
        message: 'El mínimo queda más allá de la meta: ningún avance podría alcanzarlo.',
        severity: 'warning',
      });
    }
  }

  if (!hasTargetError && maxProgress !== null) {
    const maxIsBeforeTarget = trend === 'Aumentar' ? maxProgress < target : maxProgress > target;
    if (maxIsBeforeTarget) {
      violations.push({
        rule: 'R5',
        field: 'maxProgress',
        message: 'El máximo queda antes de la meta: el cumplimiento nunca llegaría al 100%.',
        severity: 'warning',
      });
    }
  }

  return violations;
}

/**
 * Blocking validation for a row of an "actualizar" load.
 *
 * A different question from `validateObjective`, and deliberately a much
 * smaller one. That function asks whether an objective is well formed; by the
 * time a progress row is being judged its objective already exists in UBITS and
 * was well formed enough to be saved, so re-litigating its shape would only
 * produce errors about somebody else's data that this file cannot fix.
 *
 * What is genuinely this file's to get wrong is the number it came to write, so
 * that is all this checks — plus the one thing worth doubting about a file that
 * echoes state back at us: whether it was exported from a snapshot that has
 * since moved.
 *
 * Two things block: no objective to report against, and no number to report.
 * Everything else is a warning on purpose — a progress that scores zero, or
 * that goes backwards, is a real thing that genuinely happens and the reviewer
 * is the one who knows whether it is intended. Refusing to load it would be the
 * tool overruling them.
 */
export function validateProgressUpdate(objective: ParsedObjective): RuleViolation[] {
  const violations: RuleViolation[] = [];
  const { link, newProgress, currentProgress, trend, minProgress, maxProgress } = objective;

  /*
    No hay objetivo al cual reportarle.

    Se dice como violación y no solo como chip para que salga por donde salen
    todos los errores de este módulo: en rojo, bajo la fila, con su regla al
    lado. El chip de arriba se queda blanco como los demás — el sistema de
    colores de la tabla es "solo la excepción se pinta", y la excepción ya está
    pintada aquí abajo.

    Una propuesta sin confirmar no entra: esa la resuelve la tarjeta entera con
    su propio mensaje, igual que en la carga de edición.
  */
  if (link !== undefined && link.targetId === undefined && link.status !== 'possible') {
    violations.push({
      rule: 'OBJETIVO_NO_ENCONTRADO',
      field: 'title',
      message: `Ningún objetivo de esta persona se llama "${link.lookupTitle}". Elige a cuál corresponde, o quita la fila.`,
      severity: 'error',
    });
  }

  if (newProgress === null || newProgress === undefined || !Number.isFinite(newProgress)) {
    violations.push({
      rule: 'AVANCE_VACIO',
      field: 'newProgress',
      message: 'El nuevo avance es obligatorio: es el único dato que esta carga registra.',
      severity: 'error',
    });
    // Every check below reads the value that is missing.
    return violations;
  }

  // Going backwards is legal — a correction is exactly that — but it is also
  // what a column pasted one row off looks like, so it gets said out loud.
  if (currentProgress !== null && currentProgress !== undefined) {
    const goesBackwards =
      trend === 'Aumentar' ? newProgress < currentProgress : newProgress > currentProgress;
    if (goesBackwards) {
      violations.push({
        rule: 'AVANCE_RETROCEDE',
        field: 'newProgress',
        message: `El avance retrocede: pasa de ${currentProgress} a ${newProgress} en un objetivo de ${trend.toLowerCase()}.`,
        severity: 'warning',
      });
    }
  }

  // R4 and R5 restated as consequences rather than as faults: the thresholds
  // are working exactly as configured, and what the reviewer needs to know is
  // what this number will score once it lands.
  if (minProgress !== null) {
    const missesMinimum = trend === 'Aumentar' ? newProgress < minProgress : newProgress > minProgress;
    if (missesMinimum) {
      violations.push({
        rule: 'R4',
        field: 'newProgress',
        message: `Valor mínimo aceptable de avance es ${minProgress}, en caso de no alcanzarlo el cumplimiento será 0.`,
        severity: 'warning',
      });
    }
  }

  if (maxProgress !== null) {
    const passesMaximum = trend === 'Aumentar' ? newProgress > maxProgress : newProgress < maxProgress;
    if (passesMaximum) {
      violations.push({
        rule: 'R5',
        field: 'newProgress',
        // El tope frena el VALOR, no el porcentaje: si el máximo está más allá
        // de la meta, cumplir hasta el tope da más de 100% y eso es correcto.
        // Decir "se topa en 100%" sería mentir sobre lo que va a quedar guardado.
        message: `Valor máximo aceptable de avance es ${maxProgress}, en caso de superarlo el cumplimiento se ajusta al tope.`,
        severity: 'warning',
      });
    }
  }

  return violations;
}

/** True when nothing blocks this progress row from being loaded. */
export function isProgressUpdateValid(objective: ParsedObjective): boolean {
  return !validateProgressUpdate(objective).some((violation) => violation.severity === 'error');
}

/**
 * The initial value the calculation actually uses.
 *
 * R6b-1/R6b-2/R6c-1/R6c-2 are all R6a with an implied start line, so the four
 * cases collapse into one decision: when the target's sign agrees with the
 * direction of travel the reference is absolute zero, otherwise it is twice the
 * target — which is what puts the start line on the far side of the finish.
 *
 * Substituting `initial = 2 × target` into R6a reproduces the spec's
 * `(2 − actual/target) × 100` exactly:
 *   (A − 2M) / (M − 2M) = (A − 2M) / (−M) = 2 − A/M
 */
export function resolveInitialValue(
  trend: Trend,
  initialValue: number | null,
  target: number
): number {
  if (initialValue !== null) return initialValue;

  const signAgreesWithTrend = trend === 'Aumentar' ? target >= 0 : target < 0;
  return signAgreesWithTrend ? 0 : 2 * target;
}

export interface ComplianceInput {
  trend: Trend;
  initialValue: number | null;
  target: number;
  minProgress: number | null;
  maxProgress: number | null;
  /** Reported progress — the runner's position on the track. */
  progress: number;
}

/**
 * Compliance percentage for a reported progress value, applying R0a, R4, R5 and
 * the R6 family in the order the spec defines them.
 */
export function computeCompliance(input: ComplianceInput): number {
  const { trend, initialValue, target, minProgress, maxProgress, progress } = input;

  const resolvedInitial = resolveInitialValue(trend, initialValue, target);
  if (target === resolvedInitial) return 0;

  // R4 — below the qualifying mark nothing counts.
  if (minProgress !== null) {
    const missedMinimum = trend === 'Aumentar' ? progress < minProgress : progress > minProgress;
    if (missedMinimum) return 0;
  }

  // R5 — past the ceiling the score stops climbing, so the ceiling stands in
  // for the reported progress.
  let effectiveProgress = progress;
  if (maxProgress !== null) {
    const passedMaximum = trend === 'Aumentar' ? progress > maxProgress : progress < maxProgress;
    if (passedMaximum) effectiveProgress = maxProgress;
  }

  // R6a, and by extension R6b/R6c through the resolved initial value.
  const compliance = ((effectiveProgress - resolvedInitial) / (target - resolvedInitial)) * 100;

  // R0a — negatives are truncated to 0.
  return Math.max(0, compliance);
}

/** Sum of the weights a user carries, used against the 100% rule. */
export function sumWeights(objectives: ParsedObjective[]): number {
  const total = objectives.reduce((accumulated, objective) => {
    return accumulated + (Number.isFinite(objective.weightPercent) ? objective.weightPercent : 0);
  }, 0);
  // Weights arrive as decimals, so trim float noise before comparing to 100.
  return Math.round(total * 100) / 100;
}

export type WeightStatus = 'ok' | 'under' | 'over';

export function getWeightStatus(total: number): WeightStatus {
  if (total > TOTAL_WEIGHT_PERCENT) return 'over';
  if (total < TOTAL_WEIGHT_PERCENT) return 'under';
  return 'ok';
}

/** True when nothing blocks this objective from being loaded. */
export function isObjectiveValid(objective: ParsedObjective): boolean {
  return !validateObjective(objective).some((violation) => violation.severity === 'error');
}

// --- The 100% rule across a whole person -----------------------------------

/**
 * Weight the user ends up carrying once the load finishes.
 *
 * This — not the file's own subtotal — is what the 100% rule is about. A person
 * whose three existing objectives already add up to 100% has no room for a
 * fourth, however well-formed the row is, and the only honest way to say so is
 * to count both sides together.
 *
 * On an edit load the arithmetic is different in a way that matters: a row
 * rewriting an existing objective *replaces* its weight rather than adding to it,
 * so raising one from 20% to 30% costs 10%, not 30%. `groupResultingObjectives`
 * is what encodes that, by leaving out the objectives their own rows supersede.
 */
export function groupWeightTotal(group: ObjectiveUserGroup): number {
  return sumWeights(groupResultingObjectives(group));
}

/** Plural-aware "N objetivo(s)". */
function countObjectivesLabel(count: number): string {
  return `${count} ${count === 1 ? 'objetivo' : 'objetivos'}`;
}

export interface GroupWeightNotice {
  /** `error` blocks the load; `warning` and `info` only explain. */
  tone: 'error' | 'warning' | 'info';
  /** The verdict in one clause, bolded by the caller. */
  headline: string;
  /** What to do about it, or — when nothing is wrong — what it adds up to. */
  detail: string;
}

/**
 * The 100% rule stated for one person, in whatever terms their case needs.
 *
 * Unlike every rule in `validateObjective` this one belongs to the set and not
 * to a row: no single weight is wrong on its own, they are wrong together. So it
 * is answered once per card, and the table's job is only to outline the cells
 * that can move.
 *
 * Two situations, deliberately worded differently:
 *
 *  - A user whose objectives all come from the file. Only an excess is
 *    reported, because a total under 100% is the ordinary state of a file
 *    mid-review — rows still being fixed, rows just deleted — and announcing
 *    "faltan 20%" on every one of them would cry wolf.
 *  - A user who already had objectives in the cycle. Every total gets a
 *    sentence here, including the correct one: the reviewer cannot otherwise
 *    tell where the weight went, and "el archivo trae 40% pero ya había 100%
 *    repartido" is the entire explanation for why a perfectly valid file will
 *    not load. Saying it when the numbers *do* work is what makes the two
 *    halves add up on screen instead of only in UBITS.
 */
export function describeGroupWeight(group: ObjectiveUserGroup): GroupWeightNotice | null {
  const total = groupWeightTotal(group);
  const status = getWeightStatus(total);
  // Only the objectives the file leaves alone are a separate term in the sum.
  // The ones it rewrites are already spoken for by the row rewriting them, so
  // counting them here would describe a total nobody will ever see.
  const untouched = groupUntouchedObjectives(group);
  const savedCount = untouched.length;

  if (savedCount === 0) {
    if (status !== 'over') return null;

    const excess = Math.round((total - TOTAL_WEIGHT_PERCENT) * 100) / 100;
    const count = group.objectives.length;
    const share = Math.round((excess / count) * 100) / 100;

    return {
      tone: 'error',
      headline: 'El peso total se pasa del 100%.',
      detail:
        count === 1
          ? `Los pesos de este usuario suman ${total}% y deben sumar exactamente ${TOTAL_WEIGHT_PERCENT}%. Baja el peso de este objetivo a ${TOTAL_WEIGHT_PERCENT}%.`
          : `Los pesos de este usuario suman ${total}% y deben sumar exactamente ${TOTAL_WEIGHT_PERCENT}%. Reparte ${excess}% menos entre sus ${count} objetivos — por ejemplo, ${share}% menos en cada uno — o quita alguno de la carga.`,
    };
  }

  const savedTotal = sumWeights(untouched);
  const incomingTotal = sumWeights(group.objectives);
  const allCount = savedCount + group.objectives.length;
  /*
    Present tense on purpose. "Ya tenía 100%" would be a lie the moment the
    reviewer lowers one of those weights to make room: the sentence would keep
    citing a past total while showing the adjusted one. Stating what the two
    halves add up to *right now* stays true through every edit, which is what
    lets the same sentence narrate the fix as it happens.
  */
  const split = `Tiene ${countObjectivesLabel(savedCount)} en UBITS con ${savedTotal}% y el archivo suma ${incomingTotal}% más: ${total}% en total.`;

  if (status === 'over') {
    const excess = Math.round((total - TOTAL_WEIGHT_PERCENT) * 100) / 100;
    return {
      tone: 'error',
      headline: 'El peso total se pasa del 100%.',
      detail: `${split} Baja ${excess}% entre los ${allCount} objetivos, o quita alguno de la carga.`,
    };
  }

  if (status === 'under') {
    const gap = Math.round((TOTAL_WEIGHT_PERCENT - total) * 100) / 100;
    return {
      tone: 'warning',
      headline: `Falta ${gap}% por repartir.`,
      detail: `${split} Sube el peso de cualquiera de los ${allCount} objetivos.`,
    };
  }

  return {
    tone: 'info',
    headline: 'El peso cuadra en 100%.',
    detail: `${split} No hay nada que ajustar.`,
  };
}
