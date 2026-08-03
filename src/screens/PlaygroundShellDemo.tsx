import * as React from "react";
import { Settings, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import {
  PlaygroundSidebar,
  UbitsTabs
} from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { ShellChromeContext } from "@/components/layout";
import { UsuariosSinObjetivosDashboard } from "@/screens/UsuariosSinObjetivosDashboard";
import { UbitsIcon } from "@/icons";
import { UbitsLogo } from "@/components/ui/UbitsLogo";
import { getPlaygroundNavigation } from "@/config/playgroundNavigation";
import type { PlaygroundRole } from "@/config/playgroundNavigation";

/**
 * FINAL SHELL ARCHITECTURE: Integrated Sub-Nav
 * Stabilized version for Hotfix 8.6C.1.
 * Removed hardcoded HEX and non-semantic classes.
 */
interface PlaygroundShellProps {
  children?: React.ReactNode;
}

export const PlaygroundShellDemo: React.FC<PlaygroundShellProps> = ({ children }) => {
  const [role] = React.useState<PlaygroundRole>("admin");
  const [activeSidebarId, setActiveSidebarId] = React.useState("desempeño");
  const [activeTabId, setActiveTabId] = React.useState("ciclos_objetivos");
  const [isDark, setIsDark] = React.useState(false);
  // True while a child screen owns the whole content area (e.g. a cycle's
  // detail), in which case the section tabs and their actions step aside.
  const [isChromeHidden, setChromeHidden] = React.useState(false);

  const shellChrome = React.useMemo(
    () => ({ isChromeHidden, setChromeHidden }),
    [isChromeHidden]
  );

  // Global Theme Sync
  React.useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  // Get navigation items from centralized config
  const activeItems = getPlaygroundNavigation(role);


  return (
    <div className="flex w-full min-h-screen bg-background font-sans transition-all duration-700 overflow-hidden">
      {/* Rail Sidebar */}
      <PlaygroundSidebar 
        role={role === "creator" || role === "recruitment" ? "shared" : role}
        activeItemId={activeSidebarId}
        onItemSelect={(id: string) => {
          setActiveSidebarId(id);
          // Reset tab to first one on section change
          setActiveTabId(""); 
        }}
        items={activeItems}
        header={<UbitsLogo size={28} />}
        footer={
          <div className="flex flex-col items-center gap-4">
             {role === "admin" && (
                <>
                  <button className="w-10 h-10 rounded-full flex items-center justify-center text-nav-foreground/40 hover:text-nav-foreground hover:bg-nav-foreground/10 transition-all">
                     <UbitsIcon name="code" size="sm" tone="inverse" />
                  </button>
                  <button className="w-10 h-10 rounded-full flex items-center justify-center text-nav-foreground/40 hover:text-nav-foreground hover:bg-nav-foreground/10 transition-all">
                     <UbitsIcon name="help" size="sm" tone="inverse" />
                  </button>
                </>
             )}
             <button 
                onClick={toggleTheme}
                className="w-10 h-10 rounded-full flex items-center justify-center text-nav-foreground/40 hover:text-nav-foreground hover:bg-nav-foreground/10 transition-all"
             >
                <UbitsIcon name={isDark ? "sun" : "moon"} size="sm" tone="inverse" />
             </button>
             <div className="relative pt-2 group cursor-pointer">
                <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-nav-foreground/20 shadow-xl transition-transform group-hover:scale-110">
                   <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150&h=150" alt="User" />
                </div>
             </div>
          </div>
        }
      />

      {/* Main Content Area */}
      <main className="flex-1 ml-[143px] flex flex-col px-8 pb-8 overflow-y-auto">
         {/* Dual-Tab Navigation Integration */}
         <div className="w-full max-w-7xl mx-auto mb-10 pt-4">
            {/* Section-level chrome. A child screen that owns the full content
                area (a cycle's detail) hides it, since neither the tabs nor the
                section actions apply once you are inside a single record. */}
            {!isChromeHidden && (
              <div className="mb-8 flex items-center justify-between gap-6">
                <UbitsTabs
                  tabs={[
                    { id: "ciclos_objetivos", label: "Ciclos de objetivos" },
                    { id: "usuarios_sin_objetivos", label: "Usuarios sin objetivos" }
                  ]}
                  activeTabId={activeTabId}
                  onTabChange={(id) => setActiveTabId(id)}
                  className="mb-0"
                />

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    className="h-10 px-4 gap-2 text-xs font-semibold rounded-xl border-border/60 text-text-secondary hover:bg-primary/5 hover:border-primary/50 hover:text-primary transition-all shadow-sm active:scale-95"
                    onClick={() => toast.info("Configuración de objetivos")}
                  >
                    <Settings className="h-4 w-4" />
                    <span>Configuración</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-10 px-4 gap-2 text-xs font-semibold rounded-xl border-border/60 text-text-secondary hover:bg-primary/5 hover:border-primary/50 hover:text-primary transition-all shadow-sm active:scale-95"
                    onClick={() => toast.info("Permisos de objetivos")}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span>Permisos</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Content Injection Area */}
            <div className="min-h-[70vh]">
              <ShellChromeContext.Provider value={shellChrome}>
                {activeTabId === "ciclos_objetivos" ? (
                  children
                ) : activeTabId === "usuarios_sin_objetivos" ? (
                  <UsuariosSinObjetivosDashboard />
                ) : (
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl opacity-20 select-none py-20">
                    <UbitsLogo size={80} />
                    <div className="mt-4 text-center">
                      <p className="text-xs font-bold text-foreground/60">
                          Content Area • {activeSidebarId}
                      </p>
                      <p className="text-[10px] font-medium text-muted-foreground mt-1">
                          Active tab: {activeTabId || "Default"}
                      </p>
                    </div>
                  </div>
                )}
              </ShellChromeContext.Provider>
            </div>
         </div>
      </main>
    </div>
  );
};
