/**
 * Comparative Dashboard Mock Data
 * Specifically for Phase 5A: Favorabilidad Tab
 */

import type { SurveyListItem } from './types';


export const COMPARATIVE_SURVEYS_LIST: SurveyListItem[] = [
  // Clima (Added 2025/2026)
  { id: "c2026-1", name: "Clima Organizacional - Q1 2026", type: "Clima", status: "Finalizado", statusVariant: "positive", startDate: "15 ene 2026", endDate: "30 ene 2026", participants: "520", progress: 100, origin: "externa" },
  { id: "c2025-4", name: "Clima Organizacional - Q4 2025", type: "Clima", status: "Finalizado", statusVariant: "positive", startDate: "10 oct 2025", endDate: "25 oct 2025", participants: "505", progress: 100, origin: "externa" },
  { id: "c2025-3", name: "Clima Organizacional - Q3 2025", type: "Clima", status: "Finalizado", statusVariant: "positive", startDate: "12 jul 2025", endDate: "28 jul 2025", participants: "495", progress: 100, origin: "interna" },
  { id: "c2025-2", name: "Clima Organizacional - Q2 2025", type: "Clima", status: "Finalizado", statusVariant: "positive", startDate: "05 abr 2025", endDate: "20 abr 2025", participants: "480", progress: 100, origin: "interna" },
  { id: "c2025-1", name: "Clima Organizacional - Q1 2025", type: "Clima", status: "Finalizado", statusVariant: "positive", startDate: "15 ene 2025", endDate: "30 ene 2025", participants: "470", progress: 100, origin: "externa" },

  // Clima (2024 items)
  { id: "c2", name: "Clima Organizacional - Q4 2024", type: "Clima", status: "Finalizado", statusVariant: "positive", startDate: "10 oct 2024", endDate: "25 oct 2024", participants: "432", progress: 100, origin: "externa" },
  { id: "c3", name: "Clima Organizacional - Q3 2024", type: "Clima", status: "Finalizado", statusVariant: "positive", startDate: "12 jul 2024", endDate: "28 jul 2024", participants: "415", progress: 100, origin: "interna" },
  { id: "c4", name: "Clima Organizacional - Q2 2024", type: "Clima", status: "Finalizado", statusVariant: "positive", startDate: "05 abr 2024", endDate: "20 abr 2024", participants: "390", progress: 100, origin: "interna" },
  { id: "c5", name: "Clima Organizacional - Q1 2024", type: "Clima", status: "Finalizado", statusVariant: "positive", startDate: "15 ene 2024", endDate: "30 ene 2024", participants: "385", progress: 100, origin: "externa" },

  // Cultura (Added 2025/2026)
  { id: "cu2026", name: "Cultura y Valores - 2026", type: "Cultura", status: "Finalizado", statusVariant: "positive", startDate: "01 mar 2026", endDate: "15 mar 2026", participants: "550", progress: 100, origin: "externa" },
  { id: "cu2025", name: "Cultura y Valores - 2025", type: "Cultura", status: "Finalizado", statusVariant: "positive", startDate: "01 mar 2025", endDate: "15 mar 2025", participants: "530", progress: 100, origin: "interna" },
  { id: "cu1", name: "Cultura y Valores - 2024", type: "Cultura", status: "Finalizado", statusVariant: "positive", startDate: "01 mar 2024", endDate: "15 mar 2024", participants: "510", progress: 100, origin: "interna" },
  { id: "cu4", name: "Alineación de Propósito - 2024", type: "Cultura", status: "Finalizado", statusVariant: "positive", startDate: "10 nov 2024", endDate: "25 nov 2024", participants: "445", progress: 100, origin: "externa" },

  // NPS (Added 2025/2026)
  { id: "n2026-1", name: "NPS Clientes Premium Q1 2026", type: "NPS", status: "Finalizado", statusVariant: "positive", startDate: "01 feb 2026", endDate: "15 feb 2026", participants: "950", progress: 100, origin: "externa" },
  { id: "n2025-4", name: "NPS Clientes Premium Q4 2025", type: "NPS", status: "Finalizado", statusVariant: "positive", startDate: "01 nov 2025", endDate: "15 nov 2025", participants: "920", progress: 100, origin: "interna" },
  { id: "n2", name: "NPS Clientes Premium Q4 2024", type: "NPS", status: "Finalizado", statusVariant: "positive", startDate: "01 nov 2024", endDate: "15 nov 2024", participants: "820", progress: 100, origin: "interna" },
  { id: "n3", name: "NPS Clientes Premium Q3 2024", type: "NPS", status: "Finalizado", statusVariant: "positive", startDate: "01 ago 2024", endDate: "15 ago 2024", participants: "780", progress: 100, origin: "externa" },
];


export const COMPARATIVE_FAVORABILITY_DATA = {
  mainMetric: {
    id: 'fav-q4-2024',
    label: 'Favorabilidad',
    value: 78.4,
    previousValue: 72.4,
    delta: 6.0,
    deltaPercentage: 8.3,
    trend: 'up' as const,
    description: 'Q4 2024 (BASE)',
    totalResponses: 450
  },
  
  // Vista Detalle: Distribution by period
  distributionByPeriod: [
    {
      period: 'Q4 2024 (BASE)',
      total: 450,
      segments: [
        { id: 'fav-1', label: 'Favorable', value: 78.4, percentage: 78.4, tone: 'positive' as const },
        { id: 'neu-1', label: 'Neutral', value: 12.6, percentage: 12.6, tone: 'neutral' as const },
        { id: 'des-1', label: 'Desfavorable', value: 9.0, percentage: 9.0, tone: 'negative' as const },
      ]
    },
    {
      period: 'Q3 2024',
      total: 430,
      segments: [
        { id: 'fav-2', label: 'Favorable', value: 72.4, percentage: 72.4, tone: 'positive' as const },
        { id: 'neu-2', label: 'Neutral', value: 15.6, percentage: 15.6, tone: 'neutral' as const },
        { id: 'des-2', label: 'Desfavorable', value: 12.0, percentage: 12.0, tone: 'negative' as const },
      ]
    },
    {
      period: 'Q2 2024',
      total: 425,
      segments: [
        { id: 'fav-3', label: 'Favorable', value: 70.8, percentage: 70.8, tone: 'positive' as const },
        { id: 'neu-3', label: 'Neutral', value: 17.2, percentage: 17.2, tone: 'neutral' as const },
        { id: 'des-3', label: 'Desfavorable', value: 12.0, percentage: 12.0, tone: 'negative' as const },
      ]
    },
    {
      period: 'Q4 2023',
      total: 410,
      segments: [
        { id: 'fav-4', label: 'Favorable', value: 68.5, percentage: 68.5, tone: 'positive' as const },
        { id: 'neu-4', label: 'Neutral', value: 19.5, percentage: 19.5, tone: 'neutral' as const },
        { id: 'des-4', label: 'Desfavorable', value: 12.0, percentage: 12.0, tone: 'negative' as const },
      ]
    },
    {
      period: 'Q1 2024',
      total: 390,
      segments: [
        { id: 'fav-5', label: 'Favorable', value: 65.2, percentage: 65.2, tone: 'positive' as const },
        { id: 'neu-5', label: 'Neutral', value: 20.8, percentage: 20.8, tone: 'neutral' as const },
        { id: 'des-5', label: 'Desfavorable', value: 14.0, percentage: 14.0, tone: 'negative' as const },
      ]
    }
  ],

  // Vista Tendencia: Evolution of favorability
  trendData: {
    id: 'fav-trend',
    label: 'Evolución de Favorabilidad',
    data: [
      { label: 'Q4 2024', value: 78.4, total: 450 },
      { label: 'Q1 2025', value: 80.2, total: 470 },
      { label: 'Q2 2025', value: 81.5, total: 480 },
      { label: 'Q3 2025', value: 83.1, total: 495 },
      { label: 'Q4 2025', value: 84.8, total: 505 },
      { label: 'Q1 2026', value: 86.5, total: 520 },
    ],
    unit: '%'
  },

  // Footer comparative deltas
  comparisons: [
    { label: 'Q1 2026 (BASE)', value: 86.5, isBase: true },
    { label: 'Q4 2025', value: 84.8, delta: 1.7, trend: 'up' as const },
    { label: 'Q3 2025', value: 83.1, delta: 3.4, trend: 'up' as const },
    { label: 'Q2 2025', value: 81.5, delta: 5.0, trend: 'up' as const },
    { label: 'Q1 2025', value: 80.2, delta: 6.3, trend: 'up' as const },
  ]
};

export const COMPARATIVE_PARTICIPATION_DATA = {
  mainMetric: {
    id: 'part-q4-2024',
    label: 'PARTICIPACIÓN',
    value: 92.1,
    previousValue: 90.1,
    delta: 2.0,
    deltaPercentage: 2.2,
    trend: 'up' as const,
    description: 'Q4 2024 (BASE)',
    totalResponses: 520
  },
  
  // Vista Detalle: Distribution by period
  distributionByPeriod: [
    {
      period: 'Q4 2024 (BASE)',
      total: 520,
      segments: [
        { id: 'part-res-1', label: 'Respondió', value: 92.1, percentage: 92.1, tone: 'positive' as const },
        { id: 'part-pen-1', label: 'Pendiente', value: 7.9, percentage: 7.9, tone: 'neutral' as const },
      ]
    },
    {
      period: 'Q3 2024',
      total: 500,
      segments: [
        { id: 'part-res-2', label: 'Respondió', value: 90.1, percentage: 90.1, tone: 'positive' as const },
        { id: 'part-pen-2', label: 'Pendiente', value: 9.9, percentage: 9.9, tone: 'neutral' as const },
      ]
    },
    {
      period: 'Q2 2024',
      total: 480,
      segments: [
        { id: 'part-res-3', label: 'Respondió', value: 88.5, percentage: 88.5, tone: 'positive' as const },
        { id: 'part-pen-3', label: 'Pendiente', value: 11.5, percentage: 11.5, tone: 'neutral' as const },
      ]
    },
    {
      period: 'Q1 2024',
      total: 450,
      segments: [
        { id: 'part-res-4', label: 'Respondió', value: 87.4, percentage: 87.4, tone: 'positive' as const },
        { id: 'part-pen-4', label: 'Pendiente', value: 12.6, percentage: 12.6, tone: 'neutral' as const },
      ]
    },
    {
      period: 'Q1 2024',
      total: 420,
      segments: [
        { id: 'part-res-5', label: 'Respondió', value: 85.0, percentage: 85.0, tone: 'positive' as const },
        { id: 'part-pen-5', label: 'Pendiente', value: 15.0, percentage: 15.0, tone: 'neutral' as const },
      ]
    }
  ],

  // Vista Tendencia: Evolution of participation
  trendData: {
    id: 'part-trend',
    label: 'Evolución de Participación',
    data: [
      { label: 'Q4 2024', value: 92.1, total: 520 },
      { label: 'Q1 2025', value: 93.0, total: 535 },
      { label: 'Q2 2025', value: 94.2, total: 540 },
      { label: 'Q3 2025', value: 94.8, total: 550 },
      { label: 'Q4 2025', value: 95.5, total: 565 },
      { label: 'Q1 2026', value: 96.2, total: 580 },
    ],
    unit: '%'
  },

  // Footer comparative deltas
  comparisons: [
    { label: 'Q1 2026 (BASE)', value: 96.2, isBase: true },
    { label: 'Q4 2025', value: 95.5, delta: 0.7, trend: 'up' as const },
    { label: 'Q3 2025', value: 94.8, delta: 1.4, trend: 'up' as const },
    { label: 'Q2 2025', value: 94.2, delta: 2.0, trend: 'up' as const },
    { label: 'Q1 2025', value: 93.0, delta: 3.2, trend: 'up' as const },
  ]
};

