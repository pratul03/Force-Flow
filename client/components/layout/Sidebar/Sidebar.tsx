"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useApp } from "@/hooks/useApp";
import { organizationsApi } from "@/features/organizations/api";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Menu, X, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SIDEBAR_NAV } from "@/lib/config/navigation";
import { SidebarNavGroup } from "./SidebarNavGroup";
import { SidebarUserCard } from "./SidebarUserCard";
import { SidebarUpgradeCard } from "./SidebarUpgradeCard";

export function Sidebar() {
  const {
    sidebarOpen,
    sidebarCollapsed,
    toggleSidebar,
    toggleSidebarCollapsed,
  } = useApp();
  const { user } = useAuth();
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

  const smoothCollapseClass = cn(
    "origin-left overflow-hidden whitespace-nowrap",
    sidebarCollapsed
      ? "md:max-w-0 md:translate-x-1 md:opacity-0 md:pointer-events-none hidden"
      : "md:max-w-[220px] md:translate-x-0 md:opacity-100",
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
      <div
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-72 border-r border-sidebar-border bg-sidebar text-sidebar-foreground",
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
          <span
            className={cn("inline-flex", !sidebarCollapsed && "rotate-180")}
          >
            <ChevronsRight size={14} />
          </span>
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
            {SIDEBAR_NAV.map((group) => (
              <SidebarNavGroup
                key={group.title}
                group={group}
                sidebarCollapsed={sidebarCollapsed}
                smoothCollapseClass={smoothCollapseClass}
              />
            ))}

            <SidebarUpgradeCard sidebarCollapsed={sidebarCollapsed} />
          </ScrollArea>

          <SidebarUserCard
            sidebarCollapsed={sidebarCollapsed}
            smoothCollapseClass={smoothCollapseClass}
          />
        </div>
      </div>
    </>
  );
}
