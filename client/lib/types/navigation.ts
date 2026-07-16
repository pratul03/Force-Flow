import { LucideIcon } from "lucide-react";
import { UserRole } from "../types";

/**
 * Base extension interface to allow custom properties
 * on all navigation-related configuration objects.
 */
export interface ExtensibleConfig {
  [key: string]: any;
}

export interface RouteMeta extends ExtensibleConfig {
  title: string;
  description?: string;
}

export interface AppRouteDef extends ExtensibleConfig {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  roles?: UserRole[];
  meta: RouteMeta;
  badge?: string;
}

export interface NavItem extends ExtensibleConfig {
  icon: LucideIcon;
  label: string;
  href: string;
  badge?: string;
  roles?: UserRole[];
}

export interface NavGroup extends ExtensibleConfig {
  title: string;
  items: NavItem[];
}