export const COMPARATIVE_NPS_DATA = {
  mainMetric: {
    id: 'nps-q4-2024',
    label: 'NPS',
    value: 42,
    previousValue: 40,
    delta: 2,
    trend: 'up' as const,
    description: 'Q4 2024 (BASE)',
    totalResponses: 450
  },
  
  // Vista Detalle: Distribution by period
  distributionByPeriod: [
    {
      period: 'Q4 2024 (BASE)',
      total: 450,
      segments: [
        { id: 'prom-1', label: 'PROM.', value: 60, percentage: 60, tone: 'positive' as const },
        { id: 'neu-1', label: 'NEUT.', value: 22, percentage: 22, tone: 'neutral' as const },
        { id: 'det-1', label: 'DET.', value: 18, percentage: 18, tone: 'negative' as const },
      ]
    },
    {
      period: 'Q3 2024',
      total: 440,
      segments: [
        { id: 'prom-2', label: 'PROM.', value: 59, percentage: 59, tone: 'positive' as const },
        { id: 'neu-2', label: 'NEUT.', value: 22, percentage: 22, tone: 'neutral' as const },
        { id: 'det-2', label: 'DET.', value: 19, percentage: 19, tone: 'negative' as const },
      ]
    },
    {
      period: 'Q2 2024',
      total: 430,
      segments: [
        { id: 'prom-3', label: 'PROM.', value: 62, percentage: 62, tone: 'positive' as const },
        { id: 'neu-3', label: 'NEUT.', value: 21, percentage: 21, tone: 'neutral' as const },
        { id: 'det-3', label: 'DET.', value: 17, percentage: 17, tone: 'negative' as const },
      ]
    },
    {
      period: 'Q1 2024',
      total: 400,
      segments: [
        { id: 'prom-4', label: 'PROM.', value: 58, percentage: 58, tone: 'positive' as const },
        { id: 'neu-4', label: 'NEUT.', value: 27, percentage: 27, tone: 'neutral' as const },
        { id: 'det-4', label: 'DET.', value: 15, percentage: 15, tone: 'negative' as const },
      ]
    },
    {
      period: 'Q1 2024',
      total: 380,
      segments: [
        { id: 'prom-5', label: 'PROM.', value: 55, percentage: 55, tone: 'positive' as const },
        { id: 'neu-5', label: 'NEUT.', value: 28, percentage: 28, tone: 'neutral' as const },
        { id: 'det-5', label: 'DET.', value: 17, percentage: 17, tone: 'negative' as const },
      ]
    }
  ],

  // Vista Tendencia: Evolution of NPS
  trendData: {
    id: 'nps-trend',
    label: 'Evolución de NPS',
    data: [
      { label: 'Q4 2024', value: 42, total: 450 },
      { label: 'Q1 2025', value: 45, total: 470 },
      { label: 'Q2 2025', value: 48, total: 485 },
      { label: 'Q3 2025', value: 50, total: 500 },
      { label: 'Q4 2025', value: 52, total: 515 },
      { label: 'Q1 2026', value: 55, total: 530 },
    ],
    unit: ''
  },

  // Footer comparative deltas
  comparisons: [
    { label: 'Q1 2026 (BASE)', value: 55, isBase: true, total: 530 },
    { label: 'Q4 2025', value: 52, delta: 3, trend: 'up' as const, total: 515 },
    { label: 'Q3 2025', value: 50, delta: 5, trend: 'up' as const, total: 500 },
    { label: 'Q2 2025', value: 48, delta: 7, trend: 'up' as const, total: 485 },
    { label: 'Q1 2025', value: 45, delta: 10, trend: 'up' as const, total: 470 },
  ]
};

// Generic Keys for dynamic mapping:
// currentScore = latest selected
// p1 = second latest
// p2 = third latest
// p3 = fourth latest
// p4 = fifth latest

export const COMPARATIVE_DIMENSIONS_DATA = [
  {
    id: "dim-1",
    name: "Liderazgo",
    description: "Confianza y efectividad en el liderazgo",
    currentScore: 82,
    p1: 68,
    p2: 66,
    p3: 64, 
    p4: 60,
    delta: 14,
    trend: 'up' as const,
    responses: 1240
  },
  {
    id: "dim-2",
    name: "Reconocimiento",
    description: "Valoración del trabajo y logros",
    currentScore: 76,
    p1: 64,
    p2: 62,
    p3: 60, 
    p4: 58,
    delta: 12,
    trend: 'up' as const,
    responses: 1150
  },
  {
    id: "dim-3",
    name: "Comunicación",
    description: "Claridad y transparencia interna",
    currentScore: 74,
    p1: 65,
    p2: 64,
    p3: 64, 
    p4: 62,
    delta: 9,
    trend: 'up' as const,
    responses: 1100
  },
  {
    id: "dim-4",
    name: "Cultura",
    description: "Valores y ambiente organizacional",
    currentScore: 79,
    p1: 71,
    p2: 70,
    p3: 69, 
    p4: 68,
    delta: 8,
    trend: 'up' as const,
    responses: 1180
  },
  {
    id: "dim-5",
    name: "Desarrollo",
    description: "Oportunidades de crecimiento",
    currentScore: 72,
    p1: 75,
    p2: 75,
    p3: 74, 
    p4: 72,
    delta: -3,
    trend: 'down' as const,
    responses: 980
  },
  {
    id: "dim-6",
    name: "Bienestar",
    description: "Salud física y mental",
    currentScore: 85,
    p1: 82,
    p2: 81,
    p3: 80, 
    p4: 78,
    delta: 3,
    trend: 'up' as const,
    responses: 1200
  },
  {
    id: "dim-7",
    name: "Carga laboral",
    description: "Distribución de tareas y tiempos",
    currentScore: 68,
    p1: 70,
    p2: 71,
    p3: 72, 
    p4: 74,
    delta: -2,
    trend: 'down' as const,
    responses: 1050
  },
  {
    id: "dim-8",
    name: "Pertenencia",
    description: "Identificación con la empresa",
    currentScore: 90,
    p1: 88,
    p2: 86,
    p3: 85, 
    p4: 82,
    delta: 2,
    trend: 'up' as const,
    responses: 1300
  },
  {
    id: "dim-9",
    name: "Innovación",
    description: "Capacidad de generar nuevas ideas y procesos (Nueva en 2026)",
    currentScore: 88,
    p1: null,
    p2: null,
    p3: null, 
    p4: null,
    delta: null,
    trend: 'up' as const,
    responses: 520
  },
  {
    id: "dim-10",
    name: "Infraestructura",
    description: "Calidad de las instalaciones y herramientas físicas",
    currentScore: 75,
    p1: 72,
    p2: 70,
    p3: 68, 
    p4: 65,
    delta: 3,
    trend: 'up' as const,
    responses: 1100
  }
];

export const CULTURA_DIMENSIONS_DATA = [
  {
    id: "cdim-1",
    name: "Valores Vivenciados",
    description: "Grado en que se practican los valores",
    currentScore: 88,
    p1: 88,
    p2: 80,
    p3: 78, 
    p4: 75,
    delta: 0,
    trend: 'neutral' as const,
    responses: 1100
  },
  {
    id: "cdim-2",
    name: "Alineación Estratégica",
    description: "Conexión con el propósito",
    currentScore: 84,
    p1: 78,
    p2: 76,
    p3: 75, 
    p4: 72,
    delta: 6,
    trend: 'up' as const,
    responses: 1050
  },
  {
    id: "cdim-3",
    name: "Innovación y Agilidad",
    description: "Capacidad de adaptación (Sin historial en Sentimiento)",
    currentScore: 72,
    p1: 74,
    p2: 75,
    p3: 73, 
    p4: 70,
    delta: -2,
    trend: 'down' as const,
    responses: 980
  },
  {
    id: "cdim-4",
    name: "Empoderamiento",
    description: "Autonomía en la toma de decisiones",
    currentScore: 79,
    p1: 72,
    p2: 70,
    p3: 68, 
    p4: 65,
    delta: 7,
    trend: 'up' as const,
    responses: 1020
  },
  {
    id: "cdim-5",
    name: "Colaboración Transversal",
    description: "Silo vs Trabajo en equipo",
    currentScore: 76,
    p1: 70,
    p2: 68,
    p3: 65, 
    p4: 62,
    delta: 6,
    trend: 'up' as const,
    responses: 950
  },
  {
    id: "cdim-6",
    name: "Liderazgo Inspirador",
    description: "Visión y capacidad de guiar de los líderes (Nueva dimensión)",
    currentScore: 85,
    delta: 0,
    trend: 'neutral' as const,
    responses: 480
    // p1-p4 will be undefined
  },
  {
    id: "cdim-7",
    name: "Bienestar Emocional",
    description: "Fomento de la salud mental y equilibrio vida-trabajo",
    currentScore: 78,
    p1: null, // No responses
    p2: undefined, // Not in survey
    p3: 72,
    p4: null,
    delta: 6,
    trend: 'up' as const,
    responses: 1150
  },
  {
    id: "cdim-8",
    name: "Bienestar y Equilibrio",
    description: "Equilibrio vida-trabajo (Solo datos históricos antiguos)",
    currentScore: null,
    p1: null,
    p2: 65,
    p3: 60, 
    p4: null,
    delta: null,
    trend: 'up' as const,
    responses: 0
  }
];



export const COMPARATIVE_QUESTIONS_DATA = [
  {
    id: "q-1",
    question: "Mi líder directo se preocupa por mi bienestar",
    dimension: "Liderazgo",
    currentScore: 85,
    p1: 72,
    p2: 70,
    trend: [65, 68, 70, 72, 85],
    delta: 13,
    responses: 450
  },
  {
    id: "q-2",
    question: "Recibo feedback constructivo regularmente de mi manager",
    dimension: "Liderazgo",
    currentScore: 78,
    p1: 65,
    p2: 62,
    trend: [58, 60, 62, 65, 78],
    delta: 13,
    responses: 445
  },
  {
    id: "q-3",
    question: "Tengo las herramientas necesarias para mi trabajo",
    dimension: "Desarrollo",
    currentScore: 92,
    p1: 90,
    p2: 88,
    trend: [85, 87, 88, 90, 92],
    delta: 2,
    responses: 452
  },
  {
    id: "q-4",
    question: "Me siento valorado por mis compañeros de equipo",
    dimension: "Cultura",
    currentScore: 81,
    p1: 82,
    p2: 80,
    trend: [78, 79, 80, 82, 81],
    delta: -1,
    responses: 448
  },
  {
    id: "q-5",
    question: "Entiendo cómo mi trabajo contribuye a los objetivos",
    dimension: "Comunicación",
    currentScore: 85,
    p1: 85,
    p2: 84,
    trend: [80, 82, 84, 85, 85],
    delta: 0,
    responses: 450
  },
  {
    id: "q-6",
    question: "Existe un ambiente de respeto y colaboración",
    dimension: "Cultura",
    currentScore: 76,
    p1: 70,
    p2: 68,
    trend: [60, 65, 68, 70, 76],
    delta: 5,
    responses: 1010
  }
];

export const CULTURA_QUESTIONS_DATA = [
  {
    id: "cq-1",
    question: "Los líderes de UBITS actúan de acuerdo con nuestros valores",
    dimension: "Valores Vivenciados",
    currentScore: 90,
    p1: 82,
    p2: 78,
    trend: [70, 75, 78, 82, 90],
    delta: 8,
    responses: 1100
  },
  {
    id: "cq-2",
    question: "Me siento inspirado por el propósito de la compañía",
    dimension: "Alineación Estratégica",
    currentScore: 85,
    p1: 78,
    p2: 75,
    trend: [65, 70, 75, 78, 85],
    delta: 7,
    responses: 1050
  },
  {
    id: "cq-3",
    question: "En mi equipo se fomenta la experimentación y el aprendizaje",
    dimension: "Innovación y Agilidad",
    currentScore: 75,
    p1: 78,
    p2: 76,
    trend: [70, 72, 76, 78, 75],
    delta: -3,
    responses: 980
  },
  {
    id: "cq-4",
    question: "Siento que tengo autonomía para tomar decisiones en mi rol",
    dimension: "Empoderamiento",
    currentScore: 82,
    p1: 74,
    p2: 70,
    trend: [60, 65, 70, 74, 82],
    delta: 8,
    responses: 1020
  },
  {
    id: "cq-5",
    question: "Los líderes tienen una visión clara del futuro",
    dimension: "Liderazgo Inspirador",
    currentScore: 85,
    p1: null,
    p2: null,
    trend: [],
    delta: null,
    responses: 480
  },
  {
    id: "cq-6",
    question: "Tengo los recursos necesarios para hacer mi trabajo",
    dimension: "Recursos y Herramientas",
    currentScore: null,
    p1: 75,
    p2: 72,
    trend: [68, 70, 72, 75],
    delta: null,
    responses: 0
  },
  {
    id: "cq-7",
    question: "La empresa se preocupa por mi bienestar personal",
    dimension: "Bienestar y Equilibrio",
    currentScore: null,
    p1: null,
    p2: 65,
    trend: [60, 65],
    delta: null,
    responses: 0
  },
  {
    id: "cq-8",
    question: "Los líderes promueven un balance saludable entre vida y trabajo",
    dimension: "Bienestar Emocional",
    currentScore: 82,
    delta: 0,
    responses: 1150
    // p1-p4 undefined
  }
];

