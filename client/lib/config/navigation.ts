import {
  LayoutDashboard,
  BriefcaseBusiness,
  Users,
  Clock,
  Calendar,
  Settings,
  Mail,
  Tickets,
  Building2,
  BadgeCheck,
  BarChart3,
  CalendarDays,
  LucideIcon
} from "lucide-react";
import { AppRouteDef, NavGroup, RouteMeta } from "../types/navigation";

// 1. Centralized Route Registry
// Each feature defines its own route configuration independently
export const APP_ROUTES = {
  dashboard: {
    id: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    meta: { title: "Dashboard", description: "Welcome back! Here's an overview of your organization." }
  },
  employees: {
    id: "employees",
    label: "Employees",
    href: "/employees",
    icon: Users,
    meta: { title: "Employees", description: "Manage your team" }
  },
  departments: {
    id: "departments",
    label: "Departments",
    href: "/departments",
    icon: Building2,
    meta: { title: "Departments", description: "Manage organizational hierarchy" }
  },
  designations: {
    id: "designations",
    label: "Designations",
    href: "/designations",
    icon: BadgeCheck,
    meta: { title: "Designations", description: "Manage job titles and salary bands" }
  },
  timesheet: {
    id: "timesheet",
    label: "Timesheet",
    href: "/timesheet",
    icon: Clock,
    meta: { title: "Timesheet", description: "Review and approve time logs" }
  },
  leave: {
    id: "leave",
    label: "My Leaves",
    href: "/leave",
    icon: Calendar,
    meta: { title: "My Leaves", description: "Manage your time off" }
  },
  leaveApprovals: {
    id: "leaveApprovals",
    label: "Leave Approvals",
    href: "/leave/requests",
    icon: CalendarDays,
    meta: { title: "Leave Approvals", description: "Review and approve leave requests" }
  },
  holidays: {
    id: "holidays",
    label: "Holidays",
    href: "/holidays",
    icon: CalendarDays,
    meta: { title: "Holiday Calendar", description: "Manage company holidays and observances" }
  },
  tickets: {
    id: "tickets",
    label: "Tickets",
    href: "/tickets",
    icon: Tickets,
    meta: { title: "Tickets", description: "Support and IT requests" }
  },
  leads: {
    id: "leads",
    label: "Leads",
    href: "/leads",
    icon: BriefcaseBusiness,
    meta: { title: "Leads", description: "Track your sales pipeline" }
  },
  mailbox: {
    id: "mailbox",
    label: "Mailbox",
    href: "/mailbox",
    icon: Mail,
    meta: { title: "Mailbox", description: "Unified communication center" }
  },
  reports: {
    id: "reports",
    label: "Reports",
    href: "/reports",
    icon: BarChart3,
    meta: { title: "Reports", description: "Analytics and insights" }
  },
  settings: {
    id: "settings",
    label: "Settings",
    href: "/settings",
    icon: Settings,
    meta: { title: "Settings", description: "Manage your preferences" }
  }
} satisfies Record<string, AppRouteDef>;

// 2. Sidebar Orchestration
// We compose the sidebar groups from the individual route definitions
export const SIDEBAR_NAV: NavGroup[] = [
  {
    title: "Overview",
    items: [APP_ROUTES.dashboard],
  },
  {
    title: "People",
    items: [
      APP_ROUTES.employees,
      APP_ROUTES.departments,
      APP_ROUTES.designations,
    ],
  },
  {
    title: "Operations",
    items: [
      APP_ROUTES.timesheet,
      APP_ROUTES.leave,
      APP_ROUTES.leaveApprovals,
      APP_ROUTES.holidays,
      APP_ROUTES.tickets,
    ],
  },
  {
    title: "Business",
    items: [
      APP_ROUTES.leads,
      APP_ROUTES.mailbox,
      APP_ROUTES.reports,
    ],
  },
  {
    title: "Settings",
    items: [
      APP_ROUTES.settings,
    ],
  }
];

// 3. Dynamic Meta Resolver
// Resolves metadata dynamically from the registry based on pathname
export function getRouteMeta(pathname: string): RouteMeta {
  // Check direct match in registry
  for (const route of Object.values(APP_ROUTES)) {
    if (route.href === pathname) {
      return route.meta;
    }
  }

  // Exact sub-routes missing from sidebar but needing meta
  if (pathname === "/employees/new") return { title: "Add Employee", description: "Create a new employee profile" };
  if (pathname === "/timesheet/new") return { title: "New Timesheet Entry", description: "Add a manual timesheet entry" };
  if (pathname === "/leave/request") return { title: "Request Leave", description: "Submit a new leave request" };
  if (pathname === "/settings/organization") return { title: "Organization Settings", description: "Manage global company settings" };
  if (pathname === "/profile") return { title: "Profile", description: "Your account details" };

  // Dynamic route matches
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] === "employees" && segments.length === 2) {
    return { title: "Employee Details", description: "View and edit employee information" };
  }
  if (segments[0] === "quote" && segments[1] === "respond" && segments.length === 3) {
    return { title: "Respond to Quote", description: "Review and respond to quote" };
  }

  // Fallback: capitalize the first segment
  if (segments.length > 0) {
    const title = segments[0].charAt(0).toUpperCase() + segments[0].slice(1).replace(/-/g, " ");
    return { title, description: "Manage " + title.toLowerCase() };
  }

  return { title: "Dashboard", description: "Welcome to FlowForce" };
}
