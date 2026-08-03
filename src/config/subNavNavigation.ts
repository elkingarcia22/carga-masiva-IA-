import type { IconName } from "@/icons/iconTypes";

export interface SubNavTab {
  id: string;
  label: string;
  icon?: IconName;
  active?: boolean;
}

export interface SubNavVariant {
  name: string;
  tabs: SubNavTab[];
}

/**
 * UBITS SUB-NAV VARIANTS CONFIGURATION
 * Complete mapping of all legacy and modern variants.
 */
export const SUB_NAV_VARIANTS: Record<string, SubNavVariant> = {
  template: {
    name: 'Plantilla',
    tabs: [
      { id: 'section1', label: 'Sección 1', icon: 'home' },
      { id: 'section2', label: 'Sección 2', icon: 'file' },
      { id: 'section3', label: 'Sección 3', icon: 'chart' },
      { id: 'section4', label: 'Sección 4', icon: 'settings' },
      { id: 'section5', label: 'Sección 5', icon: 'sparkles' }
    ]
  },
  documentacion: {
    name: 'Documentación',
    tabs: [
      { id: 'inicio', label: 'Inicio', icon: 'home' },
      { id: 'prompts', label: 'Guía de Prompts', icon: 'sparkles' },
      { id: 'componentes', label: 'Componentes', icon: 'layers' },
      { id: 'colores', label: 'Colores', icon: 'chart' },
      { id: 'iconos', label: 'Iconos', icon: 'settings' }
    ]
  },
  aprendizaje: {
    name: 'Aprendizaje',
    tabs: [
      { id: 'home', label: 'Inicio', icon: 'home' },
      { id: 'modo-estudio-ia', label: 'Modo estudio IA', icon: 'sparkles' },
      { id: 'catalog', label: 'Catálogo', icon: 'file' },
      { id: 'corporate', label: 'U. Corporativa', icon: 'building' },
      { id: 'study-zone', label: 'Zona de estudio', icon: 'layers' }
    ]
  },
  desempeno: {
    name: 'Desempeño',
    tabs: [
      { id: 'evaluations', label: 'Evaluaciones 360', icon: 'chart' },
      { id: 'objectives', label: 'Objetivos', icon: 'survey' },
      { id: 'metrics', label: 'Métricas', icon: 'trendUp' },
      { id: 'reports', label: 'Reportes', icon: 'file' }
    ]
  },
  tareas: {
    name: 'Tareas',
    tabs: [
      { id: 'tasks', label: 'Tareas', icon: 'layers' },
      { id: 'plans', label: 'Planes', icon: 'survey' },
      { id: 'plantillas', label: 'Plantillas', icon: 'file' },
      { id: 'seguimiento', label: 'Seguimiento', icon: 'trendUp' }
    ]
  },
  'admin-aprendizaje': {
    name: 'Aprendizaje (Admin)',
    tabs: [
      { id: 'planes-formacion', label: 'Planes de formación', icon: 'survey' },
      { id: 'u-corporativa', label: 'Universidad corporativa', icon: 'building' },
      { id: 'certificados', label: 'Certificados', icon: 'award' },
      { id: 'seguimiento', label: 'Seguimiento', icon: 'trendUp' }
    ]
  },
  encuestas: {
    name: 'Encuestas',
    tabs: [
      { id: 'encuestas', label: 'Encuestas', icon: 'survey' },
      { id: 'analitica', label: 'Analítica', icon: 'chart' },
      { id: 'reportes', label: 'Reportes', icon: 'file' }
    ]
  },
  reclutamiento: {
    name: 'Reclutamiento',
    tabs: [
      { id: 'dashboard', label: 'Dashboard', icon: 'chart' },
      { id: 'vacantes', label: 'Vacantes', icon: 'vacancies' },
      { id: 'candidatos', label: 'Candidatos', icon: 'users' },
      { id: 'plantillas', label: 'Plantillas', icon: 'templates' }
    ]
  },
  empresa: {
    name: 'Empresa',
    tabs: [
      { id: 'usuarios', label: 'Usuarios', icon: 'users' },
      { id: 'organigrama', label: 'Organigrama', icon: 'layers' },
      { id: 'datos', label: 'Datos Empresa', icon: 'building' },
      { id: 'roles', label: 'Roles y Permisos', icon: 'settings' }
    ]
  },
  diagnostico: {
    name: 'Diagnóstico',
    tabs: [
      { id: 'diagnostico', label: 'Mis Diagnósticos', icon: 'survey' },
      { id: 'resultados', label: 'Resultados', icon: 'chart' }
    ]
  }
};

export type SubNavVariantKey = keyof typeof SUB_NAV_VARIANTS;