export const CULTURA_FAVORABILITY_DATA = {
  mainMetric: {
    id: 'cu-fav-2026',
    label: 'Favorabilidad',
    value: 86.5,
    previousValue: 84.8,
    delta: 1.7,
    deltaPercentage: 2.0,
    trend: 'up' as const,
    description: 'Cultura 2026 (BASE)',
    totalResponses: 550
  },
  distributionByPeriod: [
    {
      surveyId: 'cu2026',
      period: 'Cultura 2026 (BASE)',
      total: 550,
      segments: [
        { id: 'cu-fav-pos-1', label: 'Favorable', value: 86.5, percentage: 86.5, tone: 'positive' as const },
        { id: 'cu-fav-neu-1', label: 'Neutral', value: 10, percentage: 10, tone: 'neutral' as const },
        { id: 'cu-fav-neg-1', label: 'Desfavorable', value: 3.5, percentage: 3.5, tone: 'negative' as const },
      ]
    },
    {
      surveyId: 'cu2025',
      period: 'Cultura 2025',
      total: 530,
      segments: [
        { id: 'cu-fav-pos-2', label: 'Favorable', value: 84.8, percentage: 84.8, tone: 'positive' as const },
        { id: 'cu-fav-neu-2', label: 'Neutral', value: 11, percentage: 11, tone: 'neutral' as const },
        { id: 'cu-fav-neg-2', label: 'Desfavorable', value: 4.2, percentage: 4.2, tone: 'negative' as const },
      ]
    },
    {
      surveyId: 'cu1',
      period: 'Cultura 2024',
      total: 510,
      segments: [
        { id: 'cu-fav-pos-3', label: 'Favorable', value: 82.0, percentage: 82.0, tone: 'positive' as const },
        { id: 'cu-fav-neu-3', label: 'Neutral', value: 12, percentage: 12, tone: 'neutral' as const },
        { id: 'cu-fav-neg-3', label: 'Desfavorable', value: 6.0, percentage: 6.0, tone: 'negative' as const },
      ]
    },
    {
      surveyId: 'cu4',
      period: 'Alineación 2024',
      total: 480,
      segments: [
        { id: 'cu-fav-pos-4', label: 'Favorable', value: 78.5, percentage: 78.5, tone: 'positive' as const },
        { id: 'cu-fav-neu-4', label: 'Neutral', value: 15, percentage: 15, tone: 'neutral' as const },
        { id: 'cu-fav-neg-4', label: 'Desfavorable', value: 6.5, percentage: 6.5, tone: 'negative' as const },
      ]
    }
  ],
  trendData: {
    id: 'cu-fav-trend',
    label: 'Evolución de Favorabilidad Cultura',
    data: [
      { label: 'Alineación 2024', value: 78.5, total: 480 },
      { label: 'Cultura 2024', value: 82.0, total: 510 },
      { label: 'Cultura 2025', value: 84.8, total: 530 },
      { label: 'Cultura 2026', value: 86.5, total: 550 },
    ],
    unit: '%'
  },
  comparisons: [
    { surveyId: 'cu2026', label: '2026 (BASE)', value: 86.5, isBase: true },
    { surveyId: 'cu2025', label: '2025', value: 84.8, delta: 1.7, trend: 'up' as const },
    { surveyId: 'cu1', label: '2024', value: 82.0, delta: 4.5, trend: 'up' as const },
    { surveyId: 'cu4', label: 'Alineación 2024', value: 78.5, delta: 8.0, trend: 'up' as const },
  ]
};

export const CULTURA_PARTICIPATION_DATA = {
  mainMetric: {
    id: 'cu-part-2026',
    label: 'Participación',
    value: 94.5,
    previousValue: 92.5,
    delta: 2.0,
    deltaPercentage: 2.1,
    trend: 'up' as const,
    description: 'Cultura 2026 (BASE)',
    totalResponses: 550
  },
  distributionByPeriod: [
    {
      surveyId: 'cu2026',
      period: 'Cultura 2026 (BASE)',
      total: 550,
      segments: [
        { id: 'cu-part-1', label: 'Participó', value: 92, percentage: 92, tone: 'positive' as const },
        { id: 'cu-nopart-1', label: 'No participó', value: 8, percentage: 8, tone: 'negative' as const },
      ]
    },
    {
      surveyId: 'cu2025',
      period: 'Cultura 2025',
      total: 530,
      segments: [
        { id: 'cu-part-2', label: 'Participó', value: 88, percentage: 88, tone: 'positive' as const },
        { id: 'cu-nopart-2', label: 'No participó', value: 12, percentage: 12, tone: 'negative' as const },
      ]
    },
    {
      surveyId: 'cu1',
      period: 'Cultura 2024',
      total: 510,
      segments: [
        { id: 'cu-part-3', label: 'Participó', value: 85, percentage: 85, tone: 'positive' as const },
        { id: 'cu-nopart-3', label: 'No participó', value: 15, percentage: 15, tone: 'negative' as const },
      ]
    },
    {
      surveyId: 'cu4',
      period: 'Alineación 2024',
      total: 480,
      segments: [
        { id: 'cu-part-4', label: 'Participó', value: 80, percentage: 80, tone: 'positive' as const },
        { id: 'cu-nopart-4', label: 'No participó', value: 20, percentage: 20, tone: 'negative' as const },
      ]
    }
  ],
  trendData: {
    id: 'cu-part-trend',
    label: 'Evolución de Participación Cultura',
    data: [
      { label: 'Alineación 2024', value: 80, total: 480 },
      { label: 'Cultura 2024', value: 85, total: 510 },
      { label: 'Cultura 2025', value: 88, total: 530 },
      { label: 'Cultura 2026', value: 92, total: 550 },
    ],
    unit: '%'
  },
  comparisons: [
    { surveyId: 'cu2026', label: '2026 (BASE)', value: 92, isBase: true },
    { surveyId: 'cu2025', label: '2025', value: 88, delta: 4, trend: 'up' as const },
    { surveyId: 'cu1', label: '2024', value: 85, delta: 7, trend: 'up' as const },
    { surveyId: 'cu4', label: 'Alineación 2024', value: 80, delta: 12, trend: 'up' as const },
  ]
};

export const CULTURA_NPS_DATA = {
  mainMetric: {
    id: 'cu-nps-2026',
    label: 'NPS',
    value: 58,
    previousValue: 54,
    delta: 4,
    trend: 'up' as const,
    description: 'Cultura 2026 (BASE)',
    totalResponses: 550
  },
  distributionByPeriod: [
    {
      surveyId: 'cu2026',
      period: 'Cultura 2026 (BASE)',
      total: 550,
      segments: [
        { id: 'cu-prom-1', label: 'Promotores', value: 68, percentage: 68, tone: 'positive' as const },
        { id: 'cu-neu-1', label: 'Neutros', value: 22, percentage: 22, tone: 'neutral' as const },
        { id: 'cu-det-1', label: 'Detractores', value: 10, percentage: 10, tone: 'negative' as const },
      ]
    },
    {
      surveyId: 'cu2025',
      period: 'Cultura 2025',
      total: 530,
      segments: [
        { id: 'cu-prom-2', label: 'Promotores', value: 65, percentage: 65, tone: 'positive' as const },
        { id: 'cu-neu-2', label: 'Neutros', value: 24, percentage: 24, tone: 'neutral' as const },
        { id: 'cu-det-2', label: 'Detractores', value: 11, percentage: 11, tone: 'negative' as const },
      ]
    },
    {
      surveyId: 'cu1',
      period: 'Cultura 2024',
      total: 510,
      segments: [
        { id: 'cu-prom-3', label: 'Promotores', value: 60, percentage: 60, tone: 'positive' as const },
        { id: 'cu-neu-3', label: 'Neutros', value: 25, percentage: 25, tone: 'neutral' as const },
        { id: 'cu-det-3', label: 'Detractores', value: 15, percentage: 15, tone: 'negative' as const },
      ]
    },
    {
      surveyId: 'cu4',
      period: 'Alineación 2024',
      total: 480,
      segments: [
        { id: 'cu-prom-4', label: 'Promotores', value: 55, percentage: 55, tone: 'positive' as const },
        { id: 'cu-neu-4', label: 'Neutros', value: 28, percentage: 28, tone: 'neutral' as const },
        { id: 'cu-det-4', label: 'Detractores', value: 17, percentage: 17, tone: 'negative' as const },
      ]
    }
  ],
  trendData: {
    id: 'cu-nps-trend',
    label: 'Evolución de NPS Cultura',
    data: [
      { label: 'Alineación 2024', value: 50, total: 480 },
      { label: 'Cultura 2024', value: 52, total: 510 },
      { label: 'Cultura 2025', value: 54, total: 530 },
      { label: 'Cultura 2026', value: 58, total: 550 },
    ],
    unit: ''
  },
  comparisons: [
    { surveyId: 'cu2026', label: '2026 (BASE)', value: 58, isBase: true },
    { surveyId: 'cu2025', label: '2025', value: 54, delta: 4, trend: 'up' as const },
    { surveyId: 'cu1', label: '2024', value: 52, delta: 6, trend: 'up' as const },
    { surveyId: 'cu4', label: 'Alineación 2024', value: 50, delta: 8, trend: 'up' as const },
  ]
};

export const CULTURA_SENTIMENT_DATA = [
  {
    id: "csent-1",
    dimension: "Valores Vivenciados",
    currentScore: { positive: 75, neutral: 15, negative: 10, total: 400 },
    p1: { positive: 70, neutral: 18, negative: 12, total: 380 },
    p2: { positive: 65, neutral: 20, negative: 15, total: 350 },
    delta: 5
  },
  {
    id: "csent-2",
    dimension: "Alineación Estratégica",
    currentScore: { positive: 70, neutral: 20, negative: 10, total: 380 },
    p1: { positive: 65, neutral: 22, negative: 13, total: 360 },
    p2: { positive: 60, neutral: 25, negative: 15, total: 340 },
    delta: 5
  },
  {
    id: "csent-3",
    dimension: "Innovación y Agilidad",
    currentScore: { positive: 45, neutral: 35, negative: 20, total: 320 },
    p1: null,
    p2: null,
    delta: null
  },
  {
    id: "csent-4",
    dimension: "Liderazgo Inspirador",
    currentScore: { positive: 88, neutral: 8, negative: 4, total: 450 },
    p1: null,
    p2: null,
    delta: null
  },
  {
    id: "csent-5",
    dimension: "Recursos y Herramientas",
    currentScore: null,
    p1: { positive: 60, neutral: 30, negative: 10, total: 400 },
    p2: null,
    delta: null
  },
  {
    id: "csent-6",
    dimension: "Bienestar y Equilibrio",
    currentScore: null,
    p1: null,
    p2: { positive: 50, neutral: 30, negative: 20, total: 200 },
    delta: null
  },
  {
    id: "csent-7",
    dimension: "Empoderamiento",
    currentScore: { positive: 70, neutral: 20, negative: 10, total: 380 },
    p1: { positive: 70, neutral: 20, negative: 10, total: 380 },
    p2: null,
    delta: 0
  }
];

