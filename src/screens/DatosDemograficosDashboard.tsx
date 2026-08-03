import * as React from "react";
import { UbitsIcon } from "@/icons";
import { UbitsLogo } from "@/components/ui/UbitsLogo";

/**
 * DATOS DEMOGRÁFICOS DASHBOARD (PLACEHOLDER)
 * A premium-styled placeholder view for demographic analytics.
 */
export const DatosDemograficosDashboard: React.FC = () => {
  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between mb-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Datos Demográficos
          </h1>
          <p className="text-sm text-text-secondary">
            Gestión y segmentación avanzada de tu población.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
              <p className="text-[10px] tracking-wide text-muted-foreground/60 font-bold">Próximamente</p>
              <p className="text-[11px] font-medium text-text-secondary">Gestión Avanzada</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-brand/5 border border-brand/10 flex items-center justify-center text-brand">
            <UbitsIcon name="settings" size="sm" />
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center py-40 border-2 border-dashed border-border/40 rounded-[32px] bg-surface-subtle/50 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-brand/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          
          <div className="relative z-10 flex flex-col items-center text-center px-6">
            <div className="w-20 h-20 rounded-3xl bg-brand/5 flex items-center justify-center text-brand mb-6 shadow-sm border border-brand/10 group-hover:scale-110 transition-transform duration-500">
               <UbitsIcon name="users" size="lg" />
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">Panel Demográfico en Construcción</h2>
            <p className="text-sm text-text-secondary max-w-md mb-8">
              Estamos integrando las visualizaciones avanzadas por segmento para ofrecerte un análisis más profundo de tu organización.
            </p>
            
            <div className="flex items-center gap-2 px-4 py-2 bg-surface border border-border shadow-sm rounded-full">
               <div className="w-2 h-2 rounded-full bg-brand animate-pulse" />
               <p className="text-xs font-bold tracking-tight text-foreground/40">
                  Sincronizando con base de datos de colaboradores...
               </p>
            </div>
          </div>
      </div>
    </div>
  );
};
