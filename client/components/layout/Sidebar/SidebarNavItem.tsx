import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { NavItem } from "@/lib/types/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Props {
  item: NavItem;
  isActive: boolean;
  sidebarCollapsed: boolean;
  smoothCollapseClass: string;
}

export function SidebarNavItem({
  item,
  isActive,
  sidebarCollapsed,
  smoothCollapseClass,
}: Props) {
  const Icon = item.icon;

  const textClass = cn(
    "origin-left overflow-hidden whitespace-nowrap",
    sidebarCollapsed ? "max-w-0 opacity-0" : "max-w-[200px] opacity-100",
  );

  const smoothChevronClass = cn(
    "",
    sidebarCollapsed
      ? "md:max-w-0 md:translate-x-1 md:opacity-0 md:pointer-events-none"
      : "md:max-w-4 md:translate-x-0 md:opacity-100"
  );

  const navItemContent = (
    <div
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium transition",
        sidebarCollapsed &&
          "md:mx-auto md:h-11 md:w-11 md:justify-center md:gap-0 md:px-0 md:py-0",
        isActive
          ? "border-sidebar-border bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
          : "border-transparent text-sidebar-foreground/85 hover:border-sidebar-border hover:bg-sidebar-accent/70"
      )}
      title={sidebarCollapsed ? undefined : item.label}
    >
      <span
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg",
          isActive
            ? "bg-sidebar-primary text-sidebar-primary-foreground"
            : "bg-sidebar-accent text-sidebar-foreground/80"
        )}
      >
        <Icon size={16} />
      </span>
      
      <span className={cn("flex-1 truncate", smoothCollapseClass)}>
        {item.label}
      </span>
      
      {item.badge && (
        <span className={cn(
          "bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-auto",
          smoothCollapseClass
        )}>
          {item.badge}
        </span>
      )}
      
      {!item.badge && (
        <ChevronRight
          size={14}
          className={cn(
            smoothChevronClass,
            "text-sidebar-foreground/30",
            isActive && "text-sidebar-foreground/60"
          )}
        />
      )}
    </div>
  );

  if (!sidebarCollapsed) {
    return (
      <Link href={item.href}>
        {navItemContent}
      </Link>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link href={item.href}>
          {navItemContent}
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={10}>
        {item.label}
      </TooltipContent>
    </Tooltip>
  );
}
