"use client";

import { Bell } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-4" />

      <div className="flex-1" />

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="relative size-9">
          <Bell className="size-4" />
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full p-0 text-[10px]"
          >
            3
          </Badge>
          <span className="sr-only">Notifications</span>
        </Button>

        <ThemeToggle />
      </div>
    </header>
  );
}
