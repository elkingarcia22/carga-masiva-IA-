import type { ObjectiveCycleStatus } from "@/mocks/types";

/**
 * Presentation rules for a cycle's progress and status.
 *
 * The bar is colour-coded by how far along the cycle is rather than left a flat
 * accent, so scanning a page of cycles surfaces the ones that need attention.
 * Legacy screens painted low progress red; here red is reserved for genuinely
 * exceptional values (over-achievement past the target) and stalled cycles read
 * as neutral — being at 0% on day one is not an error.
 */
export type ProgressTone = "empty" | "low" | "mid" | "high" | "over";

const TONE_THRESHOLDS = {
  low: 40,
  mid: 80,
  over: 100,
} as const;

export function getProgressTone(progress: number): ProgressTone {
  if (progress <= 0) return "empty";
  if (progress > TONE_THRESHOLDS.over) return "over";
  if (progress >= TONE_THRESHOLDS.mid) return "high";
  if (progress >= TONE_THRESHOLDS.low) return "mid";
  return "low";
}

/** Maps a tone onto the colours the shared Progress component understands. */
export const TONE_COLOR: Record<ProgressTone, "primary" | "success" | "warning" | "destructive"> = {
  empty: "primary",
  low: "warning",
  mid: "primary",
  high: "success",
  over: "destructive",
};

export const TONE_HINT: Record<ProgressTone, string> = {
  empty: "Sin avance registrado",
  low: "Avance bajo",
  mid: "Avance en curso",
  high: "Cerca de la meta",
  over: "Avance por encima de la meta",
};

/** Trims the trailing ".00" so whole numbers don't read as fake precision. */
export function formatProgress(progress: number): string {
  const rounded = Math.round(progress * 100) / 100;
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(2)}%`;
}

/**
 * Alpha-capable tokens only — `status-warning-light` is a flat CSS var, so a
 * `/20` modifier on it silently drops the background and the badge loses its pill.
 */
export const STATUS_CLASS: Record<ObjectiveCycleStatus, string> = {
  "En progreso": "bg-status-warning/15 text-status-warning",
  Finalizado: "bg-status-positive-bg text-status-positive",
  Programado: "bg-info/10 text-info",
};
