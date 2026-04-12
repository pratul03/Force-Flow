"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useApp } from "@/hooks/useApp";
import { organizationsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LayoutDashboard,
  BriefcaseBusiness,
  Users,
  Clock,
  Calendar,
  Settings,
  Mail,
  Tickets,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ChevronsRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as motion from "motion/react-client";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Users, label: "Employees", href: "/employees" },
  { icon: BriefcaseBusiness, label: "Leads", href: "/leads" },
  { icon: Clock, label: "Timesheet", href: "/timesheet" },
  { icon: Calendar, label: "Leave Requests", href: "/leave" },
  { icon: Mail, label: "Mailbox", href: "/mailbox" },
  { icon: Tickets, label: "Tickets", href: "/tickets" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export function Sidebar() {
  const {
    sidebarOpen,
    sidebarCollapsed,
    toggleSidebar,
    toggleSidebarCollapsed,
  } = useApp();
  const { logout, user } = useAuth();
  const pathname = usePathname();
  const [organizationLogoUrl, setOrganizationLogoUrl] = useState<string | null>(
    null,
  );

  useEffect(() => {
    async function loadOrganizationLogo() {
      if (!user?.organizationId) {
        setOrganizationLogoUrl(null);
        return;
      }

      const response = await organizationsApi.getById(user.organizationId);
      if (!response.success || !response.data) {
        return;
      }

      setOrganizationLogoUrl(response.data.logoUrl || null);
    }

    void loadOrganizationLogo();
  }, [user?.organizationId]);

  useEffect(() => {
    const onOrganizationLogoUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{ logoUrl?: string | null }>;
      setOrganizationLogoUrl(customEvent.detail?.logoUrl || null);
    };

    window.addEventListener(
      "organization-logo-updated",
      onOrganizationLogoUpdated,
    );

    return () => {
      window.removeEventListener(
        "organization-logo-updated",
        onOrganizationLogoUpdated,
      );
    };
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  const initials =
    user?.name
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  const smoothCollapseClass = cn(
    "origin-left overflow-hidden whitespace-nowrap transition-[opacity,max-width,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
    sidebarCollapsed
      ? "md:max-w-0 md:translate-x-1 md:opacity-0 md:pointer-events-none"
      : "md:max-w-[220px] md:translate-x-0 md:opacity-100",
  );

  const smoothChevronClass = cn(
    "transition-[opacity,max-width,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
    sidebarCollapsed
      ? "md:max-w-0 md:translate-x-1 md:opacity-0 md:pointer-events-none"
      : "md:max-w-4 md:translate-x-0 md:opacity-100",
  );

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={toggleSidebar}
        className="fixed left-4 top-4 z-50 rounded-xl border border-border bg-background p-2 shadow-sm md:hidden"
      >
        {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-30"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <motion.div
        layout
        transition={{
          type: "tween",
          duration: 1.25,
          ease: [0.22, 1, 0.36, 1],
        }}
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-72 border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-300",
          "md:translate-x-0 md:static md:h-screen",
          sidebarCollapsed ? "md:w-20" : "md:w-72",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={toggleSidebarCollapsed}
          className="absolute -right-3 top-24 z-50 hidden h-7 w-7 rounded-full border-sidebar-border bg-background shadow-sm md:inline-flex"
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <motion.span
            animate={{ rotate: sidebarCollapsed ? 0 : 180 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex"
          >
            <ChevronsRight size={14} />
          </motion.span>
        </Button>

        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center border-b border-sidebar-border px-4">
            <div
              className={cn(
                "flex items-center gap-3",
                sidebarCollapsed && "md:justify-center",
              )}
            >
              {organizationLogoUrl ? (
                <img
                  src={organizationLogoUrl}
                  alt="Organization logo"
                  className="h-10 w-10 rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground">
                  FF
                </div>
              )}
              <div className={smoothCollapseClass}>
                <h1 className="text-lg font-semibold text-sidebar-foreground">
                  FlowForce
                </h1>
                <p className="text-xs text-sidebar-foreground/70">
                  Workforce control center
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea
            className={cn("flex-1 py-5", sidebarCollapsed ? "px-2" : "px-4")}
          >
            <p
              className={cn(
                "px-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/60",
                smoothCollapseClass,
              )}
            >
              Dashboards
            </p>
            <nav className="mt-2.5 space-y-1.5">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isRootDashboard = item.href === "/dashboard";
                const isActive = isRootDashboard
                  ? pathname === item.href
                  : pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);

                const navItem = (
                  <Link key={item.href} href={item.href}>
                    <div
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium transition",
                        sidebarCollapsed &&
                          "md:mx-auto md:h-11 md:w-11 md:justify-center md:gap-0 md:px-0 md:py-0",
                        isActive
                          ? "border-sidebar-border bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                          : "border-transparent text-sidebar-foreground/85 hover:border-sidebar-border hover:bg-sidebar-accent/70",
                      )}
                      title={item.label}
                    >
                      <span
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-lg",
                          isActive
                            ? "bg-sidebar-primary text-sidebar-primary-foreground"
                            : "bg-sidebar-accent text-sidebar-foreground/80",
                        )}
                      >
                        <Icon size={16} />
                      </span>
                      <span
                        className={cn("flex-1 truncate", smoothCollapseClass)}
                      >
                        {item.label}
                      </span>
                      <ChevronRight
                        size={14}
                        className={cn(
                          smoothChevronClass,
                          "text-sidebar-foreground/30",
                          isActive && "text-sidebar-foreground/60",
                        )}
                      />
                    </div>
                  </Link>
                );

                if (!sidebarCollapsed) {
                  return navItem;
                }

                return (
                  <Tooltip key={`tooltip-${item.href}`}>
                    <TooltipTrigger asChild>{navItem}</TooltipTrigger>
                    <TooltipContent side="right" sideOffset={10}>
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </nav>

            {sidebarCollapsed ? (
              <div className="mt-5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      title="Upgrade Workspace"
                      aria-label="Upgrade Workspace"
                      className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-transparent text-sidebar-foreground/85 transition hover:border-sidebar-border hover:bg-sidebar-accent/70"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                        <Sparkles className="h-4 w-4" />
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={10}>
                    Upgrade Workspace
                  </TooltipContent>
                </Tooltip>
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-sidebar-border bg-sidebar-accent p-3">
                <p className="text-sm font-semibold text-sidebar-foreground">
                  Unlock everything
                </p>
                <p className="mt-1 text-xs text-sidebar-foreground/70">
                  Get instant access to premium dashboards and team productivity
                  tools.
                </p>
                <Button className="mt-3 h-8 w-full rounded-lg bg-sidebar-primary text-xs text-sidebar-primary-foreground hover:bg-sidebar-primary/90">
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                  Upgrade Workspace
                </Button>
              </div>
            )}
          </ScrollArea>

          {/* User info and logout */}
          <div
            className={cn(
              "space-y-3 border-t border-sidebar-border py-4",
              sidebarCollapsed ? "px-2" : "px-4",
            )}
          >
            {user && (
              <div
                className={cn(
                  "flex items-center gap-3 rounded-xl border border-sidebar-border bg-sidebar-accent p-2.5",
                  sidebarCollapsed && "md:justify-center",
                )}
                title={user.name}
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user.avatarUrl} alt={user.name} />
                  <AvatarFallback className="bg-sidebar-primary text-xs text-sidebar-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className={cn("min-w-0 flex-1", smoothCollapseClass)}>
                  <p className="truncate text-sm font-semibold text-sidebar-foreground">
                    {user.name}
                  </p>
                  <p className="truncate text-xs text-sidebar-foreground/70">
                    {user.email}
                  </p>
                </div>
              </div>
            )}
            {sidebarCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleLogout}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-3 rounded-xl text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-red-500",
                      sidebarCollapsed && "md:justify-center",
                    )}
                    title="Logout"
                  >
                    <LogOut size={18} />
                    <span className={smoothCollapseClass}>Logout</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={10}>
                  Logout
                </TooltipContent>
              </Tooltip>
            ) : (
              <Button
                onClick={handleLogout}
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 rounded-xl text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-red-500",
                  sidebarCollapsed && "md:justify-center",
                )}
                title="Logout"
              >
                <LogOut size={18} />
                <span className={smoothCollapseClass}>Logout</span>
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}