export const DEMOGRAPHIC_OPTIONS = {
  area: ["Tecnología", "Ventas", "Marketing", "Recursos Humanos", "Operaciones", "Finanzas", "Producto", "Soporte", "Legal", "I+D"],
  lider: ["Juan Pérez", "María García", "Carlos Rodríguez", "Ana Martínez", "Luis Sánchez", "Elena Gómez", "Roberto Díaz", "Patricia Sosa", "Ricardo Luna"],
  rol: ["Individual Contributor", "Manager", "Senior Manager", "Director", "VP", "Intern", "Contractor", "Team Lead"],
  ciudad: ["Bogotá", "Medellín", "Cali", "Barranquilla", "Cartagena", "Pereira", "Bucaramanga", "Manizales", "Montería"],
  pais: ["Colombia", "México", "Perú", "Chile", "Argentina", "Brasil", "Ecuador", "Panamá", "España"],
  edad: ["18-25", "26-35", "36-45", "46-55", "56+"],
  sexo: ["Masculino", "Femenino", "No binario", "Prefiero no decirlo"],
  antiguedad: ["0-6 meses", "6-12 meses", "1-2 años", "2-5 años", "5+ años"],
  contrato: ["Término Fijo", "Término Indefinido", "Prestación de Servicios", "Aprendizaje", "Temporal"]
};

export const COMPARATIVE_SENTIMENT_DATA = [
  {
    id: "sent-1",
    dimension: "Liderazgo",
    q4_2024: { positive: 65, neutral: 20, negative: 15, total: 320 },
    q3_2024: { positive: 62, neutral: 22, negative: 16, total: 310 },
    q2_2024: { positive: 60, neutral: 25, negative: 15, total: 290 },
    q1_2024: { positive: 58, neutral: 24, negative: 18, total: 280 },
    q4_2023: { positive: 55, neutral: 25, negative: 20, total: 250 },
    delta: 3
  },
  {
    id: "sent-2",
    dimension: "Reconocimiento",
    q4_2024: { positive: 45, neutral: 35, negative: 20, total: 210 },
    q3_2024: { positive: 43, neutral: 37, negative: 20, total: 205 },
    q2_2024: { positive: 44, neutral: 36, negative: 20, total: 190 },
    q1_2024: { positive: 42, neutral: 38, negative: 20, total: 180 },
    q4_2023: { positive: 40, neutral: 40, negative: 20, total: 150 },
    delta: 2
  },
  {
    id: "sent-3",
    dimension: "Comunicación",
    q4_2024: { positive: 55, neutral: 25, negative: 20, total: 280 },
    q3_2024: { positive: 54, neutral: 26, negative: 20, total: 275 },
    q2_2024: { positive: 53, neutral: 27, negative: 20, total: 260 },
    q1_2024: { positive: 52, neutral: 28, negative: 20, total: 250 },
    q4_2023: { positive: 50, neutral: 30, negative: 20, total: 220 },
    delta: 1
  },
  {
    id: "sent-4",
    dimension: "Cultura",
    q4_2024: { positive: 72, neutral: 18, negative: 10, total: 350 },
    q3_2024: { positive: 71, neutral: 19, negative: 10, total: 340 },
    q2_2024: { positive: 70, neutral: 20, negative: 10, total: 320 },
    q1_2024: { positive: 69, neutral: 21, negative: 10, total: 310 },
    q4_2023: { positive: 68, neutral: 22, negative: 10, total: 280 },
    delta: 1
  },
  {
    id: "sent-5",
    dimension: "Desarrollo",
    q4_2024: { positive: 38, neutral: 40, negative: 22, total: 195 },
    q3_2024: { positive: 39, neutral: 39, negative: 22, total: 190 },
    q2_2024: { positive: 40, neutral: 38, negative: 22, total: 180 },
    q1_2024: { positive: 42, neutral: 36, negative: 22, total: 175 },
    q4_2023: { positive: 45, neutral: 33, negative: 22, total: 160 },
    delta: -1
  },
  {
    id: "sent-6",
    dimension: "Bienestar",
    q4_2024: { positive: 60, neutral: 25, negative: 15, total: 240 },
    q3_2024: { positive: 61, neutral: 24, negative: 15, total: 235 },
    q2_2024: { positive: 60, neutral: 25, negative: 15, total: 220 },
    q1_2024: { positive: 59, neutral: 26, negative: 15, total: 210 },
    q4_2023: { positive: 58, neutral: 27, negative: 15, total: 190 },
    delta: -1
  },
  {
    id: "sent-7",
    dimension: "Carga laboral",
    q4_2024: { positive: 25, neutral: 35, negative: 40, total: 180 },
    q3_2024: { positive: 28, neutral: 32, negative: 40, total: 175 },
    q2_2024: { positive: 30, neutral: 30, negative: 40, total: 160 },
    q1_2024: { positive: 32, neutral: 28, negative: 40, total: 155 },
    q4_2023: { positive: 35, neutral: 25, negative: 40, total: 140 },
    delta: -3
  },
  {
    id: "sent-8",
    dimension: "Pertenencia",
    q4_2024: { positive: 78, neutral: 15, negative: 7, total: 310 },
    q3_2024: { positive: 76, neutral: 17, negative: 7, total: 300 },
    q2_2024: { positive: 75, neutral: 18, negative: 7, total: 290 },
    q1_2024: { positive: 74, neutral: 19, negative: 7, total: 280 },
    q4_2023: { positive: 72, neutral: 20, negative: 8, total: 260 },
    delta: 2
  }
];

export const COMPARATIVE_COMMENTS_DETAIL = [
  {
    id: "com-1",
    text: "Mi líder siempre está dispuesto a escuchar mis propuestas y me apoya en mi crecimiento profesional.",
    dimension: "Liderazgo",
    sentiment: "positive",
    date: "24 Oct 2024",
    demographics: { area: "Tecnología", rol: "Senior Manager", pais: "Colombia" }
  },
  {
    id: "com-2",
    text: "Siento que la comunicación de los cambios estructurales podría ser más clara y oportuna.",
    dimension: "Comunicación",
    sentiment: "neutral",
    date: "20 Oct 2024",
    demographics: { area: "Ventas", rol: "Individual Contributor", pais: "México" }
  },
  {
    id: "com-3",
    text: "La carga de trabajo en este último trimestre ha sido excesiva y está afectando mi vida personal.",
    dimension: "Carga laboral",
    sentiment: "negative",
    date: "15 Oct 2024",
    demographics: { area: "Operaciones", rol: "Manager", pais: "Perú" }
  },
  {
    id: "com-4",
    text: "Me encanta la cultura de colaboración que tenemos en el equipo, siempre nos ayudamos.",
    dimension: "Cultura",
    sentiment: "positive",
    date: "12 Oct 2024",
    demographics: { area: "Producto", rol: "Senior Manager", pais: "Chile" }
  },
  {
    id: "com-5",
    text: "No veo oportunidades claras de crecimiento dentro de mi área actual.",
    dimension: "Desarrollo",
    sentiment: "negative",
    date: "10 Oct 2024",
    demographics: { area: "Finanzas", rol: "Individual Contributor", pais: "Argentina" }
  },
  {
    id: "com-6",
    text: "El reconocimiento por los logros alcanzados es justo y motivador.",
    dimension: "Reconocimiento",
    sentiment: "positive",
    date: "05 Oct 2024",
    demographics: { area: "Marketing", rol: "Individual Contributor", pais: "Colombia" }
  },
  {
    id: "com-7",
    text: "A veces las reuniones se extienden demasiado sin llegar a conclusiones claras.",
    dimension: "Comunicación",
    sentiment: "neutral",
    date: "02 Oct 2024",
    demographics: { area: "Soporte", rol: "Team Lead", pais: "México" }
  },
  {
    id: "com-8",
    text: "Siento un fuerte sentido de pertenencia a UBITS, comparto plenamente sus valores.",
    dimension: "Pertenencia",
    sentiment: "positive",
    date: "30 Sep 2024",
    demographics: { area: "I+D", rol: "Director", pais: "Colombia" }
  }
];

export const CULTURA_COMMENTS_DETAIL = [
  {
    id: "cc-1",
    text: "Los valores de UBITS no son solo palabras en una pared, realmente los vivimos en el día a día.",
    dimension: "Valores Vivenciados",
    sentiment: "positive",
    date: "15 Mar 2026",
    demographics: { area: "RRHH", rol: "Manager", pais: "Colombia" }
  },
  {
    id: "cc-2",
    text: "Siento que el propósito de democratizar el aprendizaje nos une a todos como equipo.",
    dimension: "Alineación Estratégica",
    sentiment: "positive",
    date: "10 Mar 2026",
    demographics: { area: "Producto", rol: "Senior Manager", pais: "México" }
  },
  {
    id: "cc-3",
    text: "La agilidad a veces se confunde con desorden; necesitamos procesos más robustos para innovar.",
    dimension: "Innovación y Agilidad",
    sentiment: "neutral",
    date: "05 Mar 2026",
    demographics: { area: "Tecnología", rol: "Senior Dev", pais: "Colombia" }
  },
  {
    id: "cc-4",
    text: "Me siento empoderado para tomar decisiones, pero a veces falta feedback sobre el impacto.",
    dimension: "Empoderamiento",
    sentiment: "positive",
    date: "01 Mar 2026",
    demographics: { area: "Ventas", rol: "Individual Contributor", pais: "Chile" }
  },
  {
    id: "cc-5",
    text: "La transparencia en la comunicación de resultados financieros nos da mucha seguridad.",
    dimension: "Alineación Estratégica",
    sentiment: "positive",
    date: "28 Feb 2026",
    demographics: { area: "Finanzas", rol: "Director", pais: "Colombia" }
  }
];

