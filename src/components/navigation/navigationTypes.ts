import type { IconName } from "../../icons/iconTypes";

export type NavigationRole = "admin" | "collaborator" | "shared" | "creator";

export type SidebarVariant = "full" | "rail";

export interface NavigationBadge {
  count?: number;
  dot?: boolean;
  variant?: "primary" | "destructive" | "warning" | "info";
}

export interface NavigationItem {
  id: string;
  label: string;
  icon?: IconName;
  badge?: NavigationBadge;
  active?: boolean;
  disabled?: boolean;
  role?: NavigationRole;
  /** Future structure for nested items (not implemented in UI yet) */
  children?: NavigationItem[];
}

export interface NavigationSection {
  id: string;
  title?: string;
  items: NavigationItem[];
  role?: NavigationRole;
}

export interface ProductSubNavItem {
  id: string;
  label: string;
  badge?: NavigationBadge;
  disabled?: boolean;
}

export interface NavigationComponentProps<T> {
  items: T[];
  activeItemId?: string;
  onItemSelect?: (id: string) => void;
  className?: string;
}

export interface SidebarProps extends NavigationComponentProps<NavigationSection> {
  variant?: SidebarVariant;
  role?: NavigationRole;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}
