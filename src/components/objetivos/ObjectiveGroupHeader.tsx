import * as React from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Info,
  Merge,
  Trash2,
  UserRound,
  UserRoundCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { UserIdentityPicker } from "./UserMatchPicker";
import {
  TOTAL_WEIGHT_PERCENT,
  getWeightStatus,
  isProgressUpdateValid,
  groupDisplayName,
  groupUntouchedObjectives,
  groupWeightTotal,
  isObjectiveLinkPending,
  isObjectiveValid,
  type IdentifierType,
  type ObjectiveUserGroup,
  type ParsedObjective,
  type RosterUser,
} from "@/lib/objectivesImport";

/**
 * Header of one user's card in the review step.
 *
 * Laid out like the rest of the design system's accordions: an icon badge, the
 * title, the metrics on the opposite side, and the disclosure chevron last on
 * the right. The chevron sits there rather than on the left because it is the
 * least important control in the row — the identity is what the reviewer reads
 * first, and putting a toggle ahead of it made the eye start on the chrome.
 *
 * Only the data that produced the match is shown inline; everything else UBITS
 * knows about the person lives in a tooltip. Five attributes on one line was the
 * clutter, but they still have to be reachable — confirming an identity is the
 * whole job of this step.
 */

/** Human label for how the file named the person. */
const IDENTIFIER_LABEL: Record<IdentifierType, string> = {
  correo: "correo",
  documento: "documento",
  username: "username",
  nombre: "nombre",
  telefono: "teléfono",
};

/**
 * How close the user's objectives are to the 100% weight rule.
 *
 * Always a badge so the shape stays put, and only one of the three states is
 * coloured. Falling short is the normal condition of a file still being
 * reviewed — a user with two of their four objectives loaded is at 60% and
 * nothing is wrong yet — so it stays grey and simply states the gap. Going over
 * 100% is the only total that cannot be fixed by adding what is missing, so it
 * is the only one that turns red.
 *
 * `muted` drops even that, for a card still waiting on its user: the whole
 * point of that state is to ask one question, so the badge reports the total as
 * a plain fact and saves the verdict for when the objectives have an owner.
 */
const WeightTotal: React.FC<{ total: number; muted?: boolean }> = ({ total, muted }) => {
  const status = getWeightStatus(total);
  const gap = Math.round(Math.abs(TOTAL_WEIGHT_PERCENT - total) * 100) / 100;
  const isOver = status === "over" && !muted;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium tabular-nums shrink-0",
        isOver
          ? "bg-status-negative/10 text-status-negative font-bold"
          : "bg-surface-muted text-text-secondary/70"
      )}
      title={
        status === "ok"
          ? `Los pesos de este usuario suman ${TOTAL_WEIGHT_PERCENT}%, como debe ser.`
          : `Los pesos de este usuario suman ${total}% y deben sumar ${TOTAL_WEIGHT_PERCENT}%.`
      }
    >
      {isOver && <AlertTriangle className="h-3 w-3 shrink-0" strokeWidth={2.5} />}
      Peso {total}%
      {!muted && status !== "ok" && ` · ${status === "over" ? "sobra" : "falta"} ${gap}%`}
    </span>
  );
};

/**
 * One attribute inside the details tooltip.
 *
 * A two-column grid rather than a flex row: the labels then line up down the
 * left edge regardless of how long each value is.
 */
const TooltipRow: React.FC<{ label: string; value?: string }> = ({ label, value }) => {
  if (!value) return null;

  return (
    <span className="grid grid-cols-[62px_1fr] gap-x-2 items-baseline">
      <span className="text-[9.5px] font-bold uppercase tracking-wider opacity-50">{label}</span>
      <span className="text-[11px] font-medium break-words">{value}</span>
    </span>
  );
};