export const COMPARATIVE_AI_INSIGHTS = {
  summary: "El análisis comparativo de 5 períodos reveló tendencias positivas en engagement y preocupaciones en carga de trabajo. La satisfacción general ha aumentado 8.2% impulsada por mejoras en liderazgo y cultura.",

  highImpactFindings: [
    {
      id: "insight-1",
      title: "Crecimiento sostenido en Favorabilidad",
      description: "Aumento de 8.2% en favorabilidad general en los últimos 5 períodos",
      type: "insight",
      confidence: "high",
      evidence: "Favorabilidad: 78.4% (Q4 2024 BASE) → Tendencia ascendente consistente",
      impact: "Mejora directa en retención de talento y engagement"
    },
    {
      id: "insight-2",
      title: "Riesgo crítico: Carga de trabajo insostenible",
      description: "El factor 'Carga laboral' muestra deterioro del 10% en satisfacción",
      type: "risk",
      confidence: "high",
      evidence: "Carga laboral: Positividad bajó de 35% (Q4 2023) a 25% (Q4 2024)",
      impact: "Riesgo de rotación y burnout en áreas operativas"
    },
    {
      id: "insight-3",
      title: "Oportunidad: Capitalizar momentum en Cultura",
      description: "El sentimiento positivo en Cultura aumentó 4.7% - momento ideal para inversión",
      type: "opportunity",
      confidence: "high",
      evidence: "Cultura: Positividad en 72% (Q4 2024) con tendencia ascendente",
      impact: "Potencial para iniciativas de valores corporativos"
    },
    {
      id: "insight-4",
      title: "Mejora detectada en Desarrollo profesional",
      description: "Inversión en capacitación comienza a mostrar resultados positivos",
      type: "recommendation",
      confidence: "medium",
      evidence: "Desarrollo: Reversión de tendencia negativa en últimos 2 períodos",
      impact: "Aumento de 2-3% esperado en satisfacción en próximos trimestres"
    }
  ],
  topKeywords: {
    positive: [
      { word: 'Feedback', count: 42 },
      { word: 'Cercanía', count: 35 },
      { word: 'Comunicación', count: 28 },
      { word: 'Procesos', count: 24 },
      { word: 'Confianza', count: 18 }
    ],
    negative: [
      { word: 'Carga', count: 56 },
      { word: 'Estrés', count: 48 },
      { word: 'Salarios', count: 32 },
      { word: 'Reconocimiento', count: 25 },
      { word: 'Burocracia', count: 20 }
    ],
    neutral: [
      { word: 'Estabilidad', count: 38 },
      { word: 'Seguimiento', count: 30 },
      { word: 'Herramientas', count: 25 },
      { word: 'Comunicación', count: 22 },
      { word: 'Horarios', count: 18 }
    ]
  },
  recurrentThemes: {
    positive: [
      { text: 'Acompañamiento del líder', count: 12, trend: 'up', relevance: 0.95, recurrent: true, desc: 'Percepción alta de soporte directo' },
      { text: 'Plan de carrera claro', count: 8, trend: 'stable', relevance: 0.82, recurrent: true, desc: 'Visibilidad de crecimiento interno' }
    ],
    negative: [
      { text: 'Exceso de reuniones', count: 18, trend: 'up', relevance: 0.98, recurrent: true, desc: 'Impacto directo en la productividad' },
      { text: 'Falta de feedback', count: 14, trend: 'down', relevance: 0.88, recurrent: true, desc: 'Necesidad de mayor retroalimentación' }
    ],
    neutral: [
      { text: 'Procesos estables', count: 15, trend: 'stable', relevance: 0.90, recurrent: true, desc: 'Consistencia operativa detectada' },
      { text: 'Herramientas de trabajo', count: 10, trend: 'up', relevance: 0.85, recurrent: true, desc: 'Adopción de nuevas plataformas' }
    ]
  },
  featuredInsights: {
    positive: '«El liderazgo actual se percibe como el motor principal del compromiso, destacando la empatía y la claridad en la dirección estratégica como factores clave de éxito.»',
    negative: '«Se identifica una correlación crítica entre la carga laboral y la rotación potencial. El equipo manifiesta fatiga por procesos burocráticos que dilatan las entregas.»',
    neutral: '«La estabilidad es la nota dominante, sugiriendo un periodo de consolidación operativa donde el foco está en la optimización de las herramientas actuales.»'
  },
  recurrentComments: {
    positive: [
      { title: 'CLARIDAD EN OBJETIVOS', total: 36, text: 'Existe una mejora notable en cómo los líderes definen los OKRs.', confidence: '92%' },
      { title: 'SOPORTE DEL LÍDER', total: 24, text: 'Los colaboradores valoran la cercanía y el apoyo constante.', confidence: '88%' }
    ],
    negative: [
      { title: 'SOBRECARGA LABORAL', total: 42, text: 'Se reporta una fatiga acumulada por jornadas extensas.', confidence: '95%' },
      { title: 'LENTITUD EN PROCESOS', total: 28, text: 'La burocracia interna afecta la velocidad de ejecución.', confidence: '84%' }
    ],
    neutral: [
      { title: 'ESTABILIDAD OPERATIVA', total: 30, text: 'Los procesos se mantienen estables pero sin grandes innovaciones.', confidence: '85%' }
    ]
  },

  sentiment: {
    currentScore: { positive: 82, neutral: 12, negative: 6, total: 580 },
    p1: { positive: 74, neutral: 18, negative: 8, total: 565 },
    p2: { positive: 70, neutral: 20, negative: 10, total: 550 },
    p3: { positive: 68, neutral: 22, negative: 10, total: 540 },
    p4: { positive: 65, neutral: 25, negative: 10, total: 535 },
  },
  predictions: {
    summary: "Basado en análisis de series temporales y machine learning",
    scenarios: [
      {
        label: "Q1 2026",
        actual: 86.5,
        predicted: 88.2,
        probabilityGrowth: 78,
        probabilityDecline: 12,
        probabilityStable: 10
      },
      {
        label: "Q2 2026",
        predicted: 89.1,
        probabilityGrowth: 72,
        probabilityDecline: 15,
        probabilityStable: 13
      },
      {
        label: "Q3 2026",
        predicted: 89.8,
        probabilityGrowth: 68,
        probabilityDecline: 18,
        probabilityStable: 14
      },
      {
        label: "Q4 2026",
        predicted: 90.2,
        probabilityGrowth: 65,
        probabilityDecline: 20,
        probabilityStable: 15
      }
    ]
  }
};

export const CULTURA_AI_INSIGHTS = {
  summary: "La cultura de UBITS se mantiene sólida con un alto nivel de alineación al propósito. Se observa una mejora significativa en la vivencia de valores en comparación con el año anterior.",

  highImpactFindings: [
    {
      id: "cu-insight-1",
      title: "Fuerte Alineación Estratégica",
      description: "El 85% de los colaboradores se siente inspirado por el propósito corporativo.",
      type: "insight",
      confidence: "high",
      evidence: "Cultura: Puntaje de 85 en Alineación Estratégica",
      impact: "Mayor compromiso a largo plazo y coherencia en la ejecución"
    },
    {
      id: "cu-insight-2",
      title: "Valores Vivenciados en aumento",
      description: "Mejora de 8 puntos en la percepción de que los líderes actúan según los valores.",
      type: "insight",
      confidence: "high",
      evidence: "Valores Vivenciados: 82% (2025) → 90% (2026)",
      impact: "Fortalecimiento de la confianza y el liderazgo ejemplar"
    },
    {
      id: "cu-insight-3",
      title: "Barrera: Exceso de perfeccionismo",
      description: "La agilidad se ve limitada por una baja tolerancia al error en algunos equipos.",
      type: "risk",
      confidence: "medium",
      evidence: "Innovación y Agilidad: Satisfacción del 75%",
      impact: "Reducción en la velocidad de experimentación"
    }
  ],
  topKeywords: {
    positive: [
      { word: 'Propósito', count: 52 },
      { word: 'Valores', count: 48 },
      { word: 'Alineación', count: 45 },
      { word: 'Orgullo', count: 38 },
      { word: 'Identidad', count: 32 }
    ],
    negative: [
      { word: 'Lentitud', count: 28 },
      { word: 'Error', count: 24 },
      { word: 'Miedo', count: 22 },
      { word: 'Silencio', count: 18 },
      { word: 'Aislamiento', count: 15 }
    ],
    neutral: [
      { word: 'Continuidad', count: 35 },
      { word: 'Tradición', count: 28 },
      { word: 'Manuales', count: 22 },
      { word: 'Normas', count: 18 },
      { word: 'Flujos', count: 15 }
    ]
  },
  recurrentThemes: {
    positive: [
      { text: 'Conexión con el Propósito', count: 25, trend: 'up', relevance: 0.98, recurrent: true, desc: 'Alta identificación con la misión' },
      { text: 'Vivencia de Valores', count: 18, trend: 'up', relevance: 0.92, recurrent: true, desc: 'Los líderes son ejemplo de cultura' }
    ],
    negative: [
      { text: 'Miedo al error', count: 15, trend: 'stable', relevance: 0.85, recurrent: true, desc: 'Barrera para la innovación abierta' },
      { text: 'Silos culturales', count: 10, trend: 'up', relevance: 0.78, recurrent: false, desc: 'Diferencias marcadas entre áreas' }
    ],
    neutral: [
      { text: 'Rituales corporativos', count: 20, trend: 'stable', relevance: 0.88, recurrent: true, desc: 'Participación constante en eventos' },
      { text: 'Código de ética', count: 12, trend: 'stable', relevance: 0.82, recurrent: false, desc: 'Conocimiento general de normas' }
    ]
  },
  featuredInsights: {
    positive: '«La cultura de UBITS se ha convertido en una ventaja competitiva, donde la alineación al propósito impulsa un compromiso extraordinario.»',
    negative: '«Detectamos una oportunidad crítica en la seguridad psicológica; la aversión al riesgo está frenando la capacidad de aprendizaje del equipo.»',
    neutral: '«La cultura organizacional es percibida como estable y protectora, brindando un marco de seguridad claro para la ejecución diaria.»'
  },
  recurrentComments: {
    positive: [
      { title: 'ORGULLO DE PERTENENCIA', total: 45, text: 'Me siento orgulloso de trabajar en una empresa con valores claros.', confidence: '98%', frequency: 'Alta frecuencia', periods: ['Q4', 'Q3', 'Q2'], detected: 'Detectado en 15 áreas' },
      { title: 'COHERENCIA LIDERAZGO', total: 32, text: 'Mis líderes actúan de acuerdo a lo que la empresa predica.', confidence: '94%', frequency: 'Tendencia estable', periods: ['Q4', 'Q3'], detected: 'Detectado en 12 áreas' }
    ],
    negative: [
      { title: 'AVERSIÓN AL RIESGO', total: 25, text: 'A veces preferimos no proponer para no equivocarnos.', confidence: '82%', frequency: 'Riesgo emergente', periods: ['Q4'], detected: 'Detectado en 8 áreas' },
      { title: 'DESCONEXIÓN INTER-ÁREAS', total: 18, text: 'Cada área tiene su propia "cultura" y cuesta colaborar.', confidence: '78%', frequency: 'Persistente', periods: ['Q4', 'Q3', 'Q2', 'Q1'], detected: 'Detectado en 10 áreas' }
    ],
    neutral: [
      { title: 'CONOCIMIENTO DE NORMAS', total: 40, text: 'Tengo claro qué se espera de mí según el manual de cultura.', confidence: '90%', frequency: 'Consistencia alta', periods: ['Q4', 'Q3', 'Q2', 'Q1'], detected: 'Detectado en 20 áreas' }
    ]
  },

  predictions: {
    summary: "Proyecciones de madurez cultural",
    scenarios: [
      {
        label: "2024 (Actual)",
        predicted: 82.4,
        probabilityGrowth: 0,
        probabilityDecline: 0,
        probabilityStable: 100
      },
      {
        label: "2025",
        predicted: 85.8,
        probabilityGrowth: 65,
        probabilityDecline: 10,
        probabilityStable: 25
      },
      {
        label: "2026",
        predicted: 89.2,
        probabilityGrowth: 72,
        probabilityDecline: 8,
        probabilityStable: 20
      },
      {
        label: "2027",
        predicted: 92.5,
        probabilityGrowth: 80,
        probabilityDecline: 5,
        probabilityStable: 15
      }
    ]
  }
};

export const SEGMENT_CATEGORIES = [
  { id: 'area', label: 'Área' },
  { id: 'lider', label: 'Líder' },
  { id: 'rol', label: 'Rol' },
  { id: 'ciudad', label: 'Ciudad' },
  { id: 'pais', label: 'País' },
  { id: 'edad', label: 'Edad' },
  { id: 'sexo', label: 'Sexo' },
  { id: 'antiguedad', label: 'Antigüedad' },
  { id: 'contrato', label: 'Tipo de Contrato' }
];

// Dimensiones con datos de Favorabilidad y NPS para tooltips
export interface DimensionFavorabilidad {
  favorable: number;
  favorableCount: number;
  neutral: number;
  neutralCount: number;
  desfavorable: number;
  desfavorableCount: number;
}

export interface DimensionNPS {
  promoters: number;
  promotersCount: number;
  passives: number;
  passivesCount: number;
  detractors: number;
  detractorsCount: number;
}

export interface DimensionWithBreakdown {
  id: string;
  name: string;
  description: string;
  currentScore: number | null;
  p1: number | null;
  p2: number | null;
  p3: number | null;
  p4: number | null;
  delta: number | null;
  trend: 'up' | 'down' | 'neutral';
  responses: number;
  favorabilidad: DimensionFavorabilidad;
  nps: DimensionNPS;
  // Desglose por periodo: [base, p1, p2, p3, p4]
  favorabilidadByPeriod: DimensionFavorabilidad[];
  npsByPeriod: DimensionNPS[];
}

