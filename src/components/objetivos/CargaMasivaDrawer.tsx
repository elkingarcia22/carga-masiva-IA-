import * as React from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  ExternalLink,
  FileSearch,
  FileText,
  Filter,
  RefreshCw,
  Info,
  Minimize2,
  Pencil,
  Plus,
  Search,
  Sparkles,
  TrendingUp,
  Upload,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { DrawerShell } from "@/components/overlays/DrawerShell";
import { EmptyState } from "@/components/feedback/EmptyState";
import { UploadZone } from "@/components/upload/UploadZone";
import { ObjectivesReviewTable } from "@/components/objetivos/ObjectivesReviewTable";
import { FilterButton } from "@/components/objetivos/ListToolbar";
import {
  BULK_UPLOAD_MODES,
  OBJECTIVES_IMPORT_ACCEPT,
  OBJECTIVES_IMPORT_MAX_MB,
  analyzeObjectivesFiles,
  assignGroupUser,
  bucketForGroup,
  countObjectives,
  flattenGroups,
  getImmediateValidationError,
  getModeConfig,
  hasSavedEdits,
  isObjectiveValid,
  relinkObjective,
  type AnalyzeObjectivesOutcome,
  type BulkUploadMode,
  type DetectedObjectivesAnalysis,
  type ObjectiveUserGroup,
  type ParsedObjective,
  type RosterUser,
} from "@/lib/objectivesImport";
import { MEASURE_SYMBOL, type MeasureType } from "@/lib/objectivesImport/types";
import { validateObjective, groupWeightTotal, TOTAL_WEIGHT_PERCENT } from "@/lib/objectivesImport/rules";
import { buildUserIndex, matchIdentifier } from "@/lib/objectivesImport/matchUsers";

/**
 * CargaMasivaDrawer
 *
 * Bulk upload of objectives for a cycle, following the same side-panel flow as
 * the historical survey load: pick files → analyse → review what was detected →
 * confirm. It is deliberately not a bulk *action* on selected rows — the input
 * is a file, so the table's selection has nothing to do with it.
 *
 * The review step is where the work happens: the parsed objectives land in an
 * editable table split by what is blocking each user, the rules run on every
 * keystroke, and only the objectives of aligned users are loaded.
 */

/**
 * `loading` is gone: the load is a background task now, not a step.
 *
 * It used to be a full-screen bar the reviewer had to sit through. The bar
 * still exists, but it lives in the "Cargas" tab and in the corner tray, so the
 * wizard has nothing to show for it.
 */
type UploadStep = 'dropzone' | 'summary' | 'error' | 'empty' | 'detail';

/** El aviso de "este archivo es de otra operación", tal como llega del análisis. */
type TemplateMismatch = Extract<AnalyzeObjectivesOutcome, { kind: 'mismatch' }>;

/**
 * One objective as the load sees it: queued, written, or refused.
 *
 * The refusal has nothing to do with the review. Structure and alignment were
 * settled before the load started — what can still go wrong is the write
 * itself: the service times out, someone else touched the same user, the cycle
 * closed underneath us. Decided up front rather than as the load runs, so the
 * same file always fails the same rows.
 */
interface UploadRowResult {
  id: string;
  title: string;
  userName: string;
  userEmail?: string;
  userArea?: string;
  userLeader?: string;
  description?: string;
  weightPercent?: number;
  measureType?: string;
  trend?: string;
  initialValue?: number | null;
  target?: number;
  minProgress?: number | null;
  maxProgress?: number | null;
  newProgress?: number | null;
  status: 'pending' | 'uploaded' | 'failed' | 'unassigned' | 'analysis_error';
  analysisError?: string;
  willFail: boolean;
}

/** One load in flight, one that just finished, or one from the history. */
interface UploadTaskState {
  id: string;
  name: string;
  status: 'loading' | 'completed';
  /** Every objective the load was given, in the order it processes them. */
  rows: UploadRowResult[];
  /**
   * True when the load fell over as a whole rather than losing some rows.
   *
   * Two different events wearing the same red otherwise. A handful of refused
   * writes is the platform saying no to specific objectives — nothing to retry,
   * the answer would be the same. A service that is down refused nothing: it
   * never got asked, the data was fine, and the only sensible offer is to try
   * again. Only this one gets a "Reintentar".
   */
  serviceFailed?: boolean;
  /** Set for past loads; live ones are happening now and say so instead. */
  loadedAt?: string;
}

/**
 * Which rows fail, decided when the load starts rather than as it runs.
 *
 * Fixed positions instead of a dice roll per row: reopening the same file's
 * load has to report the same outcome every time.
 */
function failureFor(index: number): boolean {
  return index % 13 === 6 || index % 7 === 4 || index % 11 === 9;
}

/** Rows already answered for, over the total. Drives every bar for this task. */
function taskProgress(task: UploadTaskState): number {
  const uploadableRows = task.rows.filter((row) => row.status !== 'unassigned' && row.status !== 'analysis_error');
  if (uploadableRows.length === 0) return 100;
  const done = uploadableRows.filter((row) => row.status !== 'pending').length;
  return Math.round((done / uploadableRows.length) * 100);
}

function countByStatus(task: UploadTaskState, status: UploadRowResult['status']): number {
  return task.rows.filter((row) => row.status === status).length;
}

/**
 * One objective per tick.
 *
 * The bar used to be a number climbing on its own; now it is the count of rows
 * actually answered for, so the percentage and the detail list can never
 * disagree. Slow on purpose — a load whose failures scroll past in two seconds
 * is a load nobody reads.
 */
const UPLOAD_TICK_MS = 900;

interface RecentUpload {
  id: string;
  name: string;
  loadedAt: string;
  objectivesCount: number;
  /**
   * How many rows the service refused, stated rather than derived.
   *
   * Zero on every seeded load, and that is the point. A history that greets the
   * reviewer with two red counts reads as a product that drops data routinely,
   * which is a claim the demo has no business making — and it makes the red on
   * the load *they* just ran stop meaning anything, because red was already the
   * wallpaper. The failure story is told live, on the task card above this list,
   * where it is actually actionable.
   *
   * The field stays because the endpoint can genuinely come back with one, and
   * the row below renders it when it does.
   */
  failedCount: number;
}

/** Loads made in the last 7 days — populates the "Cargas" tab. */
const RECENT_UPLOADS: RecentUpload[] = [
  { id: "ru-1", name: "Objetivos Comercial Q3.xlsx", loadedAt: "Hoy, 09:14", objectivesCount: 42, failedCount: 0 },
  { id: "ru-2", name: "Metas Tecnología 2026.xlsx", loadedAt: "Ayer, 16:40", objectivesCount: 28, failedCount: 0 },
  { id: "ru-3", name: "Objetivos People marzo.csv", loadedAt: "Hace 3 días", objectivesCount: 17, failedCount: 0 },
  { id: "ru-4", name: "Carga inicial Operaciones.xlsx", loadedAt: "Hace 5 días", objectivesCount: 63, failedCount: 0 },
];

/**
 * Pace of the analysis overlay: ~5s to fill, then half a second at 100%.
 *
 * The length is set by the reading, not by the parsing — the parse itself lands
 * in a few hundred milliseconds. Six stages get narrated, so a two-second run
 * gave each line about a third of a second: the numbers flickered past before
 * they could be read, which is the same as not showing them. At five seconds
 * each stage holds for the better part of a second and the run reads as work
 * being done, one finding at a time.
 *
 * Few, large steps rather than many small ones. Every tick re-renders the
 * drawer, and at 45ms the ticks queued behind their own renders; at 150ms the
 * bar's 300ms CSS transition covers the gaps and the clock is the one written
 * here. The hold at the end is not padding either — a bar that reaches 100 and
 * disappears in the same frame reads as a bar that broke.
 */
const ANALYSIS_TICK_MS = 150;
const ANALYSIS_STEP = 3;
const ANALYSIS_HOLD_MS = 550;

/** What the parse actually found, for the second half of the narration. */
interface AnalysisFindings {
  sheetName?: string;
  objectives: number;
  users: number;
  /** Identifiers resolved outright by username or corporate e-mail. */
  matched: number;
  /** Resolved by name, document or phone — a person still has to confirm. */
  proposed: number;
  /** Identifiers UBITS has nobody for. */
  unmatched: number;
  /** Objectives whose data breaks a rule, among the users that have one. */
  invalid: number;
}

function summarizeFindings(result: DetectedObjectivesAnalysis): AnalysisFindings {
  return {
    sheetName: result.sheetName,
    objectives: countObjectives(result.groups),
    users: result.groups.length,
    matched: result.groups.filter((group) => group.matchStatus === 'matched').length,
    proposed: result.groups.filter((group) => group.matchStatus === 'possible').length,
    unmatched: result.groups.filter((group) => group.matchStatus === 'unmatched').length,
    invalid: result.groups
      .filter((group) => group.matchStatus !== 'unmatched')
      .flatMap((group) => group.objectives)
      .filter((objective) => !isObjectiveValid(objective)).length,
  };
}

/**
 * What the overlay says, stage by stage.
 *
 * The first two lines are the only ones written blind — until the file is open
 * there is nothing true to say about it. From there on every line reports a
 * number the review will show a second later, which is what makes the wait feel
 * like work being done instead of a spinner with captions. When the parse is
 * slower than the bar the generic line stands in, so the copy never invents a
 * count it does not have.
 */
