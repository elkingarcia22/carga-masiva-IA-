import type { NavigationSection, NavigationRole } from "@/components/navigation/navigationTypes";
import type { IconName } from "@/icons/iconTypes";

/**
 * UBITS PLAYGROUND NAVIGATION CONFIGURATION
 * Contains the 4 official navigation modes extracted from legacy architecture.
 */

export const ADMIN_NAVIGATION: NavigationSection[] = [
  {
    id: "admin",
    items: [
      { id: "inicio", label: "Inicio", icon: "home" as IconName },
      { id: "empresa", label: "Empresa", icon: "building" as IconName },
      { id: "aprendizaje", label: "Aprendizaje", icon: "graduation" as IconName },
      { id: "diagnóstico", label: "Diagnóstico", icon: "trendUp" as IconName },
      { id: "desempeño", label: "Desempeño", icon: "chart" as IconName },
      { id: "encuestas", label: "Encuestas", icon: "survey" as IconName },
    ]
  }
];

export const COLLABORATOR_NAVIGATION: NavigationSection[] = [
  {
    id: "collab",
    items: [
      { id: "aprendizaje", label: "Aprendizaje", icon: "graduation" as IconName },
      { id: "diagnóstico", label: "Diagnóstico", icon: "trendUp" as IconName },
      { id: "desempeño", label: "Desempeño", icon: "chart" as IconName },
      { id: "encuestas", label: "Encuestas", icon: "survey" as IconName },
      { id: "reclutamiento", label: "Reclutamiento", icon: "users" as IconName },
      { id: "tareas", label: "Tareas", icon: "layers" as IconName },
      { id: "ia-para-hr", label: "IA para HR", icon: "sparkles" as IconName },
    ]
  }
];

export const CREATOR_NAVIGATION: NavigationSection[] = [
  {
    id: "creator",
    items: [
      { id: "lms-creator", label: "LMS Creator", icon: "bolt" as IconName },
      { id: "planes-formacion", label: "Planes", icon: "survey" as IconName },
      { id: "certificados", label: "Certificados", icon: "award" as IconName },
      { id: "personalizacion", label: "Personalización", icon: "palette" as IconName },
    ]
  }
];

export const RECRUITMENT_NAVIGATION: NavigationSection[] = [
  {
    id: "recruitment",
    items: [
      { id: "dashboard", label: "Dashboard", icon: "chart" as IconName },
      { id: "vacantes", label: "Vacantes", icon: "vacancies" as IconName },
      { id: "candidatos", label: "Candidatos", icon: "users" as IconName },
      { id: "plantillas", label: "Plantillas", icon: "templates" as IconName },
      { id: "agente-ai", label: "Agente AI", icon: "sparkles" as IconName },
    ]
  }
];

export type PlaygroundRole = NavigationRole | "creator" | "recruitment";

export const getPlaygroundNavigation = (role: PlaygroundRole): NavigationSection[] => {
  switch (role) {
    case "admin": return ADMIN_NAVIGATION;
    case "collaborator": return COLLABORATOR_NAVIGATION;
    case "creator": return CREATOR_NAVIGATION;
    case "recruitment": return RECRUITMENT_NAVIGATION;
    default: return COLLABORATOR_NAVIGATION;
  }
};
