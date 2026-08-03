import * as React from "react";
import { cn } from "@/lib/utils";

interface UbitsProductHeaderProps {
  title: string;
  logo?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export const UbitsProductHeader: React.FC<UbitsProductHeaderProps> = ({
  title,
  logo,
  children,
  className,
}) => {
  return (
    <header
      className={cn(
        "flex items-center justify-between w-full h-16 bg-white border border-border shadow-sm rounded-xl px-6",
        className
      )}
    >
      <div className="flex items-center gap-4">
        {logo || (
          <div className="flex items-center gap-3 pr-4 border-r border-border">
            <div className="bg-destructive/10 text-destructive font-black text-sm px-2 py-0.5 rounded italic tracking-tighter">
              SODIMAC
            </div>
          </div>
        )}
        <h1 className="text-xl font-bold text-text-primary tracking-tight">
          {title}
        </h1>
      </div>
      
      <div className="flex items-center gap-4">
        {children}
      </div>
    </header>
  );
};
