import { NavGroup } from "@/lib/types/navigation";
import { SidebarNavItem } from "./SidebarNavItem";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface Props {
  group: NavGroup;
  sidebarCollapsed: boolean;
  smoothCollapseClass: string;
}

export function SidebarNavGroup({
  group,
  sidebarCollapsed,
  smoothCollapseClass,
}: Props) {
  const pathname = usePathname();

  return (
    <div className="mb-6 last:mb-0">
      <p
        className={cn(
          "px-2 mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/60",
          smoothCollapseClass,
        )}
      >
        {group.title}
      </p>
      <nav className="flex flex-col gap-2">
        {group.items.map((item) => {
          const isRootDashboard = item.href === "/dashboard";
          const isActive = isRootDashboard
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <SidebarNavItem
              key={item.href}
              item={item}
              isActive={isActive}
              sidebarCollapsed={sidebarCollapsed}
              smoothCollapseClass={smoothCollapseClass}
            />
          );
        })}
      </nav>
    </div>
  );
}
