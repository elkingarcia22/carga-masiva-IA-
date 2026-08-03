import * as React from "react";
import {
  AlertTriangle,
  Calendar,
  Check,
  Download,
  FileSearch,
  FileText,
  Info,
  Sparkles,
  Target,
  Upload,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DrawerShell } from "@/components/overlays/DrawerShell";
import { EmptyState } from "@/components/feedback/EmptyState";
import { UploadZone } from "@/components/upload/UploadZone";
import {
  OBJECTIVES_IMPORT_ACCEPT,
  OBJECTIVES_IMPORT_MAX_MB,
  OBJECTIVES_TEMPLATE_COLUMNS,
  analyzeObjectivesFiles,
  getImmediateValidationError,
  type DetectedObjectivesAnalysis,
} from "@/lib/objectivesImport";

/**
 * CargaMasivaDrawer
 *
 * Bulk upload of objectives for a cycle, following the same side-panel flow as
 * the historical survey load: pick files → analyse → review what was detected →
 * confirm. It is deliberately not a bulk *action* on selected rows — the input
 * is a file, so the table's selection has nothing to do with it.
 */

type UploadStep = 'dropzone' | 'summary' | 'loading' | 'error' | 'empty';

interface RecentUpload {
  id: string;
  name: string;
  loadedAt: string;
  objectivesCount: number;
}

/** Loads made in the last 7 days — populates the "Cargas" tab. */
const RECENT_UPLOADS: RecentUpload[] = [
  { id: "ru-1", name: "Objetivos Comercial Q3.xlsx", loadedAt: "Hoy, 09:14", objectivesCount: 42 },
  { id: "ru-2", name: "Metas Tecnología 2026.xlsx", loadedAt: "Ayer, 16:40", objectivesCount: 28 },
  { id: "ru-3", name: "Objetivos People marzo.csv", loadedAt: "Hace 3 días", objectivesCount: 17 },
  { id: "ru-4", name: "Carga inicial Operaciones.xlsx", loadedAt: "Hace 5 días", objectivesCount: 63 },
];

/** Copy for the analysis overlay, stepped so it reads like real work. */
function getAnalyzingCopy(progress: number, filesCount: number): { status: string } {
  const plural = filesCount === 1 ? "archivo" : "archivos";
  if (progress < 20) return { status: `Abriendo ${filesCount} ${plural}...` };
  if (progress < 45) return { status: "Leyendo la estructura de cada archivo..." };
  if (progress < 70) return { status: "Identificando usuarios y objetivos..." };
  if (progress < 90) return { status: "Validando pesos y fechas..." };
  return { status: "Finalizando análisis..." };
}

/** One headline number in the summary. */
const SummaryStat: React.FC<{
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
}> = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3 p-3.5 rounded-xl border border-border/50 bg-surface">
    <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
      <Icon className="h-4 w-4" strokeWidth={2.25} />
    </div>
    <div className="min-w-0">
      <p className="text-[17px] font-extrabold text-text-primary tabular-nums leading-none">{value}</p>
      <p className="text-[11px] font-medium text-text-secondary/60 mt-1">{label}</p>
    </div>
  </div>
);

interface CargaMasivaDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Name of the cycle the objectives land in. */
  cycleName: string;
  /** Usernames/emails already on the cycle, used to resolve the file's rows. */
  rosterIdentifiers: string[];
  /** Fired once a load finishes, so the caller can refresh its list. */
  onUploaded?: (objectivesCount: number) => void;
}

