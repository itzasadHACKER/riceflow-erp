"use client";

import { useState } from "react";
import { Bell, Search } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "./theme-toggle";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { CommandMenu } from "@/components/shared/command-menu";

export function Header() {
  const [commandOpen, setCommandOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="h-4" />
        <Breadcrumbs />

        <div className="flex-1" />

        <Button
          variant="outline"
          className="hidden sm:flex items-center gap-2 text-muted-foreground h-8 w-64 justify-start text-sm font-normal"
          onClick={() => setCommandOpen(true)}
        >
          <Search className="size-3.5" />
          <span>Search...</span>
          <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="relative size-8">
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
      <CommandMenu open={commandOpen} onOpenChange={setCommandOpen} />
    </>
  );
}
