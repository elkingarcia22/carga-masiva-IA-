import type { RosterUser } from '@/lib/objectivesImport';
import type {
  AssignedUser,
  AssignedUserStatus,
  ObjectiveCycleItem,
  ObjectiveCyclePeriod,
  ObjectiveCycleStatus,
  PerformanceLevel,
  UserWithoutObjectives,
} from './types';

/**
 * Mock data for the "Objetivos" surface: cycles and users without objectives.
 *
 * The head of each list holds the real-looking rows the product shows today
 * (QA cycles, test accounts); the tail is generated so both lists reach the
 * volumes the real screens report — 111 cycles and 6.760 users — which is what
 * makes pagination, search and filters worth exercising in the prototype.
 *
 * Generation is seeded, never `Math.random()`, so a reload always renders the
 * same rows and visual diffs stay meaningful.
 */

const MONTH_NAMES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

/** Formats a date the way the objectives lists do, e.g. "06 abril 2026". */
export function formatLongDate(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  return `${day} ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Deterministic pseudo-random source (mulberry32). Same seed, same list on
 * every render — required because these mocks are module-level constants.
 */
function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(random: () => number, values: readonly T[]): T {
  return values[Math.floor(random() * values.length)];
}

/** Drops accents so a display name can become an ASCII username. */
function stripAccents(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/** Months a period spans, used to derive an end date from a start date. */
const PERIOD_MONTHS: Record<Exclude<ObjectiveCyclePeriod, 'Personalizado'>, number> = {
  Anual: 12,
  Semestre: 6,
  Trimestre: 3,
  Bimestre: 2,
  Mes: 1,
};

/** Adds whole months without rolling over into the next month on short months. */
function addMonths(date: Date, months: number): Date {
  const result = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(date.getDate(), lastDay));
  return result;
}

// --- Ciclos de objetivos ---------------------------------------------------

/** Total the real list reports — the generated tail fills up to this count. */
export const OBJECTIVE_CYCLES_TOTAL = 111;

/** Cycles currently visible at the top of the list, newest first. */
const SEEDED_CYCLES: ObjectiveCycleItem[] = [
  {
    id: 'cyc-001',
    name: 'prueba nobis sin inicial reducir',
    period: 'Anual',
    startDate: '06 abril 2026',
    endDate: '06 abril 2027',
    status: 'En progreso',
    objectivesCount: 36,
    progress: 14.12,
  },
  {
    id: 'cyc-002',
    name: 'Prueba ajuste cálculo cumplimiento',
    period: 'Mes',
    startDate: '26 febrero 2026',
    endDate: '26 marzo 2026',
    status: 'En progreso',
    objectivesCount: 96,
    progress: 3.04,
  },
  {
    id: 'cyc-003',
    name: 'TEST123',
    period: 'Mes',
    startDate: '13 diciembre 2025',
    endDate: '13 enero 2026',
    status: 'En progreso',
    objectivesCount: 0,
    progress: 0,
  },
  {
    id: 'cyc-004',
    name: 'Prueba meta y avance negativo 0212',
    period: 'Personalizado',
    startDate: '27 noviembre 2025',
    endDate: '10 diciembre 2025',
    status: 'Finalizado',
    objectivesCount: 6,
    progress: 0,
  },
  {
    id: 'cyc-005',
    name: 'Prueba meta y avance negativo (1)',
    period: 'Personalizado',
    startDate: '27 noviembre 2025',
    endDate: '30 abril 2026',
    status: 'En progreso',
    objectivesCount: 19,
    progress: 5.5,
  },
  {
    id: 'cyc-006',
    name: 'test112132',
    period: 'Anual',
    startDate: '03 diciembre 2025',
    endDate: '03 diciembre 2026',
    status: 'En progreso',
    objectivesCount: 0,
    progress: 0,
  },
  {
    id: 'cyc-007',
    name: 'Prueba meta y avance negativo',
    period: 'Personalizado',
    startDate: '27 noviembre 2025',
    endDate: '10 diciembre 2025',
    status: 'Finalizado',
    objectivesCount: 5,
    progress: 102.5,
  },
  {
    id: 'cyc-008',
    name: 'test13',
    period: 'Mes',
    startDate: '25 noviembre 2025',
    endDate: '25 diciembre 2025',
    status: 'En progreso',
    objectivesCount: 0,
    progress: 0,
  },
  {
    id: 'cyc-009',
    name: 'Test cycle',
    period: 'Mes',
    startDate: '20 noviembre 2025',
    endDate: '20 diciembre 2025',
    status: 'En progreso',
    objectivesCount: 0,
    progress: 0,
  },
  {
    id: 'cyc-010',
    name: 'Ciclo de test David',
    period: 'Mes',
    startDate: '12 noviembre 2025',
    endDate: '12 diciembre 2025',
    status: 'En progreso',
    objectivesCount: 27,
    progress: 39.41,
  },
  {
    id: 'cyc-011',
    name: 'Otro ciclo 7 octubre',
    period: 'Bimestre',
    startDate: '01 octubre 2025',
    endDate: '01 diciembre 2025',
    status: 'En progreso',
    objectivesCount: 0,
    progress: 0,
  },
  {
    id: 'cyc-012',
    name: 'Ciclo 07 octubre JOse',
    period: 'Bimestre',
    startDate: '01 octubre 2025',
    endDate: '01 diciembre 2025',
    status: 'En progreso',
    objectivesCount: 0,
    progress: 0,
  },
];

const CYCLE_NAME_PREFIXES = [
  'Ciclo de objetivos',
  'OKR corporativo',
  'Metas comerciales',
  'Objetivos de área',
  'Ciclo de desempeño',
  'Plan de metas',
  'Objetivos individuales',
  'Ciclo estratégico',
];

const CYCLE_NAME_SUFFIXES = [
  'Comercial',
  'Tecnología',
  'Operaciones',
  'People',
  'Finanzas',
  'Producto',
  'Marketing',
  'Customer Success',
  'Servicio',
  'Regional',
];

const GENERATED_PERIODS: readonly ObjectiveCyclePeriod[] = [
  'Anual',
  'Semestre',
  'Trimestre',
  'Bimestre',
  'Mes',
  'Personalizado',
];

/**
 * Builds the older cycles that sit behind the seeded head. Start dates walk
 * backwards from mid-2025 so the list reads chronologically, and status follows
 * from whether the end date has already passed relative to that walk.
 */
function generateCycles(count: number, startIndex: number): ObjectiveCycleItem[] {
  const random = createRandom(0x5eed01);
  const cursor = new Date(2025, 8, 15);

  return Array.from({ length: count }, (_unused, index) => {
    const period = pick(random, GENERATED_PERIODS);
    // Older the further down the list: between 10 and 40 days per step.
    const daysBack = 10 + Math.floor(random() * 30);
    cursor.setDate(cursor.getDate() - daysBack);
    const startDate = new Date(cursor);
    const spanMonths =
      period === 'Personalizado' ? 1 + Math.floor(random() * 5) : PERIOD_MONTHS[period];
    const endDate = addMonths(startDate, spanMonths);

    // "Now" for the mock: anything already closed reads as finalized.
    const isFinished = endDate < new Date(2026, 7, 3);
    const status: ObjectiveCycleStatus = isFinished ? 'Finalizado' : 'En progreso';

    // A quarter of the cycles never got objectives created, mirroring the real list.
    const isEmpty = random() < 0.25;
    const objectivesCount = isEmpty ? 0 : 3 + Math.floor(random() * 120);
    const progress = isEmpty
      ? 0
      : Math.round((isFinished ? 55 + random() * 50 : random() * 85) * 100) / 100;

    const number = startIndex + index + 1;
    const name = `${pick(random, CYCLE_NAME_PREFIXES)} ${pick(random, CYCLE_NAME_SUFFIXES)} ${startDate.getFullYear()}`;

    return {
      id: `cyc-${number.toString().padStart(3, '0')}`,
      name,
      period,
      startDate: formatLongDate(startDate),
      endDate: formatLongDate(endDate),
      status,
      objectivesCount,
      progress,
    } satisfies ObjectiveCycleItem;
  });
}

export const OBJECTIVE_CYCLES: ObjectiveCycleItem[] = [
  ...SEEDED_CYCLES,
  ...generateCycles(OBJECTIVE_CYCLES_TOTAL - SEEDED_CYCLES.length, SEEDED_CYCLES.length),
];

/** Distinct periods present in the data, for the period filter. */
export const OBJECTIVE_CYCLE_PERIODS: ObjectiveCyclePeriod[] = [
  'Anual',
  'Semestre',
  'Trimestre',
  'Bimestre',
  'Mes',
  'Personalizado',
];

/** Distinct statuses present in the data, for the status filter. */
export const OBJECTIVE_CYCLE_STATUSES: ObjectiveCycleStatus[] = [
  'En progreso',
  'Finalizado',
  'Programado',
];

// --- Usuarios sin objetivos ------------------------------------------------

/** Total the real list reports — the generated tail fills up to this count. */
export const USERS_WITHOUT_OBJECTIVES_TOTAL = 6760;

/** Users currently visible at the top of the list, newest first. */
const SEEDED_USERS: UserWithoutObjectives[] = [
  { id: 'usr-001', username: 'qasdetsetup', name: 'Pruebas Leo', email: 'qasdetsetup@example.co', area: 'Ingeniería' },
  { id: 'usr-002', username: 'rrhhqa', name: 'RRHH SDET', email: 'rrhhqa@example.co', area: 'QA' },
  { id: 'usr-003', username: 'anfersilva', name: 'Anderson Silva', email: 'anfersilva@example.co', area: 'tecnologia' },
  { id: 'usr-004', username: '3099dev01', name: 'dev dev', email: '3099dev01@example.co', area: 'qa' },
  {
    id: 'usr-005',
    username: 'surveys235',
    name: 'Javier Hernández',
    email: 'surveys235@example.co',
    area: 'Desarrollo',
    leader: 'Carlos Rodríguez',
  },
  {
    id: 'usr-006',
    username: 'surveys236',
    name: 'Sofía Díaz',
    email: 'surveys236@example.co',
    area: 'Desarrollo',
    leader: 'Carlos Rodríguez',
  },
  {
    id: 'usr-007',
    username: 'surveys237',
    name: 'Daniel Torres',
    email: 'surveys237@example.co',
    area: 'Desarrollo',
    leader: 'Carlos Rodríguez',
  },
  {
    id: 'usr-008',
    username: 'planesytareasdos',
    name: 'planesytareas DOSsus',
    email: 'planesytareasdos@example.co',
    area: 'tech',
  },
  {
    id: 'usr-009',
    username: 'planesytareastres',
    name: 'planesytareas TRESsus',
    email: 'planesytareastres@example.co',
    area: 'tech',
  },
  {
    id: 'usr-010',
    username: 'adminnuevo',
    name: 'Admin nuevo',
    email: 'adminnuevo@example.co',
    area: 'Tech',
    leader: 'Pruebas Jean cuatro User Editado',
  },
  {
    id: 'usr-011',
    username: 'colaborador',
    name: 'Colaborador test',
    email: 'colaborador@example.co',
    area: 'Tech',
    leader: 'Admin nuevo',
  },
  { id: 'usr-012', username: 'admin', name: 'Admin testt', email: 'admin@example.co', area: 'Tech', leader: 'Admin testt' },
];

const FIRST_NAMES = [
  'Ana', 'Carlos', 'Sofía', 'Daniel', 'Valentina', 'Andrés', 'Camila', 'Julián',
  'Laura', 'Mateo', 'Isabella', 'Santiago', 'Mariana', 'Sebastián', 'Paula',
  'Felipe', 'Daniela', 'Nicolás', 'Juliana', 'Diego', 'Catalina', 'Emilio',
];

const LAST_NAMES = [
  'García', 'Rodríguez', 'Martínez', 'López', 'Hernández', 'González', 'Pérez',
  'Sánchez', 'Ramírez', 'Torres', 'Flores', 'Rivera', 'Gómez', 'Díaz', 'Vargas',
  'Castro', 'Ortiz', 'Moreno', 'Silva', 'Rojas', 'Mendoza', 'Cárdenas',
];

const AREAS = [
  'Tecnología', 'Comercial', 'Operaciones', 'People', 'Finanzas', 'Producto',
  'Marketing', 'Customer Success', 'Servicio al cliente', 'Legal', 'Data',
  'Diseño', 'QA', 'Ingeniería', 'Desarrollo',
];

/**
 * Builds the rest of the directory. Leaders are drawn from names already
 * generated earlier in the list, so every leader shown is a plausible person
 * from the same company rather than an unrelated string. Roughly one in eight
 * users has no leader, matching how the real list renders empty cells.
 */
function generateUsers(count: number, startIndex: number): UserWithoutObjectives[] {
  const random = createRandom(0x5eed02);
  const namePool: string[] = [];

  return Array.from({ length: count }, (_unused, index) => {
    const firstName = pick(random, FIRST_NAMES);
    const lastName = pick(random, LAST_NAMES);
    const name = `${firstName} ${lastName}`;
    const number = startIndex + index + 1;
    const username = `${firstName.toLowerCase()}.${stripAccents(lastName.toLowerCase())}${number}`;
    const hasLeader = namePool.length > 0 && random() > 0.125;
    const leader = hasLeader ? namePool[Math.floor(random() * namePool.length)] : undefined;

    if (namePool.length < 40) namePool.push(name);

    return {
      id: `usr-${number.toString().padStart(4, '0')}`,
      username,
      name,
      email: `${username}@example.co`,
      area: pick(random, AREAS),
      ...(leader ? { leader } : {}),
    } satisfies UserWithoutObjectives;
  });
}

export const USERS_WITHOUT_OBJECTIVES: UserWithoutObjectives[] = [
  ...SEEDED_USERS,
  ...generateUsers(USERS_WITHOUT_OBJECTIVES_TOTAL - SEEDED_USERS.length, SEEDED_USERS.length),
];

/** Distinct areas present in the data, sorted, for the area filter. */
export const USER_AREAS: string[] = [
  ...new Set(USERS_WITHOUT_OBJECTIVES.map((user) => user.area)),
].sort((a, b) => a.localeCompare(b));

// --- Usuarios asignados a un ciclo -----------------------------------------

export const ASSIGNED_USER_STATUSES: AssignedUserStatus[] = [
  'Por iniciar',
  'En progreso',
  'Finalizado',
];

export const PERFORMANCE_LEVELS: PerformanceLevel[] = [
  'Excelente',
  'Sobresaliente',
  'Bueno',
  'Por mejorar',
];

/**
 * The users assigned to the first seeded cycle. Kept explicit because their
 * objective counts add up to that cycle's 27 objectives — a generated set would
 * drift from the total shown in the list and make the two screens disagree.
 *
 * The last six are spelled out down to their individual objectives, because they
 * are the ones the bulk upload has to work against:
 *
 *  - Creating: adding objectives to somebody who already has some is what pushes
 *    a person past the 100% weight rule, and the review step can only show it if
 *    it knows what they already carry. `svalencia`, `mtoro` and `apineda` cover
 *    the three outcomes — already full, half spent, exactly enough room left.
 *  - Editing: every row of an edit file names an objective that should already
 *    exist, so without the names written out there is nothing to match against.
 *    `evargas`, `lcastillo` and `jromero` exist for that, with names deliberately
 *    easy to mistype so the "posible alineación" case is reachable.
 */
const SEEDED_ASSIGNED_USERS: AssignedUser[] = [
  {
    id: 'asg-001',
    username: 'usercreadorqa@example.co',
    name: 'Cursos Empresariales 3099 - Prueba QA',
    email: 'usercreadorqa@example.co',
    area: 'Comercial',
    leader: 'Marta Forero',
    phone: '3018876540',
    status: 'Por iniciar',
    objectivesCount: 6,
    weightPercent: 6,
    progress: 0,
    completedProgress: 0,
    performance: 'Por mejorar',
  },
  {
    id: 'asg-002',
    username: 'martica',
    name: 'marta forero',
    email: 'martica1@example.co',
    area: 'People',
    leader: 'Cristian Rincón',
    phone: '3122019987',
    status: 'En progreso',
    objectivesCount: 10,
    weightPercent: 94,
    progress: 84.69,
    completedProgress: 41.2,
    performance: 'Excelente',
  },
  {
    id: 'asg-003',
    username: 'jlopezsincrorolesypermisos01@example.co',
    name: 'Jorge Lopez',
    email: 'jlopezsincrorolesypermisos01@example.co',
    area: 'Operaciones',
    leader: 'Marta Forero',
    phone: '3134470012',
    status: 'Por iniciar',
    objectivesCount: 1,
    weightPercent: 1,
    progress: 0,
    completedProgress: 0,
    performance: 'Por mejorar',
  },
  {
    id: 'asg-004',
    username: 'surveys19',
    name: 'Alejandro Ramírez',
    email: 'surveys19@example.co',
    area: 'Comercial',
    leader: 'Marta Forero',
    phone: '3009912238',
    status: 'Por iniciar',
    objectivesCount: 2,
    weightPercent: 2,
    progress: 0,
    completedProgress: 0,
    performance: 'Por mejorar',
  },
  {
    id: 'asg-005',
    username: 'crrincon@example.co',
    name: 'Cristian Rincón',
    email: 'crrincon@example.co',
    area: 'Tecnología',
    phone: '3176654420',
    status: 'Por iniciar',
    objectivesCount: 1,
    weightPercent: 1,
    progress: 0,
    completedProgress: 0,
    performance: 'Por mejorar',
  },
  {
    id: 'asg-006',
    username: 'pobjetivos',
    name: 'prueba hhhhh objetivos',
    email: 'pobjetivos@example.co',
    area: 'QA',
    leader: 'Alejandro Ramírez',
    phone: '3193328870',
    status: 'Por iniciar',
    objectivesCount: 1,
    weightPercent: 1,
    progress: 0,
    completedProgress: 0,
    performance: 'Por mejorar',
  },
  /*
    Sofía ya no tiene espacio: sus tres objetivos reparten el 100% completo.
    Cualquier objetivo que le agregue un archivo la pasa del límite, así que el
    revisor no puede resolverlo bajando un solo número — tiene que decidir de
    dónde sale el peso.
  */
  {
    id: 'asg-007',
    username: 'svalencia',
    name: 'Sofía Valencia Ortiz',
    email: 'svalencia@example.co',
    area: 'Comercial',
    leader: 'Marta Forero',
    phone: '3143398821',
    status: 'En progreso',
    objectivesCount: 3,
    weightPercent: 8,
    progress: 46.5,
    completedProgress: 18.2,
    performance: 'Bueno',
    cycleObjectives: [
      {
        id: 'obj-sv-01',
        title: 'Sostener la cuota mensual del canal directo',
        weightPercent: 45,
        measureType: 'Dinero',
        trend: 'Aumentar',
        initialValue: 180000000,
        target: 240000000,
        minProgress: 200000000,
        maxProgress: 280000000,
        description: 'Facturación cerrada por el equipo directo, mes a mes.',
        currentProgress: 205000000,
      },
      {
        id: 'obj-sv-02',
        title: 'Elevar el ticket promedio por cliente',
        weightPercent: 35,
        measureType: 'Dinero',
        trend: 'Aumentar',
        initialValue: 3200000,
        target: 4100000,
        minProgress: null,
        maxProgress: null,
        description: 'Valor promedio de los contratos firmados en el ciclo.',
        currentProgress: 3650000,
      },
      {
        id: 'obj-sv-03',
        title: 'Mantener la satisfacción posventa',
        weightPercent: 20,
        measureType: 'Porcentaje',
        trend: 'Aumentar',
        initialValue: 86,
        target: 93,
        minProgress: 90,
        maxProgress: 97,
        description: 'CSAT de los clientes atendidos después de la firma.',
        currentProgress: 88,
      },
    ],
  },
  /*
    Mauricio va a medias: 55% repartido y 45% libre. Un archivo que le trae 60%
    se pasa por poco, que es el caso más común y el que se arregla con un ajuste
    pequeño en cualquiera de los dos lados.
  */
  {
    id: 'asg-008',
    username: 'mtoro@example.co',
    name: 'Mauricio Toro Gil',
    email: 'mtoro@example.co',
    area: 'Finanzas',
    leader: 'Cristian Rincón',
    phone: '3178840217',
    status: 'En progreso',
    objectivesCount: 2,
    weightPercent: 5,
    progress: 22.8,
    completedProgress: 9.4,
    performance: 'Por mejorar',
    cycleObjectives: [
      {
        id: 'obj-mt-01',
        title: 'Cerrar el presupuesto anual sin desviaciones',
        weightPercent: 30,
        measureType: 'Porcentaje',
        trend: 'Reducir',
        initialValue: 8.4,
        target: 3,
        minProgress: 6,
        maxProgress: 1,
        description: 'Desviación entre lo presupuestado y lo ejecutado.',
        currentProgress: 6.8,
      },
      {
        id: 'obj-mt-02',
        title: 'Reducir los días de cartera vencida',
        weightPercent: 25,
        measureType: 'Numérico',
        trend: 'Reducir',
        initialValue: 62,
        target: 38,
        minProgress: 50,
        maxProgress: 30,
        description: 'Promedio de días de mora de la cartera activa.',
        // Deliberately absent: nadie ha reportado avance sobre este objetivo
        // todavía, que no es lo mismo que haber reportado 0.

      },
    ],
  },
  /*
    Ana es el contraejemplo, y por eso importa: ya tiene un objetivo al 60% y el
    archivo le trae justo el 40% que falta. Nada que corregir — la tarjeta
    aparece en Alineados mostrando las dos mitades y confirmando que cuadran.
    Sin este caso, "ya tiene objetivos en UBITS" se leería como sinónimo de
    error.
  */
  {
    id: 'asg-009',
    username: 'apineda',
    name: 'Ana Pineda Rojas',
    email: 'apineda@example.co',
    area: 'People',
    leader: 'Marta Forero',
    phone: '3005514402',
    status: 'En progreso',
    objectivesCount: 1,
    weightPercent: 3,
    progress: 35,
    completedProgress: 12,
    performance: 'Por mejorar',
    cycleObjectives: [
      {
        id: 'obj-ap-01',
        title: 'Implementar el nuevo modelo de desempeño',
        weightPercent: 60,
        measureType: 'Porcentaje',
        trend: 'Aumentar',
        initialValue: 0,
        target: 100,
        minProgress: 70,
        maxProgress: null,
        description: 'Áreas que ya evalúan con el modelo nuevo.',
        currentProgress: 35,
      },
    ],
  },
  /*
    Los tres siguientes existen para la carga de EDICIÓN.

    Sus cuatro, tres y dos objetivos reparten exactamente 100%, que es el estado
    normal de alguien con objetivos ya definidos — y el que hace interesante
    editarlos: subirle el peso a uno obliga a bajárselo a otro.

    Los nombres están escritos para que el matcher tenga trabajo real. "Reducir el
    costo de infraestructura mensual" pierde el "mensual" en cuanto alguien lo
    retranscribe, y "Aumentar la conversión del embudo de marketing" y "Aumentar la
    conversión del embudo comercial" comparten todo menos la última palabra: dos
    objetivos del mismo usuario que un nombre a medias no puede distinguir.
  */
  {
    id: 'asg-010',
    username: 'evargas@example.co',
    name: 'Esteban Vargas Luna',
    email: 'evargas@example.co',
    area: 'Tecnología',
    leader: 'Cristian Rincón',
    phone: '3182270099',
    status: 'En progreso',
    objectivesCount: 4,
    weightPercent: 9,
    progress: 52.4,
    completedProgress: 21.8,
    performance: 'Bueno',
    cycleObjectives: [
      {
        id: 'obj-ev-01',
        title: 'Reducir el costo de infraestructura mensual',
        weightPercent: 30,
        measureType: 'Dinero',
        trend: 'Reducir',
        initialValue: 84000000,
        target: 62000000,
        minProgress: 78000000,
        maxProgress: 55000000,
        description: 'Factura promedio de nube por mes.',
        currentProgress: 79000000,
      },
      {
        id: 'obj-ev-02',
        title: 'Subir la cobertura de pruebas automatizadas',
        weightPercent: 30,
        measureType: 'Porcentaje',
        trend: 'Aumentar',
        initialValue: 48,
        target: 82,
        minProgress: 65,
        maxProgress: 92,
        description: 'Líneas cubiertas en el repositorio principal.',
        currentProgress: 61,
      },
      {
        id: 'obj-ev-03',
        title: 'Bajar el tiempo de respuesta del API',
        weightPercent: 25,
        measureType: 'Numérico',
        trend: 'Reducir',
        initialValue: 480,
        target: 220,
        minProgress: 400,
        maxProgress: 180,
        description: 'Latencia p95 en milisegundos.',
        currentProgress: 395,
      },
      {
        id: 'obj-ev-04',
        title: 'Documentar los servicios críticos',
        weightPercent: 15,
        measureType: 'Se cumple / No se cumple',
        trend: 'Aumentar',
        initialValue: 0,
        target: 1,
        minProgress: null,
        maxProgress: null,
        description: 'Se cumple con el inventario documentado y revisado.',
        currentProgress: 0,
      },
    ],
  },
  {
    id: 'asg-011',
    username: 'lcastillo',
    name: 'Lucía Castillo Peña',
    email: 'lucia.castillo@example.co',
    area: 'Comercial',
    leader: 'Marta Forero',
    phone: '3126650481',
    status: 'En progreso',
    objectivesCount: 3,
    weightPercent: 7,
    progress: 61.9,
    completedProgress: 30.5,
    performance: 'Bueno',
    cycleObjectives: [
      {
        id: 'obj-lc-01',
        title: 'Aumentar la conversión del embudo comercial',
        weightPercent: 40,
        measureType: 'Porcentaje',
        trend: 'Aumentar',
        initialValue: 12,
        target: 19,
        minProgress: 15,
        maxProgress: 24,
        description: 'Oportunidades cerradas sobre oportunidades creadas.',
        currentProgress: 14,
      },
      {
        id: 'obj-lc-02',
        title: 'Aumentar la conversión del embudo de marketing',
        weightPercent: 35,
        measureType: 'Porcentaje',
        trend: 'Aumentar',
        initialValue: 4.2,
        target: 7,
        minProgress: 5.5,
        maxProgress: 9,
        description: 'Leads que llegan a oportunidad calificada.',
        currentProgress: 5.1,
      },
      {
        id: 'obj-lc-03',
        title: 'Reducir el ciclo de venta promedio',
        weightPercent: 25,
        measureType: 'Numérico',
        trend: 'Reducir',
        initialValue: 68,
        target: 42,
        minProgress: 58,
        maxProgress: 35,
        description: 'Días entre el primer contacto y la firma.',
        currentProgress: 59,
      },
    ],
  },
  {
    id: 'asg-012',
    username: 'jromero@example.co',
    name: 'Javier Romero Díaz',
    email: 'jromero@example.co',
    area: 'Operaciones',
    leader: 'Alejandro Ramírez',
    phone: '3007719964',
    status: 'En progreso',
    objectivesCount: 2,
    weightPercent: 4,
    progress: 38.7,
    completedProgress: 15.1,
    performance: 'Por mejorar',
    cycleObjectives: [
      {
        id: 'obj-jr-01',
        title: 'Ampliar la cobertura de rutas atendidas',
        weightPercent: 55,
        measureType: 'Numérico',
        trend: 'Aumentar',
        initialValue: 14,
        target: 28,
        minProgress: 20,
        maxProgress: 34,
        description: 'Rutas con servicio en operación.',
        currentProgress: 19,
      },
      {
        id: 'obj-jr-02',
        title: 'Reducir las entregas fuera de tiempo',
        weightPercent: 45,
        measureType: 'Porcentaje',
        trend: 'Reducir',
        initialValue: 11.5,
        target: 4,
        minProgress: 8,
        maxProgress: 2,
        description: 'Entregas que incumplen la promesa al cliente.',
        currentProgress: 9.2,
      },
    ],
  },
];

/** Performance band a user's completion falls into. */
function getPerformanceLevel(progress: number): PerformanceLevel {
  if (progress >= 95) return 'Sobresaliente';
  if (progress >= 70) return 'Excelente';
  if (progress >= 40) return 'Bueno';
  return 'Por mejorar';
}

/**
 * Turns a numeric seed into a stable integer so a cycle id always produces the
 * same roster. Uses the digits in the id, which every generated id carries.
 */
function seedFromId(id: string): number {
  return [...id].reduce((total, char) => (total * 31 + char.charCodeAt(0)) >>> 0, 7);
}

/** How many people a cycle is staffed with, independent of its objective count. */
const MIN_ROSTER_SIZE = 18;
const MAX_ROSTER_SIZE = 34;

/**
 * People assigned to the cycle who have not created their objectives yet.
 *
 * Being on a cycle and not having written your objectives is an ordinary state —
 * it is exactly what "Por iniciar" means, and what the "Crear objetivo" action
 * exists for. Modelling it also decouples roster size from `objectivesCount`,
 * so a cycle with five objectives still shows a realistically staffed team
 * instead of five rows and a band of empty card.
 */
function buildPendingMembers(
  cycle: ObjectiveCycleItem,
  random: () => number,
  count: number,
  startNumber: number
): AssignedUser[] {
  return Array.from({ length: count }, (_unused, index) => {
    const number = startNumber + index;
    const firstName = pick(random, FIRST_NAMES);
    const lastName = pick(random, LAST_NAMES);
    const username = `${firstName.toLowerCase()}.${stripAccents(lastName.toLowerCase())}${number}`;

    return {
      id: `${cycle.id}-asg-${number.toString().padStart(2, '0')}`,
      username,
      name: `${firstName} ${lastName}`,
      email: `${username}@example.co`,
      status: 'Por iniciar',
      objectivesCount: 0,
      weightPercent: 0,
      progress: 0,
      completedProgress: 0,
      performance: 'Por mejorar',
    } satisfies AssignedUser;
  });
}

/**
 * Builds the roster for a cycle. Objective counts are distributed so they sum to
 * the cycle's own `objectivesCount`, and weights sum to 100 — otherwise the
 * detail view would contradict the number the list already showed for that row.
 * Anyone beyond the number of objectives to go round joins as a pending member.
 * A cycle with no objectives has no assigned users, which is what makes the
 * empty state reachable.
 */
export function getAssignedUsers(cycle: ObjectiveCycleItem): AssignedUser[] {
  if (cycle.objectivesCount === 0) return [];

  const random = createRandom(seedFromId(cycle.id));
  const rosterSize =
    MIN_ROSTER_SIZE + Math.floor(random() * (MAX_ROSTER_SIZE - MIN_ROSTER_SIZE + 1));

  // The first cycle keeps the exact roster the product shows today; the rest of
  // its team joins as pending members so the table still fills out.
  if (cycle.id === SEEDED_CYCLES[0]?.id) {
    return [
      ...SEEDED_ASSIGNED_USERS,
      ...buildPendingMembers(
        cycle,
        random,
        Math.max(0, rosterSize - SEEDED_ASSIGNED_USERS.length),
        SEEDED_ASSIGNED_USERS.length + 1
      ),
    ];
  }

  // Only as many people as there are objectives can hold one; the remainder of
  // the roster is staffed but hasn't started.
  const contributorCount = Math.min(cycle.objectivesCount, rosterSize);

  // Raw shares, normalised afterwards so both columns total what they should.
  const shares = Array.from({ length: contributorCount }, () => 0.2 + random());
  const sharesTotal = shares.reduce((total, share) => total + share, 0);

  let objectivesLeft = cycle.objectivesCount;
  let weightLeft = 100;

  const contributors = shares.map((share, index) => {
    const isLast = index === contributorCount - 1;
    // The last row absorbs the rounding remainder so the totals stay exact.
    const objectivesCount = isLast
      ? objectivesLeft
      : Math.max(1, Math.min(objectivesLeft - (contributorCount - index - 1), Math.round((share / sharesTotal) * cycle.objectivesCount)));
    const weightPercent = isLast
      ? Math.round(weightLeft * 100) / 100
      : Math.round((share / sharesTotal) * 100 * 100) / 100;

    objectivesLeft -= objectivesCount;
    weightLeft -= weightPercent;

    // Individual progress scatters around the cycle's own figure so the roster
    // averages out to roughly what the list reported.
    const spread = 0.45 + random() * 1.3;
    const progress = Math.max(0, Math.round(Math.min(cycle.progress * spread, 118) * 100) / 100);
    const status: AssignedUserStatus =
      progress <= 0 ? 'Por iniciar' : progress >= 100 ? 'Finalizado' : 'En progreso';
    // Part of the advance already closed out; the rest is still in flight.
    const completedProgress = Math.round(progress * (0.3 + random() * 0.55) * 100) / 100;

    const number = index + 1;
    const firstName = pick(random, FIRST_NAMES);
    const lastName = pick(random, LAST_NAMES);
    const username = `${firstName.toLowerCase()}.${stripAccents(lastName.toLowerCase())}${number}`;

    return {
      id: `${cycle.id}-asg-${number.toString().padStart(2, '0')}`,
      username,
      name: `${firstName} ${lastName}`,
      email: `${username}@example.co`,
      area: pick(random, AREAS),
      leader: `${pick(random, FIRST_NAMES)} ${pick(random, LAST_NAMES)}`,
      status,
      objectivesCount,
      weightPercent,
      progress,
      completedProgress,
      performance: getPerformanceLevel(progress),
    } satisfies AssignedUser;
  });

  return [
    ...contributors,
    ...buildPendingMembers(cycle, random, rosterSize - contributorCount, contributorCount + 1),
  ];
}

// --- Directorio de UBITS ---------------------------------------------------

/**
 * UBITS users who are NOT on the cycle.
 *
 * Feeds two things: the picker that lets a reviewer assign a file identifier to
 * the right person, and the "possible association" cases — a file that names
 * someone by a personal e-mail or a document typed with a check digit lands
 * here as a proposal instead of as a confirmed match.
 *
 * Each of the three ways UBITS accepts a username is represented on purpose:
 * an e-mail (`lgomez@example.co`), a document number (`1032456789`) and a
 * nickname (`nvargas`).
 */
export const UBITS_DIRECTORY: RosterUser[] = [
  {
    username: 'lgomez@example.co',
    name: 'Laura Gómez Ríos',
    email: 'lgomez@example.co',
    documentId: '52487931',
    area: 'Comercial',
    phone: '3105558842',
    leader: 'Marta Forero',
  },
  {
    username: '1032456789',
    name: 'Andrés Beltrán Cano',
    email: 'abeltran@example.co',
    documentId: '1032456789',
    area: 'Operaciones',
    phone: '3117742019',
    leader: 'Cristian Rincón',
  },
  {
    username: 'nvargas',
    name: 'Natalia Vargas Peña',
    email: 'natalia.vargas@example.co',
    documentId: '16506333',
    area: 'Tecnología',
    phone: '3004419978',
    leader: 'Alejandro Ramírez',
  },
  {
    username: 'dcastano@example.co',
    name: 'Daniel Castaño Mesa',
    email: 'dcastano@example.co',
    documentId: '79845120',
    area: 'Finanzas',
    phone: '3212206654',
    leader: 'Marta Forero',
  },
  {
    username: 'pmoreno',
    name: 'Paula Moreno Silva',
    email: 'paula.moreno@example.co',
    documentId: '1018273645',
    area: 'People',
    phone: '3159981047',
    leader: 'Cristian Rincón',
  },
  {
    username: 'jhenao@example.co',
    name: 'Julián Henao Ospina',
    email: 'jhenao@example.co',
    documentId: '71203948',
    area: 'Comercial',
    phone: '3183370265',
    leader: 'Marta Forero',
  },
  {
    username: 'ctorres',
    name: 'Carolina Torres Duque',
    email: 'carolina.torres@example.co',
    documentId: '43871209',
    area: 'Marketing',
    phone: '3026648831',
    leader: 'Alejandro Ramírez',
  },
  {
    username: 'rmejia@example.co',
    name: 'Ricardo Mejía Ríos',
    email: 'rmejia@example.co',
    documentId: '80234571',
    area: 'Operaciones',
    phone: '3145520973',
    leader: 'Cristian Rincón',
  },
];
