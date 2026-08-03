import * as React from "react";
import { cn } from "@/lib/utils";
import { 
 Search,
 RotateCw,
 Filter,
 LayoutGrid,
 GripVertical,
 MoreVertical,
 ChevronDown,
 ChevronLeft,
 ChevronRight,
 BarChart3,
 Calendar,
 Check,
 Info,
  Heart,
  Sprout,
  Gauge,
  Lock,
  ArrowUpDown,
  X,
  Upload,
  Sparkles,
  Users,
  TrendingUp,
  Layers,
  PieChart,
  ChevronUp,
  ExternalLink,
  AlertTriangle,
  FileSearch,
  UserCheck,
  UserPlus,
  UserSearch,
} from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/feedback/EmptyState";
import { DrawerShell } from "@/components/overlays/DrawerShell";
import { UploadZone } from "@/components/upload/UploadZone";
import { validateFiles } from "@/components/upload/uploadUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/forms/Field";
import { SearchableSelect } from "@/components/forms/SearchableSelect";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DatePicker } from "@/components/date/DatePicker";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  analyzeUploaded,
  findExistingDuplicate,
  identifierTypeLabel,
  isEmptyAnalysis,
  linkedUsernames,
  publicVisibilityBlock,
  resolveDemoScenario,
  splitParticipantsByMatch,
  PUBLIC_VISIBILITY_BLOCK_MESSAGE,
  type AnalyzeOutcome,
  type DetectedParticipant,
  type DetectedSurveyAnalysis,
  type ParticipantResolution,
  type ParticipantResolutions,
  type SurveyImportWarning,
  type UbitsDirectoryUser,
} from "@/lib/surveyImport";
import { UBITS_DIRECTORY } from "@/mocks/participantsMocks";
import { 
 Table, 
 TableBody, 
 TableCell, 
 TableHead, 
 TableHeader, 
 TableRow 
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Plus, FileText, Layout } from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { COMPARATIVE_SURVEYS_LIST } from "@/mocks/comparativeMocks";
import type { SurveyListItem } from "@/mocks/types";


/**
 * EncuestasDashboard
 * 
 * Main view for the "Encuestas" tab.
 * Implements the survey list and the comparison wizard.
 */

// --- Redesigned UI Components (UBITS Standard) ---

// --- Redesigned UI Components (UBITS Premium Standard) ---

interface SurveyReviewItem {
  groupKey: string;
  name: string;
  /** Never pre-filled — the user must pick it before advancing past "Datos generales". */
  type: SurveyTypeOption | '';
  visibility: 'publica' | 'anonima';
  anonymityThreshold: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
  fileNames: string[];
  analysis: DetectedSurveyAnalysis;
}

/** The only survey types selectable in "Datos generales" — kept in sync with the "Tipo" column. */
type SurveyTypeOption = 'Clima' | 'Cultura' | 'NPS';
const SURVEY_TYPE_OPTIONS: SurveyTypeOption[] = ['Clima', 'Cultura', 'NPS'];

interface UploadTaskState {
  id: number;
  name: string;
  progress: number;
  status: 'loading' | 'completed' | 'failed';
  /** Demo flag: this task's load is scripted to fail part-way through. */
  willFail?: boolean;
}

interface RecentUpload {
  id: string;
  name: string;
  /** Human-friendly relative time, e.g. "Hace 2 días". */
  loadedAt: string;
  type: string;
}

/** Loads made in the last 7 days — populates the "Cargas" tab of the upload panel. */
const RECENT_UPLOADS: RecentUpload[] = [
  { id: "ru-1", name: "Clima Laboral 2024 Q2", loadedAt: "Hoy, 09:14", type: "Clima" },
  { id: "ru-2", name: "Cultura Organizacional 2024", loadedAt: "Ayer, 16:40", type: "Cultura" },
  { id: "ru-3", name: "NPS Interno Marzo 2024", loadedAt: "Hace 3 días", type: "NPS" },
  { id: "ru-4", name: "Clima Laboral 2024 Q1", loadedAt: "Hace 5 días", type: "Clima" },
  { id: "ru-5", name: "Pulso Bienestar Febrero", loadedAt: "Hace 6 días", type: "Clima" },
];

interface AnalyzingCopy {
  title: string;
  status: string;
  footer: string;
}

/**
 * Builds the loading-overlay copy so it reads like a real multi-step analysis
 * instead of one static line: first reading and identifying the uploaded
 * files (and whether they hold more than one survey), then — once a specific
 * survey has been chosen — matching its structure against UBITS' own model
 * (participation, sections, favorability, eNPS). Uses the real file count and,
 * once available, the real detected counts so the copy isn't just decorative.
 */
function getAnalyzingCopy(
  purpose: 'files' | 'survey',
  progress: number,
  filesCount: number,
  survey: { name: string; analysis: DetectedSurveyAnalysis } | null
): AnalyzingCopy {
  if (purpose === 'survey' && survey) {
    const { analysis } = survey;
    const status =
      progress < 20
        ? `Abriendo "${survey.name}"...`
        : progress < 45
          ? `Calculando participación${
              analysis.totalRespondents != null ? ` (${analysis.totalRespondents} respuestas)` : ""
            }...`
          : progress < 70
            ? `Detectando secciones y preguntas${analysis.sections.length ? ` (${analysis.sections.length} secciones)` : ""}...`
            : progress < 90
              ? "Haciendo match con la estructura de encuestas de UBITS..."
              : "Calculando favorabilidad y eNPS...";
    return {
      title: "Analizando encuesta",
      status,
      footer: "Estamos preparando el resumen de tu encuesta.",
    };
  }

  const plural = filesCount === 1 ? "archivo" : "archivos";
  const status =
    progress < 20
      ? `Abriendo ${filesCount} ${plural}...`
      : progress < 45
        ? "Leyendo la estructura de cada archivo..."
        : progress < 70
          ? "Identificando el tipo de encuesta (Clima, Cultura o NPS)..."
          : progress < 90
            ? "Verificando si hay más de una encuesta en tus archivos..."
            : "Finalizando análisis...";
  return {
    title: "Analizando archivos",
    status,
    footer: "Estamos extrayendo y validando la información de tus encuestas.",
  };
}

/**
 * Catches validation-type problems (e.g. file too large) that are knowable
 * right when files are picked, so the dropzone can reject them immediately
 * instead of waiting through the "analizando archivos" step. Parse-type
 * failures (corrupt file) genuinely require reading the file, so those still
 * surface after analysis.
 */
function getImmediateValidationError(files: File[]): string | null {
  const scenario = resolveDemoScenario(files);
  if (scenario?.kind === 'error' && scenario.variant === 'validation') return scenario.detail;
  return null;
}

