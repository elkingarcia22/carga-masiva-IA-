import * as React from "react";
import { cn } from "@/lib/utils";
import { UbitsIcon } from "@/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import type { NavigationItem, NavigationSection } from "./navigationTypes";
import type { IconName } from "@/icons";

interface SidebarProps {
  items: NavigationSection[];
  activeId?: string;
  onItemClick?: (id: string) => void;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  role?: string;
  activeItemId?: string;
  onItemSelect?: (id: string) => void;
}

/**
 * UBITS PREMIUM RAIL SIDEBAR
 * Stabilized version for Hotfix 8.6C.1.
 * Uses semantic tokens only: bg-nav, text-nav-foreground, bg-primary.
 */
export const PlaygroundSidebar: React.FC<SidebarProps> = ({
  items,
  activeId,
  onItemClick,
  header,
  footer,
  className,
  activeItemId,
  onItemSelect,
}) => {
  const currentActiveId = activeId || activeItemId;
  const handleItemClick = onItemClick || onItemSelect;

  const renderItem = (item: NavigationItem) => {
    const isActive = currentActiveId === item.id;

    return (
      <Tooltip key={item.id} delayDuration={0}>
        <TooltipTrigger asChild>
          <button
            onClick={() => handleItemClick?.(item.id)}
            className={cn(
              "relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 group outline-none",
              isActive 
                ? "bg-primary text-primary-foreground shadow-lg shadow-brand/20 scale-110" 
                : "text-nav-foreground/40 hover:bg-white/10 hover:text-nav-foreground"
            )}
          >
            <UbitsIcon 
              name={item.icon as IconName} 
              size="sm" 
              tone="inverse"
              className={cn(
                "transition-transform duration-300",
                isActive ? "scale-110 opacity-100" : "opacity-100 group-hover:scale-110"
              )} 
            />
            {isActive && (
              <div className="absolute -left-4 w-1 h-6 bg-primary rounded-r-full shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={20} className="font-medium">
          {item.label}
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <TooltipProvider>
      <aside
        className={cn(
          "fixed left-6 top-4 bottom-4 w-20 ubits-premium-sidebar-rail flex flex-col items-center py-6 rounded-[32px] shadow-2xl z-50 border border-white/5",
          className
        )}
      >
        {/* Header / Logo */}
        <div className="mb-8 flex-shrink-0">
          {header}
        </div>

        {/* Navigation Body with Original Subtle Scrollbar */}
        <div 
          className="flex-1 flex flex-col items-center w-full overflow-y-auto pt-1 px-4 space-y-6 custom-sidebar-scroll"
        >
          <style dangerouslySetInnerHTML={{ __html: `
            .custom-sidebar-scroll::-webkit-scrollbar {
              width: 4px;
            }
            .custom-sidebar-scroll::-webkit-scrollbar-track {
              background: transparent;
            }
            .custom-sidebar-scroll::-webkit-scrollbar-thumb {
              background: rgba(255, 255, 255, 0.1);
              border-radius: 10px;
            }
            .custom-sidebar-scroll::-webkit-scrollbar-thumb:hover {
              background: rgba(255, 255, 255, 0.2);
            }
            /* Firefox alternative */
            .custom-sidebar-scroll {
              scrollbar-width: thin;
              scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
            }
          `}} />
          
          {items.map((section) => (
            <div key={section.id} className="flex flex-col items-center w-full space-y-4">
              {section.items.map(renderItem)}
            </div>
          ))}
        </div>

        {/* Footer / User Profile */}
        <div className="mt-auto pt-6 flex-shrink-0">
          {footer}
        </div>
      </aside>
    </TooltipProvider>
  );
};
