import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Props {
  sidebarCollapsed: boolean;
}

export function SidebarUpgradeCard({ sidebarCollapsed }: Props) {
  if (sidebarCollapsed) {
    return (
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
    );
  }

  return (
    <div className="mt-5 rounded-2xl border border-sidebar-border bg-sidebar-accent p-3">
      <p className="text-sm font-semibold text-sidebar-foreground">
        Unlock everything
      </p>
      <p className="mt-1 text-xs text-sidebar-foreground/70">
        Get instant access to premium dashboards and team productivity tools.
      </p>
      <Button className="mt-3 h-8 w-full rounded-lg bg-sidebar-primary text-xs text-sidebar-primary-foreground hover:bg-sidebar-primary/90">
        <Sparkles className="mr-1.5 h-3.5 w-3.5" />
        Upgrade Workspace
      </Button>
    </div>
  );
}