export const COMPARATIVE_DIMENSIONS_BREAKDOWN: DimensionWithBreakdown[] = [
  {
    id: "dim-1",
    name: "Liderazgo",
    description: "Confianza y efectividad en el liderazgo",
    currentScore: 82,
    p1: 68,
    p2: 66,
    p3: 64,
    p4: 60,
    delta: 14,
    trend: 'up',
    responses: 1240,
    favorabilidad: { favorable: 72, favorableCount: 893, neutral: 18, neutralCount: 223, desfavorable: 10, desfavorableCount: 124 },
    nps: { promoters: 55, promotersCount: 682, passives: 28, passivesCount: 347, detractors: 17, detractorsCount: 211 },
    favorabilidadByPeriod: [
      { favorable: 72, favorableCount: 893, neutral: 18, neutralCount: 223, desfavorable: 10, desfavorableCount: 124 },
      { favorable: 65, favorableCount: 520, neutral: 22, neutralCount: 176, desfavorable: 13, desfavorableCount: 104 },
      { favorable: 62, favorableCount: 496, neutral: 24, neutralCount: 192, desfavorable: 14, desfavorableCount: 112 },
      { favorable: 60, favorableCount: 468, neutral: 25, neutralCount: 195, desfavorable: 15, desfavorableCount: 117 },
      { favorable: 58, favorableCount: 441, neutral: 26, neutralCount: 198, desfavorable: 16, desfavorableCount: 122 }
    ],
    npsByPeriod: [
      { promoters: 55, promotersCount: 682, passives: 28, passivesCount: 347, detractors: 17, detractorsCount: 211 },
      { promoters: 48, promotersCount: 384, passives: 32, passivesCount: 256, detractors: 20, detractorsCount: 160 },
      { promoters: 45, promotersCount: 360, passives: 33, passivesCount: 264, detractors: 22, detractorsCount: 176 },
      { promoters: 42, promotersCount: 328, passives: 34, passivesCount: 265, detractors: 24, detractorsCount: 187 },
      { promoters: 40, promotersCount: 304, passives: 35, passivesCount: 266, detractors: 25, detractorsCount: 190 }
    ]
  },
  {
    id: "dim-2",
    name: "Reconocimiento",
    description: "Valoración del trabajo y logros",
    currentScore: 76,
    p1: 64,
    p2: 62,
    p3: 60,
    p4: 58,
    delta: 12,
    trend: 'up',
    responses: 1150,
    favorabilidad: { favorable: 65, favorableCount: 748, neutral: 22, neutralCount: 253, desfavorable: 13, desfavorableCount: 149 },
    nps: { promoters: 48, promotersCount: 552, passives: 30, passivesCount: 345, detractors: 22, detractorsCount: 253 },
    favorabilidadByPeriod: [
      { favorable: 65, favorableCount: 748, neutral: 22, neutralCount: 253, desfavorable: 13, desfavorableCount: 149 },
      { favorable: 58, favorableCount: 464, neutral: 26, neutralCount: 208, desfavorable: 16, desfavorableCount: 128 },
      { favorable: 55, favorableCount: 440, neutral: 27, neutralCount: 216, desfavorable: 18, desfavorableCount: 144 },
      { favorable: 52, favorableCount: 406, neutral: 28, neutralCount: 218, desfavorable: 20, desfavorableCount: 156 },
      { favorable: 50, favorableCount: 380, neutral: 29, neutralCount: 220, desfavorable: 21, desfavorableCount: 160 }
    ],
    npsByPeriod: [
      { promoters: 48, promotersCount: 552, passives: 30, passivesCount: 345, detractors: 22, detractorsCount: 253 },
      { promoters: 42, promotersCount: 336, passives: 33, passivesCount: 264, detractors: 25, detractorsCount: 200 },
      { promoters: 40, promotersCount: 320, passives: 34, passivesCount: 272, detractors: 26, detractorsCount: 208 },
      { promoters: 38, promotersCount: 297, passives: 35, passivesCount: 273, detractors: 27, detractorsCount: 210 },
      { promoters: 36, promotersCount: 274, passives: 36, passivesCount: 273, detractors: 28, detractorsCount: 213 }
    ]
  },
  {
    id: "dim-3",
    name: "Comunicación",
    description: "Claridad y transparencia interna",
    currentScore: 74,
    p1: 65,
    p2: 64,
    p3: 64,
    p4: 62,
    delta: 9,
    trend: 'up',
    responses: 1100,
    favorabilidad: { favorable: 62, favorableCount: 682, neutral: 24, neutralCount: 264, desfavorable: 14, desfavorableCount: 154 },
    nps: { promoters: 45, promotersCount: 495, passives: 32, passivesCount: 352, detractors: 23, detractorsCount: 253 },
    favorabilidadByPeriod: [
      { favorable: 62, favorableCount: 682, neutral: 24, neutralCount: 264, desfavorable: 14, desfavorableCount: 154 },
      { favorable: 56, favorableCount: 448, neutral: 27, neutralCount: 216, desfavorable: 17, desfavorableCount: 136 },
      { favorable: 54, favorableCount: 432, neutral: 28, neutralCount: 224, desfavorable: 18, desfavorableCount: 144 },
      { favorable: 52, favorableCount: 406, neutral: 29, neutralCount: 226, desfavorable: 19, desfavorableCount: 148 },
      { favorable: 50, favorableCount: 380, neutral: 30, neutralCount: 228, desfavorable: 20, desfavorableCount: 152 }
    ],
    npsByPeriod: [
      { promoters: 45, promotersCount: 495, passives: 32, passivesCount: 352, detractors: 23, detractorsCount: 253 },
      { promoters: 40, promotersCount: 320, passives: 34, passivesCount: 272, detractors: 26, detractorsCount: 208 },
      { promoters: 38, promotersCount: 304, passives: 35, passivesCount: 280, detractors: 27, detractorsCount: 216 },
      { promoters: 36, promotersCount: 281, passives: 36, passivesCount: 281, detractors: 28, detractorsCount: 218 },
      { promoters: 34, promotersCount: 258, passives: 37, passivesCount: 281, detractors: 29, detractorsCount: 221 }
    ]
  },
  {
    id: "dim-4",
    name: "Cultura",
    description: "Valores y ambiente organizacional",
    currentScore: 79,
    p1: 71,
    p2: 70,
    p3: 69,
    p4: 68,
    delta: 8,
    trend: 'up',
    responses: 1180,
    favorabilidad: { favorable: 68, favorableCount: 802, neutral: 21, neutralCount: 248, desfavorable: 11, desfavorableCount: 130 },
    nps: { promoters: 52, promotersCount: 614, passives: 29, passivesCount: 342, detractors: 19, detractorsCount: 224 },
    favorabilidadByPeriod: [
      { favorable: 68, favorableCount: 802, neutral: 21, neutralCount: 248, desfavorable: 11, desfavorableCount: 130 },
      { favorable: 62, favorableCount: 496, neutral: 24, neutralCount: 192, desfavorable: 14, desfavorableCount: 112 },
      { favorable: 60, favorableCount: 480, neutral: 25, neutralCount: 200, desfavorable: 15, desfavorableCount: 120 },
      { favorable: 58, favorableCount: 447, neutral: 26, neutralCount: 200, desfavorable: 16, desfavorableCount: 123 },
      { favorable: 56, favorableCount: 426, neutral: 27, neutralCount: 205, desfavorable: 17, desfavorableCount: 129 }
    ],
    npsByPeriod: [
      { promoters: 52, promotersCount: 614, passives: 29, passivesCount: 342, detractors: 19, detractorsCount: 224 },
      { promoters: 46, promotersCount: 368, passives: 32, passivesCount: 256, detractors: 22, detractorsCount: 176 },
      { promoters: 44, promotersCount: 352, passives: 33, passivesCount: 264, detractors: 23, detractorsCount: 184 },
      { promoters: 42, promotersCount: 328, passives: 34, passivesCount: 265, detractors: 24, detractorsCount: 187 },
      { promoters: 40, promotersCount: 304, passives: 35, passivesCount: 266, detractors: 25, detractorsCount: 190 }
    ]
  },
  {
    id: "dim-5",
    name: "Desarrollo",
    description: "Oportunidades de crecimiento",
    currentScore: 72,
    p1: 75,
    p2: 75,
    p3: 74,
    p4: 72,
    delta: -3,
    trend: 'down',
    responses: 980,
    favorabilidad: { favorable: 58, favorableCount: 568, neutral: 26, neutralCount: 255, desfavorable: 16, desfavorableCount: 157 },
    nps: { promoters: 42, promotersCount: 412, passives: 33, passivesCount: 323, detractors: 25, detractorsCount: 245 },
    favorabilidadByPeriod: [
      { favorable: 58, favorableCount: 568, neutral: 26, neutralCount: 255, desfavorable: 16, desfavorableCount: 157 },
      { favorable: 60, favorableCount: 510, neutral: 25, neutralCount: 213, desfavorable: 15, desfavorableCount: 127 },
      { favorable: 61, favorableCount: 513, neutral: 24, neutralCount: 202, desfavorable: 15, desfavorableCount: 125 },
      { favorable: 62, favorableCount: 502, neutral: 24, neutralCount: 194, desfavorable: 14, desfavorableCount: 113 },
      { favorable: 63, favorableCount: 492, neutral: 23, neutralCount: 180, desfavorable: 14, desfavorableCount: 109 }
    ],
    npsByPeriod: [
      { promoters: 42, promotersCount: 412, passives: 33, passivesCount: 323, detractors: 25, detractorsCount: 245 },
      { promoters: 44, promotersCount: 374, passives: 32, passivesCount: 272, detractors: 24, detractorsCount: 204 },
      { promoters: 45, promotersCount: 379, passives: 32, passivesCount: 269, detractors: 23, detractorsCount: 193 },
      { promoters: 46, promotersCount: 359, passives: 31, passivesCount: 242, detractors: 23, detractorsCount: 179 },
      { promoters: 47, promotersCount: 367, passives: 31, passivesCount: 241, detractors: 22, detractorsCount: 172 }
    ]
  },
  {
    id: "dim-6",
    name: "Bienestar",
    description: "Salud física y mental",
    currentScore: 85,
    p1: 82,
    p2: 81,
    p3: 80,
    p4: 78,
    delta: 3,
    trend: 'up',
    responses: 1200,
    favorabilidad: { favorable: 78, favorableCount: 936, neutral: 15, neutralCount: 180, desfavorable: 7, desfavorableCount: 84 },
    nps: { promoters: 62, promotersCount: 744, passives: 24, passivesCount: 288, detractors: 14, detractorsCount: 168 },
    favorabilidadByPeriod: [
      { favorable: 78, favorableCount: 936, neutral: 15, neutralCount: 180, desfavorable: 7, desfavorableCount: 84 },
      { favorable: 75, favorableCount: 690, neutral: 17, neutralCount: 156, desfavorable: 8, desfavorableCount: 74 },
      { favorable: 74, favorableCount: 681, neutral: 18, neutralCount: 166, desfavorable: 8, desfavorableCount: 74 },
      { favorable: 73, favorableCount: 657, neutral: 18, neutralCount: 162, desfavorable: 9, desfavorableCount: 81 },
      { favorable: 72, favorableCount: 634, neutral: 19, neutralCount: 167, desfavorable: 9, desfavorableCount: 79 }
    ],
    npsByPeriod: [
      { promoters: 62, promotersCount: 744, passives: 24, passivesCount: 288, detractors: 14, detractorsCount: 168 },
      { promoters: 58, promotersCount: 534, passives: 26, passivesCount: 239, detractors: 16, detractorsCount: 147 },
      { promoters: 56, promotersCount: 515, passives: 27, passivesCount: 248, detractors: 17, detractorsCount: 156 },
      { promoters: 54, promotersCount: 486, passives: 28, passivesCount: 252, detractors: 18, detractorsCount: 162 },
      { promoters: 52, promotersCount: 458, passives: 29, passivesCount: 255, detractors: 19, detractorsCount: 167 }
    ]
  },
  {
    id: "dim-7",
    name: "Carga laboral",
    description: "Distribución de tareas y tiempos",
    currentScore: 68,
    p1: 70,
    p2: 71,
    p3: 72,
    p4: 74,
    delta: -2,
    trend: 'down',
    responses: 1050,
    favorabilidad: { favorable: 52, favorableCount: 546, neutral: 28, neutralCount: 294, desfavorable: 20, desfavorableCount: 210 },
    nps: { promoters: 38, promotersCount: 399, passives: 34, passivesCount: 357, detractors: 28, detractorsCount: 294 },
    favorabilidadByPeriod: [
      { favorable: 52, favorableCount: 546, neutral: 28, neutralCount: 294, desfavorable: 20, desfavorableCount: 210 },
      { favorable: 54, favorableCount: 459, neutral: 27, neutralCount: 230, desfavorable: 19, desfavorableCount: 161 },
      { favorable: 55, favorableCount: 473, neutral: 26, neutralCount: 224, desfavorable: 19, desfavorableCount: 163 },
      { favorable: 56, favorableCount: 493, neutral: 26, neutralCount: 229, desfavorable: 18, desfavorableCount: 158 },
      { favorable: 58, favorableCount: 522, neutral: 25, neutralCount: 225, desfavorable: 17, desfavorableCount: 153 }
    ],
    npsByPeriod: [
      { promoters: 38, promotersCount: 399, passives: 34, passivesCount: 357, detractors: 28, detractorsCount: 294 },
      { promoters: 40, promotersCount: 340, passives: 33, passivesCount: 281, detractors: 27, detractorsCount: 229 },
      { promoters: 41, promotersCount: 353, passives: 33, passivesCount: 284, detractors: 26, detractorsCount: 224 },
      { promoters: 42, promotersCount: 374, passives: 32, passivesCount: 285, detractors: 26, detractorsCount: 231 },
      { promoters: 44, promotersCount: 405, passives: 31, passivesCount: 285, detractors: 25, detractorsCount: 230 }
    ]
  },
  {
    id: "dim-8",
    name: "Pertenencia",
    description: "Identificación con la empresa",
    currentScore: 90,
    p1: 88,
    p2: 86,
    p3: 85,
    p4: 82,
    delta: 2,
    trend: 'up',
    responses: 1300,
    favorabilidad: { favorable: 84, favorableCount: 1092, neutral: 12, neutralCount: 156, desfavorable: 4, desfavorableCount: 52 },
    nps: { promoters: 70, promotersCount: 910, passives: 22, passivesCount: 286, detractors: 8, detractorsCount: 104 },
    favorabilidadByPeriod: [
      { favorable: 84, favorableCount: 1092, neutral: 12, neutralCount: 156, desfavorable: 4, desfavorableCount: 52 },
      { favorable: 82, favorableCount: 754, neutral: 13, neutralCount: 120, desfavorable: 5, desfavorableCount: 46 },
      { favorable: 80, favorableCount: 736, neutral: 14, neutralCount: 129, desfavorable: 6, desfavorableCount: 55 },
      { favorable: 78, favorableCount: 702, neutral: 15, neutralCount: 135, desfavorable: 7, desfavorableCount: 63 },
      { favorable: 76, favorableCount: 670, neutral: 16, neutralCount: 141, desfavorable: 8, desfavorableCount: 70 }
    ],
    npsByPeriod: [
      { promoters: 70, promotersCount: 910, passives: 22, passivesCount: 286, detractors: 8, detractorsCount: 104 },
      { promoters: 68, promotersCount: 626, passives: 23, passivesCount: 212, detractors: 9, detractorsCount: 83 },
      { promoters: 66, promotersCount: 607, passives: 24, passivesCount: 221, detractors: 10, detractorsCount: 92 },
      { promoters: 64, promotersCount: 576, passives: 25, passivesCount: 225, detractors: 11, detractorsCount: 99 },
      { promoters: 62, promotersCount: 546, passives: 26, passivesCount: 229, detractors: 12, detractorsCount: 105 }
    ]
  },
  {
    id: "dim-9",
    name: "Innovación",
    description: "Capacidad de generar nuevas ideas y procesos (Nueva en 2026)",
    currentScore: 88,
    p1: null,
    p2: null,
    p3: null,
    p4: null,
    delta: null,
    trend: 'up',
    responses: 520,
    favorabilidad: { favorable: 80, favorableCount: 416, neutral: 16, neutralCount: 83, desfavorable: 4, desfavorableCount: 21 },
    nps: { promoters: 65, promotersCount: 338, passives: 25, passivesCount: 130, detractors: 10, detractorsCount: 52 },
    favorabilidadByPeriod: [
      { favorable: 80, favorableCount: 416, neutral: 16, neutralCount: 83, desfavorable: 4, desfavorableCount: 21 },
      { favorable: 0, favorableCount: 0, neutral: 0, neutralCount: 0, desfavorable: 0, desfavorableCount: 0 },
      { favorable: 0, favorableCount: 0, neutral: 0, neutralCount: 0, desfavorable: 0, desfavorableCount: 0 },
      { favorable: 0, favorableCount: 0, neutral: 0, neutralCount: 0, desfavorable: 0, desfavorableCount: 0 },
      { favorable: 0, favorableCount: 0, neutral: 0, neutralCount: 0, desfavorable: 0, desfavorableCount: 0 }
    ],
    npsByPeriod: [
      { promoters: 65, promotersCount: 338, passives: 25, passivesCount: 130, detractors: 10, detractorsCount: 52 },
      { promoters: 0, promotersCount: 0, passives: 0, passivesCount: 0, detractors: 0, detractorsCount: 0 },
      { promoters: 0, promotersCount: 0, passives: 0, passivesCount: 0, detractors: 0, detractorsCount: 0 },
      { promoters: 0, promotersCount: 0, passives: 0, passivesCount: 0, detractors: 0, detractorsCount: 0 },
      { promoters: 0, promotersCount: 0, passives: 0, passivesCount: 0, detractors: 0, detractorsCount: 0 }
    ]
  },
  {
    id: "dim-10",
    name: "Infraestructura",
    description: "Calidad de las instalaciones y herramientas físicas",
    currentScore: 75,
    p1: 72,
    p2: 70,
    p3: 68,
    p4: 65,
    delta: 3,
    trend: 'up',
    responses: 1100,
    favorabilidad: { favorable: 63, favorableCount: 693, neutral: 24, neutralCount: 264, desfavorable: 13, desfavorableCount: 143 },
    nps: { promoters: 47, promotersCount: 517, passives: 31, passivesCount: 341, detractors: 22, detractorsCount: 242 },
    favorabilidadByPeriod: [
      { favorable: 63, favorableCount: 693, neutral: 24, neutralCount: 264, desfavorable: 13, desfavorableCount: 143 },
      { favorable: 60, favorableCount: 504, neutral: 26, neutralCount: 218, desfavorable: 14, desfavorableCount: 118 },
      { favorable: 58, favorableCount: 476, neutral: 27, neutralCount: 221, desfavorable: 15, desfavorableCount: 123 },
      { favorable: 56, favorableCount: 437, neutral: 28, neutralCount: 218, desfavorable: 16, desfavorableCount: 125 },
      { favorable: 54, favorableCount: 405, neutral: 29, neutralCount: 218, desfavorable: 17, desfavorableCount: 127 }
    ],
    npsByPeriod: [
      { promoters: 47, promotersCount: 517, passives: 31, passivesCount: 341, detractors: 22, detractorsCount: 242 },
      { promoters: 44, promotersCount: 370, passives: 33, passivesCount: 277, detractors: 23, detractorsCount: 193 },
      { promoters: 42, promotersCount: 349, passives: 34, passivesCount: 283, detractors: 24, detractorsCount: 198 },
      { promoters: 40, promotersCount: 312, passives: 35, passivesCount: 273, detractors: 25, detractorsCount: 195 },
      { promoters: 38, promotersCount: 285, passives: 36, passivesCount: 270, detractors: 26, detractorsCount: 195 }
    ]
  }
];

