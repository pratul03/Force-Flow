import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings, LogOut } from "lucide-react";
import { ThemeToggle } from "../ThemeToggle";
import Link from "next/link";
import { NotificationMenu } from "./NotificationMenu";

export function HeaderActions() {
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
    <div className="flex items-center gap-4">
      <ThemeToggle />

      {/* Notifications */}
      <NotificationMenu />

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
  );
}
