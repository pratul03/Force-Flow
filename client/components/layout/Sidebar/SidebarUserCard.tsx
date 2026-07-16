import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  sidebarCollapsed: boolean;
  smoothCollapseClass: string;
}

export function SidebarUserCard({ sidebarCollapsed, smoothCollapseClass }: Props) {
  const { user, logout } = useAuth();

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

  return (
    <div
      className={cn(
        "space-y-3 border-t border-sidebar-border py-4",
        sidebarCollapsed ? "px-2" : "px-4"
      )}
    >
      {user && (
        <div
          className={cn(
            "flex items-center gap-3 rounded-xl border border-sidebar-border bg-sidebar-accent p-2.5",
            sidebarCollapsed && "md:justify-center"
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
                "md:justify-center"
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
          className="w-full justify-start gap-3 rounded-xl text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-red-500"
          title="Logout"
        >
          <LogOut size={18} />
          <span className={smoothCollapseClass}>Logout</span>
        </Button>
      )}
    </div>
  );
}