function getAnalyzingCopy(
  progress: number,
  filesCount: number,
  findings: AnalysisFindings | null
): string {
  const plural = filesCount === 1 ? "archivo" : "archivos";
  if (progress < 16) return `Abriendo ${filesCount} ${plural}...`;

  if (progress < 34) {
    return findings?.sheetName
      ? `Leyendo la hoja "${findings.sheetName}"...`
      : "Leyendo la estructura del archivo...";
  }

  if (progress < 54) {
    if (!findings) return "Identificando objetivos y usuarios...";
    return `${findings.objectives} ${findings.objectives === 1 ? 'objetivo' : 'objetivos'} en ${findings.users} ${findings.users === 1 ? 'usuario' : 'usuarios'}`;
  }

  if (progress < 74) {
    if (!findings) return "Alineando los usuarios con UBITS...";
    if (findings.unmatched > 0) {
      return `${findings.unmatched} ${findings.unmatched === 1 ? 'identificador sin usuario' : 'identificadores sin usuario'} en UBITS`;
    }
    if (findings.proposed > 0) {
      return `${findings.proposed} ${findings.proposed === 1 ? 'usuario por confirmar' : 'usuarios por confirmar'}`;
    }
    return `${findings.matched} ${findings.matched === 1 ? 'usuario alineado' : 'usuarios alineados'} por username o correo`;
  }

  if (progress < 92) {
    if (!findings) return "Validando pesos, metas y direcciones...";
    return findings.invalid > 0
      ? `${findings.invalid} ${findings.invalid === 1 ? 'objetivo con datos por corregir' : 'objetivos con datos por corregir'}`
      : "Pesos, metas y direcciones sin errores";
  }

  if (progress < 100) return "Ordenando el resultado...";
  return "Análisis completo";
}

/** Icon per operation, kept next to the drawer rather than in the data module. */
const MODE_ICON: Record<BulkUploadMode, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  crear: Plus,
  editar: Pencil,
  actualizar: TrendingUp,
};

/**
 * One of the three operations, picked before anything is uploaded.
 *
 * The choice is made first because it changes what the file must contain —
 * creating needs a user to assign to, editing and updating need to point at
 * objectives that already exist — so showing the dropzone before it is settled
 * would invite the wrong file.
 */
const ModeCard: React.FC<{
  mode: BulkUploadMode;
  label: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
}> = ({ mode, label, description, selected, onSelect }) => {
  const Icon = MODE_ICON[mode];

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all duration-300",
        selected
          ? "border-primary bg-surface shadow-sm"
          : "border-border/40 bg-surface hover:border-border"
      )}
    >
      <div
        className={cn(
          "h-9 w-9 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300",
          selected ? "bg-primary text-text-inverse shadow-md shadow-primary/20" : "bg-surface-muted text-text-secondary/40"
        )}
      >
        <Icon className="h-4 w-4" strokeWidth={2.5} />
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-[13px] font-bold tracking-tight mb-0.5",
            selected ? "text-primary" : "text-text-primary"
          )}
        >
          {label}
        </p>
        <p className="text-[11px] text-text-secondary/60 font-medium leading-snug">{description}</p>
      </div>

      <div
        className={cn(
          "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300",
          selected ? "border-primary" : "border-border bg-surface-muted"
        )}
      >
        <div
          className={cn(
            "h-2.5 w-2.5 rounded-full bg-primary transition-all duration-300",
            selected ? "scale-100 opacity-100" : "scale-0 opacity-0"
          )}
        />
      </div>
    </button>
  );
};

interface CargaMasivaDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Name of the cycle the objectives land in. */
  cycleName: string;
  /** Users already on the cycle, used to resolve the file's rows. */
  roster: RosterUser[];
  /**
   * UBITS users beyond the cycle. Needed because a file can legitimately name
   * someone who still has to be added, and because the reviewer has to be able
   * to pick any UBITS user when an identifier does not resolve.
   */
  directory?: RosterUser[];
  /** Fired once a load finishes, so the caller can refresh its list. */
  onUploaded?: (objectivesCount: number) => void;
}

