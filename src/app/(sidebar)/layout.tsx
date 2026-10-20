import type { ReactNode } from "react";
import { cookies } from "next/headers";

import { AppSidebar } from "@/components/common/app-sidebar";
import { ModeToggle } from "@/components/common/mode-toggle";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

// Sidebar membaca cookie preferensi, jadi shell dashboard dirender dinamis.
export const instant = false;

export default async function DashboardLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur-sm md:h-16 md:px-4">
          <SidebarTrigger className="size-9 md:size-7" />
          <span aria-hidden="true" className="h-5 w-px bg-border" />
          <span className="font-heading text-sm font-semibold">Omsetku</span>
          <ModeToggle className="ml-auto size-9 md:size-7" />
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
