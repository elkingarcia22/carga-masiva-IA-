import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  STATUS_CLASS,
  TONE_COLOR,
  TONE_HINT,
  formatProgress,
  getProgressTone,
} from "./progressFormat";
import type { ObjectiveCycleStatus } from "@/mocks/types";

/**
 * Bar only — the numeric value lives in its own "% avance" column, so the two
 * never fight for the same space. Values past 100% cap the bar but keep their
 * real number in the tooltip and the adjacent column.
 */
export const CycleProgressBar: React.FC<{ progress: number }> = ({ progress }) => {
  const tone = getProgressTone(progress);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="w-full max-w-[120px] cursor-default">
          <Progress
            value={Math.min(progress, 100)}
            color={TONE_COLOR[tone]}
            className={cn("h-1.5", tone === "empty" && "opacity-40")}
            aria-label={`Avance ${formatProgress(progress)}`}
          />
        </div>
      </TooltipTrigger>
      <TooltipContent side="top">
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] opacity-60 font-medium">{TONE_HINT[tone]}</span>
          <span className="tabular-nums">{formatProgress(progress)}</span>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

export const CycleStatusBadge: React.FC<{ status: ObjectiveCycleStatus }> = ({ status }) => (
  <Badge
    variant="outline"
    className={cn(
      "text-[10px] font-bold border-none px-2 py-0.5 rounded-full pointer-events-none whitespace-nowrap",
      STATUS_CLASS[status]
    )}
  >
    {status}
  </Badge>
);
