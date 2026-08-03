import * as React from "react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatProgress, getProgressTone, TONE_BG } from "./progressFormat";
import type { AssignedUser, AssignedUserStatus } from "@/mocks/types";

/** Dot colour per state, matching the badges used in the table below. */
const STATE_DOT: Record<AssignedUserStatus, string> = {
  "Por iniciar": "bg-text-secondary/30",
  "En progreso": "bg-status-warning",
  Finalizado: "bg-status-positive",
};

const STATE_ORDER: AssignedUserStatus[] = ["Por iniciar", "En progreso", "Finalizado"];

/**
 * Header strip above the roster: the cycle's overall advance on the left, and a
 * breakdown of how many users sit in each state on the right.
 *
 * The reference screen showed a single undifferentiated user count here, which
 * says nothing the row count below doesn't already say. Splitting it per state
 * answers the actual question the strip is placed to answer — how much of the
 * cycle has even been started.
 */
export const CycleSummaryBar: React.FC<{
  progress: number;
  users: AssignedUser[];
}> = ({ progress, users }) => {
  const tone = getProgressTone(progress);
  const counts = React.useMemo(
    () =>
      STATE_ORDER.map((state) => ({
        state,
        count: users.filter((user) => user.status === state).length,
      })).filter((entry) => entry.count > 0),
    [users]
  );

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3 px-5 py-3.5 rounded-xl border border-border/50 bg-surface-muted/30">
      <div className="flex items-center gap-3 min-w-[280px] flex-1">
        <span className="text-[11px] font-bold text-text-secondary tracking-tight whitespace-nowrap">
          Avance general
        </span>
        <div className="flex-1 h-1.5 rounded-full bg-muted dark:bg-white/10 overflow-hidden min-w-[80px]">
          <div
            className={cn("h-full rounded-full transition-all", TONE_BG[tone])}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <span className="text-[13px] font-extrabold text-text-primary tabular-nums whitespace-nowrap">
          {formatProgress(progress)}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-[11px] font-bold text-text-secondary/50 tracking-tight whitespace-nowrap">
          Usuarios por estado
        </span>
        {counts.length === 0 ? (
          <span className="text-[11px] font-bold text-text-secondary/30">Sin usuarios</span>
        ) : (
          <div className="flex items-center gap-3">
            {counts.map(({ state, count }) => (
              <Tooltip key={state}>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center gap-1.5 cursor-default">
                    <span className={cn("h-2 w-2 rounded-full shrink-0", STATE_DOT[state])} />
                    <span className="text-[12px] font-extrabold text-text-primary tabular-nums">
                      {count}
                    </span>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <span>
                    {count} {count === 1 ? "usuario" : "usuarios"} · {state}
                  </span>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
