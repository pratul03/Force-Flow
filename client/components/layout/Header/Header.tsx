"use client";

import { usePathname } from "next/navigation";
import { getRouteMeta } from "@/lib/config/navigation";
import { HeaderActions } from "./HeaderActions";

export function Header() {
  const pathname = usePathname();
  const { title } = getRouteMeta(pathname);

  return (
    <header className="sticky top-0 z-30 h-16 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="flex h-full items-center justify-between px-4 md:px-8">
        {/* Left side - Dynamic Title */}
        <div>
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        </div>

        {/* Right side - Actions and User menu */}
        <HeaderActions />
      </div>
    </header>
  );
}