export const CargaMasivaDrawer: React.FC<CargaMasivaDrawerProps> = ({
  open,
  onOpenChange,
  cycleName,
  rosterIdentifiers,
  onUploaded,
}) => {
  const [tab, setTab] = React.useState<'nueva' | 'cargas'>('nueva');
  const [step, setStep] = React.useState<UploadStep>('dropzone');
  const [files, setFiles] = React.useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [analysis, setAnalysis] = React.useState<DetectedObjectivesAnalysis | null>(null);
  const [error, setError] = React.useState<{ title: string; detail: string } | null>(null);

  const reset = () => {
    setStep('dropzone');
    setFiles([]);
    setIsAnalyzing(false);
    setProgress(0);
    setAnalysis(null);
    setError(null);
  };

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (!next) reset();
  };

  /** Drives the overlay bar while the (mock) parse runs, then applies the outcome. */
  const runWithProgress = async (work: () => Promise<void>) => {
    setIsAnalyzing(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((current) => (current >= 96 ? current : current + 4));
    }, 40);

    try {
      await work();
    } finally {
      clearInterval(interval);
      setProgress(100);
      setIsAnalyzing(false);
    }
  };

  const handleAnalyze = () => {
    void runWithProgress(async () => {
      const outcome = await analyzeObjectivesFiles(files, rosterIdentifiers);

      if (outcome.kind === 'error') {
        setError({ title: outcome.title, detail: outcome.detail });
        setAnalysis(null);
        setStep('error');
        return;
      }

      if (outcome.result.rows.length === 0) {
        setAnalysis(outcome.result);
        setStep('empty');
        return;
      }

      setAnalysis(outcome.result);
      setStep('summary');
    });
  };

  const handleConfirm = () => {
    const total = analysis?.rows.length ?? 0;
    setStep('loading');
    void runWithProgress(async () => {
      await new Promise((resolve) => setTimeout(resolve, 900));
    }).then(() => {
      toast.success(`${total} objetivos cargados en "${cycleName}"`);
      onUploaded?.(total);
      handleOpenChange(false);
    });
  };

  const title =
    step === 'summary' ? "Revisa lo que detectamos"
    : step === 'loading' ? "Cargando objetivos"
    : step === 'error' ? "No pudimos continuar"
    : step === 'empty' ? "No encontramos objetivos"
    : "Carga masiva de objetivos";

  const description =
    step === 'summary' ? "Verifica la información antes de cargarla al ciclo."
    : step === 'loading' ? "Estamos guardando los objetivos en el ciclo."
    : step === 'error' ? "Revisa el archivo e inténtalo de nuevo."
    : step === 'empty' ? "No pudimos detectar objetivos en este archivo."
    : "Sube un archivo con los objetivos o revisa tus cargas recientes.";

  return (
    <DrawerShell
      open={open}
      onOpenChange={handleOpenChange}
      title={title}
      description={description}
      side="right"
      size="md"
      className="!w-[40vw] !max-w-[40vw] border-l shadow-drawer transition-all duration-500"
      footer={
        <>
          {/* The loads list is read-only, so it gets no wizard footer. */}
          {!(step === 'dropzone' && tab === 'cargas') && step !== 'loading' && (
            <div className="px-5 py-4 bg-background border-t border-border/40 shadow-[0_-10px_20px_rgba(0,0,0,0.03)] shrink-0 z-20 flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-11 text-xs font-bold tracking-tight rounded-xl"
                onClick={() => handleOpenChange(false)}
              >
                Cancelar
              </Button>

              {step === 'dropzone' && (
                <Button
                  disabled={files.length === 0}
                  onClick={handleAnalyze}
                  className="flex-1 gap-2.5 h-11 text-xs font-bold tracking-tight shadow-lg shadow-primary/20 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-30 disabled:grayscale"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Analizar {files.length > 0 ? `(${files.length})` : ""}</span>
                </Button>
              )}

              {step === 'summary' && (
                <Button
                  onClick={handleConfirm}
                  className="flex-1 gap-2.5 h-11 text-xs font-bold tracking-tight shadow-lg shadow-primary/20 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.98]"
                >
                  <Upload className="h-4 w-4" />
                  <span>Cargar objetivos</span>
                </Button>
              )}

              {(step === 'error' || step === 'empty') && (
                <Button
                  onClick={() => {
                    setError(null);
                    setFiles([]);
                    setStep('dropzone');
                  }}
                  className="flex-1 gap-2.5 h-11 text-xs font-bold tracking-tight shadow-lg shadow-primary/20 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.98]"
                >
                  <Upload className="h-4 w-4" />
                  <span>Subir otro archivo</span>
                </Button>
              )}
            </div>
          )}

          {/* Analysis overlay, confined to the panel rather than the viewport. */}
          {isAnalyzing && (
            <div className="absolute inset-4 z-[60] rounded-3xl bg-ai-gradient p-[2px] shimmer-mirror shadow-sm animate-in fade-in duration-300 select-none">
              <div className="relative z-10 h-full w-full rounded-[22px] bg-background flex flex-col items-center justify-center text-center px-10">
                <div className="relative w-16 h-16 flex items-center justify-center mb-3">
                  <div className="absolute w-11 h-11 rounded-full bg-ai-gradient opacity-20 blur-xl animate-pulse" />
                  <Sparkles className="relative h-9 w-9 text-primary" strokeWidth={1.75} />
                </div>

                <h3 className="text-lg font-bold tracking-tight mb-1 text-ai-gradient">
                  {step === 'loading' ? "Cargando objetivos" : "Analizando archivos"}
                </h3>

                <div className="w-full max-w-[300px] mt-6 space-y-2.5">
                  <div className="flex justify-between text-xs text-text-secondary font-bold px-1">
                    <span>
                      {step === 'loading'
                        ? "Guardando en el ciclo..."
                        : getAnalyzingCopy(progress, files.length).status}
                    </span>
                    <span className="text-ai-gradient tabular-nums">{progress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-ai-gradient rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <p className="text-xs text-text-secondary/60 mt-6 max-w-[300px]">
                  {step === 'loading'
                    ? "No cierres esta ventana hasta que termine."
                    : "Estamos extrayendo y validando la información de tus objetivos."}
                </p>
              </div>
            </div>
          )}
        </>
      }
    >
      {step === 'dropzone' && (
        <Tabs
          value={tab}
          onValueChange={(value) => setTab(value as 'nueva' | 'cargas')}
          className="flex flex-col flex-1 min-h-0"
        >
          <TabsList className="grid grid-cols-2 w-full h-11 p-1 gap-1 bg-surface-muted rounded-xl shrink-0 mb-4">
            <TabsTrigger
              value="nueva"
              className="gap-2 h-full text-[13px] font-bold tracking-tight rounded-lg text-text-secondary/70 transition-all data-[state=active]:bg-surface data-[state=active]:text-primary data-[state=active]:shadow-sm"
            >
              <Upload className="h-4 w-4" />
              Nueva carga
            </TabsTrigger>
            <TabsTrigger
              value="cargas"
              className="gap-2 h-full text-[13px] font-bold tracking-tight rounded-lg text-text-secondary/70 transition-all data-[state=active]:bg-surface data-[state=active]:text-primary data-[state=active]:shadow-sm"
            >
              <FileText className="h-4 w-4" />
              Cargas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="nueva" className="flex-1 min-h-0 overflow-y-auto mt-0 focus-visible:outline-none">
            <div className="flex flex-col gap-4">
              <div className="rounded-xl border border-border/40 bg-surface-subtle/60 p-4 space-y-2.5">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-text-secondary/80 leading-relaxed">
                    Los objetivos se cargarán en{" "}
                    <span className="font-bold text-text-primary">{cycleName}</span>. Tu archivo debe
                    incluir estas columnas:
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5 pl-6">
                  {OBJECTIVES_TEMPLATE_COLUMNS.map((label) => (
                    <span
                      key={label}
                      className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-surface-muted text-text-secondary"
                    >
                      {label}
                    </span>
                  ))}
                </div>
                <div className="pl-6 pt-1">
                  <button
                    type="button"
                    onClick={() => toast.info("Descargando plantilla de objetivos")}
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-primary hover:underline"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Descargar plantilla
                  </button>
                </div>
              </div>

              <UploadZone
                value={files}
                onChange={setFiles}
                accept={OBJECTIVES_IMPORT_ACCEPT}
                multiple
                maxSizeMB={OBJECTIVES_IMPORT_MAX_MB}
                validate={getImmediateValidationError}
                label="Archivo de objetivos"
                description={`Formatos aceptados: CSV, XLS y XLSX. Máximo ${OBJECTIVES_IMPORT_MAX_MB} MB.`}
              />
            </div>
          </TabsContent>

          <TabsContent value="cargas" className="flex-1 min-h-0 overflow-y-auto mt-0 focus-visible:outline-none">
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-bold text-text-primary tracking-tight">Historial de cargas</h3>
                <span className="px-2 py-1 bg-muted text-text-secondary/60 rounded text-[10px] font-bold uppercase tracking-wide">
                  Últimos 7 días
                </span>
              </div>

              <div className="space-y-2">
                {RECENT_UPLOADS.map((upload) => (
                  <div
                    key={upload.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-surface"
                  >
                    <div className="h-9 w-9 rounded-lg bg-surface-muted text-text-secondary/50 flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4" strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-text-primary truncate">{upload.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge className="bg-primary/5 text-primary border-none text-[9px] font-bold px-2 py-0 rounded-full pointer-events-none">
                          {upload.objectivesCount} objetivos
                        </Badge>
                        <span className="text-[10px] text-text-secondary/50 font-medium flex items-center gap-1">
                          <Calendar className="h-2.5 w-2.5" />
                          {upload.loadedAt}
                        </span>
                      </div>
                    </div>
                    <span className="text-status-positive shrink-0" aria-label="Carga completada">
                      <Check className="h-4 w-4" strokeWidth={3} />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}

      {step === 'summary' && analysis && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2.5">
            <SummaryStat icon={Target} label="Objetivos detectados" value={String(analysis.rows.length)} />
            <SummaryStat icon={Users} label="Usuarios involucrados" value={String(analysis.userCount)} />
          </div>

          {analysis.warnings.map((warning) => (
            <Alert key={warning.id} variant={warning.severity === 'warning' ? 'warning' : 'info'}>
              {warning.severity === 'warning' ? (
                <AlertTriangle className="h-4 w-4" />
              ) : (
                <Info className="h-4 w-4" />
              )}
              <AlertDescription className="text-xs">
                <span className="font-bold">{warning.title}.</span> {warning.detail}
              </AlertDescription>
            </Alert>
          ))}

          <div className="rounded-xl border border-border/50 bg-surface overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
              <span className="text-[11px] font-bold text-text-secondary/40 uppercase tracking-widest">
                Objetivos a crear
              </span>
              <span className="text-[11px] font-bold text-text-secondary/60 tabular-nums">
                {analysis.rows.length}
              </span>
            </div>
            <div className="max-h-[280px] overflow-y-auto px-4">
              {analysis.rows.map((row, index) => (
                <div
                  key={`${row.identifier}-${index}`}
                  className="flex items-start gap-2.5 py-2.5 border-b border-border/25 last:border-b-0"
                >
                  <span className="text-sm font-bold text-text-secondary/40 tabular-nums shrink-0 mt-0.5">
                    {index + 1}.
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] text-text-primary leading-snug">{row.objectiveTitle}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-surface-muted text-text-secondary max-w-full truncate">
                        {row.identifier}
                      </span>
                      <span className="text-[11px] text-text-secondary/60 font-medium tabular-nums">
                        Peso {row.weightPercent}%
                      </span>
                      {!row.isKnownUser && (
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-md text-[11px] font-bold inline-flex items-center gap-1",
                            "bg-status-warning/15 text-status-warning"
                          )}
                        >
                          <AlertTriangle className="h-3 w-3" strokeWidth={2.5} />
                          Nuevo en el ciclo
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 'error' && error && (
        <EmptyState
          title={error.title}
          description={error.detail}
          icon={AlertTriangle}
          className="border-none bg-transparent py-16"
        />
      )}

      {step === 'empty' && (
        <EmptyState
          title="No encontramos objetivos"
          description="Revisa que el archivo tenga las columnas de la plantilla y al menos una fila con datos."
          icon={FileSearch}
          className="border-none bg-transparent py-16"
        />
      )}
    </DrawerShell>
  );
};