export const CargaMasivaDrawer: React.FC<CargaMasivaDrawerProps> = ({
  open,
  onOpenChange,
  cycleName,
  roster,
  directory = [],
  onUploaded,
}) => {
  const [tab, setTab] = React.useState<'nueva' | 'cargas'>('nueva');
  const [step, setStep] = React.useState<UploadStep>('dropzone');
  const [detailTask, setDetailTask] = React.useState<UploadTaskState | null>(null);
  const [detailSearch, setDetailSearch] = React.useState('');
  const [detailActiveTab, setDetailActiveTab] = React.useState<'exitosos' | 'pendientes'>('exitosos');
  const [detailStatusFilter, setDetailStatusFilter] = React.useState<string[]>([]);
  const [detailAreaFilter, setDetailAreaFilter] = React.useState<string[]>([]);
  const [detailLeaderFilter, setDetailLeaderFilter] = React.useState<string[]>([]);
  const [mode, setMode] = React.useState<BulkUploadMode>('crear');
  const [files, setFiles] = React.useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  /** Real counts from the parse, filled in mid-run so the overlay can cite them. */
  const [findings, setFindings] = React.useState<AnalysisFindings | null>(null);
  const [analysis, setAnalysis] = React.useState<DetectedObjectivesAnalysis | null>(null);
  const [error, setError] = React.useState<{ title: string; detail: string } | null>(null);
  /**
   * "Este archivo es de otra operación", contestado sin salir del dropzone.
   *
   * Vive aparte de `error` porque no es lo mismo: un error manda a su propia
   * pantalla y termina el intento, y esto se resuelve en el sitio, con la
   * operación que está dos dedos más arriba.
   */
  const [mismatch, setMismatch] = React.useState<TemplateMismatch | null>(null);

  /**
   * The review table's working copy. It starts as what the file said and drifts
   * as the user edits, so the analysis stays as the record of what was read.
   */
  const [groups, setGroups] = React.useState<ObjectiveUserGroup[]>([]);

  /** True while the review table is asking whether to remove something. */
  const [isConfirmingDelete, setConfirmingDelete] = React.useState(false);

  /**
   * The review, parked but not lost.
   *
   * A file with thirty users in it is not reviewed in one sitting: the reviewer
   * has to go look up who someone is, check a weight with their lead, open the
   * cycle in another tab. Closing the drawer used to throw all of that away, so
   * the only safe move was to leave it open and blocking the platform. Minimised
   * keeps every edit in this component's state — the drawer is merely hidden —
   * and leaves a card in the corner as the way back.
   */
  const [isMinimized, setIsMinimized] = React.useState(false);

  /** True while the footer is asking whether to discard the whole review. */
  const [isConfirmingCancel, setConfirmingCancel] = React.useState(false);
  const [isConfirmingPartialLoad, setConfirmingPartialLoad] = React.useState(false);
  /** Same question, asked from the minimised card instead of the footer. */
  const [isConfirmingTrayCancel, setConfirmingTrayCancel] = React.useState(false);

  /**
   * Loads started in this session, with their live progress.
   *
   * They outlive the drawer on purpose — the same way a browser's download tray
   * outlives the page that started the download. `reset()` does not touch them:
   * discarding a review has nothing to do with a load already on its way.
   */
  const [uploadTasks, setUploadTasks] = React.useState<UploadTaskState[]>([]);
  const [showTray, setShowTray] = React.useState(false);
  const [isTrayCollapsed, setTrayCollapsed] = React.useState(false);

  /** Read from inside the progress interval, which closes over a stale state. */
  const uploadTasksRef = React.useRef(uploadTasks);
  uploadTasksRef.current = uploadTasks;

  const modeConfig = getModeConfig(mode);

  const reset = () => {
    setStep('dropzone');
    setMode('crear');
    setFiles([]);
    setIsAnalyzing(false);
    setProgress(0);
    setFindings(null);
    setAnalysis(null);
    setError(null);
    setMismatch(null);
    setGroups([]);
    setConfirmingDelete(false);
    setIsMinimized(false);
    setConfirmingCancel(false);
    setConfirmingTrayCancel(false);
  };

  /**
   * Switching operation invalidates the picked file: each one expects different
   * columns, so keeping the previous selection would let the user analyse a
   * "crear" file as if it were an "actualizar" one.
   */
  const handleModeChange = (next: BulkUploadMode) => {
    if (next === mode) return;
    setMode(next);
    setFiles([]);
    setMismatch(null);
  };


  /**
   * A review in progress is worth protecting; an untouched dropzone is not.
   *
   * Only the summary step holds work that cannot be recreated by picking the
   * file again — the assignments, the created users, the corrected weights. So
   * that is the only step where closing means minimising and cancelling asks
   * first. Everywhere else the buttons stay literal.
   */
  const hasReviewInFlight = step === 'summary' && groups.length > 0;

  /** At least one load is still writing, so the "Cargas" tab has something to leave running. */
  const hasActiveUpload = uploadTasks.some((task) => task.status === 'loading');

  /** Hides the drawer without touching a single piece of the review's state. */
  const minimize = () => {
    setConfirmingCancel(false);
    setIsMinimized(true);
    onOpenChange(false);
  };

  const discard = () => {
    setConfirmingCancel(false);
    setConfirmingTrayCancel(false);
    onOpenChange(false);
    reset();
  };

  /**
   * The X, Escape and the overlay all land here. With a review open they
   * minimise: "cerrar" on a panel means "get this out of my way", and a
   * gesture that ambiguous must not be the one that destroys an hour of work.
   * Discarding has its own button, and that button asks.
   */
  const handleOpenChange = (next: boolean) => {
    if (next) {
      setIsMinimized(false);
      onOpenChange(true);
      return;
    }
    if (hasReviewInFlight) {
      minimize();
      return;
    }
    discard();
  };

  /**
   * Reopening from outside — the roster's own "Carga masiva" button — restores
   * the minimised review instead of starting an empty one, since that button is
   * the obvious thing to press when you want the panel back.
   */
  React.useEffect(() => {
    if (open) setIsMinimized(false);
  }, [open]);

  /**
   * The analysis, narrated.
   *
   * Two things were wrong with the old overlay. The bar stopped at 96% and the
   * panel swapped the instant the parse resolved, so the run never visibly
   * finished — it just vanished mid-sentence. And every line it printed was
   * written before the file was opened, so a run that found three unmatched
   * users and six broken rows said exactly what a clean one said.
   *
   * Now the bar owns the clock: it climbs to 100 on its own schedule, holds
   * there long enough to be read, and only then hands over. The parse runs
   * alongside and drops its real counts into `findings` the moment it lands, so
   * the second half of the narration reports what was actually found.
   */
  const handleAnalyze = (overrideMode?: BulkUploadMode) => {
    const activeMode = overrideMode ?? mode;
    setIsAnalyzing(true);
    setProgress(0);
    setFindings(null);
    setMismatch(null);

    /*
      Cuando la estructura sí permite saber la operación correcta — hoy, solo
      hacia "actualizar" — el sistema cambia por su cuenta y vuelve a analizar
      con ella. No hay nada que confirmar: la respuesta ya es segura, así que
      pedirle un clic al usuario solo repetiría un paso que ya se puede dar
      solo. La operación visible arriba se actualiza para que no quede
      diciendo una cosa mientras la revisión de abajo hace otra.
    */
    const parsing = analyzeObjectivesFiles(files, activeMode, roster, directory).then(
      (outcome): Promise<AnalyzeObjectivesOutcome> | AnalyzeObjectivesOutcome => {
        if (outcome.kind !== 'mismatch' || !outcome.suggested) return outcome;

        const correctedMode = outcome.suggested;
        setMode(correctedMode);
        return analyzeObjectivesFiles(files, correctedMode, roster, directory).then((resolved) =>
          resolved.kind === 'result'
            ? {
                kind: 'result',
                result: {
                  ...resolved.result,
                  notes: [
                    `Este archivo tiene la estructura de "${getModeConfig(correctedMode).label}", así que lo analizamos con esa operación.`,
                    ...resolved.result.notes,
                  ],
                },
              }
            : resolved
        );
      }
    );
    void parsing.then((outcome) => {
      if (outcome.kind === 'result') setFindings(summarizeFindings(outcome.result));
    });

    let value = 0;
    const interval = setInterval(() => {
      value = Math.min(100, value + ANALYSIS_STEP);
      setProgress(value);
      if (value < 100) return;

      clearInterval(interval);
      void parsing.then(async (outcome) => {
        // The full bar and its closing line need a beat of their own. Without
        // it, "Análisis completo" is painted and replaced in the same frame.
        await new Promise((resolve) => setTimeout(resolve, ANALYSIS_HOLD_MS));
        setIsAnalyzing(false);

        if (outcome.kind === 'error') {
          setError({ title: outcome.title, detail: outcome.detail });
          setAnalysis(null);
          setGroups([]);
          setStep('error');
          return;
        }

        /*
          Lo único que todavía llega hasta aquí como "mismatch" es el caso sin
          corrección posible: se eligió actualizar y al archivo le falta
          nuevo_avance, así que no hay manera de saber si es de crear o de
          editar. Se queda en el dropzone y no en la pantalla de error porque
          no hay nada roto que reparar — el archivo puede ser válido para otra
          operación, y esa operación está a un clic de distancia, justo
          encima.
        */
        if (outcome.kind === 'mismatch') {
          setMismatch(outcome);
          setAnalysis(null);
          setGroups([]);
          setTab('nueva');
          return;
        }

        setAnalysis(outcome.result);
        setGroups(outcome.result.groups);
        setStep(countObjectives(outcome.result.groups) === 0 ? 'empty' : 'summary');
      });
    }, ANALYSIS_TICK_MS);
  };

  // --- Review table edits (immutable, one group at a time) ------------------

  /**
   * Edits reach both halves of a card.
   *
   * The objectives the user already has in the cycle are as editable as the
   * file's own rows — lowering one of their weights is often the only way to
   * make room for what the file brings — so the patch is applied to whichever
   * of the two lists holds the id.
   */
  const updateObjective = (id: string, patch: Partial<ParsedObjective>) => {
    const applyTo = (objectives: ParsedObjective[]) =>
      objectives.map((objective) =>
        objective.id === id ? { ...objective, ...patch } : objective
      );

    setGroups((current) =>
      current.map((group) => {
        const ownsRow =
          group.objectives.some((objective) => objective.id === id) ||
          group.existing.some((objective) => objective.id === id);
        if (!ownsRow) return group;

        return {
          ...group,
          objectives: applyTo(group.objectives),
          existing: applyTo(group.existing),
          // Whatever a past "Confirmar" agreed to, it was not this edit — see
          // `reviewConfirmed`'s doc comment.
          reviewConfirmed: false,
        };
      })
    );
  };

  const removeObjectives = (ids: string[]) => {
    const removing = new Set(ids);
    setGroups((current) =>
      current
        .map((group) => {
          const objectives = group.objectives.filter(
            (objective) => !removing.has(objective.id)
          );
          if (objectives.length === group.objectives.length) return group;
          return { ...group, objectives, reviewConfirmed: false };
        })
        // A user with nothing left has no reason to stay in the table.
        .filter((group) => group.objectives.length > 0)
    );
  };

  /**
   * Points a file identifier at a UBITS user, or clears the association.
   *
   * Confirming moves the card to another tab, so it leaves the reviewer's field
   * of view the instant it succeeds — the toast is what tells them the click
   * landed and where it went, instead of a card seeming to vanish.
   *
   * Clearing says nothing: the field emptying in front of them is the feedback,
   * and the card stays where it is.
   */
  const assignUser = (identifier: string, user: RosterUser | null) => {
    setGroups((current) => assignGroupUser(current, identifier, user));
    if (!user) return;

    const count = groups.find((group) => group.identifier === identifier)?.objectives.length ?? 0;
    toast.success(`${count} ${count === 1 ? 'objetivo alineado' : 'objetivos alineados'} con ${user.name}`);
  };

  /**
   * The reviewer's "yes, load this" for a card whose identity was never in
   * question — an exact match from the start, or one already confirmed —
   * once every remaining problem is fixed.
   *
   * `assignUser` doubles as this for a card still settling who it is; this is
   * the twin for the one case that has nothing left to settle but the data.
   * See `reviewConfirmed`'s doc comment for why a card does not reach
   * "Objetivos listos para cargar" any other way.
   */
  const confirmGroupReady = (identifier: string) => {
    setGroups((current) =>
      current.map((group) =>
        group.identifier === identifier ? { ...group, reviewConfirmed: true } : group
      )
    );

    const count = groups.find((group) => group.identifier === identifier)?.objectives.length ?? 0;
    toast.success(`${count} ${count === 1 ? 'objetivo alineado' : 'objetivos alineados'}`);
  };

  /**
   * Points one edit row at a different objective of the same user.
   *
   * The objective-level twin of `assignUser`, and it says the same kind of thing
   * back: confirming a proposal can move the whole card to another tab, so the
   * toast is what tells the reviewer the click landed and what it decided.
   */
  const relinkRow = (objectiveId: string, targetId: string | null) => {
    setGroups((current) => relinkObjective(current, objectiveId, targetId));

    const row = groups
      .flatMap((group) => group.objectives)
      .find((objective) => objective.id === objectiveId);
    if (!row) return;

    if (targetId === null) {
      toast.success(`"${row.title}" se cargará como un objetivo nuevo`);
      return;
    }

    const target = groups
      .flatMap((group) => group.existing)
      .find((objective) => objective.id === targetId);
    const targetTitle = target?.title ?? "el objetivo elegido";
    // Two loads point rows at objectives and they do opposite things once they
    // get there: one replaces the objective's definition, the other only adds a
    // number to it. Saying "reescribirá" on a progress load would promise a
    // change it is not going to make.
    toast.success(
      mode === 'actualizar'
        ? `El avance de "${row.title}" se registrará en "${targetTitle}"`
        : `"${row.title}" reescribirá "${targetTitle}"`
    );
  };

  /**
   * Folds one identifier's objectives into another's.
   *
   * For when the file named the same person twice — a nickname on one sheet, a
   * document on another. The target keeps its identity and inherits the rows;
   * the source disappears, because leaving an empty group behind would put a
   * card with nothing in it in front of the reviewer.
   */
  const mergeGroups = (sourceIdentifier: string, targetIdentifier: string) => {
    const source = groups.find((group) => group.identifier === sourceIdentifier);
    const target = groups.find((group) => group.identifier === targetIdentifier);

    setGroups((current) => {
      const from = current.find((group) => group.identifier === sourceIdentifier);
      if (!from) return current;

      return current
        .map((group) =>
          group.identifier === targetIdentifier
            ? {
                ...group,
                objectives: [...group.objectives, ...from.objectives],
                // The card just gained rows nobody has looked at together yet.
                reviewConfirmed: false,
              }
            : group
        )
        .filter((group) => group.identifier !== sourceIdentifier);
    });

    if (!source || !target) return;
    // Two cards became one and the total per person changed; saying the new
    // total is what makes the merge checkable at a glance.
    const total = source.objectives.length + target.objectives.length;
    toast.success(
      `Objetivos unificados: ${target.matchedUser?.name ?? target.identifier} queda con ${total} ${
        total === 1 ? 'objetivo' : 'objetivos'
      }`
    );
  };

  /** Everyone an identifier can be pointed at, cycle members flagged as such. */
  const candidates = React.useMemo(
    () => [
      ...roster.map((user) => ({ ...user, onCycle: true })),
      ...directory.filter(
        (entry) => !roster.some((member) => member.username === entry.username)
      ),
    ],
    [roster, directory]
  );

  // --- Derived counts ------------------------------------------------------

  const allObjectives = React.useMemo(() => flattenGroups(groups), [groups]);
  /**
   * What the load will actually write: every objective of every aligned group.
   *
   * "Aligned" is the same verdict the review table's first tab uses — person
   * known, data valid, weights adding up — so the button count and the tab
   * always agree. Nothing else can load, which is why the other two tabs exist.
   */
  const readyObjectives = React.useMemo(
    () =>
      groups
        .filter((group) => bucketForGroup(group) === 'alineados')
        .reduce((total, group) => total + group.objectives.length, 0),
    [groups]
  );
  /**
   * Users per tab, so the footer can report exactly what the tabs report.
   *
   * The footer used to mix units — objectives left over, then objectives with
   * bad data, then users with no owner — and skipped the proposals tab
   * altogether, so "6 por corregir · 3 usuarios sin alinear" left nine of the
   * seventeen users unaccounted for. Everything after the load count is a user
   * count now, taken from the same `bucketForGroup` the tabs use, so each number
   * has a tab the reviewer can open and find it in.
   */
  const usersByBucket = React.useMemo(
    () =>
      groups.reduce(
        (counts, group) => {
          const bucket = bucketForGroup(group);
          return { ...counts, [bucket]: counts[bucket] + 1 };
        },
        { alineados: 0, asociaciones: 0, sinAlinear: 0, errores: 0 }
      ),
    [groups]
  );

  /** Everyone still short of "Objetivos listos para cargar", for the tray's one-line status. */
  const remainingUsers =
    usersByBucket.sinAlinear + usersByBucket.asociaciones + usersByBucket.errores;

  /**
   * The tray is what the drawer leaves behind, so it only shows with the drawer
   * closed — the same rule the surveys module uses. Two things can put it
   * there: a review parked mid-way, or a load still running.
   */
  const isTrayVisible = !open && (isMinimized || (showTray && uploadTasks.length > 0));

  /**
   * Writes one objective per tick and records what came back.
   *
   * The interval is the load: there is no separate percentage to keep in sync,
   * because every surface derives the bar from how many rows have an answer.
   */
  const runUploadProgress = (taskId: string, failsAtRow?: number) => {
    const interval = setInterval(() => {
      let finished = false;

      setUploadTasks((current) =>
        current.map((task) => {
          if (task.id !== taskId) return task;

          const index = task.rows.findIndex((row) => row.status === 'pending');
          if (index === -1) return task;

          /*
            El servicio se cae a mitad de camino.

            Las filas que ya entraron se quedan como entraron — eso es lo que
            de verdad pasa, y es justo lo que hay que poder ver: la carga no se
            deshace sola. Las que faltaban quedan como fallidas porque nadie
            las escribió, y el reintento vuelve a mandar solo esas.
          */
          if (failsAtRow !== undefined && index >= failsAtRow) {
            const rows = task.rows.map((row) =>
              row.status === 'pending' ? { ...row, status: 'failed' as const } : row
            );
            finished = true;
            return { ...task, rows, status: 'completed', serviceFailed: true };
          }

          const rows = task.rows.map((row, position) =>
            position === index
              ? { ...row, status: row.willFail ? ('failed' as const) : ('uploaded' as const) }
              : row
          );
          finished = rows.every((row) => row.status !== 'pending');

          return { ...task, rows, status: finished ? 'completed' : 'loading' };
        })
      );

      if (!finished) return;
      clearInterval(interval);
      const task = uploadTasksRef.current.find((entry) => entry.id === taskId);
      onUploaded?.(task ? task.rows.filter((row) => row.status !== 'failed').length : 0);
    }, UPLOAD_TICK_MS);
  };

  /**
   * Sends again only what never made it in.
   *
   * The rows that did are left alone — they are in UBITS and re-writing them
   * would double them. The retry always succeeds, because the failure it is
   * answering was a service being down and the demo has no way to leave it
   * down; a retry that failed again with no way to ever pass would be a dead
   * end rather than a case.
   */
  const retryUpload = (taskId: string) => {
    setUploadTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: 'loading' as const,
              serviceFailed: false,
              rows: task.rows.map((row) =>
                row.status === 'failed'
                  ? { ...row, status: 'pending' as const, willFail: false }
                  : row
              ),
            }
          : task
      )
    );
    runUploadProgress(taskId);
  };

  /**
   * Confirming does not end the flow, it starts a background job.
   *
   * The load used to take over the drawer with a full-screen bar and then close
   * everything, which meant the one thing a reviewer might want to keep an eye
   * on was also the thing that locked the platform. Now it becomes a task: the
   * drawer drops to its "Cargas" tab where the bar lives next to the previous
   * loads, and the same task keeps running — and stays watchable in the corner
   * tray — whether the drawer is open or not.
   */
  const handleConfirm = () => {
    const taskId = String(Date.now());
    const name = analysis?.fileNames[0] ?? `${modeConfig.label} — ${cycleName}`;

    /**
     * Whether the write phase gets to fail is decided by the file, not by the
     * row count.
     *
     * `analysis.groups` is the parse exactly as it landed, untouched by
     * anything the reviewer fixed afterwards — so it still says which demo
     * file this was. The happy-path sample parses with everyone already in
     * "Objetivos listos para cargar"; the three-states sample starts with rows in every other
     * tab. A file that arrived clean should load clean end to end, or the
     * "happy path" demo would still show random write failures for no visible
     * reason. A file built to exercise every error state gets to exercise the
     * write-time ones too, on every row it sends — including the ones the
     * reviewer just spent ten minutes fixing, because a service timeout does
     * not care whether the data was ever wrong.
     */
    const cameInClean =
      analysis?.groups.every((group) => bucketForGroup(group) === 'alineados') ?? true;

    // Only the aligned users load, which is the same set the button counted.
    //
    // Their adjusted existing objectives go first. An objective whose weight the
    // reviewer lowered to free up room has to be written before the rows that
    // need that room, or the platform would reject them for busting 100% halfway
    // through — so the order here is the order the writes have to happen in.
    const rows: UploadRowResult[] = [
      ...groups
        .filter((group) => bucketForGroup(group) === 'alineados')
        .flatMap((group) => {
          const userName = group.matchedUser?.name ?? group.identifier;
          const userEmail = group.matchedUser?.email;
          const userArea = group.matchedUser?.area;
          const userLeader = group.matchedUser?.leader;
          return [
            // An objective the reviewer adjusted by hand without any row of the
            // file pointing at it. `willUpdateObjective` rows already carry their
            // own edit, so counting the objective they replace would send it twice.
            ...group.existing
              .filter((objective) => hasSavedEdits(objective))
              .filter(
                (objective) =>
                  !group.objectives.some((row) => row.link?.targetId === objective.id)
              )
              .map((objective) => ({ objective, userName, userEmail, userArea, userLeader })),
            ...group.objectives.map((objective) => ({ objective, userName, userEmail, userArea, userLeader })),
          ];
        })
        .map(({ objective, userName, userEmail, userArea, userLeader }, index) => ({
          id: objective.id,
          title: objective.title,
          userName,
          userEmail,
          userArea,
          userLeader,
          description: objective.description,
          weightPercent: objective.weightPercent,
          measureType: objective.measureType,
          trend: objective.trend,
          initialValue: objective.initialValue,
          target: objective.target,
          minProgress: objective.minProgress,
          maxProgress: objective.maxProgress,
          newProgress: objective.newProgress,
          status: 'pending' as const,
          willFail: false,
        })),
      ...groups
        .filter((group) => bucketForGroup(group) !== 'alineados')
        .flatMap((group) => {
          const userName = group.matchedUser?.name ?? group.identifier;
          const userEmail = group.matchedUser?.email;
          const userArea = group.matchedUser?.area;
          const userLeader = group.matchedUser?.leader;
          const bucket = bucketForGroup(group);
          return [
            ...group.objectives.map((objective) => ({ objective, userName, userEmail, userArea, userLeader, bucket, group })),
          ];
        })
        .map(({ objective, userName, userEmail, userArea, userLeader, bucket, group }) => {
          let analysisError: string | undefined;
          if (bucket === 'errores') {
            const ruleViolations = validateObjective(objective);
            if (ruleViolations.length > 0) {
              analysisError = ruleViolations[0].message;
            } else if (groupWeightTotal(group) > TOTAL_WEIGHT_PERCENT) {
              analysisError = `El peso total supera el ${TOTAL_WEIGHT_PERCENT}%.`;
            } else if (!group.reviewConfirmed) {
              analysisError = "Pendiente de confirmación por el usuario.";
            } else {
              analysisError = "Error en el objetivo.";
            }
          }

          return {
            id: objective.id,
            title: objective.title,
            userName,
            userEmail,
            userArea,
            userLeader,
            description: objective.description,
            weightPercent: objective.weightPercent,
            measureType: objective.measureType,
            trend: objective.trend,
            initialValue: objective.initialValue,
            target: objective.target,
            minProgress: objective.minProgress,
            maxProgress: objective.maxProgress,
            newProgress: objective.newProgress,
            status: bucket === 'errores' ? 'analysis_error' as const : 'unassigned' as const,
            analysisError,
            willFail: false,
          };
        }),
    ];

    /*
      El caso "se cayó el servicio", disparado por el nombre del archivo.

      Va por fuera de `willFail` a propósito: eso decide qué filas rechaza la
      plataforma, y esto es lo contrario — la plataforma no rechazó nada, dejó
      de responder. Cae pasada la mitad para que se vea lo que importa: unas
      filas ya entraron y no se van a deshacer solas.
    */
    const failsAtRow = /falla-carga|error-carga/i.test(name)
      ? Math.max(1, Math.ceil(rows.length * 0.6))
      : undefined;

    setUploadTasks((current) => [...current, { id: taskId, name, status: 'loading', rows }]);
    setShowTray(true);
    setTrayCollapsed(false);

    // The review is spent: its rows are on their way in. Going back to the
    // wizard's own tabs is what makes "Cargas" reachable at all.
    setGroups([]);
    setAnalysis(null);
    setFiles([]);
    setConfirmingCancel(false);
    setStep('dropzone');
    setTab('cargas');

    runUploadProgress(taskId, failsAtRow);
  };

  const handleResumeTask = (task: UploadTaskState) => {
    const pendingRows = task.rows.filter(r => r.status === 'failed' || r.status === 'analysis_error' || r.status === 'unassigned');
    const newGroupsMap = new Map<string, ObjectiveUserGroup>();
    const userIndex = buildUserIndex([
      ...roster.map((user) => ({ ...user, onCycle: true })),
      ...(directory || []).map((user) => ({ ...user, onCycle: user.onCycle ?? false })),
    ]);
    
    for (const row of pendingRows) {
      const identifier = row.userEmail || row.userName;
      if (!newGroupsMap.has(identifier)) {
        const match = matchIdentifier(identifier, userIndex);
        
        let matchStatus = match.status;
        let matchedUser = match.user;
        
        if (row.status !== 'unassigned') {
          matchStatus = 'matched';
          const allUsers = [...roster, ...(directory || [])];
          matchedUser = allUsers.find(u => u.email === row.userEmail || u.name === row.userName) || undefined;
        }

        newGroupsMap.set(identifier, {
          identifier,
          identifierType: match.identifierType,
          mode: mode,
          matchStatus,
          matchedUser,
          suggestion: match.suggestion,
          suggestionBasis: match.basis,
          suggestionReason: match.reason,
          isManual: false,
          objectives: [],
          existing: [],
          reviewConfirmed: false,
        });
      }
      newGroupsMap.get(identifier)!.objectives.push({
        id: row.id,
        title: row.title,
        description: row.description || '',
        weightPercent: row.weightPercent || 0,
        measureType: (row.measureType || 'Numérico') as MeasureType,
        trend: (row.trend || 'Aumentar') as Trend,
        initialValue: row.initialValue ?? null,
        target: row.target ?? NaN,
        minProgress: row.minProgress ?? null,
        maxProgress: row.maxProgress ?? null,
        newProgress: row.newProgress ?? null,
      } as any);
    }
    setGroups(Array.from(newGroupsMap.values()));
    setTab('nueva');
    setStep('summary');
  };

  const title =
    step === 'summary' ? "Revisa los objetivos detectados"
    : step === 'error' ? "No pudimos continuar"
    : step === 'empty' ? "No encontramos objetivos"
    : "Carga masiva de objetivos";

  /**
   * The review subtitle explains the mechanism, not the task.
   *
   * What is not obvious on arrival is that the tabs are a queue: cards move
   * between them on their own as they get resolved, and only one of them ends
   * up being loaded. Two sentences is the budget — it is a subtitle, and the
   * header is not where the work happens.
   */
  const description =
    step === 'summary'
      ? "Cada usuario está en una pestaña según lo que le falta: alinear la persona, confirmarla o corregir datos. Al resolverlo pasa solo a la siguiente, y solo se cargan los de “Objetivos listos para cargar”."
    : step === 'error' ? "Revisa el archivo e inténtalo de nuevo."
    : step === 'empty' ? "No pudimos detectar objetivos en este archivo."
    : "Elige qué quieres hacer y sube el archivo, o revisa tus cargas recientes.";

  // The review table needs the room; the wizard's other steps read better narrow.
  const widthClass =
    step === 'summary'
      ? "!w-[86vw] !max-w-[86vw]"
      : "!w-[40vw] !max-w-[40vw]";

  return (
    <>
    <DrawerShell
      open={open}
      onOpenChange={handleOpenChange}
      title={title}
      description={description}
      side="right"
      size="md"
      className={cn("border-l shadow-drawer transition-all duration-500", widthClass)}
      footer={
        <>
          {/*
            Same beat as the survey upload: while something is still writing,
            the footer's only job is to say the platform does not have to wait
            for it. Once every task in the list has landed, this goes back to
            being the plain read-only list it was — there is nothing left to
            step away from.
          */}
          {step === 'dropzone' && tab === 'cargas' && hasActiveUpload && (
            <div className="px-5 py-4 bg-background border-t border-border/40 shadow-[0_-10px_20px_rgba(0,0,0,0.03)] shrink-0 z-20 flex items-center gap-2">
              <Button
                type="button"
                onClick={() => onOpenChange(false)}
                className="w-full gap-2.5 h-11 text-xs font-bold tracking-tight shadow-lg shadow-primary/20 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.98]"
              >
                <Minimize2 className="h-4 w-4" />
                Minimizar y continuar
              </Button>
            </div>
          )}

          {/* The loads list is read-only otherwise, so it gets no wizard footer. */}
          {!(step === 'dropzone' && tab === 'cargas') && (
            /* Frozen while the review has a removal question open. The review
               can inert its own cards, but these two buttons — cancel the whole
               load, or commit it — sit outside it and are exactly the ones that
               must not be reachable with a half-answered question on screen. */
            <div
              inert={isConfirmingDelete || undefined}
              className={cn(
                "px-5 py-4 bg-background border-t border-border/40 shadow-[0_-10px_20px_rgba(0,0,0,0.03)] shrink-0 z-20 flex items-center gap-2 transition-opacity",
                isConfirmingDelete && "opacity-50"
              )}
            >
              {/*
                Discarding a review is asked, not obeyed.

                Same shape as removing a user from the load: the question takes
                over the row it was asked from, the destructive answer is the
                one that has to be aimed at, and the body behind it goes inert
                so nothing can move underneath the answer. Losing an hour of
                assignments to a misread "Cancelar" is exactly the accident that
                deserves the extra click.
              */}
              {isConfirmingCancel ? (
                <div className="flex-1 flex items-center gap-3">
                  <p className="flex-1 text-[12px] font-medium text-text-secondary">
                    <span className="font-bold text-status-negative">
                      ¿Descartar esta carga?
                    </span>{" "}
                    Se pierden las {allObjectives.length}{" "}
                    {allObjectives.length === 1 ? "fila revisada" : "filas revisadas"} y todo lo
                    que resolviste. Si solo necesitas la pantalla, minimízala.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 px-5 text-xs font-bold tracking-tight rounded-xl"
                    onClick={() => setConfirmingCancel(false)}
                  >
                    Seguir revisando
                  </Button>
                  <Button
                    type="button"
                    autoFocus
                    onClick={discard}
                    className="h-11 px-5 text-xs font-bold tracking-tight rounded-xl bg-status-negative text-text-inverse hover:bg-status-negative/90"
                  >
                    Descartar
                  </Button>
                </div>
              ) : (
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "h-11 text-xs font-bold tracking-tight rounded-xl",
                  // Cancelar only shares the row with one other button on these
                  // steps, so it splits 50/50 instead of shrinking to its label.
                  step === 'dropzone' || step === 'error' || step === 'empty'
                    ? "flex-1"
                    : "px-5"
                )}
                onClick={() => (hasReviewInFlight ? setConfirmingCancel(true) : discard())}
              >
                Cancelar
              </Button>
              )}

              {step === 'dropzone' && (
                <Button
                  disabled={files.length === 0}
                  // Envuelto a propósito: pasarlo directo le entregaría el
                  // MouseEvent al parámetro de modo.
                  onClick={() => handleAnalyze()}
                  className="flex-1 gap-2.5 h-11 text-xs font-bold tracking-tight shadow-lg shadow-primary/20 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-30 disabled:grayscale"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Analizar {files.length > 0 ? `(${files.length})` : ""}</span>
                </Button>
              )}

              {step === 'summary' && isConfirmingPartialLoad && (
                <div className="flex-1 flex items-center gap-3">
                  <p className="flex-1 text-[12px] font-medium text-text-secondary leading-snug">
                    <span className="font-bold text-status-warning">
                      ¿Cargar con {remainingUsers} {remainingUsers === 1 ? "pendiente" : "pendientes"}?
                    </span>{" "}
                    Solo se {readyObjectives === 1 ? "cargará" : "cargarán"} {readyObjectives} {readyObjectives === 1 ? "objetivo alineado" : "objetivos alineados"}. Puedes retomar los demás más adelante.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 px-5 text-xs font-bold tracking-tight rounded-xl"
                    onClick={() => setConfirmingPartialLoad(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    autoFocus
                    onClick={() => {
                      setConfirmingPartialLoad(false);
                      handleConfirm();
                    }}
                    className="gap-2.5 h-11 px-5 text-xs font-bold tracking-tight rounded-xl bg-primary text-text-inverse hover:bg-primary/90 shadow-lg shadow-primary/20"
                  >
                    <Upload className="h-4 w-4" />
                    Confirmar carga
                  </Button>
                </div>
              )}

              {step === 'summary' && !isConfirmingCancel && !isConfirmingPartialLoad && (
                <>
                  {/*
                    No running commentary next to the buttons.

                    A sentence here repeated what the four metric cards, the tab
                    counts and the button label already said, three feet of
                    screen apart — and it was the longest thing in the footer,
                    so it read as the main content of a row whose job is two
                    buttons. The numbers live where they are actionable.
                  */}
                  <div className="flex-1" />

                  {/* Secondary, and to the left of the load button: it is the
                      other thing you can do with a review you are not finishing
                      right now, and the only one of the two that is reversible. */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={minimize}
                    title="Sigue usando la plataforma; la revisión te espera abajo a la derecha"
                    className="gap-2 h-11 px-5 text-xs font-bold tracking-tight rounded-xl"
                  >
                    <Minimize2 className="h-4 w-4" />
                    Minimizar
                  </Button>

                  <Button
                    disabled={readyObjectives === 0}
                    onClick={() => {
                      if (remainingUsers > 0) {
                        setConfirmingPartialLoad(true);
                      } else {
                        handleConfirm();
                      }
                    }}
                    title={
                      readyObjectives === 0
                        ? 'Resuelve al menos un usuario en la pestaña "Objetivos listos para cargar" para poder cargar'
                        : undefined
                    }
                    className="gap-2.5 h-11 px-5 text-xs font-bold tracking-tight shadow-lg shadow-primary/20 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-30 disabled:grayscale"
                  >
                    <Upload className="h-4 w-4" />
                    {/*
                      The button names its own scope.

                      "Cargar objetivos (10)" left the reader to work out what
                      the 10 counted and where it came from — the file has 32,
                      and the tab that produces the 10 was three lines away.
                      Spelling out "10 objetivos alineados" makes the button say
                      the same thing as the sentence beside it and as the
                      "Objetivos listos para cargar" tab, so the three cannot drift apart.
                    */}
                    <span>
                      {readyObjectives > 0
                        ? `${modeConfig.confirmVerb} ${readyObjectives} ${
                            readyObjectives === 1
                              ? "objetivo alineado"
                              : "objetivos alineados"
                          }`
                        : modeConfig.confirmLabel}
                    </span>
                  </Button>
                </>
              )}

              {(step === 'error' || step === 'empty') && (
                <Button
                  onClick={() => {
                    setError(null);
                    setStep('dropzone');
                    setFiles([]);
                  }}
                  className="flex-1 h-11 text-xs font-bold tracking-tight rounded-xl bg-primary text-text-inverse hover:bg-primary/90"
                >
                  Entendido
                </Button>
              )}

              {step === 'detail' && detailTask && (() => {
                const pendingRows = detailTask.rows.filter(r => r.status === 'failed' || r.status === 'analysis_error' || r.status === 'unassigned');
                if (pendingRows.length === 0) return null;
                return (
                  <>
                    <div className="flex-1" />
                    <Button
                      type="button"
                      onClick={() => handleResumeTask(detailTask)}
                      className="gap-2.5 h-11 px-5 text-xs font-bold tracking-tight shadow-lg shadow-primary/20 rounded-xl bg-primary text-text-inverse hover:bg-primary/90 transition-all hover:scale-[1.01] active:scale-[0.98]"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Retomar carga ({pendingRows.length})
                    </Button>
                  </>
                );
              })()}
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
                  Analizando archivos
                </h3>

                <div className="w-full max-w-[300px] mt-6 space-y-2.5">
                  <div className="flex justify-between text-xs text-text-secondary font-bold px-1">
                    <span>{getAnalyzingCopy(progress, files.length, findings)}</span>
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
                  Estamos extrayendo y validando la información de tus objetivos.
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
              <div role="radiogroup" aria-label="Qué quieres hacer" className="space-y-2">
                <p className="text-[11px] font-bold text-text-secondary/40 uppercase tracking-widest px-1">
                  Qué quieres hacer
                </p>
                {BULK_UPLOAD_MODES.map((entry) => (
                  <ModeCard
                    key={entry.id}
                    mode={entry.id}
                    label={entry.label}
                    description={entry.description}
                    selected={entry.id === mode}
                    onSelect={() => handleModeChange(entry.id)}
                  />
                ))}
              </div>

              <UploadZone
                value={files}
                onChange={(next) => {
                  setFiles(next);
                  // El aviso hablaba del archivo anterior; con otro encima ya no
                  // dice nada de lo que hay en pantalla.
                  setMismatch(null);
                }}
                accept={OBJECTIVES_IMPORT_ACCEPT}
                multiple
                maxSizeMB={OBJECTIVES_IMPORT_MAX_MB}
                validate={getImmediateValidationError}
                label="Archivo de objetivos"
                description={`Formatos aceptados: CSV, XLS y XLSX. Máximo ${OBJECTIVES_IMPORT_MAX_MB} MB.`}
              />

              {/*
                Sin nuevo_avance y con "actualizar" elegido, dicho donde se
                puede arreglar.

                Sin botón, porque no hay corrección segura que ofrecer: falta
                la única columna que distingue a esta operación, y de ahí no
                se sabe si el archivo es de crear o de editar. Proponer una de
                las dos sería adivinar por el usuario, así que la respuesta
                queda en sus manos — para eso están las tarjetas de operación
                un poco más arriba.
              */}
              {mismatch && (
                <Alert variant="warning" role="status">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <p className="text-xs font-bold text-text-primary">{mismatch.title}</p>
                    <p className="mt-1 text-xs leading-relaxed">{mismatch.detail}</p>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>

          <TabsContent value="cargas" className="flex-1 min-h-0 overflow-y-auto mt-0 focus-visible:outline-none">
            <div className="space-y-4">
              {/* This session's loads, live. Landing here right after pressing
                  "Cargar" is the whole point: the bar the reviewer wants to
                  watch sits in the same list as the loads before it, instead of
                  behind a full-screen overlay that has to be waited out. */}
              {uploadTasks.length > 0 && (
                <div className="space-y-2">
                  {[...uploadTasks]
                    .sort((a, b) => b.id.localeCompare(a.id))
                    .map((task) => (
                      <UploadTaskCard
                        key={task.id}
                        task={task}
                        cycleName={cycleName}
                        onRetry={() => retryUpload(task.id)}
                        onViewDetails={() => {
                          setDetailTask(task);
                          setStep('detail');
                        }}
                        onResumePending={() => handleResumeTask(task)}
                        hasPending={task.rows.some(r => r.status === 'failed' || r.status === 'analysis_error' || r.status === 'unassigned')}
                      />
                    ))}
                </div>
              )}

              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-bold text-text-primary tracking-tight">Historial de cargas</h3>
                <span className="px-2 py-1 bg-muted text-text-secondary/60 rounded text-[10px] font-bold uppercase tracking-wide">
                  Últimos 7 días
                </span>
              </div>

              {/* The check on the right becomes the failure count when there
                  is one: a row that reports "63 objetivos" and a green tick
                  while two of them were refused is a row that lies. No seeded
                  load has one — see `failedCount` — so in the demo they are all
                  ticks. */}
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

                    {upload.failedCount > 0 ? (
                      <span className="shrink-0 px-2 py-0.5 rounded-md bg-status-negative/10 text-status-negative text-[10px] font-bold tabular-nums">
                        {upload.failedCount} con error
                      </span>
                    ) : (
                      <span className="text-status-positive shrink-0" aria-label="Carga completada">
                        <Check className="h-4 w-4" strokeWidth={3} />
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}

      {step === 'summary' && (
        /* Fills the drawer body instead of growing past it, so the review owns
           the scroll. Goes inert behind the discard question, the same way the
           review's cards go inert behind a removal question.

           There used to be a row of four metric cards above this — filas,
           usuarios, listos, por corregir. The tabs below already say all four,
           per tab and with the work attached to each number, so the cards were
           a second scoreboard for the same match, taking the top of the panel
           where the review should start. */
        <div
          inert={isConfirmingCancel || isConfirmingPartialLoad || undefined}
          className={cn(
            "flex-1 min-h-0 flex flex-col gap-4 transition-opacity",
            (isConfirmingCancel || isConfirmingPartialLoad) && "opacity-50"
          )}
        >
          {/*
            The file's name and sheet used to be echoed here and are gone.

            The reviewer picked that file thirty seconds ago on the previous
            step; repeating it back bought nothing and took the first line of
            the review, which is where the work should start.

            A "estructura simulada" warning used to live here too, for the
            operations that had not been wired to the parser yet. All three read
            the file for real now, so it went with them.
          */}
          {analysis?.notes && analysis.notes.length > 0 && (
            <Alert variant="info" className="shrink-0">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <ul className="space-y-0.5">
                  {analysis.notes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <ObjectivesReviewTable
            groups={groups}
            mode={mode}
            candidates={candidates}
            onDelete={(id) => removeObjectives([id])}
            onDeleteMany={removeObjectives}
            onChange={updateObjective}
            onAssignUser={assignUser}
            onConfirmReady={confirmGroupReady}
            onMergeGroups={mergeGroups}
            onRelinkObjective={relinkRow}
            onConfirmingChange={setConfirmingDelete}
          />
        </div>
      )}

      {step === 'detail' && detailTask && (() => {
        const areas = Array.from(new Set(detailTask.rows.map(r => r.userArea).filter(Boolean))) as string[];
        const leaders = Array.from(new Set(detailTask.rows.map(r => r.userLeader).filter(Boolean))) as string[];

        const filteredRows = detailTask.rows.filter(row => {
          // Tab specific filtering
          if (detailActiveTab === 'exitosos' && row.status !== 'uploaded') return false;
          if (detailActiveTab === 'pendientes' && row.status === 'uploaded') return false;

          const matchesSearch = row.title.toLowerCase().includes(detailSearch.toLowerCase()) || row.userName.toLowerCase().includes(detailSearch.toLowerCase());
          const mappedStatus = row.status === 'analysis_error' ? 'failed' : row.status;
          const matchesStatus = detailStatusFilter.length === 0 || detailStatusFilter.includes(mappedStatus);
          const matchesArea = detailAreaFilter.length === 0 || detailAreaFilter.includes(row.userArea || "");
          const matchesLeader = detailLeaderFilter.length === 0 || detailLeaderFilter.includes(row.userLeader || "");
          return matchesSearch && matchesStatus && matchesArea && matchesLeader;
        });

        const groupedByUser = filteredRows.reduce((acc, row) => {
          if (!acc[row.userName]) acc[row.userName] = [];
          acc[row.userName].push(row);
          return acc;
        }, {} as Record<string, UploadRowResult[]>);

        const renderAccordion = (rowsGrouped: Record<string, UploadRowResult[]>) => {
          const userEntries = Object.entries(rowsGrouped);
          if (userEntries.length === 0) {
            return (
              <div className="p-8 text-center text-text-secondary/60 text-sm">
                No se encontraron resultados.
              </div>
            );
          }
          return (
            <Accordion type="single" collapsible className="w-full flex flex-col gap-3 px-4 pb-4 pt-2">
              {userEntries.map(([user, rows]) => {
                const isAllFailed = rows.every(r => r.status === 'failed' || r.status === 'analysis_error');
                return (
                  <AccordionItem key={user} value={user} className="group/item border border-border/60 bg-surface rounded-xl">
                    <div className="sticky top-0 z-10 bg-surface rounded-t-xl group-data-[state=closed]/item:rounded-b-xl px-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                      <AccordionTrigger className="hover:no-underline py-4">
                        <div className="flex items-center justify-between w-full pr-4 text-left">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-text-primary">{user}</h4>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-text-secondary mt-1 font-medium">
                            {rows[0]?.userArea && <span>{rows[0].userArea}</span>}
                            {rows[0]?.userArea && rows[0]?.userLeader && <span className="text-border/60">•</span>}
                            {rows[0]?.userLeader && <span>Líder: {rows[0].userLeader}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium mr-4 shrink-0">
                          {(rows.some(r => r.status === 'failed') || rows.some(r => r.status === 'analysis_error')) && (
                            <Badge variant="outline" className="text-[10px] font-bold border-none px-2 py-0.5 rounded-full bg-status-negative/10 text-status-negative pointer-events-none whitespace-nowrap flex items-center">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              {rows.filter(r => r.status === 'failed' || r.status === 'analysis_error').length} Error
                            </Badge>
                          )}
                          {rows.some(r => r.status === 'uploaded') && (
                            <Badge variant="outline" className="text-[10px] font-bold border-none px-2 py-0.5 rounded-full bg-status-positive-bg text-status-positive pointer-events-none whitespace-nowrap flex items-center">
                              <Check className="w-3 h-3 mr-1" strokeWidth={3} />
                              {rows.filter(r => r.status === 'uploaded').length} Exitoso
                            </Badge>
                          )}
                          {rows.some(r => r.status === 'unassigned') && (
                            <Badge variant="outline" className="text-[10px] font-bold border-none px-2 py-0.5 rounded-full bg-surface-muted text-text-secondary/70 pointer-events-none whitespace-nowrap flex items-center">
                              <Info className="w-3 h-3 mr-1" />
                              {rows.filter(r => r.status === 'unassigned').length} Sin asignar
                            </Badge>
                          )}
                        </div>
                      </div>
                    </AccordionTrigger>
                    </div>
                    <AccordionContent className="pt-0 pb-4 px-4 border-t border-border/40 space-y-4">
                      <div className="pt-4 space-y-4">
                        {rows.map((row) => (
                          <div key={row.id} className="flex gap-3">
                            {row.status === 'uploaded' ? (
                              <div className="h-6 w-6 rounded-full bg-status-positive/10 text-status-positive flex items-center justify-center shrink-0 mt-0.5">
                                <Check className="h-3 w-3" strokeWidth={3} />
                              </div>
                            ) : row.status === 'failed' || row.status === 'analysis_error' ? (
                              <div className="h-6 w-6 rounded-full bg-status-negative/10 text-status-negative flex items-center justify-center shrink-0 mt-0.5">
                                <AlertTriangle className="h-3 w-3" strokeWidth={2.5} />
                              </div>
                            ) : (
                              <div className="h-6 w-6 rounded-full bg-surface-hover border border-border/40 text-text-secondary flex items-center justify-center shrink-0 mt-0.5">
                                <Info className="h-3 w-3" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4">
                                <span className="font-bold text-[13px] leading-snug text-text-primary">{row.title}</span>
                                <span className="text-[11px] font-bold text-text-primary bg-muted px-2 py-0.5 rounded shrink-0">{row.weightPercent}%</span>
                              </div>
                              <p className="text-[11px] text-text-secondary/80 mt-1 line-clamp-2 leading-relaxed">
                                {row.measureType === 'Se cumple / No se cumple' 
                                  ? "Completar la meta"
                                  : row.measureType && row.trend && row.target !== undefined
                                  ? `${row.trend} de ${row.initialValue ?? 0} a ${row.target} (${MEASURE_SYMBOL[row.measureType as MeasureType] ?? ''} ${row.measureType})`
                                  : row.description}
                              </p>
                              {row.status === 'failed' && (
                                <span className="text-status-negative/80 text-[11px] font-medium mt-1.5 flex items-center">
                                  Error al guardar en el servidor.
                                </span>
                              )}
                              {row.status === 'analysis_error' && (
                                <span className="text-status-negative/80 text-[11px] font-medium mt-1.5 flex items-center">
                                  {row.analysisError || "Error de validación."}
                                </span>
                              )}
                              {row.status === 'unassigned' && (
                                <span className="text-text-secondary/80 text-[11px] font-medium mt-1.5 flex items-center">
                                  Pendiente de asignación.
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          );
        };

        return (
          <div className="flex-1 min-h-0 flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Header row */}
            <div className="flex items-center justify-between mt-2 px-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDetailTask(null);
                  setStep('dropzone');
                }}
                className="h-8 px-3 rounded-full bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary font-bold"
              >
                <ChevronLeft className="h-4 w-4 mr-1" strokeWidth={3} />
                Volver
              </Button>
              {remainingUsers > 0 && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setTab('revision');
                    setStep('summary');
                  }}
                  className="h-8 rounded-full px-4 text-xs font-bold text-primary border-primary/20 hover:bg-primary/5"
                >
                  Retomar pendientes
                </Button>
              )}
            </div>

            <div className="text-center mt-1 mb-2">
              <h2 className="text-lg font-bold tracking-tight text-text-primary">Detalle de la carga</h2>
            </div>

            <Tabs value={detailActiveTab} onValueChange={(val) => { setDetailActiveTab(val as 'exitosos' | 'pendientes'); setDetailStatusFilter([]); }} className="flex-1 flex flex-col min-h-0 mt-1">
              <div className="px-4 pb-4">
                <TabsList className="grid grid-cols-2 w-full h-11 p-1 gap-1 bg-surface-muted rounded-xl shrink-0">
                  <TabsTrigger 
                    value="exitosos" 
                    className="gap-2 h-full text-[13px] font-bold tracking-tight rounded-lg text-text-secondary/70 transition-all data-[state=active]:bg-surface data-[state=active]:text-primary data-[state=active]:shadow-sm"
                  >
                    Cargados exitosamente
                  </TabsTrigger>
                  <TabsTrigger 
                    value="pendientes" 
                    className="gap-2 h-full text-[13px] font-bold tracking-tight rounded-lg text-text-secondary/70 transition-all data-[state=active]:bg-surface data-[state=active]:text-primary data-[state=active]:shadow-sm"
                  >
                    Pendientes por cargar
                  </TabsTrigger>
                </TabsList>

                <div className="flex items-center gap-2 mt-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary/60" />
                    <input 
                      type="text" 
                      placeholder="Buscar por usuario u objetivo..." 
                      value={detailSearch} 
                      onChange={(e) => setDetailSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-surface text-sm text-text-primary rounded-md border border-border/40 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-text-secondary/40 font-medium"
                    />
                  </div>
                  <FilterButton
                    onClearAll={() => {
                      setDetailStatusFilter([]);
                      setDetailAreaFilter([]);
                      setDetailLeaderFilter([]);
                    }}
                    groups={[
                      ...(detailActiveTab === 'pendientes' ? [{
                        id: "estado",
                        label: "Estado",
                        options: ["Con error", "Sin asignar"],
                        selected: detailStatusFilter,
                        onToggle: (option: string) => {
                          const mapped = option === "Con error" ? "failed" : "unassigned";
                          setDetailStatusFilter(prev => 
                            prev.includes(mapped) ? prev.filter(x => x !== mapped) : [...prev, mapped]
                          );
                        }
                      }] : []),
                      {
                        id: "area",
                        label: "Área",
                        options: areas,
                        selected: detailAreaFilter,
                        onToggle: (option: string) => 
                          setDetailAreaFilter(prev => 
                            prev.includes(option) ? prev.filter(x => x !== option) : [...prev, option]
                          ),
                      },
                      {
                        id: "lider",
                        label: "Líder",
                        options: leaders,
                        selected: detailLeaderFilter,
                        onToggle: (option: string) => 
                          setDetailLeaderFilter(prev => 
                            prev.includes(option) ? prev.filter(x => x !== option) : [...prev, option]
                          ),
                      }
                    ]}
                  />
                </div>
              </div>

              <TabsContent value="exitosos" className="flex-1 overflow-y-auto m-0 border-none outline-none">
                {renderAccordion(groupedByUser)}
              </TabsContent>
              <TabsContent value="pendientes" className="flex-1 overflow-y-auto m-0 border-none outline-none">
                {renderAccordion(groupedByUser)}
              </TabsContent>
            </Tabs>
          </div>
        );
      })()}

      {step === 'error' && error && (
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            title={error.title}
            description={error.detail}
            icon={AlertTriangle}
            className="border-none shadow-none bg-transparent p-0"
          />
        </div>
      )}

      {step === 'empty' && (
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            title="No encontramos objetivos"
            description={`Revisa que el archivo tenga las columnas de la plantilla (${modeConfig.columns.slice(0, 4).join(", ")}...) y al menos una fila con datos.`}
            icon={FileSearch}
            className="border-none shadow-none bg-transparent p-0"
          />
        </div>
      )}
      </DrawerShell>

      {isTrayVisible && (
        <UploadTray
          cycleName={cycleName}
          tasks={uploadTasks}
          isCollapsed={isTrayCollapsed}
          onToggleCollapsed={() => setTrayCollapsed((current) => !current)}
          onOpenDrawer={() => {
            setConfirmingTrayCancel(false);
            setIsMinimized(false);
            if (uploadTasks.length > 0 && !isMinimized) setTab('cargas');
            onOpenChange(true);
          }}
          parkedReview={
            isMinimized
              ? {
                  readyObjectives,
                  totalObjectives: allObjectives.length,
                  remainingUsers,
                }
              : undefined
          }
          isConfirmingDiscard={isConfirmingTrayCancel}
          onRequestDiscard={() => setConfirmingTrayCancel(true)}
          onCancelDiscard={() => setConfirmingTrayCancel(false)}
          onDiscard={discard}
          onClose={() => {
            setShowTray(false);
            setUploadTasks([]);
          }}
        />
      )}
    </>
  );
};

/**
 * One load of this session, as a card in the drawer's "Cargas" tab.
 *
 * Same anatomy as the surveys module's: a status square, the file's name, what
 * the load is doing right now, and the percentage — with the bar only while
 * there is something to fill.
 */
const UploadTaskCard: React.FC<{
  task: UploadTaskState;
  cycleName: string;
  onRetry?: () => void;
  onViewDetails?: () => void;
  onResumePending?: () => void;
  hasPending?: boolean;
}> = ({ task, cycleName, onRetry, onViewDetails, onResumePending, hasPending }) => {
  const progress = taskProgress(task);
  const uploaded = countByStatus(task, 'uploaded');
  const failed = countByStatus(task, 'failed');
  const pendingCount = task.rows.filter(r => r.status === 'failed' || r.status === 'analysis_error' || r.status === 'unassigned').length;

  return (
    <div
      className={cn(
        "p-3 rounded-xl border bg-surface",
        task.serviceFailed ? "border-status-negative/40" : "border-border/40"
      )}
    >
      <div className="flex items-center gap-3">
        {task.status === 'loading' ? (
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <div className="h-4 w-4 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          </div>
        ) : task.serviceFailed ? (
          /* Rojo, no ámbar: no es que algunas filas no pasaran, es que la carga
             no terminó. Son dos noticias distintas y merecen dos colores. */
          <div className="h-9 w-9 rounded-lg bg-status-negative/10 text-status-negative flex items-center justify-center shrink-0">
            <AlertTriangle className="h-4 w-4" strokeWidth={2.5} />
          </div>
        ) : pendingCount > 0 ? (
          <div className="h-9 w-9 rounded-lg bg-status-warning/10 text-status-warning flex items-center justify-center shrink-0">
            <AlertTriangle className="h-4 w-4" strokeWidth={2.5} />
          </div>
        ) : (
          <div className="h-9 w-9 rounded-lg bg-status-positive/10 text-status-positive flex items-center justify-center shrink-0">
            <Check className="h-4 w-4" strokeWidth={3} />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-text-primary truncate">{task.name}</p>
          <p
            className={cn(
              "text-[10px] font-medium truncate",
              task.serviceFailed ? "text-status-negative" : "text-text-secondary/60"
            )}
          >
            {task.status === 'loading'
              ? `Cargando ${task.rows.length} ${task.rows.length === 1 ? 'objetivo' : 'objetivos'} en "${cycleName}"…`
              : task.serviceFailed
                ? `La carga se interrumpió: ${uploaded} ${
                    uploaded === 1 ? 'objetivo alcanzó' : 'objetivos alcanzaron'
                  } a cargarse y ${pendingCount === 1 ? 'quedó 1' : `quedaron ${pendingCount}`} sin cargar.`
                : pendingCount > 0
                  ? `${uploaded} ${uploaded === 1 ? 'cargado' : 'cargados'} · ${pendingCount} ${pendingCount === 1 ? 'pendiente' : 'pendientes'}`
                  : `${uploaded} ${uploaded === 1 ? 'objetivo cargado' : 'objetivos cargados'} en "${cycleName}"`}
          </p>
        </div>

        {task.status === 'loading' && (
          <span className="text-sm font-bold text-primary tabular-nums shrink-0">
            {progress}%
          </span>
        )}

        {task.status !== 'loading' && onViewDetails && (
          <div className="flex items-center gap-1.5 shrink-0 ml-1">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onViewDetails}
              className="h-7 px-2.5 text-[10px] font-bold rounded-lg border-border/40 hover:bg-surface-hover"
            >
              Ver detalle
            </Button>
            {hasPending && onResumePending && (
              <Button
                type="button"
                size="sm"
                onClick={onResumePending}
                className="h-7 px-2.5 text-[10px] font-bold rounded-lg bg-primary text-text-inverse hover:bg-primary/90 shadow-sm"
              >
                Retomar carga
              </Button>
            )}
          </div>
        )}
      </div>

      {task.status === 'loading' && (
        <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/*
        El reintento solo aparece aquí, y solo cuando hay algo que reintentar.

        Una fila que la plataforma rechazó por sus datos no se arregla mandándola
        otra vez; una que nunca se mandó, sí. Por eso el botón cuelga de
        `serviceFailed` y no del conteo de errores, y por eso dice cuántas va a
        mandar — no vuelve a subir lo que ya entró.
      */}
      {task.serviceFailed && onRetry && (
        <div className="mt-2.5 flex items-center justify-between gap-3">
          <p className="text-[10.5px] font-medium text-text-secondary/60 min-w-0">
            Estamos teniendo problemas técnicos. Lo que ya cargó se mantiene.
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onRetry}
            className="h-7 px-2.5 shrink-0 text-[11px] font-bold gap-1.5 rounded-lg"
          >
            <RefreshCw className="h-3 w-3" strokeWidth={2.5} />
            Reintentar
          </Button>
        </div>
      )}
    </div>
  );
};


interface ParkedReview {
  readyObjectives: number;
  totalObjectives: number;
  remainingUsers: number;
}

interface UploadTrayProps {
  cycleName: string;
  tasks: UploadTaskState[];
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
  onOpenDrawer: () => void;
  /** Present when a review was minimised rather than loaded. */
  parkedReview?: ParkedReview;
  isConfirmingDiscard: boolean;
  onRequestDiscard: () => void;
  onCancelDiscard: () => void;
  onDiscard: () => void;
  onClose: () => void;
}

/**
 * The corner tray, copied in shape from the surveys module's.
 *
 * Bottom right, 360px, its own surface over the page, and the same three
 * controls in the same order — open the panel, fold the tray, dismiss it. A
 * reviewer who has minimised a survey load should not have to learn a second
 * widget for objectives.
 *
 * It carries two kinds of thing, because they are the same thing to the person
 * looking at it: a load running in the background, and a review parked
 * mid-way. Both are "the bulk upload, not on screen right now".
 */
const UploadTray: React.FC<UploadTrayProps> = ({
  cycleName,
  tasks,
  isCollapsed,
  onToggleCollapsed,
  onOpenDrawer,
  parkedReview,
  isConfirmingDiscard,
  onRequestDiscard,
  onCancelDiscard,
  onDiscard,
  onClose,
}) => {
  const loadingCount = tasks.filter((task) => task.status === 'loading').length;
  const title =
    loadingCount > 0
      ? "Cargando objetivos…"
      : tasks.length > 0
        ? "Carga completada"
        : "Carga masiva en revisión";
  const subtitle =
    loadingCount > 0 ? `${loadingCount} en curso` : cycleName;

  return (
    <aside
      aria-label="Carga masiva de objetivos"
      className="fixed bottom-6 right-6 w-[360px] z-50 rounded-xl border border-border/40 bg-surface shadow-drawer overflow-hidden animate-in fade-in-0 slide-in-from-bottom-2 duration-200"
    >
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border/40">
        <div className="min-w-0">
          <p className="text-sm font-bold text-text-primary tracking-tight truncate">{title}</p>
          <p className="text-[11px] text-text-secondary/60 truncate">{subtitle}</p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onOpenDrawer}
            aria-label="Ver detalles"
            className="p-1.5 rounded-md text-text-secondary/60 hover:text-primary hover:bg-muted transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label={isCollapsed ? "Expandir" : "Minimizar"}
            className="p-1.5 rounded-md text-text-secondary/60 hover:text-primary hover:bg-muted transition-colors"
          >
            {isCollapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={parkedReview ? onRequestDiscard : onClose}
            aria-label="Cerrar"
            className="p-1.5 rounded-md text-text-secondary/60 hover:text-status-negative hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="px-4 py-3 space-y-3 max-h-[260px] overflow-y-auto">
          {/* Dismissing a parked review is the one action here that destroys
              work, so it is the one that asks. */}
          {isConfirmingDiscard && parkedReview ? (
            <div>
              <p className="text-[12px] font-medium text-text-secondary">
                <span className="font-bold text-status-negative">¿Descartar esta carga?</span> Se
                pierde todo lo que resolviste en el archivo.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onCancelDiscard}
                  className="flex-1 h-9 text-[11px] font-bold rounded-lg"
                >
                  Conservarla
                </Button>
                <Button
                  type="button"
                  size="sm"
                  autoFocus
                  onClick={onDiscard}
                  className="flex-1 h-9 text-[11px] font-bold rounded-lg bg-status-negative text-text-inverse hover:bg-status-negative/90"
                >
                  Descartar
                </Button>
              </div>
            </div>
          ) : (
            <>
              {parkedReview && (
                <div className="flex items-center gap-2.5">
                  <span className="h-5 w-5 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <FileSearch className="h-3 w-3" strokeWidth={2.5} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-text-primary truncate">
                      Revisión sin terminar
                    </p>
                    <p className="text-[10px] font-medium text-text-secondary/60 tabular-nums">
                      {parkedReview.readyObjectives} de {parkedReview.totalObjectives} listos
                      {parkedReview.remainingUsers > 0 &&
                        ` · faltan ${parkedReview.remainingUsers} ${
                          parkedReview.remainingUsers === 1 ? "usuario" : "usuarios"
                        }`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenDrawer}
                    className="text-xs font-bold text-primary hover:underline shrink-0"
                  >
                    Retomar
                  </button>
                </div>
              )}

              {[...tasks]
                .sort((a, b) => b.id.localeCompare(a.id))
                .map((task) => (
                  <div key={task.id} className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      {task.serviceFailed ? (
                        <span className="h-5 w-5 shrink-0 rounded-full bg-status-negative flex items-center justify-center">
                          <AlertTriangle className="h-3 w-3 text-text-inverse" strokeWidth={3} />
                        </span>
                      ) : task.status === 'completed' ? (
                        <span className="h-5 w-5 shrink-0 rounded-full bg-status-positive flex items-center justify-center">
                          <Check className="h-3 w-3 text-text-inverse" strokeWidth={3} />
                        </span>
                      ) : (
                        <span className="h-5 w-5 shrink-0 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                      )}
                      <p className="flex-1 min-w-0 text-sm text-text-primary truncate">
                        {task.name}
                      </p>
                      {task.status === 'loading' && (
                        <span className="text-xs font-bold text-primary tabular-nums shrink-0">
                          {taskProgress(task)}%
                        </span>
                      )}
                    </div>
                    {/* The one thing worth saying about a finished load in a
                        360px card: whether any row was refused. The list of
                        which ones is a click away. */}
                    {task.status === 'completed' && countByStatus(task, 'failed') > 0 && (
                      <p className="pl-[30px] text-[10px] font-bold text-status-negative">
                        {task.serviceFailed
                          ? 'La carga se interrumpió. Ábrela para reintentar.'
                          : `${countByStatus(task, 'failed')} ${
                              countByStatus(task, 'failed') === 1
                                ? 'objetivo no se pudo guardar'
                                : 'objetivos no se pudieron guardar'
                            }`}
                      </p>
                    )}
                    {task.status === 'loading' && (
                      <div className="h-1 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${taskProgress(task)}%` }}
                        />
                      </div>
                    )}
                  </div>
                ))}
            </>
          )}
        </div>
      )}
    </aside>
  );
};
