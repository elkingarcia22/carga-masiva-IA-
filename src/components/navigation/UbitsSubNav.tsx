import * as React from "react";
import { cn } from "@/lib/utils";
import { UbitsIcon } from "@/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SUB_NAV_VARIANTS } from "@/config/subNavNavigation";
import type { SubNavVariantKey } from "@/config/subNavNavigation";

export interface UbitsSubNavProps {
  variant?: SubNavVariantKey;
  activeTabId?: string;
  onTabChange?: (id: string) => void;
  showLogo?: boolean;
  clientName?: string;
  className?: string;
  isSticky?: boolean;
}

/**
 * UBITS ULTRA-CLEAN SUB-NAV
 * Stabilized version for Hotfix 8.6C.1.
 * Removed hardcoded HEX and non-semantic classes.
 */
export const UbitsSubNav: React.FC<UbitsSubNavProps> = ({
  variant = 'template',
  activeTabId,
  onTabChange,
  showLogo = true,
  clientName = "Client",
  className,
  isSticky = true,
}) => {
  const config = SUB_NAV_VARIANTS[variant] || SUB_NAV_VARIANTS.template;
  const currentTabId = activeTabId || config.tabs[0].id;
  const activeTab = config.tabs.find(t => t.id === currentTabId) || config.tabs[0];

  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <header 
      className={cn(
        "w-full h-[40px] bg-card border border-border/40 rounded-full px-5 flex items-center justify-between transition-all duration-300 z-[40]",
        isSticky && "sticky top-4",
        className
      )}
    >
      {/* Left Area: Logo & Navigation */}
      <div className="flex items-center h-full gap-5 flex-1 overflow-hidden">
        {showLogo && (
          <div className="flex items-center gap-2 pr-5 border-r border-border/40 h-4">
            <div className="w-5 h-5 bg-primary rounded flex items-center justify-center">
               <UbitsIcon name="sparkles" size="xs" tone="inverse" />
            </div>
            <span className="text-[12px] font-bold tracking-tight text-foreground/70">{clientName}</span>
          </div>
        )}

        {isMobile ? (
          /* Mobile: Module Selector */
          <div className="flex items-center gap-2">
             <DropdownMenu>
               <DropdownMenuTrigger asChild>
                 <button className="flex items-center gap-1 text-[13px] font-bold text-foreground hover:text-primary transition-colors">
                   {activeTab.label}
                   <UbitsIcon name="chevronDown" size="xs" className="opacity-30" />
                 </button>
               </DropdownMenuTrigger>
               <DropdownMenuContent align="start" className="w-56 rounded-lg p-1 border-border/40 shadow-xl">
                 {config.tabs.map((tab) => (
                   <DropdownMenuItem 
                     key={tab.id}
                     onClick={() => onTabChange?.(tab.id)}
                     className={cn(
                       "flex items-center gap-2 rounded px-2 py-1.5 cursor-pointer text-[13px]",
                       tab.id === currentTabId ? "text-primary font-bold bg-primary/5" : "text-muted-foreground"
                     )}
                   >
                     {tab.icon && <UbitsIcon name={tab.icon} size="xs" />}
                     {tab.label}
                   </DropdownMenuItem>
                 ))}
               </DropdownMenuContent>
             </DropdownMenu>
          </div>
        ) : (
          /* Desktop: Clean Horizontal Tabs */
          <nav className="flex items-center gap-2 h-full overflow-x-auto no-scrollbar">
            {config.tabs.map((tab) => {
              const isActive = tab.id === currentTabId;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange?.(tab.id)}
                  className={cn(
                    "relative h-full px-2.5 flex items-center gap-2 transition-all group outline-none",
                    isActive ? "text-primary font-bold" : "text-muted-foreground/60 hover:text-foreground"
                  )}
                >
                  {tab.icon && (
                    <UbitsIcon 
                      name={tab.icon} 
                      size="xs" 
                      className={cn(
                        "opacity-50 transition-all",
                        isActive ? "opacity-100 scale-105" : "group-hover:opacity-100 group-hover:scale-105"
                      )} 
                    />
                  )}
                  <span className="text-[12px] whitespace-nowrap font-medium">{tab.label}</span>
                  
                  {/* Underline grow effect - thinner and more subtle */}
                  <div 
                    className={cn(
                      "absolute bottom-0 left-0 right-0 h-[1.5px] bg-primary rounded-t-full transition-all duration-300 transform origin-center",
                      isActive ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0 group-hover:scale-x-40 group-hover:opacity-10"
                    )}
                  />
                </button>
              );
            })}
          </nav>
        )}
      </div>

      {/* Right Area: Minimal Tools */}
      <div className="flex items-center gap-1.5 ml-4">
         <button className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-muted/40 transition-colors text-muted-foreground/50 hover:text-foreground">
            <UbitsIcon name="search" size="xs" />
         </button>
         <button className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-muted/40 transition-colors text-muted-foreground/50 hover:text-foreground">
            <UbitsIcon name="settings" size="xs" />
         </button>
      </div>
    </header>
  );
};
