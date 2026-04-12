"use client";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Settings, LogOut } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import Link from "next/link";
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

export function Header() {
  const { user, logout } = useAuth();

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "U";

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="sticky top-0 z-40 h-16 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="flex h-full items-center justify-between px-4 md:px-8">
        {/* Left side - Title */}
        <div>
          <h2 className="text-xl font-semibold text-foreground">Dashboard</h2>
        </div>

        {/* Right side - Actions and User menu */}
        <div className="flex items-center gap-4">
          <ThemeToggle />

          {/* Notifications */}
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

          {/* Settings */}
          <Link href="/settings">
            <Button variant="ghost" size="icon">
              <Settings size={20} />
            </Button>
          </Link>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="rounded-full p-0 h-10 w-10">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user?.avatarUrl} alt={user?.name} />
                  <AvatarFallback className="bg-blue-600 text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col gap-1">
                  <p className="font-semibold">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-red-600 cursor-pointer"
              >
                <LogOut size={16} className="mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