export const CULTURA_DIMENSIONS_BREAKDOWN: DimensionWithBreakdown[] = [
  {
    id: "cdim-1",
    name: "Valores Vivenciados",
    description: "Grado en que se practican los valores",
    currentScore: 88,
    p1: 88,
    p2: 80,
    p3: 78,
    p4: 75,
    delta: 0,
    trend: 'neutral',
    responses: 1100,
    favorabilidad: { favorable: 80, favorableCount: 880, neutral: 14, neutralCount: 154, desfavorable: 6, desfavorableCount: 66 },
    nps: { promoters: 65, promotersCount: 715, passives: 22, passivesCount: 242, detractors: 13, detractorsCount: 143 },
    favorabilidadByPeriod: [
      { favorable: 80, favorableCount: 880, neutral: 14, neutralCount: 154, desfavorable: 6, desfavorableCount: 66 },
      { favorable: 80, favorableCount: 784, neutral: 14, neutralCount: 137, desfavorable: 6, desfavorableCount: 59 },
      { favorable: 74, favorableCount: 666, neutral: 18, neutralCount: 162, desfavorable: 8, desfavorableCount: 72 },
      { favorable: 72, favorableCount: 634, neutral: 19, neutralCount: 167, desfavorable: 9, desfavorableCount: 79 },
      { favorable: 70, favorableCount: 602, neutral: 20, neutralCount: 171, desfavorable: 10, desfavorableCount: 85 }
    ],
    npsByPeriod: [
      { promoters: 65, promotersCount: 715, passives: 22, passivesCount: 242, detractors: 13, detractorsCount: 143 },
      { promoters: 65, promotersCount: 637, passives: 22, passivesCount: 216, detractors: 13, detractorsCount: 127 },
      { promoters: 58, promotersCount: 522, passives: 26, passivesCount: 234, detractors: 16, detractorsCount: 144 },
      { promoters: 56, promotersCount: 493, passives: 27, passivesCount: 238, detractors: 17, detractorsCount: 149 },
      { promoters: 54, promotersCount: 464, passives: 28, passivesCount: 240, detractors: 18, detractorsCount: 154 }
    ]
  },
  {
    id: "cdim-2",
    name: "Alineación Estratégica",
    description: "Conexión con el propósito",
    currentScore: 84,
    p1: 78,
    p2: 76,
    p3: 75,
    p4: 72,
    delta: 6,
    trend: 'up',
    responses: 1050,
    favorabilidad: { favorable: 74, favorableCount: 777, neutral: 18, neutralCount: 189, desfavorable: 8, desfavorableCount: 84 },
    nps: { promoters: 58, promotersCount: 609, passives: 26, passivesCount: 273, detractors: 16, detractorsCount: 168 },
    favorabilidadByPeriod: [
      { favorable: 74, favorableCount: 777, neutral: 18, neutralCount: 189, desfavorable: 8, desfavorableCount: 84 },
      { favorable: 68, favorableCount: 604, neutral: 22, neutralCount: 195, desfavorable: 10, desfavorableCount: 89 },
      { favorable: 66, favorableCount: 581, neutral: 23, neutralCount: 202, desfavorable: 11, desfavorableCount: 97 },
      { favorable: 64, favorableCount: 554, neutral: 24, neutralCount: 209, desfavorable: 12, desfavorableCount: 104 },
      { favorable: 62, favorableCount: 528, neutral: 25, neutralCount: 213, desfavorable: 13, desfavorableCount: 111 }
    ],
    npsByPeriod: [
      { promoters: 58, promotersCount: 609, passives: 26, passivesCount: 273, detractors: 16, detractorsCount: 168 },
      { promoters: 52, promotersCount: 462, passives: 30, passivesCount: 269, detractors: 18, detractorsCount: 161 },
      { promoters: 50, promotersCount: 440, passives: 31, passivesCount: 273, detractors: 19, detractorsCount: 167 },
      { promoters: 48, promotersCount: 415, passives: 32, passivesCount: 276, detractors: 20, detractorsCount: 173 },
      { promoters: 46, promotersCount: 391, passives: 33, passivesCount: 281, detractors: 21, detractorsCount: 178 }
    ]
  },
  {
    id: "cdim-3",
    name: "Innovación y Agilidad",
    description: "Capacidad de adaptación (Sin historial en Sentimiento)",
    currentScore: 72,
    p1: 74,
    p2: 75,
    p3: 73,
    p4: 70,
    delta: -2,
    trend: 'down',
    responses: 980,
    favorabilidad: { favorable: 58, favorableCount: 568, neutral: 26, neutralCount: 255, desfavorable: 16, desfavorableCount: 157 },
    nps: { promoters: 42, promotersCount: 412, passives: 33, passivesCount: 323, detractors: 25, detractorsCount: 245 },
    favorabilidadByPeriod: [
      { favorable: 58, favorableCount: 568, neutral: 26, neutralCount: 255, desfavorable: 16, desfavorableCount: 157 },
      { favorable: 60, favorableCount: 528, neutral: 25, neutralCount: 220, desfavorable: 15, desfavorableCount: 132 },
      { favorable: 61, favorableCount: 537, neutral: 24, neutralCount: 211, desfavorable: 15, desfavorableCount: 132 },
      { favorable: 59, favorableCount: 502, neutral: 25, neutralCount: 213, desfavorable: 16, desfavorableCount: 136 },
      { favorable: 57, favorableCount: 470, neutral: 27, neutralCount: 223, desfavorable: 16, desfavorableCount: 132 }
    ],
    npsByPeriod: [
      { promoters: 42, promotersCount: 412, passives: 33, passivesCount: 323, detractors: 25, detractorsCount: 245 },
      { promoters: 44, promotersCount: 391, passives: 32, passivesCount: 284, detractors: 24, detractorsCount: 213 },
      { promoters: 45, promotersCount: 396, passives: 32, passivesCount: 282, detractors: 23, detractorsCount: 202 },
      { promoters: 43, promotersCount: 366, passives: 33, passivesCount: 281, detractors: 24, detractorsCount: 204 },
      { promoters: 41, promotersCount: 336, passives: 34, passivesCount: 279, detractors: 25, detractorsCount: 205 }
    ]
  },
  {
    id: "cdim-4",
    name: "Empoderamiento",
    description: "Autonomía en la toma de decisiones",
    currentScore: 79,
    p1: 72,
    p2: 70,
    p3: 68,
    p4: 65,
    delta: 7,
    trend: 'up',
    responses: 1020,
    favorabilidad: { favorable: 67, favorableCount: 683, neutral: 22, neutralCount: 224, desfavorable: 11, desfavorableCount: 112 },
    nps: { promoters: 50, promotersCount: 510, passives: 30, passivesCount: 306, detractors: 20, detractorsCount: 204 },
    favorabilidadByPeriod: [
      { favorable: 67, favorableCount: 683, neutral: 22, neutralCount: 224, desfavorable: 11, desfavorableCount: 112 },
      { favorable: 60, favorableCount: 504, neutral: 26, neutralCount: 218, desfavorable: 14, desfavorableCount: 118 },
      { favorable: 58, favorableCount: 476, neutral: 27, neutralCount: 221, desfavorable: 15, desfavorableCount: 123 },
      { favorable: 56, favorableCount: 437, neutral: 28, neutralCount: 218, desfavorable: 16, desfavorableCount: 125 },
      { favorable: 54, favorableCount: 405, neutral: 29, neutralCount: 218, desfavorable: 17, desfavorableCount: 127 }
    ],
    npsByPeriod: [
      { promoters: 50, promotersCount: 510, passives: 30, passivesCount: 306, detractors: 20, detractorsCount: 204 },
      { promoters: 44, promotersCount: 370, passives: 33, passivesCount: 277, detractors: 23, detractorsCount: 193 },
      { promoters: 42, promotersCount: 349, passives: 34, passivesCount: 283, detractors: 24, detractorsCount: 198 },
      { promoters: 40, promotersCount: 312, passives: 35, passivesCount: 273, detractors: 25, detractorsCount: 195 },
      { promoters: 38, promotersCount: 285, passives: 36, passivesCount: 270, detractors: 26, detractorsCount: 195 }
    ]
  },
  {
    id: "cdim-5",
    name: "Colaboración Transversal",
    description: "Silo vs Trabajo en equipo",
    currentScore: 76,
    p1: 70,
    p2: 68,
    p3: 65,
    p4: 62,
    delta: 6,
    trend: 'up',
    responses: 950,
    favorabilidad: { favorable: 64, favorableCount: 608, neutral: 23, neutralCount: 219, desfavorable: 13, desfavorableCount: 123 },
    nps: { promoters: 47, promotersCount: 447, passives: 31, passivesCount: 294, detractors: 22, detractorsCount: 209 },
    favorabilidadByPeriod: [
      { favorable: 64, favorableCount: 608, neutral: 23, neutralCount: 219, desfavorable: 13, desfavorableCount: 123 },
      { favorable: 58, favorableCount: 464, neutral: 26, neutralCount: 208, desfavorable: 16, desfavorableCount: 128 },
      { favorable: 56, favorableCount: 437, neutral: 27, neutralCount: 208, desfavorable: 17, desfavorableCount: 132 },
      { favorable: 54, favorableCount: 405, neutral: 28, neutralCount: 210, desfavorable: 18, desfavorableCount: 135 },
      { favorable: 52, favorableCount: 374, neutral: 29, neutralCount: 209, desfavorable: 19, desfavorableCount: 137 }
    ],
    npsByPeriod: [
      { promoters: 47, promotersCount: 447, passives: 31, passivesCount: 294, detractors: 22, detractorsCount: 209 },
      { promoters: 42, promotersCount: 336, passives: 34, passivesCount: 272, detractors: 24, detractorsCount: 192 },
      { promoters: 40, promotersCount: 312, passives: 35, passivesCount: 273, detractors: 25, detractorsCount: 195 },
      { promoters: 38, promotersCount: 285, passives: 36, passivesCount: 270, detractors: 26, detractorsCount: 195 },
      { promoters: 36, promotersCount: 259, passives: 37, passivesCount: 267, detractors: 27, detractorsCount: 195 }
    ]
  },
  {
    id: "cdim-6",
    name: "Liderazgo Inspirador",
    description: "Visión y capacidad de guiar de los líderes (Nueva dimensión)",
    currentScore: 85,
    delta: 0,
    trend: 'neutral',
    responses: 480,
    p1: null,
    p2: null,
    p3: null,
    p4: null,
    favorabilidad: { favorable: 76, favorableCount: 365, neutral: 17, neutralCount: 82, desfavorable: 7, desfavorableCount: 33 },
    nps: { promoters: 60, promotersCount: 288, passives: 26, passivesCount: 125, detractors: 14, detractorsCount: 67 },
    favorabilidadByPeriod: [
      { favorable: 76, favorableCount: 365, neutral: 17, neutralCount: 82, desfavorable: 7, desfavorableCount: 33 },
      { favorable: 0, favorableCount: 0, neutral: 0, neutralCount: 0, desfavorable: 0, desfavorableCount: 0 },
      { favorable: 0, favorableCount: 0, neutral: 0, neutralCount: 0, desfavorable: 0, desfavorableCount: 0 },
      { favorable: 0, favorableCount: 0, neutral: 0, neutralCount: 0, desfavorable: 0, desfavorableCount: 0 },
      { favorable: 0, favorableCount: 0, neutral: 0, neutralCount: 0, desfavorable: 0, desfavorableCount: 0 }
    ],
    npsByPeriod: [
      { promoters: 60, promotersCount: 288, passives: 26, passivesCount: 125, detractors: 14, detractorsCount: 67 },
      { promoters: 0, promotersCount: 0, passives: 0, passivesCount: 0, detractors: 0, detractorsCount: 0 },
      { promoters: 0, promotersCount: 0, passives: 0, passivesCount: 0, detractors: 0, detractorsCount: 0 },
      { promoters: 0, promotersCount: 0, passives: 0, passivesCount: 0, detractors: 0, detractorsCount: 0 },
      { promoters: 0, promotersCount: 0, passives: 0, passivesCount: 0, detractors: 0, detractorsCount: 0 }
    ]
  },
  {
    id: "cdim-7",
    name: "Bienestar Emocional",
    description: "Fomento de la salud mental y equilibrio vida-trabajo",
    currentScore: 78,
    p1: null,
    p2: undefined,
    p3: 72,
    p4: null,
    delta: 6,
    trend: 'up',
    responses: 1150,
    favorabilidad: { favorable: 66, favorableCount: 759, neutral: 22, neutralCount: 253, desfavorable: 12, desfavorableCount: 138 },
    nps: { promoters: 49, promotersCount: 564, passives: 31, passivesCount: 356, detractors: 20, detractorsCount: 230 },
    favorabilidadByPeriod: [
      { favorable: 66, favorableCount: 759, neutral: 22, neutralCount: 253, desfavorable: 12, desfavorableCount: 138 },
      { favorable: 0, favorableCount: 0, neutral: 0, neutralCount: 0, desfavorable: 0, desfavorableCount: 0 },
      { favorable: 0, favorableCount: 0, neutral: 0, neutralCount: 0, desfavorable: 0, desfavorableCount: 0 },
      { favorable: 60, favorableCount: 504, neutral: 26, neutralCount: 218, desfavorable: 14, desfavorableCount: 118 },
      { favorable: 0, favorableCount: 0, neutral: 0, neutralCount: 0, desfavorable: 0, desfavorableCount: 0 }
    ],
    npsByPeriod: [
      { promoters: 49, promotersCount: 564, passives: 31, passivesCount: 356, detractors: 20, detractorsCount: 230 },
      { promoters: 0, promotersCount: 0, passives: 0, passivesCount: 0, detractors: 0, detractorsCount: 0 },
      { promoters: 0, promotersCount: 0, passives: 0, passivesCount: 0, detractors: 0, detractorsCount: 0 },
      { promoters: 44, promotersCount: 370, passives: 33, passivesCount: 277, detractors: 23, detractorsCount: 193 },
      { promoters: 0, promotersCount: 0, passives: 0, passivesCount: 0, detractors: 0, detractorsCount: 0 }
    ]
  },
  {
    id: "cdim-8",
    name: "Bienestar y Equilibrio",
    description: "Equilibrio vida-trabajo (Solo datos históricos antiguos)",
    currentScore: null,
    p1: null,
    p2: 65,
    p3: 60,
    p4: null,
    delta: null,
    trend: 'up',
    responses: 0,
    favorabilidad: { favorable: 0, favorableCount: 0, neutral: 0, neutralCount: 0, desfavorable: 0, desfavorableCount: 0 },
    nps: { promoters: 0, promotersCount: 0, passives: 0, passivesCount: 0, detractors: 0, detractorsCount: 0 },
    favorabilidadByPeriod: [
      { favorable: 0, favorableCount: 0, neutral: 0, neutralCount: 0, desfavorable: 0, desfavorableCount: 0 },
      { favorable: 0, favorableCount: 0, neutral: 0, neutralCount: 0, desfavorable: 0, desfavorableCount: 0 },
      { favorable: 55, favorableCount: 385, neutral: 28, neutralCount: 196, desfavorable: 17, desfavorableCount: 119 },
      { favorable: 50, favorableCount: 330, neutral: 30, neutralCount: 198, desfavorable: 20, desfavorableCount: 132 },
      { favorable: 0, favorableCount: 0, neutral: 0, neutralCount: 0, desfavorable: 0, desfavorableCount: 0 }
    ],
    npsByPeriod: [
      { promoters: 0, promotersCount: 0, passives: 0, passivesCount: 0, detractors: 0, detractorsCount: 0 },
      { promoters: 0, promotersCount: 0, passives: 0, passivesCount: 0, detractors: 0, detractorsCount: 0 },
      { promoters: 40, promotersCount: 280, passives: 35, passivesCount: 245, detractors: 25, detractorsCount: 175 },
      { promoters: 35, promotersCount: 231, passives: 37, passivesCount: 244, detractors: 28, detractorsCount: 185 },
      { promoters: 0, promotersCount: 0, passives: 0, passivesCount: 0, detractors: 0, detractorsCount: 0 }
    ]
  }
];
