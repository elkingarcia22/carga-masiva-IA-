import { 
  Home, 
  GraduationCap, 
  Activity, 
  Database, 
  ClipboardList, 
  Users, 
  Layers, 
  Sparkles,
  Book,
  Building2,
  BookOpen,
  Stethoscope,
  PieChart,
  Target,
  BarChart,
  FileText,
  LayoutList,
  FilePlus,
  LineChart,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export interface NavItemConfig {
  id: string
  label: string
  icon: LucideIcon
  path: string
  description?: string
  breadcrumbs: string[]
  tabs?: { id: string; label: string }[]
  submenu?: { icon: LucideIcon; text: string }[]
}

export const navigationConfig: NavItemConfig[] = [
  {
    id: "overview",
    label: "Inicio",
    icon: Home,
    path: "/",
    description: "Vista general de tu plataforma",
    breadcrumbs: ["Plataforma", "Inicio"],
  },
  {
    id: "learning",
    label: "Aprendizaje",
    icon: GraduationCap,
    path: "/learning",
    description: "Gestión de programas y cursos",
    breadcrumbs: ["Plataforma", "Aprendizaje"],
    tabs: [
      { id: "courses", label: "Cursos" },
      { id: "tracks", label: "Rutas de aprendizaje" },
      { id: "content", label: "Contenido" },
    ],
    submenu: [
      { icon: Home, text: "Inicio" },
      { icon: Sparkles, text: "Modo estudio IA" },
      { icon: Book, text: "Catálogo" },
      { icon: Building2, text: "U. Corporativa" },
      { icon: BookOpen, text: "Zona de estudio" },
    ]
  },
  {
    id: "diagnostics",
    label: "Diagnóstico",
    icon: Activity,
    path: "/diagnostics",
    description: "Evaluaciones y diagnósticos iniciales",
    breadcrumbs: ["Plataforma", "Diagnóstico"],
    tabs: [
      { id: "results", label: "Resultados" },
      { id: "history", label: "Historial" },
    ],
    submenu: [
      { icon: Stethoscope, text: "Diagnostico" }
    ]
  },
  {
    id: "performance",
    label: "Desempeño",
    icon: Database,
    path: "/performance",
    description: "Métricas de rendimiento y KPIs",
    breadcrumbs: ["Plataforma", "Desempeño"],
    submenu: [
      { icon: PieChart, text: "Evaluaciones 360" },
      { icon: Target, text: "Objetivos" },
      { icon: BarChart, text: "Métricas" },
      { icon: FileText, text: "Reportes" },
    ]
  },
  {
    id: "surveys",
    label: "Encuestas",
    icon: ClipboardList,
    path: "/surveys",
    description: "Gestión de encuestas de clima y satisfacción",
    breadcrumbs: ["Plataforma", "Encuestas"],
  },
  {
    id: "users",
    label: "Usuarios",
    icon: Users,
    path: "/users",
    description: "Administración de usuarios y roles",
    breadcrumbs: ["Administración", "Usuarios"],
  },
  {
    id: "tasks",
    label: "Tareas",
    icon: Layers,
    path: "/tasks",
    description: "Gestión de tareas y planes de acción",
    breadcrumbs: ["Plataforma", "Tareas"],
    submenu: [
      { icon: LayoutList, text: "Tareas" },
      { icon: Layers, text: "Planes" },
      { icon: FilePlus, text: "Plantillas" },
      { icon: LineChart, text: "Seguimiento" },
    ]
  },
]
