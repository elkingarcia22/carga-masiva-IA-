import * as React from "react";
import { BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ASSIGNED_STATUS_CLASS,
  PERFORMANCE_CLASS,
  formatProgress,
} from "./progressFormat";
import type { AssignedUserStatus, PerformanceLevel } from "@/mocks/types";

export const AssignedStatusBadge: React.FC<{ status: AssignedUserStatus }> = ({ status }) => (
  <Badge
    variant="outline"
    className={cn(
      "text-[10px] font-bold border-none px-2 py-0.5 rounded-full pointer-events-none whitespace-nowrap",
      ASSIGNED_STATUS_CLASS[status]
    )}
  >
    {status}
  </Badge>
);

/**
 * Two-segment progress bar: the advance already closed out, then the part still
 * moving. Splitting it means a user sitting at 84% on work that is mostly still
 * open reads differently from one who has actually banked it — a single bar
 * would collapse both into the same picture.
 */
export const AssignedProgressBar: React.FC<{
  progress: number;
  completedProgress: number;
}> = ({ progress, completedProgress }) => {
  const completed = Math.max(0, Math.min(completedProgress, 100));
  const inFlight = Math.max(0, Math.min(progress, 100) - completed);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className="w-full max-w-[92px] h-1.5 rounded-full bg-muted dark:bg-white/10 overflow-hidden flex cursor-default"
          role="img"
          aria-label={`Avance ${formatProgress(progress)}`}
        >
          <span
            className="h-full bg-status-positive transition-all"
            style={{ width: `${completed}%` }}
          />
          <span
            className="h-full bg-status-warning transition-all"
            style={{ width: `${inFlight}%` }}
          />
        </div>
      </TooltipTrigger>
      <TooltipContent side="top">
        <div className="flex flex-col gap-1">
          <span className="text-[9px] opacity-60 font-medium">Avance del usuario</span>
          <span className="flex items-center gap-1.5 tabular-nums">
            <span className="h-2 w-2 rounded-full bg-status-positive shrink-0" />
            Completado {formatProgress(completed)}
          </span>
          <span className="flex items-center gap-1.5 tabular-nums">
            <span className="h-2 w-2 rounded-full bg-status-warning shrink-0" />
            En curso {formatProgress(inFlight)}
          </span>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

export const PerformanceIndicator: React.FC<{ level: PerformanceLevel }> = ({ level }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 text-[11px] font-bold whitespace-nowrap",
      PERFORMANCE_CLASS[level]
    )}
  >
    <BarChart3 className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
    {level}
  </span>
);