const SHORT_MONTH_NAMES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** Formats a date to match the mock survey list's style, e.g. "15 ene 2026". */
function formatShortDate(date: Date | undefined): string {
  if (!date) return '';
  const day = date.getDate().toString().padStart(2, '0');
  return `${day} ${SHORT_MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

/** One line inside a summary accordion: an optional color dot / index, a label, and an optional right-aligned value. */
const SummaryRow: React.FC<{
  label: string;
  value?: string;
  dotClass?: string;
  index?: number;
  multiline?: boolean;
}> = ({ label, value, dotClass, index, multiline }) => (
  <div className="flex items-start justify-between gap-3 py-2.5 border-b border-border/25 last:border-b-0">
    <div className="flex items-start gap-2.5 min-w-0">
      {dotClass && <span className={cn("h-2.5 w-2.5 rounded-full shrink-0 mt-1", dotClass)} />}
      {index != null && <span className="text-sm font-bold text-text-secondary/40 tabular-nums shrink-0">{index}.</span>}
      <span className={cn("text-sm text-text-secondary leading-snug", !multiline && "truncate")}>{label}</span>
    </div>
    {value && <span className="text-sm font-semibold text-text-secondary tabular-nums shrink-0">{value}</span>}
  </div>
);

// UBITS question taxonomy: tipo de pregunta → (si es escala) tipo de escala →
// (si es Likert) tipo de valoración.
type TipoPregunta =
  | "Escala de valoración"
  | "Pregunta abierta"
  | "Opción única"
  | "Múltiples respuestas"
  | "Desplegable"
  | "Sin reconocer";
type EscalaTipo = "Likert" | "NPS" | "Estrellas" | "Emociones" | "Lineal" | "Likert (NOM 035)";
type Valoracion = "Frecuencia" | "Satisfacción" | "Acuerdo" | "Probabilidad" | "Frecuencia (NOM 035)";

interface QuestionMeta {
  /** UBITS question type. */
  tipoPregunta: TipoPregunta;
  /** Scale family, only for "Escala de valoración". */
  escala?: EscalaTipo;
  /** Rating subtype, only for Likert. */
  valoracion?: Valoracion;
  /** Whether the question maps to a supported UBITS type at all. */
  recognized: boolean;
  /** Human-readable range/detail, e.g. "Muy en desacuerdo a Muy de acuerdo". */
  valor?: string;
}

/**
 * Best-effort classifier that maps a question's text to the UBITS taxonomy.
 * Purely presentational (badges/grouping/filter) — metrics come from the
 * aggregated source, not from this. Order matters: the most specific cues win.
 */
function classifyQuestion(text: string): QuestionMeta {
  const t = text.toLowerCase();
  const has = (...words: string[]) => words.some((w) => t.includes(w));

  // 1. Not a UBITS type at all (matrix / ranking / drag interactions).
  if (has("ordena de mayor", "ordena las", "jerarquiza", "ranking", "clasifica de mayor", "arrastra", "distribuye", "matriz", "empareja")) {
    return { tipoPregunta: "Sin reconocer", recognized: false };
  }
  // 2. NPS (recommendation).
  if (has("recomiend", "0 a 10", "0 a un 10", "probable es que recomien")) {
    return { tipoPregunta: "Escala de valoración", escala: "NPS", recognized: true, valor: "0 a 10" };
  }
  // 3. Visual scales.
  if (has("estrella")) {
    return { tipoPregunta: "Escala de valoración", escala: "Estrellas", recognized: true, valor: "1 a 5 estrellas" };
  }
  if (has("cómo te sientes", "como te sientes", "emoji", "carita", "emoción", "emocion")) {
    return { tipoPregunta: "Escala de valoración", escala: "Emociones", recognized: true, valor: "Escala visual de emociones" };
  }
  if (has("escala lineal", "escala de 1 a 7", "escala del 1 al 7", "en una escala de 1 a")) {
    return { tipoPregunta: "Escala de valoración", escala: "Lineal", recognized: true, valor: "Escala lineal" };
  }
  // 4. Non-scale question types.
  if (has("comentario", "describe", "explica", "sugerenc", "cuéntanos", "cuentanos", "qué opinas", "que opinas", "respuesta abierta", "en tus palabras")) {
    return { tipoPregunta: "Pregunta abierta", recognized: true, valor: "Texto libre" };
  }
  if (has("selecciona todas", "marca todas", "las que apliquen", "todas las que")) {
    return { tipoPregunta: "Múltiples respuestas", recognized: true, valor: "Selección múltiple" };
  }
  if (has("elige de la lista", "lista desplegable", "desplegable", "selecciona de la lista")) {
    return { tipoPregunta: "Desplegable", recognized: true, valor: "Lista desplegable" };
  }
  if (has("selecciona una", "elige una", "selecciona tu", "elige tu", "cuál es tu", "cual es tu", "indica tu")) {
    return { tipoPregunta: "Opción única", recognized: true, valor: "Una opción" };
  }
  // 5. Likert with rating subtype (default for agreement statements).
  if (has("con qué frecuencia", "con que frecuencia", "nunca", "siempre", "frecuencia")) {
    return { tipoPregunta: "Escala de valoración", escala: "Likert", valoracion: "Frecuencia", recognized: true, valor: "Nunca a Siempre" };
  }
  if (has("satisfech")) {
    return { tipoPregunta: "Escala de valoración", escala: "Likert", valoracion: "Satisfacción", recognized: true, valor: "Insatisfecho a Satisfecho" };
  }
  if (has("qué tan probable", "que tan probable", "probable")) {
    return { tipoPregunta: "Escala de valoración", escala: "Likert", valoracion: "Probabilidad", recognized: true, valor: "Nada probable a Muy probable" };
  }
  return { tipoPregunta: "Escala de valoración", escala: "Likert", valoracion: "Acuerdo", recognized: true, valor: "Muy en desacuerdo a Muy de acuerdo" };
}

/** The most specific label used for the type filter and for grouping. */
function questionKind(meta: QuestionMeta): string {
  if (!meta.recognized) return "Sin reconocer";
  if (meta.tipoPregunta === "Escala de valoración" && meta.escala) return meta.escala;
  return meta.tipoPregunta;
}

/** One detected question with its inferred UBITS type/scale/rating shown as badges. */
const QuestionRow: React.FC<{ index: number; text: string }> = ({ index, text }) => {
  const meta = classifyQuestion(text);
  return (
    <div className="flex gap-2.5 py-3 border-b border-border/25 last:border-b-0">
      <span className="text-sm font-bold text-text-secondary/40 tabular-nums shrink-0 mt-0.5">{index}.</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-text-primary leading-snug">{text}</p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {meta.recognized ? (
            <>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-surface-muted text-text-secondary">
                {meta.tipoPregunta}
              </span>
              {meta.escala && (
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-md text-[11px] font-bold",
                    meta.escala === "NPS" ? "bg-info/10 text-info" : "bg-primary/10 text-primary"
                  )}
                >
                  {meta.escala}
                </span>
              )}
              {(meta.valoracion || meta.valor) && (
                <span className="text-xs text-text-secondary/60 font-medium">
                  {[meta.valoracion, meta.valor].filter(Boolean).join(" · ")}
                </span>
              )}
            </>
          ) : (
            <>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-warning/10 text-warning inline-flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" strokeWidth={2.5} /> Sin reconocer
              </span>
              <span className="text-xs text-text-secondary/60 font-medium">Tipo no compatible con UBITS</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/** The decision taken on a participant, shown as a chip with a way to undo it. */
const ResolutionChip: React.FC<{
  resolution: ParticipantResolution;
  linkedUser?: UbitsDirectoryUser;
  onClear: () => void;
}> = ({ resolution, linkedUser, onClear }) => (
  <div className="flex flex-wrap items-center gap-2">
    {resolution.kind === 'linked' ? (
      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold inline-flex items-center gap-1 bg-status-positive/10 text-status-positive max-w-full">
        <Check className="h-3 w-3 shrink-0" strokeWidth={3} />
        <span className="truncate">Vinculado a {linkedUser?.name ?? resolution.username}</span>
      </span>
    ) : (
      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold inline-flex items-center gap-1 bg-surface-muted text-text-secondary">
        <UserPlus className="h-3 w-3 shrink-0" strokeWidth={2.5} /> Sin usuario · se crea en la encuesta
      </span>
    )}
    <button type="button" onClick={onClear} className="text-[11px] font-bold text-primary hover:underline shrink-0">
      Deshacer
    </button>
  </div>
);

/**
 * One detected participant: the name found in the file plus the identifier we
 * looked it up with, so the reviewer can see exactly why it did or didn't
 * resolve to a UBITS user.
 *
 * Every row can be corrected — an automatic match is a strong guess, not a fact:
 *  - `matched` → reject the match, or point it at a different user.
 *  - `possible` → the UBITS user we suspect it is, with enough context to tell
 *    homonyms apart: confirm, reject, or pick another. Never linked on its own.
 *  - `unmatched` → link it to any user by hand.
 */
const ParticipantRow: React.FC<{
  index: number;
  participant: DetectedParticipant;
  /** Directory to search when linking by hand. */
  directory: UbitsDirectoryUser[];
  /** Usernames already tied to somebody else in this batch. */
  takenUsernames: Set<string>;
  resolution?: ParticipantResolution;
  onResolve: (decision: ParticipantResolution | null) => void;
}> = ({ index, participant, directory, takenUsernames, resolution, onResolve }) => {
  const suggestion = participant.suggestion;
  const linkedUser =
    resolution?.kind === 'linked' ? directory.find((u) => u.username === resolution.username) : undefined;
  // Linking to another user in the directory: the same two-step gesture on every
  // row — the trigger opens a search in place of the buttons, and nothing is
  // committed until "Asociar" is pressed.
  const [isAssociating, setIsAssociating] = React.useState(false);
  const [pendingUsername, setPendingUsername] = React.useState<string>();
  // A pending suggestion owns the row: its yes/no stays the only thing to decide,
  // and a decision already taken shows as a chip you undo first. Everything else
  // offers the corrections that apply to it.
  const showRowActions = !resolution && !suggestion;

  const directoryOptions = React.useMemo(
    () =>
      directory.map((user) => ({
        value: user.username,
        label: user.name,
        description: takenUsernames.has(user.username)
          ? `${user.username} · ya vinculado a otro participante`
          : `${user.username} · ${user.context}`,
        disabled: takenUsernames.has(user.username),
      })),
    [directory, takenUsernames]
  );

  const closeAssociate = () => {
    setIsAssociating(false);
    setPendingUsername(undefined);
  };

  /** Search + confirm + back out, laid out as a single row. */
  const associateRow = (
    <div className="flex items-center gap-2">
      <SearchableSelect
        options={directoryOptions}
        value={pendingUsername}
        onValueChange={setPendingUsername}
        placeholder="Busca el usuario de UBITS"
        searchPlaceholder="Busca por nombre o username..."
        emptyMessage="Ningún usuario coincide."
        className="h-7 flex-1 min-w-0 rounded-md text-[11px] font-bold px-2.5"
      />
      <Button
        size="sm"
        disabled={!pendingUsername}
        onClick={() => {
          if (!pendingUsername) return;
          onResolve({ kind: 'linked', username: pendingUsername });
          closeAssociate();
        }}
        className="h-7 px-2.5 text-[11px] font-bold tracking-tight rounded-md shrink-0 disabled:opacity-40"
      >
        Asociar
      </Button>
      <Button
        size="sm"
        variant="ghost"
        aria-label="Cancelar asociación"
        onClick={closeAssociate}
        className="h-7 w-7 p-0 rounded-md shrink-0 text-text-secondary/60"
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );

  const associateTrigger = (extraClassName?: string) => (
    <Button
      size="sm"
      variant="ghost"
      onClick={() => setIsAssociating(true)}
      className={cn(
        "h-7 px-2.5 text-[11px] font-bold tracking-tight rounded-md text-primary hover:bg-primary/5",
        extraClassName
      )}
    >
      <UserPlus className="h-3.5 w-3.5" />
      Asociar usuario
    </Button>
  );

  return (
    <div className="flex gap-2.5 py-2.5 border-b border-border/25 last:border-b-0">
      <span className="text-sm font-bold text-text-secondary/40 tabular-nums shrink-0 mt-0.5">{index}.</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-text-primary leading-snug truncate">{participant.name ?? participant.identifier}</p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-surface-muted text-text-secondary max-w-full truncate">
            {participant.identifier}
          </span>
          <span className="text-xs text-text-secondary/60 font-medium">
            {identifierTypeLabel(participant.identifierType)}
            {participant.matchStatus !== 'matched' && " · sin coincidencia en UBITS"}
          </span>
        </div>

        {/* Name-only candidate: which user we think it is + the ways out. Only
             while the decision is pending — once taken, the candidate's details
             stop being relevant and the row collapses to its outcome chip. */}
        {suggestion && !resolution && (
          <div className="mt-2 rounded-md border border-border/50 bg-surface-muted/40 p-2.5 space-y-2.5">
            <div className="min-w-0">
              <p className="text-[11px] text-text-secondary/70 font-medium leading-snug">
                Mismo nombre y apellido que un usuario de UBITS:
              </p>
              <p className="text-[13px] font-bold text-text-primary tracking-tight truncate mt-0.5">
                {suggestion.name}
              </p>
              <p className="text-[11px] text-text-secondary/60 font-medium truncate">
                {suggestion.username} · {suggestion.context}
              </p>
            </div>

            {isAssociating ? (
              associateRow
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => onResolve({ kind: 'linked', username: suggestion.username })}
                  className="h-7 px-2.5 text-[11px] font-bold tracking-tight rounded-md"
                >
                  Sí, es el mismo usuario
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onResolve({ kind: 'separate' })}
                  className="h-7 px-2.5 text-[11px] font-bold tracking-tight rounded-md"
                >
                  Dejar sin match
                </Button>
                {associateTrigger("ml-auto shrink-0")}
              </div>
            )}
          </div>
        )}

        {/* Decision taken — same plain chip for every row, suggestion or not */}
        {resolution && (
          <div className="mt-2">
            <ResolutionChip resolution={resolution} linkedUser={linkedUser} onClear={() => onResolve(null)} />
          </div>
        )}

        {/* Corrections available on this row: an automatic match can be rejected,
             and any row can be pointed at a specific user from the directory. */}
        {showRowActions && (
          <div className="mt-2">
            {isAssociating ? (
              associateRow
            ) : (
              <div className="flex items-center gap-2">
                {participant.matchStatus === 'matched' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onResolve({ kind: 'separate' })}
                    className="h-7 px-2.5 text-[11px] font-bold tracking-tight rounded-md"
                  >
                    Dejar sin match
                  </Button>
                )}
                {associateTrigger()}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * A single consistent, self-contained accordion card used across the whole
 * summary — both the detected indicators and the detected structure share this
 * exact shape: icon + title on the left, the key number on the right (visible
 * collapsed), and a plain list of rows when expanded. Each renders as its own
 * card so they read as independent blocks.
 */
const SummaryAccordionItem: React.FC<{
  value: string;
  icon: any;
  title: string;
  headline: string;
  children: React.ReactNode;
}> = ({ value, icon: Icon, title, headline, children }) => (
  <AccordionItem
    value={value}
    className="rounded-2xl border border-border/50 bg-surface shadow-sm overflow-hidden transition-all hover:border-border-strong/30 data-[state=open]:border-primary/25 data-[state=open]:shadow-md"
  >
    <AccordionTrigger className="hover:no-underline items-center py-3.5 px-4 gap-3 rounded-none">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4" strokeWidth={2.25} />
        </div>
        <span className="text-sm font-bold text-text-primary tracking-tight truncate">{title}</span>
      </div>
      <span className="px-2.5 py-1 rounded-lg bg-surface-muted/70 text-[13px] font-bold text-text-secondary tabular-nums shrink-0 mr-1">
        {headline}
      </span>
    </AccordionTrigger>
    <AccordionContent className="px-4 pb-4">
      <div className="border-t border-border/40 pt-1">{children}</div>
    </AccordionContent>
  </AccordionItem>
);

/**
 * One way forward on the post-load step. `emphasis` marks the recommended
 * action (continuing with the batch) so the three options aren't equal weight.
 */
const NextActionCard: React.FC<{
  icon: any;
  title: string;
  description: string;
  emphasis?: boolean;
  onClick: () => void;
}> = ({ icon: Icon, title, description, emphasis, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 p-4 rounded-2xl border text-left transition-all hover:scale-[1.01] active:scale-[0.99]",
      emphasis
        ? "border-primary/40 bg-primary/5 hover:border-primary shadow-sm"
        : "border-border/50 bg-surface hover:border-border-strong/40"
    )}
  >
    <div
      className={cn(
        "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
        emphasis ? "bg-primary text-white" : "bg-surface-muted text-text-secondary/60"
      )}
    >
      <Icon className="h-4.5 w-4.5" strokeWidth={2.25} />
    </div>
    <div className="min-w-0 flex-1">
      <p className={cn("text-sm font-bold tracking-tight", emphasis ? "text-primary" : "text-text-primary")}>{title}</p>
      <p className="text-[11px] text-text-secondary/60 font-medium leading-snug mt-0.5">{description}</p>
    </div>
    <ChevronRight className="h-4 w-4 shrink-0 text-text-secondary/40" />
  </button>
);

/**
 * A load from this session, with its live progress. Shared by the loads list
 * and the post-load step so the running load looks the same in both places.
 */
const UploadTaskCard: React.FC<{
  task: UploadTaskState;
  /** Only the most recently finished load keeps the "just completed" check. */
  showCompletedCheck?: boolean;
  onViewSurvey: () => void;
  onRetry: (taskId: number) => void;
}> = ({ task, showCompletedCheck, onViewSurvey, onRetry }) => (
  <div
    className={cn(
      "p-3 rounded-xl border bg-surface",
      task.status === 'failed' ? "border-destructive/40 bg-destructive/5" : "border-border/40"
    )}
  >
    <div className="flex items-center gap-3">
      {task.status === 'completed' && showCompletedCheck ? (
        <div className="h-9 w-9 rounded-lg bg-status-positive-bg text-status-positive flex items-center justify-center shrink-0">
          <Check className="h-4 w-4" strokeWidth={3} />
        </div>
      ) : task.status === 'completed' ? (
        <div className="h-9 w-9 rounded-lg bg-surface-muted text-text-secondary/50 flex items-center justify-center shrink-0">
          <FileText className="h-4 w-4" strokeWidth={2} />
        </div>
      ) : task.status === 'failed' ? (
        <div className="h-9 w-9 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
          <AlertTriangle className="h-4 w-4" strokeWidth={2.5} />
        </div>
      ) : (
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <div className="h-4 w-4 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-text-primary truncate">{task.name}</p>
        <p className={cn(
          "text-[10px] font-medium",
          task.status === 'failed' ? "text-destructive" : "text-text-secondary/60"
        )}>
          {task.status === 'completed'
            ? "Encuesta cargada"
            : task.status === 'failed'
              ? "No pudimos cargarla — problemas técnicos"
              : "Cargando encuesta…"}
        </p>
      </div>
      {task.status === 'completed' ? (
        <button onClick={onViewSurvey} className="text-xs font-bold text-primary hover:underline shrink-0">
          Ver encuesta
        </button>
      ) : task.status === 'failed' ? (
        <button
          onClick={() => onRetry(task.id)}
          className="inline-flex items-center gap-1 text-xs font-bold text-destructive hover:underline shrink-0"
        >
          <RotateCw className="h-3.5 w-3.5" />
          Reintentar
        </button>
      ) : (
        <span className="text-sm font-bold text-primary tabular-nums shrink-0">{task.progress}%</span>
      )}
    </div>
    {task.status === 'loading' && (
      <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${task.progress}%` }} />
      </div>
    )}
    {task.status === 'failed' && (
      <div className="mt-2 h-1 bg-destructive/15 rounded-full overflow-hidden">
        <div className="h-full bg-destructive/70" style={{ width: `${task.progress}%` }} />
      </div>
    )}
  </div>
);