export interface ObjectiveGroupHeaderProps {
  group: ObjectiveUserGroup;
  /** Objectives currently passing the filters, for the "N de M" count. */
  visibleObjectives: ParsedObjective[];
  /** Everyone the identifier can be reassigned to. */
  candidates: RosterUser[];
  /** True when another group resolves to the same UBITS user. */
  isDuplicate: boolean;
  isCollapsed: boolean;
  onToggle: () => void;
  onAssignUser: (user: RosterUser | null) => void;
  /**
   * The explicit "yes, load this" for a card whose identity is already
   * settled — nothing staged, nothing to merge — once nothing else blocks it.
   * `onAssignUser` is what "Confirmar" calls when there is an identity to
   * commit; this is what it calls instead when there is not.
   */
  onConfirmReady: () => void;
  /**
   * Whether this card's removal is the question currently on screen.
   *
   * Owned by the review table rather than by this component: only one question
   * may be open at a time across the whole review, and while one is open
   * everything else has to stop responding — neither of which a card can decide
   * on its own.
   */
  isConfirmingDelete: boolean;
  onRequestDelete: () => void;
  onCancelDelete: () => void;
  onDeleteVisible: () => void;
  /**
   * False once the card is loadable, which is the one state with nothing left
   * to confirm. Everywhere else the button is present and says what is missing,
   * rather than appearing only when the answer is already yes.
   */
  showConfirm: boolean;
  /**
   * Finds the other group in the load that already resolves to a given user.
   *
   * A lookup rather than a flag, because the collision depends on whoever is
   * staged in this header right now — which the table cannot know until the
   * reviewer has picked.
   */
  findGroupFor: (username: string) => ObjectiveUserGroup | undefined;
  /** Set while this card is asking whether to merge into the group it collides with. */
  mergeQuestion?: { user: RosterUser; target: ObjectiveUserGroup };
  onRequestMerge: (user: RosterUser, target: ObjectiveUserGroup) => void;
  onCancelMerge: () => void;
  onMerge: () => void;
}

