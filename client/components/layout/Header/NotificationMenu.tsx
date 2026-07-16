import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell } from "lucide-react";
import { AnimatedList } from "@/components/ui/animated-list";

const notificationItems = [
  {
    id: "n-1",
    title: "Leave request approved",
    detail: "Ava Williams approved Rahul's leave request.",
    time: "2m ago",
  },
  {
    id: "n-2",
    title: "Timesheet pending review",
    detail: "5 entries are waiting for manager approval.",
    time: "10m ago",
  },
  {
    id: "n-3",
    title: "New employee onboarding",
    detail: "Onboarding checklist created for Maria Gomez.",
    time: "22m ago",
  },
] as const;

export function NotificationMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell size={20} />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          <span className="text-xs text-muted-foreground">
            {notificationItems.length} new
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-72 overflow-hidden p-2">
          <AnimatedList delay={220} className="items-stretch gap-2">
            {notificationItems.map((item) => (
              <div
                key={item.id}
                className="rounded-md border border-border/70 bg-background/80 px-3 py-2"
              >
                <p className="text-sm font-medium text-foreground">
                  {item.title}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {item.detail}
                </p>
                <p className="mt-1.5 text-[11px] text-muted-foreground/80">
                  {item.time}
                </p>
              </div>
            ))}
          </AnimatedList>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