const RecentUploadsList: React.FC<{
  activeTasks: UploadTaskState[];
  recentUploads: RecentUpload[];
  onViewSurvey: () => void;
  onRetry: (taskId: number) => void;
}> = ({ activeTasks, recentUploads, onViewSurvey, onRetry }) => {
  const hasActive = activeTasks.length > 0;
  const anyLoading = activeTasks.some((task) => task.status === 'loading');
  const isEmpty = !hasActive && recentUploads.length === 0;
  // Only the most recently finished upload keeps the "just completed" check —
  // earlier ones fall back to the plain file icon, like any other past load.
  const latestCompletedId = [...activeTasks]
    .filter((task) => task.status === 'completed')
    .sort((a, b) => b.id - a.id)[0]?.id;

  if (isEmpty) {
    return (
      <EmptyState
        title="Sin cargas recientes"
        description="Aquí verás las encuestas que cargues en los últimos 7 días."
        icon={FileText}
        className="border-none bg-transparent py-10"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-bold text-text-primary tracking-tight">Historial de cargas</h3>
        <span className="px-2 py-1 bg-muted text-text-secondary/60 rounded text-[10px] font-bold uppercase tracking-wide">
          Últimos 7 días
        </span>
      </div>

      {anyLoading && (
        <Alert variant="info">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            La carga está en progreso. Puedes minimizar esta ventana y seguir usando la plataforma.
          </AlertDescription>
        </Alert>
      )}

      {/* Loads from this session, with live progress */}
      {hasActive && (
        <div className="space-y-2">
          {[...activeTasks].sort((a, b) => b.id - a.id).map((task) => (
            <UploadTaskCard
              key={task.id}
              task={task}
              showCompletedCheck={task.id === latestCompletedId}
              onViewSurvey={onViewSurvey}
              onRetry={onRetry}
            />
          ))}
        </div>
      )}

      {/* Previously loaded surveys */}
      <div className="space-y-2">
        {recentUploads.map((upload) => (
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
                  {upload.type}
                </Badge>
                <span className="text-[10px] text-text-secondary/50 font-medium flex items-center gap-1">
                  <Calendar className="h-2.5 w-2.5" />
                  {upload.loadedAt}
                </span>
              </div>
            </div>
            <button onClick={onViewSurvey} className="text-xs font-bold text-primary hover:underline shrink-0">
              Ver encuesta
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

/** Where a survey row came from: uploaded from an external file, or created inside UBITS. */
const SURVEY_ORIGIN_META: Record<SurveyListItem['origin'], { label: string; short: string; className: string }> = {
  externa: { label: "Carga externa", short: "Externa", className: "bg-info/10 text-info" },
  interna: { label: "Creación interna UBITS", short: "UBITS", className: "bg-primary/10 text-primary" },
};

/** Text-only pill for the "Origen" column marking a row as an external load or a UBITS-native creation. */
const SurveyOriginBadge: React.FC<{ origin: SurveyListItem['origin'] }> = ({ origin }) => {
  const meta = SURVEY_ORIGIN_META[origin];
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 cursor-default",
            meta.className
          )}
        >
          {meta.short}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top">
        <span>{meta.label}</span>
      </TooltipContent>
    </Tooltip>
  );
};

const TypeCard: React.FC<{
 title: string, 
 description: string, 
 icon: any, 
 selected: boolean, 
 onSelect: (val: string) => void 
}> = ({ title, description, icon: Icon, selected, onSelect }) => (
 <div 
 onClick={() => onSelect(title)}
 className={cn(
 "flex items-center gap-3 p-2.5 rounded-xl border-2 transition-all duration-400 cursor-pointer mb-2 relative overflow-hidden",
 selected 
 ? "border-primary bg-surface shadow-primary/5" 
 : "border-border/40 bg-surface"
 )}
 >
 {selected && (
 <div className="absolute -right-12 -top-12 w-32 h-32 bg-primary/5 rounded-full blur-[40px] pointer-events-none" />
 )}

 <div className={cn(
 "h-9 w-9 rounded-lg flex items-center justify-center transition-all duration-500 shrink-0 relative z-10",
 selected ? "bg-primary text-text-inverse shadow-md shadow-primary/20" : "bg-surface-muted text-text-secondary/40"
 )}>
 <Icon className="h-4 w-4" strokeWidth={2.5} />
 </div>
 
 <div className="flex-1 min-w-0 relative z-10">
 <h4 className={cn(
 "text-[13px] font-bold transition-colors mb-0.5 tracking-tight",
 selected ? "text-primary" : "text-text-primary"
 )}>{title}</h4>
 <p className="text-[10px] text-text-secondary/60 font-medium leading-tight line-clamp-2">
 {description}
 </p>
 </div>

  <div className={cn(
    "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all duration-500 shrink-0 relative z-10",
    selected ? "border-primary shadow-sm shadow-primary/10" : "border-border-strong/40 bg-surface-muted"
  )}>
    <div className={cn(
      "h-2.5 w-2.5 rounded-full bg-primary transition-all duration-500 transform",
      selected ? "scale-100 opacity-100" : "scale-0 opacity-0"
    )} />
  </div>
 </div>
);

const SurveySelectionItem: React.FC<{
 survey: any;
 selected: boolean;
 onSelect: (id: string) => void;
 isComparative?: boolean;
}> = ({ survey, selected, onSelect, isComparative }) => (
 <div 
 onClick={() => onSelect(survey.id)}
 className={cn(
 "flex items-center gap-3 p-2.5 rounded-xl border-2 transition-all duration-400 cursor-pointer bg-surface mb-2 relative overflow-hidden",
 selected 
 ? "border-primary shadow-primary/5" 
 : "border-border/40"
 )}
 >
 {selected && (
 <div className="absolute -left-12 -bottom-12 w-32 h-32 bg-primary/5 rounded-full blur-[40px] pointer-events-none" />
 )}

 <div className={cn(
 "h-9 w-9 rounded-lg flex items-center justify-center transition-all duration-500 shrink-0 relative z-10",
 selected ? "bg-primary text-text-inverse shadow-md shadow-primary/20" : "bg-surface-muted text-text-secondary/40"
 )}>
 <Calendar className="h-4 w-4" strokeWidth={2} />
 </div>
 
 <div className="flex-1 min-w-0 relative z-10">
 <div className="flex items-center gap-2 mb-1">
  <Tooltip>
    <TooltipTrigger asChild>
      <h4 className={cn(
        "text-[13px] font-bold transition-colors tracking-tight line-clamp-1 cursor-default",
        selected ? "text-primary" : "text-text-primary"
      )}>{survey.name}</h4>
    </TooltipTrigger>
    <TooltipContent side="top" className="tooltip-premium">
      <div className="flex flex-col gap-0.5">
        <span className="text-[9px] opacity-60 font-medium">Nombre de la encuesta</span>
        <span>{survey.name}</span>
      </div>
    </TooltipContent>
  </Tooltip>
 {survey.status === 'Finalizado' && (
 <Badge className="bg-status-positive-bg text-status-positive border-none text-[8px] font-bold px-2 py-0 rounded-full shrink-0 pointer-events-none">
 Finalizado
 </Badge>
 )}
 </div>
 <div className="flex items-center gap-3 text-[10px] text-text-secondary/50 font-medium tracking-tight">
 <span className="flex items-center gap-1.5">
 <RotateCw className="h-2 w-2" />
 {survey.startDate}
 </span>
 <span className="flex items-center gap-1.5">
 <LayoutGrid className="h-2 w-2" />
 {survey.participants} participantes
 </span>
 </div>
 </div>

 {/* Selection Indicator */}
 <div className="relative z-10 shrink-0">
 {isComparative ? (
 <Checkbox 
 checked={selected} 
 onCheckedChange={() => onSelect(survey.id)}
 className="h-5 w-5 rounded border-2 border-border bg-muted data-[state=checked]:bg-primary data-[state=checked]:border-primary"
 />
 ) : (
 <div className={cn(
 "h-4 w-4 border-2 rounded-full flex items-center justify-center transition-all duration-400 shrink-0",
 selected ? "bg-primary border-primary shadow-sm shadow-primary/10" : "border-border-strong/40 bg-surface-muted"
 )}>
 {selected && (
 <div className="h-1.5 w-1.5 rounded-full bg-white shadow-sm" />
 )}
 </div>
 )}
 </div>
 </div>
);



interface EncuestasDashboardProps {
 onGenerateComparative?: (baseId: string, comparativeIds: string[], type: string) => void;
 initialIsDrawerOpen?: boolean;
 initialBaseId?: string | null;
 initialComparativeIds?: string[];
 initialType?: string | null;
 initialStep?: number;
}

export const EncuestasDashboard: React.FC<EncuestasDashboardProps> = ({ 
 onGenerateComparative,
 initialIsDrawerOpen = false,
 initialBaseId = null,
 initialComparativeIds = [],
 initialType = null,
 initialStep
}) => {
 const [isDrawerOpen, setIsDrawerOpen] = React.useState(initialIsDrawerOpen);
 
 // Selection State
 const [selectedType, setSelectedType] = React.useState<string | null>(initialType);
 const [selectedBaseId, setSelectedBaseId] = React.useState<string | null>(initialBaseId);
 const [selectedComparativeIds, setSelectedComparativeIds] = React.useState<string[]>(initialComparativeIds);
  const [activeStep, setActiveStep] = React.useState(() => {
    if (initialStep !== undefined) return initialStep;
    if (initialType) return 2;
    return 1;
  });

  const [sortOrder, setSortOrder] = React.useState<'recent' | 'oldest' | 'name' | 'name-desc'>('recent');

 const [searchQuery, setSearchQuery] = React.useState("");

 const [isUploadDrawerOpen, setIsUploadDrawerOpen] = React.useState(false);
 // Which tab of the upload panel is active: the new-upload experience or the
 // list of recent loads (last 7 days).
 const [uploadTab, setUploadTab] = React.useState<'nueva' | 'cargas'>('nueva');
 // Which summary accordion card is expanded — a single shared value across both
 // the indicators and structure groups, so only one is ever open at a time.
 const [openSummarySection, setOpenSummarySection] = React.useState<string | undefined>(undefined);
 // Filters for the detected-questions list.
 const [questionSectionFilter, setQuestionSectionFilter] = React.useState<string>('all');
 const [questionScaleFilter, setQuestionScaleFilter] = React.useState<string>('all');
 const [uploadFiles, setUploadFiles] = React.useState<File[]>([]);
 const [isAnalyzingFiles, setIsAnalyzingFiles] = React.useState(false);
 const [analyzeProgress, setAnalyzeProgress] = React.useState(35);
 const [uploadStep, setUploadStep] = React.useState<'dropzone' | 'select' | 'general' | 'summary' | 'next-action' | 'loading' | 'error' | 'empty'>('dropzone');
 const [reviewItems, setReviewItems] = React.useState<SurveyReviewItem[]>([]);
 const [selectedGroupKey, setSelectedGroupKey] = React.useState<string | null>(null);
 // Surveys from this batch whose load has already been started. Only one survey
 // can be loaded at a time, so the rest stay pending and are offered again from
 // the post-load step instead of being silently dropped.
 const [loadedGroupKeys, setLoadedGroupKeys] = React.useState<string[]>([]);
 // Decisions taken on participants that only matched by name, keyed by the
 // participant's identifier. Name matches are never resolved automatically.
 const [participantResolutions, setParticipantResolutions] = React.useState<ParticipantResolutions>({});
 const [importWarnings, setImportWarnings] = React.useState<SurveyImportWarning[]>([]);
 // A blocking error surfaced while analyzing (unreadable/too-large/failed parse).
 const [analyzeError, setAnalyzeError] = React.useState<{ title: string; detail: string } | null>(null);
 // True when the detected structure was simulated from a PDF/image (mock extraction).
 const [isSimulated, setIsSimulated] = React.useState(false);
 // Set true only after the user hits "Siguiente" with a duplicate name — the
 // duplicate check runs on submit, not proactively, so the button stays enabled.
 const [nameErrorShown, setNameErrorShown] = React.useState(false);
 const parsePromiseRef = React.useRef<Promise<AnalyzeOutcome> | null>(null);
 const uploadTriggerInputRef = React.useRef<HTMLInputElement>(null);
 // What the loading overlay is currently doing: reading the uploaded files, or
 // (once a survey has been chosen) preparing its general data and summary.
 // State (not a ref) because the overlay's copy depends on it while rendering.
 const [analyzingPurpose, setAnalyzingPurpose] = React.useState<'files' | 'survey'>('files');

 // Background "loading the survey" tasks — kept alive after the drawer is
 // minimized so a floating tray can keep showing progress, mirroring how a
 // browser download tray survives the panel that started it being closed.
 const [uploadTasks, setUploadTasks] = React.useState<UploadTaskState[]>([]);
 const [showUploadTray, setShowUploadTray] = React.useState(false);
 const [isUploadTrayMinimized, setIsUploadTrayMinimized] = React.useState(false);

 const resetUploadDrawer = () => {
   setUploadFiles([]);
   setUploadStep('dropzone');
   setReviewItems([]);
   setSelectedGroupKey(null);
   setLoadedGroupKeys([]);
   setParticipantResolutions({});
   setImportWarnings([]);
   setAnalyzeError(null);
   setIsSimulated(false);
   setNameErrorShown(false);
   parsePromiseRef.current = null;
 };

 // Header "Cargar" action: open the side panel on its entry screen instead of
 // jumping straight into the OS file picker. The whole upload experience lives
 // inside the "Nueva carga" tab; "Cargas" shows the last 7 days of loads.
 const handleOpenUploadDrawer = () => {
   resetUploadDrawer();
   setUploadTab('nueva');
   setIsUploadDrawerOpen(true);
 };

 const handleUploadTriggerFilesPicked = (e: React.ChangeEvent<HTMLInputElement>) => {
   const selectedFiles = Array.from(e.target.files || []);
   e.target.value = '';
   if (selectedFiles.length === 0) return;

   const validation = validateFiles(selectedFiles, { accept: '.csv,.xls,.xlsx,.pdf,.png,.jpg,.jpeg', multiple: true, maxSizeMB: 10 });
   if (!validation.isValid) {
     toast.error(validation.error || 'Selección de archivos inválida');
     return;
   }

   const immediateError = getImmediateValidationError(selectedFiles);
   if (immediateError) {
     toast.error(immediateError);
     return;
   }

   setUploadFiles(selectedFiles);
   setIsUploadDrawerOpen(true);
   setAnalyzingPurpose('files');
   setIsAnalyzingFiles(true);
   parsePromiseRef.current = analyzeUploaded(selectedFiles);
 };

 /**
  * Records what the user decided about a participant the system didn't link on
  * its own — linking them to a UBITS user, or keeping them inside the survey.
  * A `null` decision drops the record, putting the person back where detection
  * left them.
  */
 const resolveParticipant = (identifier: string, decision: ParticipantResolution | null) => {
   setParticipantResolutions((prev) => {
     if (decision === null) {
       const { [identifier]: _dropped, ...rest } = prev;
       return rest;
     }
     return { ...prev, [identifier]: decision };
   });
 };

 const updateReviewItem = (groupKey: string, patch: Partial<SurveyReviewItem>) => {
   setReviewItems((prev) => prev.map((item) => (item.groupKey === groupKey ? { ...item, ...patch } : item)));
 };

 React.useEffect(() => {
   if (!isAnalyzingFiles) {
     setAnalyzeProgress(35);
     return;
   }

   const interval = setInterval(() => {
     setAnalyzeProgress((prev) => {
       if (prev >= 100) {
         clearInterval(interval);
         return 100;
       }
       return prev + 1;
     });
   }, 80);

   return () => clearInterval(interval);
 }, [isAnalyzingFiles]);

 React.useEffect(() => {
   if (!isAnalyzingFiles || analyzeProgress < 100) return;

   let cancelled = false;

   const finishReadingFiles = async () => {
     let outcome: AnalyzeOutcome | null;
     try {
       outcome = await (parsePromiseRef.current ?? Promise.resolve(null));
     } catch {
       // A real failure in the parsing pipeline — surface it as a blocking error
       // rather than silently pretending zero surveys were found.
       outcome = {
         kind: 'error',
         variant: 'parse',
         title: 'No pudimos procesar el archivo',
         detail: 'Ocurrió un problema al leer el contenido. Revisa que el archivo sea un reporte válido e inténtalo de nuevo.',
       };
     }

     if (cancelled) return;

     setIsAnalyzingFiles(false);

     // Blocking error scenarios (unreadable / too large / failed parse).
     if (outcome?.kind === 'error') {
       setAnalyzeError({ title: outcome.title, detail: outcome.detail });
       setIsSimulated(false);
       setReviewItems([]);
       setImportWarnings([]);
       setUploadStep('error');
       return;
     }

     const result = outcome?.result ?? null;
     const simulated = outcome?.kind === 'result' && outcome.simulated === true;
     setAnalyzeError(null);
     setIsSimulated(simulated);
     setImportWarnings(result?.unrecognizedFiles ?? []);
     // A fresh file analysis starts a fresh batch: nothing here has been loaded
     // yet, even if a previous batch reused the same group keys (e.g. "2025"),
     // and any name-match decisions belonged to the previous roster.
     setLoadedGroupKeys([]);
     setParticipantResolutions({});
     const groups = result?.groups ?? [];
     setReviewItems(
       groups.map((group) => {
         return {
           groupKey: group.groupKey,
           name: group.suggestedSurveyName,
           // Never pre-filled: the user must choose it in "Datos generales".
           type: '',
           // Public only when the files tie each participant to their own
           // answers; otherwise anonymous is the only option (and the form
           // blocks the choice, so this default is also the final value).
           visibility: publicVisibilityBlock(group.analysis) == null ? 'publica' : 'anonima',
           anonymityThreshold: '5',
           startDate: group.suggestedStartDate ?? undefined,
           endDate: group.suggestedEndDate ?? undefined,
           fileNames: group.fileNames,
           analysis: group.analysis,
         };
       })
     );
     setSelectedGroupKey(groups[0]?.groupKey ?? null);
     // A single survey with nothing usable in it → dedicated empty state that
     // invites uploading another file, instead of a summary full of zeros.
     const soleGroup = groups.length === 1 ? groups[0] : null;
     if (soleGroup && isEmptyAnalysis(soleGroup.analysis)) {
       setUploadStep('empty');
       return;
     }
     // Only one survey detected: skip straight to the general-data step. With
     // zero or multiple surveys, the selection screen decides what happens next.
     setUploadStep(groups.length === 1 ? 'general' : 'select');
   };

   // Second pass, once a survey has been chosen from several candidates: the
   // data is already parsed, this is just the "preparing your survey" beat
   // before showing its general data and summary.
   const finishPreparingSurvey = async () => {
     if (cancelled) return;
     setIsAnalyzingFiles(false);
     setUploadStep('general');
   };

   const finish = analyzingPurpose === 'survey' ? finishPreparingSurvey : finishReadingFiles;

   const timeout = setTimeout(finish, 500);
   return () => {
     cancelled = true;
     clearTimeout(timeout);
   };
 }, [isAnalyzingFiles, analyzeProgress, analyzingPurpose]);

 const handleAnalyzeFiles = () => {
   setAnalyzingPurpose('files');
   setIsAnalyzingFiles(true);
   parsePromiseRef.current = analyzeUploaded(uploadFiles);
 };

 const handleAnalyzeSelectedSurvey = () => {
   setAnalyzingPurpose('survey');
   setIsAnalyzingFiles(true);
 };

 // Lets the user return to the dropzone to swap/add files — keeps the files
 // already picked (so they're still there to edit) but drops the stale
 // analysis, since it no longer matches whatever gets analyzed next.
 const handleBackToDropzone = () => {
   setUploadStep('dropzone');
   setReviewItems([]);
   setSelectedGroupKey(null);
   setLoadedGroupKeys([]);
   setImportWarnings([]);
   setIsSimulated(false);
   setNameErrorShown(false);
 };

 const selectedReviewItem = reviewItems.find((item) => item.groupKey === selectedGroupKey);
 // Why the "Pública" option is unavailable for this survey, or null when it is
 // available. Drives both the disabled radio and its explanation.
 const publicBlock = selectedReviewItem ? publicVisibilityBlock(selectedReviewItem.analysis) : null;
 // Sanity checks on the general-data form before letting the user continue.
 const anonymityThresholdNum = Number(selectedReviewItem?.anonymityThreshold);
 const isAnonymityValid =
   !selectedReviewItem ||
   (selectedReviewItem.anonymityThreshold.trim() !== '' &&
     Number.isInteger(anonymityThresholdNum) &&
     anonymityThresholdNum >= 1);
 const isDateRangeValid =
   !selectedReviewItem?.startDate ||
   !selectedReviewItem?.endDate ||
   selectedReviewItem.startDate <= selectedReviewItem.endDate;
 // UBITS does not allow duplicate surveys. Recomputed live from the current name
 // in the input, so renaming to a free name clears the error and unblocks.
 const duplicateExisting = selectedReviewItem
   ? findExistingDuplicate(selectedReviewItem.name, null)
   : null;
 // The duplicate check is NOT part of this — it runs when the user hits
 // "Siguiente", so the button stays enabled and validates on submit.
 const canProceedFromGeneral =
   !!selectedReviewItem &&
   !!selectedReviewItem.name.trim() &&
   !!selectedReviewItem.type &&
   !!selectedReviewItem.startDate &&
   !!selectedReviewItem.endDate &&
   isDateRangeValid &&
   isAnonymityValid;

 const handleGeneralNext = () => {
   if (duplicateExisting) {
     setNameErrorShown(true);
     return;
   }
   setNameErrorShown(false);
   setUploadStep('summary');
 };

 // Drives a task's progress bar. If `willFail`, it gets stuck part-way and the
 // task flips to 'failed' (shown inline in the loads list and the tray); the
 // failure is never a full-screen error. Otherwise it completes at 100%.
 const runUploadProgress = (taskId: number, willFail: boolean) => {
   const failAt = willFail ? 62 + Math.random() * 18 : 100; // stuck ~62–80% on failure
   let progress = 0;
   const interval = setInterval(() => {
     progress = Math.min(failAt, progress + Math.random() * 20);
     const reached = progress >= failAt;
     setUploadTasks((prev) =>
       prev.map((task) =>
         task.id === taskId
           ? { ...task, progress: Math.round(progress), status: reached ? (willFail ? 'failed' : 'completed') : 'loading' }
           : task
       )
     );
     if (reached) clearInterval(interval);
   }, 500);
 };

 // Surveys from this batch still waiting to be loaded. Drives the post-load step:
 // with something pending we offer it explicitly, otherwise the batch is done.
 const pendingReviewItems = reviewItems.filter((item) => !loadedGroupKeys.includes(item.groupKey));

 const handleFinalizeSurveyUpload = () => {
   if (!selectedReviewItem) return;

   // Demo scenario: a specific file makes the load fail part-way (server/tech
   // error), shown inline on the loads-list item — never full screen.
   // Independent of every other case, triggered only by its filename.
   const finalizeFails = selectedReviewItem.fileNames.some((n) => /falla-carga|error-carga/i.test(n));

   // The wizard's staged files are done with once the load starts, so clear
   // them — switching to "Nueva carga" from the loads list lands on an empty
   // dropzone rather than the files that were just loaded.
   setUploadFiles([]);

   const taskId = Date.now();
   setUploadTasks((prev) => [...prev, { id: taskId, name: selectedReviewItem.name, progress: 0, status: 'loading', willFail: finalizeFails }]);
   setShowUploadTray(true);
   setIsUploadTrayMinimized(false);

   // Only one survey loads at a time. If the batch still holds others, land on
   // the post-load step so the pending ones stay reachable — dropping straight
   // into the loads list would bury them. With nothing pending, go there.
   const stillPending = reviewItems.filter(
     (item) => item.groupKey !== selectedReviewItem.groupKey && !loadedGroupKeys.includes(item.groupKey)
   );
   setLoadedGroupKeys((prev) => [...prev, selectedReviewItem.groupKey]);
   if (stillPending.length > 0) {
     setUploadStep('next-action');
   } else {
     setUploadStep('loading');
     setUploadTab('cargas');
   }

   // Surfaces the new survey at the top of the home table right away, tagged as
   // an external load; its status/progress will track the upload task live.
   setSurveys((prev) => [
     {
       id: `up-${taskId}`,
       name: selectedReviewItem.name,
       type: selectedReviewItem.type,
       status: 'Cargando',
       statusVariant: 'info',
       startDate: formatShortDate(selectedReviewItem.startDate),
       endDate: formatShortDate(selectedReviewItem.endDate),
       participants: String(selectedReviewItem.analysis.totalRespondents ?? 0),
       progress: 0,
       origin: 'externa',
       uploadTaskId: taskId,
     },
     ...prev,
   ]);

   runUploadProgress(taskId, finalizeFails);
 };

 // --- Post-load step: the three ways forward after a load has been started ---

 /**
  * Continue with a survey from the same batch. With several still pending the
  * user picks from the selection step; with exactly one left we go straight to
  * it, replaying the same "preparing your survey" beat as the normal flow.
  */
 const handleLoadPendingSurvey = () => {
   const next = pendingReviewItems[0];
   if (!next) return;
   setNameErrorShown(false);
   setSelectedGroupKey(next.groupKey);
   if (pendingReviewItems.length > 1) {
     setUploadStep('select');
     return;
   }
   handleAnalyzeSelectedSurvey();
 };

 /**
  * Back out of a review step. Once something from this batch has been loaded,
  * "back" returns to the post-load hub — going all the way to the dropzone
  * would throw away the surveys still pending from the same files.
  */
 const handleReviewBack = () => {
   if (uploadStep === 'summary') {
     setUploadStep('general');
     return;
   }
   if (loadedGroupKeys.length > 0) {
     setUploadStep('next-action');
     return;
   }
   handleBackToDropzone();
 };

 const reviewBackLabel =
   uploadStep === 'summary'
     ? 'Volver'
     : loadedGroupKeys.length > 0
       ? 'Volver a las opciones'
       : 'Volver a la carga de archivos';

 /**
  * Start over with different files. The pending surveys from the previous batch
  * are dropped on purpose: they belong to files the user is replacing.
  */
 const handleStartNewUpload = () => {
   resetUploadDrawer();
   setUploadTab('nueva');
 };

 const retryUpload = (taskId: number) => {
   const task = uploadTasks.find((t) => t.id === taskId);
   if (!task) return;
   setUploadTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, progress: 0, status: 'loading' } : t)));
   runUploadProgress(taskId, task.willFail ?? false);
 };

 const handleCloseUploadTray = () => {
   setShowUploadTray(false);
   setIsUploadTrayMinimized(false);
 };

 const handleViewLoadedSurvey = () => {
   setIsUploadDrawerOpen(false);
   setShowUploadTray(false);
   setIsUploadTrayMinimized(false);
   resetUploadDrawer();
 };

 // Survey list: seeded from mock data, with newly finalized uploads prepended to the front.
 const [surveys, setSurveys] = React.useState<SurveyListItem[]>(COMPARATIVE_SURVEYS_LIST);

 // Rows still tied to an active upload task reflect that task's live progress/status
 // instead of the frozen values they were created with.
 const displayedSurveys = React.useMemo(() => {
   return surveys.map((survey) => {
     if (survey.uploadTaskId == null) return survey;
     const task = uploadTasks.find((t) => t.id === survey.uploadTaskId);
     if (!task) return survey;
     return {
       ...survey,
       progress: task.status === 'completed' ? 100 : task.progress,
       status: task.status === 'failed' ? 'Error' : task.status === 'completed' ? 'Finalizado' : 'Cargando',
       statusVariant: task.status === 'failed' ? 'negative' : task.status === 'completed' ? 'positive' : 'info',
     } satisfies SurveyListItem;
   });
 }, [surveys, uploadTasks]);


  const surveyTypes = [
    { title: "Clima", description: "Mide la percepción del ambiente laboral y bienestar.", icon: Sprout },
    { title: "Cultura", description: "Analiza valores y comportamientos compartidos.", icon: Heart },
    { title: "NPS", description: "Net Promoter Score: Mide la lealtad externa.", icon: Gauge },
  ];

 // Logic
 const filteredSurveys = React.useMemo(() => {
 if (!selectedType) return [];
 return surveys
 .filter(s => s.type === selectedType)
 .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
 }, [selectedType, searchQuery]);

 const comparativeOptions = React.useMemo(() => {
    let result = filteredSurveys.filter(s => s.status === "Finalizado");

    
    return [...result].sort((a, b) => {
      if (sortOrder === 'recent') return b.id.localeCompare(a.id, undefined, { numeric: true });
      if (sortOrder === 'oldest') return a.id.localeCompare(b.id, undefined, { numeric: true });
      if (sortOrder === 'name') return a.name.localeCompare(b.name);
      if (sortOrder === 'name-desc') return b.name.localeCompare(a.name);
      return 0;
    });
  }, [filteredSurveys, selectedBaseId, sortOrder]);

  const handleTypeSelect = (val: string) => {
    setSelectedType(val);
    
    // Find latest survey of this type as base
    const typeSurveys = surveys.filter(s => s.type === val && s.status === "Finalizado");
    
    const latest = [...typeSurveys].sort((a, b) => {
      // Robust sorting by year and quarter
      const getScore = (item: any) => {
        const yearMatch = item.name.match(/202\d/);
        const year = yearMatch ? parseInt(yearMatch[0]) : 0;
        
        const quarterMatch = item.name.match(/Q(\d)/);
        const quarter = quarterMatch ? parseInt(quarterMatch[1]) : 0;
        
        // Month fallback for Cultura surveys that might just have years
        const monthMap: Record<string, number> = { 'ene': 1, 'feb': 2, 'mar': 3, 'abr': 4, 'may': 5, 'jun': 6, 'jul': 7, 'ago': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dic': 12 };
        const monthStr = item.startDate?.split(' ')[1]?.toLowerCase();
        const month = monthMap[monthStr] || 0;

        return year * 1000 + quarter * 100 + month;
      };

      return getScore(b) - getScore(a);
    })[0];

    setSelectedBaseId(latest?.id || null);
    setSelectedComparativeIds([]);
    setSearchQuery("");
    // Automatic transition removed to allow manual "Next" button usage
  };

 const toggleComparative = (id: string) => {
 setSelectedComparativeIds(prev => {
 if (prev.includes(id)) return prev.filter(item => item !== id);
  if (prev.length < 5) return [...prev, id];

 return prev;
 });
 };

 const handleCreate = () => {
 if (onGenerateComparative && selectedBaseId && selectedType) {
 onGenerateComparative(selectedBaseId, selectedComparativeIds, selectedType);
 }
 setIsDrawerOpen(false);
 };

 return (
 <div className="flex flex-col h-full bg-surface rounded-xl border border-border/60 overflow-hidden shadow-sm">
 {/* Dashboard Header */}
 <div className="flex items-center justify-between px-8 py-6 border-b border-border/40 bg-surface">
 <div className="flex flex-col">
 <h2 className="text-xl font-bold text-text-primary tracking-tight">Lista de encuestas</h2>
 <span className="text-[11px] font-medium text-text-secondary/40 tracking-tight">{surveys.length} encuestas encontradas</span>
 </div>
 
 <div className="flex items-center gap-6">
 <div className="flex items-center gap-2 border-r border-border/40 pr-6">
 <Button variant="ghost" size="icon" className="h-10 w-10 text-text-secondary hover:bg-muted/50 rounded-full transition-all hover:scale-110"><Search className="h-5 w-5" /></Button>
 <input
 ref={uploadTriggerInputRef}
 type="file"
 accept=".csv,.xls,.xlsx,.pdf,.png,.jpg,.jpeg"
 multiple
 onChange={handleUploadTriggerFilesPicked}
 className="hidden"
 aria-hidden="true"
 />
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
      variant="ghost"
      size="icon"
      className="h-10 w-10 text-text-secondary hover:bg-muted/50 rounded-full transition-all hover:scale-110"
      onClick={handleOpenUploadDrawer}
      >
      <Upload className="h-5 w-5" />
      </Button>
    </TooltipTrigger>
    <TooltipContent side="top">
      <span>Cargar encuesta</span>
    </TooltipContent>
  </Tooltip>
 <Button variant="ghost" size="icon" className="h-10 w-10 text-text-secondary hover:bg-muted/50 rounded-full transition-all hover:scale-110"><RotateCw className="h-5 w-5" /></Button>
 <Button variant="ghost" size="icon" className="h-10 w-10 text-text-secondary hover:bg-muted/50 rounded-full transition-all hover:scale-110"><Filter className="h-5 w-5" /></Button>
 <Button variant="ghost" size="icon" className="h-10 w-10 text-text-secondary hover:bg-muted/50 rounded-full transition-all hover:scale-110"><LayoutGrid className="h-5 w-5" /></Button>
 </div>
 
 <Button 
 variant="outline" 
 className="h-10 px-5 gap-2.5 text-xs font-semibold rounded-xl hover:bg-primary/5 hover:border-primary/50 transition-all shadow-sm active:scale-95"
 onClick={() => setIsDrawerOpen(true)}
 >
 <BarChart3 className="h-4.5 w-4.5 text-primary" />
 <span>Comparar encuestas</span>
 </Button>
 
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button className="h-10 px-5 gap-2.5 text-xs font-semibold rounded-xl shadow-lg active:scale-95 group">
        <span>Crear encuesta</span>
        <ChevronDown className="h-4 w-4 opacity-50 group-data-[state=open]:rotate-180 transition-transform duration-200" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent 
      align="end" 
      sideOffset={8}
      className="w-72 p-2 rounded-2xl border border-border/40 shadow-2xl bg-white animate-in fade-in-0 zoom-in-95 z-[100]"
    >
      <DropdownMenuLabel className="px-3 py-2 text-[10px] font-bold text-text-secondary/40 uppercase tracking-widest">Opciones de creación</DropdownMenuLabel>
      <DropdownMenuSeparator className="bg-border/40 mx-1 my-1" />
      <DropdownMenuItem className="flex items-center gap-4 p-3 rounded-xl cursor-pointer focus:bg-brand/5 focus:text-brand transition-all group outline-none border border-transparent focus:border-brand/10">
        <div className="h-10 w-10 rounded-xl bg-muted/40 flex items-center justify-center group-focus:bg-white group-focus:shadow-sm transition-all border border-transparent group-focus:border-brand/10">
          <Plus className="h-5 w-5 text-text-secondary group-focus:text-brand" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[14px] font-bold tracking-tight">Crear en blanco</span>
          <span className="text-[11px] text-text-secondary/50 font-medium">Empieza desde cero</span>
        </div>
      </DropdownMenuItem>
      <DropdownMenuItem className="flex items-center gap-4 p-3 rounded-xl cursor-pointer focus:bg-brand/5 focus:text-brand transition-all group outline-none border border-transparent focus:border-brand/10">
        <div className="h-10 w-10 rounded-xl bg-muted/40 flex items-center justify-center group-focus:bg-white group-focus:shadow-sm transition-all border border-transparent group-focus:border-brand/10">
          <Layout className="h-5 w-5 text-text-secondary group-focus:text-brand" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[14px] font-bold tracking-tight">Crear con plantilla</span>
          <span className="text-[11px] text-text-secondary/50 font-medium">Usa un diseño predefinido</span>
        </div>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
 </div>
  </div>

  {/* Table Content */}
  <div className="flex-1 overflow-auto">
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent border-b border-border/40 bg-muted/20">
          <TableHead className="w-[40px] px-8"><Checkbox className="border-border/60" /></TableHead>
          <TableHead className="w-[30px] p-0"></TableHead>
          <TableHead className="text-[11px] font-bold text-text-secondary tracking-tight py-4">Nombre</TableHead>
          <TableHead className="text-[11px] font-bold text-text-secondary tracking-tight py-4">Origen</TableHead>
          <TableHead className="text-[11px] font-bold text-text-secondary tracking-tight py-4">Tipo</TableHead>
          <TableHead className="text-[11px] font-bold text-text-secondary tracking-tight py-4">Estado</TableHead>
          <TableHead className="text-[11px] font-bold text-text-secondary tracking-tight py-4">Inicio</TableHead>
          <TableHead className="text-[11px] font-bold text-text-secondary tracking-tight py-4">Cierre</TableHead>
          <TableHead className="text-[11px] font-bold text-text-secondary tracking-tight py-4 text-center">Part.</TableHead>
          <TableHead className="text-[11px] font-bold text-text-secondary tracking-tight py-4">Avance</TableHead>
          <TableHead className="w-[40px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {displayedSurveys.map((survey) => (
          <TableRow key={survey.id} className="border-b border-border/40 transition-all group">
            <TableCell className="px-8 py-4"><Checkbox className="border-border/60" /></TableCell>
            <TableCell className="p-0"><GripVertical className="h-4 w-4 text-text-secondary opacity-20 group-hover:opacity-50 transition-opacity cursor-grab" /></TableCell>
            <TableCell className="py-4 text-[12px] font-bold text-text-primary">{survey.name}</TableCell>
            <TableCell><SurveyOriginBadge origin={survey.origin} /></TableCell>
            <TableCell className="text-[11px] font-bold text-text-secondary/70">{survey.type}</TableCell>
            <TableCell>
              <Badge variant="outline" className={cn(
                "text-[10px] font-bold border-none px-2 py-0.5 rounded-full pointer-events-none",
                survey.statusVariant === "info" && "bg-info/10 text-info",
                survey.statusVariant === "positive" && "bg-status-positive-bg text-status-positive",
                survey.statusVariant === "warning" && "bg-status-warning-light/20 text-status-warning",
                survey.statusVariant === "negative" && "bg-destructive/10 text-destructive"
              )}>
                {survey.status}
              </Badge>
            </TableCell>
            <TableCell className="text-[11px] font-bold text-text-secondary/60">{survey.startDate}</TableCell>
            <TableCell className="text-[11px] font-bold text-text-secondary/60">{survey.endDate}</TableCell>
            <TableCell className="text-[11px] font-extrabold text-text-primary text-center">{survey.participants}</TableCell>
            <TableCell className="min-w-[140px]">
              <div className="flex items-center gap-3">
                <Progress value={survey.progress} className="h-1.5 flex-1 bg-muted" />
                <span className="text-[11px] font-bold text-text-primary min-w-[30px]">{survey.progress}%</span>
              </div>
            </TableCell>
            <TableCell><Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity rounded-full hover:bg-muted"><MoreVertical className="h-4 w-4 text-text-secondary" /></Button></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>

 {/* Pagination Footer */}
 <div className="px-8 py-4 flex items-center justify-between border-t border-border/60 bg-surface">
 <div className="text-[11px] font-bold text-text-secondary/60">Mostrando 1-8 de {surveys.length}</div>
 <div className="flex items-center gap-2">
 <Button variant="outline" size="icon" className="h-9 w-9 opacity-50 border-2 rounded-lg" disabled><ChevronLeft className="h-4 w-4" /></Button>
 <div className="flex items-center gap-1.5 px-2">
 <Button variant="outline" className="h-9 w-9 p-0 bg-primary/5 border-2 border-primary text-primary font-extrabold text-xs rounded-lg">1</Button>
 <Button variant="ghost" className="h-9 w-9 p-0 text-text-secondary/60 font-bold text-xs rounded-lg hover:bg-muted">2</Button>
 <Button variant="ghost" className="h-9 w-9 p-0 text-text-secondary/60 font-bold text-xs rounded-lg hover:bg-muted">3</Button>
 </div>
 <Button variant="outline" size="icon" className="h-9 w-9 border-2 rounded-lg"><ChevronRight className="h-4 w-4 text-text-primary" /></Button>
 </div>
 <div className="w-[120px]"></div>
  </div>

  {/* Comparison Wizard Drawer */}
  <DrawerShell
    open={isDrawerOpen}
    onOpenChange={(open) => {
      setIsDrawerOpen(open);
      if (!open) {
        setActiveStep(1);
        setSearchQuery("");
        setSelectedType(null);
        setSelectedBaseId(null);
        setSelectedComparativeIds([]);
      }
    }}
    title="Comparativo de encuestas"
    size="full"
    side="right"
    className="flex flex-col !w-[30vw] !max-w-[30vw] border-l shadow-drawer transition-all duration-500"
    disablePadding
  >
    <div className="flex flex-col h-full overflow-hidden bg-surface-subtle">
      <TooltipProvider delayDuration={400}>
        {/* Stepper Header */}
        <div className="px-6 py-6 bg-surface border-b border-border/40 shrink-0 relative z-20">
        <div className="flex items-center justify-between relative max-w-[320px] mx-auto">
          
          {/* Animated Progress Line (Green) */}
          <div className="absolute top-3.5 left-4 right-4 h-[1.5px] bg-status-positive/10 z-0" />
          <div 
            className="absolute top-3.5 left-4 right-4 h-[1.5px] bg-status-positive transition-all duration-700 ease-in-out z-0 origin-left" 
            style={{ 
              transform: `scaleX(${(activeStep - 1) / 2})`,
              boxShadow: '0 0 10px hsl(var(--color-positive-hsl) / 0.3)'
            }}
          />

          {[
            { id: 1, label: "Tipo" },
            { id: 2, label: "Comparar" },
            { id: 3, label: "Base" }
          ].map((item, idx) => {
            const stepNum = item.id;
            const isActive = stepNum === activeStep;
            const isCompleted = stepNum < activeStep;
            const isLocked = stepNum > activeStep;
            
            return (
              <div key={idx} className="flex flex-col items-center relative z-10">
                {/* Circle Indicator */}
                <div className={cn(
                  "h-7 w-7 rounded-full flex items-center justify-center transition-all duration-500 border-[1.5px] font-bold text-[11px] relative z-10",
                  isCompleted 
                    ? "bg-surface border-status-positive text-status-positive shadow-sm" 
                    : isActive 
                      ? "bg-primary border-primary text-text-inverse shadow-sm" 
                      : "bg-surface-muted border-border-strong/30 text-text-secondary"
                )}>
                  {/* Tint overlay for completed */}
                  {isCompleted && (
                    <div className="absolute inset-0 bg-status-positive/5 rounded-full" />
                  )}
                  
                  {/* Pulse effect for active */}
                  {isActive && (
                    <div className="absolute inset-[-3px] rounded-full border border-primary/20 animate-pulse" />
                  )}
                  
                  <div className="relative z-10 flex items-center justify-center">
                    {isCompleted ? (
                      <Check className="h-3 w-3" strokeWidth={4} />
                    ) : isLocked ? (
                      <Lock className="h-3 w-3 opacity-30" />
                    ) : (
                      <span>{stepNum}</span>
                    )}
                  </div>
                </div>

                {/* Label Below */}
                <div className="absolute top-8 flex flex-col items-center w-24">
                  <span className={cn(
                    "text-[10px] font-bold tracking-tight text-center transition-colors duration-500",
                    isActive ? "text-primary" : isCompleted ? "text-status-positive" : "text-text-secondary/40"
                  )}>
                    {item.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>


      <div className="flex-1 min-h-0 overflow-hidden relative flex flex-col">
        {/* Step 1: Type */}
        {activeStep === 1 && (
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
            <div className="p-5 pb-3 text-center space-y-1">
              <h3 className="text-base font-bold text-text-primary tracking-tight leading-tight">Tipo de encuesta</h3>
              <p className="text-[11px] text-text-secondary/60 font-medium px-10 leading-relaxed">
                Selecciona el tipo de encuestas que deseas comparar.
              </p>
            </div>

            <ScrollArea className="flex-1 min-h-0">
              <div className="px-6 pb-6">
                {surveyTypes.map((type) => (
                  <TypeCard
                    key={type.title}
                    title={type.title}
                    description={type.description}
                    icon={type.icon}
                    selected={selectedType === type.title}
                    onSelect={handleTypeSelect}
                  />
                ))}
              </div>
            </ScrollArea>

            {/* Footer for Step 1 */}
            <div className="px-5 py-4 bg-surface border-t border-border/40 shadow-[0_-10px_20px_rgba(0,0,0,0.03)] shrink-0 z-20">
              <Button 
                onClick={() => setActiveStep(2)}
                disabled={!selectedType}
                className="w-full gap-3 transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-30 disabled:grayscale group/btn h-11 text-xs font-bold tracking-tight shadow-lg shadow-primary/20 rounded-xl"
              >
                <span>Siguiente</span>
                <ChevronRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Comparative Selection */}
        {activeStep === 2 && (
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden animate-in fade-in slide-in-from-right-10 duration-700">
            <div className="p-5 pb-3 space-y-3 shrink-0">
              <div className="flex items-center justify-between mb-0">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setActiveStep(1);
                    setSelectedComparativeIds([]);
                  }}
                  className="gap-2 text-primary font-bold tracking-tight text-[10px] h-8 px-3 rounded-full bg-primary/5 hover:bg-primary/10 transition-all"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Volver</span>
                </Button>
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] font-bold px-3 py-1 rounded-full pointer-events-none transition-all duration-300">
                  {selectedComparativeIds.length} Seleccionadas
                </Badge>
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-base font-bold text-text-primary tracking-tight leading-tight">Encuestas para comparar</h3>
                <p className="text-[11px] text-text-secondary/60 font-medium px-10 leading-relaxed">
                  Elige hasta 5 encuestas para comparar resultados y analizar tendencias.
                </p>
              </div>


              
              <div className="flex gap-2">
                <div className="relative group flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-secondary/30 group-focus-within:text-primary transition-all duration-300 z-10" />
                  <Input
                    type="text"
                    placeholder="Filtrar encuestas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-10 text-[11px] font-bold bg-surface border-border/40"
                  />
                </div>
                
                <div className="flex items-center p-1 bg-surface-subtle rounded-xl border border-border/20">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8 px-3 gap-2 text-[10px] font-bold tracking-tight rounded-lg transition-all bg-surface border-border/10 text-text-secondary hover:bg-surface-muted shrink-0"
                      >
                        <ArrowUpDown className="h-3 w-3" />
                        <span>{sortOrder === 'recent' ? 'Recientes' : sortOrder === 'oldest' ? 'Antiguas' : 'Nombre'}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 bg-surface border border-border/40 shadow-drawer rounded-lg p-1.5">
                      <DropdownMenuLabel className="text-[10px] font-bold tracking-tight text-text-secondary/40 px-2 py-1.5">Ordenar por</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-border/10" />
                        <DropdownMenuRadioGroup value={sortOrder} onValueChange={(val) => setSortOrder(val as any)}>
                          <DropdownMenuRadioItem value="recent" className="text-[11px] font-bold tracking-tight p-2.5 rounded-md focus:bg-brand/5 focus:text-brand cursor-pointer">
                            Más recientes
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="oldest" className="text-[11px] font-bold tracking-tight p-2.5 rounded-md focus:bg-brand/5 focus:text-brand cursor-pointer">
                            Más antiguas
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="name" className="text-[11px] font-bold tracking-tight p-2.5 rounded-md focus:bg-brand/5 focus:text-brand cursor-pointer">
                            Nombre (A-Z)
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="name-desc" className="text-[11px] font-bold tracking-tight p-2.5 rounded-md focus:bg-brand/5 focus:text-brand cursor-pointer">
                            Nombre (Z-A)
                          </DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1 min-h-0">
              <div className="px-6 pb-6 space-y-2">
                {comparativeOptions.length > 0 ? (
                  comparativeOptions.map((survey) => (
                    <SurveySelectionItem
                      key={survey.id}
                      survey={survey}
                      selected={selectedComparativeIds.includes(survey.id)}
                      onSelect={toggleComparative}
                      isComparative
                    />
                  ))
                ) : (
                  <EmptyState 
                    title="No hay más encuestas"
                    description={`No se encontraron otras encuestas de tipo ${selectedType} para comparar.`}
                    icon={Search}
                    className="border-none bg-transparent py-10"
                  />
                )}
              </div>
            </ScrollArea>

            {/* Footer for Step 2 */}
            <div className="px-5 py-4 bg-surface border-t border-border/40 shadow-[0_-10px_20px_rgba(0,0,0,0.03)] shrink-0 z-20">
              <Button 
                onClick={() => {
                  const selectedOnes = surveys.filter(s => selectedComparativeIds.includes(s.id));
                  
                  // Use robust sorting to find the latest among selected ones
                  const getScore = (item: any) => {
                    const yearMatch = item.name.match(/202\d/);
                    const year = yearMatch ? parseInt(yearMatch[0]) : 0;
                    
                    const quarterMatch = item.name.match(/Q(\d)/);
                    const quarter = quarterMatch ? parseInt(quarterMatch[1]) : 0;
                    
                    const monthMap: Record<string, number> = { 'ene': 1, 'feb': 2, 'mar': 3, 'abr': 4, 'may': 5, 'jun': 6, 'jul': 7, 'ago': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dic': 12 };
                    const monthStr = item.startDate?.split(' ')[1]?.toLowerCase();
                    const month = monthMap[monthStr] || 0;

                    return year * 1000 + quarter * 100 + month;
                  };

                  const latestSelected = [...selectedOnes].sort((a, b) => getScore(b) - getScore(a))[0];
                  
                  // Always pre-select the latest one from the current selection if none is selected or if it's not in the selection
                  const currentBaseStillInSelection = selectedBaseId && selectedComparativeIds.includes(selectedBaseId);
                  if (!currentBaseStillInSelection) {
                    setSelectedBaseId(latestSelected?.id || null);
                  }

                  setActiveStep(3);
                }}
                disabled={selectedComparativeIds.length === 0}
                className="w-full gap-3 transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-30 disabled:grayscale group/btn h-11 text-xs font-bold tracking-tight shadow-lg shadow-primary/20 rounded-xl"
              >
                <span>Siguiente</span>
                <ChevronRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
              </Button>
            </div>
        </div>
      )}

        {/* Step 3: Base Survey Selection */}
        {activeStep === 3 && (
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden animate-in fade-in slide-in-from-right-10 duration-700">
            <div className="p-5 pb-3 space-y-3 shrink-0">
              <div className="flex items-center justify-between mb-0">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setActiveStep(2)}
                  className="gap-2 text-primary font-bold tracking-tight text-[10px] h-8 px-3 rounded-full bg-primary/5 hover:bg-primary/10 transition-all"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Volver</span>
                </Button>

              </div>

              <div className="text-center space-y-1">
                <h3 className="text-base font-bold text-text-primary tracking-tight leading-tight">Encuesta base</h3>
                <p className="text-[11px] text-text-secondary/60 font-medium px-10 leading-relaxed">
                  De tu selección anterior, elige cuál será la encuesta base para comparar contra las demás.
                </p>
              </div>
            </div>

            <ScrollArea className="flex-1 min-h-0">
              <div className="px-6 pb-6 space-y-2">
                {surveys
                  .filter(s => selectedComparativeIds.includes(s.id))
                  .map((survey) => (
                    <SurveySelectionItem
                      key={survey.id}
                      survey={survey}
                      selected={selectedBaseId === survey.id}
                      onSelect={(id) => setSelectedBaseId(id)}
                    />
                  ))
                }
              </div>
            </ScrollArea>

            {/* Footer for Step 3 */}
            <div className="px-5 py-4 bg-surface border-t border-border/40 shadow-[0_-10px_20px_rgba(0,0,0,0.03)] shrink-0 z-20">
              <Button 
                onClick={handleCreate}
                disabled={!selectedBaseId}
                className="w-full gap-3 transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-30 disabled:grayscale group/btn h-11 text-xs font-bold tracking-tight shadow-lg shadow-primary/20 rounded-xl"
              >
                <BarChart3 className="h-4.5 w-4.5 transition-transform group-hover/btn:scale-110" />
                <span>Generar comparativo</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  </div>
</DrawerShell>

{/* Upload Surveys Drawer */}
<DrawerShell
  open={isUploadDrawerOpen}
  onOpenChange={(open) => {
    setIsUploadDrawerOpen(open);
    // While a load is in flight (or just finished and still showing in the
    // tray), closing the drawer only minimizes it — the wizard state is kept
    // so reopening lands back on the loading/completed view, not a blank form.
    if (!open && !showUploadTray) resetUploadDrawer();
  }}
  title={
    uploadStep === 'dropzone' ? "Cargar encuestas"
    : uploadStep === 'loading' ? "Cargando encuesta"
    : uploadStep === 'next-action' ? "Carga iniciada"
    : uploadStep === 'error' ? "No pudimos continuar"
    : uploadStep === 'empty' ? "No encontramos información"
    : uploadStep === 'select' ? "Selecciona la encuesta"
    : uploadStep === 'general' ? "Confirma los datos generales"
    : "Estructura"
  }
  description={
    uploadStep === 'dropzone' ? "Sube nuevos archivos o revisa tus cargas recientes."
    : uploadStep === 'loading' ? "Estamos guardando la información de tu encuesta."
    : uploadStep === 'next-action' ? "Tu encuesta se está cargando en segundo plano. Elige cómo quieres continuar."
    : uploadStep === 'error' ? "Revisa el archivo e inténtalo de nuevo."
    : uploadStep === 'empty' ? "No pudimos detectar datos de encuesta en este archivo."
    : uploadStep === 'select' ? "Detectamos varias encuestas en tus archivos. Elige cuál quieres cargar."
    : uploadStep === 'general' ? "Verifica los datos que identificamos y ajústalos si lo necesitas."
    : "Revisa la información que encontramos antes de cargar la encuesta."
  }
  side="right"
  size="md"
  className="!w-[40vw] !max-w-[40vw] border-l shadow-drawer transition-all duration-500"
  footer={
    <>
      {/* The "Cargas" tab is a read-only list — no wizard footer there. */}
      {!(uploadStep === 'dropzone' && uploadTab === 'cargas') && (
      <div className="px-5 py-4 bg-background border-t border-border/40 shadow-[0_-10px_20px_rgba(0,0,0,0.03)] shrink-0 z-20 flex items-center gap-2">
        {uploadStep === 'loading' ? (
          // Loading more is handled by the "Nueva carga" tab now, so the footer
          // only needs the minimize action while a load runs in the background.
          <Button
            onClick={() => setIsUploadDrawerOpen(false)}
            className="w-full gap-2.5 h-11 text-xs font-bold tracking-tight shadow-lg shadow-primary/20 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.98]"
          >
            <span>Minimizar y continuar</span>
          </Button>
        ) : uploadStep === 'next-action' ? (
          // The ways forward are the cards in the body, so the footer stays
          // secondary: leave the panel and let the load finish in the tray.
          <Button
            variant="outline"
            onClick={() => setIsUploadDrawerOpen(false)}
            className="w-full h-11 text-xs font-bold tracking-tight rounded-xl"
          >
            Cerrar por ahora
          </Button>
        ) : (
        <>
        <Button
          type="button"
          variant="outline"
          className="flex-1 h-11 text-xs font-bold tracking-tight rounded-xl"
          onClick={() => setIsUploadDrawerOpen(false)}
        >
          Cancelar
        </Button>

        {uploadStep === 'dropzone' && (
          <Button
            className="flex-1 gap-2.5 h-11 text-xs font-bold tracking-tight shadow-lg shadow-primary/20 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-30 disabled:grayscale"
            disabled={uploadFiles.length === 0}
            onClick={handleAnalyzeFiles}
          >
            <Sparkles className="h-4 w-4" />
            <span>Analizar archivos {uploadFiles.length > 0 ? `(${uploadFiles.length})` : ""}</span>
          </Button>
        )}

        {uploadStep === 'select' && (
          <Button
            disabled={!selectedGroupKey || loadedGroupKeys.includes(selectedGroupKey)}
            onClick={handleAnalyzeSelectedSurvey}
            className="flex-1 gap-2.5 h-11 text-xs font-bold tracking-tight shadow-lg shadow-primary/20 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-30 disabled:grayscale"
          >
            <Sparkles className="h-4 w-4" />
            <span>Analizar encuesta</span>
          </Button>
        )}

        {uploadStep === 'general' && (
          <Button
            disabled={!canProceedFromGeneral}
            onClick={handleGeneralNext}
            className="flex-1 gap-2.5 h-11 text-xs font-bold tracking-tight shadow-lg shadow-primary/20 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-30 disabled:grayscale"
          >
            <span>Siguiente</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}

        {(uploadStep === 'error' || uploadStep === 'empty') && (
          <Button
            onClick={() => {
              setAnalyzeError(null);
              setUploadFiles([]);
              setUploadStep('dropzone');
            }}
            className="flex-1 gap-2.5 h-11 text-xs font-bold tracking-tight shadow-lg shadow-primary/20 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.98]"
          >
            <Upload className="h-4 w-4" />
            <span>{uploadStep === 'empty' ? 'Subir otra encuesta' : 'Subir otro archivo'}</span>
          </Button>
        )}

        {uploadStep === 'summary' && (
          <Button
            onClick={handleFinalizeSurveyUpload}
            className="flex-1 gap-2.5 h-11 text-xs font-bold tracking-tight shadow-lg shadow-primary/20 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.98]"
          >
            <Upload className="h-4 w-4" />
            <span>Cargar encuesta</span>
          </Button>
        )}
        </>
        )}
      </div>
      )}

      {/* AI Analysis Overlay — confined to this side panel, not the full viewport */}
      {isAnalyzingFiles && (() => {
        const copy = getAnalyzingCopy(
          analyzingPurpose,
          analyzeProgress,
          uploadFiles.length,
          selectedReviewItem ? { name: selectedReviewItem.name, analysis: selectedReviewItem.analysis } : null
        );

        return (
        // Inverted, lighter loader: fills the whole panel respecting the drawer's
        // p-4 margins, but the gradient + shimmer live on the BORDER only while
        // the fill stays on the panel background. The `bg-ai-gradient` ring with
        // `shimmer-mirror` shows the sweep along the 2px edge; the inner card
        // (relative z-10) sits on top so the sweep never washes over the content.
        <div className="absolute inset-4 z-[60] rounded-3xl bg-ai-gradient p-[2px] shimmer-mirror shadow-sm animate-in fade-in duration-300 select-none">
          <div className="relative z-10 h-full w-full rounded-[22px] bg-background flex flex-col items-center justify-center text-center px-10">
            {/* Pulsing UBITS AI Icon — tinted with the gradient */}
            <div className="relative w-16 h-16 flex items-center justify-center mb-3">
              <div className="absolute w-11 h-11 rounded-full bg-ai-gradient opacity-20 blur-xl animate-pulse" />
              <svg width="42" height="42" viewBox="0 0 24 24" className="relative">
                <defs>
                  <linearGradient id="aiLoaderIconGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--ai-gradient-start))" />
                    <stop offset="100%" stopColor="hsl(var(--ai-gradient-end))" />
                  </linearGradient>
                </defs>
                <path
                  d="M12,3 Q12,12 3,12 Q12,12 12,21 Q12,12 21,12 Q12,12 12,3 Z"
                  fill="none"
                  stroke="url(#aiLoaderIconGrad)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="animate-[pulse_1.8s_infinite_ease-in-out]"
                />
                <path
                  d="M19,5 Q19,7 17,7 Q19,7 19,9 Q19,7 21,7 Q19,7 19,5 Z"
                  fill="url(#aiLoaderIconGrad)"
                  className="animate-[pulse_1.3s_infinite_ease-in-out] [animation-delay:0.3s]"
                />
                <circle
                  cx="5.5"
                  cy="18.5"
                  r="1.75"
                  fill="url(#aiLoaderIconGrad)"
                  className="animate-[pulse_1.5s_infinite_ease-in-out] [animation-delay:0.6s]"
                />
              </svg>
            </div>

            <h3 className="text-lg font-bold tracking-tight mb-1 text-ai-gradient">
              {copy.title}
            </h3>

            <div className="w-full max-w-[300px] mt-6 space-y-2.5">
              <div className="flex justify-between text-xs text-text-secondary font-bold px-1">
                <span>{copy.status}</span>
                <span className="text-ai-gradient">{analyzeProgress}%</span>
              </div>

              {/* Gradient progress bar on a light track */}
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden relative">
                <div
                  className="h-full bg-ai-gradient rounded-full transition-all duration-300"
                  style={{ width: `${analyzeProgress}%` }}
                />
              </div>
            </div>

            <p className="text-xs text-text-secondary/60 mt-6 max-w-[300px]">
              {copy.footer}
            </p>
          </div>
        </div>
        );
      })()}
    </>
  }
>
  {/* Browse shell (dropzone + recent loads) — kept tabbed on entry AND while a
       load runs, so the user can start another upload from the loads list. */}
  {(uploadStep === 'dropzone' || uploadStep === 'loading') && (
    <Tabs
      value={uploadTab}
      onValueChange={(value) => {
        const next = value as 'nueva' | 'cargas';
        setUploadTab(next);
        // Switching to "Nueva carga" while a load is in flight leaves the loads
        // list and returns to the dropzone; the load keeps running in the tray.
        if (next === 'nueva' && uploadStep === 'loading') setUploadStep('dropzone');
      }}
      className="flex flex-col flex-1 min-h-0"
    >
      {/* Fixed segmented control — only the tab content below it scrolls. */}
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
          {/* Explanatory note above the dropzone — text with the detected items as compact chips. */}
          <div className="rounded-xl border border-border/40 bg-surface-subtle/60 p-4 space-y-2.5">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-text-secondary/80 leading-relaxed">
                Solo puedes cargar encuestas de tipo{" "}
                <span className="font-bold text-text-primary">Clima</span>,{" "}
                <span className="font-bold text-text-primary">Cultura</span> o{" "}
                <span className="font-bold text-text-primary">NPS</span>, y solo puedes cargar{" "}
                <span className="font-bold text-text-primary">una encuesta a la vez</span>. Analizaremos tus archivos
                y detectaremos automáticamente su estructura:
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 pl-6">
              {["Participación", "Favorabilidad", "eNPS", "Secciones", "Preguntas", "Demográficos"].map((label) => (
                <span
                  key={label}
                  className="px-2.5 py-1 rounded-md bg-surface-muted text-[11px] font-semibold text-text-secondary"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          <UploadZone
            value={uploadFiles}
            onChange={setUploadFiles}
            accept=".csv,.xls,.xlsx,.pdf,.png,.jpg,.jpeg"
            multiple
            maxSizeMB={10}
            validate={getImmediateValidationError}
            idleText="Arrastra tus archivos aquí o haz clic para buscar"
            description="Formatos soportados: Excel, CSV, PDF e imágenes (máx. 10MB)"
            className="[&>div:first-of-type]:min-h-[200px]"
          />
        </div>
      </TabsContent>

      <TabsContent value="cargas" className="flex-1 min-h-0 overflow-y-auto mt-0 focus-visible:outline-none">
        {/* Surveys from the last batch that haven't been loaded yet stay one
             click away — the loads list is otherwise a dead end for them. */}
        {pendingReviewItems.length > 0 && (
          <div className="mb-4 rounded-2xl border border-primary/30 bg-primary/5 p-3.5 flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Upload className="h-4 w-4" strokeWidth={2.25} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold text-text-primary tracking-tight">
                {pendingReviewItems.length === 1
                  ? '1 encuesta pendiente'
                  : `${pendingReviewItems.length} encuestas pendientes`}
              </p>
              <p className="text-[11px] text-text-secondary/60 font-medium truncate">
                {pendingReviewItems.length === 1
                  ? pendingReviewItems[0].name
                  : 'De los archivos que subiste'}
              </p>
            </div>
            <Button
              size="sm"
              onClick={handleLoadPendingSurvey}
              className="h-8 px-3 text-[11px] font-bold tracking-tight rounded-lg shrink-0"
            >
              Continuar
            </Button>
          </div>
        )}

        <RecentUploadsList
          activeTasks={uploadTasks}
          recentUploads={RECENT_UPLOADS}
          onViewSurvey={handleViewLoadedSurvey}
          onRetry={retryUpload}
        />
      </TabsContent>
    </Tabs>
  )}

  {/* Post-load hub: a load is running and the batch still has surveys pending.
       Only one survey loads at a time, so this is where the user decides whether
       to continue with the batch, watch the running load, or start over. */}
  {uploadStep === 'next-action' && (() => {
    const nextPending = pendingReviewItems[0];
    // The load that was just started — shown inline with live progress so the
    // user doesn't need a separate "ver el estado" step to follow it.
    const currentTask = [...uploadTasks].sort((a, b) => b.id - a.id)[0];

    return (
      <div className="flex flex-col flex-1 gap-5">
        {currentTask && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-bold text-text-primary tracking-tight">
                {currentTask.status === 'loading' ? 'Carga en curso' : 'Última carga'}
              </h3>
              {currentTask.status === 'loading' && (
                <span className="px-2 py-1 bg-primary/5 text-primary rounded text-[10px] font-bold uppercase tracking-wide">
                  En segundo plano
                </span>
              )}
            </div>

            <UploadTaskCard
              task={currentTask}
              showCompletedCheck
              onViewSurvey={handleViewLoadedSurvey}
              onRetry={retryUpload}
            />
          </div>
        )}

        <div className="space-y-1">
          <h3 className="text-base font-bold text-text-primary tracking-tight leading-tight">
            ¿Qué quieres hacer ahora?
          </h3>
          <p className="text-[11px] text-text-secondary/60 font-medium leading-relaxed">
            {pendingReviewItems.length === 1
              ? 'Todavía tienes una encuesta pendiente de los archivos que subiste. Se carga una a la vez.'
              : `Todavía tienes ${pendingReviewItems.length} encuestas pendientes de los archivos que subiste. Se carga una a la vez.`}
          </p>
        </div>

        <div className="space-y-2.5">
          {nextPending && (
            <NextActionCard
              icon={Upload}
              emphasis
              title={
                pendingReviewItems.length === 1
                  ? `Cargar "${nextPending.name}"`
                  : `Cargar otra encuesta (${pendingReviewItems.length} pendientes)`
              }
              description={
                pendingReviewItems.length === 1
                  ? `${nextPending.fileNames.length} archivo${nextPending.fileNames.length > 1 ? 's' : ''} · continúa con los datos generales`
                  : 'Elige cuál de las encuestas pendientes quieres cargar ahora'
              }
              onClick={handleLoadPendingSurvey}
            />
          )}

          <NextActionCard
            icon={Plus}
            title="Cargar una nueva encuesta"
            description="Empieza de cero con otros archivos. Se descartan las encuestas pendientes"
            onClick={handleStartNewUpload}
          />
        </div>
      </div>
    );
  })()}

  {/* Blocking error: file could not be read / too large / failed to process */}
  {uploadStep === 'error' && (
    <div className="flex flex-col items-center justify-center flex-1 text-center px-8 py-12 gap-4">
      <div className="h-14 w-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
        <AlertTriangle className="h-7 w-7" strokeWidth={2.25} />
      </div>
      <div className="space-y-1.5 max-w-sm">
        <h3 className="text-base font-bold text-text-primary tracking-tight">
          {analyzeError?.title ?? 'No pudimos procesar el archivo'}
        </h3>
        <p className="text-[13px] text-text-secondary/70 font-medium leading-relaxed">
          {analyzeError?.detail ?? 'Revisa que el archivo sea un reporte válido e inténtalo de nuevo.'}
        </p>
      </div>
    </div>
  )}

  {/* Recognized file, but nothing usable inside — invite trying another survey */}
  {uploadStep === 'empty' && (
    <div className="flex flex-col items-center justify-center flex-1 text-center px-8 py-12 gap-4">
      <div className="h-16 w-16 rounded-2xl bg-surface-muted text-text-secondary/60 flex items-center justify-center">
        <FileSearch className="h-8 w-8" strokeWidth={1.75} />
      </div>
      <div className="space-y-1.5 max-w-sm">
        <h3 className="text-base font-bold text-text-primary tracking-tight">
          No encontramos datos de encuesta
        </h3>
        <p className="text-[13px] text-text-secondary/70 font-medium leading-relaxed">
          No detectamos indicadores, secciones ni preguntas en este archivo. Asegúrate de subir un reporte de Clima, Cultura o NPS, y prueba con otra encuesta.
        </p>
      </div>
    </div>
  )}

  {/* Review wizard: pick the detected survey, confirm its general data, then review a summary before loading it */}
  {(uploadStep === 'select' || uploadStep === 'general' || uploadStep === 'summary') && (
    <div className="flex flex-col flex-1 -m-4">
      <div className="flex-1 px-4 pb-4 pt-4 space-y-4">
        {(uploadStep === 'select' || uploadStep === 'general' || uploadStep === 'summary') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReviewBack}
            className="gap-2 text-primary font-bold tracking-tight text-[10px] h-8 px-3 rounded-full bg-primary/5 hover:bg-primary/10 transition-all w-fit"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>{reviewBackLabel}</span>
          </Button>
        )}

        {/* Excluded files — shown on every review step, not only when several surveys were detected */}
        {importWarnings.length > 0 && (
          <Alert variant="warning">
            <Info className="h-4 w-4" />
            <AlertTitle className="text-xs font-bold">Algunos archivos fueron excluidos</AlertTitle>
            <AlertDescription className="text-[11px] space-y-1">
              {importWarnings.map((warning) => (
                <div key={warning.fileName}>
                  <span className="font-bold">{warning.fileName}</span>: {warning.reason}
                </div>
              ))}
            </AlertDescription>
          </Alert>
        )}

        {/* Simulated extraction (from a PDF/image) — honest disclosure that the structure is estimated */}
        {isSimulated && (uploadStep === 'general' || uploadStep === 'summary') && (
          <Alert variant="info">
            <Sparkles className="h-4 w-4" />
            <AlertTitle className="text-xs font-bold">Estructura estimada (simulada)</AlertTitle>
            <AlertDescription className="text-[11px]">
              Extrajimos esta estructura a partir de un PDF/imagen. Revisa con atención los datos, secciones y preguntas antes de cargar.
            </AlertDescription>
          </Alert>
        )}

        {/* Step 1: choose which detected survey to load — only one can be loaded at a time */}
        {uploadStep === 'select' && (
          <div className="space-y-3">
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-text-primary tracking-tight leading-tight">
                {loadedGroupKeys.length > 0
                  ? `Te ${pendingReviewItems.length === 1 ? 'queda 1 encuesta' : `quedan ${pendingReviewItems.length} encuestas`} por cargar`
                  : reviewItems.length > 1
                    ? `Detectamos ${reviewItems.length} encuestas`
                    : "Encuesta detectada"}
              </h3>
              <p className="text-[11px] text-text-secondary/60 font-medium px-4 leading-relaxed">
                Elige la encuesta que quieres cargar. Solo puedes cargar una a la vez.
              </p>
            </div>

            {reviewItems.length === 0 ? (
              <EmptyState
                title="No se detectó ninguna encuesta"
                description="No pudimos reconocer el formato de los archivos que subiste."
                icon={Info}
                className="border-none bg-transparent py-10"
              />
            ) : (
              reviewItems.map((item) => {
                // Already-loaded surveys stay listed for context but can't be
                // picked again — one load per survey, and it's already running.
                const isLoaded = loadedGroupKeys.includes(item.groupKey);
                const isSelected = !isLoaded && item.groupKey === selectedGroupKey;
                return (
                  <div
                    key={item.groupKey}
                    onClick={() => !isLoaded && setSelectedGroupKey(item.groupKey)}
                    aria-disabled={isLoaded}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border transition-all",
                      isLoaded
                        ? "cursor-not-allowed border-border/30 bg-surface-muted/40"
                        : isSelected
                          ? "cursor-pointer border-primary bg-surface shadow-sm"
                          : "cursor-pointer border-border/40 bg-surface hover:border-border-strong/30"
                    )}
                  >
                    <div className={cn(
                      "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
                      isLoaded ? "bg-status-positive/10 text-status-positive" : "bg-surface-muted text-text-secondary/50"
                    )}>
                      {isLoaded ? <Check className="h-4 w-4" strokeWidth={3} /> : <FileText className="h-4 w-4" strokeWidth={2} />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm font-bold truncate",
                        isLoaded ? "text-text-secondary/50" : "text-text-primary"
                      )}>
                        {item.name}
                      </p>
                      <p className="text-[10px] text-text-secondary/50 font-medium truncate">
                        {isLoaded
                          ? "Ya la cargaste"
                          : `${item.fileNames.length} archivo${item.fileNames.length > 1 ? "s" : ""}`}
                      </p>
                    </div>

                    {!isLoaded && (
                      <div className={cn(
                        "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                        isSelected ? "border-primary" : "border-border-strong/40"
                      )}>
                        {isSelected && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Step 2: confirm the pre-filled general data, editable if needed */}
        {uploadStep === 'general' && selectedReviewItem && (
          <div className="space-y-3">
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-text-primary tracking-tight leading-tight">Datos generales</h3>
              <p className="text-[11px] text-text-secondary/60 font-medium px-4 leading-relaxed">
                Verifica la información que identificamos. Puedes editarla si lo necesitas.
              </p>
            </div>

            <div className="rounded-xl border border-border/40 bg-surface p-4 space-y-4">
              <Field label="Nombre de la encuesta" required>
                <Input
                  value={selectedReviewItem.name}
                  onChange={(e) => {
                    setNameErrorShown(false);
                    updateReviewItem(selectedReviewItem.groupKey, { name: e.target.value });
                  }}
                  aria-invalid={nameErrorShown && !!duplicateExisting}
                  className={cn((nameErrorShown && duplicateExisting) && "!border-destructive ring-2 ring-destructive/40 focus-visible:!border-destructive")}
                />
                {nameErrorShown && duplicateExisting && (
                  <p className="text-[13px] font-medium text-destructive mt-1.5">
                    Ya existe una encuesta llamada "{duplicateExisting}". Usa otro nombre para continuar.
                  </p>
                )}
              </Field>

              <Field label="Tipo de encuesta" required>
                <RadioGroup
                  value={selectedReviewItem.type}
                  onValueChange={(value) => updateReviewItem(selectedReviewItem.groupKey, { type: value as SurveyTypeOption })}
                  className="grid grid-cols-3 gap-3"
                >
                  {SURVEY_TYPE_OPTIONS.map((option) => (
                    <label
                      key={option}
                      className={cn(
                        "flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all text-xs font-bold",
                        selectedReviewItem.type === option
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border/40 text-text-primary"
                      )}
                    >
                      <RadioGroupItem value={option} />
                      <span>{option}</span>
                    </label>
                  ))}
                </RadioGroup>
              </Field>

              <Field label="Visibilidad de la encuesta" required>
                <RadioGroup
                  value={selectedReviewItem.visibility}
                  onValueChange={(value) => updateReviewItem(selectedReviewItem.groupKey, { visibility: value as 'publica' | 'anonima' })}
                  className="grid grid-cols-2 gap-3"
                >
                  <label
                    aria-disabled={publicBlock != null}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-xs font-bold",
                      publicBlock != null
                        ? "cursor-not-allowed border-border/30 bg-surface-muted/40 text-text-secondary/40"
                        : selectedReviewItem.visibility === 'publica'
                          ? "cursor-pointer border-primary bg-primary/5 text-primary"
                          : "cursor-pointer border-border/40 text-text-primary"
                    )}
                  >
                    <RadioGroupItem value="publica" disabled={publicBlock != null} />
                    <span>Pública</span>
                  </label>
                  <label
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all text-xs font-bold",
                      selectedReviewItem.visibility === 'anonima' ? "border-primary bg-primary/5 text-primary" : "border-border/40 text-text-primary"
                    )}
                  >
                    <RadioGroupItem value="anonima" />
                    <span>Anónima</span>
                  </label>
                </RadioGroup>

                {publicBlock != null && (
                  <div className="flex items-start gap-1.5 rounded-lg bg-surface-muted/60 px-2.5 py-2 mt-2">
                    <Lock className="h-3.5 w-3.5 shrink-0 text-text-secondary/50 mt-px" strokeWidth={2.25} />
                    <p className="text-[11px] text-text-secondary/70 font-medium leading-snug">
                      {PUBLIC_VISIBILITY_BLOCK_MESSAGE[publicBlock]}
                    </p>
                  </div>
                )}
              </Field>

              {selectedReviewItem.visibility === 'anonima' && (
                <Field
                  label="Umbral de anonimato"
                  description="Número mínimo de respuestas requeridas para mostrar resultados de un grupo."
                >
                  <Input
                    type="number"
                    min={1}
                    value={selectedReviewItem.anonymityThreshold}
                    onChange={(e) => updateReviewItem(selectedReviewItem.groupKey, { anonymityThreshold: e.target.value })}
                  />
                  {!isAnonymityValid && (
                    <p className="text-[11px] text-destructive font-medium mt-1">
                      Ingresa un número entero mayor o igual a 1.
                    </p>
                  )}
                </Field>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Field label="Fecha de inicio" required>
                  <DatePicker
                    value={selectedReviewItem.startDate}
                    onChange={(date) => updateReviewItem(selectedReviewItem.groupKey, { startDate: date })}
                    placeholder="Selecciona fecha"
                  />
                </Field>
                <Field label="Fecha de cierre" required>
                  <DatePicker
                    value={selectedReviewItem.endDate}
                    onChange={(date) => updateReviewItem(selectedReviewItem.groupKey, { endDate: date })}
                    placeholder="Selecciona fecha"
                    minDate={selectedReviewItem.startDate}
                  />
                </Field>
              </div>
              {!isDateRangeValid && (
                <p className="text-[11px] text-destructive font-medium">
                  La fecha de cierre no puede ser anterior a la de inicio.
                </p>
              )}

              {selectedGroupKey === 'unknown-year' && (
                <p className="text-[11px] text-text-secondary/60 font-medium">
                  No detectamos el año de la encuesta en el archivo. Revisa el nombre y las fechas antes de continuar.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Step 3: summary of everything we detected, right before loading the survey */}
        {uploadStep === 'summary' && selectedReviewItem && (() => {
          const a = selectedReviewItem.analysis;
          const POSITIVE = "bg-status-positive";
          const WARNING = "bg-status-warning";
          const NEGATIVE = "bg-destructive";
          const MUTED = "bg-border-strong/50";

          const responded = a.totalRespondents;
          const notResponded =
            a.totalInvited != null && responded != null ? Math.max(0, a.totalInvited - responded) : null;

          const fb = a.favorabilityBreakdown;
          const nb = a.npsBreakdown;

          const participationHeadline =
            a.participationRate != null ? `${a.participationRate}%` : responded != null ? String(responded) : "N/D";
          // Net favorability = %Positivos − %Negativos (NPS-style), which penalizes
          // negatives and surfaces polarization the gross Top 2 Box would hide.
          const favorabilityNet = fb ? Math.round((fb.favorable - fb.desfavorable) * 10) / 10 : null;
          const favorabilityHeadline = favorabilityNet != null ? `${favorabilityNet}` : "N/D";
          // NPS = %Promotores − %Detractores, computed from the same split shown
          // below, so the headline, formula and breakdown always agree.
          const enpsScore = nb
            ? Math.round((nb.promotores - nb.detractores) * 10) / 10
            : a.enps;
          const enpsHeadline = enpsScore != null ? `${enpsScore}${a.enpsIsApproximate ? "*" : ""}` : "N/D";

          const sectionDetails = a.sectionDetails.length > 0
            ? a.sectionDetails
            : a.sections.map((name) => ({ name, questionCount: 0 }));

          // Participants, grouped into the three match scenarios and honoring the
          // decisions already taken. Only present when the files actually carried
          // individual participants; each group gets its own accordion.
          const detectedParticipants = a.participants?.participants ?? [];
          const participantSplit = a.participants
            ? splitParticipantsByMatch(detectedParticipants, participantResolutions)
            : null;
          // Stops the same UBITS user being linked to two different participants.
          const takenUsernames = linkedUsernames(detectedParticipants, participantResolutions);

          const participantGroups = participantSplit
            ? [
                {
                  value: 'participantes-match',
                  title: 'Hacen match con UBITS',
                  icon: UserCheck,
                  note: 'Su identificador coincide con el username o el correo de un usuario de UBITS, así que los vinculamos automáticamente. Sus respuestas suman a los reportes y segmentaciones de UBITS. Si alguno quedó mal vinculado, puedes corregirlo.',
                  people: participantSplit.matched,
                },
                {
                  value: 'participantes-posibles',
                  title: 'Posibles match',
                  icon: UserSearch,
                  note: 'Su identificador no coincide con el username ni con el correo de ningún usuario de UBITS, pero su nombre y apellido son idénticos a los de uno. No los vinculamos solos: decide si es el mismo usuario, si es otro, o si se crea sin usuario en la encuesta.',
                  people: participantSplit.possible,
                },
                {
                  value: 'participantes-nuevos',
                  title: 'Sin match en UBITS',
                  icon: UserPlus,
                  note: 'Su identificador no coincide con el username ni con el correo de ningún usuario de UBITS, y tampoco hay un nombre igual, así que se crean como participantes solo de esta encuesta. Si sabes a qué usuario corresponden, usa "Asociar usuario".',
                  people: participantSplit.unmatched,
                },
              ]
            : [];

          // Question list, each entry classified against the UBITS taxonomy.
          const questionItems = (a.questionDetails.length > 0
            ? a.questionDetails
            : a.questions.map((text) => ({ text, section: null }))
          ).map((q) => ({ ...q, meta: classifyQuestion(q.text) }));

          // Filter by "kind" (the most specific label: escala, tipo de pregunta,
          // or "Sin reconocer").
          const matchesKind = (meta: QuestionMeta) =>
            questionScaleFilter === 'all' || questionKind(meta) === questionScaleFilter;

          // Questions that don't map to any UBITS type are pulled out into their
          // own group regardless of section (with a warning), so section groups
          // only hold recognized questions.
          const recognizedItems = questionItems.filter((q) => q.meta.recognized);
          const unrecognizedItems = questionItems.filter((q) => !q.meta.recognized);

          const knownSectionNames = new Set(sectionDetails.map((s) => s.name));
          const orphanQuestions = recognizedItems.filter(
            (q) => !q.section || !knownSectionNames.has(q.section)
          );
          // Section-less NPS items are the eNPS driver, so they get their own
          // "eNPS" group rather than being lumped into "Sin sección". Whatever is
          // left is a genuinely standalone question that does not feed any metric.
          const npsOrphans = orphanQuestions.filter((q) => q.meta.escala === 'NPS');
          const otherOrphans = orphanQuestions.filter((q) => q.meta.escala !== 'NPS');

          const questionGroups: {
            name: string;
            icon: typeof Layers;
            note?: string;
            questions: typeof questionItems;
          }[] = [
            ...sectionDetails.map((section) => ({
              name: section.name,
              icon: Layers,
              questions: recognizedItems.filter((q) => q.section === section.name),
            })),
            ...(npsOrphans.length > 0
              ? [{ name: 'eNPS', icon: TrendingUp, questions: npsOrphans }]
              : []),
            ...(otherOrphans.length > 0
              ? [{
                  name: 'Sin sección',
                  icon: Layers,
                  note: 'Estas preguntas no afectan las métricas detectadas: se registran como preguntas independientes.',
                  questions: otherOrphans,
                }]
              : []),
            // "Sin reconocer" is rendered as its OWN accordion (below), not here,
            // for better visibility and a more prominent warning.
          ].filter((g) => g.questions.length > 0);

          // Section filter options come from the groups that actually hold questions.
          const questionSectionOptions = questionGroups.map((g) => g.name);
          // Guard against a stale filter left over from a previously reviewed survey.
          const activeSectionFilter =
            questionSectionFilter !== 'all' && questionSectionOptions.includes(questionSectionFilter)
              ? questionSectionFilter
              : 'all';

          // Type/kind filter options, derived from the recognized questions in
          // this accordion (the unrecognized ones live in their own accordion).
          const questionKindOptions = Array.from(new Set(recognizedItems.map((q) => questionKind(q.meta))));
          const activeKindFilter =
            questionScaleFilter !== 'all' && questionKindOptions.includes(questionScaleFilter)
              ? questionScaleFilter
              : 'all';

          // Groups to render, after applying both the section and type filters.
          const filteredGroups = questionGroups
            .filter((g) => activeSectionFilter === 'all' || g.name === activeSectionFilter)
            .map((g) => ({ ...g, questions: g.questions.filter((q) => matchesKind(q.meta)) }))
            .filter((g) => g.questions.length > 0);
          const visibleQuestionCount = filteredGroups.reduce((acc, g) => acc + g.questions.length, 0);

          return (
          <div className="space-y-5">
            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-bold text-text-primary tracking-tight leading-tight">
                {selectedReviewItem.name}
              </h3>
              <p className="text-xs text-text-secondary/60 font-medium px-4 leading-relaxed">
                Revisa la estructura que detectamos antes de cargar la encuesta.
              </p>
            </div>

            {/* Detected indicators — same accordion pattern as the structure below */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-text-secondary/50 uppercase tracking-wide px-1">
                Indicadores detectados
              </div>

              <Accordion type="single" collapsible value={openSummarySection} onValueChange={setOpenSummarySection} className="gap-2.5">
                <SummaryAccordionItem value="participacion" icon={Users} title="Participación" headline={participationHeadline}>
                  {a.participationRate != null && a.participationRate > 100 && (
                    <p className="text-[11px] text-warning font-medium pb-1">
                      La participación supera el 100% (más respuestas que invitados). Revisa las cifras del archivo.
                    </p>
                  )}
                  {responded != null && notResponded != null ? (
                    <>
                      <SummaryRow label="Respondieron" value={String(responded)} dotClass={POSITIVE} />
                      <SummaryRow label="No respondieron" value={String(notResponded)} dotClass={MUTED} />
                      <p className="text-xs text-text-secondary/60 font-medium pt-2.5">
                        {responded} de {a.totalInvited} colaboradores respondieron.
                      </p>
                    </>
                  ) : responded != null ? (
                    <>
                      <SummaryRow label="Respondieron" value={String(responded)} dotClass={POSITIVE} />
                      <p className="text-xs text-text-secondary/60 font-medium pt-2.5">Total de invitados no disponible.</p>
                    </>
                  ) : (
                    <p className="text-xs text-text-secondary/50 font-medium py-1">Sin datos de participación.</p>
                  )}
                </SummaryAccordionItem>

                <SummaryAccordionItem value="favorabilidad" icon={Heart} title="Favorabilidad neta" headline={favorabilityHeadline}>
                  {fb ? (
                    <>
                      <SummaryRow label="Favorable" value={`${fb.favorable}%`} dotClass={POSITIVE} />
                      <SummaryRow label="Neutral" value={`${fb.neutral}%`} dotClass={WARNING} />
                      <SummaryRow label="Desfavorable" value={`${fb.desfavorable}%`} dotClass={NEGATIVE} />
                      <p className="text-xs text-text-secondary/60 font-medium pt-2.5 leading-relaxed">
                        Favorabilidad = %Positivos − %Negativos = {fb.favorable}% − {fb.desfavorable}% ={" "}
                        <span className="font-bold text-text-primary">{favorabilityNet}</span>.
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-text-secondary/50 font-medium py-1">Sin desglose de favorabilidad.</p>
                  )}
                </SummaryAccordionItem>

                <SummaryAccordionItem value="enps" icon={TrendingUp} title="eNPS" headline={enpsHeadline}>
                  {nb ? (
                    <>
                      <SummaryRow label="Promotores" value={`${nb.promotores}%`} dotClass={POSITIVE} />
                      <SummaryRow label="Neutrales" value={`${nb.neutrales}%`} dotClass={WARNING} />
                      <SummaryRow label="Detractores" value={`${nb.detractores}%`} dotClass={NEGATIVE} />
                      <p className="text-xs text-text-secondary/60 font-medium pt-2.5 leading-relaxed">
                        NPS = %Promotores − %Detractores = {nb.promotores}% − {nb.detractores}% ={" "}
                        <span className="font-bold text-text-primary">
                          {Math.round((nb.promotores - nb.detractores) * 10) / 10}
                        </span>
                        {a.enpsIsApproximate ? " (aproximado a partir de datos agregados)" : ""}.
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-text-secondary/50 font-medium py-1">Sin desglose de eNPS.</p>
                  )}
                </SummaryAccordionItem>
              </Accordion>
            </div>

            {/* Detected participants — its own section, one accordion per match
                 scenario, mirroring how indicators and structure are separated. */}
            {participantSplit && (
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-text-secondary/50 uppercase tracking-wide px-1">
                  Participantes detectados · {participantSplit.total}
                </div>

                {/* Why each participant landed in one group or another. The kind
                     of identifier each file brought is already labelled per row,
                     so this only needs to state what we match it against. */}
                <div className="flex items-start gap-1.5 rounded-lg bg-surface-muted/50 px-2.5 py-2">
                  <Info className="h-3.5 w-3.5 shrink-0 text-text-secondary/50 mt-px" strokeWidth={2.25} />
                  <p className="text-[11px] text-text-secondary/70 font-medium leading-snug">
                    {a.participants?.answersLinked ? (
                      <>
                        Como la encuesta es <span className="font-bold">pública</span>, cada respuesta queda asociada a un
                        usuario. Vinculamos por <span className="font-bold">username</span> o{" "}
                        <span className="font-bold">correo</span> de UBITS. El nombre nunca vincula solo.
                      </>
                    ) : (
                      <>
                        Vinculamos por <span className="font-bold">username</span> o{" "}
                        <span className="font-bold">correo</span> de UBITS. El nombre nunca vincula solo. Aquí las respuestas
                        no están asociadas a cada participante, así que la encuesta solo puede cargarse como anónima.
                      </>
                    )}
                  </p>
                </div>

                <Accordion type="single" collapsible value={openSummarySection} onValueChange={setOpenSummarySection} className="gap-2.5">
                  {participantGroups.map((group) => (
                    <SummaryAccordionItem
                      key={group.value}
                      value={group.value}
                      icon={group.icon}
                      title={group.title}
                      headline={String(group.people.length)}
                    >
                      <div className="flex items-start gap-1.5 rounded-lg bg-surface-muted/50 px-2.5 py-1.5 mt-1.5">
                        <group.icon className="h-3.5 w-3.5 shrink-0 text-text-secondary/50 mt-px" strokeWidth={2.25} />
                        <p className="text-[11px] text-text-secondary/70 font-medium leading-snug">{group.note}</p>
                      </div>

                      {group.people.length > 0 ? (
                        <div className="max-h-80 overflow-y-auto pr-1 mt-1 border-t border-border/30">
                          {group.people.map((person, idx) => (
                            <ParticipantRow
                              key={person.identifier}
                              index={idx + 1}
                              participant={person}
                              directory={UBITS_DIRECTORY}
                              takenUsernames={takenUsernames}
                              // A resolved participant keeps its decision visible (and
                              // reversible) in whichever group it landed in, so it's
                              // always clear why that person is there.
                              resolution={participantResolutions[person.identifier]}
                              onResolve={(decision) => resolveParticipant(person.identifier, decision)}
                            />
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-text-secondary/50 font-medium py-3">
                          No hay participantes en este grupo.
                        </p>
                      )}
                    </SummaryAccordionItem>
                  ))}
                </Accordion>
              </div>
            )}

            {/* Detected structure — identical accordion pattern */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-text-secondary/50 uppercase tracking-wide px-1">
                Estructura detectada
              </div>

              <Accordion type="single" collapsible value={openSummarySection} onValueChange={setOpenSummarySection} className="gap-2.5">

                <SummaryAccordionItem value="demograficos" icon={PieChart} title="Demográficos" headline={String(a.demographics.length)}>
                  {a.demographics.length > 0 ? (
                    a.demographics.map((demo) => <SummaryRow key={demo} label={demo} />)
                  ) : (
                    <p className="text-xs text-text-secondary/50 font-medium py-1">No se detectaron cortes demográficos.</p>
                  )}
                </SummaryAccordionItem>

                <SummaryAccordionItem
                  value="secciones-preguntas"
                  icon={Layers}
                  title="Secciones y preguntas"
                  headline={`${sectionDetails.length} · ${a.questionsCount}`}
                >
                  {questionGroups.length > 0 ? (
                    <div className="space-y-2.5 pt-1">
                      {/* Filters: by section and by scale family */}
                      <div className="flex flex-wrap items-center gap-2">
                        {questionSectionOptions.length > 0 && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-2.5 gap-1.5 text-[11px] font-bold rounded-lg border-border/60 bg-surface max-w-[190px]"
                              >
                                <Layers className="h-3 w-3 shrink-0 text-text-secondary/60" />
                                <span className="truncate">{activeSectionFilter === 'all' ? 'Todas las secciones' : activeSectionFilter}</span>
                                <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-56 max-h-64 overflow-y-auto bg-surface border border-border/40 shadow-drawer rounded-lg p-1.5">
                              <DropdownMenuRadioGroup value={activeSectionFilter} onValueChange={setQuestionSectionFilter}>
                                <DropdownMenuRadioItem value="all" className="text-[11px] font-bold tracking-tight p-2 rounded-md focus:bg-brand/5 focus:text-brand cursor-pointer">
                                  Todas las secciones
                                </DropdownMenuRadioItem>
                                {questionSectionOptions.map((section) => (
                                  <DropdownMenuRadioItem key={section} value={section} className="text-[11px] font-bold tracking-tight p-2 rounded-md focus:bg-brand/5 focus:text-brand cursor-pointer">
                                    {section}
                                  </DropdownMenuRadioItem>
                                ))}
                              </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2.5 gap-1.5 text-[11px] font-bold rounded-lg border-border/60 bg-surface"
                            >
                              <BarChart3 className="h-3 w-3 shrink-0 text-text-secondary/60" />
                              <span className="truncate max-w-[130px]">{activeKindFilter === 'all' ? 'Todos los tipos' : activeKindFilter}</span>
                              <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-52 max-h-64 overflow-y-auto bg-surface border border-border/40 shadow-drawer rounded-lg p-1.5">
                            <DropdownMenuRadioGroup value={activeKindFilter} onValueChange={setQuestionScaleFilter}>
                              <DropdownMenuRadioItem value="all" className="text-[11px] font-bold tracking-tight p-2 rounded-md focus:bg-brand/5 focus:text-brand cursor-pointer">
                                Todos los tipos
                              </DropdownMenuRadioItem>
                              {questionKindOptions.map((kind) => (
                                <DropdownMenuRadioItem key={kind} value={kind} className="text-[11px] font-bold tracking-tight p-2 rounded-md focus:bg-brand/5 focus:text-brand cursor-pointer">
                                  {kind}
                                </DropdownMenuRadioItem>
                              ))}
                            </DropdownMenuRadioGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <span className="text-[11px] text-text-secondary/50 font-medium ml-auto">
                          {visibleQuestionCount} de {recognizedItems.length}
                        </span>
                      </div>

                      {/* Flat grouped list: section header, then its questions listed below */}
                      {filteredGroups.length > 0 ? (
                        <div className="max-h-80 overflow-y-auto pr-1">
                          {filteredGroups.map((group) => {
                            const GroupIcon = group.icon;
                            return (
                            <div key={group.name} className="mb-1.5 last:mb-0">
                              <div className="flex items-center gap-2 py-2 sticky top-0 bg-surface z-10">
                                <GroupIcon className="h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={2.5} />
                                <span className="text-[13px] font-bold text-text-primary tracking-tight">{group.name}</span>
                                <span className="text-[11px] font-bold text-text-secondary/50 tabular-nums">· {group.questions.length}</span>
                              </div>
                              {group.note && (
                                <div className="flex items-start gap-1.5 rounded-lg bg-surface-muted/50 px-2.5 py-1.5 mb-1">
                                  <Info className="h-3.5 w-3.5 shrink-0 text-text-secondary/50 mt-px" strokeWidth={2.25} />
                                  <p className="text-[11px] text-text-secondary/70 font-medium leading-snug">{group.note}</p>
                                </div>
                              )}
                              <div className="border-t border-border/30">
                                {group.questions.map((q, idx) => (
                                  <QuestionRow key={`${group.name}-${idx}-${q.text.slice(0, 12)}`} index={idx + 1} text={q.text} />
                                ))}
                              </div>
                            </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-text-secondary/50 font-medium py-2">
                          Ninguna pregunta coincide con los filtros.
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-text-secondary/50 font-medium py-1">No se detectaron secciones ni preguntas.</p>
                  )}
                </SummaryAccordionItem>
              </Accordion>

              {/* Unrecognized questions — their OWN accordion + a prominent warning */}
              {unrecognizedItems.length > 0 && (
                <div className="space-y-2.5 pt-1">
                  <Alert variant="warning">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle className="text-xs font-bold">
                      {unrecognizedItems.length} pregunta{unrecognizedItems.length > 1 ? 's' : ''} sin reconocer
                    </AlertTitle>
                    <AlertDescription className="text-[11px] leading-relaxed">
                      No coinciden con los tipos de UBITS. Si cargas la encuesta así, estas preguntas no aportarán a las métricas (favorabilidad/eNPS) ni podrán filtrarse ni segmentarse.
                    </AlertDescription>
                  </Alert>

                  <Accordion type="single" collapsible value={openSummarySection} onValueChange={setOpenSummarySection} className="gap-2.5">
                    <SummaryAccordionItem
                      value="sin-reconocer"
                      icon={AlertTriangle}
                      title="Preguntas sin reconocer"
                      headline={String(unrecognizedItems.length)}
                    >
                      <div className="max-h-72 overflow-y-auto pr-1">
                        {unrecognizedItems.map((q, idx) => (
                          <QuestionRow key={`sin-reconocer-${idx}-${q.text.slice(0, 12)}`} index={idx + 1} text={q.text} />
                        ))}
                      </div>
                    </SummaryAccordionItem>
                  </Accordion>
                </div>
              )}
            </div>
          </div>
          );
        })()}
      </div>
    </div>
  )}
</DrawerShell>

{/* Floating upload tray — survives the drawer closing so a load in progress stays visible */}
{showUploadTray && !isUploadDrawerOpen && (
  <div className="fixed bottom-6 right-6 bg-surface rounded-xl shadow-drawer border border-border/40 w-[360px] z-50 overflow-hidden">
    <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
      <div className="min-w-0">
        <p className="text-sm font-bold text-text-primary tracking-tight">
          {uploadTasks.some((task) => task.status === 'loading')
            ? "Cargando encuesta..."
            : uploadTasks.some((task) => task.status === 'failed')
              ? "No se pudo cargar"
              : uploadTasks.some((task) => task.status === 'completed')
                ? "Carga completada"
                : "Cargas"}
        </p>
        {!isUploadTrayMinimized && uploadTasks.some((task) => task.status === 'loading') && (
          <p className="text-[11px] text-text-secondary/60">
            {uploadTasks.filter((task) => task.status === 'loading').length} en curso
          </p>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => {
            setIsUploadDrawerOpen(true);
            setUploadStep('loading');
            setUploadTab('cargas');
            setIsUploadTrayMinimized(false);
          }}
          className="p-1.5 hover:bg-muted rounded-md transition-colors text-text-secondary/60 hover:text-primary"
          aria-label="Ver detalles"
        >
          <ExternalLink className="h-4 w-4" />
        </button>
        <button
          onClick={() => setIsUploadTrayMinimized((prev) => !prev)}
          className="p-1.5 hover:bg-muted rounded-md transition-colors text-text-secondary/60 hover:text-primary"
          aria-label={isUploadTrayMinimized ? "Expandir" : "Minimizar"}
        >
          {isUploadTrayMinimized ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        <button
          onClick={handleCloseUploadTray}
          className="p-1.5 hover:bg-muted rounded-md transition-colors text-text-secondary/60 hover:text-destructive"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>

    {!isUploadTrayMinimized && (
      <div className="px-4 py-3 space-y-3 max-h-[260px] overflow-y-auto">
        {[...uploadTasks].sort((a, b) => b.id - a.id).map((task) => (
          <div key={task.id} className="pb-3 border-b border-border/30 last:border-b-0 last:pb-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {task.status === 'completed' ? (
                  <div className="h-5 w-5 rounded-full bg-status-positive flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3 text-white" strokeWidth={3} />
                  </div>
                ) : task.status === 'failed' ? (
                  <div className="h-5 w-5 rounded-full bg-destructive flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-3 w-3 text-white" strokeWidth={2.5} />
                  </div>
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-primary/20 border-t-primary animate-spin shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm text-text-primary truncate">{task.name}</p>
                  {task.status === 'failed' && (
                    <p className="text-[10px] text-destructive font-medium">Problemas técnicos</p>
                  )}
                </div>
              </div>
              {task.status === 'completed' ? (
                <button
                  onClick={handleViewLoadedSurvey}
                  className="text-xs font-bold text-primary hover:underline shrink-0"
                >
                  Ver encuesta
                </button>
              ) : task.status === 'failed' ? (
                <button
                  onClick={() => retryUpload(task.id)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-destructive hover:underline shrink-0"
                >
                  <RotateCw className="h-3.5 w-3.5" />
                  Reintentar
                </button>
              ) : (
                <span className="text-xs font-bold text-primary shrink-0">{task.progress}%</span>
              )}
            </div>
            {task.status === 'loading' && (
              <div className="mt-1.5 h-1 bg-muted rounded-full overflow-hidden ml-7">
                <div className="h-full bg-primary transition-all duration-300" style={{ width: `${task.progress}%` }} />
              </div>
            )}
            {task.status === 'failed' && (
              <div className="mt-1.5 h-1 bg-destructive/15 rounded-full overflow-hidden ml-7">
                <div className="h-full bg-destructive/70" style={{ width: `${task.progress}%` }} />
              </div>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
)}
</div>
);
};