export const ObjectiveGroupHeader: React.FC<ObjectiveGroupHeaderProps> = ({
  group,
  visibleObjectives,
  candidates,
  isDuplicate,
  isCollapsed,
  onToggle,
  onAssignUser,
  onConfirmReady,
  isConfirmingDelete,
  onRequestDelete,
  onCancelDelete,
  onDeleteVisible,
  showConfirm,
  findGroupFor,
  mergeQuestion,
  onRequestMerge,
  onCancelMerge,
  onMerge,
}) => {
  const isResolved = group.matchStatus === "matched";
  const isUnmatched = group.matchStatus === "unmatched";
  const isProposal = group.matchStatus === "possible" && group.suggestion !== undefined;
  /** A load that records progress and moves no weight — see `groupHasStructuralErrors`. */
  const isProgressLoad = group.mode === "actualizar";

  /**
   * Someone the reviewer picked from the field but has not committed yet.
   *
   * Choosing and confirming used to be the same click, which meant the card
   * jumped to another tab the instant the dropdown closed — the reviewer lost
   * their place, and there was no moment in which to check they had picked the
   * right person. Now the field proposes and "Confirmar" commits, which is also
   * what gives that button something to do in every tab rather than only where
   * the matcher happened to find a candidate.
   *
   * Clearing the user is exempt: "Dejar sin asociar" has nothing to verify, so
   * it applies straight away.
   */
  const [stagedUser, setStagedUser] = React.useState<RosterUser | undefined>();

  /*
    Anything that resolves the identity elsewhere — confirming, clearing, the
    group being re-read — drops a stale staging.

    Adjusted during render rather than in an effect: React re-runs this
    component before touching the DOM, so the staged value never reaches the
    screen after it stopped being true, and there is no second commit.
  */
  const resolvedKey = `${group.matchStatus}:${group.matchedUser?.username ?? ""}`;
  const [lastResolvedKey, setLastResolvedKey] = React.useState(resolvedKey);
  if (lastResolvedKey !== resolvedKey) {
    setLastResolvedKey(resolvedKey);
    setStagedUser(undefined);
  }

  /** The identity on the table: staged pick first, else the matcher's guess. */
  const pendingUser = stagedUser ?? (isProposal ? group.suggestion : undefined);
  const hasIdentityChange =
    pendingUser !== undefined && pendingUser.username !== group.matchedUser?.username;

  const displayName = groupDisplayName(group);
  /**
   * Whose data the info tooltip shows: whoever the field is currently naming.
   * A proposal without its details is unanswerable — "¿es Cristian Rincón?" is
   * only a real question if you can see which Cristián.
   */
  const detailUser = pendingUser ?? group.matchedUser;
  // The weight rule covers everything the person carries — the objectives they
  // already have in the cycle included — so it never narrows with the filters
  // the way the row count does.
  const total = groupWeightTotal(group);
  // Only the ones the file leaves alone are a second quantity worth naming. On an
  // edit load the rewritten ones are already represented by their own row, so
  // counting them here would announce objectives the reviewer cannot point to.
  const savedCount = groupUntouchedObjectives(group).length;
  /** Edit rows whose objective we could only guess at, and nobody has confirmed. */
  const pendingLinks = isUnmatched
    ? 0
    : group.objectives.filter(isObjectiveLinkPending).length;
  // Rule violations stay unreported while the objectives have no owner: that
  // card is asking one question, and stacking a red count next to it was what
  // made the case unreadable when it lived in the errors tab. Picking a user
  // reveals them and re-files the card.
  //
  // Existing objectives count too, because they are editable: a reviewer who
  // frees up weight by rewriting a saved row can break it, and the card has to
  // say so rather than let the load fail on something it displayed as fine.
  //
  // Counted over every row the file brings, not just the filtered/searched
  // subset on screen: `bucketForGroup` decides the card's tab from the same
  // full set, and this reason has to agree with that verdict — otherwise a
  // search or column filter could hide the one row still blocking the card and
  // the button would call itself ready when the tab still says otherwise.
  const invalidCount = isUnmatched
    ? 0
    : isProgressLoad
      ? // Only the file's own rows, and only on the value they carry: a progress
        // load neither writes a definition nor touches the objectives it does not
        // mention, so both are somebody else's business.
        group.objectives.filter((objective) => !isProgressUpdateValid(objective)).length
      : [...groupUntouchedObjectives(group), ...group.objectives].filter(
          (objective) => !isObjectiveValid(objective)
        ).length;

  /** Progress rows aimed at an objective the user simply does not have. */
  const orphanRows = isProgressLoad
    ? group.objectives.filter((objective) => objective.link?.targetId === undefined).length -
      pendingLinks
    : 0;
  const isPartial = visibleObjectives.length !== group.objectives.length;

  /**
   * What is stopping this card from being loadable, in the order the reviewer
   * has to deal with it — and null when nothing is.
   *
   * The button is shown even when it cannot be pressed, because the disabled
   * state carrying the reason is more useful than no button at all: the card
   * then answers "why is this still here?" without the reviewer hunting for a
   * red mark among the rows. It also re-evaluates on every keystroke, so fixing
   * one rule and tripping another swaps the sentence instead of silently
   * leaving the button dead.
   */
  const weightStatus = getWeightStatus(total);
  const confirmBlocker: string | null =
    pendingUser === undefined && group.matchedUser === undefined
      ? "Elige el usuario dueño de estos objetivos para poder confirmar."
      : hasIdentityChange
        ? null
        : // Asked before the data problems, because it is the one blocker whose
          // answer can change what the data even means: confirming a different
          // objective brings a different weight with it.
          pendingLinks > 0
          ? `Confirma a qué objetivo de UBITS ${pendingLinks === 1 ? "corresponde 1 fila" : `corresponden ${pendingLinks} filas`} del archivo.`
          : // A dead end that only exists on a progress load: there is no
            // objective to report against, and this file cannot create one.
            orphanRows > 0
            ? `${orphanRows === 1 ? "1 fila no corresponde" : `${orphanRows} filas no corresponden`} a ningún objetivo de esta persona. Elige a cuál corresponde cada una, o quítalas de la carga.`
            : invalidCount > 0
          ? isProgressLoad
            ? `Completa el nuevo avance en ${invalidCount === 1 ? "1 fila" : `${invalidCount} filas`}.`
            : `Corrige ${invalidCount} ${invalidCount === 1 ? "objetivo" : "objetivos"} con datos que UBITS rechaza.`
          : // Only an excess blocks — see `groupHasStructuralErrors`'s doc
            // comment for why falling short is left for the reviewer to judge
            // instead of forced shut. A progress load skips it outright: it
            // moves no weight, so whatever the total is, this file did not
            // cause it and cannot fix it.
            !isProgressLoad && weightStatus === "over"
            ? // With existing objectives on the card the bare total is
              // misleading — it counts rows the reviewer did not upload — so the
              // reason names both halves.
              savedCount > 0
              ? `Entre los ${savedCount} objetivos que ya tiene en UBITS y los del archivo, los pesos suman ${total}% y deben sumar ${TOTAL_WEIGHT_PERCENT}%.`
              : `Los pesos suman ${total}% y deben sumar ${TOTAL_WEIGHT_PERCENT}%.`
            : null;

  /**
   * The group that already owns the person about to be confirmed.
   *
   * Two identifiers in one file resolving to the same UBITS user is not a
   * mistake to block — the same person can legitimately be named twice — but
   * loading both would stack their weights past 100%, so the reviewer has to
   * say which they meant before it happens.
   */
  const conflictGroup =
    hasIdentityChange && pendingUser ? findGroupFor(pendingUser.username) : undefined;

  const commitIdentity = () => {
    const user = pendingUser!;
    setStagedUser(undefined);
    onAssignUser(user);
  };

  const handleConfirm = () => {
    if (conflictGroup && pendingUser) {
      onRequestMerge(pendingUser, conflictGroup);
      return;
    }
    // No identity staged means there is none left to settle — this card was
    // already matched, and the click is purely the reviewer's "yes, load
    // this" for the data. `commitIdentity` has nothing to commit here.
    if (!pendingUser) {
      onConfirmReady();
      return;
    }
    commitIdentity();
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 transition-colors",
        !isCollapsed && "border-b border-border/50",
        // Tinting while a question is open ties it to the card it affects.
        isConfirmingDelete && "bg-status-negative/[0.04]",
        mergeQuestion && "bg-status-warning/[0.05]"
      )}
    >
      {/* Icon badge, coloured by what is blocking this user. */}
      {/* One neutral treatment: the badge says "this is a person", and the chips
          on the other side say what is wrong. Colouring it too meant three
          things competing to report the same state. */}
      <span className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 bg-primary/10 text-primary">
        <UserRound className="h-4 w-4" strokeWidth={2.25} />
      </span>

      {/* Identity and match data share one line: stacking them made every card
          two rows tall for a single sentence's worth of information. */}
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <UserIdentityPicker
          candidates={candidates}
          value={group.matchedUser}
          proposed={pendingUser}
          identifier={group.identifier}
          identifierType={group.identifierType}
          matchStatus={group.matchStatus}
          // Picking stages; clearing applies.
          onChange={(user) => (user === null ? onAssignUser(null) : setStagedUser(user))}
        />

        {/* Only what produced the match. The rest is one hover away. */}
        {/* The identifier is shown verbatim in every state, because it is the
            only thing the file actually said about this person — when nobody
            was found it is also the reviewer's single clue for who to pick, so
            hiding it behind the generic "identificado por correo" took away the
            data right when it mattered most. */}
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[11px] font-medium text-text-secondary/55 truncate">
            <span
              className={cn(
                "font-bold",
                isResolved ? "text-text-secondary/70" : "text-text-secondary/80"
              )}
            >
              {group.identifier}
            </span>
            <span className="opacity-70"> · {IDENTIFIER_LABEL[group.identifierType]}</span>
            {isUnmatched && !stagedUser && (
              <span className="opacity-70"> · sin usuario asociado</span>
            )}
            {/* What made us think it is this person, in two words. The old
                proposal banner said it in a sentence and cost the card a whole
                row; the sentence now lives in the tooltip beside it. */}
            {!stagedUser && isProposal && group.suggestionBasis && (
              <span className="opacity-70"> · coincide por {group.suggestionBasis}</span>
            )}
            {stagedUser && (
              <span className="font-bold text-status-warning"> · sin confirmar</span>
            )}
          </span>

          {/* Same affordance for a confirmed user and for a proposed one: the
              reviewer needs the person's data to decide either way, and needing
              it is more urgent when the identity is still a question. */}
          {detailUser && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={`Ver los datos de ${detailUser.name}`}
                  className="shrink-0 text-text-secondary/35 hover:text-text-secondary transition-colors"
                >
                  <Info className="h-3 w-3" strokeWidth={2.5} />
                </button>
              </TooltipTrigger>
              {/* One child only: TooltipContent is an `inline-flex` row, so
                  several children would be laid out side by side instead of
                  stacking. The wrapper is what makes this a block. */}
              <TooltipContent side="bottom" align="start" className="max-w-[300px]">
                <span className="flex flex-col gap-1 py-0.5">
                  <span className="text-[11px] font-bold pb-0.5">{detailUser.name}</span>
                  <TooltipRow label="Username" value={detailUser.username} />
                  <TooltipRow label="Correo" value={detailUser.email} />
                  <TooltipRow label="Documento" value={detailUser.documentId} />
                  <TooltipRow label="Teléfono" value={detailUser.phone} />
                  <TooltipRow label="Área" value={detailUser.area} />
                  <TooltipRow label="Líder" value={detailUser.leader} />
                  {isProposal && group.suggestionReason && (
                    <span className="text-[10.5px] font-medium opacity-70 pt-1 border-t border-current/15 mt-0.5">
                      {group.suggestionReason}
                    </span>
                  )}
                </span>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      {/*
        Metrics, then the state chips, then the actions — most informative to
        least, so the eye lands on the numbers before the controls.

        Asking to remove a user swaps this whole cluster for the question. It is
        the same row, in the same place, so the answer never leaves the card the
        question is about — a dialog would tear the decision away from what it
        affects and make the reviewer re-find their place afterwards.
      */}
      {mergeQuestion ? (
        /*
          The same person, named twice by the same file.

          Not blocked, because it is often deliberate — two sheets, two ways of
          writing the same identifier — but it cannot go through unnoticed
          either: two groups against one user means their weights add up past
          100% the moment both load. So the confirmation stops here and asks
          which of the two readings the reviewer meant.
        */
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11.5px] font-medium text-text-secondary text-right">
            <span className="font-bold text-text-primary">{mergeQuestion.user.name}</span> ya está
            en la carga como{" "}
            <span className="font-bold text-text-primary">{mergeQuestion.target.identifier}</span>,
            con {mergeQuestion.target.objectives.length}{" "}
            {mergeQuestion.target.objectives.length === 1 ? "objetivo" : "objetivos"}.
          </span>
          <Button
            type="button"
            size="sm"
            autoFocus
            onClick={onMerge}
            title={`Pasar estos ${group.objectives.length} objetivos al grupo de ${mergeQuestion.target.identifier}`}
            className="h-7 px-2.5 shrink-0 text-[11px] font-bold gap-1 bg-status-warning text-text-inverse hover:bg-status-warning/90"
          >
            <Merge className="h-3.5 w-3.5" strokeWidth={2.5} />
            Unificar
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancelMerge}
            className="h-7 px-2 shrink-0 text-[11px] font-bold text-text-secondary/70 hover:text-text-primary"
          >
            Cancelar
          </Button>
        </div>
      ) : isConfirmingDelete ? (
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11.5px] font-bold text-status-negative">
            ¿Quitar {visibleObjectives.length}{" "}
            {visibleObjectives.length === 1 ? "objetivo" : "objetivos"} de la carga?
          </span>
          <Button
            type="button"
            size="sm"
            autoFocus
            onClick={onDeleteVisible}
            className="h-7 px-2.5 text-[11px] font-bold gap-1 bg-status-negative text-text-inverse hover:bg-status-negative/90"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
            Quitar
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancelDelete}
            className="h-7 px-2 text-[11px] font-bold text-text-secondary/70 hover:text-text-primary"
          >
            Cancelar
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 shrink-0">
          {/* The three counters share one badge shape. Loose text next to two
              pills read as a caption rather than as the first of a set, and the
              row lost its rhythm every time a card gained or dropped a chip. */}
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium tabular-nums shrink-0 bg-surface-muted text-text-secondary/70"
            title={
              isPartial
                ? `Los filtros dejan ver ${visibleObjectives.length} de los ${group.objectives.length} objetivos de este usuario.`
                : undefined
            }
          >
            {isPartial
              ? `${visibleObjectives.length} de ${group.objectives.length}`
              : group.objectives.length}{" "}
            {group.objectives.length === 1 ? "objetivo" : "objetivos"}
            {/* Qualified only when there is a second kind on the card. On every
                other user "3 objetivos" is unambiguous, and adding "del
                archivo" to all of them would be noise on the majority to
                disambiguate the minority. */}
            {savedCount > 0 && <span className="opacity-60"> del archivo</span>}
          </span>

          {/*
            The weight the person already spent, named as its own quantity.

            Without it the totals contradict each other: the chip beside this
            one counts two objectives and the weight chip reports 140%, which
            reads as a bug until you open the card and find the three rows UBITS
            already had. This is the missing term in that sum, and on a collapsed
            card it is the only place it appears.
          */}
          {savedCount > 0 && (
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium tabular-nums shrink-0 bg-surface-muted text-text-secondary/70"
              title={
                isProgressLoad
                  ? `${displayName} tiene ${savedCount} ${
                      savedCount === 1 ? "objetivo más" : "objetivos más"
                    } en este ciclo sobre los que el archivo no reporta avance. Se quedan como están.`
                  : `${displayName} ya tiene ${savedCount} ${
                      savedCount === 1 ? "objetivo" : "objetivos"
                    } en este ciclo. Se muestran en la tarjeta y también puedes ajustarles el peso.`
              }
            >
              + {savedCount} en UBITS
            </span>
          )}

          {/*
            Un dato de la persona, no un veredicto sobre el archivo. Se muestra
            en las tres operaciones para que la cabecera sea la misma en todas;
            lo que la carga de avances no hace es *bloquear* por él ni pedir que
            se reparta, porque no mueve ningún peso.

            La excepción es una tarjeta de avances todavía sin dueño: ahí los
            pesos salen de los objetivos enlazados y no hay ninguno, así que el
            chip diría "Peso 0%" — un número que no es el de nadie. Las otras dos
            operaciones no caen en esto porque sus archivos traen el peso escrito.
          */}
          {!(isProgressLoad && isUnmatched) && (
            <WeightTotal total={total} muted={isUnmatched || isProgressLoad} />
          )}

          {/*
            No status chips here at all — not "Sin alinear", not "Por
            confirmar", not "N por corregir".

            Each only restated the tab the card was already sitting in, on every
            card in that tab; a label true of all of them tells the reviewer
            nothing about this one. The error count went the same way: the rows
            underneath mark every offending field in red and spell out the rule,
            and the Confirmar button says the count in its own disabled reason,
            so the chip was a third telling of the same fact. What is left are
            the two things that genuinely vary and are not visible elsewhere in
            the row: the totals, and the exceptions below.
          */}

          {group.isManual && isResolved && (
            <span
              className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary inline-flex items-center gap-1"
              title="Asociado a mano en esta revisión"
            >
              <UserRoundCheck className="h-3 w-3 shrink-0" strokeWidth={2.5} />
              Asociado
            </span>
          )}


          {isDuplicate && (
            <span
              className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-status-negative/10 text-status-negative inline-flex items-center gap-1"
              title={`Otro identificador del archivo también apunta a ${displayName}. Si cargas los dos, sus pesos se sumarán por encima del 100%.`}
            >
              <AlertTriangle className="h-3 w-3 shrink-0" strokeWidth={2.5} />
              Usuario repetido
            </span>
          )}

          <span className="w-px h-5 bg-border/60" aria-hidden="true" />

          {/*
            Actions live to the right of the divider; the chips to its left are
            state, and mixing a control in among them made the row read as five
            badges of which one happened to be clickable.

            Secondary rather than solid: it is one of several cards' worth of
            the same button on screen at once, and a column of filled buttons
            competes with the load action in the footer.
          */}
          <div className="flex items-center gap-1">
            {showConfirm && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={confirmBlocker !== null}
                onClick={handleConfirm}
                aria-label={
                  confirmBlocker ??
                  `Confirmar que estos objetivos son de ${pendingUser?.name ?? displayName}`
                }
                title={
                  confirmBlocker ??
                  (conflictGroup
                    ? `${pendingUser!.name} ya está en la carga. Te preguntaremos si unificar.`
                    : pendingUser
                      ? `Confirmar a ${pendingUser.name} como dueño de estos objetivos`
                      : `Cargar los objetivos de ${displayName}`)
                }
                className="h-8 px-2.5 shrink-0 text-[11px] font-bold gap-1 bg-surface hover:bg-surface-muted/70 disabled:opacity-45"
              >
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
                Confirmar
              </Button>
            )}

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onRequestDelete}
              aria-label={`Quitar los objetivos de ${displayName} de la carga`}
              title={`Quitar los ${visibleObjectives.length} objetivos de ${displayName}`}
              className="h-8 w-8 text-text-secondary/40 hover:text-status-negative hover:bg-status-negative/10"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
            </Button>

            {/* Disclosure last on the right, as in the rest of the accordions. */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-expanded={!isCollapsed}
              aria-label={`${isCollapsed ? "Mostrar" : "Ocultar"} los objetivos de ${displayName}`}
              onClick={onToggle}
              className="h-8 w-8 text-text-secondary/50 hover:text-text-primary hover:bg-surface-muted"
            >
              <ChevronDown
                className={cn("h-4 w-4 transition-transform", isCollapsed && "-rotate-90")}
                strokeWidth={2.5}
              />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
