import type {
  ObjectiveCycleItem,
  ObjectiveCyclePeriod,
  ObjectiveCycleStatus,
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
    objectivesCount: 21,
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
